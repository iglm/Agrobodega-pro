import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Sparkles, Send, Mic, Camera, Globe, BrainCircuit, 
  Loader2, Play, Square, Volume2, Search, Link as LinkIcon,
  Bot, User, MessageSquare, AlertCircle, Zap
} from 'lucide-react';
import { AppState } from '../types';
import { askGemini, analyzeLeafOrInvoice, decodeBase64, decodeAudioData, encodeBase64 } from '../services/aiService';
import { Button } from './UIElements';
// Fix: Added LiveServerMessage to imports from @google/genai
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';

interface AIAssistantProps {
  data: AppState;
  onClose: () => void;
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
  grounding?: any[];
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ data, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const [useThinking, setUseThinking] = useState(false);
  
  // States para Audio Live
  const [isLive, setIsLive] = useState(false);
  const [liveStatus, setLiveStatus] = useState('Inactivo');
  const audioContextRef = useRef<AudioContext | null>(null);
  const liveSessionRef = useRef<any>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const result = await askGemini(input, data, useSearch, useThinking);
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: result.text || 'No pude generar una respuesta.',
        grounding: result.grounding,
        isThinking: useThinking
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: "Error de conexión con Gemini. Revisa tu API Key." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', text: `[Imagen adjunta: ${file.name}]` }]);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        const text = await analyzeLeafOrInvoice(base64, file.type, "Analiza esta imagen y relaciónala con la gestión de la finca.");
        setMessages(prev => [...prev, { role: 'model', text }]);
      } catch (err) {
        setMessages(prev => [...prev, { role: 'model', text: "Fallo al procesar la imagen." }]);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // --- LÓGICA GEMINI LIVE API ---
  const startLiveSession = async () => {
    try {
      setLiveStatus('Conectando...');
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const inputCtx = new AudioContext({ sampleRate: 16000 });
      const outputCtx = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setLiveStatus('Escuchando...');
            const source = inputCtx.createMediaStreamSource(stream);
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              const pcmBase64 = encodeBase64(new Uint8Array(int16.buffer));
              sessionPromise.then(s => s.sendRealtimeInput({ 
                media: { data: pcmBase64, mimeType: 'audio/pcm;rate=16000' } 
              }));
            };
            source.connect(processor);
            processor.connect(inputCtx.destination);
            liveSessionRef.current = { stream, inputCtx, processor };
          },
          onmessage: async (msg: LiveServerMessage) => {
            const audioBase64 = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioBase64) {
              const bytes = decodeBase64(audioBase64);
              const buffer = await decodeAudioData(bytes, outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputCtx.destination);
              
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }
          },
          onclose: () => stopLiveSession(),
          onerror: (e) => console.error("Live Error", e)
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: "Eres un asistente de voz para un agricultor. Sé breve, profesional y directo."
        }
      });

      setIsLive(true);
    } catch (err) {
      console.error(err);
      alert("No se pudo iniciar la sesión de voz. Revisa permisos de micrófono.");
    }
  };

  const stopLiveSession = () => {
    if (liveSessionRef.current) {
      liveSessionRef.current.stream.getTracks().forEach((t: any) => t.stop());
      liveSessionRef.current.inputCtx.close();
    }
    setIsLive(false);
    setLiveStatus('Inactivo');
  };

  return (
    <div className="fixed inset-0 z-[250] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-2 sm:p-6 animate-fade-in">
      <div className="bg-slate-900 w-full max-w-4xl h-[90vh] rounded-[3rem] border border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-slide-up">
        
        {/* Header */}
        <div className="p-6 bg-slate-950/50 border-b border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <div className="bg-emerald-600/20 p-3 rounded-2xl border border-emerald-500/30">
                    <Sparkles className="w-6 h-6 text-emerald-400 animate-pulse" />
                </div>
                <div>
                    <h3 className="text-white font-black text-xl uppercase tracking-tighter">Gemini Intelligence</h3>
                    <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Consultor Agrícola 360</p>
                </div>
            </div>
            <button onClick={onClose} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 transition-all">
                <X className="w-6 h-6" />
            </button>
        </div>

        {/* Live Audio Bar */}
        {isLive && (
            <div className="bg-emerald-900/20 border-b border-emerald-500/20 p-4 flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                        <div className="w-1 h-4 bg-emerald-500 rounded-full animate-bounce"></div>
                        <div className="w-1 h-6 bg-emerald-400 rounded-full animate-bounce delay-75"></div>
                        <div className="w-1 h-4 bg-emerald-500 rounded-full animate-bounce delay-150"></div>
                    </div>
                    <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">{liveStatus}</span>
                </div>
                <Button variant="danger" size="sm" onClick={stopLiveSession} icon={Square}>DETENER VOZ</Button>
            </div>
        )}

        {/* Chat Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-900/50">
            {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                    <Bot className="w-16 h-16 text-indigo-400" />
                    <div>
                        <p className="text-white font-black uppercase text-sm">¿En qué puedo apoyarte hoy?</p>
                        <p className="text-[10px] text-slate-400 uppercase mt-1">Analiza costos, predice cosechas o busca precios.</p>
                    </div>
                </div>
            )}
            
            {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-down`}>
                    <div className={`max-w-[85%] p-5 rounded-[2rem] shadow-xl space-y-3 ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'}`}>
                        <div className="flex items-center gap-2 mb-1">
                            {msg.role === 'user' ? <User className="w-3 h-3 opacity-50" /> : <Bot className="w-3 h-3 text-emerald-400" />}
                            <span className="text-[9px] font-black uppercase tracking-widest opacity-50">{msg.role === 'user' ? 'Tú' : 'Gemini Core'}</span>
                            {msg.isThinking && <span className="text-[8px] bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">THINKING MODE</span>}
                        </div>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{msg.text}</p>
                        
                        {msg.grounding && msg.grounding.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-slate-700 space-y-2">
                                <p className="text-[9px] font-black text-slate-500 uppercase flex items-center gap-1"><Globe className="w-3 h-3"/> Fuentes Verificadas:</p>
                                <div className="flex flex-wrap gap-2">
                                    {msg.grounding.map((chunk, i) => (
                                        chunk.web && (
                                            <a key={i} href={chunk.web.uri} target="_blank" rel="noreferrer" className="text-[9px] bg-slate-900 hover:bg-slate-950 px-2 py-1 rounded-lg border border-slate-700 text-indigo-400 flex items-center gap-1 transition-all">
                                                <LinkIcon className="w-2.5 h-2.5" /> {chunk.web.title || 'Ver fuente'}
                                            </a>
                                        )
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ))}
            {loading && (
                <div className="flex justify-start animate-pulse">
                    <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 flex items-center gap-3">
                        <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                        <span className="text-[10px] font-black text-slate-400 uppercase">Gemini está analizando...</span>
                    </div>
                </div>
            )}
        </div>

        {/* Controls Panel */}
        <div className="p-4 bg-slate-950/50 border-t border-slate-800 space-y-4">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                <button 
                    onClick={() => setUseSearch(!useSearch)} 
                    className={`shrink-0 px-4 py-2 rounded-xl text-[9px] font-black uppercase flex items-center gap-2 border transition-all ${useSearch ? 'bg-blue-600 border-blue-400 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
                >
                    <Search className="w-3.5 h-3.5" /> Búsqueda Google
                </button>
                <button 
                    onClick={() => setUseThinking(!useThinking)} 
                    className={`shrink-0 px-4 py-2 rounded-xl text-[9px] font-black uppercase flex items-center gap-2 border transition-all ${useThinking ? 'bg-purple-600 border-purple-400 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
                >
                    <BrainCircuit className="w-3.5 h-3.5" /> Pensamiento (3 Pro)
                </button>
                <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="shrink-0 px-4 py-2 rounded-xl text-[9px] font-black uppercase flex items-center gap-2 bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700"
                >
                    <Camera className="w-3.5 h-3.5" /> Analizar Foto
                </button>
                <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </div>

            <div className="flex gap-3 items-end">
                <button 
                    onClick={isLive ? stopLiveSession : startLiveSession}
                    className={`p-4 rounded-2xl shadow-xl transition-all active:scale-95 ${isLive ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}
                >
                    <Mic className="w-6 h-6" />
                </button>
                
                <div className="flex-1 bg-slate-900 border border-slate-700 rounded-3xl p-1 flex items-center shadow-inner">
                    <textarea 
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                        placeholder="Escribe tu consulta estratégica..."
                        className="flex-1 bg-transparent border-none outline-none text-white p-3 text-sm font-medium resize-none max-h-32"
                        rows={1}
                    />
                    <button 
                        onClick={handleSend}
                        disabled={!input.trim() || loading}
                        className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl transition-all disabled:opacity-30 m-1"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};
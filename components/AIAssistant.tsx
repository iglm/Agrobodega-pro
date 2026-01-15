
import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Sparkles, Send, Mic, Camera, Globe, BrainCircuit, 
  Loader2, Play, Square, Volume2, Search, Link as LinkIcon,
  Bot, User, MessageSquare, AlertCircle, Zap
} from 'lucide-react';
import { AppState } from '../types';
import { askGemini, analyzeLeafOrInvoice, decodeBase64, decodeAudioData, encodeBase64 } from '../services/aiService';
import { Button } from './UIElements';
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
    const currentInput = input;
    setInput('');
    setLoading(true);

    try {
      const result = await askGemini(currentInput, data, useSearch, useThinking);
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: result.text || 'No pude procesar la consulta.',
        grounding: result.grounding,
        isThinking: useThinking
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: "Error de conexión. Verifica tu API KEY." }]);
    } finally {
      setLoading(false);
    }
  };

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
              sessionPromise.then(s => s.sendRealtimeInput({ media: { data: pcmBase64, mimeType: 'audio/pcm;rate=16000' } }));
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
          systemInstruction: "Eres un consultor experto para un agrónomo. Sé profesional, directo y técnico."
        }
      });
      setIsLive(true);
    } catch (err) {
      alert("Error al iniciar voz. Revisa micrófonos.");
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
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 shadow-2xl">
        {/* Header IA */}
        <div className="p-6 bg-slate-950 border-b border-slate-800 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-4">
                <div className="bg-purple-600/20 p-2.5 rounded-2xl border border-purple-500/30">
                    <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                </div>
                <div>
                    <h3 className="text-white font-black text-sm uppercase tracking-widest leading-none">Gemini 3.0 Core</h3>
                    <p className="text-[9px] text-purple-500 font-bold uppercase tracking-widest mt-1">Soporte Estratégico Online</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 transition-all">
                <X className="w-5 h-5" />
            </button>
        </div>

        {/* Live Audio Monitor */}
        {isLive && (
            <div className="bg-purple-900/10 border-b border-purple-500/20 p-4 flex items-center justify-between animate-pulse shrink-0">
                <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                        <div className="w-1 h-3 bg-purple-500 rounded-full animate-bounce"></div>
                        <div className="w-1 h-5 bg-purple-400 rounded-full animate-bounce delay-75"></div>
                        <div className="w-1 h-3 bg-purple-500 rounded-full animate-bounce delay-150"></div>
                    </div>
                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">{liveStatus}</span>
                </div>
                <button onClick={stopLiveSession} className="bg-red-600/20 text-red-400 text-[9px] font-black px-3 py-1 rounded-lg border border-red-500/30 uppercase">Detener Voz</button>
            </div>
        )}

        {/* Chat Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-900/30">
            {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                    <BrainCircuit className="w-12 h-12 text-slate-400" />
                    <div>
                        <p className="text-white font-black uppercase text-[10px] tracking-widest">¿En qué puedo asistirte hoy?</p>
                        <p className="text-[9px] text-slate-500 uppercase mt-1">Analiza el PH de tus suelos, predice cosechas o<br/>optimiza tus costos de fertilización.</p>
                    </div>
                </div>
            )}
            
            {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-down`}>
                    <div className={`max-w-[90%] p-4 rounded-3xl shadow-lg space-y-3 ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'}`}>
                        <div className="flex items-center gap-2 mb-1">
                            {msg.role === 'user' ? <User className="w-3 h-3 opacity-50" /> : <Bot className="w-3 h-3 text-purple-400" />}
                            <span className="text-[8px] font-black uppercase tracking-widest opacity-50">{msg.role === 'user' ? 'Administrador' : 'Gemini AI'}</span>
                            {msg.isThinking && <span className="text-[8px] bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30 font-black uppercase">Thinking</span>}
                        </div>
                        <p className="text-xs leading-relaxed whitespace-pre-wrap font-medium">{msg.text}</p>
                        
                        {msg.grounding && msg.grounding.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-slate-700 space-y-2">
                                <p className="text-[8px] font-black text-slate-500 uppercase flex items-center gap-1"><Globe className="w-3 h-3"/> Fuentes Google Search:</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {msg.grounding.map((chunk, i) => chunk.web && (
                                        <a key={i} href={chunk.web.uri} target="_blank" rel="noreferrer" className="text-[8px] bg-slate-900 hover:bg-black px-2 py-1 rounded-lg border border-slate-700 text-indigo-400 flex items-center gap-1 transition-all">
                                            <LinkIcon className="w-2 h-2" /> {chunk.web.title}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ))}
            {loading && (
                <div className="flex justify-start animate-pulse">
                    <div className="bg-slate-800 p-4 rounded-3xl border border-slate-700 flex items-center gap-3">
                        <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Consultando Core de Datos...</span>
                    </div>
                </div>
            )}
        </div>

        {/* Input Controls */}
        <div className="p-6 bg-slate-950 border-t border-slate-800 space-y-4 shrink-0">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                <button 
                    onClick={() => setUseSearch(!useSearch)} 
                    className={`shrink-0 px-3 py-1.5 rounded-xl text-[8px] font-black uppercase flex items-center gap-1.5 border transition-all ${useSearch ? 'bg-blue-600 border-blue-400 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
                >
                    <Search className="w-3 h-3" /> Search Grounding
                </button>
                <button 
                    onClick={() => setUseThinking(!useThinking)} 
                    className={`shrink-0 px-3 py-1.5 rounded-xl text-[8px] font-black uppercase flex items-center gap-1.5 border transition-all ${useThinking ? 'bg-purple-600 border-purple-400 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
                >
                    <BrainCircuit className="w-3 h-3" /> Deep Thinking
                </button>
            </div>

            <div className="flex gap-3 items-end">
                <button 
                    onClick={isLive ? stopLiveSession : startLiveSession}
                    className={`p-3 rounded-2xl shadow-xl transition-all active:scale-95 border-2 ${isLive ? 'bg-red-600 border-red-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'}`}
                >
                    <Mic className="w-5 h-5" />
                </button>
                
                <div className="flex-1 bg-slate-900 border border-slate-700 rounded-3xl p-1 flex items-center shadow-inner group-focus-within:border-purple-500/50 transition-colors">
                    <textarea 
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                        placeholder="Escribe tu consulta o usa voz..."
                        className="flex-1 bg-transparent border-none outline-none text-white p-3 text-xs font-bold resize-none max-h-32 min-h-[44px]"
                        rows={1}
                    />
                    <button 
                        onClick={handleSend}
                        disabled={!input.trim() || loading}
                        className="p-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl transition-all disabled:opacity-20 m-1 shadow-lg active:scale-90"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};


import { GoogleGenAI, Modality, Type, LiveServerMessage } from "@google/genai";
import { AppState } from "../types";

// Inicialización del cliente según guidelines
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Genera un resumen del contexto de la finca para que la IA entienda el negocio.
 */
const getFincaContext = (data: AppState) => {
  return `
    Contexto de la Finca:
    - Lotes totales: ${data.costCenters.length}
    - Área total: ${data.costCenters.reduce((sum, c) => sum + c.area, 0)} Ha
    - Personal: ${data.personnel.length} personas
    - Valor en Bodega: ${data.inventory.reduce((sum, i) => sum + (i.currentQuantity * i.averageCost), 0)} COP
    - Eventos en Agenda: ${data.agenda.filter(a => !a.completed).length} pendientes.
    Usuario actual: ${data.warehouses[0]?.ownerId || 'Administrador'}.
  `;
};

/**
 * Chat con Pensamiento Crítico y Búsqueda
 */
export const askGemini = async (prompt: string, data: AppState, useSearch = false, useThinking = false) => {
  const ai = getAI();
  const context = getFincaContext(data);
  
  const config: any = {
    systemInstruction: `Eres un consultor experto en agronomía y finanzas agrícolas. 
    Analiza los datos de la finca del usuario y responde de forma estratégica. 
    ${context}`,
  };

  if (useSearch) {
    config.tools = [{ googleSearch: {} }];
  }

  if (useThinking) {
    config.thinkingConfig = { thinkingBudget: 32768 };
  }

  const response = await ai.models.generateContent({
    model: useThinking ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview',
    contents: prompt,
    config
  });

  return {
    text: response.text,
    grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};

/**
 * Análisis de Imágenes (Visión)
 */
export const analyzeLeafOrInvoice = async (base64Image: string, mimeType: string, prompt: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType } },
        { text: prompt || "Analiza esta imagen agrícola (hoja, factura o maquinaria) y describe hallazgos." }
      ]
    }
  });
  return response.text;
};

/**
 * Transcripción de Audio
 */
export const transcribeAudio = async (base64Audio: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Audio, mimeType: 'audio/wav' } },
        { text: "Transcribe exactamente lo que se dice en este audio de campo." }
      ]
    }
  });
  return response.text;
};

/**
 * Helpers para Audio PCM (Requeridos por Live API)
 */
export const decodeBase64 = (base64: string) => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

export const encodeBase64 = (bytes: Uint8Array) => {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

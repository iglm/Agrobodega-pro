
import { saveBlob, getBlob, deleteBlob } from './mediaDb';
import { compressImage } from './imageService';

// Helper auxiliar para convertir el DataURL (resultado de compressImage) a Blob
const dataURLtoBlob = (dataurl: string): Blob => {
  const arr = dataurl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while(n--){
      u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], {type:mime});
};

export const storageAdapter = {
  /**
   * Procesa, comprime y guarda una imagen en IndexedDB retornando un UUID.
   */
  saveImage: async (file: File): Promise<string> => {
    try {
      // a) Comprimimos la imagen para optimizar espacio (retorna DataURL string)
      const compressedDataUrl = await compressImage(file);
      
      // b) Convertimos el resultado a Blob binario
      const blob = dataURLtoBlob(compressedDataUrl);
      
      // c) Generamos un UUID único
      const id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' 
        ? crypto.randomUUID() 
        : Date.now().toString(36) + Math.random().toString(36).substring(2);

      // d) Guardamos el Blob en mediaDb
      await saveBlob(id, blob);
      
      // e) Retornamos el UUID
      return id;
    } catch (error) {
      console.error("Error guardando imagen en storageAdapter:", error);
      throw error;
    }
  },

  /**
   * Resuelve la fuente de la imagen (src) dinámicamente.
   * Maneja tanto IDs de IndexedDB como strings Base64 antiguos.
   */
  resolveImageSource: async (imageKey: string | undefined): Promise<string> => {
    if (!imageKey) return '';

    // a) Soporte Legacy: Si empieza por data:image o http, es una imagen antigua o externa
    if (imageKey.startsWith('data:image') || imageKey.startsWith('http')) {
      return imageKey;
    }

    // b) Si no, asumimos que es un UUID y buscamos en IndexedDB
    try {
      const blob = await getBlob(imageKey);
      
      // c) Si encontramos el blob, creamos una URL temporal
      if (blob) {
        return URL.createObjectURL(blob);
      }
    } catch (error) {
      console.warn(`No se pudo resolver la imagen con key: ${imageKey}`, error);
    }

    // d) Si falla, retorna string vacío (la UI mostrará placeholder)
    return '';
  },

  /**
   * Elimina la imagen de la base de datos si es un UUID.
   */
  removeImage: async (imageKey: string): Promise<void> => {
    if (!imageKey || imageKey.startsWith('data:image') || imageKey.startsWith('http')) return;
    try {
        await deleteBlob(imageKey);
    } catch (e) {
        console.error("Error eliminando imagen:", e);
    }
  }
};

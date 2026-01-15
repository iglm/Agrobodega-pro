
/**
 * Utility to compress images aggressively for LocalStorage.
 * Target: Keep images under 50KB to maximize the 5MB limit.
 */
export const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400; // Sufficient for Gemini Vision and human preview
        const MAX_HEIGHT = 400;
        
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject('Could not get canvas context');
          return;
        }
        
        // Use high-quality interpolation but low-quality JPEG for size
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        // 0.5 quality is the sweet spot for Gemini OCR and Storage
        const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
        resolve(dataUrl);
      };
      
      img.onerror = (err) => reject(err);
    };
    
    reader.onerror = (err) => reject(err);
  });
};

/**
 * Calculates current LocalStorage usage in MB.
 */
export const getStorageUsage = (): { used: number, percent: number } => {
    let total = 0;
    for (let x in localStorage) {
        if (Object.prototype.hasOwnProperty.call(localStorage, x)) {
            total += (localStorage[x].length * 2);
        }
    }
    const usedMB = total / 1024 / 1024;
    const limitMB = 5; // Standard LocalStorage limit
    return {
        used: usedMB,
        percent: Math.min((usedMB / limitMB) * 100, 100)
    };
};

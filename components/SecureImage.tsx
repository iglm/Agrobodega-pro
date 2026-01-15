
import React, { useState, useEffect } from 'react';
import { storageAdapter } from '../services/storageAdapter';
import { Loader2, Image as ImageIcon } from 'lucide-react';

interface SecureImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string | undefined;
  fallback?: React.ReactNode;
}

export const SecureImage: React.FC<SecureImageProps> = ({ src, alt, className, fallback, ...props }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    let objectUrl: string | null = null;

    const resolveImage = async () => {
      setIsLoading(true);
      
      if (!src) {
        if (isMounted) {
          setImageSrc(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const url = await storageAdapter.resolveImageSource(src);
        
        if (isMounted) {
          if (url) {
            setImageSrc(url);
            // Solo registramos para limpieza si es una URL de Blob creada localmente
            // (No revocamos data:image o http urls)
            if (url.startsWith('blob:')) {
              objectUrl = url;
            }
          } else {
            setImageSrc(null);
          }
          setIsLoading(false);
        } else {
          // Si el componente se desmontó durante la resolución, limpiamos inmediatamente si se creó un blob
          if (url && url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
          }
        }
      } catch (error) {
        console.error("Error resolving secure image:", error);
        if (isMounted) {
          setImageSrc(null);
          setIsLoading(false);
        }
      }
    };

    resolveImage();

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-slate-200 dark:bg-slate-800 animate-pulse ${className}`} role="status">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
        <span className="sr-only">Cargando imagen...</span>
      </div>
    );
  }

  if (!imageSrc) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className={`flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-300 border border-slate-200 dark:border-slate-700 ${className}`}>
        <ImageIcon className="w-1/3 h-1/3 min-w-[24px] min-h-[24px]" />
      </div>
    );
  }

  return <img src={imageSrc} alt={alt || "Imagen"} className={className} {...props} />;
};

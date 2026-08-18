'use client';

import React, { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, UploadCloud, Loader2 } from 'lucide-react';
import { compressImage } from '@/lib/utils';
import { CameraModal } from './CameraModal';

interface PhotoUploaderProps {
  onUploadPhotos: (files: { blob: Blob; filename?: string; caption?: string }[]) => Promise<void>;
  disabled?: boolean;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  onUploadPhotos,
  disabled = false,
}) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle single camera capture
  const handleCameraCapture = async (blob: Blob, caption?: string) => {
    try {
      setIsUploading(true);
      setUploadProgress('Subiendo foto...');
      await onUploadPhotos([
        {
          blob,
          filename: `camera-${Date.now()}.jpg`,
          caption,
        },
      ]);
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  // Handle gallery / file selection (supports multi-upload)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);
      const total = files.length;
      const preparedFiles: { blob: Blob; filename: string }[] = [];

      for (let i = 0; i < total; i++) {
        const file = files[i];
        setUploadProgress(`Procesando imagen ${i + 1} de ${total}...`);
        const compressed = await compressImage(file, 2000, 0.88);
        preparedFiles.push({
          blob: compressed,
          filename: file.name.replace(/\.[^/.]+$/, '') + '.jpg',
        });
      }

      setUploadProgress(`Subiendo ${total} foto${total > 1 ? 's' : ''}...`);
      await onUploadPhotos(preparedFiles);
    } catch (err) {
      console.error('Error al procesar archivos de galería:', err);
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Main Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Instant Camera Trigger */}
        <button
          type="button"
          onClick={() => setIsCameraOpen(true)}
          disabled={disabled || isUploading}
          className="w-full sm:flex-1 py-4 px-6 rounded-2xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-semibold text-base flex items-center justify-center gap-3 shadow-lg shadow-stone-900/10 dark:shadow-stone-100/5 hover:bg-stone-800 dark:hover:bg-stone-200 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-white/20 dark:bg-stone-900/20 flex items-center justify-center group-hover:rotate-12 transition-transform">
            <Camera className="w-5 h-5" />
          </div>
          <span>Hacer Foto Ahora</span>
        </button>

        {/* Gallery picker trigger */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="w-full sm:flex-1 py-4 px-6 rounded-2xl bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-800 font-medium text-base flex items-center justify-center gap-3 shadow-sm hover:bg-stone-50 dark:hover:bg-stone-850 hover:border-stone-300 dark:hover:border-stone-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-600 dark:text-stone-400 group-hover:scale-110 transition-transform">
            <ImageIcon className="w-4 h-4" />
          </div>
          <span>Subir de Galería</span>
        </button>
      </div>

      {/* Upload Progress feedback */}
      {isUploading && (
        <div className="mt-4 p-3 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center justify-center gap-3 text-xs sm:text-sm font-medium text-stone-700 dark:text-stone-300 animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin text-stone-900 dark:text-stone-100" />
          <span>{uploadProgress || 'Subiendo fotos...'}</span>
        </div>
      )}

      {/* Camera Fullscreen Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onPhotoCaptured={handleCameraCapture}
      />
    </div>
  );
};

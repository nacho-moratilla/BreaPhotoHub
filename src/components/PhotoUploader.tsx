'use client';

import React, { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Loader2, X, Check, RotateCcw, ArrowLeft } from 'lucide-react';
import { compressImage } from '@/lib/utils';

interface PhotoUploaderProps {
  onUploadPhotos: (files: { blob: Blob; filename?: string; caption?: string }[]) => Promise<void>;
  disabled?: boolean;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  onUploadPhotos,
  disabled = false,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  
  // Preview modal state after snapping with native camera
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [caption, setCaption] = useState('');

  // Refs for native camera and gallery inputs
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Triggered directly when clicking "Hacer Foto Ahora"
  const handleOpenNativeCamera = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
      cameraInputRef.current.click();
    }
  };

  // When photo is snapped using native phone camera app
  const handleNativeCameraCaptured = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadProgress('Procesando foto...');
      const compressed = await compressImage(file, 2048, 0.90);
      const url = URL.createObjectURL(compressed);
      setPreviewBlob(compressed);
      setPreviewPhotoUrl(url);
      setCaption('');
    } catch (err) {
      console.error('Error al procesar la foto de la cámara:', err);
    } finally {
      setUploadProgress(null);
    }
  };

  // Close preview & discard
  const handleDiscardPreview = () => {
    if (previewPhotoUrl) {
      URL.revokeObjectURL(previewPhotoUrl);
    }
    setPreviewPhotoUrl(null);
    setPreviewBlob(null);
    setCaption('');
  };

  // Retake photo (re-triggers native camera)
  const handleRetake = () => {
    handleDiscardPreview();
    setTimeout(() => {
      handleOpenNativeCamera();
    }, 150);
  };

  // Confirm and upload photo
  const handleConfirmUpload = async () => {
    if (!previewBlob) return;
    try {
      setIsUploading(true);
      setUploadProgress('Subiendo foto al álbum...');
      await onUploadPhotos([
        {
          blob: previewBlob,
          filename: `camera-${Date.now()}.jpg`,
          caption: caption.trim() || undefined,
        },
      ]);
      handleDiscardPreview();
    } catch (err) {
      console.error('Error subiendo foto:', err);
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  // Handle gallery / file selection (supports multi-upload)
  const handleGalleryChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);
      const total = files.length;
      const preparedFiles: { blob: Blob; filename: string }[] = [];

      for (let i = 0; i < total; i++) {
        const file = files[i];
        setUploadProgress(`Procesando imagen ${i + 1} de ${total}...`);
        const compressed = await compressImage(file, 2048, 0.90);
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
      if (galleryInputRef.current) {
        galleryInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Native Camera input (directly launches device camera app) */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleNativeCameraCaptured}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Gallery file picker input */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleGalleryChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Main Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Instant Native Camera Trigger */}
        <button
          type="button"
          onClick={handleOpenNativeCamera}
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
          onClick={() => galleryInputRef.current?.click()}
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
        <div className="mt-4 p-3.5 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center justify-center gap-3 text-xs sm:text-sm font-medium text-stone-700 dark:text-stone-300 animate-pulse shadow-sm">
          <Loader2 className="w-4 h-4 animate-spin text-stone-900 dark:text-stone-100" />
          <span>{uploadProgress || 'Subiendo fotos...'}</span>
        </div>
      )}

      {/* Photo Preview & Confirmation Modal after taking a photo with Native Camera */}
      {previewPhotoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 sm:bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-fade-in">
          <div className="relative w-full h-full sm:max-w-lg sm:h-[88vh] sm:max-h-[750px] bg-stone-950 sm:rounded-3xl overflow-hidden flex flex-col justify-between border border-stone-800 shadow-2xl">
            
            {/* Top Bar with back button */}
            <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-3.5 sm:p-4 bg-gradient-to-b from-black/85 via-black/40 to-transparent">
              <button
                type="button"
                onClick={handleDiscardPreview}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-900/85 hover:bg-stone-800 text-stone-200 hover:text-white text-xs sm:text-sm font-medium transition border border-stone-800 backdrop-blur-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver</span>
              </button>

              <div className="flex items-center gap-2 text-white/90 text-xs sm:text-sm font-medium bg-black/40 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Vista Previa</span>
              </div>

              <button
                type="button"
                onClick={handleDiscardPreview}
                className="p-2 rounded-full bg-stone-900/85 text-white/80 hover:text-white hover:bg-stone-800 transition-colors border border-stone-800 backdrop-blur-sm"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Photo Viewport */}
            <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden p-2 sm:p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewPhotoUrl}
                alt="Foto tomada"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>

            {/* Bottom Controls */}
            <div className="relative z-20 p-4 sm:p-5 bg-gradient-to-t from-black via-black/90 to-transparent flex flex-col gap-3">
              <input
                type="text"
                placeholder="Añade un comentario (opcional)..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={100}
                className="w-full px-4 py-2.5 bg-stone-900/90 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-500 text-sm focus:outline-none focus:border-stone-600 transition"
              />

              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={handleDiscardPreview}
                  disabled={isUploading}
                  className="py-3 px-3.5 rounded-xl bg-stone-900/80 text-stone-400 hover:text-white hover:bg-stone-800 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 border border-stone-800 transition disabled:opacity-50"
                  title="Cancelar y volver al álbum"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Volver</span>
                </button>

                <button
                  type="button"
                  onClick={handleRetake}
                  disabled={isUploading}
                  className="flex-1 py-3 px-3 rounded-xl bg-stone-900 text-stone-300 hover:text-white hover:bg-stone-800 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 border border-stone-800 transition disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Repetir Foto</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirmUpload}
                  disabled={isUploading}
                  className="flex-1 py-3 px-3.5 rounded-xl bg-white text-stone-950 hover:bg-stone-200 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 shadow-lg transition disabled:opacity-50 cursor-pointer"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-stone-950" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>{isUploading ? 'Subiendo...' : 'Publicar Foto'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

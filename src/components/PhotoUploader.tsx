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

    // Strict validation: Reject videos
    if (!file.type.startsWith('image/') || file.type.startsWith('video/')) {
      alert('Solo se permite subir fotografías. Los archivos de vídeo no están permitidos.');
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      return;
    }

    try {
      setUploadProgress('Procesando foto en máxima calidad...');
      // Preserve full native camera resolution and HDR details
      let finalBlob: Blob = file;
      if (file.size > 16 * 1024 * 1024) {
        finalBlob = await compressImage(file, 4096, 0.95);
      }
      const url = URL.createObjectURL(finalBlob);
      setPreviewBlob(finalBlob);
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
      setUploadProgress('Subiendo foto en calidad original...');
      await onUploadPhotos([
        {
          blob: previewBlob,
          filename: `comuna-${Date.now()}.jpg`,
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

  // Handle gallery / file selection (supports multi-upload, image-only)
  const handleGalleryChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = e.target.files;
    if (!rawFiles || rawFiles.length === 0) return;

    // Filter strictly for image files only
    const imageFiles = Array.from(rawFiles).filter(
      (f) => f.type.startsWith('image/') && !f.type.startsWith('video/')
    );

    if (imageFiles.length === 0) {
      alert('No has seleccionado ninguna imagen válida. Los vídeos no están permitidos.');
      if (galleryInputRef.current) galleryInputRef.current.value = '';
      return;
    }

    if (imageFiles.length < rawFiles.length) {
      alert('Se han descartado los archivos de vídeo seleccionados. Solo se subirán las fotos.');
    }

    try {
      setIsUploading(true);
      const total = imageFiles.length;
      const preparedFiles: { blob: Blob; filename: string }[] = [];

      for (let i = 0; i < total; i++) {
        const file = imageFiles[i];
        setUploadProgress(`Preparando foto ${i + 1} de ${total} (Máxima Calidad)...`);
        let finalBlob: Blob = file;
        if (file.size > 16 * 1024 * 1024) {
          finalBlob = await compressImage(file, 4096, 0.95);
        }
        preparedFiles.push({
          blob: finalBlob,
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
      {/* Native Camera input (strictly captures photo mode only) */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/jpg"
        capture="environment"
        onChange={handleNativeCameraCaptured}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Gallery file picker input (strictly accepts images only) */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/jpg"
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
          className="w-full sm:flex-1 py-4 px-6 rounded-2xl bg-[#52b788] hover:bg-[#74c69d] text-[#070f0b] font-bold text-base flex items-center justify-center gap-3 shadow-glow hover:scale-105 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-[#070f0b]/20 flex items-center justify-center group-hover:rotate-12 transition-transform">
            <Camera className="w-5 h-5" />
          </div>
          <span>Hacer Foto Ahora</span>
        </button>

        {/* Gallery picker trigger */}
        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="w-full sm:flex-1 py-4 px-6 rounded-2xl bg-[#0d1b14] text-[#f8f9fa] border border-[#52b788]/30 font-semibold text-base flex items-center justify-center gap-3 shadow-sm hover:border-[#52b788]/60 hover:bg-[#1b4332]/40 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-[#1b4332]/60 border border-[#52b788]/20 flex items-center justify-center text-[#52b788] group-hover:scale-110 transition-transform">
            <ImageIcon className="w-4 h-4" />
          </div>
          <span>Subir de Galería</span>
        </button>
      </div>

      {/* Upload Progress feedback */}
      {isUploading && (
        <div className="mt-4 p-3.5 rounded-xl bg-[#0d1b14] border border-[#52b788]/30 flex items-center justify-center gap-3 text-xs sm:text-sm font-semibold text-[#52b788] animate-pulse shadow-sm">
          <Loader2 className="w-4 h-4 animate-spin text-[#52b788]" />
          <span>{uploadProgress || 'Subiendo fotos...'}</span>
        </div>
      )}

      {/* Photo Preview & Confirmation Modal after taking a photo with Native Camera */}
      {previewPhotoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 sm:bg-black/85 backdrop-blur-md p-0 sm:p-4 animate-fade-in">
          <div className="relative w-full h-full sm:max-w-lg sm:h-[88vh] sm:max-h-[750px] bg-[#070f0b] sm:rounded-3xl overflow-hidden flex flex-col justify-between border border-[#52b788]/30 shadow-2xl">
            
            {/* Top Bar with back button */}
            <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-3.5 sm:p-4 bg-gradient-to-b from-[#070f0b]/90 via-[#070f0b]/50 to-transparent">
              <button
                type="button"
                onClick={handleDiscardPreview}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0d1b14] hover:bg-[#1b4332] text-[#b7c4bb] hover:text-white text-xs sm:text-sm font-semibold transition border border-[#52b788]/30 backdrop-blur-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver</span>
              </button>

              <div className="flex items-center gap-2 text-[#f8f9fa] text-xs sm:text-sm font-bold bg-[#0d1b14]/80 px-3.5 py-1 rounded-full border border-[#52b788]/40 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-[#52b788] animate-pulse" />
                <span>Vista Previa</span>
              </div>

              <button
                type="button"
                onClick={handleDiscardPreview}
                className="p-2 rounded-full bg-[#0d1b14] text-[#b7c4bb] hover:text-white hover:bg-[#1b4332] transition-colors border border-[#52b788]/30 backdrop-blur-sm"
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
            <div className="relative z-20 p-4 sm:p-5 bg-gradient-to-t from-[#070f0b] via-[#070f0b]/95 to-transparent flex flex-col gap-3">
              <input
                type="text"
                placeholder="Añade un comentario a la foto..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={100}
                className="w-full px-4 py-2.5 bg-[#0d1b14] border border-[#52b788]/30 rounded-xl text-[#f8f9fa] placeholder-[#b7c4bb]/50 text-sm focus:outline-none focus:border-[#52b788] transition font-sans"
              />

              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={handleDiscardPreview}
                  disabled={isUploading}
                  className="py-3 px-3.5 rounded-xl bg-[#0d1b14] text-[#b7c4bb] hover:text-white hover:bg-[#1b4332] text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 border border-[#52b788]/30 transition disabled:opacity-50"
                  title="Cancelar y volver al álbum"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Volver</span>
                </button>

                <button
                  type="button"
                  onClick={handleRetake}
                  disabled={isUploading}
                  className="flex-1 py-3 px-3 rounded-xl bg-[#0d1b14] text-[#f8f9fa] hover:bg-[#1b4332] text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 border border-[#52b788]/30 transition disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4 text-[#ffb703]" />
                  <span>Repetir Foto</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirmUpload}
                  disabled={isUploading}
                  className="flex-1 py-3 px-3.5 rounded-xl bg-[#52b788] text-[#070f0b] hover:bg-[#74c69d] text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 shadow-glow transition disabled:opacity-50 cursor-pointer"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#070f0b]" />
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

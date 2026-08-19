'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, X, Check, RotateCcw, ImagePlus, AlertCircle, ArrowLeft } from 'lucide-react';
import { compressImage } from '@/lib/utils';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoCaptured: (blob: Blob, caption?: string) => Promise<void>;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onPhotoCaptured,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isInitializing, setIsInitializing] = useState(true);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [caption, setCaption] = useState('');
  const [isShutterActive, setIsShutterActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Stop media stream tracks cleanly without triggering re-renders
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Error parando track de cámara:', e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Initialize and attach camera stream
  const startCamera = useCallback(async (mode: 'environment' | 'user') => {
    stopStream();
    setIsInitializing(true);
    setCameraError(null);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Tu navegador no permite acceso directo a la cámara web.');
      setIsInitializing(false);
      return;
    }

    try {
      // Check available cameras
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === 'videoinput');
        setHasMultipleCameras(videoDevices.length > 1);
      } catch (devErr) {
        console.warn('No se pudieron enumerar dispositivos:', devErr);
      }

      let mediaStream: MediaStream;

      try {
        // Attempt 1: Request facing mode
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
          },
          audio: false,
        });
      } catch (err1) {
        console.warn('Fallo intento 1, probando cámara básica:', err1);
        // Attempt 2: Request basic video
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = mediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('webkit-playsinline', 'true');
        videoRef.current.muted = true;
        
        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current?.play();
          } catch (playErr) {
            console.warn('Error al reproducir video feed:', playErr);
          }
        };
      }
    } catch (err: any) {
      console.error('Error al inicializar cámara:', err);
      let message = 'No se pudo acceder a la cámara en vivo.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = 'Permiso denegado. Permite el acceso a la cámara o usa la cámara nativa abajo.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        message = 'La cámara está ocupada por otra app (WhatsApp, Instagram, etc.).';
      }
      setCameraError(message);
    } finally {
      setIsInitializing(false);
    }
  }, [stopStream]);

  // Open/Close effect
  useEffect(() => {
    if (isOpen && !capturedPhotoUrl) {
      startCamera(facingMode);
    } else {
      stopStream();
    }

    return () => {
      stopStream();
    };
  }, [isOpen, facingMode, startCamera, stopStream, capturedPhotoUrl]);

  // Switch facing mode
  const handleFlipCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
  };

  // Capture frame from video
  const takePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (facingMode === 'user') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, width, height);

    // Shutter flash animation
    setIsShutterActive(true);
    setTimeout(() => setIsShutterActive(false), 300);

    canvas.toBlob(async (blob) => {
      if (blob) {
        const compressed = await compressImage(blob, 1920, 0.88);
        const previewUrl = URL.createObjectURL(compressed);
        setCapturedBlob(compressed);
        setCapturedPhotoUrl(previewUrl);
        stopStream();
      }
    }, 'image/jpeg', 0.95);
  };

  // Handle native camera file capture fallback
  const handleNativeCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsInitializing(true);
      const compressed = await compressImage(file, 1920, 0.88);
      const previewUrl = URL.createObjectURL(compressed);
      setCapturedBlob(compressed);
      setCapturedPhotoUrl(previewUrl);
      stopStream();
    } catch (err) {
      console.error('Error procesando foto nativa:', err);
    } finally {
      setIsInitializing(false);
      if (nativeCameraInputRef.current) {
        nativeCameraInputRef.current.value = '';
      }
    }
  };

  // Retake
  const handleRetake = () => {
    if (capturedPhotoUrl) {
      URL.revokeObjectURL(capturedPhotoUrl);
    }
    setCapturedPhotoUrl(null);
    setCapturedBlob(null);
    setCaption('');
  };

  // Upload
  const handleConfirmUpload = async () => {
    if (!capturedBlob) return;
    try {
      setIsUploading(true);
      await onPhotoCaptured(capturedBlob, caption.trim() || undefined);
      handleRetake();
      onClose();
    } catch (err) {
      console.error('Error al subir foto:', err);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 sm:bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-fade-in">
      {/* Hidden native mobile camera input */}
      <input
        ref={nativeCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleNativeCameraCapture}
        className="hidden"
      />

      <div className="relative w-full h-full sm:max-w-lg sm:h-[88vh] sm:max-h-[750px] bg-stone-950 sm:rounded-3xl overflow-hidden flex flex-col justify-between border border-stone-800 shadow-2xl">
        
        {/* Top bar with back button */}
        <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-3.5 sm:p-4 bg-gradient-to-b from-black/85 via-black/40 to-transparent">
          {/* Back button */}
          <button
            type="button"
            onClick={() => {
              handleRetake();
              stopStream();
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-900/85 hover:bg-stone-800 text-stone-200 hover:text-white text-xs sm:text-sm font-medium transition border border-stone-800 backdrop-blur-sm"
            aria-label="Volver al álbum"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>

          {/* Status Indicator */}
          <div className="flex items-center gap-2 text-white/90 text-xs sm:text-sm font-medium bg-black/40 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>{capturedPhotoUrl ? 'Vista Previa' : 'Cámara en Vivo'}</span>
          </div>

          {/* Close X button */}
          <button
            type="button"
            onClick={() => {
              handleRetake();
              stopStream();
              onClose();
            }}
            className="p-2 rounded-full bg-stone-900/85 text-white/80 hover:text-white hover:bg-stone-800 transition-colors border border-stone-800 backdrop-blur-sm"
            title="Cerrar cámara"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Viewport Area */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
          {cameraError ? (
            /* Error & Native Camera Fallback Screen */
            <div className="p-6 text-center text-stone-300 max-w-sm flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-sm text-stone-300 leading-relaxed">{cameraError}</p>

              <div className="flex flex-col w-full gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => nativeCameraInputRef.current?.click()}
                  className="w-full py-3.5 px-4 bg-white text-stone-950 font-semibold text-sm rounded-xl hover:bg-stone-200 transition flex items-center justify-center gap-2 shadow-lg"
                >
                  <Camera className="w-4 h-4" />
                  <span>Abrir Cámara del Móvil</span>
                </button>

                <button
                  type="button"
                  onClick={() => startCamera(facingMode)}
                  className="w-full py-2.5 px-4 bg-stone-900 text-stone-300 text-xs font-medium rounded-xl hover:bg-stone-800 transition border border-stone-800"
                >
                  Reintentar Cámara en Web
                </button>
              </div>
            </div>
          ) : capturedPhotoUrl ? (
            /* Preview of captured photo */
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={capturedPhotoUrl}
                alt="Foto capturada"
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            /* Live Camera Stream */
            <div className="relative w-full h-full flex items-center justify-center">
              {isInitializing && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 gap-2 text-stone-400 text-xs">
                  <RefreshCw className="w-6 h-6 animate-spin text-white" />
                  <span>Iniciando cámara...</span>
                </div>
              )}

              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className={`w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
              />

              {/* Viewfinder Frame UI */}
              <div className="viewfinder-corner viewfinder-corner-tl" />
              <div className="viewfinder-corner viewfinder-corner-tr" />
              <div className="viewfinder-corner viewfinder-corner-bl" />
              <div className="viewfinder-corner viewfinder-corner-br" />

              {/* Hidden Canvas for capture processing */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Shutter flash effect */}
              <div className={`shutter-flash-overlay ${isShutterActive ? 'active' : ''}`} />
            </div>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="relative z-20 p-5 bg-gradient-to-t from-black via-black/90 to-transparent flex flex-col gap-4">
          {capturedPhotoUrl ? (
            /* Confirmation controls */
            <div className="space-y-3">
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
                  onClick={() => {
                    handleRetake();
                    stopStream();
                    onClose();
                  }}
                  disabled={isUploading}
                  className="py-3 px-3.5 rounded-xl bg-stone-900/80 text-stone-400 hover:text-white hover:bg-stone-800 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 border border-stone-800 transition disabled:opacity-50"
                  title="Cancelar y volver al álbum"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden xs:inline">Volver</span>
                </button>
                
                <button
                  type="button"
                  onClick={handleRetake}
                  disabled={isUploading}
                  className="flex-1 py-3 px-3 rounded-xl bg-stone-900 text-stone-300 hover:text-white hover:bg-stone-800 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 border border-stone-800 transition disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Repetir</span>
                </button>
                
                <button
                  type="button"
                  onClick={handleConfirmUpload}
                  disabled={isUploading}
                  className="flex-1 py-3 px-3.5 rounded-xl bg-white text-stone-950 hover:bg-stone-200 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 shadow-lg transition disabled:opacity-50"
                >
                  {isUploading ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-stone-950" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>{isUploading ? 'Subiendo...' : 'Publicar Foto'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Live Camera Shutter Controls */
            <div className="flex items-center justify-between px-4">
              {/* Native Mobile Camera trigger button */}
              <button
                type="button"
                onClick={() => nativeCameraInputRef.current?.click()}
                className="p-3 rounded-full bg-stone-900/80 text-stone-300 hover:text-white hover:bg-stone-800 transition flex items-center justify-center"
                title="Abrir cámara del teléfono"
              >
                <ImagePlus className="w-5 h-5" />
              </button>

              {/* Central Shutter Button */}
              <button
                type="button"
                onClick={takePhoto}
                disabled={Boolean(cameraError) || isInitializing}
                className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-white p-1.5 flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-transform duration-150 group disabled:opacity-40"
                aria-label="Tomar foto"
              >
                <div className="w-full h-full rounded-full border-2 border-stone-950 bg-white group-active:bg-stone-200 flex items-center justify-center">
                  <Camera className="w-7 h-7 text-stone-950" />
                </div>
              </button>

              {/* Flip camera button */}
              {hasMultipleCameras ? (
                <button
                  type="button"
                  onClick={handleFlipCamera}
                  disabled={Boolean(cameraError) || isInitializing}
                  className="p-3 rounded-full bg-stone-900/80 text-stone-300 hover:text-white hover:bg-stone-800 transition flex items-center justify-center disabled:opacity-40"
                  title="Girar cámara"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              ) : (
                <div className="w-11" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

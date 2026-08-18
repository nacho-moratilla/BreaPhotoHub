'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, X, Check, RotateCcw, Sparkles } from 'lucide-react';
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
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [caption, setCaption] = useState('');
  const [isShutterActive, setIsShutterActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Stop camera tracks
  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Start camera stream
  const startCamera = useCallback(async () => {
    stopStream();
    setCameraError(null);

    try {
      // Check if mediaDevices supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('La cámara no está soportada en este navegador.');
      }

      // Check available video inputs
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((device) => device.kind === 'videoinput');
      setHasMultipleCameras(videoDevices.length > 1);

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Error al acceder a la cámara:', err);
      let errorMsg = 'No se pudo acceder a la cámara.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Permiso de cámara denegado. Por favor, actívalo en los ajustes de tu navegador.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = 'No se encontró ningún dispositivo de cámara.';
      }
      setCameraError(errorMsg);
    }
  }, [facingMode, stopStream]);

  // Handle open/close lifecycle
  useEffect(() => {
    if (isOpen && !capturedPhotoUrl) {
      startCamera();
    } else {
      stopStream();
    }

    return () => {
      stopStream();
    };
  }, [isOpen, startCamera, stopStream, capturedPhotoUrl]);

  // Flip camera between front & back
  const handleFlipCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Capture current frame from video stream
  const takePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // If using front camera, mirror horizontally for natural feel
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Trigger flash animation
    setIsShutterActive(true);
    setTimeout(() => setIsShutterActive(false), 400);

    canvas.toBlob(async (blob) => {
      if (blob) {
        // Compress photo right after capture
        const compressed = await compressImage(blob, 1920, 0.88);
        const previewUrl = URL.createObjectURL(compressed);
        setCapturedBlob(compressed);
        setCapturedPhotoUrl(previewUrl);
        stopStream();
      }
    }, 'image/jpeg', 0.95);
  };

  // Reset captured state and restart camera
  const handleRetake = () => {
    if (capturedPhotoUrl) {
      URL.revokeObjectURL(capturedPhotoUrl);
    }
    setCapturedPhotoUrl(null);
    setCapturedBlob(null);
    setCaption('');
  };

  // Confirm and upload
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
      <div className="relative w-full h-full sm:max-w-lg sm:h-[88vh] sm:max-h-[750px] bg-stone-950 sm:rounded-3xl overflow-hidden flex flex-col justify-between border border-stone-800 shadow-2xl">
        
        {/* Top bar */}
        <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          <div className="flex items-center gap-2 text-white/90 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>{capturedPhotoUrl ? 'Vista Previa' : 'Cámara en Vivo'}</span>
          </div>

          <button
            onClick={() => {
              handleRetake();
              onClose();
            }}
            className="p-2 rounded-full bg-stone-900/80 text-white/80 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Area */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
          {cameraError ? (
            <div className="p-6 text-center text-stone-300 max-w-xs">
              <p className="text-sm text-stone-400 mb-4">{cameraError}</p>
              <button
                onClick={startCamera}
                className="px-4 py-2 bg-stone-800 text-white text-xs font-semibold rounded-xl hover:bg-stone-700 transition"
              >
                Reintentar
              </button>
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
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleRetake}
                  disabled={isUploading}
                  className="flex-1 py-3 px-4 rounded-xl bg-stone-900 text-stone-300 hover:text-white hover:bg-stone-800 text-sm font-medium flex items-center justify-center gap-2 border border-stone-800 transition disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Repetir</span>
                </button>
                <button
                  type="button"
                  onClick={handleConfirmUpload}
                  disabled={isUploading}
                  className="flex-1 py-3 px-4 rounded-xl bg-white text-stone-950 hover:bg-stone-200 text-sm font-semibold flex items-center justify-center gap-2 shadow-lg transition disabled:opacity-50"
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
            <div className="flex items-center justify-around">
              {/* Flip camera button */}
              <div className="w-12 flex justify-center">
                {hasMultipleCameras && (
                  <button
                    onClick={handleFlipCamera}
                    className="p-3 rounded-full bg-stone-900/80 text-stone-300 hover:text-white hover:bg-stone-800 transition"
                    title="Girar cámara"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Shutter Button */}
              <button
                onClick={takePhoto}
                disabled={Boolean(cameraError)}
                className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-white p-1.5 flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-transform duration-150 group disabled:opacity-40"
                aria-label="Tomar foto"
              >
                <div className="w-full h-full rounded-full border-2 border-stone-950 bg-white group-active:bg-stone-200 flex items-center justify-center">
                  <Camera className="w-7 h-7 text-stone-950" />
                </div>
              </button>

              {/* Empty placeholder for symmetrical balance */}
              <div className="w-12" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

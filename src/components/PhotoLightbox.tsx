'use client';

import React, { useEffect, useCallback } from 'react';
import { X, Download, ChevronLeft, ChevronRight, Trash2, Calendar } from 'lucide-react';
import { Photo } from '@/lib/types';
import { formatTimeAgo, downloadSingleImage } from '@/lib/utils';

interface PhotoLightboxProps {
  photo: Photo | null;
  photos: Photo[];
  onClose: () => void;
  onSelectPhoto: (photo: Photo) => void;
  onDeletePhoto?: (photoId: string) => Promise<void>;
  isAdmin?: boolean;
}

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({
  photo,
  photos,
  onClose,
  onSelectPhoto,
  onDeletePhoto,
  isAdmin = false,
}) => {
  const currentIndex = photo ? photos.findIndex((p) => p.id === photo.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < photos.length - 1;

  const handlePrev = useCallback(() => {
    if (hasPrev) {
      onSelectPhoto(photos[currentIndex - 1]);
    }
  }, [hasPrev, currentIndex, photos, onSelectPhoto]);

  const handleNext = useCallback(() => {
    if (hasNext) {
      onSelectPhoto(photos[currentIndex + 1]);
    }
  }, [hasNext, currentIndex, photos, onSelectPhoto]);

  // Keyboard navigation
  useEffect(() => {
    if (!photo) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [photo, onClose, handlePrev, handleNext]);

  if (!photo) return null;

  const handleDownload = () => {
    const filename = photo.filename || `foto-${photo.id.slice(0, 8)}.jpg`;
    downloadSingleImage(photo.url, filename);
  };

  const handleDelete = async () => {
    if (onDeletePhoto && window.confirm('¿Seguro que quieres eliminar esta foto?')) {
      await onDeletePhoto(photo.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md animate-fade-in">
      {/* Top Header Controls */}
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-black/80 to-transparent">
        <div className="text-white/80 text-xs sm:text-sm font-medium flex items-center gap-2">
          <Calendar className="w-4 h-4 text-stone-400" />
          <span>{formatTimeAgo(photo.uploaded_at)}</span>
          <span className="text-stone-600">•</span>
          <span>
            {currentIndex + 1} de {photos.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Download button */}
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-medium transition"
            title="Descargar foto"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Descargar</span>
          </button>

          {/* Delete button (Admin only) */}
          {isAdmin && onDeletePhoto && (
            <button
              onClick={handleDelete}
              className="p-2 rounded-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition"
              title="Eliminar foto"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation Arrows */}
      {hasPrev && (
        <button
          onClick={handlePrev}
          className="absolute left-4 z-20 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white/80 hover:text-white transition hidden sm:flex items-center justify-center backdrop-blur-sm border border-white/10"
          aria-label="Foto anterior"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {hasNext && (
        <button
          onClick={handleNext}
          className="absolute right-4 z-20 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white/80 hover:text-white transition hidden sm:flex items-center justify-center backdrop-blur-sm border border-white/10"
          aria-label="Siguiente foto"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Main Image View */}
      <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-16">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.url}
          alt={photo.caption || 'Foto del evento'}
          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl transition-transform duration-300 select-none"
        />
      </div>

      {/* Bottom Caption if any */}
      {photo.caption && (
        <div className="absolute bottom-0 inset-x-0 z-20 p-4 sm:p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent text-center">
          <p className="text-white text-sm sm:text-base max-w-xl mx-auto font-medium">
            &ldquo;{photo.caption}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
};

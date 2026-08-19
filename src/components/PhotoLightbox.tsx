'use client';

import React, { useEffect, useCallback, useState, useRef } from 'react';
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

  // Touch swipe handling
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

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

  // Touch event handlers for mobile swipe
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    // Minimum swipe threshold
    if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) {
        // Swiped right -> go to previous photo
        handlePrev();
      } else {
        // Swiped left -> go to next photo
        handleNext();
      }
    } else if (deltaY > 90 && Math.abs(deltaY) > Math.abs(deltaX)) {
      // Swiped down -> close viewer
      onClose();
    }

    setTouchStartX(null);
    setTouchStartY(null);
  };

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md animate-fade-in select-none touch-none"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Top Header Controls */}
      <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-black/85 via-black/40 to-transparent">
        <div className="text-white/85 text-xs sm:text-sm font-medium flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-sm">
          <Calendar className="w-3.5 h-3.5 text-stone-400" />
          <span>{formatTimeAgo(photo.uploaded_at)}</span>
          <span className="text-stone-500">•</span>
          <span className="text-white font-semibold">
            {currentIndex + 1} / {photos.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Download button */}
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white text-xs sm:text-sm font-medium transition border border-white/10 backdrop-blur-sm"
            title="Descargar foto"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Descargar</span>
          </button>

          {/* Delete button (Admin only) */}
          {isAdmin && onDeletePhoto && (
            <button
              onClick={handleDelete}
              className="p-2 rounded-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition border border-rose-500/20"
              title="Eliminar foto"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white transition border border-white/10 backdrop-blur-sm"
            title="Cerrar visor"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Navigation Arrow: Previous (Visible on Mobile & Desktop) */}
      {hasPrev ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          className="absolute left-3 sm:left-6 z-30 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-black/60 hover:bg-black/90 active:scale-90 text-white flex items-center justify-center backdrop-blur-md border border-white/20 shadow-2xl transition cursor-pointer"
          aria-label="Foto anterior"
        >
          <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8 -translate-x-0.5" />
        </button>
      ) : null}

      {/* Navigation Arrow: Next (Visible on Mobile & Desktop) */}
      {hasNext ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          className="absolute right-3 sm:right-6 z-30 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-black/60 hover:bg-black/90 active:scale-90 text-white flex items-center justify-center backdrop-blur-md border border-white/20 shadow-2xl transition cursor-pointer"
          aria-label="Siguiente foto"
        >
          <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8 translate-x-0.5" />
        </button>
      ) : null}

      {/* Main Image View */}
      <div 
        onClick={onClose}
        className="relative w-full h-full flex items-center justify-center p-4 sm:p-12 cursor-zoom-out"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={photo.id}
          src={photo.url}
          alt={photo.caption || 'Foto del evento'}
          onClick={(e) => e.stopPropagation()}
          className="max-w-full max-h-[82vh] object-contain rounded-2xl shadow-2xl transition-all duration-200 select-none animate-fade-in cursor-default"
        />
      </div>

      {/* Bottom Caption Bar */}
      {photo.caption && (
        <div className="absolute bottom-0 inset-x-0 z-30 p-4 sm:p-6 bg-gradient-to-t from-black/95 via-black/60 to-transparent text-center pointer-events-none">
          <p className="text-white text-sm sm:text-base max-w-xl mx-auto font-medium bg-black/50 px-4 py-2 rounded-2xl border border-white/10 backdrop-blur-md inline-block shadow-lg">
            &ldquo;{photo.caption}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
};

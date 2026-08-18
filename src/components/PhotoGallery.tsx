'use client';

import React, { useState } from 'react';
import { Download, Maximize2, Archive, Loader2, ImageOff, Sparkles } from 'lucide-react';
import { Photo } from '@/lib/types';
import { downloadSingleImage, downloadAlbumAsZip, formatTimeAgo } from '@/lib/utils';
import { PhotoLightbox } from './PhotoLightbox';

interface PhotoGalleryProps {
  photos: Photo[];
  albumName: string;
  onDeletePhoto?: (photoId: string) => Promise<void>;
  isAdmin?: boolean;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  photos,
  albumName,
  onDeletePhoto,
  isAdmin = false,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState<number>(0);

  const handleDownloadAllZip = async () => {
    if (photos.length === 0 || isZipping) return;
    try {
      setIsZipping(true);
      setZipProgress(0);
      await downloadAlbumAsZip(photos, albumName, (progress) => {
        setZipProgress(progress);
      });
    } catch (err) {
      console.error('Error al empaquetar ZIP:', err);
    } finally {
      setIsZipping(false);
    }
  };

  const handleSingleDownload = (e: React.MouseEvent, photo: Photo) => {
    e.stopPropagation();
    const filename = photo.filename || `foto-${photo.id.slice(0, 8)}.jpg`;
    downloadSingleImage(photo.url, filename);
  };

  return (
    <div className="w-full">
      {/* Header bar above gallery */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
            Galería del Evento
          </h2>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
            {photos.length} {photos.length === 1 ? 'foto' : 'fotos'}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            En directo
          </span>
        </div>

        {/* Action: Download Full Album as ZIP */}
        {photos.length > 0 && (
          <button
            onClick={handleDownloadAllZip}
            disabled={isZipping}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-750 text-stone-800 dark:text-stone-200 text-xs sm:text-sm font-medium border border-stone-200 dark:border-stone-700 transition cursor-pointer disabled:opacity-50"
          >
            {isZipping ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-stone-600 dark:text-stone-300" />
                <span>Empaquetando ({zipProgress}%)...</span>
              </>
            ) : (
              <>
                <Archive className="w-4 h-4 text-stone-500" />
                <span>Descargar Álbum Completo (ZIP)</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Empty State */}
      {photos.length === 0 ? (
        <div className="py-20 px-4 text-center border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-3xl bg-stone-50/50 dark:bg-stone-900/20">
          <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto mb-4 text-stone-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-stone-800 dark:text-stone-200 mb-1">
            Aún no hay fotos en este álbum
          </h3>
          <p className="text-xs sm:text-sm text-stone-500 max-w-sm mx-auto">
            ¡Sé el primero en capturar un recuerdo! Usa el botón de arriba para hacer una foto o subirla de tu galería.
          </p>
        </div>
      ) : (
        /* Image Grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              onClick={() => setSelectedPhoto(photo)}
              className="group relative aspect-square rounded-2xl overflow-hidden bg-stone-100 dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 cursor-pointer photo-card-hover shadow-sm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.caption || 'Foto del álbum'}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Hover overlay with action buttons */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3">
                <div className="flex justify-end">
                  <button
                    onClick={(e) => handleSingleDownload(e, photo)}
                    className="p-2 rounded-xl bg-black/60 hover:bg-black text-white transition backdrop-blur-sm"
                    title="Descargar foto"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-white">
                  {photo.caption && (
                    <p className="text-xs font-medium truncate text-white mb-0.5">
                      {photo.caption}
                    </p>
                  )}
                  <p className="text-[10px] text-stone-300">
                    {formatTimeAgo(photo.uploaded_at)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      <PhotoLightbox
        photo={selectedPhoto}
        photos={photos}
        onClose={() => setSelectedPhoto(null)}
        onSelectPhoto={(photo) => setSelectedPhoto(photo)}
        onDeletePhoto={onDeletePhoto}
        isAdmin={isAdmin}
      />
    </div>
  );
};

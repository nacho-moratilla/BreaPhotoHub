'use client';

import React, { useState } from 'react';
import { Download, Archive, Loader2, Sparkles } from 'lucide-react';
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
    const filename = photo.filename || `comuna-${photo.id.slice(0, 8)}.jpg`;
    downloadSingleImage(photo.url, filename);
  };

  return (
    <div className="w-full">
      {/* Header bar above gallery */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#52b788]/20">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl sm:text-3xl font-pirata tracking-wide text-[#f8f9fa]">
            Galería del Evento
          </h2>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#1b4332]/50 text-[#52b788] border border-[#52b788]/30">
            {photos.length} {photos.length === 1 ? 'foto' : 'fotos'}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-[#52b788] font-bold">
            <span className="w-2 h-2 rounded-full bg-[#52b788] animate-pulse" />
            En directo
          </span>
        </div>

        {/* Action: Download Full Album as ZIP */}
        {photos.length > 0 && (
          <button
            onClick={handleDownloadAllZip}
            disabled={isZipping}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0d1b14] hover:bg-[#1b4332]/50 text-[#f8f9fa] text-xs sm:text-sm font-semibold border border-[#52b788]/30 hover:border-[#52b788]/70 transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            {isZipping ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#52b788]" />
                <span>Empaquetando ({zipProgress}%)...</span>
              </>
            ) : (
              <>
                <Archive className="w-4 h-4 text-[#ffb703]" />
                <span>Descargar Álbum Completo (ZIP)</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Empty State */}
      {photos.length === 0 ? (
        <div className="py-20 px-4 text-center border border-[#52b788]/20 rounded-3xl bg-[#0d1b14]/50 shadow-lg">
          <div className="w-14 h-14 rounded-2xl bg-[#1b4332]/60 border border-[#52b788]/30 flex items-center justify-center mx-auto mb-4 text-[#52b788]">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-pirata text-[#f8f9fa] mb-1 tracking-wide">
            Aún no hay fotos en este álbum
          </h3>
          <p className="text-xs sm:text-sm text-[#b7c4bb] max-w-sm mx-auto">
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
              className="group relative aspect-square rounded-2xl overflow-hidden bg-[#0d1b14] border border-[#52b788]/20 cursor-pointer shadow-sm hover:border-[#52b788]/60 hover:shadow-glow hover:scale-[1.02] transition-all duration-300"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.caption || 'Foto del álbum'}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Hover overlay with action buttons */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#070f0b]/90 via-[#070f0b]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3">
                <div className="flex justify-end">
                  <button
                    onClick={(e) => handleSingleDownload(e, photo)}
                    className="p-2 rounded-xl bg-[#070f0b]/80 border border-[#52b788]/40 hover:bg-[#1b4332] text-white transition backdrop-blur-sm"
                    title="Descargar foto"
                  >
                    <Download className="w-3.5 h-3.5 text-[#ffb703]" />
                  </button>
                </div>

                <div className="text-[#f8f9fa]">
                  {photo.caption && (
                    <p className="text-xs font-semibold truncate text-[#f8f9fa] mb-0.5">
                      {photo.caption}
                    </p>
                  )}
                  <p className="text-[10px] text-[#52b788] font-bold">
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

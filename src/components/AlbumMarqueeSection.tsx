'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Calendar, Camera, ImageIcon } from 'lucide-react';
import { Album, Photo } from '@/lib/types';
import { formatDateRange, formatTimeAgo, isEmojiCover, getCoverEmoji } from '@/lib/utils';

interface AlbumWithPhotos extends Album {
  photos: Photo[];
}

interface AlbumMarqueeSectionProps {
  album: AlbumWithPhotos;
  reverse?: boolean;
}

export const AlbumMarqueeSection: React.FC<AlbumMarqueeSectionProps> = ({
  album,
  reverse = false,
}) => {
  const photos = album.photos || [];
  
  // Create a looped array for seamless infinite marquee scrolling
  let marqueeItems = photos;
  if (photos.length > 0) {
    while (marqueeItems.length < 10) {
      marqueeItems = [...marqueeItems, ...photos];
    }
  }

  return (
    <div className="w-full py-8 sm:py-12 border-b border-[#52b788]/20 last:border-b-0">
      {/* Album Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Info */}
        <div className="flex items-center gap-3.5 sm:gap-4">
          {/* Cover icon / emoji / thumbnail */}
          {isEmojiCover(album.cover_url) ? (
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#1b4332] to-[#0d1b14] border border-[#52b788]/30 flex items-center justify-center text-2xl sm:text-3xl shrink-0 shadow-glow select-none">
              {getCoverEmoji(album.cover_url)}
            </div>
          ) : album.cover_url ? (
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden border border-[#52b788]/30 shrink-0 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={album.cover_url} alt={album.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#0d1b14] border border-[#52b788]/20 flex items-center justify-center text-[#52b788] shrink-0">
              <ImageIcon className="w-6 h-6" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="font-pirata text-2xl sm:text-3xl text-[#f8f9fa] tracking-wide">
                {album.name}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#1b4332]/50 text-[#52b788] border border-[#52b788]/30">
                {photos.length} {photos.length === 1 ? 'foto' : 'fotos'}
              </span>
            </div>

            {album.event_date && (
              <p className="text-xs sm:text-sm text-[#b7c4bb] flex items-center gap-1.5 mt-1 font-medium">
                <Calendar className="w-3.5 h-3.5 text-[#ffb703]" />
                <span>{formatDateRange(album.event_date, album.event_end_date)}</span>
              </p>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5">
          <Link
            href={`/album/${album.slug}`}
            className="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-[#52b788] text-[#070f0b] text-xs sm:text-sm font-bold shadow-glow hover:bg-[#74c69d] hover:scale-105 active:scale-[0.98] transition group"
          >
            <span>Ver Álbum Completo</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Full-Width Infinite Marquee Ticker (Mobbin style) */}
      <div className="relative w-full overflow-hidden py-2 select-none group">
        {/* Edge Gradients */}
        <div className="absolute left-0 inset-y-0 w-12 sm:w-24 bg-gradient-to-r from-[#070f0b] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 inset-y-0 w-12 sm:w-24 bg-gradient-to-l from-[#070f0b] to-transparent z-10 pointer-events-none" />

        {photos.length === 0 ? (
          /* Empty album placeholder reel */
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <Link
              href={`/album/${album.slug}`}
              className="flex items-center justify-between p-6 sm:p-8 rounded-3xl border border-[#52b788]/20 bg-[#0d1b14]/70 hover:border-[#52b788]/60 transition group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#1b4332]/60 border border-[#52b788]/30 flex items-center justify-center text-[#52b788] group-hover:scale-110 transition">
                  <Camera className="w-6 h-6 text-[#52b788]" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-[#f8f9fa]">
                    Aún no hay fotos en este álbum
                  </h4>
                  <p className="text-xs sm:text-sm text-[#b7c4bb]">
                    ¡Sé el primero en capturar un recuerdo y compartirlo con toda La Comuna!
                  </p>
                </div>
              </div>

              <span className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#52b788] text-[#070f0b] text-xs font-bold shadow-glow">
                <span>Hacer Primera Foto</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          </div>
        ) : (
          /* Continuous Running Ticker */
          <div className={reverse ? 'animate-marquee-reverse' : 'animate-marquee'}>
            {/* Track 1 */}
            <div className="flex items-center gap-3 sm:gap-4 shrink-0 pr-3 sm:pr-4">
              {marqueeItems.map((photo, index) => (
                <Link
                  key={`track1-${photo.id}-${index}`}
                  href={`/album/${album.slug}`}
                  className="relative w-44 sm:w-60 md:w-68 aspect-[3/4] rounded-2xl sm:rounded-3xl overflow-hidden bg-[#0d1b14] border border-[#52b788]/20 shadow-sm hover:shadow-glow hover:border-[#52b788]/60 hover:scale-[1.02] transition-all duration-300 group/card shrink-0 cursor-pointer"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={photo.caption || album.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />

                  {/* Hover Overlay with caption & time */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070f0b]/90 via-[#070f0b]/30 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3.5 text-[#f8f9fa]">
                    {photo.caption && (
                      <p className="text-xs font-semibold line-clamp-2 mb-1">
                        &ldquo;{photo.caption}&rdquo;
                      </p>
                    )}
                    <p className="text-[11px] text-[#52b788] font-bold">
                      {formatTimeAgo(photo.uploaded_at)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Track 2 (Clone for infinite seamless loop) */}
            <div className="flex items-center gap-3 sm:gap-4 shrink-0 pr-3 sm:pr-4">
              {marqueeItems.map((photo, index) => (
                <Link
                  key={`track2-${photo.id}-${index}`}
                  href={`/album/${album.slug}`}
                  className="relative w-44 sm:w-60 md:w-68 aspect-[3/4] rounded-2xl sm:rounded-3xl overflow-hidden bg-[#0d1b14] border border-[#52b788]/20 shadow-sm hover:shadow-glow hover:border-[#52b788]/60 hover:scale-[1.02] transition-all duration-300 group/card shrink-0 cursor-pointer"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={photo.caption || album.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />

                  {/* Hover Overlay with caption & time */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070f0b]/90 via-[#070f0b]/30 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3.5 text-[#f8f9fa]">
                    {photo.caption && (
                      <p className="text-xs font-semibold line-clamp-2 mb-1">
                        &ldquo;{photo.caption}&rdquo;
                      </p>
                    )}
                    <p className="text-[11px] text-[#52b788] font-bold">
                      {formatTimeAgo(photo.uploaded_at)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

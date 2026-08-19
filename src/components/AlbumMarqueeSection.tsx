'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Calendar, Camera, ImageIcon, Sparkles } from 'lucide-react';
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
    <div className="w-full py-8 sm:py-12 border-b border-stone-200/80 dark:border-stone-800/80 last:border-b-0">
      {/* Album Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Info */}
        <div className="flex items-center gap-3.5 sm:gap-4">
          {/* Cover icon / emoji / thumbnail */}
          {isEmojiCover(album.cover_url) ? (
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-850 dark:to-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-2xl sm:text-3xl shrink-0 shadow-sm select-none">
              {getCoverEmoji(album.cover_url)}
            </div>
          ) : album.cover_url ? (
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-700 shrink-0 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={album.cover_url} alt={album.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400 shrink-0">
              <ImageIcon className="w-6 h-6" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="font-extrabold text-xl sm:text-2xl text-stone-950 dark:text-stone-50 tracking-tight">
                {album.name}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 dark:bg-stone-850 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-750">
                {photos.length} {photos.length === 1 ? 'foto' : 'fotos'}
              </span>
            </div>

            {album.event_date && (
              <p className="text-xs sm:text-sm text-stone-500 flex items-center gap-1.5 mt-1 font-medium">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                <span>{formatDateRange(album.event_date, album.event_end_date)}</span>
              </p>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5">
          <Link
            href={`/album/${album.slug}`}
            className="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950 text-xs sm:text-sm font-semibold shadow hover:opacity-90 active:scale-[0.98] transition group"
          >
            <span>Ver Álbum Completo</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Full-Width Infinite Marquee Ticker (Mobbin style) */}
      <div className="relative w-full overflow-hidden py-2 select-none group">
        {/* Subtle Edge Gradients */}
        <div className="absolute left-0 inset-y-0 w-12 sm:w-24 bg-gradient-to-r from-stone-50 dark:from-stone-950 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 inset-y-0 w-12 sm:w-24 bg-gradient-to-l from-stone-50 dark:from-stone-950 to-transparent z-10 pointer-events-none" />

        {photos.length === 0 ? (
          /* Empty album placeholder reel */
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <Link
              href={`/album/${album.slug}`}
              className="flex items-center justify-between p-6 sm:p-8 rounded-3xl border-2 border-dashed border-stone-200 dark:border-stone-800 bg-white/60 dark:bg-stone-900/40 hover:border-stone-400 dark:hover:border-stone-600 transition group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400 group-hover:scale-110 transition">
                  <Camera className="w-6 h-6 text-stone-700 dark:text-stone-300" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100">
                    Aún no hay fotos en este álbum
                  </h4>
                  <p className="text-xs sm:text-sm text-stone-500">
                    ¡Sé el primero en capturar un recuerdo y compartirlo con todos!
                  </p>
                </div>
              </div>

              <span className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-semibold">
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
                  className="relative w-44 sm:w-60 md:w-68 aspect-[3/4] rounded-2xl sm:rounded-3xl overflow-hidden bg-stone-100 dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group/card shrink-0 cursor-pointer"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={photo.caption || album.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />

                  {/* Hover Overlay with caption & time */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3.5 text-white">
                    {photo.caption && (
                      <p className="text-xs font-medium line-clamp-2 mb-1">
                        &ldquo;{photo.caption}&rdquo;
                      </p>
                    )}
                    <p className="text-[11px] text-stone-300 font-medium">
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
                  className="relative w-44 sm:w-60 md:w-68 aspect-[3/4] rounded-2xl sm:rounded-3xl overflow-hidden bg-stone-100 dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group/card shrink-0 cursor-pointer"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={photo.caption || album.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />

                  {/* Hover Overlay with caption & time */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3.5 text-white">
                    {photo.caption && (
                      <p className="text-xs font-medium line-clamp-2 mb-1">
                        &ldquo;{photo.caption}&rdquo;
                      </p>
                    )}
                    <p className="text-[11px] text-stone-300 font-medium">
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

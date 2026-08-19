'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Camera, PlusCircle, ArrowRight, Radio, Image as ImageIcon, Calendar, Sparkles, RefreshCw } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Album } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export default function HomePage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAlbums() {
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('albums')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          setAlbums(data);
        }
      } catch (err) {
        console.error('Error cargando álbumes:', err);
      } finally {
        setLoading(false);
      }
    }

    loadAlbums();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100">
      <Navbar />

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative pt-16 pb-12 sm:pt-24 sm:pb-16 px-4 sm:px-6 max-w-5xl mx-auto text-center">
          
          {/* Tag Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-200/70 dark:bg-stone-800/70 border border-stone-300/60 dark:border-stone-700/60 text-xs font-semibold text-stone-800 dark:text-stone-200 mb-6 animate-fade-in">
            <Radio className="w-3.5 h-3.5 text-stone-900 dark:text-stone-100 animate-pulse" />
            <span>Álbumes y Recuerdos de Brea</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-stone-950 dark:text-white max-w-4xl mx-auto leading-[1.08] mb-6">
            Los recuerdos del pueblo a un paso
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-2xl text-stone-600 dark:text-stone-400 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Recuerda los distintos momentos vividos en Brea
          </p>

          {/* Call to action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-8">
            <Link
              href="/admin/albums/new"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-semibold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl hover:bg-stone-800 dark:hover:bg-stone-200 active:scale-[0.98] transition-all group"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Crear Nuevo Álbum</span>
            </Link>

            <Link
              href="/admin"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-800 font-medium text-sm sm:text-base flex items-center justify-center gap-2 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            >
              <span>Panel de Administración</span>
            </Link>
          </div>
        </section>

        {/* Albums Grid Section - Directly Visible */}
        <section className="py-8 px-4 sm:px-6 max-w-6xl mx-auto border-t border-stone-200/80 dark:border-stone-800/80">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-stone-950 dark:text-stone-50">
                Todos los Álbumes
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                Explora las galerías de fotos y eventos de Brea
              </p>
            </div>
            
            {albums.length > 0 && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-stone-100 dark:bg-stone-850 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-750">
                {albums.length} {albums.length === 1 ? 'álbum' : 'álbumes'}
              </span>
            )}
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-stone-500">
              <RefreshCw className="w-6 h-6 animate-spin text-stone-700 dark:text-stone-300" />
              <span className="text-sm font-medium">Cargando álbumes...</span>
            </div>
          ) : albums.length === 0 ? (
            <div className="py-16 px-4 text-center border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-3xl bg-white/50 dark:bg-stone-900/20 max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto mb-3 text-stone-400">
                <ImageIcon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-stone-800 dark:text-stone-200 mb-1">
                Aún no hay álbumes creados
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 mb-5">
                Sé el primero en crear un álbum para un evento o fiesta en Brea.
              </p>
              <Link
                href="/admin/albums/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950 text-xs sm:text-sm font-semibold hover:opacity-90 transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Crear Primer Álbum</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {albums.map((album) => (
                <Link
                  key={album.id}
                  href={`/album/${album.slug}`}
                  className="group p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 hover:border-stone-400 dark:hover:border-stone-600 transition-all shadow-sm hover:shadow-md flex flex-col justify-between"
                >
                  <div>
                    {album.cover_url ? (
                      <div className="aspect-video w-full rounded-2xl overflow-hidden mb-3.5 bg-stone-100 dark:bg-stone-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={album.cover_url}
                          alt={album.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video w-full rounded-2xl mb-3.5 bg-stone-100 dark:bg-stone-800 flex flex-col items-center justify-center text-stone-400 group-hover:bg-stone-200 dark:group-hover:bg-stone-750 transition-colors">
                        <ImageIcon className="w-8 h-8 mb-1" />
                        <span className="text-[11px] font-medium">BreaPhotoHub</span>
                      </div>
                    )}
                    
                    <h3 className="font-bold text-base text-stone-950 dark:text-stone-50 truncate group-hover:text-stone-600 dark:group-hover:text-stone-300 transition">
                      {album.name}
                    </h3>
                    
                    {album.event_date && (
                      <p className="text-xs text-stone-500 flex items-center gap-1.5 mt-1 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        <span>{formatDate(album.event_date)}</span>
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs font-semibold text-stone-600 dark:text-stone-400 group-hover:text-stone-950 dark:group-hover:text-white transition">
                    <span>Ver fotos y subir</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-stone-200 dark:border-stone-800 py-8 px-4 text-center text-xs text-stone-500 mt-16">
        <p className="font-medium text-stone-700 dark:text-stone-400">
          BreaPhotoHub — Recuerdos y Momentos de Brea
        </p>
        <p className="mt-1">
          Plataforma comunitaria de álbumes de fotos para fiestas, eventos y celebraciones.
        </p>
      </footer>
    </div>
  );
}

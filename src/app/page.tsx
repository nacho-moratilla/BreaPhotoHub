'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Camera, QrCode, Sparkles, Zap, Shield, ArrowRight, Download, Radio, Image as ImageIcon } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Album } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export default function HomePage() {
  const [recentAlbums, setRecentAlbums] = useState<Album[]>([]);
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
          .order('created_at', { ascending: false })
          .limit(4);

        if (!error && data) {
          setRecentAlbums(data);
        }
      } catch (err) {
        console.error('Error cargando álbumes recientes:', err);
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
        <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-32 px-4 sm:px-6 max-w-6xl mx-auto text-center">
          
          {/* Tag Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-200/70 dark:bg-stone-800/70 border border-stone-300/60 dark:border-stone-700/60 text-xs font-semibold text-stone-800 dark:text-stone-200 mb-8 animate-fade-in">
            <Radio className="w-3.5 h-3.5 text-stone-900 dark:text-stone-100 animate-pulse" />
            <span>Álbumes en vivo vía QR y NFC</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-stone-950 dark:text-white max-w-4xl mx-auto leading-[1.08] mb-6">
            Tus eventos, <br className="hidden sm:inline" />
            capturados por <span className="underline decoration-stone-300 dark:decoration-stone-700 underline-offset-8">todos tus invitados</span>.
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-stone-600 dark:text-stone-400 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Coloca un QR o NFC en cada mesa. Tus invitados escanean, hacen una foto al instante y se comparte en tiempo real en la galería del evento sin descargar apps ni registrarse.
          </p>

          {/* Call to action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-16">
            <Link
              href="/admin/albums/new"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-semibold text-base flex items-center justify-center gap-2.5 shadow-xl hover:bg-stone-800 dark:hover:bg-stone-200 active:scale-[0.98] transition-all group"
            >
              <span>Crear Álbum para mi Evento</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/admin"
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-800 font-medium text-base flex items-center justify-center gap-2 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            >
              <span>Gestionar Álbumes</span>
            </Link>
          </div>

          {/* 3 Step Visual Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-4xl mx-auto">
            {/* Step 1 */}
            <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 shadow-sm relative overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-900 dark:text-stone-100 font-bold text-sm mb-4">
                1
              </div>
              <h3 className="text-lg font-semibold mb-1 text-stone-900 dark:text-stone-100">
                Escaneo Instantáneo
              </h3>
              <p className="text-sm text-stone-500 leading-relaxed">
                Tus invitados solo tienen que apuntar con la cámara a la mesa o acercar el móvil con NFC. Sin descargar ninguna aplicación.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 shadow-sm relative overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-900 dark:text-stone-100 font-bold text-sm mb-4">
                2
              </div>
              <h3 className="text-lg font-semibold mb-1 text-stone-900 dark:text-stone-100">
                Foto en el Momento
              </h3>
              <p className="text-sm text-stone-500 leading-relaxed">
                Se activa la cámara web o móvil con un botón directo. Haz la foto, añade una frase y súbela en 1 segundo.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 shadow-sm relative overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-900 dark:text-stone-100 font-bold text-sm mb-4">
                3
              </div>
              <h3 className="text-lg font-semibold mb-1 text-stone-900 dark:text-stone-100">
                Galería y Descarga ZIP
              </h3>
              <p className="text-sm text-stone-500 leading-relaxed">
                Todas las fotos aparecen en directo. Descarga fotos individuales o el álbum completo en un único archivo ZIP.
              </p>
            </div>
          </div>
        </section>

        {/* Existing Albums preview if any */}
        {recentAlbums.length > 0 && (
          <section className="py-12 px-4 sm:px-6 max-w-6xl mx-auto border-t border-stone-200 dark:border-stone-800">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                  Álbumes Recientes
                </h2>
                <p className="text-xs sm:text-sm text-stone-500">
                  Explora álbumes activos o creados recientemente
                </p>
              </div>
              <Link
                href="/admin"
                className="text-xs font-semibold text-stone-700 dark:text-stone-300 hover:underline"
              >
                Ver todos
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {recentAlbums.map((album) => (
                <Link
                  key={album.id}
                  href={`/album/${album.slug}`}
                  className="group p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 hover:border-stone-400 dark:hover:border-stone-600 transition shadow-sm flex flex-col justify-between"
                >
                  <div>
                    {album.cover_url ? (
                      <div className="aspect-video w-full rounded-xl overflow-hidden mb-3 bg-stone-100 dark:bg-stone-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={album.cover_url}
                          alt={album.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video w-full rounded-xl mb-3 bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                    )}
                    <h3 className="font-semibold text-sm text-stone-900 dark:text-stone-100 truncate group-hover:text-stone-600 dark:group-hover:text-stone-300 transition">
                      {album.name}
                    </h3>
                    {album.event_date && (
                      <p className="text-xs text-stone-500 mt-0.5">
                        {formatDate(album.event_date)}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500">
                    <span>Ver fotos</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-stone-200 dark:border-stone-800 py-8 px-4 text-center text-xs text-stone-500">
        <p className="font-medium text-stone-700 dark:text-stone-400">
          BreaPhotoHub — Plataforma de Álbumes de Eventos
        </p>
        <p className="mt-1">
          Diseñado para bodas, cumpleaños, conferencias y celebraciones.
        </p>
      </footer>
    </div>
  );
}

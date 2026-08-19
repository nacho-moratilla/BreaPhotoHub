'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Camera, PlusCircle, Radio, Sparkles, RefreshCw, Lock, ChevronDown } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { AlbumMarqueeSection } from '@/components/AlbumMarqueeSection';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Album, Photo } from '@/lib/types';

interface AlbumWithPhotos extends Album {
  photos: Photo[];
}

export default function HomePage() {
  const [albumsWithPhotos, setAlbumsWithPhotos] = useState<AlbumWithPhotos[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const auth = sessionStorage.getItem('breaphoto_admin_auth');
      setIsAdmin(auth === 'true');
    }

    async function loadAlbumsAndPhotos() {
      if (!isSupabaseConfigured) {
        // Fallback demo data with sample photos
        const mock: AlbumWithPhotos[] = [
          {
            id: 'mock-1',
            name: 'Fiestas Patronales de Brea 2026',
            slug: 'fiestas-brea-2026',
            cover_url: 'emoji:🎉',
            event_date: '2026-08-15',
            created_at: new Date().toISOString(),
            photos: [
              { id: 'p1', album_id: 'mock-1', url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80', filename: 'p1.jpg', uploaded_at: new Date().toISOString(), caption: 'Pregón de fiestas 🎆' },
              { id: 'p2', album_id: 'mock-1', url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80', filename: 'p2.jpg', uploaded_at: new Date().toISOString(), caption: 'Noche de orquesta 💃' },
              { id: 'p3', album_id: 'mock-1', url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&auto=format&fit=crop&q=80', filename: 'p3.jpg', uploaded_at: new Date().toISOString(), caption: 'La charanga en la plaza' },
              { id: 'p4', album_id: 'mock-1', url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&auto=format&fit=crop&q=80', filename: 'p4.jpg', uploaded_at: new Date().toISOString(), caption: 'Comida popular en la peña 🥘' },
            ],
          },
          {
            id: 'mock-2',
            name: 'Romería de la Virgen',
            slug: 'romeria-virgen-2026',
            cover_url: 'emoji:🌾',
            event_date: '2026-05-10',
            created_at: new Date().toISOString(),
            photos: [
              { id: 'p5', album_id: 'mock-2', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80', filename: 'p5.jpg', uploaded_at: new Date().toISOString(), caption: 'Subida al monte' },
              { id: 'p6', album_id: 'mock-2', url: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?w=800&auto=format&fit=crop&q=80', filename: 'p6.jpg', uploaded_at: new Date().toISOString(), caption: 'Día en el campo 🍷' },
              { id: 'p7', album_id: 'mock-2', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80', filename: 'p7.jpg', uploaded_at: new Date().toISOString(), caption: 'Vistas de Brea' },
            ],
          }
        ];
        setAlbumsWithPhotos(mock);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // 1. Fetch all albums
        const { data: albumsData, error: albumsError } = await supabase
          .from('albums')
          .select('*')
          .order('created_at', { ascending: false });

        if (albumsError) throw albumsError;

        if (albumsData) {
          // 2. Fetch all photos grouped by album
          const { data: photosData, error: photosError } = await supabase
            .from('photos')
            .select('*')
            .order('uploaded_at', { ascending: false });

          if (!photosError && photosData) {
            const combined: AlbumWithPhotos[] = albumsData.map((album) => ({
              ...album,
              photos: photosData.filter((p) => p.album_id === album.id),
            }));
            setAlbumsWithPhotos(combined);
          } else {
            setAlbumsWithPhotos(albumsData.map((a) => ({ ...a, photos: [] })));
          }
        }
      } catch (err) {
        console.error('Error cargando álbumes y fotos para portada:', err);
      } finally {
        setLoading(false);
      }
    }

    loadAlbumsAndPhotos();
  }, []);

  const scrollToAlbums = () => {
    document.getElementById('albumes')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative pt-16 pb-12 sm:pt-24 sm:pb-16 px-4 sm:px-6 max-w-5xl mx-auto text-center">
          
          {/* Tag Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-200/70 dark:bg-stone-800/70 border border-stone-300/60 dark:border-stone-700/60 text-xs font-semibold text-stone-800 dark:text-stone-200 mb-6 animate-fade-in">
            <Radio className="w-3.5 h-3.5 text-stone-900 dark:text-stone-100 animate-pulse" />
            <span>Recap Fotográfico en Vivo de Brea</span>
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
            <button
              onClick={scrollToAlbums}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-semibold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl hover:bg-stone-800 dark:hover:bg-stone-200 active:scale-[0.98] transition-all group cursor-pointer"
            >
              <span>Explorar Momentos</span>
              <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
            </button>

            {/* Admin only action in hero */}
            {isAdmin && (
              <Link
                href="/admin/albums/new"
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-800 font-medium text-sm sm:text-base flex items-center justify-center gap-2 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
              >
                <PlusCircle className="w-4 h-4 text-emerald-500" />
                <span>Crear Álbum</span>
              </Link>
            )}
          </div>
        </section>

        {/* Full-Width Albums Infinite Recap Sections (Mobbin Style) */}
        <section id="albumes" className="w-full py-8 border-t border-stone-200/80 dark:border-stone-800/80 scroll-mt-16">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3 text-stone-500">
              <RefreshCw className="w-6 h-6 animate-spin text-stone-700 dark:text-stone-300" />
              <span className="text-sm font-medium">Cargando recuerdos en vivo...</span>
            </div>
          ) : albumsWithPhotos.length === 0 ? (
            <div className="max-w-lg mx-auto py-16 px-4 text-center border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-3xl bg-white/50 dark:bg-stone-900/20 my-10">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto mb-3 text-stone-400">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-stone-800 dark:text-stone-200 mb-1">
                Aún no hay álbumes publicados
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 mb-5">
                Vuelve pronto para revivir los mejores recuerdos de Brea.
              </p>
              {isAdmin && (
                <Link
                  href="/admin/albums/new"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950 text-xs sm:text-sm font-semibold hover:opacity-90 transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Crear Primer Álbum</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="w-full flex flex-col">
              {albumsWithPhotos.map((album, index) => (
                <AlbumMarqueeSection
                  key={album.id}
                  album={album}
                  reverse={index % 2 === 1}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Minimal Footer with discreet Admin Link */}
      <footer className="border-t border-stone-200 dark:border-stone-800 py-10 px-4 text-center text-xs text-stone-500 mt-16 flex flex-col items-center gap-3 bg-white/50 dark:bg-stone-900/30">
        <div>
          <p className="font-medium text-stone-700 dark:text-stone-400">
            BreaPhotoHub — Recuerdos y Momentos de Brea
          </p>
          <p className="mt-0.5">
            Plataforma comunitaria de álbumes de fotos para fiestas y eventos.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-900 transition-colors"
          >
            <Lock className="w-3 h-3" />
            <span>Acceso Administración</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}

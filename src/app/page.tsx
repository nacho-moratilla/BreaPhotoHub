'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Camera, PlusCircle, Radio, ChevronDown, Lock, Instagram, Sparkles } from 'lucide-react';
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
      const auth = sessionStorage.getItem('breaphoto_admin_auth') || localStorage.getItem('breaphoto_admin_auth');
      setIsAdmin(auth === 'true');
    }

    async function loadAlbumsAndPhotos() {
      if (!isSupabaseConfigured) {
        // Fallback demo data with sample photos
        const mock: AlbumWithPhotos[] = [
          {
            id: 'mock-1',
            name: 'La Cagada del Manso 2026',
            slug: 'cagada-del-manso-2026',
            cover_url: 'emoji:🐂',
            event_date: '2026-08-15',
            created_at: new Date().toISOString(),
            photos: [
              { id: 'p1', album_id: 'mock-1', url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80', filename: 'p1.jpg', uploaded_at: new Date().toISOString(), caption: 'Gran evento en la plaza de toros 🐂' },
              { id: 'p2', album_id: 'mock-1', url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80', filename: 'p2.jpg', uploaded_at: new Date().toISOString(), caption: 'Noche de fiesta y orquesta 💃' },
              { id: 'p3', album_id: 'mock-1', url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&auto=format&fit=crop&q=80', filename: 'p3.jpg', uploaded_at: new Date().toISOString(), caption: 'La Comuna en el ruedo 🎉' },
              { id: 'p4', album_id: 'mock-1', url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&auto=format&fit=crop&q=80', filename: 'p4.jpg', uploaded_at: new Date().toISOString(), caption: 'Comida de peñas 🥘' },
            ],
          },
          {
            id: 'mock-2',
            name: 'Fiestas Patronales de Brea',
            slug: 'fiestas-patronales-2026',
            cover_url: 'emoji:🎉',
            event_date: '2026-10-07',
            created_at: new Date().toISOString(),
            photos: [
              { id: 'p5', album_id: 'mock-2', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80', filename: 'p5.jpg', uploaded_at: new Date().toISOString(), caption: 'Subida al monte' },
              { id: 'p6', album_id: 'mock-2', url: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?w=800&auto=format&fit=crop&q=80', filename: 'p6.jpg', uploaded_at: new Date().toISOString(), caption: 'Vino y charanga 🍷' },
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
    <div className="min-h-screen flex flex-col bg-[#070f0b] text-[#f8f9fa] overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative pt-16 pb-12 sm:pt-24 sm:pb-16 px-4 sm:px-6 max-w-5xl mx-auto text-center">
          
          {/* Tag Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#ffb703]/15 border border-[#ffb703]/40 text-xs font-bold text-[#ffb703] mb-6 shadow-glow-gold animate-fade-in">
            <Radio className="w-3.5 h-3.5 text-[#ffb703] animate-pulse" />
            <span>Peña La Comuna · Brea de Tajo</span>
          </div>

          {/* Main Headline with Pirata One Font */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-pirata tracking-wide text-[#f8f9fa] max-w-4xl mx-auto leading-[1.08] mb-6 drop-shadow-md">
            Los Recuerdos de <span className="text-[#52b788] text-glow">La Comuna</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-2xl text-[#b7c4bb] max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Revive los distintos momentos y la locura vivida en cada fiesta
          </p>

          {/* Call to action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-8">
            <button
              onClick={scrollToAlbums}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#52b788] hover:bg-[#74c69d] text-[#070f0b] font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-glow hover:scale-105 active:scale-[0.98] transition-all group cursor-pointer"
            >
              <span>Explorar Momentos</span>
              <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
            </button>

            {/* Admin only action in hero */}
            {isAdmin && (
              <Link
                href="/admin/albums/new"
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#0d1b14] text-[#f8f9fa] border border-[#52b788]/30 font-semibold text-sm sm:text-base flex items-center justify-center gap-2 hover:border-[#52b788]/70 hover:bg-[#1b4332]/40 transition"
              >
                <PlusCircle className="w-4 h-4 text-[#52b788]" />
                <span>Crear Álbum</span>
              </Link>
            )}
          </div>
        </section>

        {/* Full-Width Albums Infinite Recap Sections (Mobbin Style) */}
        <section id="albumes" className="w-full py-8 border-t border-[#52b788]/20 scroll-mt-16">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3 text-[#b7c4bb]">
              <div className="w-8 h-8 rounded-full border-2 border-[#52b788] border-t-transparent animate-spin" />
              <span className="text-sm font-medium">Cargando recuerdos de la peña...</span>
            </div>
          ) : albumsWithPhotos.length === 0 ? (
            <div className="max-w-lg mx-auto py-16 px-4 text-center border border-[#52b788]/20 rounded-3xl bg-[#0d1b14]/60 my-10 shadow-lg">
              <div className="w-12 h-12 rounded-2xl bg-[#1b4332]/60 border border-[#52b788]/30 flex items-center justify-center mx-auto mb-3 text-[#52b788]">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-pirata text-[#f8f9fa] mb-1 tracking-wide">
                Aún no hay álbumes publicados
              </h3>
              <p className="text-xs sm:text-sm text-[#b7c4bb] mb-5">
                Vuelve pronto para revivir los mejores recuerdos de La Comuna.
              </p>
              {isAdmin && (
                <Link
                  href="/admin/albums/new"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#52b788] text-[#070f0b] text-xs sm:text-sm font-bold shadow-glow hover:bg-[#74c69d] transition"
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

      {/* La Comuna Themed Footer */}
      <footer className="border-t border-[#52b788]/20 py-12 px-4 text-center text-xs text-[#b7c4bb] mt-16 flex flex-col items-center gap-4 bg-[#070f0b]/90">
        <div>
          <h3 className="font-pirata text-2xl text-[#52b788] text-glow tracking-wider mb-1">
            PEÑA LA COMUNA
          </h3>
          <p className="font-medium text-[#f8f9fa]">
            La mejor peña de Brea de Tajo
          </p>
          <p className="mt-1 text-[#b7c4bb]/80 text-[11px]">
            Tradición, música, fiesta y los mejores recuerdos con nuestra gente.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="https://www.instagram.com/laacomuunaa/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0d1b14] border border-[#ffb703]/40 text-[#ffb703] font-semibold text-xs hover:border-[#ffb703] transition-all"
          >
            <Instagram className="w-3.5 h-3.5" />
            <span>@laacomuunaa</span>
          </a>
        </div>

        <div className="pt-2">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] text-[#b7c4bb]/60 hover:text-[#52b788] hover:bg-[#0d1b14] transition-colors"
          >
            <Lock className="w-3 h-3" />
            <span>Acceso Administración</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}

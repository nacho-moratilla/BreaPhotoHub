'use client';

import React, { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { 
  ArrowLeft, 
  QrCode, 
  Trash2, 
  ExternalLink, 
  Calendar, 
  Radio, 
  RefreshCw, 
  Sparkles,
  Download
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { QRCodeCard } from '@/components/QRCodeCard';
import { PhotoGallery } from '@/components/PhotoGallery';
import { ToastContainer } from '@/components/Toast';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Album, Photo, ToastMessage } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export default function AlbumAdminManagePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [album, setAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load Album & Photos for Admin
  const loadData = useCallback(async () => {
    if (!isSupabaseConfigured) {
      const mockAlbum: Album = {
        id: 'mock-1',
        name: slug.replace(/-/g, ' ').toUpperCase(),
        slug: slug,
        cover_url: null,
        event_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
      };
      setAlbum(mockAlbum);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data: albumData, error: albumError } = await supabase
        .from('albums')
        .select('*')
        .eq('slug', slug)
        .single();

      if (albumError || !albumData) {
        setLoading(false);
        return;
      }

      setAlbum(albumData);

      const { data: photosData, error: photosError } = await supabase
        .from('photos')
        .select('*')
        .eq('album_id', albumData.id)
        .order('uploaded_at', { ascending: false });

      if (!photosError && photosData) {
        setPhotos(photosData);
      }
    } catch (err) {
      console.error('Error cargando álbum para admin:', err);
      addToast('error', 'Error al cargar los datos del álbum.');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Admin delete photo action
  const handleDeletePhoto = async (photoId: string) => {
    if (!isSupabaseConfigured) {
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      addToast('success', 'Foto eliminada (Modo Demo).');
      return;
    }

    try {
      const { error } = await supabase.from('photos').delete().eq('id', photoId);
      if (error) throw error;

      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      addToast('success', 'Foto eliminada correctamente.');
    } catch (err) {
      console.error('Error al eliminar foto:', err);
      addToast('error', 'No se pudo eliminar la foto.');
    }
  };

  if (!loading && !album) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col pb-20">
      <Navbar currentAlbumName={album?.name} />
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        
        {/* Back Link */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-xs font-medium text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al panel general</span>
          </Link>

          <Link
            href={`/album/${slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-semibold hover:bg-stone-200 dark:hover:bg-stone-700 transition"
          >
            <span>Ver Álbum Público</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-stone-500">
            <RefreshCw className="w-6 h-6 animate-spin" />
            <span className="text-sm font-medium">Cargando álbum...</span>
          </div>
        ) : (
          <div className="space-y-12">
            
            {/* Top Grid: QR Code & NFC Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Printable QR Card */}
              <div className="lg:col-span-6 flex justify-center">
                <QRCodeCard
                  slug={album!.slug}
                  albumName={album!.name}
                  eventDate={album!.event_date}
                />
              </div>

              {/* Right Column: Instructions & Details */}
              <div className="lg:col-span-6 space-y-6">
                <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 shadow-sm">
                  <h2 className="text-xl font-bold tracking-tight text-stone-950 dark:text-stone-50 mb-2">
                    Detalles del Evento
                  </h2>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-xs text-stone-400 block">Nombre del Álbum</span>
                      <span className="font-semibold text-stone-800 dark:text-stone-200">{album!.name}</span>
                    </div>

                    {album!.event_date && (
                      <div>
                        <span className="text-xs text-stone-400 block">Fecha</span>
                        <span className="font-medium text-stone-700 dark:text-stone-300">
                          {formatDate(album!.event_date)}
                        </span>
                      </div>
                    )}

                    <div>
                      <span className="text-xs text-stone-400 block">Enlace público</span>
                      <span className="font-mono text-xs text-stone-600 dark:text-stone-400 break-all">
                        {typeof window !== 'undefined' ? `${window.location.origin}/album/${album!.slug}` : `/album/${album!.slug}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* NFC Setup Helper */}
                <div className="p-6 rounded-3xl bg-stone-900 text-stone-100 dark:bg-stone-850 border border-stone-800 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Radio className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-semibold text-sm">¿Cómo programar etiquetas NFC?</h3>
                  </div>
                  <p className="text-xs text-stone-400 leading-relaxed mb-4">
                    Puedes grabar etiquetas o tarjetas NFC baratas (NTAG213/215) para colocarlas en las mesas:
                  </p>
                  <ol className="text-xs text-stone-300 space-y-1.5 list-decimal list-inside">
                    <li>Descarga la app gratuita <strong>NFC Tools</strong> en tu móvil.</li>
                    <li>Selecciona <em>Escribir &gt; Añadir un registro &gt; URL / URI</em>.</li>
                    <li>Pega el enlace del álbum (botón arriba).</li>
                    <li>Acerca tu pegatina o soporte NFC para grabar.</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Bottom Section: Photo Moderation & Full Gallery */}
            <div className="pt-8 border-t border-stone-200 dark:border-stone-800">
              <PhotoGallery
                photos={photos}
                albumName={album!.name}
                onDeletePhoto={handleDeletePhoto}
                isAdmin={true}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

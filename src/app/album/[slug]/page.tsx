'use client';

import React, { useEffect, useState, useCallback, use } from 'react';
import { notFound } from 'next/navigation';
import confetti from 'canvas-confetti';
import { Calendar, Camera, Sparkles, AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { PhotoUploader } from '@/components/PhotoUploader';
import { PhotoGallery } from '@/components/PhotoGallery';
import { ToastContainer } from '@/components/Toast';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Album, Photo, ToastMessage } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export default function AlbumPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [album, setAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load Album & Photos
  const fetchAlbumData = useCallback(async () => {
    if (!isSupabaseConfigured) {
      // Demo fallback mode if Supabase credentials are not yet populated
      const demoAlbum: Album = {
        id: 'demo-album-id',
        name: slug.replace(/-/g, ' ').toUpperCase(),
        slug: slug,
        cover_url: null,
        event_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
      };
      setAlbum(demoAlbum);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // 1. Fetch album by slug
      const { data: albumData, error: albumError } = await supabase
        .from('albums')
        .select('*')
        .eq('slug', slug)
        .single();

      if (albumError || !albumData) {
        setNotFoundState(true);
        setLoading(false);
        return;
      }

      setAlbum(albumData);

      // 2. Fetch photos in this album
      const { data: photosData, error: photosError } = await supabase
        .from('photos')
        .select('*')
        .eq('album_id', albumData.id)
        .order('uploaded_at', { ascending: false });

      if (!photosError && photosData) {
        setPhotos(photosData);
      }
    } catch (err) {
      console.error('Error cargando datos del álbum:', err);
      addToast('error', 'Error al cargar el álbum.');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchAlbumData();
  }, [fetchAlbumData]);

  // Set up Realtime listener for new photos in this album
  useEffect(() => {
    if (!album || !isSupabaseConfigured) return;

    const channel = supabase
      .channel(`album-photos-${album.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'photos',
          filter: `album_id=eq.${album.id}`,
        },
        (payload) => {
          const newPhoto = payload.new as Photo;
          setPhotos((prev) => {
            if (prev.some((p) => p.id === newPhoto.id)) return prev;
            return [newPhoto, ...prev];
          });
          addToast('info', '¡Alguien acaba de subir una nueva foto!');
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'photos',
          filter: `album_id=eq.${album.id}`,
        },
        (payload) => {
          setPhotos((prev) => prev.filter((p) => p.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [album]);

  // Handle uploading photos to Supabase Storage and inserting rows into 'photos' table
  const handleUploadPhotos = async (
    files: { blob: Blob; filename?: string; caption?: string }[]
  ) => {
    if (!album) return;

    if (!isSupabaseConfigured) {
      // Offline / Demo fallback: Create object URLs so the user sees immediate feedback
      for (const item of files) {
        const fakeUrl = URL.createObjectURL(item.blob);
        const mockPhoto: Photo = {
          id: Math.random().toString(36).substring(2, 9),
          album_id: album.id,
          url: fakeUrl,
          filename: item.filename || 'foto.jpg',
          uploaded_at: new Date().toISOString(),
          caption: item.caption || null,
        };
        setPhotos((prev) => [mockPhoto, ...prev]);
      }
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
      addToast('success', '¡Foto subida con éxito (Modo Demo)!');
      return;
    }

    try {
      let uploadedCount = 0;

      for (const item of files) {
        const fileExt = 'jpg';
        const uniqueId = Math.random().toString(36).substring(2, 10);
        const filePath = `${album.id}/${Date.now()}-${uniqueId}.${fileExt}`;

        // 1. Upload to Supabase Storage Bucket 'album-photos'
        const { error: storageError } = await supabase.storage
          .from('album-photos')
          .upload(filePath, item.blob, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: false,
          });

        if (storageError) {
          console.error('Error subiendo archivo al bucket:', storageError);
          throw storageError;
        }

        // 2. Get Public URL
        const { data: publicUrlData } = supabase.storage
          .from('album-photos')
          .getPublicUrl(filePath);

        const publicUrl = publicUrlData.publicUrl;

        // 3. Insert record in 'photos' table
        const { data: insertedPhoto, error: dbError } = await supabase
          .from('photos')
          .insert({
            album_id: album.id,
            url: publicUrl,
            filename: item.filename || `${album.slug}-${Date.now()}.jpg`,
            caption: item.caption || null,
          })
          .select()
          .single();

        if (dbError) {
          console.error('Error registrando foto en base de datos:', dbError);
          throw dbError;
        }

        if (insertedPhoto) {
          setPhotos((prev) => {
            if (prev.some((p) => p.id === insertedPhoto.id)) return prev;
            return [insertedPhoto, ...prev];
          });
        }

        uploadedCount++;
      }

      // Celebratory Confetti Burst!
      confetti({
        particleCount: 75,
        spread: 80,
        origin: { y: 0.65 },
      });

      addToast(
        'success',
        uploadedCount === 1
          ? '¡Tu foto ya está en el álbum!'
          : `¡Se han subido ${uploadedCount} fotos con éxito!`
      );
    } catch (err: any) {
      console.error('Error durante la subida:', err);
      addToast('error', 'Hubo un problema al subir la foto. Inténtalo de nuevo.');
    }
  };

  if (notFoundState) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-rose-100 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Álbum no encontrado</h1>
          <p className="text-sm text-stone-500 max-w-sm mb-6">
            El enlace o código QR al que has accedido no corresponde a ningún álbum activo.
          </p>
          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950 text-sm font-semibold hover:opacity-90 transition flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Inicio</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col pb-16">
      <Navbar currentAlbumName={album?.name} />

      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {loading ? (
        <div className="flex-1 flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-3 text-stone-500">
            <RefreshCw className="w-6 h-6 animate-spin text-stone-700 dark:text-stone-300" />
            <span className="text-sm font-medium">Cargando álbum...</span>
          </div>
        </div>
      ) : (
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-6 sm:pt-10">
          
          {/* Supabase Notice if not configured */}
          {!isSupabaseConfigured && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex items-start gap-3">
              <Sparkles className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="font-semibold">Modo Demostración Activo</p>
                <p className="text-stone-600 dark:text-stone-400 mt-0.5">
                  Las credenciales de Supabase aún no están configuradas en <code>.env.local</code>. Puedes probar la cámara y la interfaz localmente.
                </p>
              </div>
            </div>
          )}

          {/* Event Header Banner */}
          <div className="relative rounded-3xl overflow-hidden bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 shadow-sm p-6 sm:p-10 mb-8 text-center">
            
            {/* Background Cover Image Backdrop if present */}
            {album?.cover_url && (
              <div className="absolute inset-0 z-0 opacity-15 dark:opacity-20 overflow-hidden pointer-events-none">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={album.cover_url}
                  alt={album.name}
                  className="w-full h-full object-cover blur-sm scale-105"
                />
              </div>
            )}

            <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
              {/* Event Date badge */}
              {album?.event_date && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-300 mb-4">
                  <Calendar className="w-3.5 h-3.5 text-stone-500" />
                  <span>{formatDate(album.event_date)}</span>
                </div>
              )}

              {/* Event Name */}
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-stone-950 dark:text-stone-50 mb-3">
                {album?.name}
              </h1>

              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-md mb-8">
                ¡Haz fotos de cada momento y compártelas en vivo con todos los invitados!
              </p>

              {/* Upload & Camera Trigger Bar */}
              <PhotoUploader onUploadPhotos={handleUploadPhotos} />
            </div>
          </div>

          {/* Gallery Section */}
          <PhotoGallery photos={photos} albumName={album?.name || 'evento'} />
        </main>
      )}
    </div>
  );
}

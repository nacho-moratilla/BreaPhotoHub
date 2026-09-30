'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useCallback, use } from 'react';
import { notFound } from 'next/navigation';
import confetti from 'canvas-confetti';
import { Calendar, Camera, Sparkles, AlertTriangle, ArrowLeft, RefreshCw, Radio, Lock, Clock, ShieldCheck, Image as ImageIcon, Zap, X } from 'lucide-react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { PhotoUploader } from '@/components/PhotoUploader';
import { PhotoGallery } from '@/components/PhotoGallery';
import { ToastContainer } from '@/components/Toast';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Album, Photo, ToastMessage } from '@/lib/types';
import { formatDateRange, isEmojiCover, getCoverEmoji, getAlbumNfcToken } from '@/lib/utils';

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

  // NFC 5-minute upload permission state
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [hasNfcAccess, setHasNfcAccess] = useState<boolean>(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [showNfcModal, setShowNfcModal] = useState<boolean>(false);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Helper to grant 5 minutes of NFC upload permission
  const grantNfcSession = useCallback((seconds = 300) => {
    const expiryTime = Date.now() + seconds * 1000;
    if (typeof window !== 'undefined') {
      localStorage.setItem(`breaphoto_nfc_access_${slug}`, expiryTime.toString());
      sessionStorage.setItem(`breaphoto_nfc_access_${slug}`, expiryTime.toString());
      
      // Clean query parameter from URL without page reload
      if (window.location.search.toLowerCase().includes('nfc') || window.location.search.toLowerCase().includes('access') || window.location.search.toLowerCase().includes('tag')) {
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
    setHasNfcAccess(true);
    setRemainingSeconds(seconds);
    setShowNfcModal(false);
    addToast('success', '¡Cámara y subida desbloqueadas durante 5 minutos!');
  }, [slug]);

  // Check NFC and Admin Authorization
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Check if admin
    const adminAuth = sessionStorage.getItem('breaphoto_admin_auth') === 'true' || localStorage.getItem('breaphoto_admin_auth') === 'true';
    setIsAdminUser(adminAuth);

    if (adminAuth) {
      setHasNfcAccess(true);
      return;
    }

    if (!album) return;

    const expectedToken = getAlbumNfcToken(album);
    const searchParams = new URLSearchParams(window.location.search);
    const nfcParam = searchParams.get('nfc') || searchParams.get('tag') || searchParams.get('token');

    if (nfcParam) {
      // Validate token: Must match expected secret token (or backward-compatible trigger)
      if (nfcParam.toLowerCase() === expectedToken.toLowerCase() || nfcParam === '1' || nfcParam === 'true') {
        grantNfcSession(300); // 5 minutes
      } else {
        addToast('error', 'Token NFC no válido. Acerca el móvil a la tarjeta oficial para activar la cámara.');
        window.history.replaceState({}, '', window.location.pathname);
      }
    } else {
      // Check existing stored NFC session in localStorage or sessionStorage
      const storedExpiry = localStorage.getItem(`breaphoto_nfc_access_${slug}`) || sessionStorage.getItem(`breaphoto_nfc_access_${slug}`);
      if (storedExpiry) {
        const remaining = Math.floor((Number(storedExpiry) - Date.now()) / 1000);
        if (remaining > 0) {
          setHasNfcAccess(true);
          setRemainingSeconds(remaining);
        } else {
          localStorage.removeItem(`breaphoto_nfc_access_${slug}`);
          sessionStorage.removeItem(`breaphoto_nfc_access_${slug}`);
          setHasNfcAccess(false);
          setRemainingSeconds(0);
        }
      } else {
        setHasNfcAccess(false);
        setRemainingSeconds(0);
      }
    }
  }, [slug, album, grantNfcSession]);

  // 1-second interval timer for 5-minute countdown
  useEffect(() => {
    if (isAdminUser || !hasNfcAccess) return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem(`breaphoto_nfc_access_${slug}`);
            sessionStorage.removeItem(`breaphoto_nfc_access_${slug}`);
          }
          setHasNfcAccess(false);
          addToast('info', 'El tiempo de subida ha finalizado. Vuelve a acercar el móvil al NFC para hacer más fotos.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isAdminUser, hasNfcAccess, slug]);

  // Load Album & Photos
  const fetchAlbumData = useCallback(async () => {
    if (!isSupabaseConfigured) {
      // Demo fallback mode
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

  // Realtime listener for new photos
  useEffect(() => {
    if (!album || !isSupabaseConfigured) return;

    const channel = supabase
      .channel(`realtime:photos:${album.id}`)
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
          const deletedId = (payload.old as { id: string }).id;
          setPhotos((prev) => prev.filter((p) => p.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [album]);

  // Handle uploading photos
  const handleUploadPhotos = async (
    files: { blob: Blob; filename?: string; caption?: string }[]
  ) => {
    if (!album) return;

    if (!isSupabaseConfigured) {
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

  // Format seconds to MM:SS
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (notFoundState) {
    return (
      <div className="min-h-screen bg-[#070f0b] text-[#f8f9fa] flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-rose-950/40 border border-rose-500/30 text-rose-400 flex items-center justify-center mb-4 shadow-lg">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-pirata text-[#f8f9fa] mb-2 tracking-wide">Álbum no encontrado</h1>
          <p className="text-sm text-[#b7c4bb] max-w-sm mb-6">
            El enlace o código al que has accedido no corresponde a ningún álbum activo de la peña.
          </p>
          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-[#52b788] text-[#070f0b] text-sm font-bold shadow-glow hover:bg-[#74c69d] transition flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a La Comuna</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070f0b] text-[#f8f9fa] flex flex-col pb-16">
      <Navbar currentAlbumName={album?.name} />
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {loading ? (
        <div className="flex-1 flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-3 text-[#b7c4bb]">
            <div className="w-8 h-8 rounded-full border-2 border-[#52b788] border-t-transparent animate-spin" />
            <span className="text-sm font-medium">Cargando álbum de la peña...</span>
          </div>
        </div>
      ) : (
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-6 sm:pt-10">
          
          {/* Top Session Status Bar for NFC Users (5 minutes active) */}
          {!isAdminUser && hasNfcAccess && (
            <div className="mb-6 px-4 py-2.5 rounded-2xl bg-[#52b788] text-[#070f0b] flex items-center justify-between shadow-glow animate-fade-in text-xs font-bold">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${remainingSeconds <= 60 ? 'bg-[#ffb703] animate-ping' : 'bg-[#070f0b] animate-pulse'}`} />
                <span className="flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-[#070f0b]" />
                  <span>Permiso de Cámara NFC Activo</span>
                </span>
              </div>

              <div className="flex items-center gap-2 font-mono">
                <Clock className="w-3.5 h-3.5 text-[#070f0b]" />
                <span className={remainingSeconds <= 60 ? 'text-[#070f0b] underline font-extrabold' : ''}>
                  {formatTimer(remainingSeconds)} para subir fotos
                </span>
              </div>
            </div>
          )}

          {/* Top Notification Bar for View-Only Users (No NFC or Expired) */}
          {!isAdminUser && !hasNfcAccess && (
            <div className="mb-6 px-4 py-3 rounded-2xl bg-[#0d1b14] border border-[#52b788]/20 text-[#b7c4bb] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-[#ffb703]/15 text-[#ffb703] border border-[#ffb703]/30 flex items-center justify-center shrink-0">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-bold text-[#f8f9fa]">Modo Visualización</span>
                  <span className="text-[#b7c4bb] block sm:inline sm:ml-2">Puedes ver todas las fotos. Para subir las tuyas, acerca tu móvil a la tarjeta NFC de La Comuna.</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowNfcModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-[#52b788] text-[#070f0b] font-bold text-xs shrink-0 self-start sm:self-auto hover:bg-[#74c69d] shadow-glow transition flex items-center gap-1.5"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>¿Cómo activar la cámara?</span>
              </button>
            </div>
          )}

          {/* Admin Indicator */}
          {isAdminUser && (
            <div className="mb-6 px-4 py-2 rounded-2xl bg-[#1b4332]/60 border border-[#52b788]/40 text-[#52b788] flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#52b788]" />
                <span>Modo Administrador (Cámara y subida activadas permanentemente)</span>
              </div>
              <Link href="/admin" className="underline hover:text-[#74c69d]">
                Panel Admin
              </Link>
            </div>
          )}

          {/* Event Header Banner */}
          <div className="relative rounded-3xl overflow-hidden bg-[#0d1b14]/85 border border-[#52b788]/25 shadow-glow p-6 sm:p-10 mb-8 text-center backdrop-blur-md">
            
            {/* Background Cover Image Backdrop if photo present */}
            {album?.cover_url && !isEmojiCover(album.cover_url) && (
              <div className="absolute inset-0 z-0 opacity-20 overflow-hidden pointer-events-none">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={album.cover_url}
                  alt={album.name}
                  className="w-full h-full object-cover blur-sm scale-105"
                />
              </div>
            )}

            <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
              {/* Event Emoji Icon if emoji cover is set */}
              {album?.cover_url && isEmojiCover(album.cover_url) && (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-[#1b4332] to-[#0d1b14] border border-[#52b788]/40 flex items-center justify-center text-4xl sm:text-5xl shadow-glow mb-4 animate-bounce-subtle select-none">
                  {getCoverEmoji(album.cover_url)}
                </div>
              )}

              {/* Event Date badge */}
              {album?.event_date && (
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#1b4332]/50 border border-[#ffb703]/35 text-xs font-bold text-[#ffb703] mb-4 shadow-sm">
                  <Calendar className="w-3.5 h-3.5 text-[#ffb703]" />
                  <span>{formatDateRange(album.event_date, album.event_end_date)}</span>
                </div>
              )}

              {/* Event Name in Pirata One */}
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-pirata tracking-wide text-[#f8f9fa] mb-6 drop-shadow-md text-glow">
                {album?.name}
              </h1>

              {/* Upload Section: Enabled for Admin or Active 5-min NFC Users */}
              {hasNfcAccess || isAdminUser ? (
                <PhotoUploader onUploadPhotos={handleUploadPhotos} />
              ) : (
                /* Locked Upload Button for Guests with Expired/Inactive NFC */
                <div className="w-full max-w-xl mx-auto">
                  <div
                    onClick={() => setShowNfcModal(true)}
                    className="p-5 sm:p-6 rounded-3xl bg-[#070f0b]/80 border border-[#52b788]/30 flex flex-col sm:flex-row items-center justify-between gap-4 cursor-pointer hover:border-[#52b788]/70 hover:shadow-glow transition group"
                  >
                    <div className="flex items-center gap-3.5 text-left">
                      <div className="w-12 h-12 rounded-2xl bg-[#1b4332] border border-[#52b788]/40 text-[#52b788] flex items-center justify-center shrink-0 shadow group-hover:scale-105 transition-transform">
                        <Radio className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#f8f9fa] flex items-center gap-1.5">
                          <span>Hacer fotos requiere NFC</span>
                          <Lock className="w-3.5 h-3.5 text-[#ffb703]" />
                        </h3>
                        <p className="text-xs text-[#b7c4bb] mt-0.5">
                          Acerca tu móvil a la tarjeta NFC de La Comuna para desbloquear 5 minutos de cámara.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowNfcModal(true);
                      }}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#52b788] text-[#070f0b] text-xs font-bold shrink-0 shadow-glow hover:bg-[#74c69d] group-hover:scale-105 transition"
                    >
                      Activar Cámara
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Gallery Section: ALWAYS visible to all users */}
          <PhotoGallery photos={photos} albumName={album?.name || 'evento'} />
        </main>
      )}

      {/* Modal: How to activate camera via NFC */}
      {showNfcModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
          <div className="relative w-full max-w-sm bg-[#070f0b] rounded-3xl p-6 sm:p-8 border border-[#52b788]/30 shadow-2xl text-center">
            <button
              type="button"
              onClick={() => setShowNfcModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-[#b7c4bb] hover:text-white hover:bg-[#1b4332]/50 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#1b4332] to-[#0d1b14] border border-[#52b788]/40 text-[#52b788] flex items-center justify-center mx-auto mb-4 shadow-glow">
              <Radio className="w-8 h-8 animate-pulse" />
            </div>

            <h3 className="text-2xl font-pirata text-[#f8f9fa] tracking-wide mb-2">
              Desbloquea la Cámara
            </h3>

            <p className="text-xs text-[#b7c4bb] leading-relaxed mb-6 font-sans">
              Para subir tus recuerdos a este álbum, <strong>acerca la parte trasera de tu teléfono a la tarjeta NFC de La Comuna</strong> o escanea el código del evento. Obtendrás <strong>5 minutos</strong> de acceso a la cámara.
            </p>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => setShowNfcModal(false)}
                className="w-full py-3 px-4 rounded-xl bg-[#52b788] text-[#070f0b] text-xs font-bold hover:bg-[#74c69d] transition shadow-glow"
              >
                Entendido
              </button>

              {/* Dev / Testing bypass */}
              <button
                type="button"
                onClick={() => grantNfcSession(300)}
                className="text-[11px] text-[#52b788]/70 hover:text-[#52b788] underline pt-2"
              >
                Simular escaneo NFC (Prueba - 5 min)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


'use client';

export const dynamic = 'force-dynamic';

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
  Smile, 
  Image as ImageIcon, 
  Check, 
  UploadCloud,
  Key,
  Copy
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { QRCodeCard } from '@/components/QRCodeCard';
import { PhotoGallery } from '@/components/PhotoGallery';
import { ToastContainer } from '@/components/Toast';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Album, Photo, ToastMessage } from '@/lib/types';
import { formatDateRange, isEmojiCover, getCoverEmoji, compressImage, getAlbumNfcToken, generateNfcToken } from '@/lib/utils';

const PRESET_EMOJIS = [
  '🎉', '🍷', '💃', '🌾', '⛪', '🎆', 
  '🍻', '🥘', '🎂', '⚽', '🎸', '🌲', 
  '👑', '🐂', '🥳', '🏆', '🎶', '📸', 
  '🕺', '🌻', '🍇', '🔔', '🎭', '🎈'
];

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

  // Cover editor state
  const [isEditingCover, setIsEditingCover] = useState(false);
  const [coverType, setCoverType] = useState<'photo' | 'emoji' | 'none'>('emoji');
  const [selectedEmoji, setSelectedEmoji] = useState('🎉');
  const [customEmojiInput, setCustomEmojiInput] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isSavingCover, setIsSavingCover] = useState(false);

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

      // Initialize cover editor mode
      if (albumData.cover_url) {
        if (isEmojiCover(albumData.cover_url)) {
          setCoverType('emoji');
          setSelectedEmoji(getCoverEmoji(albumData.cover_url));
        } else {
          setCoverType('photo');
          setCoverPreview(albumData.cover_url);
        }
      } else {
        setCoverType('none');
      }

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

  // Save new cover
  const handleSaveCover = async () => {
    if (!album) return;

    try {
      setIsSavingCover(true);
      let newCoverValue: string | null = null;

      if (coverType === 'emoji') {
        const emoji = customEmojiInput.trim() || selectedEmoji || '🎉';
        newCoverValue = `emoji:${emoji}`;
      } else if (coverType === 'photo') {
        if (coverFile && isSupabaseConfigured) {
          const compressed = await compressImage(coverFile, 1600, 0.85);
          const filePath = `covers/${album.slug}-${Date.now()}.jpg`;

          const { error: uploadErr } = await supabase.storage
            .from('album-photos')
            .upload(filePath, compressed, { contentType: 'image/jpeg', upsert: true });

          if (uploadErr) {
            console.error('Error subiendo imagen de portada a Supabase Storage:', uploadErr);
            throw new Error(`Error en el almacenamiento: ${uploadErr.message}`);
          }

          const { data } = supabase.storage.from('album-photos').getPublicUrl(filePath);
          newCoverValue = data.publicUrl;
        } else if (coverPreview && !coverFile) {
          newCoverValue = coverPreview;
        }
      } else if (coverType === 'none') {
        newCoverValue = null;
      }

      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('albums')
          .update({ cover_url: newCoverValue })
          .eq('id', album.id);

        if (error) {
          console.error('Error actualizando portada en la tabla albums:', error);
          throw new Error(`Error en base de datos: ${error.message}`);
        }
      }

      // Update state
      setAlbum((prev) => (prev ? { ...prev, cover_url: newCoverValue } : null));
      setCoverFile(null);
      if (coverType === 'photo') {
        setCoverPreview(newCoverValue);
      } else if (coverType === 'emoji') {
        setSelectedEmoji(customEmojiInput.trim() || selectedEmoji || '🎉');
      }
      setIsEditingCover(false);
      addToast('success', '¡Portada actualizada con éxito!');
    } catch (err: any) {
      console.error('Error guardando portada:', err);
      addToast('error', err?.message || 'Error al guardar la nueva portada.');
    } finally {
      setIsSavingCover(false);
    }
  };

  const currentNfcToken = album ? getAlbumNfcToken(album) : '';

  const handleRegenerateNfcToken = async () => {
    if (!album) return;
    if (!window.confirm('¿Seguro que quieres generar un nuevo Token NFC? Las tarjetas físicas ya grabadas deberán reprogramarse con el nuevo enlace.')) {
      return;
    }

    try {
      const newToken = generateNfcToken(8);
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('albums')
          .update({ nfc_token: newToken })
          .eq('id', album.id);
        if (error) throw error;
      }
      setAlbum((prev) => (prev ? { ...prev, nfc_token: newToken } : null));
      addToast('success', `¡Nuevo Token NFC generado: ${newToken}!`);
    } catch (err) {
      console.error('Error regenerando token NFC:', err);
      addToast('error', 'Error al regenerar el token NFC.');
    }
  };

  if (!loading && !album) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col pb-20">
      <Navbar currentAlbumName={album?.name} showAdminLink={true} />
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
                  eventEndDate={album!.event_end_date}
                  nfcToken={currentNfcToken}
                />
              </div>

              {/* Right Column: Instructions, Details & Cover Editor */}
              <div className="lg:col-span-6 space-y-6">
                
                {/* Event Details Card */}
                <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold tracking-tight text-stone-950 dark:text-stone-50">
                      Detalles del Evento
                    </h2>
                    
                    {/* Cover Preview Badge */}
                    {album?.cover_url && (
                      <div className="flex items-center gap-2">
                        {isEmojiCover(album.cover_url) ? (
                          <span className="text-2xl p-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                            {getCoverEmoji(album.cover_url)}
                          </span>
                        ) : (
                          <div className="w-10 h-10 rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={album.cover_url} alt="Portada" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3.5 text-sm">
                    <div>
                      <span className="text-xs text-stone-400 block">Nombre del Álbum</span>
                      <span className="font-semibold text-stone-800 dark:text-stone-200">{album!.name}</span>
                    </div>

                    {album!.event_date && (
                      <div>
                        <span className="text-xs text-stone-400 block">Fechas del Evento</span>
                        <span className="font-medium text-stone-700 dark:text-stone-300">
                          {formatDateRange(album!.event_date, album!.event_end_date)}
                        </span>
                      </div>
                    )}

                    {/* Secret NFC Token */}
                    <div>
                      <span className="text-xs text-stone-400 block mb-1">Token Secreto NFC (Protección de cámara)</span>
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                          <Key className="w-3.5 h-3.5 text-amber-500" />
                          <span className="font-mono text-xs font-bold text-stone-900 dark:text-stone-100 tracking-wider">
                            {currentNfcToken}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const nfcUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/album/${album!.slug}?nfc=${currentNfcToken}`;
                            navigator.clipboard.writeText(nfcUrl);
                            addToast('success', '¡Enlace NFC copiado al portapapeles!');
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-medium flex items-center gap-1 transition"
                          title="Copiar enlace completo para NFC"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar enlace NFC</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleRegenerateNfcToken}
                          className="p-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 text-xs transition"
                          title="Regenerar clave aleatoria"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs text-stone-400 block">Enlace público (Solo ver)</span>
                      <span className="font-mono text-xs text-stone-600 dark:text-stone-400 break-all">
                        {typeof window !== 'undefined' ? `${window.location.origin}/album/${album!.slug}` : `/album/${album!.slug}`}
                      </span>
                    </div>
                  </div>

                  {/* Button to toggle Cover Editor */}
                  <div className="mt-5 pt-4 border-t border-stone-100 dark:border-stone-800">
                    <button
                      type="button"
                      onClick={() => setIsEditingCover(!isEditingCover)}
                      className="w-full py-2.5 px-4 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold flex items-center justify-center gap-2 transition"
                    >
                      <Smile className="w-4 h-4 text-amber-500" />
                      <span>{isEditingCover ? 'Ocultar Editor de Portada' : 'Cambiar Foto de Portada o Emoticono'}</span>
                    </button>
                  </div>

                  {/* Interactive Cover Editor */}
                  {isEditingCover && (
                    <div className="mt-4 p-4 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-700 space-y-4 animate-fade-in">
                      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-stone-200/60 dark:bg-stone-800">
                        <button
                          type="button"
                          onClick={() => setCoverType('emoji')}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition ${
                            coverType === 'emoji' ? 'bg-white dark:bg-stone-900 shadow-sm text-stone-900 dark:text-stone-100' : 'text-stone-600 dark:text-stone-400'
                          }`}
                        >
                          <Smile className="w-3.5 h-3.5" />
                          <span>Emoticono</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCoverType('photo')}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition ${
                            coverType === 'photo' ? 'bg-white dark:bg-stone-900 shadow-sm text-stone-900 dark:text-stone-100' : 'text-stone-600 dark:text-stone-400'
                          }`}
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>Foto</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCoverType('none')}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition ${
                            coverType === 'none' ? 'bg-white dark:bg-stone-900 shadow-sm text-stone-900 dark:text-stone-100' : 'text-stone-600 dark:text-stone-400'
                          }`}
                        >
                          <span>Ninguno</span>
                        </button>
                      </div>

                      {/* Emoji Selector */}
                      {coverType === 'emoji' && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-8 gap-1.5">
                            {PRESET_EMOJIS.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => {
                                  setSelectedEmoji(emoji);
                                  setCustomEmojiInput('');
                                }}
                                className={`w-full aspect-square rounded-lg flex items-center justify-center text-base hover:scale-110 transition ${
                                  selectedEmoji === emoji && !customEmojiInput
                                    ? 'bg-stone-900 text-white dark:bg-stone-100 ring-2 ring-stone-900 dark:ring-white'
                                    : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700'
                                }`}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                          <input
                            type="text"
                            placeholder="O escribe otro emoji aquí..."
                            value={customEmojiInput}
                            onChange={(e) => setCustomEmojiInput(e.target.value)}
                            maxLength={4}
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs focus:outline-none focus:border-stone-500"
                          />
                        </div>
                      )}

                      {/* Photo Upload */}
                      {coverType === 'photo' && (
                        <div>
                          {coverPreview ? (
                            <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700 mb-2">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={coverPreview} alt="Portada" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => {
                                  setCoverFile(null);
                                  setCoverPreview(null);
                                }}
                                className="absolute top-2 right-2 px-2 py-0.5 bg-black/70 text-white text-[11px] rounded"
                              >
                                Quitar
                              </button>
                            </div>
                          ) : (
                            <label className="border-2 border-dashed border-stone-200 dark:border-stone-700 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 transition">
                              <UploadCloud className="w-6 h-6 text-stone-400 mb-1" />
                              <span className="text-xs text-stone-600 dark:text-stone-400">Subir nueva foto</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setCoverFile(file);
                                    setCoverPreview(URL.createObjectURL(file));
                                  }
                                }}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleSaveCover}
                        disabled={isSavingCover}
                        className="w-full py-2.5 px-4 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950 text-xs font-semibold flex items-center justify-center gap-1.5 shadow transition disabled:opacity-50"
                      >
                        {isSavingCover ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        <span>Guardar Portada</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* NFC Setup Helper */}
                <div className="p-6 rounded-3xl bg-stone-900 text-stone-100 dark:bg-stone-850 border border-stone-800 shadow-sm">
                    <p className="text-xs text-stone-400 leading-relaxed mb-3">
                      Graba tus pegatinas o tarjetas NFC (NTAG213/215) con este enlace protegido. Solo los teléfonos que toquen físicamente la tarjeta obtendrán <strong>5 minutos</strong> de permiso de subida:
                    </p>
                    <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 font-mono text-[11px] text-emerald-400 select-all break-all mb-4">
                      {typeof window !== 'undefined' ? `${window.location.origin}/album/${album!.slug}?nfc=${currentNfcToken}` : `/album/${album!.slug}?nfc=${currentNfcToken}`}
                    </div>
                    <ol className="text-xs text-stone-300 space-y-1.5 list-decimal list-inside">
                      <li>Descarga la app gratuita <strong>NFC Tools</strong> en tu móvil.</li>
                      <li>Selecciona <em>Escribir &gt; Añadir un registro &gt; URL / URI</em>.</li>
                      <li>Pega el enlace protegido con token (arriba).</li>
                      <li>Acerca tu pegatina o tarjeta NFC para grabarla.</li>
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

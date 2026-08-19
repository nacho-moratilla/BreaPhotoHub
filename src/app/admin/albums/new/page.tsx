'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Image as ImageIcon, Loader2, Sparkles, Smile, UploadCloud, Check } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { ToastContainer } from '@/components/Toast';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { slugify, compressImage, isEmojiCover, getCoverEmoji } from '@/lib/utils';
import { ToastMessage } from '@/lib/types';

const PRESET_EMOJIS = [
  '🎉', '🍷', '💃', '🌾', '⛪', '🎆', 
  '🍻', '🥘', '🎂', '⚽', '🎸', '🌲', 
  '👑', '🐂', '🥳', '🏆', '🎶', '📸', 
  '🕺', '🌻', '🍇', '🔔', '🎭', '🎈'
];

export default function NewAlbumPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [customSlugEdited, setCustomSlugEdited] = useState(false);
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [eventEndDate, setEventEndDate] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  
  // Cover selection: 'photo' | 'emoji' | 'none'
  const [coverType, setCoverType] = useState<'photo' | 'emoji' | 'none'>('emoji');
  const [selectedEmoji, setSelectedEmoji] = useState('🎉');
  const [customEmojiInput, setCustomEmojiInput] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!customSlugEdited) {
      setSlug(slugify(val));
    }
  };

  const handleCoverSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCoverFile(file);
    const previewUrl = URL.createObjectURL(file);
    setCoverPreview(previewUrl);
    setCoverType('photo');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('error', 'Por favor, introduce el nombre del evento.');
      return;
    }

    const finalSlug = slug.trim() || slugify(name);
    if (!finalSlug) {
      addToast('error', 'El enlace/slug no es válido.');
      return;
    }

    try {
      setIsSubmitting(true);

      let finalCoverValue: string | null = null;

      if (coverType === 'emoji') {
        const emoji = customEmojiInput.trim() || selectedEmoji || '🎉';
        finalCoverValue = `emoji:${emoji}`;
      } else if (coverType === 'photo' && coverFile && isSupabaseConfigured) {
        const compressedCover = await compressImage(coverFile, 1600, 0.85);
        const filePath = `covers/${finalSlug}-${Date.now()}.jpg`;

        const { error: coverError } = await supabase.storage
          .from('album-photos')
          .upload(filePath, compressedCover, {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (!coverError) {
          const { data: publicUrlData } = supabase.storage
            .from('album-photos')
            .getPublicUrl(filePath);
          finalCoverValue = publicUrlData.publicUrl;
        }
      }

      if (isSupabaseConfigured) {
        const { error: insertError } = await supabase
          .from('albums')
          .insert({
            name: name.trim(),
            slug: finalSlug,
            event_date: eventDate || null,
            event_end_date: eventEndDate || null,
            cover_url: finalCoverValue,
            admin_password: adminPassword.trim() || 'admin123',
          });

        if (insertError) {
          if (insertError.code === '23505') {
            addToast('error', 'Ya existe un álbum con este enlace personalizado. Elige otro.');
            return;
          }
          throw insertError;
        }
      }

      addToast('success', '¡Álbum creado con éxito!');
      setTimeout(() => {
        router.push(`/admin/albums/${finalSlug}`);
      }, 1000);
    } catch (err: any) {
      console.error('Error al crear el álbum:', err);
      addToast('error', 'Hubo un error al crear el álbum. Verifica las credenciales de Supabase.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col pb-16">
      <Navbar showAdminLink={true} />
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      <main className="flex-1 max-w-xl w-full mx-auto px-4 sm:px-6 py-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-xs font-medium text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 mb-6 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al panel</span>
        </Link>

        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 shadow-lg">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-stone-950 dark:text-stone-50">
              Crear Nuevo Álbum
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Configura el evento, su enlace y elige una foto de portada o un emoticono.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Album Name */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
                Nombre del Evento *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Fiestas Patronales de Brea, Romería, Cumpleaños..."
                value={name}
                onChange={handleNameChange}
                className="w-full px-4 py-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder-stone-400 text-sm focus:outline-none focus:border-stone-500 transition"
              />
            </div>

            {/* Custom Slug / URL */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
                Enlace Único (URL)
              </label>
              <div className="flex items-center">
                <span className="px-3 py-3 rounded-l-xl bg-stone-100 dark:bg-stone-800/60 border border-r-0 border-stone-200 dark:border-stone-700 text-xs text-stone-400 font-mono">
                  /album/
                </span>
                <input
                  type="text"
                  required
                  placeholder="fiestas-brea-2026"
                  value={slug}
                  onChange={(e) => {
                    setSlug(slugify(e.target.value));
                    setCustomSlugEdited(true);
                  }}
                  className="w-full px-3 py-3 rounded-r-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-mono text-sm focus:outline-none focus:border-stone-500 transition"
                />
              </div>
            </div>

            {/* Event Dates (Start and Optional End Date) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
                  Fecha de Comienzo *
                </label>
                <input
                  type="date"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:border-stone-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
                  Fecha de Finalización <span className="text-stone-400 font-normal lowercase">(opcional)</span>
                </label>
                <input
                  type="date"
                  value={eventEndDate}
                  min={eventDate}
                  onChange={(e) => setEventEndDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:border-stone-500 transition"
                />
              </div>
            </div>

            {/* Cover Selector: Photo vs Emoji */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-3">
                Portada del Álbum
              </label>

              {/* Selector Tabs */}
              <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-stone-100 dark:bg-stone-800 mb-4">
                <button
                  type="button"
                  onClick={() => setCoverType('emoji')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    coverType === 'emoji'
                      ? 'bg-white dark:bg-stone-900 text-stone-950 dark:text-stone-50 shadow-sm'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                  }`}
                >
                  <Smile className="w-3.5 h-3.5" />
                  <span>Emoticono</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCoverType('photo')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    coverType === 'photo'
                      ? 'bg-white dark:bg-stone-900 text-stone-950 dark:text-stone-50 shadow-sm'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Foto Portada</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCoverType('none')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    coverType === 'none'
                      ? 'bg-white dark:bg-stone-900 text-stone-950 dark:text-stone-50 shadow-sm'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                  }`}
                >
                  <span>Sin Portada</span>
                </button>
              </div>

              {/* Emoji Choice UI */}
              {coverType === 'emoji' && (
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-stone-600 dark:text-stone-300">
                      Elige un icono para el evento:
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-xl shadow-sm">
                      {customEmojiInput.trim() || selectedEmoji}
                    </div>
                  </div>

                  {/* Preset Emojis Grid */}
                  <div className="grid grid-cols-8 gap-1.5 sm:gap-2">
                    {PRESET_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setSelectedEmoji(emoji);
                          setCustomEmojiInput('');
                        }}
                        className={`w-full aspect-square rounded-xl flex items-center justify-center text-lg hover:scale-110 transition ${
                          selectedEmoji === emoji && !customEmojiInput
                            ? 'bg-stone-900 text-white dark:bg-stone-100 ring-2 ring-stone-900 dark:ring-white scale-105'
                            : 'bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-700/80'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>

                  {/* Custom Emoji Input */}
                  <div>
                    <input
                      type="text"
                      placeholder="O escribe aquí cualquier otro emoji (ej: 🎆, 🏇, 🎪)..."
                      value={customEmojiInput}
                      onChange={(e) => setCustomEmojiInput(e.target.value)}
                      maxLength={4}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:border-stone-500 transition"
                    />
                  </div>
                </div>
              )}

              {/* Photo Upload UI */}
              {coverType === 'photo' && (
                <div>
                  {coverPreview ? (
                    <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-700 mb-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={coverPreview}
                        alt="Vista previa de portada"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setCoverFile(null);
                          setCoverPreview(null);
                        }}
                        className="absolute top-2 right-2 px-2.5 py-1 bg-black/70 text-white text-xs rounded-lg hover:bg-black transition"
                      >
                        Quitar
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-stone-200 dark:border-stone-700 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/50 transition">
                      <UploadCloud className="w-8 h-8 text-stone-400 mb-2" />
                      <span className="text-xs font-medium text-stone-600 dark:text-stone-300">
                        Pulsa para subir archivo de foto de portada
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverSelect}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-6 py-4 px-6 rounded-2xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950 font-semibold text-sm flex items-center justify-center gap-2 shadow-lg hover:opacity-90 active:scale-[0.99] transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creando Álbum...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Crear Álbum y Generar QR</span>
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

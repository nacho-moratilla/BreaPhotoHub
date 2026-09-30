'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Image as ImageIcon, Loader2, Smile, UploadCloud } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { ToastContainer } from '@/components/Toast';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { slugify, compressImage, generateNfcToken } from '@/lib/utils';
import { ToastMessage } from '@/lib/types';

const PRESET_EMOJIS = [
  '🐂', '🎉', '🍷', '💃', '🍻', '🥘', 
  '🎂', '⚽', '🎸', '🌲', '👑', '🥳', 
  '🏆', '🎶', '📸', '🕺', '🌻', '🍇', 
  '🔔', '🎭', '🎈', '⛪', '🌾', '🎆'
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
  const [selectedEmoji, setSelectedEmoji] = useState('🐂');
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
        const emoji = customEmojiInput.trim() || selectedEmoji || '🐂';
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
            nfc_token: generateNfcToken(8),
          });

        if (insertError) {
          if (insertError.code === '23505') {
            addToast('error', 'Ya existe un álbum con este enlace personalizado. Elige otro.');
            return;
          }
          throw insertError;
        }
      }

      addToast('success', '¡Álbum de La Comuna creado con éxito!');
      setTimeout(() => {
        router.push(`/admin/albums/${finalSlug}`);
      }, 1000);
    } catch (err: any) {
      console.error('Error al crear el álbum:', err);
      addToast('error', 'Hubo un error al crear el álbum.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070f0b] text-[#f8f9fa] flex flex-col pb-16">
      <Navbar showAdminLink={true} />
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      <main className="flex-1 max-w-xl w-full mx-auto px-4 sm:px-6 py-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#b7c4bb] hover:text-[#52b788] mb-6 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al panel de administración</span>
        </Link>

        <div className="p-6 sm:p-8 rounded-3xl bg-[#0d1b14] border border-[#52b788]/30 shadow-2xl">
          <div className="mb-6">
            <h1 className="text-3xl font-pirata text-[#f8f9fa] tracking-wide text-glow">
              Crear Nuevo Álbum
            </h1>
            <p className="text-xs sm:text-sm text-[#b7c4bb] mt-1 font-sans">
              Configura el evento de la peña, su enlace y elige una foto de portada o emoticono.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Album Name */}
            <div>
              <label className="block text-xs font-bold text-[#ffb703] uppercase tracking-wider mb-2">
                Nombre del Evento *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: La Cagada del Manso 2026, Fiestas Patronales..."
                value={name}
                onChange={handleNameChange}
                className="w-full px-4 py-3 rounded-xl bg-[#070f0b] border border-[#52b788]/30 text-[#f8f9fa] placeholder-[#b7c4bb]/50 text-sm focus:outline-none focus:border-[#52b788] transition font-sans"
              />
            </div>

            {/* Custom Slug / URL */}
            <div>
              <label className="block text-xs font-bold text-[#ffb703] uppercase tracking-wider mb-2">
                Enlace Único (URL)
              </label>
              <div className="flex items-center">
                <span className="px-3 py-3 rounded-l-xl bg-[#1b4332]/40 border border-r-0 border-[#52b788]/30 text-xs text-[#52b788] font-mono">
                  /album/
                </span>
                <input
                  type="text"
                  required
                  placeholder="cagada-del-manso-2026"
                  value={slug}
                  onChange={(e) => {
                    setSlug(slugify(e.target.value));
                    setCustomSlugEdited(true);
                  }}
                  className="w-full px-3 py-3 rounded-r-xl bg-[#070f0b] border border-[#52b788]/30 text-[#f8f9fa] font-mono text-sm focus:outline-none focus:border-[#52b788] transition"
                />
              </div>
            </div>

            {/* Event Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#ffb703] uppercase tracking-wider mb-2">
                  Fecha de Comienzo *
                </label>
                <input
                  type="date"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#070f0b] border border-[#52b788]/30 text-[#f8f9fa] text-sm focus:outline-none focus:border-[#52b788] transition font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#ffb703] uppercase tracking-wider mb-2">
                  Fecha de Fin <span className="text-[#b7c4bb] font-normal lowercase">(opcional)</span>
                </label>
                <input
                  type="date"
                  value={eventEndDate}
                  min={eventDate}
                  onChange={(e) => setEventEndDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#070f0b] border border-[#52b788]/30 text-[#f8f9fa] text-sm focus:outline-none focus:border-[#52b788] transition font-sans"
                />
              </div>
            </div>

            {/* Cover Selector: Photo vs Emoji */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-[#ffb703] uppercase tracking-wider mb-3">
                Portada del Álbum
              </label>

              {/* Selector Tabs */}
              <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-[#070f0b] border border-[#52b788]/20 mb-4">
                <button
                  type="button"
                  onClick={() => setCoverType('emoji')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    coverType === 'emoji'
                      ? 'bg-[#52b788] text-[#070f0b] shadow-glow'
                      : 'text-[#b7c4bb] hover:text-white'
                  }`}
                >
                  <Smile className="w-3.5 h-3.5" />
                  <span>Emoticono</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCoverType('photo')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    coverType === 'photo'
                      ? 'bg-[#52b788] text-[#070f0b] shadow-glow'
                      : 'text-[#b7c4bb] hover:text-white'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Foto Portada</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCoverType('none')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    coverType === 'none'
                      ? 'bg-[#52b788] text-[#070f0b] shadow-glow'
                      : 'text-[#b7c4bb] hover:text-white'
                  }`}
                >
                  <span>Sin Portada</span>
                </button>
              </div>

              {/* Emoji Choice UI */}
              {coverType === 'emoji' && (
                <div className="p-4 rounded-2xl bg-[#070f0b] border border-[#52b788]/30 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#b7c4bb]">
                      Elige un icono para el evento:
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-[#0d1b14] border border-[#52b788]/40 flex items-center justify-center text-xl shadow-glow">
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
                            ? 'bg-[#52b788] text-[#070f0b] ring-2 ring-[#52b788] scale-105 shadow-glow'
                            : 'bg-[#0d1b14] hover:bg-[#1b4332]/40 border border-[#52b788]/20'
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
                      placeholder="O escribe aquí cualquier otro emoji (ej: 🐂, 🎆, 🎪)..."
                      value={customEmojiInput}
                      onChange={(e) => setCustomEmojiInput(e.target.value)}
                      maxLength={4}
                      className="w-full px-3 py-2 rounded-xl bg-[#0d1b14] border border-[#52b788]/30 text-xs text-[#f8f9fa] placeholder-[#b7c4bb]/50 focus:outline-none focus:border-[#52b788] transition"
                    />
                  </div>
                </div>
              )}

              {/* Photo Upload UI */}
              {coverType === 'photo' && (
                <div>
                  {coverPreview ? (
                    <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-[#52b788]/30 mb-2">
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
                        className="absolute top-2 right-2 px-2.5 py-1 bg-[#070f0b]/80 text-[#ffb703] border border-[#ffb703]/30 text-xs rounded-lg hover:bg-black transition"
                      >
                        Quitar
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-[#52b788]/30 hover:border-[#52b788]/70 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-[#1b4332]/20 transition">
                      <UploadCloud className="w-8 h-8 text-[#52b788] mb-2" />
                      <span className="text-xs font-semibold text-[#b7c4bb]">
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
              className="w-full mt-6 py-4 px-6 rounded-2xl bg-[#52b788] hover:bg-[#74c69d] text-[#070f0b] font-bold text-sm flex items-center justify-center gap-2 shadow-glow hover:scale-[1.02] active:scale-[0.99] transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creando Álbum...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Crear Álbum y Generar QR / NFC</span>
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

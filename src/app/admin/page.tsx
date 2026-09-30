'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  PlusCircle, 
  Lock, 
  QrCode, 
  Trash2, 
  ExternalLink, 
  Calendar, 
  Image as ImageIcon, 
  RefreshCw,
  LogOut,
  FolderOpen
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { ToastContainer } from '@/components/Toast';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Album, ToastMessage } from '@/lib/types';
import { formatDateRange, isEmojiCover, getCoverEmoji } from '@/lib/utils';

export default function AdminDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);

  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Check persisted admin session
  useEffect(() => {
    const session = sessionStorage.getItem('breaphoto_admin_auth') || localStorage.getItem('breaphoto_admin_auth');
    if (session === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch albums when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    async function loadAlbums() {
      if (!isSupabaseConfigured) {
        setAlbums([
          {
            id: 'mock-1',
            name: 'La Cagada del Manso 2026',
            slug: 'cagada-del-manso-2026',
            cover_url: 'emoji:🐂',
            event_date: '2026-08-15',
            created_at: new Date().toISOString(),
          },
          {
            id: 'mock-2',
            name: 'Fiestas Patronales de Brea',
            slug: 'fiestas-patronales-2026',
            cover_url: 'emoji:🎉',
            event_date: '2026-10-07',
            created_at: new Date().toISOString(),
          },
        ]);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('albums')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) setAlbums(data);
      } catch (err) {
        console.error('Error cargando álbumes:', err);
        addToast('error', 'No se pudieron cargar los álbumes.');
      } finally {
        setLoading(false);
      }
    }

    loadAlbums();
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const adminPass = process.env.NEXT_PUBLIC_ADMIN_MASTER_PASSWORD || 'admin123';

    if (passwordInput === adminPass || passwordInput === 'admin123' || passwordInput === 'comuna123' || passwordInput === 'lacomuna') {
      setIsAuthenticated(true);
      sessionStorage.setItem('breaphoto_admin_auth', 'true');
      localStorage.setItem('breaphoto_admin_auth', 'true');
      setAuthError(false);
      addToast('success', '¡Bienvenido al panel de administración de La Comuna!');
    } else {
      setAuthError(true);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('breaphoto_admin_auth');
    localStorage.removeItem('breaphoto_admin_auth');
    addToast('info', 'Sesión de administrador cerrada.');
  };

  const handleDeleteAlbum = async (albumId: string, albumName: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el álbum "${albumName}" y todas sus fotos asociadas?`)) {
      return;
    }

    if (!isSupabaseConfigured) {
      setAlbums((prev) => prev.filter((a) => a.id !== albumId));
      addToast('success', 'Álbum de prueba eliminado.');
      return;
    }

    try {
      const { error } = await supabase.from('albums').delete().eq('id', albumId);
      if (error) throw error;

      setAlbums((prev) => prev.filter((a) => a.id !== albumId));
      addToast('success', 'Álbum eliminado correctamente.');
    } catch (err) {
      console.error('Error al eliminar álbum:', err);
      addToast('error', 'Error al eliminar el álbum.');
    }
  };

  return (
    <div className="min-h-screen bg-[#070f0b] text-[#f8f9fa] flex flex-col">
      <Navbar showAdminLink={false} />
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {!isAuthenticated ? (
          /* Password Protection Gate */
          <div className="max-w-md mx-auto my-12 p-8 rounded-3xl bg-[#0d1b14] border border-[#52b788]/30 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1b4332] to-[#0d1b14] border border-[#52b788]/40 text-[#52b788] flex items-center justify-center mx-auto mb-5 shadow-glow">
              <Lock className="w-7 h-7" />
            </div>

            <h1 className="text-3xl font-pirata text-[#f8f9fa] mb-2 tracking-wide text-glow">
              Panel de Administración
            </h1>
            <p className="text-xs sm:text-sm text-[#b7c4bb] mb-6 font-sans">
              Introduce la contraseña de administrador de la peña La Comuna para gestionar los álbumes.
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input
                  type="password"
                  placeholder="Contraseña de administrador"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setAuthError(false);
                  }}
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl bg-[#070f0b] border border-[#52b788]/30 text-[#f8f9fa] placeholder-[#b7c4bb]/50 text-sm focus:outline-none focus:border-[#52b788] transition"
                />
                {authError && (
                  <p className="text-xs text-rose-400 text-left mt-1.5 font-medium">
                    Contraseña incorrecta. Prueba con <code>admin123</code> o <code>lacomuna</code>.
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl bg-[#52b788] hover:bg-[#74c69d] text-[#070f0b] font-bold text-sm shadow-glow transition cursor-pointer"
              >
                Acceder al Panel
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Admin Dashboard */
          <div>
            {/* Dashboard Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#52b788]/20 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-5 h-5 text-[#52b788]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#ffb703]">
                    Administración · Peña La Comuna
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-pirata text-[#f8f9fa] tracking-wide text-glow">
                  Gestión de Álbumes
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/admin/albums/new"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#52b788] text-[#070f0b] text-xs sm:text-sm font-bold shadow-glow hover:bg-[#74c69d] hover:scale-105 transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Nuevo Álbum</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2.5 rounded-xl bg-[#0d1b14] border border-[#52b788]/20 text-[#b7c4bb] hover:text-white hover:bg-[#1b4332]/40 transition"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* List of Albums */}
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-[#b7c4bb]">
                <div className="w-8 h-8 rounded-full border-2 border-[#52b788] border-t-transparent animate-spin" />
                <span className="text-sm font-medium">Cargando álbumes...</span>
              </div>
            ) : albums.length === 0 ? (
              <div className="py-20 px-4 text-center border border-[#52b788]/20 rounded-3xl bg-[#0d1b14]/50 shadow-lg">
                <div className="w-14 h-14 rounded-2xl bg-[#1b4332]/60 border border-[#52b788]/30 flex items-center justify-center mx-auto mb-4 text-[#52b788]">
                  <FolderOpen className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-pirata text-[#f8f9fa] mb-1 tracking-wide">
                  No hay ningún álbum creado
                </h3>
                <p className="text-xs sm:text-sm text-[#b7c4bb] max-w-sm mx-auto mb-6 font-sans">
                  Crea tu primer álbum para generar su código QR y tarjeta NFC y empezar a recibir fotos de la peña.
                </p>
                <Link
                  href="/admin/albums/new"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#52b788] text-[#070f0b] text-xs sm:text-sm font-bold shadow-glow hover:bg-[#74c69d] transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Crear Primer Álbum</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {albums.map((album) => (
                  <div
                    key={album.id}
                    className="p-5 rounded-3xl bg-[#0d1b14] border border-[#52b788]/25 shadow-lg hover:border-[#52b788]/60 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Header of Card */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          {isEmojiCover(album.cover_url) ? (
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1b4332] to-[#0d1b14] border border-[#52b788]/30 flex items-center justify-center text-2xl shrink-0 shadow-glow select-none">
                              {getCoverEmoji(album.cover_url)}
                            </div>
                          ) : album.cover_url ? (
                            <div className="w-12 h-12 rounded-2xl overflow-hidden border border-[#52b788]/30 shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={album.cover_url} alt={album.name} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-2xl bg-[#070f0b] border border-[#52b788]/20 flex items-center justify-center text-[#52b788] shrink-0">
                              <ImageIcon className="w-5 h-5" />
                            </div>
                          )}

                          <div>
                            <h3 className="font-pirata text-2xl text-[#f8f9fa] tracking-wide">
                              {album.name}
                            </h3>
                            {album.event_date && (
                              <p className="text-xs text-[#b7c4bb] flex items-center gap-1.5 mt-0.5 font-medium">
                                <Calendar className="w-3.5 h-3.5 text-[#ffb703]" />
                                <span>{formatDateRange(album.event_date, album.event_end_date)}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteAlbum(album.id, album.name)}
                          className="p-2 text-[#b7c4bb] hover:text-rose-400 rounded-lg hover:bg-rose-950/40 transition"
                          title="Eliminar álbum"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Slug / Link preview */}
                      <p className="text-xs font-mono text-[#52b788]/70 truncate mb-4">
                        /album/{album.slug}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t border-[#52b788]/20 flex items-center gap-2">
                      <Link
                        href={`/admin/albums/${album.slug}`}
                        className="flex-1 py-2 px-3 rounded-xl bg-[#52b788] text-[#070f0b] text-xs font-bold flex items-center justify-center gap-1.5 shadow-glow hover:bg-[#74c69d] transition"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Ver QR y Gestionar</span>
                      </Link>

                      <Link
                        href={`/album/${album.slug}`}
                        target="_blank"
                        className="p-2 rounded-xl bg-[#070f0b] border border-[#52b788]/30 text-[#b7c4bb] hover:text-white hover:bg-[#1b4332]/40 transition"
                        title="Ver página pública del álbum"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

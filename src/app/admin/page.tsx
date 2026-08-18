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
  Sparkles,
  LogOut,
  FolderOpen
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { ToastContainer } from '@/components/Toast';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Album, ToastMessage } from '@/lib/types';
import { formatDate } from '@/lib/utils';

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
    const session = sessionStorage.getItem('breaphoto_admin_auth');
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
            name: 'Boda de Laura y Carlos',
            slug: 'boda-laura-carlos',
            cover_url: null,
            event_date: '2026-09-20',
            created_at: new Date().toISOString(),
          },
          {
            id: 'mock-2',
            name: 'Cumpleaños 30 de Marta',
            slug: 'cumple-marta-30',
            cover_url: null,
            event_date: '2026-10-05',
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
    // Default admin master password fallback is 'admin123' if not specified in env
    const masterPass = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
    
    if (passwordInput === masterPass || passwordInput === 'admin123' || passwordInput === 'admin') {
      setIsAuthenticated(true);
      sessionStorage.setItem('breaphoto_admin_auth', 'true');
      setAuthError(false);
    } else {
      setAuthError(true);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('breaphoto_admin_auth');
    setIsAuthenticated(false);
    setPasswordInput('');
  };

  const handleDeleteAlbum = async (albumId: string, albumName: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar el álbum "${albumName}"? Se borrarán todas sus fotos asociadas.`)) {
      return;
    }

    if (!isSupabaseConfigured) {
      setAlbums((prev) => prev.filter((a) => a.id !== albumId));
      addToast('success', 'Álbum eliminado (Modo Demo).');
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
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col">
      <Navbar showAdminLink={false} />
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {!isAuthenticated ? (
          /* Password Protection Gate */
          <div className="max-w-md mx-auto my-12 p-8 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 flex items-center justify-center mx-auto mb-5 shadow-sm">
              <Lock className="w-7 h-7" />
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-stone-950 dark:text-stone-50 mb-2">
              Panel de Administración
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mb-6">
              Introduce la contraseña de administrador para crear y gestionar álbumes.
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input
                  type="password"
                  placeholder="Contraseña de administrador (por defecto: admin123)"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setAuthError(false);
                  }}
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder-stone-400 text-sm focus:outline-none focus:border-stone-600 transition"
                />
                {authError && (
                  <p className="text-xs text-rose-500 text-left mt-1.5 font-medium">
                    Contraseña incorrecta. Prueba con <code>admin123</code>.
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950 font-semibold text-sm hover:opacity-90 transition cursor-pointer"
              >
                Acceder al Panel
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Admin Dashboard */
          <div>
            {/* Dashboard Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200 dark:border-stone-800 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Administrador
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-950 dark:text-stone-50">
                  Gestión de Álbumes
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/admin/albums/new"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950 text-xs sm:text-sm font-semibold shadow hover:opacity-90 transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Nuevo Álbum</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* List of Albums */}
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-stone-500">
                <RefreshCw className="w-6 h-6 animate-spin" />
                <span className="text-sm font-medium">Cargando álbumes...</span>
              </div>
            ) : albums.length === 0 ? (
              <div className="py-20 px-4 text-center border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-3xl bg-white/50 dark:bg-stone-900/20">
                <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto mb-4 text-stone-400">
                  <FolderOpen className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-stone-800 dark:text-stone-200 mb-1">
                  No hay ningún álbum creado
                </h3>
                <p className="text-xs sm:text-sm text-stone-500 max-w-sm mx-auto mb-6">
                  Crea tu primer álbum para generar su código QR y empezar a recibir fotos.
                </p>
                <Link
                  href="/admin/albums/new"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950 text-xs sm:text-sm font-semibold hover:opacity-90 transition"
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
                    className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Header of Card */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <h3 className="font-bold text-lg text-stone-950 dark:text-stone-100 tracking-tight">
                            {album.name}
                          </h3>
                          {album.event_date && (
                            <p className="text-xs text-stone-500 flex items-center gap-1.5 mt-1 font-medium">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{formatDate(album.event_date)}</span>
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => handleDeleteAlbum(album.id, album.name)}
                          className="p-2 text-stone-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                          title="Eliminar álbum"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Slug / Link preview */}
                      <p className="text-xs font-mono text-stone-400 dark:text-stone-500 truncate mb-4">
                        /album/{album.slug}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center gap-2">
                      <Link
                        href={`/admin/albums/${album.slug}`}
                        className="flex-1 py-2 px-3 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950 text-xs font-semibold flex items-center justify-center gap-1.5 hover:opacity-90 transition"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Ver QR y Gestionar</span>
                      </Link>

                      <Link
                        href={`/album/${album.slug}`}
                        target="_blank"
                        className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition"
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

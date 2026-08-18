-- =======================================================
-- BreaPhotoHub - Supabase Schema & Realtime Setup
-- Copia y pega este script en el SQL Editor de tu proyecto en Supabase
-- =======================================================

-- 1. TABLA DE ÁLBUMES
CREATE TABLE IF NOT EXISTS public.albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  cover_url TEXT,
  event_date DATE,
  admin_password TEXT NOT NULL DEFAULT 'admin123',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. TABLA DE FOTOS
CREATE TABLE IF NOT EXISTS public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  filename TEXT,
  caption TEXT,
  likes_count INT NOT NULL DEFAULT 0,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_albums_slug ON public.albums(slug);
CREATE INDEX IF NOT EXISTS idx_photos_album_id ON public.photos(album_id);
CREATE INDEX IF NOT EXISTS idx_photos_uploaded_at ON public.photos(uploaded_at DESC);

-- 3. HABILITAR TIEMPO REAL (Supabase Realtime)
-- Permite que la web reciba fotos nuevas al instante por WebSocket
ALTER PUBLICATION supabase_realtime ADD TABLE public.photos;

-- 4. POLÍTICAS DE ACCESO (Row Level Security - RLS)
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- Políticas para albums
CREATE POLICY "Permitir lectura publica de albumes"
  ON public.albums FOR SELECT
  USING (true);

CREATE POLICY "Permitir creacion de albumes"
  ON public.albums FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir borrado de albumes"
  ON public.albums FOR DELETE
  USING (true);

-- Políticas para photos
CREATE POLICY "Permitir lectura publica de fotos"
  ON public.photos FOR SELECT
  USING (true);

CREATE POLICY "Permitir subida publica de fotos"
  ON public.photos FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir borrado de fotos"
  ON public.photos FOR DELETE
  USING (true);

-- 5. CREACIÓN DEL STORAGE BUCKET
-- Inserta el bucket 'album-photos' si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('album-photos', 'album-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage para 'album-photos'
CREATE POLICY "Permitir acceso publico de lectura a fotos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'album-photos');

CREATE POLICY "Permitir subida publica de fotos al storage"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'album-photos');

CREATE POLICY "Permitir borrado de objetos del storage"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'album-photos');

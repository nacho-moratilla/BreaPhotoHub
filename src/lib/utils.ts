import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Photo } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9 -]/g, '') // Remove invalid chars
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/-+/g, '-'); // Replace multiple - with single -
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatTimeAgo(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'hace un momento';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `hace ${diffInMinutes} min`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `hace ${diffInHours} h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `hace ${diffInDays} d`;
    return formatDate(dateString);
  } catch {
    return dateString;
  }
}

/**
 * Compresses an image file before upload to improve speed and storage efficiency.
 */
export async function compressImage(
  file: File | Blob,
  maxWidth = 2000,
  quality = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            resolve(file);
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo procesar la imagen'));
    };

    img.src = url;
  });
}

/**
 * Downloads a single image directly with proper name.
 */
export async function downloadSingleImage(url: string, filename: string) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    saveAs(blob, filename);
  } catch (error) {
    console.error('Error al descargar la imagen:', error);
    // Fallback: direct anchor link trigger
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

/**
 * Downloads all photos in an album packaged into a single ZIP file.
 */
export async function downloadAlbumAsZip(
  photos: Photo[],
  albumName: string,
  onProgress?: (progress: number, current: number, total: number) => void
): Promise<void> {
  if (!photos || photos.length === 0) {
    throw new Error('No hay fotos para descargar');
  }

  const zip = new JSZip();
  const folder = zip.folder(slugify(albumName) || 'album-fotos');
  const total = photos.length;

  for (let i = 0; i < total; i++) {
    const photo = photos[i];
    try {
      const response = await fetch(photo.url);
      const blob = await response.blob();
      const filename = photo.filename || `foto-${i + 1}.jpg`;
      folder?.file(filename, blob);
    } catch (err) {
      console.warn(`No se pudo agregar la foto ${photo.id} al ZIP:`, err);
    }

    if (onProgress) {
      const percentage = Math.round(((i + 1) / total) * 80);
      onProgress(percentage, i + 1, total);
    }
  }

  const content = await zip.generateAsync(
    { type: 'blob' },
    (metadata) => {
      if (onProgress) {
        const percentage = 80 + Math.round((metadata.percent / 100) * 20);
        onProgress(percentage, total, total);
      }
    }
  );

  saveAs(content, `${slugify(albumName) || 'fotos'}-album-completo.zip`);
}

/**
 * Checks if a cover string is an emoji representation
 */
export function isEmojiCover(cover: string | null | undefined): boolean {
  if (!cover) return false;
  return cover.startsWith('emoji:') || (!cover.startsWith('http://') && !cover.startsWith('https://') && !cover.startsWith('/'));
}

/**
 * Extracts the clean emoji from a cover string
 */
export function getCoverEmoji(cover: string | null | undefined): string {
  if (!cover) return '📸';
  if (cover.startsWith('emoji:')) {
    return cover.replace('emoji:', '').trim();
  }
  return cover.trim();
}


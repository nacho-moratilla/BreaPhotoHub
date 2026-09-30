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

/**
 * Formats a date range elegantly (e.g. "15 - 20 de agosto de 2026")
 */
export function formatDateRange(
  startDateStr: string | null | undefined,
  endDateStr?: string | null | undefined
): string {
  if (!startDateStr && !endDateStr) return '';
  if (!endDateStr || startDateStr === endDateStr) return formatDate(startDateStr);
  if (!startDateStr) return formatDate(endDateStr);

  try {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return `${startDateStr} - ${endDateStr}`;
    }

    const startDay = start.getDate();
    const endDay = end.getDate();
    const startMonth = start.getMonth();
    const endMonth = end.getMonth();
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();

    const monthNames = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];

    if (startYear === endYear && startMonth === endMonth) {
      return `${startDay} - ${endDay} de ${monthNames[startMonth]} de ${startYear}`;
    } else if (startYear === endYear) {
      return `${startDay} de ${monthNames[startMonth]} - ${endDay} de ${monthNames[endMonth]} de ${startYear}`;
    } else {
      return `${startDay} de ${monthNames[startMonth]} de ${startYear} - ${endDay} de ${monthNames[endMonth]} de ${endYear}`;
    }
  } catch {
    return `${startDateStr} - ${endDateStr}`;
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
  maxWidth = 4096,
  quality = 0.95
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
 * Downloads or shares a single image.
 * On mobile devices supporting Web Share API with files (iOS/Android),
 * this opens the native share sheet allowing direct "Save to Photos / Gallery".
 * On desktop or unsupported devices, it falls back to standard file download.
 */
export async function downloadOrShareImage(url: string, filename: string): Promise<void> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const mimeType = blob.type || 'image/jpeg';
    const file = new File([blob], filename, { type: mimeType });

    // Check if Web Share API is available and can share image files
    if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'Guardar foto',
          text: 'Foto de Peña La Comuna',
        });
        return;
      } catch (shareErr: any) {
        // If user cancelled the share sheet, do nothing
        if (shareErr.name === 'AbortError') {
          return;
        }
        console.warn('Share API falló, usando descarga estándar:', shareErr);
      }
    }

    // Standard download fallback
    saveAs(blob, filename);
  } catch (error) {
    console.error('Error al descargar o guardar la imagen:', error);
    // Ultimate fallback: direct anchor link trigger
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
 * Downloads a single image directly with proper name (alias).
 */
export const downloadSingleImage = downloadOrShareImage;

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

/**
 * Generates a clean, friendly random token for NFC tag authentication
 */
export function generateNfcToken(length = 8): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Returns the album's secret NFC token or computes a deterministic fallback from ID
 */
export function getAlbumNfcToken(album: { id: string; nfc_token?: string | null; slug?: string }): string {
  if (album.nfc_token && album.nfc_token.trim().length > 0) {
    return album.nfc_token.trim();
  }
  const cleanId = (album.id || album.slug || 'breaphoto').replace(/[^a-zA-Z0-9]/g, '');
  let hash = 0;
  for (let i = 0; i < cleanId.length; i++) {
    hash = ((hash << 5) - hash) + cleanId.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(36);
  return (hex + 'k8m2').slice(0, 8);
}


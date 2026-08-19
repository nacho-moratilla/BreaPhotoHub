'use client';

import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { Download, Copy, Check, Printer, ExternalLink, Radio } from 'lucide-react';
import { formatDateRange } from '@/lib/utils';

interface QRCodeCardProps {
  slug: string;
  albumName: string;
  eventDate?: string | null;
  eventEndDate?: string | null;
}

export const QRCodeCard: React.FC<QRCodeCardProps> = ({
  slug,
  albumName,
  eventDate,
  eventEndDate,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const printableRef = useRef<HTMLDivElement>(null);

  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const albumUrl = origin ? `${origin}/album/${slug}` : `/album/${slug}`;

  useEffect(() => {
    if (albumUrl) {
      QRCode.toDataURL(albumUrl, {
        width: 600,
        margin: 2,
        color: {
          dark: '#0c0a09',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Error generando QR:', err));
    }
  }, [albumUrl]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(albumUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar al portapapeles:', err);
    }
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `qr-${slug}.png`;
    a.click();
  };

  const handlePrintCard = () => {
    window.print();
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Printable Card Container */}
      <div
        ref={printableRef}
        className="w-full max-w-sm bg-white text-stone-950 p-8 rounded-3xl border border-stone-200 shadow-xl flex flex-col items-center text-center relative overflow-hidden"
      >
        {/* Decorative Top subtle line */}
        <div className="w-12 h-1 bg-stone-950 rounded-full mb-6" />

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-[11px] font-semibold text-stone-700 tracking-wide uppercase mb-3">
          <Radio className="w-3 h-3 text-stone-900" />
          <span>QR / NFC Photo Booth</span>
        </div>

        <h3 className="text-2xl font-bold tracking-tight text-stone-950 mb-1">
          {albumName}
        </h3>

        {eventDate && (
          <p className="text-xs text-stone-500 font-medium mb-6">
            {formatDateRange(eventDate, eventEndDate)}
          </p>
        )}

        {/* QR Frame */}
        <div className="p-4 rounded-2xl bg-white border-2 border-stone-950/10 shadow-inner mb-6">
          {qrDataUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={qrDataUrl}
              alt={`QR para el álbum ${albumName}`}
              className="w-52 h-52 object-contain"
            />
          ) : (
            <div className="w-52 h-52 flex items-center justify-center bg-stone-50 rounded-lg text-xs text-stone-400">
              Generando código...
            </div>
          )}
        </div>

        <p className="text-sm font-semibold text-stone-900 mb-1">
          ¡Escanea y sube tus fotos en vivo!
        </p>
        <p className="text-xs text-stone-500 max-w-xs">
          Abre la cámara de tu móvil para escanear el QR o acerca tu teléfono si hay un tag NFC.
        </p>

        {/* Brand stamp footer */}
        <div className="mt-8 pt-4 border-t border-stone-100 w-full flex items-center justify-center gap-1 text-[11px] text-stone-400 font-medium">
          <span>Powered by</span>
          <span className="font-semibold text-stone-800">BreaPhotoHub</span>
        </div>
      </div>

      {/* Action Buttons for Admin */}
      <div className="w-full max-w-sm mt-6 flex flex-col gap-2.5 print:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadQR}
            className="flex-1 py-2.5 px-4 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Descargar QR (PNG)</span>
          </button>

          <button
            onClick={handlePrintCard}
            className="py-2.5 px-4 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 border border-stone-200 dark:border-stone-700 hover:bg-stone-200 dark:hover:bg-stone-700 transition cursor-pointer"
            title="Imprimir cartel para mesa"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="flex-1 py-2 px-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 text-xs font-medium flex items-center justify-center gap-2 hover:bg-stone-50 dark:hover:bg-stone-800 transition"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-500">¡Enlace copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-stone-400" />
                <span>Copiar Enlace del Álbum</span>
              </>
            )}
          </button>

          <a
            href={albumUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2 px-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-stone-50 dark:hover:bg-stone-800 transition"
          >
            <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
            <span>Abrir</span>
          </a>
        </div>
      </div>
    </div>
  );
};

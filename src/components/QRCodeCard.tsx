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
  nfcToken?: string | null;
}

export const QRCodeCard: React.FC<QRCodeCardProps> = ({
  slug,
  albumName,
  eventDate,
  eventEndDate,
  nfcToken,
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

  const tokenParam = nfcToken ? `?nfc=${encodeURIComponent(nfcToken)}` : '?nfc=1';
  const albumUrl = origin ? `${origin}/album/${slug}${tokenParam}` : `/album/${slug}${tokenParam}`;

  useEffect(() => {
    if (albumUrl) {
      QRCode.toDataURL(albumUrl, {
        width: 600,
        margin: 2,
        color: {
          dark: '#070f0b',
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
    a.download = `qr-comuna-${slug}.png`;
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
        className="w-full max-w-sm bg-white text-[#070f0b] p-8 rounded-3xl border border-stone-300 shadow-2xl flex flex-col items-center text-center relative overflow-hidden"
      >
        {/* Decorative Top header bar */}
        <div className="w-12 h-1.5 bg-[#52b788] rounded-full mb-4" />

        <div className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#1b4332]/10 text-[11px] font-bold text-[#1b4332] tracking-wider uppercase mb-2">
          <Radio className="w-3 h-3 text-[#52b788]" />
          <span>Peña La Comuna · QR / NFC</span>
        </div>

        <h3 className="font-pirata text-3xl font-bold tracking-wide text-[#070f0b] mb-1">
          {albumName}
        </h3>

        {eventDate && (
          <p className="text-xs text-stone-600 font-semibold mb-5">
            {formatDateRange(eventDate, eventEndDate)}
          </p>
        )}

        {/* QR Frame */}
        <div className="p-4 rounded-2xl bg-white border-2 border-[#52b788]/30 shadow-md mb-5">
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

        <p className="text-sm font-bold text-[#070f0b] mb-1">
          ¡Escanea y sube tus fotos en vivo!
        </p>
        <p className="text-xs text-stone-600 max-w-xs font-medium">
          Abre la cámara para escanear el QR o acerca tu móvil si hay una tarjeta NFC de la peña.
        </p>

        {/* Brand stamp footer */}
        <div className="mt-6 pt-3 border-t border-stone-200 w-full flex items-center justify-center gap-1.5 text-[11px] text-stone-600 font-bold">
          <span>PEÑA LA COMUNA</span>
          <span className="text-[#52b788]">•</span>
          <span>Brea de Tajo</span>
        </div>
      </div>

      {/* Action Buttons for Admin */}
      <div className="w-full max-w-sm mt-6 flex flex-col gap-2.5 print:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadQR}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#52b788] hover:bg-[#74c69d] text-[#070f0b] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-glow hover:scale-105 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Descargar QR (PNG)</span>
          </button>

          <button
            onClick={handlePrintCard}
            className="py-2.5 px-4 rounded-xl bg-[#0d1b14] text-[#f8f9fa] text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 border border-[#52b788]/30 hover:border-[#52b788]/60 hover:bg-[#1b4332]/40 transition cursor-pointer"
            title="Imprimir cartel para mesa"
          >
            <Printer className="w-4 h-4 text-[#ffb703]" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="flex-1 py-2 px-3 rounded-xl bg-[#0d1b14] border border-[#52b788]/30 text-[#f8f9fa] text-xs font-semibold flex items-center justify-center gap-2 hover:border-[#52b788]/60 transition"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#52b788]" />
                <span className="text-[#52b788]">¡Enlace copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#ffb703]" />
                <span>Copiar Enlace del Álbum</span>
              </>
            )}
          </button>

          <a
            href={albumUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2 px-3 rounded-xl bg-[#0d1b14] border border-[#52b788]/30 text-[#f8f9fa] text-xs font-semibold flex items-center justify-center gap-1.5 hover:border-[#52b788]/60 transition"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#52b788]" />
            <span>Abrir</span>
          </a>
        </div>
      </div>
    </div>
  );
};

import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Peña La Comuna — Recuerdos y Fotos de Nuestras Fiestas',
  description: 'Los recuerdos y momentos de la Peña La Comuna a un paso. Captura y comparte fotos en directo.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#070f0b',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className="antialiased selection:bg-[#52b788] selection:text-[#070f0b]">
        {children}
      </body>
    </html>
  );
}

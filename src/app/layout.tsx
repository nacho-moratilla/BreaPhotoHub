import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BreaPhotoHub — Álbumes de Fotos Compartidos',
  description: 'Captura y comparte fotos de tus eventos en tiempo real con un simple QR o NFC.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0c0a09',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased selection:bg-stone-900 selection:text-white dark:selection:bg-stone-100 dark:selection:text-stone-900">
        {children}
      </body>
    </html>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { Camera, PlusCircle, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  currentAlbumName?: string;
  showAdminLink?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ currentAlbumName, showAdminLink = true }) => {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-stone-200/80 dark:border-stone-800/80 bg-stone-50/80 dark:bg-stone-950/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-stone-900 dark:bg-stone-100 flex items-center justify-center text-white dark:text-stone-900 shadow-sm group-hover:scale-105 transition-transform duration-200">
            <Camera className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-base tracking-tight text-stone-900 dark:text-stone-100">
              BreaPhoto<span className="text-stone-500 font-normal">Hub</span>
            </span>
          </div>
        </Link>

        {/* Dynamic Album Title in Header if present */}
        {currentAlbumName && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs font-medium text-stone-600 dark:text-stone-300 truncate max-w-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="truncate">{currentAlbumName}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/admin/albums/new"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-stone-700 dark:text-stone-200 hover:text-stone-950 dark:hover:text-white rounded-lg hover:bg-stone-100 dark:hover:bg-stone-900 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Crear Álbum</span>
          </Link>
          
          {showAdminLink && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors shadow-sm"
            >
              <ShieldCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Panel</span> Admin
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

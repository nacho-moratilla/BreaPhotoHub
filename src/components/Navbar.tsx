'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Camera, PlusCircle, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  currentAlbumName?: string;
  showAdminLink?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ currentAlbumName, showAdminLink = false }) => {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const auth = sessionStorage.getItem('breaphoto_admin_auth') || localStorage.getItem('breaphoto_admin_auth');
      setIsAdmin(auth === 'true');
    }
  }, []);

  return (
    <header className="sticky top-0 z-30 w-full border-b border-[#52b788]/20 bg-[#070f0b]/85 backdrop-blur-md transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1b4332] to-[#0d1b14] border border-[#52b788]/30 flex items-center justify-center text-[#52b788] shadow-glow group-hover:scale-105 group-hover:border-[#52b788]/60 transition-all duration-300">
            <Camera className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-pirata text-2xl sm:text-3xl text-[#52b788] text-glow tracking-wider leading-none">
              LA COMUNA
            </span>
          </div>
        </Link>

        {/* Dynamic Album Title in Header if present */}
        {currentAlbumName && (
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0d1b14]/90 border border-[#52b788]/30 text-xs font-semibold text-[#f8f9fa] shadow-sm truncate max-w-xs">
            <span className="w-2 h-2 rounded-full bg-[#52b788] animate-pulse" />
            <span className="truncate">{currentAlbumName}</span>
          </div>
        )}

        {/* Actions - Only visible if logged in as Admin or explicitly in admin section */}
        <div className="flex items-center gap-2 sm:gap-3">
          {(isAdmin || showAdminLink) && (
            <>
              <Link
                href="/admin/albums/new"
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#b7c4bb] hover:text-white rounded-xl hover:bg-[#1b4332]/40 border border-transparent hover:border-[#52b788]/30 transition-all"
              >
                <PlusCircle className="w-4 h-4 text-[#52b788]" />
                <span>Crear Álbum</span>
              </Link>
              
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold bg-[#52b788] text-[#070f0b] rounded-xl hover:bg-[#74c69d] transition-all shadow-glow hover:scale-105"
              >
                <ShieldCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Panel</span> Admin
              </Link>
            </>
          )}

          {/* Social Instagram Pill */}
          <a
            href="https://www.instagram.com/laacomuunaa/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0d1b14] border border-[#ffb703]/30 text-[#ffb703] text-xs font-semibold hover:border-[#ffb703]/70 hover:bg-[#ffb703]/10 transition-all shadow-sm"
          >
            <span>@laacomuunaa</span>
          </a>
        </div>
      </div>
    </header>
  );
};

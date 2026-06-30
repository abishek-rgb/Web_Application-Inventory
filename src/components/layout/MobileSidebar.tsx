"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, LogOut } from "lucide-react";
import SidebarNav from "./SidebarNav";
import { usePathname } from "next/navigation";

export default function MobileSidebar({ isSuperAdmin, user }: { isSuperAdmin: boolean, user: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <div className="md:hidden">
      {/* Top Navbar */}
      <div className="flex items-center gap-4 bg-bg/90 backdrop-blur-md border-b border-border p-4 sticky top-0 z-40">
        <button 
          onClick={() => setIsOpen(true)}
          className="p-1 -ml-1 text-text-primary hover:text-primary transition-colors focus:outline-none"
        >
          <Menu className="w-7 h-7" />
        </button>
        <Link href="/dashboard" className="block w-32">
          <Image src="/logo.png" alt="SecuLogix Logo" width={128} height={32} className="w-full h-auto object-contain drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]" />
        </Link>
      </div>

      {/* Drawer Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <div 
        className={`fixed inset-y-0 left-0 w-72 bg-bg glass border-r border-border shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex justify-between items-center p-4 border-b border-border/50">
          <div>
            <p className="text-text-primary font-bold text-lg">Menu</p>
            <p className="text-text-secondary text-xs tracking-widest font-medium truncate max-w-[200px]" title={user?.email || "User"}>{user?.email || "User"}</p>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 text-text-secondary hover:text-danger rounded-full transition-colors focus:outline-none"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <SidebarNav isSuperAdmin={isSuperAdmin} />

        <div className="p-4 border-t border-border/50 bg-surface/20 mt-auto">
          <div className="flex items-center justify-between px-2 py-2">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-text-primary">{user?.name || "User"}</span>
              <span className="text-xs text-primary font-medium tracking-wide">{user?.role}</span>
            </div>
            <Link href="/api/auth/signout" className="text-text-secondary hover:text-danger hover:scale-110 transition-all duration-300 p-2 hover:bg-danger/10 rounded-full">
              <LogOut className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

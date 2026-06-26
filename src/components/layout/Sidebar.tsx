import Link from "next/link";
import Image from "next/image";
import { LogOut } from "lucide-react";
import { auth } from "@/lib/auth";
import SidebarNav from "./SidebarNav";

export default async function Sidebar() {
  const session = await auth();
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  return (
    <aside className="w-64 glass border-r border-border h-full flex flex-col shadow-2xl relative z-20">
      <div className="p-6">
        <Link href="/dashboard" className="block w-40 hover:scale-105 transition-transform duration-300">
          <Image src="/logo.png" alt="SecuLogix Logo" width={160} height={40} className="w-full h-auto object-contain drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]" />
        </Link>
        <p className="text-text-secondary text-xs mt-2 uppercase tracking-widest font-medium">InStock System</p>
      </div>

      <SidebarNav isSuperAdmin={isSuperAdmin} />

      <div className="p-4 border-t border-border/50 bg-surface/20">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-text-primary">{session?.user?.name || "User"}</span>
            <span className="text-xs text-primary font-medium tracking-wide">{session?.user?.role}</span>
          </div>
          <Link href="/api/auth/signout" className="text-text-secondary hover:text-danger hover:scale-110 transition-all duration-300 p-2 hover:bg-danger/10 rounded-full">
            <LogOut className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </aside>
  );
}

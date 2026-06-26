import Link from "next/link";
import Image from "next/image";
import { LogOut } from "lucide-react";
import { auth } from "@/lib/auth";
import SidebarNav from "./SidebarNav";

export default async function Sidebar() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <aside className="w-64 bg-surface border-r border-border h-full flex flex-col">
      <div className="p-6">
        <Link href="/dashboard" className="block w-40">
          <Image src="/logo.png" alt="SecuLogix Logo" width={160} height={40} className="w-full h-auto object-contain" />
        </Link>
        <p className="text-text-secondary text-xs mt-2">InStock Inventory</p>
      </div>

      <SidebarNav isAdmin={isAdmin} />

      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-text-primary">{session?.user?.name || "User"}</span>
            <span className="text-xs text-text-secondary capitalize">{session?.user?.role?.toLowerCase()}</span>
          </div>
          <Link href="/api/auth/signout" className="text-text-secondary hover:text-danger transition-colors">
            <LogOut className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </aside>
  );
}

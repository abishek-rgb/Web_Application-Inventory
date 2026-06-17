import Link from "next/link";
import { 
  LayoutDashboard, 
  Plus, 
  Package2, 
  Search, 
  ArrowLeftRight, 
  MapPin, 
  Tag, 
  Users,
  LogOut
} from "lucide-react";
import { auth } from "@/lib/auth";

export default async function Sidebar() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Add Stock", href: "/dashboard/parts/add", icon: Plus },
    { label: "All Parts", href: "/dashboard/parts", icon: Package2 },
    { label: "Find Stock", href: "/dashboard/search", icon: Search },
    { label: "Movements", href: "/dashboard/movements", icon: ArrowLeftRight },
    { label: "Locations", href: "/dashboard/locations", icon: MapPin },
    { label: "HSN Codes", href: "/dashboard/hsn", icon: Tag },
  ];

  if (isAdmin) {
    navItems.push({ label: "Users", href: "/dashboard/users", icon: Users });
  }

  return (
    <aside className="w-64 bg-surface border-r border-border h-full flex flex-col">
      <div className="p-6">
        <h1 className="text-primary font-bold text-2xl tracking-wider">SECULOGIX</h1>
        <p className="text-text-secondary text-xs mt-1">InStock Inventory</p>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center px-4 py-3 text-text-primary hover:bg-border rounded-md transition-colors"
          >
            <item.icon className="w-5 h-5 mr-3 text-text-secondary group-hover:text-primary" />
            <span className="font-medium text-sm">{item.label}</span>
          </Link>
        ))}
      </nav>

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

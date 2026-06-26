"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { 
  ChevronDown, 
  ChevronRight,
  LayoutDashboard, 
  Plus, 
  Package2, 
  Search, 
  ArrowLeftRight, 
  MapPin, 
  Tag, 
  Users,
  Truck,
  Database
} from "lucide-react";

export default function SidebarNav({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const pathname = usePathname();
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (label: string) => {
    setOpenItems((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Add Stock", href: "/dashboard/parts/add", icon: Plus },
    { label: "Import Excel", href: "/dashboard/import", icon: Plus },
    { label: "All Parts", href: "/dashboard/parts", icon: Package2 },
    { label: "Find Stock", href: "/dashboard/search", icon: Search },
    { label: "Movements", href: "/dashboard/movements", icon: ArrowLeftRight },
    { label: "Locations", href: "/dashboard/locations", icon: MapPin },
    { label: "HSN Codes", href: "/dashboard/hsn", icon: Tag },
    {
      label: "Track Order",
      icon: Truck,
      subItems: [
        { label: "Enroll New Order", href: "/dashboard/track-order/enroll" },
        { label: "Update Status", href: "/dashboard/track-order/update" },
        { label: "Order Logs", href: "/dashboard/track-order/logs" },
      ],
    },
  ];

  if (isSuperAdmin) {
    navItems.push({ label: "Users", href: "/dashboard/users", icon: Users });
    navItems.push({ label: "Database Health", href: "/dashboard/db-status", icon: Database });
  }

  const renderLink = (item: any, isSubItem = false) => {
    const isActive = pathname === item.href;
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group
          ${isSubItem ? "pl-11 text-sm my-1" : "my-1.5"}
          ${
            isActive
              ? "bg-primary/10 text-primary font-semibold shadow-[inset_4px_0_0_0_rgba(245,158,11,1)]"
              : "text-text-secondary hover:bg-surface/50 hover:text-text-primary hover:translate-x-1"
          }
        `}
      >
        <div className="flex items-center gap-3">
          {item.icon && (
            <item.icon 
              className={`w-5 h-5 transition-transform duration-300 ${isActive ? "scale-110 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "group-hover:scale-110 group-hover:text-primary"}`} 
            />
          )}
          <span>{item.label}</span>
        </div>
        {!isSubItem && <ChevronRight className={`w-4 h-4 opacity-0 transition-all duration-300 -translate-x-2 ${isActive ? "opacity-100 translate-x-0" : "group-hover:opacity-100 group-hover:translate-x-0"}`} />}
      </Link>
    );
  };

  return (
    <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
      {navItems.map((item) => {
        const hasSubItems = item.subItems && item.subItems.length > 0;
        const isSubItemActive = hasSubItems && item.subItems!.some((sub: any) => pathname === sub.href);
        const isOpen = openItems[item.label] ?? isSubItemActive;

        return (
          <div key={item.label}>
            {hasSubItems ? (
              <div>
                <button
                  onClick={() => toggleItem(item.label)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-text-secondary hover:bg-surface/50 hover:text-text-primary transition-all duration-300 group my-1.5 hover:translate-x-1 ${isOpen ? "bg-surface/30 text-text-primary" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={`w-5 h-5 transition-transform duration-300 ${isSubItemActive ? "text-primary" : "group-hover:scale-110 group-hover:text-primary"}`} />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4 transition-transform duration-300 text-primary" />
                  ) : (
                    <ChevronRight className="w-4 h-4 transition-transform duration-300" />
                  )}
                </button>
                <div 
                  className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? "max-h-48 opacity-100 mt-1" : "max-h-0 opacity-0"}`}
                >
                  {item.subItems!.map((subItem: any) => (
                    renderLink(subItem, true)
                  ))}
                </div>
              </div>
            ) : (
              renderLink(item)
            )}
          </div>
        );
      })}
    </nav>
  );
}

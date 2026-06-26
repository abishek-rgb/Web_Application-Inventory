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
  Truck
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
  }

  return (
    <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
      {navItems.map((item) => {
        const isActive = item.href ? pathname === item.href : false;
        const hasSubItems = item.subItems && item.subItems.length > 0;
        const isSubItemActive = hasSubItems && item.subItems!.some(sub => pathname === sub.href);
        const isOpen = openItems[item.label] ?? isSubItemActive;

        return (
          <div key={item.label}>
            {item.href && !hasSubItems ? (
              <Link
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-md transition-colors ${
                  isActive 
                    ? "bg-border text-primary font-semibold" 
                    : "text-text-primary hover:bg-border"
                }`}
              >
                <item.icon className={`w-5 h-5 mr-3 ${isActive ? "text-primary" : "text-text-secondary group-hover:text-primary"}`} />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            ) : (
              <div>
                <button
                  onClick={() => toggleItem(item.label)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-md transition-colors ${
                    isSubItemActive ? "text-primary font-semibold" : "text-text-primary hover:bg-border"
                  }`}
                >
                  <div className="flex items-center">
                    <item.icon className={`w-5 h-5 mr-3 ${isSubItemActive ? "text-primary" : "text-text-secondary group-hover:text-primary"}`} />
                    <span className="font-medium text-sm">{item.label}</span>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4 text-text-secondary" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-text-secondary" />
                  )}
                </button>
                {isOpen && hasSubItems && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.subItems!.map((subItem) => {
                      const isSubActive = pathname === subItem.href;
                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={`block px-4 py-2 rounded-md transition-colors text-sm ${
                            isSubActive
                              ? "bg-border text-primary font-medium"
                              : "text-text-secondary hover:bg-border hover:text-text-primary"
                          }`}
                        >
                          {subItem.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

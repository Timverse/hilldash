"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ShoppingBag, PackageCheck, Tags, MapPin,
  Settings, LayoutDashboard, LogOut, ClipboardList, Bike, Gift, DollarSign
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
]

const storeItems = [
  { href: "/dashboard/products", label: "Products", icon: PackageCheck },
  { href: "/dashboard/categories", label: "Categories", icon: Tags },
  { href: "/dashboard/orders", label: "Live Orders", icon: ClipboardList },
  { href: "/dashboard/riders", label: "Delivery Riders", icon: Bike },
  { href: "/dashboard/finance", label: "Finance & Accounting", icon: DollarSign },
]

const systemItems = [
  { href: "/dashboard/warehouses", label: "Hubs / Warehouses", icon: MapPin },
  { href: "/dashboard/discounts", label: "Discounts & Offers", icon: Gift },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

function NavLink({ href, label, icon: Icon, exact }: { href: string; label: string; icon: any; exact?: boolean }) {
  const pathname = usePathname()
  const isActive = exact ? pathname === href : pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
        isActive
          ? "bg-emerald-700 text-white shadow-sm"
          : "text-slate-300 hover:bg-slate-700 hover:text-white"
      )}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </Link>
  )
}

export function AdminSidebar({ role }: { role: string }) {
  // Filter system items based on role
  const filteredSystemItems = systemItems.filter(item => {
    if (item.href === "/dashboard/warehouses") {
      return role === "owner";
    }
    if (item.href === "/dashboard/discounts") {
      return role === "owner";
    }
    return true;
  });

  return (
    <aside className="w-60 bg-slate-800 flex flex-col fixed h-full z-20 shadow-xl font-sans antialiased">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-slate-700">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shadow">
            <ShoppingBag className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-base tracking-tight">Sawaïom</span>
          <span className="text-emerald-400 text-[10px] font-bold bg-emerald-900/50 px-2 py-0.5 rounded uppercase tracking-wider">{role}</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-0.5">
        {navItems.map(item => <NavLink key={item.href} {...item} />)}

        <div className="pt-4 pb-1 px-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Store</p>
        </div>
        {storeItems.map(item => <NavLink key={item.href} {...item} />)}

        <div className="pt-4 pb-1 px-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">System</p>
        </div>
        {filteredSystemItems.map(item => <NavLink key={item.href} {...item} />)}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-700">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-slate-700 hover:text-white transition-all"
        >
          <LogOut className="w-4 h-4" />
          Back to Store
        </Link>
      </div>
    </aside>
  )
}

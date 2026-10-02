"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  LayoutDashboard,
  Leaf,
  LogOut,
  Menu,
  Package,
  Search,
  ShoppingBag,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { clearAdminAuth, getAdminSession, isAdminAuthenticated } from "@/lib/auth";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/orders", label: "Orders", icon: ShoppingBag },
  { href: "/products", label: "Products", icon: Package },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [username, setUsername] = useState("Admin");
  const [search, setSearch] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.replace("/login");
      return;
    }
    setUsername(getAdminSession()?.username || "Admin");
    setReady(true);
  }, [router]);

  useEffect(() => {
    if (!menuOpen) return;
    function onClick(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  function signOut() {
    clearAdminAuth();
    router.replace("/login");
  }

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = search.trim();
    router.push(q ? `/products?q=${encodeURIComponent(q)}` : "/products");
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--af-bg)] text-slate-500">
        Loading dashboard…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--af-bg)] text-slate-900">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200/70 bg-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center gap-2.5 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
            <Leaf className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight">Aura Fresh</p>
            <p className="text-[11px] font-medium text-slate-500">Admin console</p>
          </div>
          <button
            type="button"
            className="ml-auto rounded-lg p-1.5 text-slate-500 lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                  active
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-3">
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Sign out
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          aria-label="Close overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200/70 bg-white/90 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <form onSubmit={onSearch} className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              className="w-full rounded-xl border border-transparent bg-slate-100/80 py-2 pl-9 pr-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white"
            />
          </form>

          <div ref={menuRef} className="relative ml-auto">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-slate-50"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                {username.slice(0, 1).toUpperCase()}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-sm font-semibold text-slate-800">Hi, {username}</span>
                <span className="block text-[11px] text-slate-500">Store manager</span>
              </span>
              <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
            </button>
            {menuOpen ? (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={signOut}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

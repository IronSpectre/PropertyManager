"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "Properties", href: "/properties" },
  { title: "Bookings", href: "/bookings" },
  { title: "Availability", href: "/availability" },
  { title: "Cleaning", href: "/cleaning" },
  { title: "Tasks", href: "/tasks" },
  { title: "Finance", href: "/finance" },
  { title: "Map", href: "/map" },
];

export function TopNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-50 w-full bg-primary shadow-md">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="text-xl tracking-tight text-primary-foreground">
            <span className="font-light">Property</span>
            <span className="font-semibold">Manager</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative text-sm tracking-wide transition-colors px-3 py-2 rounded-md",
                  isActive(item.href)
                    ? "text-white bg-white/20 font-medium"
                    : "text-primary-foreground/80 hover:text-white hover:bg-white/10"
                )}
              >
                {item.title}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <Link
              href="/account"
              className="hidden sm:block text-sm text-primary-foreground/80 hover:text-white transition-colors"
            >
              Account
            </Link>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-primary-foreground hover:bg-white/10"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-white/20 bg-primary">
          <nav className="mx-auto max-w-6xl px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "block px-3 py-2.5 text-sm rounded-md transition-colors",
                  isActive(item.href)
                    ? "text-white bg-white/20 font-medium"
                    : "text-primary-foreground/80 hover:text-white hover:bg-white/10"
                )}
              >
                {item.title}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

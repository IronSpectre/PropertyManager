"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Calendar,
  CalendarDays,
  ClipboardList,
  DollarSign,
  FileText,
  Home,
  Map,
  Sparkles,
  User,
  Waves,
  ChevronRight,
  Settings,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const mainNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
    color: "from-primary to-primary/70",
  },
  {
    title: "Properties",
    href: "/properties",
    icon: Building2,
    color: "from-blue-500 to-blue-400",
  },
  {
    title: "Bookings",
    href: "/bookings",
    icon: Calendar,
    color: "from-violet-500 to-violet-400",
  },
  {
    title: "Availability",
    href: "/availability",
    icon: CalendarDays,
    color: "from-cyan-500 to-cyan-400",
  },
  {
    title: "Cleaning",
    href: "/cleaning",
    icon: Sparkles,
    color: "from-amber-500 to-amber-400",
  },
];

const managementNavItems = [
  {
    title: "Tasks",
    href: "/tasks",
    icon: ClipboardList,
    color: "from-rose-500 to-rose-400",
  },
  {
    title: "Finance",
    href: "/finance",
    icon: DollarSign,
    color: "from-emerald-500 to-emerald-400",
  },
  {
    title: "Documents",
    href: "/documents",
    icon: FileText,
    color: "from-sky-500 to-sky-400",
  },
  {
    title: "Map",
    href: "/map",
    icon: Map,
    color: "from-teal-500 to-teal-400",
  },
];

function NavItem({ item, isActive }: { item: typeof mainNavItems[0]; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-gradient-to-r from-primary/15 to-primary/5 text-primary"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200",
          isActive
            ? `bg-gradient-to-br ${item.color} text-white shadow-lg shadow-primary/20`
            : "bg-sidebar-accent/80 text-sidebar-foreground/60"
        )}
      >
        <item.icon className="h-4 w-4" />
      </div>
      <span className="flex-1">{item.title}</span>
      {isActive && (
        <ChevronRight className="h-4 w-4 text-primary/60" />
      )}
    </Link>
  );
}

export function AppSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary to-accent blur-lg opacity-50" />
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-lg">
              <Waves className="h-5 w-5" />
            </div>
          </div>
          <div>
            <h1 className="font-bold text-sidebar-foreground">PropertyManager</h1>
            <p className="text-xs text-sidebar-foreground/50">Property Suite</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3">
        <SidebarGroup>
          <div className="mb-2 px-3">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
              Main
            </span>
          </div>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <NavItem item={item} isActive={isActive(item.href)} />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-6">
          <div className="mb-2 px-3">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
              Management
            </span>
          </div>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {managementNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <NavItem item={item} isActive={isActive(item.href)} />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Decorative Card */}
        <div className="mx-1 mt-8 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-accent/10 to-transparent p-4">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <h3 className="font-semibold text-sm text-sidebar-foreground">
            Quick Tip
          </h3>
          <p className="mt-1 text-xs text-sidebar-foreground/60 leading-relaxed">
            Use keyboard shortcuts for faster navigation across your properties.
          </p>
        </div>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <div className="rounded-xl bg-sidebar-accent/50 p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <Link
                href="/settings"
                className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <div className="flex items-center gap-3 rounded-lg px-2 py-2">
                <Avatar className="h-8 w-8 ring-2 ring-primary/20 ring-offset-2 ring-offset-sidebar">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-xs">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-sidebar-foreground">
                    Guest User
                  </p>
                  <p className="truncate text-xs text-sidebar-foreground/50">
                    Free Plan
                  </p>
                </div>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

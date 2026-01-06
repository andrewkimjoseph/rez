"use client";

import {
  BookOpen,
  LayoutDashboard,
  ListTodo,
  Settings,
  ExternalLink,
  Crown,
} from "lucide-react";
import Image from "next/image";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useTaskMasterStore } from "@/stores/taskmaster-store";

// Main navigation items
const mainNavItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Tasks",
    url: "/tasks",
    icon: ListTodo,
  },
  {
    title: "Resources",
    url: "/resources",
    icon: BookOpen,
  },
];

// Settings & account items
const settingsItems = [
  {
    title: "Account",
    url: "/account",
    icon: Settings,
  },
];

// External links
const externalItems = [
  {
    title: "Pax: Analytics",
    url: "/pax",
    iconElement: <Image src="/pax.png" alt="Pax Logo" width={18} height={18} className="rounded-sm" />,
    external: false,
  },
];

// Admin items (only shown for superadmins)
const adminItems = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: Crown,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useTaskMasterStore();
  const isSuperAdmin = user?.isSuperAdmin === true;

  const isActive = (url: string) => {
    return pathname === url || pathname.startsWith(url + "/");
  };

  return (
    <Sidebar 
      variant="sidebar" 
      collapsible="icon" 
      className="border-r-0"
    >
      {/* Header with Logo */}
      <SidebarHeader className="px-4 py-5">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <Image 
            src="/rez-logo.svg" 
            alt="Rez" 
            width={48} 
            height={48} 
            className="shrink-0"
          />
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-lg font-semibold rez-gradient-text">Rez</span>
            <span className="text-xs text-sidebar-foreground/60">by Canvassing</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs font-medium uppercase tracking-wider px-3 mb-1">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={isActive(item.url)}
                    className="h-10 px-3 rounded-lg transition-all duration-200 hover:bg-sidebar-accent data-[active=true]:rez-gradient data-[active=true]:text-white data-[active=true]:shadow-sm"
                  >
                    <Link href={item.url}>
                      <item.icon className="w-[18px] h-[18px] shrink-0" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-3 bg-sidebar-border/50" />

        {/* Settings */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs font-medium uppercase tracking-wider px-3 mb-1">
            Settings
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={isActive(item.url)}
                    className="h-10 px-3 rounded-lg transition-all duration-200 hover:bg-sidebar-accent data-[active=true]:rez-gradient data-[active=true]:text-white data-[active=true]:shadow-sm"
                  >
                    <Link href={item.url}>
                      <item.icon className="w-[18px] h-[18px] shrink-0" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section - Only visible for superadmins */}
        {isSuperAdmin && (
          <>
            <Separator className="my-3 bg-sidebar-border/50" />
            <SidebarGroup>
              <SidebarGroupLabel className="text-amber-600/80 text-xs font-medium uppercase tracking-wider px-3 mb-1">
                Admin
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild
                        isActive={isActive(item.url)}
                        className="h-10 px-3 rounded-lg transition-all duration-200 hover:bg-amber-500/10 data-[active=true]:bg-amber-500/20 data-[active=true]:text-amber-700"
                      >
                        <Link href={item.url}>
                          <item.icon className="w-[18px] h-[18px] shrink-0 text-amber-600" />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      {/* Footer with External Links */}
      <SidebarFooter className="px-2 pb-4">
        <Separator className="mb-3 bg-sidebar-border/50" />
        <SidebarMenu>
          {externalItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton 
                asChild
                isActive={isActive(item.url)}
                className="h-10 px-3 rounded-lg transition-all duration-200 hover:bg-sidebar-accent"
              >
                <Link href={item.url}>
                  {item.iconElement}
                  <span className="font-medium">{item.title}</span>
                  {item.external && (
                    <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

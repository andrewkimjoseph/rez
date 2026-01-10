"use client";

import {
  BookOpenIcon,
  Squares2X2Icon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  ArrowTopRightOnSquareIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  InformationCircleIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

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
  useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useTaskMasterStore } from "@/stores/taskmaster-store";
import { useEffect } from "react";

// Main navigation items
const mainNavItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Squares2X2Icon,
  },
  {
    title: "Tasks",
    url: "/tasks",
    icon: ClipboardDocumentListIcon,
  },
  {
    title: "Resources",
    url: "/resources",
    icon: BookOpenIcon,
  },
];

// Settings & account items
const settingsItems = [
  {
    title: "Account",
    url: "/account",
    icon: Cog6ToothIcon,
  },
];

// External links
const externalItems = [
  // PAX ROUTE COMMENTED OUT - NOT ACCESSIBLE
  // {
  //   title: "Pax: Analytics",
  //   url: "/pax",
  //   iconElement: <Image src="/pax.png" alt="Pax Logo" width={18} height={18} className="rounded-sm" />,
  //   external: false,
  // },
];

// Legal links
const legalItems = [
  {
    title: "About",
    url: "/about",
    icon: InformationCircleIcon,
  },
  {
    title: "Terms of Service",
    url: "/terms-of-service",
    icon: DocumentTextIcon,
  },
  {
    title: "Privacy Policy",
    url: "/privacy-policy",
    icon: DocumentTextIcon,
  },
];

// Admin items (only shown for superadmins)
const adminItems = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: ShieldCheckIcon,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useTaskMasterStore();
  const isSuperAdmin = user?.isSuperAdmin === true;
  const { isMobile, setOpenMobile } = useSidebar();

  const isActive = (url: string) => {
    return pathname === url || pathname.startsWith(url + "/");
  };

  // Close sidebar on mobile when pathname changes
  useEffect(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [pathname, isMobile, setOpenMobile]);

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
        {/* Prominent Create Task Button */}
        <div className="px-3 mb-4">
          <Link href="/tasks" className="block">
            <Button 
              className="w-full rez-gradient hover:opacity-90 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 h-11 text-base group-data-[collapsible=icon]:w-12 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center"
              size="lg"
            >
              <PlusIcon className="w-5 h-5 group-data-[collapsible=icon]:w-4 group-data-[collapsible=icon]:h-4" />
              <span className="group-data-[collapsible=icon]:hidden ml-1">Create Task</span>
            </Button>
          </Link>
        </div>

        <Separator className="mb-3 bg-sidebar-border/50 group-data-[collapsible=icon]:hidden" />

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

      {/* Footer with External Links and Legal */}
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
                    <ArrowTopRightOnSquareIcon className="w-3 h-3 ml-auto opacity-50" />
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          {legalItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton 
                asChild
                isActive={isActive(item.url)}
                className="h-10 px-3 rounded-lg transition-all duration-200 hover:bg-sidebar-accent"
              >
                <Link href={item.url}>
                  <item.icon className="w-[18px] h-[18px] shrink-0 opacity-60" />
                  <span className="font-medium text-sidebar-foreground/70 text-sm">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

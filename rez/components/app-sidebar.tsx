import {
  BookOpen,
  ChartBar,
  LayoutDashboard,
  ListTodo,
  Settings
} from "lucide-react";
import Image from "next/image";
import React from "react";
import Link from "next/link";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

// Menu items.
const items = [
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
    title: "Analytics",
    url: "/analytics",
    icon: ChartBar,
  },
  {
    title: "Resources",
    url: "/resources",
    icon: BookOpen,
  },
  {
    title: "Account",
    url: "/account",
    icon: Settings,
  },
  {
    title: "Pax",
    url: "/pax",
    icon: (props: any) => (
      <Image src="/pax.png" alt="Pax Logo" width={24} height={24} {...props} />
    ),
  },
];

export function AppSidebar() {
  return (
    <Sidebar variant="sidebar" collapsible="offcanvas" className="font-[family-name:var(--font-sen)]">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="">
            <Image src="/rez-logo.svg" alt="Rez" width={100} height={100} />

            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url} passHref>
                   
                        {typeof item.icon === "function"
                          ? item.icon({ className: "w-5 h-5" })
                          : React.createElement(item.icon, { className: "w-5 h-5" })}
                        <span>{item.title}</span>
                
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

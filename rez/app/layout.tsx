"use client";

import { Sen } from "next/font/google";
import "./globals.css";
import { SidebarProvider, } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AppNavbar } from "@/components/app-navbar";
import { usePathname } from "next/navigation";

const sen = Sen({
  variable: "--font-sen",
  subsets: ["latin"],
});

// export const metadata: Metadata = {
//   title: "Rez",
//   description: "Rez, by Canvassing",
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isSignInPageOrOnboarding = pathname === "/sign-in" || pathname === "/organization-onboarding";

  return (
    <html lang="en">
      <body className={`${sen.variable} antialiased`}>
        <SidebarProvider>
            {!isSignInPageOrOnboarding && <AppSidebar />}
          <main className="flex flex-col w-full">
            {!isSignInPageOrOnboarding && <AppNavbar />}
            <div>{children}</div>
          </main>
        </SidebarProvider>
      </body>
    </html>
  );
}

"use client";

import { DM_Sans } from "next/font/google";
import "./globals.css";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AppNavbar } from "@/components/app-navbar";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { TallyWidget } from "@/components/tally-widget";
import { AmplitudeProvider } from "@/providers/AmplitudeProvider";
import { AuthHydrator } from "@/components/auth-hydrator";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isSignInPageOrOnboarding =
    pathname === "/sign-in" || pathname === "/organization-onboarding";

  return (
    <html lang="en">
      <head>
        <title>Rez</title>
        <meta name="description" content="Rez, by Canvassing" />
        <link rel="icon" href="/rez-favicon.svg" sizes="any" />
        <meta property="og:title" content="Rez" />
        <meta property="og:description" content="Rez, by Canvassing" />
        <meta property="og:image" content="/rez-favicon.svg" />
      </head>
      <body className={`${dmSans.variable} font-[family-name:var(--font-dm-sans)] antialiased`}>
        <AuthHydrator />
        <AmplitudeProvider>
          <SidebarProvider>
            {!isSignInPageOrOnboarding && <AppSidebar />}
            <main className="flex flex-col w-full min-h-screen">
              {!isSignInPageOrOnboarding && <AppNavbar />}
              <div className="flex-1 enterprise-gradient relative">
                <div className="absolute inset-0 rez-gradient-subtle pointer-events-none" />
                <div className="relative">{children}</div>
              </div>
            </main>
          </SidebarProvider>
          <Script
            src="https://tally.so/widgets/embed.js"
            strategy="afterInteractive"
          />
          <TallyWidget />
        </AmplitudeProvider>
      </body>
    </html>
  );
}

"use client";

import { Fraunces, Sen } from "next/font/google";
import "./globals.css";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AppNavbar } from "@/components/app-navbar";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { TallyWidget } from "@/components/tally-widget";
import { AmplitudeProvider } from "@/providers/AmplitudeProvider";
import { AuthHydrator } from "@/components/auth-hydrator";
import { Toaster } from "@/components/toaster";
import { useTaskMasterStore } from "@/stores/taskmaster-store";

const sen = Sen({
  variable: "--font-sen",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const { user } = useTaskMasterStore();
  const isSignInPage = pathname === "/sign-in";
  const isSignInPageOrOnboarding =
    isSignInPage || pathname === "/organization-onboarding";
  
  // Hide navbar/sidebar for terms/privacy/about pages when user is not logged in
  const isPublicLegalPage = pathname === "/terms-of-service" || pathname === "/privacy-policy" || pathname === "/about";
  const shouldHideNavAndSidebar = isSignInPageOrOnboarding || (isPublicLegalPage && !user);

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
      <body className={`${sen.variable} ${fraunces.variable} font-[family-name:var(--font-sen)] antialiased`}>
        <AuthHydrator />
        <AmplitudeProvider>
          <SidebarProvider>
            {!shouldHideNavAndSidebar && <AppSidebar />}
            <main className="flex flex-col w-full min-h-screen overflow-x-hidden">
              {!shouldHideNavAndSidebar && <AppNavbar />}
              <div
                className={`flex-1 relative overflow-x-hidden ${isSignInPage ? "bg-background" : "enterprise-gradient"}`}
              >
                {!isSignInPage && (
                  <div className="absolute inset-0 rez-gradient-subtle pointer-events-none" />
                )}
                <div className="relative overflow-x-hidden">{children}</div>
              </div>
            </main>
          </SidebarProvider>
          <Script
            src="https://tally.so/widgets/embed.js"
            strategy="afterInteractive"
          />
          <TallyWidget />
          <Toaster />
        </AmplitudeProvider>
      </body>
    </html>
  );
}

"use client";

import { Sen } from "next/font/google";
import "./globals.css";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AppNavbar } from "@/components/app-navbar";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { TallyWidget } from "@/components/tally-widget";
import { AmplitudeProvider } from "@/providers/AmplitudeProvider";
import { AuthHydrator } from "@/components/auth-hydrator";

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
      <body className={`${sen.variable} antialiased `}>
        <AuthHydrator />
        <AmplitudeProvider>
          <SidebarProvider>
            {!isSignInPageOrOnboarding && <AppSidebar />}
            <main className="flex flex-col w-full font-[family-name:var(--font-sen)]">
              {!isSignInPageOrOnboarding && <AppNavbar />}
              <div className="bg-[#ECECEC]">{children}</div>
            </main>
          </SidebarProvider>
          <Script
            src="https://tally.so/widgets/embed.js"
            strategy="afterInteractive"
          />
          {/* Custom Support Button */}
          <TallyWidget />
        </AmplitudeProvider>
      </body>
    </html>
  );
}

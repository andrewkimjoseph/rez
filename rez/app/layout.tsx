"use client";

import { Sen } from "next/font/google";
import "./globals.css";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AppNavbar } from "@/components/app-navbar";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { MessageCircle } from "lucide-react";

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
        <SidebarProvider>
          {!isSignInPageOrOnboarding && <AppSidebar />}
          <main className="flex flex-col w-full font-[family-name:var(--font-sen)]">

          
            
            {!isSignInPageOrOnboarding && <AppNavbar />}
            <div className="bg-[#ECECEC]">{children}</div>
          </main>
        </SidebarProvider>
        <Script src="https://tally.so/widgets/embed.js" strategy="afterInteractive" />
        {/* Custom Support Button */}
        <button
          type="button"
          onClick={() => {
            if (
              typeof window !== "undefined" &&
              typeof (window as { Tally?: { openPopup?: (id: string) => void } }).Tally?.openPopup === "function"
            ) {
              (window as { Tally: { openPopup: (id: string) => void } }).Tally.openPopup('wMZLL0');
            }
          }}
          className="fixed bottom-4 right-4 z-[100] bg-[#363062] text-white p-3 rounded-full shadow-lg hover:bg-[#2d254c] transition-colors flex items-center justify-center"
          title="Get Support"
        >
          <MessageCircle size={24} />
        </button>
      </body>
    </html>
  );
}

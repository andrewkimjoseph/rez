"use client";

import { useEffect, useRef } from "react";
import { MessageCircle } from "lucide-react";

// Add global declaration for window.Tally
declare global {
  interface Window {
    Tally?: {
      openPopup: (id: string, options?: Record<string, unknown>) => void;
    };
  }
}

export function TallyWidget() {
  const scriptLoaded = useRef(false);

  useEffect(() => {
    // Load Tally script
    const script = document.createElement("script");
    script.src = "https://tally.so/widgets/embed.js";
    script.async = true;
    
    script.onload = () => {
      scriptLoaded.current = true;
    };
    
    document.body.appendChild(script);

    return () => {
      // Cleanup script when component unmounts
      const existingScript = document.querySelector('script[src="https://tally.so/widgets/embed.js"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  const handleOpenPopup = () => {
    if (scriptLoaded.current && typeof window.Tally !== "undefined") {
      window.Tally.openPopup("wMZLL0", {
        emojiText: "👋",
        emojiAnimation: "wave"
      });
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Tally Popup Button */}
      <button
        onClick={handleOpenPopup}
        className="bg-[#363062] text-white p-3 rounded-full shadow-lg hover:bg-[#2d254c] transition-colors"
        title="Get Support"
      >
        <MessageCircle size={24} />
      </button>
    </div>
  );
} 
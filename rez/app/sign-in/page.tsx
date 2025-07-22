"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signInWithGoogle } from "@/firebase/auth";
import { useState } from "react";
import { Loader2Icon } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGoogleSignIn() {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      router.push("/organization-onboarding");
    } catch (err: any) {
      if (err?.code === "auth/popup-closed-by-user") {
        setError("Sign-in was cancelled.");
        setLoading(false);
        return;
      }
      setError("Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Side */}
      <div className="flex-1 flex items-center justify-center bg-white py-8 md:py-0">
        <div className="p-[4px] rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-[#ff9966] via-[#f857a6] to-[#ff5858] w-full max-w-md mx-4 md:mx-0">
          <div className="bg-white rounded-[2.5rem] p-6 md:p-10 flex flex-col items-center gap-6 w-full">
            <Image
              src="/rez-logo.svg"
              alt="Rez Logo"
              width={100}
              height={100}
              className="w-20 h-20 md:w-32 md:h-32"
            />
            <h1 className="text-2xl md:text-4xl font-bold text-center">
              <span className="text-[#2d254c]">Welcome </span>
              <span className="bg-gradient-to-r from-[#ff9966] via-[#f857a6] to-[#ff5858] text-transparent bg-clip-text">
                to Rez
                <br />
                by Canvassing
              </span>
            </h1>
            <Button
              size="sm"
              className="w-full mt-8"
              variant={"outline"}
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2Icon className="animate-spin mr-2" />
                  Please wait
                </>
              ) : (
                <>
                  <Image
                    src="/google.svg"
                    alt="Google"
                    width={20}
                    height={20}
                    className="mr-2"
                  />
                  Continue with Google
                </>
              )}
            </Button>

            <div className="text-red-500 text-sm mt-2 text-center">{error}</div>
          </div>
        </div>
      </div>
      {/* Right Side */}
      <div className="flex-1 flex flex-col justify-center items-center bg-[#ef5366] relative min-h-[300px] md:min-h-0">
        <div className="flex-1 flex items-end justify-center w-full relative">
          <Image
            src="/friends-posing.png"
            alt="friends posing"
            fill
            className="object-contain w-full h-full max-w-none max-h-none"
          />
          <div className="absolute inset-0 flex items-start justify-center pt-4 md:pt-8 pointer-events-none">
            <span className="text-lg md:text-2xl font-semibold text-[#2d254c] max-w-xs text-center bg-white/80 rounded-lg px-2 md:px-4 py-1 md:py-2 shadow">
              Reach real users who actively use stablecoins in their daily
              lives.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

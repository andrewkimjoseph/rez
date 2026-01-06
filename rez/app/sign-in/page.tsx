"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signInTaskMasterWithGoogle } from "@/firebase/auth/auth";
import { useState, useEffect } from "react";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { usePathname } from "next/navigation";
import { createTaskMasterInFirestore } from "@/firebase/firestore/services/createTaskMasterInFirestore";
import { useTaskMasterStore } from "@/stores/taskmaster-store";
import { getTaskMasterFromFirestore } from "@/firebase/firestore/services/getTaskMasterFromFirestore";
import { useAmplitudeEvents } from "@/hooks/use-amplitude-events";
import { useTasksStore } from "@/stores/tasks-store";

export default function SignInPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const setTaskMasterUser = useTaskMasterStore((state) => state.setUser);
  const {
    signInWithGoogleClicked,
    signInWithGoogleFailed,
    signInWithGoogleComplete,
    setTaskMasterId,
    identifyTaskMaster,
  } = useAmplitudeEvents();
  const { fetchTasksAndCompletions } = useTasksStore();

  useEffect(() => {
    setLoading(false);
  }, [pathname]);

  async function handleGoogleSignIn() {
    setError(null);
    setLoading(true);
    signInWithGoogleClicked();
    try {
      const user = await signInTaskMasterWithGoogle();
      if (user) {
        const token = await user.getIdToken();
        const existingTaskMaster = await getTaskMasterFromFirestore(user.uid);
        if (existingTaskMaster) {
          document.cookie = `firebaseToken=${token}; path=/;`;
          if (existingTaskMaster.organizationId) {
            document.cookie = `organizationId=${existingTaskMaster.organizationId}; path=/;`;
          }
          setTaskMasterUser(existingTaskMaster);
          // Refresh tasks after login
          fetchTasksAndCompletions();
          router.push("/dashboard");
          setTaskMasterId(user.uid);
          identifyTaskMaster({
            rez_task_master_id: existingTaskMaster.id,
            rez_task_master_email_address: existingTaskMaster.emailAddress,
            rez_task_master_name: existingTaskMaster.name,
            rez_task_master_org_id: existingTaskMaster.organizationId,
          });
          signInWithGoogleComplete();
          return;
        } else {
          const taskMaster = {
            id: user.uid,
            name: user.displayName || null,
            emailAddress: user.email || null,
            profilePictureURI: user.photoURL || null,
            organizationId: null,
            privyDid: null,
          };
          await createTaskMasterInFirestore(taskMaster);
          setTaskMasterUser(taskMaster);
          document.cookie = `firebaseToken=${token}; path=/;`;
          setTaskMasterId(user.uid);
          identifyTaskMaster({
            rez_task_master_id: taskMaster.id,
            rez_task_master_email_address: taskMaster.emailAddress,
            rez_task_master_name: taskMaster.name,
          });
          signInWithGoogleComplete(taskMaster);
        }
      }
      router.push("/organization-onboarding");
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      signInWithGoogleFailed({
        error_message: error?.message,
      });
      if (error?.code === "auth/popup-closed-by-user") {
        setError("Sign-in was cancelled.");
        setLoading(false);
        return;
      }
      if (error?.code === "auth/email-not-allowed") {
        setError("This email is not allowed to sign in.");
        setLoading(false);
        return;
      }
      setError("Google sign-in failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Sign In Form */}
      <div className="flex-1 flex items-center justify-center bg-background p-6 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Logo & Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-2xl bg-primary/5">
                <Image
                  src="/rez-logo.svg"
                  alt="Rez Logo"
                  width={64}
                  height={64}
                  className="w-16 h-16"
                />
              </div>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Welcome to <span className="rez-gradient-text">Rez</span>
            </h1>
            <p className="text-muted-foreground">
              Sign in to manage your research tasks
            </p>
          </div>

          {/* Sign In Card */}
          <div className="enterprise-card bg-card rounded-xl border border-border/50 p-8 shadow-sm">
            <div className="space-y-6">
              <div className="space-y-2 text-center">
                <h2 className="text-lg font-medium text-foreground">Sign in to continue</h2>
                <p className="text-sm text-muted-foreground">
                  Use your Google account to get started
                </p>
              </div>

              <Button
                size="lg"
                className="w-full h-12 text-base"
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <ArrowPathIcon className="animate-spin mr-2 h-5 w-5" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Image
                      src="/google.svg"
                      alt="Google"
                      width={20}
                      height={20}
                      className="mr-3"
                    />
                    Continue with Google
                  </>
                )}
              </Button>

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive text-center">{error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <p className="text-xs text-center text-muted-foreground">
            By signing in, you agree to our terms of service and privacy policy.
          </p>
        </div>
      </div>

      {/* Right Side - Hero Image */}
      <div className="hidden lg:flex flex-1 relative rez-gradient overflow-hidden">
        {/* Decorative Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
          <div className="max-w-lg text-center space-y-6">
            {/* Hero Image */}
            <div className="relative w-80 h-80 mx-auto mb-8">
              <Image
                src="/friends-posing.png"
                alt="Research participants"
                fill
                className="object-contain"
                priority
              />
            </div>

            {/* Tagline */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-white">
                Reach Real Users
              </h2>
              <p className="text-lg text-white/80 leading-relaxed">
                Connect with users who actively use stablecoins in their daily lives. 
                Get authentic insights for your research.
              </p>
            </div>

            {/* Stats or Features */}
            <div className="flex justify-center gap-8 pt-6">
              <div className="text-center">
                <p className="text-3xl font-semibold text-white">1000+</p>
                <p className="text-sm text-white/70">Active Users</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-semibold text-white">50+</p>
                <p className="text-sm text-white/70">Countries</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-semibold text-white">24h</p>
                <p className="text-sm text-white/70">Avg Response</p>
              </div>
            </div>
          </div>

          {/* Powered by badge */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
            <p className="text-sm text-white/60">Powered by Canvassing</p>
          </div>
        </div>
      </div>
    </div>
  );
}

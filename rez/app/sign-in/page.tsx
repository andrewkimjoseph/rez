"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInTaskMasterWithGoogle } from "@/firebase/auth/auth";
import { useState, useEffect } from "react";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { usePathname } from "next/navigation";
import { createTaskMasterInFirestore } from "@/firebase/firestore/services/createTaskMasterInFirestore";
import { useTaskMasterStore } from "@/stores/taskmaster-store";
import { getTaskMasterFromFirestore } from "@/firebase/firestore/services/getTaskMasterFromFirestore";
import { linkTaskMasterToLead } from "@/firebase/firestore/services/linkTaskMasterToLead";
import { useAmplitudeEvents } from "@/hooks/use-amplitude-events";
import { useTasksStore } from "@/stores/tasks-store";

// Helper to get leadEmail from URL params or cookie (for cross-domain lead linking)
function getLeadEmail(): string | null {
  if (typeof window === 'undefined') return null;
  
  // 1. Check URL params first (higher priority - direct from Brevo email link)
  const urlParams = new URLSearchParams(window.location.search);
  const paramEmail = urlParams.get('leadEmail');
  if (paramEmail) return decodeURIComponent(paramEmail);
  
  // 2. Check cookie (fallback - set when user submitted form on thecanvassing.xyz)
  const cookies = document.cookie.split(';');
  const leadCookie = cookies.find(c => c.trim().startsWith('leadEmail='));
  if (leadCookie) {
    return decodeURIComponent(leadCookie.split('=')[1].trim());
  }
  
  return null;
}

// Clear the lead cookie after linking attempt
function clearLeadCookie(): void {
  if (typeof window === 'undefined') return;
  document.cookie = 'leadEmail=; domain=.thecanvassing.xyz; path=/; max-age=0';
}

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
            ...(existingTaskMaster.emailAddress && { rez_task_master_email_address: existingTaskMaster.emailAddress }),
            ...(existingTaskMaster.name && { rez_task_master_name: existingTaskMaster.name }),
            ...(existingTaskMaster.organizationId && { rez_task_master_org_id: existingTaskMaster.organizationId }),
          });
          signInWithGoogleComplete();
          
          // Fire-and-forget: link TaskMasterLead if returning user came from thecanvassing.xyz
          const leadEmail = getLeadEmail();
          if (leadEmail) {
            linkTaskMasterToLead(leadEmail, user.uid).catch(() => {});
            clearLeadCookie();
            
            // Fire-and-forget: update Premium CTA leads in Brevo with CUSTOMER_LEVEL = "Trial"
            fetch('/api/fireTriggerForAutomationP2', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            }).catch(() => {});
            
            // Fire-and-forget: update Playbook leads in Brevo with PLAYBOOK_STAGE = "Account Created"
            fetch('/api/fireTriggerForAutomationB2', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            }).catch(() => {});
            
            // Fire-and-forget: update Calculator leads in Brevo with CALCULATOR_STAGE = "Account Created"
            fetch('/api/fireTriggerForAutomationC2', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            }).catch(() => {});
          }
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
            ...(taskMaster.emailAddress && { rez_task_master_email_address: taskMaster.emailAddress }),
            ...(taskMaster.name && { rez_task_master_name: taskMaster.name }),
          });
          signInWithGoogleComplete(taskMaster);
          // Fire-and-forget notification to RezTotifier (Telegram) about new account
          try {
            fetch(`/api/notifyRezTotifierOfNewAccount`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: taskMaster.id,
                name: taskMaster.name,
                emailAddress: taskMaster.emailAddress,
                profilePictureURI: taskMaster.profilePictureURI,
              }),
            }).catch(() => {});
          } catch (_) {
            // Silently ignore notification errors in client
          }
          
          // Fire-and-forget: link TaskMasterLead from thecanvassing.xyz to this new account
          const leadEmail = getLeadEmail();
          if (leadEmail) {
            linkTaskMasterToLead(leadEmail, user.uid).catch(() => {});
            clearLeadCookie();
            
            // Fire-and-forget: update Premium CTA leads in Brevo with CUSTOMER_LEVEL = "Trial"
            fetch('/api/fireTriggerForAutomationP2', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            }).catch(() => {});
            
            // Fire-and-forget: update Playbook leads in Brevo with PLAYBOOK_STAGE = "Account Created"
            fetch('/api/fireTriggerForAutomationB2', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            }).catch(() => {});
            
            // Fire-and-forget: update Calculator leads in Brevo with CALCULATOR_STAGE = "Account Created"
            fetch('/api/fireTriggerForAutomationC2', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            }).catch(() => {});
          }
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
    <div className="min-h-screen flex flex-col lg:flex-row overflow-hidden">
      {/* Left Side - Sign In Form */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-background via-background to-background/95 p-6 lg:p-12 relative">
        {/* Subtle background decoration */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dots" width="32" height="32" patternUnits="userSpaceOnUse">
                <circle cx="16" cy="16" r="1.5" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
        </div>

        <div className="w-full max-w-md space-y-8 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Logo & Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center mb-4">
              <Image
                src="/rez-logo.svg"
                alt="Rez Logo"
                width={64}
                height={64}
                className="w-16 h-16"
              />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">
              Welcome to <span className="rez-gradient-text">Rez</span>
            </h1>
            <p className="text-muted-foreground text-base">
              Sign in to manage your research tasks
            </p>
          </div>

          {/* Sign In Card */}
          <div className="enterprise-card bg-card rounded-2xl border border-border/50 p-8 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
            <div className="space-y-6">
              <div className="space-y-2 text-center">
                <h2 className="text-xl font-semibold text-foreground">Sign in to continue</h2>
                <p className="text-sm text-muted-foreground">
                  Use your Google account to get started
                </p>
              </div>

              <Button
                size="lg"
                className="w-full h-14 text-base font-medium shadow-sm hover:shadow-md transition-all duration-200 border-2 hover:border-primary/20"
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
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 animate-in slide-in-from-top-2 duration-200">
                  <p className="text-sm text-destructive text-center font-medium">{error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <p className="text-xs text-center text-muted-foreground leading-relaxed">
            By signing in, you agree to our{" "}
            <Link href="/terms-of-service" className="underline hover:text-foreground transition-colors">terms of service</Link>{" "}
            and{" "}
            <Link href="/privacy-policy" className="underline hover:text-foreground transition-colors">privacy policy</Link>.
          </p>
        </div>
      </div>

      {/* Right Side - Hero */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 overflow-hidden min-h-screen">
        {/* Decorative grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.1] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '32px 32px'
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 animate-in fade-in slide-in-from-right-4 duration-700 min-h-screen">
          <div className="max-w-lg text-center space-y-6">
            {/* Hero Image */}
            <div className="relative w-[500px] h-[500px] mx-auto mb-8 group">
              <div className="absolute inset-0 bg-white/10 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500" />
              <div className="relative w-full h-full">
                <Image
                  src="/friends-posing.png"
                  alt="Research participants"
                  fill
                  className="object-contain drop-shadow-2xl group-hover:scale-105 transition-transform duration-500"
                  priority
                />
              </div>
            </div>

            {/* Tagline */}
            <div className="space-y-5">
              <h2 className="text-3xl font-bold text-white tracking-tight">
                Reach Real Users
              </h2>
              <p className="text-lg text-white/90 leading-relaxed max-w-md mx-auto">
                Connect with users who actively use stablecoins in their daily lives. 
                Get authentic insights for your research.
              </p>
            </div>

            {/* Stats or Features */}
            {/* <div className="flex justify-center gap-12 pt-8 border-t border-white/10">
              <div className="text-center group">
                <p className="text-4xl font-bold text-white mb-1 group-hover:scale-110 transition-transform duration-300">500+</p>
                <p className="text-sm text-white/80 font-medium">Active Users</p>
              </div>
              <div className="text-center group">
                <p className="text-4xl font-bold text-white mb-1 group-hover:scale-110 transition-transform duration-300">2+</p>
                <p className="text-sm text-white/80 font-medium">Countries</p>
              </div>
              <div className="text-center group">
                <p className="text-4xl font-bold text-white mb-1 group-hover:scale-110 transition-transform duration-300">12h</p>
                <p className="text-sm text-white/80 font-medium">Avg Response</p>
              </div>
            </div> */}
          </div>

          {/* Powered by badge */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
            <p className="text-sm text-white/70 font-medium">
              Powered by{" "}
              <a 
                href="https://thecanvassing.xyz" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-white transition-colors"
              >
                Canvassing
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

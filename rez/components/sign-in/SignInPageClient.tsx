"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { signInTaskMasterWithGoogle } from "@/firebase/auth/auth";
import { createTaskMasterInFirestore } from "@/firebase/firestore/services/createTaskMasterInFirestore";
import { useTaskMasterStore } from "@/stores/taskmaster-store";
import { getTaskMasterFromFirestore } from "@/firebase/firestore/services/getTaskMasterFromFirestore";
import { linkTaskMasterToLead } from "@/firebase/firestore/services/linkTaskMasterToLead";
import { useAmplitudeEvents } from "@/hooks/use-amplitude-events";
import { useTasksStore } from "@/stores/tasks-store";
import { formatTicketId } from "@/components/sign-in/sign-in-field-panel-parts";

const VALID_LEAD_SOURCES = ["Premium CTA", "Playbook", "Calculator"] as const;
type LeadSource = (typeof VALID_LEAD_SOURCES)[number];

function getLeadEmail(): string | null {
  if (typeof window === "undefined") return null;

  const urlParams = new URLSearchParams(window.location.search);
  const paramEmail = urlParams.get("leadEmail");
  if (paramEmail) return decodeURIComponent(paramEmail);

  const cookies = document.cookie.split(";");
  const leadCookie = cookies.find((c) => c.trim().startsWith("leadEmail="));
  if (leadCookie) {
    return decodeURIComponent(leadCookie.split("=")[1].trim());
  }

  return null;
}

function getLeadSource(): LeadSource | null {
  if (typeof window === "undefined") return null;
  const urlParams = new URLSearchParams(window.location.search);
  const param = urlParams.get("leadSource");
  if (!param) return null;
  const decoded = decodeURIComponent(param).trim();
  return VALID_LEAD_SOURCES.includes(decoded as LeadSource)
    ? (decoded as LeadSource)
    : null;
}

function clearLeadCookie(): void {
  if (typeof window === "undefined") return;
  document.cookie = "leadEmail=; domain=.thecanvassing.xyz; path=/; max-age=0";
}

function fireLeadAutomation(leadSource: LeadSource | null) {
  if (leadSource === "Premium CTA") {
    fetch("/api/fireTriggerForAutomationP2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }).catch(() => {});
  } else if (leadSource === "Playbook") {
    fetch("/api/fireTriggerForAutomationB2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }).catch(() => {});
  } else if (leadSource === "Calculator") {
    fetch("/api/fireTriggerForAutomationC2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }).catch(() => {});
  }
}

function handleLeadLinking(userId: string) {
  const leadEmail = getLeadEmail();
  if (!leadEmail) return;

  linkTaskMasterToLead(leadEmail, userId).catch(() => {});
  fetch("/api/updateBrevoLeadEmail", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ leadEmail }),
  }).catch(() => {});
  clearLeadCookie();
  fireLeadAutomation(getLeadSource());
}

function getCountryCodeFromLocale(): string | null {
  if (typeof window === "undefined") return null;
  const locale = navigator.language;
  if (!locale) return null;

  try {
    if (typeof Intl !== "undefined" && "Locale" in Intl) {
      const region = new Intl.Locale(locale).region;
      if (region && /^[A-Za-z]{2}$/.test(region)) {
        return region.toUpperCase();
      }
    }
  } catch {
    // fall through to string parsing
  }

  const segments = locale.split("-");
  const candidate = segments[segments.length - 1];
  if (candidate && /^[A-Za-z]{2}$/.test(candidate)) {
    return candidate.toUpperCase();
  }

  return null;
}

export function SignInPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ticketId, setTicketId] = useState("------");
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
    setTicketId(formatTicketId(new Date(), getCountryCodeFromLocale()));
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
          fetchTasksAndCompletions(true);
          router.push("/dashboard");
          setTaskMasterId(user.uid);
          identifyTaskMaster({
            rez_task_master_id: existingTaskMaster.id,
            ...(existingTaskMaster.emailAddress && {
              rez_task_master_email_address: existingTaskMaster.emailAddress,
            }),
            ...(existingTaskMaster.name && {
              rez_task_master_name: existingTaskMaster.name,
            }),
            ...(existingTaskMaster.organizationId && {
              rez_task_master_org_id: existingTaskMaster.organizationId,
            }),
          });
          signInWithGoogleComplete();
          handleLeadLinking(user.uid);
          return;
        }

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
          ...(taskMaster.emailAddress && {
            rez_task_master_email_address: taskMaster.emailAddress,
          }),
          ...(taskMaster.name && { rez_task_master_name: taskMaster.name }),
        });
        signInWithGoogleComplete(taskMaster);

        fetch("/api/notifyRezTotifierOfNewAccount", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: taskMaster.id,
            name: taskMaster.name,
            emailAddress: taskMaster.emailAddress,
            profilePictureURI: taskMaster.profilePictureURI,
          }),
        }).catch(() => {});

        handleLeadLinking(user.uid);
      }

      router.push("/organization-onboarding");
    } catch (err: unknown) {
      const authError = err as { code?: string; message?: string };
      signInWithGoogleFailed({
        error_message: authError?.message,
      });

      if (authError?.code === "auth/popup-closed-by-user") {
        setError("Sign-in was cancelled.");
        setLoading(false);
        return;
      }

      if (authError?.code === "auth/email-not-allowed") {
        setError("This email is not allowed to sign in.");
        setLoading(false);
        return;
      }

      setError("Google sign-in failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="sign-in-auth">
      <div className="flex items-center gap-3 mb-11">
        <Image
          src="/rez-logo.svg"
          alt="Rez"
          width={40}
          height={40}
          className="w-10 h-10 shrink-0"
          priority
        />
        <div className="text-sm tracking-[0.14em] uppercase">
          <span className="font-bold text-foreground">Rez</span>
          <span className="text-muted-foreground font-normal"> · by canvassing</span>
        </div>
      </div>

      <h1 className="font-[family-name:var(--font-fraunces)] font-medium text-[44px] leading-[1.08] tracking-[-0.01em] max-w-[380px] mb-3.5">
        Where real people
        <br />
        <em className="not-italic rez-gradient-text">answer back.</em>
      </h1>

      <p className="text-muted-foreground text-[15px] max-w-[360px] mb-10 leading-relaxed">
        Sign in to manage the research tasks running across your Canvassing network right now.
      </p>

      <div className="sign-in-ticket">
        <div className="sign-in-ticket-perf" aria-hidden />
        <div className="flex justify-between items-baseline mb-[22px]">
          <span className="text-[11px] tracking-[0.08em] uppercase font-medium text-[color:var(--rez-pink)]">
            Researcher access
          </span>
          <span className="text-[11px] tabular-nums text-muted-foreground">
            {ticketId}
          </span>
        </div>

        <h2 className="font-[family-name:var(--font-fraunces)] font-medium text-[19px] mb-1 mt-10">
          Sign in to continue
        </h2>
        <p className="text-[13px] text-muted-foreground mb-[22px]">
          Use your Google account workspace.
        </p>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2.5 bg-card text-foreground border border-border rounded-[9px] px-4 py-3 text-sm font-medium transition-colors hover:bg-background disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              <Image src="/google.svg" alt="" width={16} height={16} className="shrink-0" aria-hidden />
              Continue with Google
            </>
          )}
        </button>

        {error && (
          <p className="mt-4 text-sm text-destructive text-center">{error}</p>
        )}

        <div className="flex justify-between mt-[18px] pt-4 border-t border-dashed border-border text-[11px] tabular-nums text-muted-foreground">
          <span>VALID · TODAY</span>
          <span>REZ-AUTH-01</span>
        </div>
      </div>

      <p className="max-w-[380px] mt-6 text-xs text-muted-foreground leading-relaxed">
        By signing in, you agree to our{" "}
        <Link href="/terms-of-service" className="text-primary underline underline-offset-2">
          terms of service
        </Link>{" "}
        and{" "}
        <Link href="/privacy-policy" className="text-primary underline underline-offset-2">
          privacy policy
        </Link>
        .
      </p>
    </div>
  );
}

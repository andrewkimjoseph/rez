"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CountryDropdown } from "@/components/country-dropdown";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase/clientConfig";
import { createOrganizationInFirestore } from "@/firebase/firestore/services/createOrganizationInFirestore";
import { useOrganizationStore } from "@/stores/organization-store";
import { useTaskMasterStore } from "@/stores/taskmaster-store";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { updateTaskMasterOrganizationId } from "@/firebase/firestore/services/updateTaskMasterOrganizationId";
import { useAmplitudeEvents } from "@/hooks/use-amplitude-events";

const FormSchema = z.object({
  organizationName: z.string().min(2, {
    message: "Organization name must be at least 2 characters.",
  }),
  organizationCountry: z.string().min(2, {
    message: "Please select a country.",
  }),
  organizationTeamSize: z.enum(["< 2", "2 - 5", "5 - 10", "10 - 50", "50+"]),
});

export default function OrganizationOnboardingPage() {
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const setOrganization = useOrganizationStore((state) => state.setOrganization);
  const setTaskMasterUser = useTaskMasterStore((state) => state.setUser);
  const taskMasterUser = useTaskMasterStore((state) => state.user);
  const [loading, setLoading] = useState(false);
  const { organizationOnboardingClicked, organizationOnboardingComplete, organizationOnboardingFailed, identifyTaskMaster } = useAmplitudeEvents();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserName(user?.displayName || null);
    });
    return () => unsubscribe();
  }, []);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      organizationName: "",
      organizationCountry: "",
      organizationTeamSize: "< 2",
    },
  });
  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setLoading(true);
    organizationOnboardingClicked();
    // Get current user
    const user = auth.currentUser;
    if (!user) {
      toast("User not found. Please sign in again.");
      setLoading(false);
      organizationOnboardingFailed();
      return;
    }
    const orgData = {
      taskMasterId: user.uid,
      name: data.organizationName,
      country: data.organizationCountry,
      teamSize: data.organizationTeamSize,
      timeCreated: null,
      timeUpdated: null,
    };
    const orgId = await createOrganizationInFirestore(orgData);
    const org = { ...orgData, id: orgId };
    setOrganization(org);
    document.cookie = `organizationId=${orgId}; path=/;`;
    // Update organizationId in Firestore task_master and zustand store
    if (user.uid) {
      await updateTaskMasterOrganizationId(user.uid, orgId);
      if (taskMasterUser) {
        setTaskMasterUser({ ...taskMasterUser, organizationId: orgId });
        identifyTaskMaster({
          rez_task_master_org_id: orgId,
          rez_task_master_org_name: org.name,
          rez_task_master_org_country: org.country,
          rez_task_master_org_team_size: org.teamSize,
        });
      }
    }
    toast.success("Organization created successfully!");
    setLoading(false);
    organizationOnboardingComplete();
    router.push("/dashboard");
  }

  return (
    <div className="sign-in-wrap min-h-screen">
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

        <h1 className="font-[family-name:var(--font-fraunces)] font-medium text-[44px] leading-[1.08] tracking-[-0.01em] max-w-[420px] mb-3.5">
          Set up your
          <br />
          <em className="not-italic rez-gradient-text">research hub.</em>
        </h1>
        <p className="text-muted-foreground text-[15px] max-w-[420px] mb-10 leading-relaxed">
          Create your organization once, then launch studies and collect insights with your workspace configured.
        </p>

        <div className="sign-in-ticket max-w-[420px]">
          <div className="sign-in-ticket-perf" aria-hidden />
          <div className="flex justify-between items-baseline mb-[22px]">
            <span className="text-[11px] tracking-[0.08em] uppercase font-medium text-[color:var(--rez-pink)]">
              Organization setup
            </span>
            <span className="text-[11px] tabular-nums text-muted-foreground">
              STEP·01
            </span>
          </div>

          <h2 className="font-[family-name:var(--font-fraunces)] font-medium text-[19px] mb-1 mt-10">
            Create organization
          </h2>
          <p className="text-[13px] text-muted-foreground mb-[22px]">
            {userName ? `Welcome, ${userName}.` : "Finish setup"} Add your organization details to continue.
          </p>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-5"
            >
              <FormField
                control={form.control}
                name="organizationName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground/90">Organization Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ACME Inc."
                        className="h-11 bg-card border-border"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="organizationCountry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground/90">Organization Country</FormLabel>
                    <FormControl>
                      <CountryDropdown
                        placeholder="Select country"
                        defaultValue="USA"
                        value={field.value}
                        onChange={(country) => field.onChange(country?.name)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="organizationTeamSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground/90">Team Size</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="w-full h-11 bg-card border-border">
                          <SelectValue placeholder="Select team size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="< 2">&lt; 2</SelectItem>
                          <SelectItem value="2 - 5">2 - 5</SelectItem>
                          <SelectItem value="5 - 10">5 - 10</SelectItem>
                          <SelectItem value="10 - 50">10 - 50</SelectItem>
                          <SelectItem value="50+">50+</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-medium mt-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <ArrowPathIcon className="animate-spin mr-2 h-4 w-4" />
                    Creating organization...
                  </>
                ) : (
                  "Complete Registration"
                )}
              </Button>
            </form>
          </Form>

          <div className="flex justify-between mt-[18px] pt-4 border-t border-dashed border-border text-[11px] tabular-nums text-muted-foreground">
            <span>READY · TODAY</span>
            <span>REZ-ORG-SETUP</span>
          </div>
        </div>

        <p className="max-w-[420px] mt-6 text-xs text-muted-foreground leading-relaxed">
          By continuing, you agree to our{" "}
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

      <aside className="sign-in-board sign-in-board--desktop-only">
        <div className="flex justify-between items-start mb-8">
          <h3 className="font-[family-name:var(--font-fraunces)] font-medium text-xl">Setup guidance</h3>
          <div className="flex items-center">
            <span className="sign-in-live-dot sign-in-live-dot-pulse" aria-hidden />
            <span className="text-[11px] tracking-[0.06em] uppercase text-[color:var(--sidebar-muted)]">
              Updating
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-px bg-sidebar-border border border-sidebar-border rounded-xl overflow-hidden mb-10">
          <div className="bg-sidebar-accent p-5">
            <div className="sign-in-stat-num rez-gradient-text">1</div>
            <div className="text-xs text-[color:var(--sidebar-muted)]">Step left</div>
          </div>
          <div className="bg-sidebar-accent p-5">
            <div className="sign-in-stat-num rez-gradient-text">2m</div>
            <div className="text-xs text-[color:var(--sidebar-muted)]">Estimated setup</div>
          </div>
          <div className="bg-sidebar-accent p-5">
            <div className="sign-in-stat-num rez-gradient-text">Today</div>
            <div className="text-xs text-[color:var(--sidebar-muted)]">Launch-ready</div>
          </div>
        </div>

        <div className="text-xs tracking-[0.06em] uppercase text-[color:var(--sidebar-muted)] mb-3.5">
          What happens next
        </div>
        <div className="flex flex-col gap-px bg-sidebar-border border border-sidebar-border rounded-xl overflow-hidden mb-auto">
          {[
            "Save your organization profile",
            "Invite collaborators to your workspace",
            "Create your first task and publish",
          ].map((item, index) => (
            <div
              key={item}
              className="bg-sidebar-accent px-[18px] py-3.5 flex items-center justify-between gap-3 sign-in-feed-row-enter"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="text-sm min-w-0">
                <span className="inline-block text-[10px] tracking-wide font-medium px-[7px] py-0.5 rounded mr-2.5 rez-tag-pink">
                  NEXT
                </span>
                <span className="truncate">{item}</span>
              </div>
              <div className="text-[11px] tabular-nums text-[color:var(--sidebar-muted)] whitespace-nowrap shrink-0">
                Step {index + 1}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-7 text-[11px] text-[color:var(--sidebar-muted)]">
          Complete this setup once, then manage all research from your dashboard.
        </div>
      </aside>

      <aside className="sign-in-board-compact">
        <div className="flex justify-between items-start mb-6">
          <h3 className="font-[family-name:var(--font-fraunces)] font-medium text-xl">Setup guidance</h3>
          <div className="flex items-center">
            <span className="sign-in-live-dot sign-in-live-dot-pulse" aria-hidden />
            <span className="text-[11px] tracking-[0.06em] uppercase text-[color:var(--sidebar-muted)]">
              Updating
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-px bg-sidebar-border border border-sidebar-border rounded-xl overflow-hidden mb-8">
          <div className="bg-sidebar-accent p-4">
            <div className="sign-in-stat-num rez-gradient-text text-2xl">1</div>
            <div className="text-xs text-[color:var(--sidebar-muted)]">Step left</div>
          </div>
          <div className="bg-sidebar-accent p-4">
            <div className="sign-in-stat-num rez-gradient-text text-2xl">2m</div>
            <div className="text-xs text-[color:var(--sidebar-muted)]">Estimated</div>
          </div>
          <div className="bg-sidebar-accent p-4">
            <div className="sign-in-stat-num rez-gradient-text text-2xl">Now</div>
            <div className="text-xs text-[color:var(--sidebar-muted)]">Launch</div>
          </div>
        </div>
      </aside>
    </div>
  );
}

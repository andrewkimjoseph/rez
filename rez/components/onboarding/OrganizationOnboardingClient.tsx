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
import { setOrganizationIdCookie } from "@/lib/auth-cookies";

const FormSchema = z.object({
  organizationName: z.string().min(2, {
    message: "Organization name must be at least 2 characters.",
  }),
  organizationCountry: z.string().min(2, {
    message: "Please select a country.",
  }),
  organizationTeamSize: z.enum(["< 2", "2 - 5", "5 - 10", "10 - 50", "50+"]),
});

export function OrganizationOnboardingClient() {
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const setOrganization = useOrganizationStore((state) => state.setOrganization);
  const setTaskMasterUser = useTaskMasterStore((state) => state.setUser);
  const taskMasterUser = useTaskMasterStore((state) => state.user);
  const [loading, setLoading] = useState(false);
  const {
    organizationOnboardingClicked,
    organizationOnboardingComplete,
    organizationOnboardingFailed,
    identifyTaskMaster,
  } = useAmplitudeEvents();

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
    setOrganizationIdCookie(orgId);
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

      <h1 className="font-[family-name:var(--font-fraunces)] font-medium text-[44px] leading-[1.08] tracking-[-0.01em] max-w-[520px] mb-3.5">
        Set up your
        <br />
        <em className="not-italic rez-gradient-text">research hub.</em>
      </h1>
      <p className="text-muted-foreground text-[15px] max-w-[520px] mb-10 leading-relaxed">
        Create your organization once, then launch studies and collect insights with your workspace configured.
      </p>

      <div className="sign-in-ticket">
        <div className="sign-in-ticket-perf" aria-hidden />
        <div className="flex justify-between items-baseline mb-[22px]">
          <span className="text-[11px] tracking-[0.08em] uppercase font-medium text-[color:var(--rez-pink)]">
            Organization setup
          </span>
          <span className="text-[11px] tabular-nums text-muted-foreground">STEP·01</span>
        </div>

        <h2 className="font-[family-name:var(--font-fraunces)] font-medium text-[19px] mb-1 mt-10">
          Create organization
        </h2>
        <p className="text-[13px] text-muted-foreground mb-[22px]">
          {userName ? `Welcome, ${userName}.` : "Finish setup"} Add your organization details to continue.
        </p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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

      <p className="max-w-[520px] mt-6 text-xs text-muted-foreground leading-relaxed">
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
  );
}

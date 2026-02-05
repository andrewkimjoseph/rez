"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
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
import {
  ArrowPathIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { updateTaskMasterOrganizationId } from "@/firebase/firestore/services/updateTaskMasterOrganizationId";
import { deleteTaskMasterFromFirestore } from "@/firebase/firestore/services/deleteTaskMasterFromFirestore";
import { useAmplitudeEvents } from "@/hooks/use-amplitude-events";
import { deleteUser } from "firebase/auth";
import { signOutTaskMaster } from "@/firebase/auth/auth";

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
  const [goingBack, setGoingBack] = useState(false);
  const { organizationOnboardingClicked, organizationOnboardingComplete, organizationOnboardingFailed, identifyTaskMaster } = useAmplitudeEvents();

  const handleGoBack = async () => {
    setGoingBack(true);
    try {
      if (!auth) {
        setGoingBack(false);
        router.push("/sign-in");
        return;
      }
      const user = auth.currentUser;
      if (user) {
        // Delete from Firestore first
        try {
          await deleteTaskMasterFromFirestore(user.uid);
        } catch (firestoreError) {
          console.error("Error deleting from Firestore:", firestoreError);
          // Continue even if Firestore delete fails
        }
        
        // Delete from Firebase Auth
        try {
          await deleteUser(user);
        } catch (authError) {
          console.error("Error deleting from Auth:", authError);
          // If delete fails, just sign out
          await signOutTaskMaster();
        }
      }
      
      // Clear stores
      setTaskMasterUser(null);
      
      // Navigate to sign-in
      router.push("/sign-in");
    } catch (error) {
      console.error("Error going back:", error);
      toast.error("Failed to cancel registration. Please try again.");
      setGoingBack(false);
    }
  };
  useEffect(() => {
    if (!auth) return;
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
    if (!auth) {
      toast("Unable to verify user. Please refresh and sign in again.");
      setLoading(false);
      organizationOnboardingFailed();
      return;
    }
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
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 py-8 md:py-0 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 md:p-10">
            {/* Go Back Button - Commented out for now
            <Button
              variant="ghost"
              size="sm"
              className="mb-4 -ml-2 text-slate-600 hover:text-slate-900"
              onClick={handleGoBack}
              disabled={goingBack || loading}
            >
              {goingBack ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Go Back
                </>
              )}
            </Button>
            */}

            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <Image
                  src="/rez-logo.svg"
                  alt="Rez Logo"
                  width={48}
                  height={48}
                  className="rounded-lg"
                />
              </div>
              <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-2">
                Create Your <span className="rez-gradient-text">Organization</span>
              </h1>
              {userName && (
                <p className="text-slate-600">
                  Welcome, <span className="font-medium rez-gradient-text">{userName}</span>
                </p>
              )}
            </div>

            {/* Form */}
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
                      <FormLabel className="text-slate-700">Organization Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="ACME Inc." 
                          className="h-11"
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
                      <FormLabel className="text-slate-700">Organization Country</FormLabel>
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
                      <FormLabel className="text-slate-700">Team Size</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="w-full h-11">
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
          </div>

          <p className="text-center text-sm text-slate-500 mt-6">
            By continuing, you agree to our Terms of Service
          </p>
        </div>
      </div>

      {/* Right Side - Hero */}
      <div className="flex-1 hidden md:flex flex-col justify-center items-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        {/* Decorative grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '32px 32px'
          }}
        />
        
        {/* Content */}
        <div className="relative z-10 text-center px-12 max-w-lg">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[#EFECFD]/40 mb-6">
              <svg className="w-10 h-10 text-[#5C29A3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          
          <h2 className="text-3xl font-semibold text-white mb-4">
            Set Up Your Research Hub
          </h2>
          
          <p className="text-lg text-slate-400 mb-8">
            Create your organization to start launching surveys and collecting valuable insights from real users.
          </p>

          <div className="space-y-4 text-left">
            <div className="flex items-center gap-3 text-slate-200">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#EFECFD]/40 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-[#5C29A3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span>Launch surveys in minutes</span>
            </div>
            <div className="flex items-center gap-3 text-slate-200">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#EFECFD]/40 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-[#5C29A3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span>Access verified participants globally</span>
            </div>
            <div className="flex items-center gap-3 text-slate-200">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#EFECFD]/40 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-[#5C29A3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span>Get results within hours</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

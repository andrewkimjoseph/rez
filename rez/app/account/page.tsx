"use client";

import { useEffect, useRef } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { useTaskMasterStore } from "@/stores/taskmaster-store";
import Image from "next/image";
import { useAmplitudeEvents } from "@/hooks/use-amplitude-events";

type AccountFormValues = {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  company: string;
  jobTitle: string;
  bio: string;
};

export default function Account() {
  const user = useTaskMasterStore((state) => state.user);
  const { accountPageViewed } = useAmplitudeEvents();

  // Track page view
  const hasTrackedPageView = useRef(false);
  useEffect(() => {
    if (!hasTrackedPageView.current) {
      accountPageViewed();
      hasTrackedPageView.current = true;
    }
  }, [accountPageViewed]);

  const form = useForm<AccountFormValues>({
    defaultValues: {
      fullName: user?.name || "",
      email: user?.emailAddress || "",
      phone: "",
      location: "",
      company: "",
      jobTitle: "",
      bio: "",
    },
  });

  function onSubmit(data: AccountFormValues) {
    toast("Profile updated!", {
      description: (
        <pre className="mt-2 w-[320px] rounded-md bg-neutral-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    });
    // handle submit
    console.log(data);
  }

  return (
    <div className="min-h-screen pb-20 sm:p-4 p-4 font-[family-name:var(--font-sen)]">
      <h1 className="text-3xl md:text-4xl font-bold mt-2 mb-1">
        Account Management
      </h1>
      <p className="text-muted-foreground mb-6">
        Manage your account settings, team access, and subscription detail
      </p>
      <Tabs defaultValue="profile" className="w-full mb-6">
        <TabsList className="bg-white">
          <TabsTrigger
            value="profile"
            className="data-[state=active]:bg-[#5C29A3] data-[state=active]:text-white data-[state=inactive]:bg-white data-[state=inactive]:text-[#5C29A3] px-6 py-2"
          >
            Profile
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <Card className="p-6 cursor-default">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Profile Photo */}
          <div className="flex-1 flex flex-col items-center md:items-start">
            <h2 className="text-lg font-semibold mb-1">Profile Photo</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Your profile picture is visible to team members
            </p>
            <Avatar className="w-40 h-40 mb-2">

            <AvatarImage src={user?.profilePictureURI && user.profilePictureURI.trim() !== "" ? user.profilePictureURI : "https://github.com/shadcn.png"} />
            <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
  
            </Avatar>
          </div>
          {/* Personal Information */}
          <div className="flex-[2]">
            <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} readOnly disabled />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} readOnly disabled />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="jobTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem className="col-span-1 md:col-span-2">
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="E.g Have you purchased cryptocurrency in the last 6 months?" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                /> */}
                <div className="col-span-1 md:col-span-2 flex justify-end gap-2 mt-4">
                  {/* <Button variant="outline" type="button">Cancel</Button> */}
                  <Button type="submit" disabled>
                    Saved
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </Card>
    </div>
  );
}

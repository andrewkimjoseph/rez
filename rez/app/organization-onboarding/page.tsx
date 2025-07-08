"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast, Toaster } from "sonner";
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

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      organizationName: "",
      organizationCountry: "",
      organizationTeamSize: "< 2",
    },
  });
  function onSubmit(data: z.infer<typeof FormSchema>) {
    toast("You submitted the following values", {
      description: (
        <pre className="mt-2 w-[320px] rounded-md bg-neutral-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    });

    router.push("/");
  }
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Toaster />
      {/* Left Side */}
      <div className="flex-1 flex items-center justify-center bg-white py-8 md:py-0">
        <div className="p-[2px] rounded-2xl  w-full max-w-md mx-4 md:mx-0">
          <div className="bg-white rounded-2xl p-6 md:p-10 flex flex-col items-center gap-6 w-full">
            <h1 className="text-2xl md:text-4xl font-bold text-center">
              <span className="text-[#2d254c]">Create Your Organization </span>
            </h1>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="w-2/3 space-y-6"
              >
                <FormField
                  control={form.control}
                  name="organizationName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name</FormLabel>
                      <FormControl>
                        <Input placeholder="ACME Inc." {...field} />
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
                      <FormLabel>Organization Country</FormLabel>
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
                      <FormLabel>Organization Team Size</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="w-full">
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
                <Button type="submit" className="bg-[#363062] text-white mx-auto">
                  Complete registration
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
      {/* Right Side */}
      <div className="flex-1 flex flex-col justify-center items-center bg-[#ef5366] relative min-h-[300px] md:min-h-0">
        <div className="flex-1 flex items-end justify-center w-full relative">
          <Image
            src="/friends-posing-2.png"
            alt="friends posing"
            fill
            className="object-contain w-full h-full max-w-none max-h-none"
          />
          <div className="absolute inset-0 flex items-start justify-center pt-4 md:pt-8 pointer-events-none">
            <span className="text-lg md:text-2xl font-semibold text-[#2d254c] max-w-xs text-center bg-white/80 rounded-lg px-2 md:px-4 py-1 md:py-2 shadow">
              Launch surveys and start receiving results within hours.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

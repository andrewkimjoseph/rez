"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "./ui/sidebar";
import { useTaskMasterStore } from "@/stores/taskmaster-store";
import { signOutTaskMaster } from "@/firebase/auth/auth";
import { LogOut, ChevronDown, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAmplitudeEvents } from "@/hooks/use-amplitude-events";
import { useTasksStore } from "@/stores/tasks-store";
import Link from "next/link";

export function AppNavbar() {
  const user = useTaskMasterStore((state) => state.user);
  const { clearTasksAndCompletions } = useTasksStore();
  const router = useRouter();
  const { signOutClicked, signOutComplete, signOutFailed } = useAmplitudeEvents();

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const handleSignOut = async () => {
    try {
      signOutClicked();
      toast("Signing out...", {
        description: "You are being signed out of your account.",
      });
      await signOutTaskMaster();
      clearTasksAndCompletions();
      toast.success("Signed out successfully!", {
        description: "You have been signed out of your account.",
      });
      router.push("/sign-in");
      signOutComplete();
    } catch (error) {
      toast.error("Failed to sign out", {
        description: "There was an error signing you out. Please try again.",
      });
      signOutFailed({
        error_message: error?.toString(),
      });
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <div className="lg:hidden">
            <SidebarTrigger className="h-9 w-9" />
          </div>
          
          <div className="hidden sm:flex flex-col">
            <p className="text-sm font-medium text-foreground">
              {getGreeting()}, <span className="text-primary">{user?.name || "there"}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Welcome back to your workspace
            </p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="relative h-10 gap-2 rounded-lg pl-2 pr-3 hover:bg-accent"
              >
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarImage 
                    src={user?.profilePictureURI && user.profilePictureURI.trim() !== "" 
                      ? user.profilePictureURI 
                      : undefined
                    } 
                    alt={user?.name || "User"}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                    {getInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:inline-block text-sm font-medium max-w-[120px] truncate">
                  {user?.name || "User"}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.name || "User"}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.emailAddress || "No email"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/account" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Account Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleSignOut}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

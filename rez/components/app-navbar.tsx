import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "./ui/sidebar";
import { useTaskMasterStore } from "@/stores/taskmaster-store";
import { signOutTaskMaster } from "@/firebase/auth/auth";
import { Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAmplitudeEvents } from "@/hooks/use-amplitude-events";

export function AppNavbar({}: React.HTMLAttributes<HTMLElement>) {
  const user = useTaskMasterStore((state) => state.user);
  const router = useRouter();
  const { signOutClicked, signOutComplete, signOutFailed } = useAmplitudeEvents();
  const handleSignOut = async () => { 
    try {
      signOutClicked();
      toast("Signing out...", {
        description: "You are being signed out of your account.",
      });
      await signOutTaskMaster();
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

  return (
    <div className="bg-background sticky top-0 z-50 w-full">
      <div className="flex items-center justify-between w-full px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="block lg:hidden">
            <SidebarTrigger />
          </div>
          <Avatar>
            <AvatarImage src={user?.profilePictureURI && user.profilePictureURI.trim() !== "" ? user.profilePictureURI : "https://github.com/shadcn.png"} />
            <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <p>Good Morning, {user?.name || "User"}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleSignOut}>
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

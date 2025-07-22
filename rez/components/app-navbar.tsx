import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarTrigger } from "./ui/sidebar";
import { useTaskMasterStore } from "@/stores/taskmaster-store";

export function AppNavbar({}: React.HTMLAttributes<HTMLElement>) {
  const user = useTaskMasterStore((state) => state.user);
  return (
    <div className="bg-background sticky top-0 z-50 w-full">
      <NavigationMenu className="w-full">
        <div className="block lg:hidden">
          <SidebarTrigger />
        </div>
        <NavigationMenuList className="w-full">
          <NavigationMenuItem className="my-4 ml-2 w-full">
            <div className="flex items-center flex-row justify-between w-full">
              <div className="flex items-center gap-2">
                <Avatar>
                  <AvatarImage src={user?.profilePictureURI && user.profilePictureURI.trim() !== "" ? user.profilePictureURI : "https://github.com/shadcn.png"} />
                  <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <p>Good Morning, {user?.name || "User"}</p>
              </div>
            </div>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}

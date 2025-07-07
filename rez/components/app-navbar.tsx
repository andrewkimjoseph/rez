import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function AppNavbar({
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <div className="bg-background sticky top-0 z-50 w-full">
      <NavigationMenu className="w-full">
        <NavigationMenuList className="w-full">
          <NavigationMenuItem className="m-4 w-full">
            <div className="flex items-center flex-row justify-between w-full">
              <div className="flex items-center gap-2">
                <Avatar>
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <p>Good Morning, John</p>
              </div>
        
            </div>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}

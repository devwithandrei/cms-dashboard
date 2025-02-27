"use client";

import { Menu } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/theme-toggle";
import { MainNav } from "@/components/main-nav";
import StoreSwitcher from "@/components/store-switcher";
import { Store } from "@prisma/client";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface NavbarProps {
  stores: Store[];
}

const Navbar: React.FC<NavbarProps> = ({
  stores
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden mr-2">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] bg-background/95 backdrop-blur-sm p-0">
            <div className="px-4 py-6 space-y-4">
              <StoreSwitcher items={stores} />
              <MainNav 
                className="flex-col items-start space-y-2" 
                onLinkClick={() => setIsOpen(false)}
              />
            </div>
          </SheetContent>
        </Sheet>
        <div className="hidden md:flex items-center">
          <StoreSwitcher items={stores} />
          <MainNav className="mx-6" />
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <ThemeToggle />
          <UserButton 
            afterSignOutUrl="/"
            appearance={{
              baseTheme: undefined,
              elements: {
                avatarBox: "h-8 w-8",
                userButtonTrigger: "focus:shadow-none",
                userButtonPopoverCard: "shadow-md border border-gray-800/50 bg-[#0a101f]/95 backdrop-blur-sm",
                userButtonPopoverActions: "bg-transparent",
                userButtonPopoverActionButton: "hover:bg-gray-800/50",
                userButtonPopoverActionButtonText: "text-gray-400",
                userButtonPopoverActionButtonIcon: "text-gray-400",
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Navbar;

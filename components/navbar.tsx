"use client";

import { Menu } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/theme-toggle";
import { MainNav } from "@/components/main-nav";
import StoreSwitcher from "@/components/store-switcher";
import { Store } from "@prisma/client";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface NavbarProps {
  stores: Store[];
}

const Navbar: React.FC<NavbarProps> = ({
  stores
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Add scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div 
      className={`
        sticky top-0 z-50 w-full
        transition-all duration-300 ease-in-out
        ${scrolled 
          ? 'border-b shadow-sm bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60' 
          : 'border-b bg-background/90 backdrop-blur-sm supports-[backdrop-filter]:bg-background/50'}
      `}
    >
      <div className="flex h-16 items-center px-4 max-w-7xl mx-auto">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden mr-2 transition-all duration-200 hover:bg-primary/10"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent 
            side="left" 
            className="w-[300px] bg-background/95 backdrop-blur-md p-0 border-r"
          >
            <div className="px-4 py-6 space-y-6">
              <div className="mb-8">
                <StoreSwitcher items={stores} />
              </div>
              <MainNav 
                className="flex-col items-start space-y-1" 
                onLinkClick={() => setIsOpen(false)}
              />
            </div>
          </SheetContent>
        </Sheet>
        <div className="hidden md:flex items-center">
          <StoreSwitcher items={stores} />
          <div className="overflow-hidden">
            <MainNav className="mx-6" />
          </div>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <ThemeToggle />
          <div className="transition-transform duration-200 hover:scale-105">
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                baseTheme: undefined,
                elements: {
                  avatarBox: "h-8 w-8",
                  userButtonTrigger: "focus:shadow-none",
                  userButtonPopoverCard: "shadow-md border border-gray-800/50 bg-background/95 backdrop-blur-md",
                  userButtonPopoverActions: "bg-transparent",
                  userButtonPopoverActionButton: "hover:bg-primary/10",
                  userButtonPopoverActionButtonText: "text-foreground/80",
                  userButtonPopoverActionButtonIcon: "text-foreground/80",
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;

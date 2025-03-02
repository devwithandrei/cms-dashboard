"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="relative h-8 w-8 rounded-md bg-transparent opacity-70"
      >
        <div className="h-5 w-5 animate-pulse bg-muted-foreground/20 rounded-full" />
        <span className="sr-only">Loading theme toggle</span>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative h-8 w-8 overflow-hidden rounded-md 
        bg-background/50 hover:bg-primary/10 
        transition-all duration-300 ease-in-out
        focus:ring-1 focus:ring-primary/30"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      aria-label="Toggle theme"
    >
      {/* Sun icon with rays animation */}
      <div className="relative">
        <Sun className="h-[18px] w-[18px] 
          rotate-0 scale-100 
          transition-all duration-500 ease-in-out
          text-yellow-500
          dark:-rotate-90 dark:scale-0" 
        />
        
        {/* Animated rays */}
        {theme === "light" && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="absolute h-full w-full animate-pulse opacity-30 rounded-full bg-yellow-300/30" />
          </span>
        )}
      </div>
      
      {/* Moon icon with stars animation */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Moon className="h-[18px] w-[18px] 
          rotate-90 scale-0 
          transition-all duration-500 ease-in-out
          text-blue-300
          dark:rotate-0 dark:scale-100" 
        />
        
        {/* Animated stars */}
        {theme === "dark" && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="absolute h-full w-full animate-pulse opacity-30 rounded-full bg-blue-400/20" />
          </span>
        )}
      </div>
      
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

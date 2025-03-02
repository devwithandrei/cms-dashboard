"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface MainNavProps {
  className?: string;
  onLinkClick?: () => void;
}

export function MainNav({
  className,
  onLinkClick,
  ...props
}: MainNavProps) {
  const pathname = usePathname();
  const params = useParams();
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const routes = [
    {
      href: `/${params.storeId}`,
      label: 'Overview',
      active: pathname === `/${params.storeId}`,
    },
    {
      href: `/${params.storeId}/billboards`,
      label: 'Billboards',
      active: pathname === `/${params.storeId}/billboards`,
    },
    {
      href: `/${params.storeId}/categories`,
      label: 'Categories',
      active: pathname === `/${params.storeId}/categories`,
    },
    {
      href: `/${params.storeId}/sizes`,
      label: 'Sizes',
      active: pathname === `/${params.storeId}/sizes`,
    },
    {
      href: `/${params.storeId}/colors`,
      label: 'Colors',
      active: pathname === `/${params.storeId}/colors`,
    },
    {
      href: `/${params.storeId}/brands`,
      label: 'Brands',
      active: pathname === `/${params.storeId}/brands`,
    },
    {
      href: `/${params.storeId}/descriptions`,
      label: 'Descriptions',
      active: pathname === `/${params.storeId}/descriptions`,
    },
    {
      href: `/${params.storeId}/products`,
      label: 'Products',
      active: pathname === `/${params.storeId}/products`,
    },
    {
      href: `/${params.storeId}/orders`,
      label: 'Orders',
      active: pathname === `/${params.storeId}/orders`,
    },
    {
      href: `/${params.storeId}/users`,
      label: 'Users',
      active: pathname === `/${params.storeId}/users` || pathname.startsWith(`/${params.storeId}/users/`),
    },
    {
      href: `/${params.storeId}/settings`,
      label: 'Settings',
      active: pathname === `/${params.storeId}/settings`,
    },
  ];

  return (
    <nav
      className={cn(
        "flex items-center overflow-x-auto scrollbar-hide",
        className?.includes("flex-col") ? "flex-col" : "flex-row",
        className
      )}
      {...props}
    >
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            "text-xs font-medium relative group",
            "transition-all duration-300 ease-in-out",
            route.active 
              ? "text-black dark:text-white font-semibold" 
              : "text-muted-foreground hover:text-primary",
            className?.includes("flex-col") 
              ? "w-full px-3 py-2.5 text-center" 
              : "px-3 py-2 mx-0.5"
          )}
          onClick={onLinkClick}
        >
          <span className="relative z-10">{route.label}</span>
          
          {/* Animated underline effect */}
          <span 
            className={cn(
              "absolute bottom-0 left-0 w-full h-0.5 bg-primary transform origin-bottom",
              "transition-all duration-300 ease-out",
              route.active 
                ? "scale-x-100 opacity-100" 
                : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100"
            )}
          />
          
          {/* Subtle background hover effect */}
          <span 
            className={cn(
              "absolute inset-0 bg-primary/5 dark:bg-primary/10 rounded-md",
              "transform transition-all duration-300 ease-out",
              route.active 
                ? "opacity-100" 
                : "opacity-0 group-hover:opacity-100"
            )}
          />
        </Link>
      ))}
    </nav>
  );
}

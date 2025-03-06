"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { StoreModal } from "@/components/modals/store-modal";

export const ModalProvider = () => {
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  
  // Determine if we're on the root setup page
  const isSetupPage = pathname === "/";

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <>
      <StoreModal />
    </>
  );
}

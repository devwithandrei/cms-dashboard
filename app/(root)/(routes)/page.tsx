"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStoreModal } from "@/hooks/use-store-modal";
import { Store } from "@prisma/client";

const SetupPage = () => {
  const router = useRouter();
  const onOpen = useStoreModal((state) => state.onOpen);
  const isOpen = useStoreModal((state) => state.isOpen);

  useEffect(() => {
    // Fetch stores on client side
    const checkStores = async () => {
      try {
        const response = await fetch('/api/stores');
        const data = await response.json();
        
        if (data.stores && data.stores.length > 0) {
          router.push(`/${data.stores[0].id}`);
          return;
        }
        
        if (!isOpen) {
          onOpen();
        }
      } catch (error) {
        console.error('Failed to fetch stores:', error);
        if (!isOpen) {
          onOpen();
        }
      }
    };

    checkStores();
  }, [isOpen, onOpen, router]);

  return null;
};
 
export default SetupPage;

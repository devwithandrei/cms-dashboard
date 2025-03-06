"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';

import { useStoreModal } from '@/hooks/use-store-modal';

interface SetupLayoutProps {
  children: React.ReactNode;
}

export default function SetupLayout({
  children,
}: SetupLayoutProps) {
  const { userId, isLoaded: isAuthLoaded } = useAuth();
  const storeModal = useStoreModal();
  const router = useRouter();
  const [isCheckingStore, setIsCheckingStore] = useState(true);

  useEffect(() => {
    // Wait for auth to be loaded before checking
    if (!isAuthLoaded) return;

    // If no user, redirect to sign-in
    if (!userId) {
      window.location.href = '/sign-in';
      return;
    }

    const checkStore = async () => {
      try {
        setIsCheckingStore(true);
        
        // Use direct API call with no-cache to ensure fresh data
        const response = await fetch('/api/stores', {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        // Check if the response is ok
        if (!response.ok) {
          throw new Error(`Error fetching stores: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.stores && data.stores.length > 0) {
          // User has stores, redirect to the first one
          window.location.href = `/${data.stores[0].id}`;
          return;
        } else {
          // Only open modal if we're sure there are no stores
          // and we're done checking (prevents flash of UI)
          setTimeout(() => {
            storeModal.onOpen();
          }, 0);
        }
      } catch (error) {
        console.error("Error checking store:", error);
      } finally {
        setIsCheckingStore(false);
      }
    };

    checkStore();
  }, [userId, isAuthLoaded, storeModal, router]);

  // Show loading spinner while checking stores
  if (isCheckingStore) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Don't render anything (including welcome page) when not checking stores
  // The store modal will be shown automatically when no stores exist
  return null;
};

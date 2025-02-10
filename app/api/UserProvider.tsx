"use client";

import { useUser } from '@clerk/nextjs';
import React from 'react';

const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const { isSignedIn } = useUser();

  return (
    <>
      {isSignedIn ? (
        children
      ) : (
        <div>
          {/* Render SignIn or SignUp components here if needed */}
        </div>
      )}
    </>
  );
};

export default UserProvider;
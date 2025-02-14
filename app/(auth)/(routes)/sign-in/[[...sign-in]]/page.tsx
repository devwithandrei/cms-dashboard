"use client";

import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <SignIn
      appearance={{
        elements: {
          footer: "hidden",
          card: "shadow-md",
          rootBox: "w-full",
        },
      }}
      afterSignInUrl="/"
      signUpUrl="/sign-up"
    />
  );
}

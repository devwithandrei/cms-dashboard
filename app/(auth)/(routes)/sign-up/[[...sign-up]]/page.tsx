"use client";

import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <SignUp
      appearance={{
        elements: {
          footer: "hidden",
          card: "shadow-md",
          rootBox: "w-full",
        },
      }}
      afterSignUpUrl="/"
      signInUrl="/sign-in"
    />
  );
}

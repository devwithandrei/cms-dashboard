"use client";

import { Store as StoreIcon } from "lucide-react";

export default function SetupPage() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex flex-col items-center gap-y-6">
        <div className="rounded-full bg-primary/10 p-8 ring-1 ring-primary/20">
          <StoreIcon className="h-12 w-12 text-primary" />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Welcome to your Dashboard</h1>
          <p className="text-muted-foreground max-w-md">
            Create your first store to get started with managing your products, orders, and more.
          </p>
        </div>
      </div>
    </div>
  );
}

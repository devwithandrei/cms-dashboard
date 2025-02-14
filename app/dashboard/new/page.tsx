import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs";

import prismadb from "@/lib/prismadb";
import { Button } from "@/components/ui/button";

export default async function NewStorePage() {
  const { userId } = auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Create Your First Store</h1>
        <p className="text-gray-600 mb-4">
          Get started by creating your first store to manage your products, orders, and more.
        </p>
        <Button
          onClick={() => window.location.href = '/dashboard/new/store'}
          className="w-full"
        >
          Create Store
        </Button>
      </div>
    </div>
  );
}

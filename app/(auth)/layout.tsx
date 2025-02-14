import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import prismadb from "@/lib/prismadb";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = auth();

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-gray-100">
        <div className="w-full max-w-md p-6">
          {children}
        </div>
      </div>
    );
  }

  // Check if user has any stores
  const stores = await prismadb.store.findMany({
    where: {
      userId
    },
    take: 1
  });

  if (stores.length > 0) {
    redirect(`/${stores[0].id}`);
  } else {
    redirect('/');
  }
}

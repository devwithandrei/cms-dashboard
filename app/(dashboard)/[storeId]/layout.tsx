import { redirect } from "next/navigation";
import Navbar from "@/components/navbar";
import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs";

export default async function DashboardLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { storeId: string }
}) {
  const { userId } = auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const store = await prismadb.store.findFirst({
    where: {
      id: params.storeId,
      userId
    }
  });

  if (!store) {
    redirect('/');
  }

  const stores = await prismadb.store.findMany({
    where: {
      userId,
    }
  });

  return (
    <div className="h-full">
      <Navbar stores={stores} />
      <main className="h-full pt-16">
        {children}
      </main>
    </div>
  );
}

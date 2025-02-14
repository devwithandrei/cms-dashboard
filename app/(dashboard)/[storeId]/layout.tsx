import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs';

import Navbar from '@/components/navbar'
import prismadb from '@/lib/prismadb';

async function getStore(storeId: string, userId: string) {
  try {
    const store = await prismadb.store.findFirst({ 
      where: {
        id: storeId,
        userId,
      }
    });

    return store;
  } catch (error) {
    console.error('Error fetching store:', error);
    return null;
  }
}

export default async function DashboardLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: { storeId: string }
}) {
  const { userId } = auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const store = await getStore(params.storeId, userId);

  if (!store) {
    redirect('/');
  }

  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

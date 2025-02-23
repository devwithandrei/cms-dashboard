import { NextResponse } from 'next/server';
import prismadb from '@/lib/prismadb';
import { auth } from '@clerk/nextjs';

export async function GET() {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const users = await prismadb.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.log('[USERS_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

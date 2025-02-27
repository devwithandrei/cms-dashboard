import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import prismadb from "@/lib/prismadb";

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request
) {
  try {
    const { userId } = auth();
    const { searchParams } = new URL(req.url);
    
    // Get pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const storeId = searchParams.get('storeId');
    
    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Base query
    let query: any = {
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: skip
    };

    // If storeId is provided, filter orders and wishlist by store
    if (storeId) {
      query.include = {
        orders: {
          where: {
            storeId: storeId
          },
          select: {
            id: true,
            amount: true,
            createdAt: true,
          }
        },
        wishlistProducts: {
          where: {
            storeId: storeId
          },
          select: {
            id: true,
            name: true
          }
        }
      };
    }

    // Get users with pagination
    const users = await prismadb.user.findMany(query);
    
    // Get total count for pagination
    const totalCount = await prismadb.user.count();

    return NextResponse.json({
      users,
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.log('[USERS_GET]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function POST(
  req: Request,
) {
  try {
    const { userId } = auth();
    const body = await req.json();

    const { email, name } = body;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!email) {
      return new NextResponse("Email is required", { status: 400 });
    }

    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }

    const user = await prismadb.user.create({
      data: {
        id: userId,  // Use Clerk's userId as the primary key
        email,
        name,
      }
    });

    return NextResponse.json(user);
  } catch (error) {
    console.log('[USERS_POST]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

import { NextResponse } from "next/server";

import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs";

// Add this to prevent caching
export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: { descriptionId: string } }
) {
  try {
    if (!params.descriptionId) {
      return new NextResponse("Description id is required", { status: 400 });
    }

    const description = await prismadb.description.findUnique({
      where: {
        id: params.descriptionId
      }
    });
  
    return NextResponse.json(description);
  } catch (error) {
    console.log('[DESCRIPTION_GET]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
};

export async function DELETE(
  req: Request,
  { params }: { params: { descriptionId: string, storeId: string } }
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 403 });
    }

    if (!params.descriptionId) {
      return new NextResponse("Description id is required", { status: 400 });
    }

    const storeByUserId = await prismadb.store.findFirst({
      where: {
        id: params.storeId,
        userId
      }
    });

    if (!storeByUserId) {
      return new NextResponse("Unauthorized", { status: 405 });
    }

    const description = await prismadb.description.delete({
      where: {
        id: params.descriptionId
      }
    });
  
    return NextResponse.json(description);
  } catch (error) {
    console.log('[DESCRIPTION_DELETE]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
};


export async function PATCH(
  req: Request,
  { params }: { params: { descriptionId: string, storeId: string } }
) {
  try {
    const { userId } = auth();

    const body = await req.json();

    const { name, value } = body;

    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 403 });
    }

    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }

    if (!value) {
      return new NextResponse("Value is required", { status: 400 });
    }


    if (!params.descriptionId) {
      return new NextResponse("Description id is required", { status: 400 });
    }

    const storeByUserId = await prismadb.store.findFirst({
      where: {
        id: params.storeId,
        userId
      }
    });

    if (!storeByUserId) {
      return new NextResponse("Unauthorized", { status: 405 });
    }

    const description = await prismadb.description.update({
      where: {
        id: params.descriptionId
      },
      data: {
        name,
        value
      }
    });
  
    return NextResponse.json(description);
  } catch (error) {
    console.log('[DESCRIPTION_PATCH]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
};

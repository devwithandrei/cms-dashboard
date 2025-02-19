import { NextResponse } from "next/server";

import prismadb from "@/lib/prismadb";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');
    const storeId = searchParams.get('storeId');

    console.log("categoryId:", categoryId);
    console.log("storeId:", storeId);

    if (!categoryId) {
      return new NextResponse("Category id is required", { status: 400 });
    }

    if (!storeId) {
      return new NextResponse("Store id is required", { status: 400 });
    }

    const category = await prismadb.category.findUnique({
      where: {
        id: categoryId,
        storeId: storeId
      },
      include: {
        billboard: true
      }
    });

    console.log("Category:", category);
  
    return NextResponse.json(category);
  } catch (error) {
    console.log('[CATEGORY_GET]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
};

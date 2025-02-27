import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params, searchParams }: { params: { storeId: string }, searchParams: { [key: string]: string | string[] | undefined } }
) {
  try {
    const categoryId = searchParams.categoryId as string;

    if (!categoryId) {
      return new NextResponse("Category ID is required", { status: 400 });
    }

    const category = await prismadb.category.findUnique({
      where: {
        id: categoryId,
      },
      include: {
        billboard: true,
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.log('[CATEGORY_GET]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

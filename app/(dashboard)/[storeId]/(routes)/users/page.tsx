import { UsersClient } from "./components/client";
import prismadb from "@/lib/prismadb";
import { UserColumn } from "./components/columns";
import { auth } from "@clerk/nextjs";

// Add this to prevent caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const UsersPage = async ({
  params
}: {
  params: { storeId: string }
}) => {
  try {
    const { userId } = auth();

    if (!userId) {
      return (
        <div className="flex-col">
          <div className="flex-1 space-y-4 p-8 pt-6">
            <p>Unauthorized</p>
          </div>
        </div>
      );
    }

    // Get all database users with their orders and wishlist for the current store
    const dbUsers = await prismadb.user.findMany({
      include: {
        orders: {
          where: {
            storeId: params.storeId
          },
          select: {
            amount: true,
            createdAt: true,
          }
        },
        wishlistProducts: {
          where: {
            storeId: params.storeId
          }
        },
      }
    });

    // Format users for display
    const formattedUsers: UserColumn[] = dbUsers.map(dbUser => {
      const orders = dbUser.orders || [];
      const totalSpent = orders.reduce((sum, order) => sum + Number(order.amount), 0);
      const lastOrder = orders.length > 0 
        ? orders.reduce((latest, order) => 
            latest.createdAt > order.createdAt ? latest : order
          )
        : null;

      // Split name into first and last name
      const nameParts = dbUser.name ? dbUser.name.split(' ') : ['', ''];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      return {
        id: dbUser.id,
        email: dbUser.email || '',
        firstName: firstName,
        lastName: lastName,
        imageUrl: '',
        createdAt: dbUser.createdAt ? new Date(dbUser.createdAt).toISOString() : '',
        status: "active",
        ordersCount: orders.length,
        totalSpent: totalSpent,
        lastOrderDate: lastOrder?.createdAt || null,
        wishlistCount: dbUser.wishlistProducts.length || 0
      };
    });

    return (
      <div className="flex-col">
        <div className="flex-1 space-y-4 p-8 pt-6">
          <UsersClient data={formattedUsers} />
        </div>
      </div>
    );
  } catch (error) {
    console.error('[USERS_PAGE]', error);
    return (
      <div className="flex-col">
        <div className="flex-1 space-y-4 p-8 pt-6">
          <p>Error loading users</p>
        </div>
      </div>
    );
  }
};

export default UsersPage;

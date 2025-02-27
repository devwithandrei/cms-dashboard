import { UsersClient } from "./components/client";
import prismadb from "@/lib/prismadb";
import { UserColumn } from "./components/columns";
import { clerkClient } from "@clerk/nextjs/server";

const UsersPage = async ({
  params
}: {
  params: { storeId: string }
}) => {
  try {
    // Get all Clerk users
    const clerkUsers = await clerkClient.users.getUserList();
    
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

    // Merge Clerk and database data
    const formattedUsers: UserColumn[] = clerkUsers.map((clerkUser) => {
      const dbUser = dbUsers.find(u => u.id === clerkUser.id);
      const orders = dbUser?.orders || [];
      const totalSpent = orders.reduce((sum, order) => sum + Number(order.amount), 0);
      const lastOrder = orders.length > 0 
        ? orders.reduce((latest, order) => 
            latest.createdAt > order.createdAt ? latest : order
          )
        : null;

      return {
        id: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        firstName: clerkUser.firstName || '',
        lastName: clerkUser.lastName || '',
        imageUrl: clerkUser.imageUrl,
        createdAt: clerkUser.createdAt ? new Date(clerkUser.createdAt).toISOString() : '',
        status: dbUser ? "active" : "pending",
        ordersCount: orders.length,
        totalSpent: totalSpent,
        lastOrderDate: lastOrder?.createdAt || null,
        wishlistCount: dbUser?.wishlistProducts.length || 0
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

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
    const users = await clerkClient.users.getUserList();

    const formattedUsers: UserColumn[] = users.map((user) => {

      return {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        imageUrl: user.imageUrl,
        createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : '',
        status: "inactive",
        ordersCount: 0, // Placeholder
        totalSpent: 0,   // Placeholder
        lastOrderDate: null // Placeholder
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

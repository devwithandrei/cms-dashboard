import { authMiddleware } from "@clerk/nextjs";

// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your middleware
export default authMiddleware({
  publicRoutes: [
    "/api/:storeId/checkout",
    "/api/webhook",
    "/api/clerk-webhook",
    "/api/:storeId/products",
    "/api/:storeId/categories/:categoryId",
    "/api/:storeId/sizes",
    "/api/:storeId/colors",
    "/api/:storeId/billboards",
    "/sign-in",
    "/sign-up"
  ],
  afterAuth(auth, req) {
    // Handle auth state
    if (!auth.userId && !auth.isPublicRoute) {
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', req.url);
      return Response.redirect(signInUrl);
    }
  },
});

export const config = {
  matcher: [
    "/((?!.*\\..*|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};

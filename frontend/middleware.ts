import { authMiddleware } from "@clerk/nextjs/server";

const isDev = process.env.NODE_ENV === "development";

// In dev, make everything public (skip Clerk network calls for speed)
const publicRoutes = isDev 
  ? ["/", "/((?!api/).*)"] 
  : ["/", "/sign-in", "/sign-up", "/api"];

export default authMiddleware({
  publicRoutes,
  ignoredRoutes: ["/api"],
});

export const config = {
  matcher: [
    "/((?!.*\\..*|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};

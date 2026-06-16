import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const PUBLIC_ROUTES = new Set(["/", "/sign-in", "/sign-up", "/sign-in/sso-callback"]);
const IGNORED_PREFIXES = ["/api", "/_next", "/static", "/favicon"];

export default async function middleware(req: Request) {
  const url = new URL(req.url);
  const pathname = url.pathname;

  if (IGNORED_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }
  if (PUBLIC_ROUTES.has(pathname)) {
    return NextResponse.next();
  }

  try {
    const { userId } = await auth();
    if (!userId) {
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("redirect_url", pathname);
      return NextResponse.redirect(signInUrl);
    }
    return NextResponse.next();
  } catch {
    // auth() might throw if clerk not fully initialized
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!.*\\..*|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequestWithAuth } from "next-auth/middleware";

const PROTECTED_API_PREFIXES = [
  "/api/_debug",
  "/api/fix",
  "/api/bank/debug",
];

export default withAuth((req: NextRequestWithAuth) => {
  const { pathname } = req.nextUrl;

  const isProtectedApi = PROTECTED_API_PREFIXES.some(
    (prefix) => pathname.startsWith(prefix)
  );

  if (isProtectedApi && !req.nextauth.token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}, {
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/_debug/:path*",
    "/api/fix",
    "/api/bank/debug",
  ],
};

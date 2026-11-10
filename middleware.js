import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "./auth.config";

// Use the Edge-safe config here so this file does not import Prisma.
const { auth } = NextAuth(authConfig);

export default auth((request) => {
  if (!request.auth) {
    const loginUrl = new URL("/login", request.nextUrl.origin);
    const requestedPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;

    loginUrl.searchParams.set("callbackUrl", requestedPath);
    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/dashboard/:path*"],
};

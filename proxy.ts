import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";

const { auth } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    authorized({ auth: session, request }) {
      const { pathname } = request.nextUrl;
      const adminRoute = pathname.startsWith("/admin");
      const privateRoute =
        adminRoute || pathname.startsWith("/dashboard") || pathname.startsWith("/profile");

      if (!privateRoute) return true;
      if (!session?.user) return false;
      if (adminRoute && session.user.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
      }
      return true;
    },
  },
});

export default auth;

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/admin/:path*"],
};

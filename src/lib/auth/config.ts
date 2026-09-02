import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe auth config. This file must never import Prisma, bcrypt, or any
 * other Node-only dependency: it is loaded directly by `middleware.ts`,
 * which runs on the Edge runtime. The full config (providers, adapter) lives
 * in `src/auth.ts` and extends this one for use in route handlers/server
 * components.
 */
export const authConfig = {
  pages: {
    signIn: "/sign-in",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const protectedPaths = ["/dashboard", "/resume"];
      const isProtected = protectedPaths.some((p) => request.nextUrl.pathname.startsWith(p));
      if (isProtected && !isLoggedIn) {
        return false;
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

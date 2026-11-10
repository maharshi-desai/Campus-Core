import Google from "next-auth/providers/google";

/**
 * Shared Edge-safe Auth.js options. Keep Prisma out of this file because
 * middleware.js can run in an Edge runtime on Next.js versions before 16.
 */
const authConfig = {
  providers: [Google],
  pages: {
    signIn: "/login",
  },
  // Lets the auth check in middleware validate the same session cookie without
  // importing the Prisma client into the middleware bundle.
  session: {
    strategy: "jwt",
  },
};

export default authConfig;

import type { NextAuthConfig } from 'next-auth'

// Edge-compatible config — no Prisma, no bcrypt
// Used by middleware to verify JWT tokens only
export const authConfig = {
  trustHost: true,
  session: { strategy: 'jwt' as const },
  pages: { signIn: '/login' },
  callbacks: {
    jwt({ token, user }: any) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.engineerPrefix = user.engineerPrefix
      }
      return token
    },
    session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.engineerPrefix = token.engineerPrefix
      }
      return session
    },
  },
  providers: [],
} satisfies NextAuthConfig

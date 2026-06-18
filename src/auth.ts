import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';

import { isAllowedGoogleEmail } from '@/lib/auth-policy';
import { verifyAdminPassword } from '@/lib/password';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
    CredentialsProvider({
      id: 'admin-password',
      name: 'Admin Password',
      credentials: {
        password: { label: 'Admin password', type: 'password' },
      },
      async authorize(credentials) {
        const password = credentials?.password;
        const isValid = await verifyAdminPassword(password ?? '', process.env.ADMIN_PASSWORD_HASH);

        if (!isValid) return null;

        return {
          id: 'admin-password',
          name: 'Neodym Admin',
          email: 'admin@neodym.local',
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile, user }) {
      if (account?.provider === 'google') {
        const email = profile?.email ?? user.email;
        return isAllowedGoogleEmail(email);
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) token.email = user.email;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.email) session.user.email = String(token.email);
      return session;
    },
  },
};

export const authHandler = NextAuth(authOptions);

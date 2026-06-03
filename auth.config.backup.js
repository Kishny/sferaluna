// auth.config.js
import Google from "next-auth/providers/google";
export const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,


      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
`  ],
  pages: {
    signIn: "/auth", // ta page personnalisée
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      return `${baseUrl}/mon-compte`; // Redirection vers mon-compte
    },
  },
};
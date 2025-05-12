import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { connectToDatabase } from "@/lib/db"
import { compare } from "bcryptjs"

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const { db } = await connectToDatabase()
        const user = await db.collection("users").findOne({ email: credentials.email })

        if (!user) {
          return null
        }

        const isPasswordValid = await compare(credentials.password, user.password)

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          userType: user.userType,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        // For Google sign-in, check if user exists in our database
        if (account.provider === "google") {
          const { db } = await connectToDatabase()
          const existingUser = await db.collection("users").findOne({ email: user.email })

          if (existingUser) {
            // User exists, update token with user data
            token.id = existingUser._id.toString()
            token.userType = existingUser.userType
          } else {
            // Create new user in our database
            const newUser = {
              name: user.name,
              email: user.email,
              userType: "customer", // Default to customer for Google sign-ins
              createdAt: new Date(),
              googleId: user.id,
            }

            const result = await db.collection("users").insertOne(newUser)
            token.id = result.insertedId.toString()
            token.userType = "customer"
          }
        } else {
          // For credentials sign-in
          token.id = user.id
          token.userType = user.userType
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.userType = token.userType
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.JWT_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

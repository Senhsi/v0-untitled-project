import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { connectToDatabase } from "@/lib/db"
import { compare } from "bcryptjs"
import type { NextAuthOptions } from "next-auth"

export const authOptions: NextAuthOptions = {
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
          image: user.profileImage,
          userType: user.userType,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.userId = user.id
        token.userType = user.userType
      }

      // If it's a Google sign-in, check if the user exists or create a new one
      if (account?.provider === "google") {
        const { db } = await connectToDatabase()
        const existingUser = await db.collection("users").findOne({ email: token.email })

        if (existingUser) {
          // Update the token with the existing user's data
          token.userId = existingUser._id.toString()
          token.userType = existingUser.userType

          // Update the user's Google profile image if it changed
          if (token.picture && token.picture !== existingUser.profileImage) {
            await db.collection("users").updateOne({ _id: existingUser._id }, { $set: { profileImage: token.picture } })
          }
        } else {
          // Create a new user
          const newUser = {
            name: token.name,
            email: token.email,
            profileImage: token.picture,
            userType: "customer", // Default to customer for Google sign-ins
            createdAt: new Date(),
          }

          const result = await db.collection("users").insertOne(newUser)
          token.userId = result.insertedId.toString()
          token.userType = "customer"
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.userId = token.userId as string
        session.user.userType = token.userType as string
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

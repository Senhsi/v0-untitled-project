import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      userType: "customer" | "restaurant"
    } & DefaultSession["user"]
  }

  interface User {
    userType: "customer" | "restaurant"
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    userType: "customer" | "restaurant"
  }
}

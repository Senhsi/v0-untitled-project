import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import type { NextRequest } from "next/server"
import { verifyToken } from "./auth"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || ""

// Get the authenticated user from the request
export async function getAuthUser(req: NextRequest | Request) {
  try {
    // First try to get the token from the Authorization header
    const authHeader = req.headers.get("authorization")

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1]
      try {
        const decoded = await verifyToken(token)
        return {
          userId: decoded.userId,
          email: decoded.email,
          userType: decoded.userType,
        }
      } catch (error) {
        // If token verification fails, continue to check session
      }
    }

    // If we're in a server context, try to get the session
    if (typeof window === "undefined") {
      try {
        const session = await getServerSession(authOptions)

        if (session?.user) {
          return {
            userId: session.user.id,
            email: session.user.email || "",
            userType: session.user.userType,
          }
        }
      } catch (error) {
        // If session retrieval fails, continue
      }
    }

    // If no user is found, throw an error
    throw new Error("Unauthorized")
  } catch (error) {
    throw new Error("Unauthorized")
  }
}

// Helper function to handle API errors
export function handleApiError(error: any) {
  console.error("API Error:", error)

  if (error.message === "Unauthorized") {
    return { error: "Unauthorized", status: 401 }
  }

  return {
    error: error.message || "Internal server error",
    status: error.status || 500,
  }
}

// Check if the user is authorized to access a resource
export function isAuthorized(user: { userId: string; userType: string }, resourceOwnerId: string) {
  return user.userId === resourceOwnerId || user.userType === "admin"
}

export async function fetchWithAuth(url: string, options: any = {}) {
  let token: any = null

  // Try to get token from next-auth if in a server component
  if (typeof window === "undefined") {
    try {
      const session = await getServerSession(authOptions)
      token = session?.user?.accessToken
    } catch (error) {
      // Ignore errors and continue
    }
  } else {
    // In client components, get token from localStorage
    token = localStorage.getItem("token")
  }

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  // Don't set Content-Type for FormData
  if (options.body instanceof FormData) {
    delete headers["Content-Type"]
  }

  const config = {
    ...options,
    headers,
  }

  const res = await fetch(`${BASE_URL}${url}`, config)

  // Handle unauthorized errors
  if (res.status === 401 && typeof window !== "undefined") {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    window.location.href = "/login"
    throw new Error("Unauthorized")
  }

  return res
}

export async function postWithAuth(url: string, body: any) {
  const res = await fetchWithAuth(url, {
    method: "POST",
    body: body instanceof FormData ? body : JSON.stringify(body),
  })
  return await res.json()
}

export async function putWithAuth(url: string, body: any) {
  const res = await fetchWithAuth(url, {
    method: "PUT",
    body: body instanceof FormData ? body : JSON.stringify(body),
  })
  return await res.json()
}

export async function getWithAuth(url: string) {
  const res = await fetchWithAuth(url, {
    method: "GET",
  })
  return await res.json()
}

export async function deleteWithAuth(url: string) {
  const res = await fetchWithAuth(url, {
    method: "DELETE",
  })
  return res
}

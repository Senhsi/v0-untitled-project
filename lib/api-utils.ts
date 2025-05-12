import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { headers } from "next/headers"
import { verifyToken } from "./auth"

// Get the authenticated user from the request
export async function getAuthUser(req: Request) {
  // First, try to get the user from the Authorization header
  const authHeader = headers().get("authorization")

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

  // If no Authorization header or token verification failed, try to get the user from the session
  const session = await getServerSession(authOptions)

  if (session?.user) {
    return {
      userId: session.user.id,
      email: session.user.email || "",
      userType: session.user.userType,
    }
  }

  // If no user is found, throw an error
  throw new Error("Unauthorized")
}

// Check if the user is authorized to access a resource
export function isAuthorized(user: { userId: string; userType: string }, resourceOwnerId: string) {
  return user.userId === resourceOwnerId || user.userType === "admin"
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

export async function fetchWithAuth(url: string, options: any = {}) {
  const authHeader = headers().get("authorization")

  const defaultHeaders = {
    "Content-Type": "application/json",
  }

  const mergedOptions = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
  }

  const response = await fetch(url, mergedOptions)
  return response
}

export async function postWithAuth(url: string, body: any) {
  const authHeader = headers().get("authorization")

  const defaultHeaders = {
    "Content-Type": "application/json",
  }

  const options = {
    method: "POST",
    headers: {
      ...defaultHeaders,
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
    body: JSON.stringify(body),
  }

  const response = await fetch(url, options)
  return await response.json()
}

export async function getWithAuth(url: string) {
  const authHeader = headers().get("authorization")

  const defaultHeaders = {
    "Content-Type": "application/json",
  }

  const options = {
    method: "GET",
    headers: {
      ...defaultHeaders,
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
  }

  const response = await fetch(url, options)
  return await response.json()
}

export async function putWithAuth(url: string, body: any) {
  const authHeader = headers().get("authorization")

  const defaultHeaders = {
    "Content-Type": "application/json",
  }

  const options = {
    method: "PUT",
    headers: {
      ...defaultHeaders,
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
    body: JSON.stringify(body),
  }

  const response = await fetch(url, options)
  return await response.json()
}

export async function deleteWithAuth(url: string) {
  const authHeader = headers().get("authorization")

  const defaultHeaders = {
    "Content-Type": "application/json",
  }

  const options = {
    method: "DELETE",
    headers: {
      ...defaultHeaders,
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
  }

  const response = await fetch(url, options)
  return response
}

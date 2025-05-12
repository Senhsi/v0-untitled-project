import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

// Paths that require authentication
const protectedPaths = ["/dashboard", "/api/restaurants", "/api/reservations", "/api/reviews", "/api/favorites"]

// Paths that are public
const publicPaths = ["/", "/login", "/register", "/restaurants", "/api/auth/login", "/api/auth/register"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the path is protected
  const isProtectedPath = protectedPaths.some((path) => {
    // Handle dynamic routes
    if (path.includes("[") && path.includes("]")) {
      const pathWithoutParams = path.split("/").slice(0, -1).join("/")
      return pathname.startsWith(pathWithoutParams)
    }
    return pathname.startsWith(path)
  })

  // If it's not a protected path, allow the request
  if (!isProtectedPath) {
    return NextResponse.next()
  }

  // For API routes, check the Authorization header or session
  if (pathname.startsWith("/api")) {
    // First try to get the token from the Authorization header
    const authHeader = request.headers.get("authorization")

    if (authHeader && authHeader.startsWith("Bearer ")) {
      // Use the token from the Authorization header
      return NextResponse.next()
    }

    // If no Authorization header, try to get the session token
    const token = await getToken({ req: request, secret: process.env.JWT_SECRET })

    if (token) {
      return NextResponse.next()
    }

    return NextResponse.json({ error: "Authorization required" }, { status: 401 })
  }

  // For non-API routes, check the session
  const token = await getToken({ req: request, secret: process.env.JWT_SECRET })

  // If there's no token, redirect to login
  if (!token) {
    const url = new URL("/login", request.url)
    url.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

// Configure the middleware to run only on specific paths
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/restaurants/:path*",
    "/api/reservations/:path*",
    "/api/reviews/:path*",
    "/api/favorites/:path*",
  ],
}

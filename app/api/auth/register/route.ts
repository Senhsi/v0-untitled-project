import { NextResponse } from "next/server"
import { registerUser } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password, userType, restaurantName } = body

    // Validate input
    if (!name || !email || !password || !userType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Register the user
    const result = await registerUser({ name, email, password, userType })

    // If user is a restaurant owner, we would create a restaurant profile here
    // This would be done in a separate function/API call in a real app

    return NextResponse.json(
      {
        success: true,
        message: "User registered successfully",
        user: result.user,
        token: result.token,
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

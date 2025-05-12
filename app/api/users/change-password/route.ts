import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase, toObjectId } from "@/lib/db"
import { getAuthUser, handleApiError } from "@/lib/api-utils"
import { hash, compare } from "bcryptjs" // Changed from bcrypt to bcryptjs

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    const { db } = await connectToDatabase()
    const { currentPassword, newPassword } = await req.json()

    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Current password and new password are required" }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters long" }, { status: 400 })
    }

    // Get user with password
    const userDoc = await db.collection("users").findOne({ _id: toObjectId(user.userId) })

    if (!userDoc) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Verify current password
    const isPasswordValid = await compare(currentPassword, userDoc.password)
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
    }

    // Hash new password
    const hashedPassword = await hash(newPassword, 10)

    // Update password
    await db.collection("users").updateOne({ _id: toObjectId(user.userId) }, { $set: { password: hashedPassword } })

    return NextResponse.json({ success: true, message: "Password updated successfully" })
  } catch (error) {
    const { error: errorMessage, status } = handleApiError(error)
    return NextResponse.json({ error: errorMessage }, { status })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase, toObjectId } from "@/lib/db"
import { getAuthUser, handleApiError } from "@/lib/api-utils"

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    const { db } = await connectToDatabase()

    const userProfile = await db.collection("users").findOne(
      { _id: toObjectId(user.userId) },
      {
        projection: {
          password: 0, // Exclude password
        },
      },
    )

    if (!userProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(userProfile)
  } catch (error) {
    const { error: errorMessage, status } = handleApiError(error)
    return NextResponse.json({ error: errorMessage }, { status })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    const { db } = await connectToDatabase()
    const data = await req.json()

    // Fields that can be updated
    const allowedFields = ["name", "email", "phone", "profileImage", "bio", "preferences"]

    // Create update object with only allowed fields
    const updateData: Record<string, any> = {}
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field]
      }
    }

    // Update the user
    const result = await db.collection("users").updateOne({ _id: toObjectId(user.userId) }, { $set: updateData })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Profile updated successfully" })
  } catch (error) {
    const { error: errorMessage, status } = handleApiError(error)
    return NextResponse.json({ error: errorMessage }, { status })
  }
}

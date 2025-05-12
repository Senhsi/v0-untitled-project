import { NextResponse } from "next/server"
import { connectToDatabase, toObjectId } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

// POST /api/reviews/:id/helpful - Mark a review as helpful
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    const decoded = await verifyToken(authHeader)
    if (decoded.userType !== "customer") {
      return NextResponse.json({ error: "Only customers can mark reviews as helpful" }, { status: 403 })
    }

    const id = params.id

    const { db } = await connectToDatabase()
    const collection = db.collection("reviews")

    // Check if review exists
    const review = await collection.findOne({ _id: toObjectId(id) })
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 })
    }

    // Check if the review is approved
    if (review.status !== "approved") {
      return NextResponse.json({ error: "Can only mark approved reviews as helpful" }, { status: 400 })
    }

    // Check if the user is marking their own review
    if (review.customerId === decoded.userId) {
      return NextResponse.json({ error: "Cannot mark your own review as helpful" }, { status: 400 })
    }

    // Mark as helpful
    await collection.updateOne({ _id: toObjectId(id) }, { $inc: { helpful: 1 }, $set: { updatedAt: new Date() } })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error marking review as helpful:", error)
    return NextResponse.json({ error: error.message || "Failed to mark review as helpful" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { connectToDatabase, toObjectId } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

// POST /api/reviews/:id/report - Report a review
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    const decoded = await verifyToken(authHeader)
    const id = params.id

    const { db } = await connectToDatabase()
    const collection = db.collection("reviews")

    // Check if review exists
    const review = await collection.findOne({ _id: toObjectId(id) })
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 })
    }

    // Get reason for reporting
    const { reason } = await request.json()

    if (!reason) {
      return NextResponse.json({ error: "Reason for reporting is required" }, { status: 400 })
    }

    // Log the report
    const reportsCollection = db.collection("reports")
    await reportsCollection.insertOne({
      reviewId: id,
      reporterId: decoded.userId,
      reason,
      date: new Date(),
      status: "pending",
    })

    // Increment report count
    await collection.updateOne({ _id: toObjectId(id) }, { $inc: { reportCount: 1 }, $set: { updatedAt: new Date() } })

    // If report count is high (e.g., > 5), automatically mark for review
    if (review.reportCount >= 5) {
      await collection.updateOne({ _id: toObjectId(id) }, { $set: { status: "pending" } })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error reporting review:", error)
    return NextResponse.json({ error: error.message || "Failed to report review" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { connectToDatabase, toObjectId } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

// PUT /api/reviews/:id/moderate - Used by restaurant owners to moderate reviews
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    const decoded = await verifyToken(authHeader)
    if (decoded.userType !== "restaurant") {
      return NextResponse.json({ error: "Only restaurant owners can moderate reviews" }, { status: 403 })
    }

    const id = params.id

    const { db } = await connectToDatabase()
    const collection = db.collection("reviews")

    // Check if review exists
    const review = await collection.findOne({ _id: toObjectId(id) })
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 })
    }

    // Verify the restaurant owner is the owner of the restaurant in the review
    const restaurantCollection = db.collection("restaurants")
    const restaurant = await restaurantCollection.findOne({
      _id: toObjectId(review.restaurantId),
      ownerId: decoded.userId,
    })

    if (!restaurant) {
      return NextResponse.json({ error: "Not authorized to moderate this review" }, { status: 403 })
    }

    const { status } = await request.json()

    // Validate input
    if (!status || !["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Valid status is required (pending, approved, or rejected)" }, { status: 400 })
    }

    // Update review status
    await collection.updateOne({ _id: toObjectId(id) }, { $set: { status, updatedAt: new Date() } })

    // If approving the review, update the restaurant rating
    if (status === "approved") {
      const approvedReviews = await collection
        .find({
          restaurantId: review.restaurantId,
          status: "approved",
        })
        .toArray()

      const totalRating = approvedReviews.reduce((sum, review) => sum + review.rating, 0)
      const averageRating = totalRating / approvedReviews.length

      await restaurantCollection.updateOne(
        { _id: toObjectId(review.restaurantId) },
        { $set: { rating: averageRating } },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error moderating review:", error)
    return NextResponse.json({ error: error.message || "Failed to moderate review" }, { status: 500 })
  }
}

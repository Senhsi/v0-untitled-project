import { NextResponse } from "next/server"
import { connectToDatabase, toObjectId } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    const { db } = await connectToDatabase()
    const collection = db.collection("reviews")

    // Get review
    const review = await collection.findOne({ _id: toObjectId(id) })

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 })
    }

    // Get customer and restaurant details
    const userCollection = db.collection("users")
    const restaurantCollection = db.collection("restaurants")

    const customer = await userCollection.findOne({ _id: toObjectId(review.customerId) })
    const restaurant = await restaurantCollection.findOne({ _id: toObjectId(review.restaurantId) })

    // Transform _id to string
    const formattedReview = {
      ...review,
      _id: review._id.toString(),
      customerName: customer ? customer.name : "Unknown Customer",
      restaurantName: restaurant ? restaurant.name : "Unknown Restaurant",
    }

    return NextResponse.json(formattedReview)
  } catch (error: any) {
    console.error("Error fetching review:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch review" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
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

    const body = await request.json()

    // Different update logic based on user type
    if (decoded.userType === "customer") {
      // Customers can only update their own reviews
      if (review.customerId !== decoded.userId) {
        return NextResponse.json({ error: "Not authorized to update this review" }, { status: 403 })
      }

      const { rating, comment, images } = body

      // Validate input
      if (!rating && !comment) {
        return NextResponse.json({ error: "Either rating or comment is required" }, { status: 400 })
      }

      if (rating && (rating < 1 || rating > 5)) {
        return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
      }

      // Update review
      const updateData: any = {
        updatedAt: new Date(),
        status: "pending", // Reset to pending for moderation
      }

      if (rating) updateData.rating = Number(rating)
      if (comment) updateData.comment = comment
      if (images) updateData.images = images

      await collection.updateOne({ _id: toObjectId(id) }, { $set: updateData })
    } else if (decoded.userType === "restaurant") {
      // Restaurant owners can only update reviews for their restaurants
      const restaurantCollection = db.collection("restaurants")
      const restaurant = await restaurantCollection.findOne({
        _id: toObjectId(review.restaurantId),
        ownerId: decoded.userId,
      })

      if (!restaurant) {
        return NextResponse.json({ error: "Not authorized to update this review" }, { status: 403 })
      }

      const { reply, status } = body

      // Restaurant owners can update the reply and status
      const updateData: any = { updatedAt: new Date() }

      if (reply !== undefined) updateData.reply = reply
      if (status && ["pending", "approved", "rejected"].includes(status)) {
        updateData.status = status

        // If the review is being approved, update the restaurant rating
        if (status === "approved") {
          const reviewCollection = db.collection("reviews")
          const approvedReviews = await reviewCollection
            .find({
              restaurantId: review.restaurantId,
              status: "approved",
            })
            .toArray()

          // Add the current review if it's not already in the approved list
          if (!approvedReviews.some((r) => r._id.toString() === id)) {
            approvedReviews.push({ ...review, ...updateData })
          }

          const totalRating = approvedReviews.reduce((sum, review) => sum + review.rating, 0)
          const averageRating = totalRating / approvedReviews.length

          await restaurantCollection.updateOne(
            { _id: toObjectId(review.restaurantId) },
            { $set: { rating: averageRating } },
          )
        }
      }

      await collection.updateOne({ _id: toObjectId(id) }, { $set: updateData })
    }

    // Get updated review
    const updatedReview = await collection.findOne({ _id: toObjectId(id) })

    return NextResponse.json({
      ...updatedReview,
      _id: updatedReview?._id.toString(),
    })
  } catch (error: any) {
    console.error("Error updating review:", error)
    return NextResponse.json({ error: error.message || "Failed to update review" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
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

    // Check user authorization
    let canDelete = false

    if (decoded.userType === "customer" && review.customerId === decoded.userId) {
      canDelete = true
    } else if (decoded.userType === "restaurant") {
      // Restaurant owners can delete reviews for their restaurants
      const restaurantCollection = db.collection("restaurants")
      const restaurant = await restaurantCollection.findOne({
        _id: toObjectId(review.restaurantId),
        ownerId: decoded.userId,
      })
      if (restaurant) {
        canDelete = true
      }
    }

    if (!canDelete) {
      return NextResponse.json({ error: "Not authorized to delete this review" }, { status: 403 })
    }

    // Delete review
    await collection.deleteOne({ _id: toObjectId(id) })

    // Update restaurant rating
    const restaurantId = review.restaurantId
    const reviewCollection = db.collection("reviews")
    const approvedReviews = await reviewCollection
      .find({
        restaurantId,
        status: "approved",
      })
      .toArray()

    if (approvedReviews.length > 0) {
      const totalRating = approvedReviews.reduce((sum, review) => sum + review.rating, 0)
      const averageRating = totalRating / approvedReviews.length

      const restaurantCollection = db.collection("restaurants")
      await restaurantCollection.updateOne({ _id: toObjectId(restaurantId) }, { $set: { rating: averageRating } })
    } else {
      // No reviews left, remove rating
      const restaurantCollection = db.collection("restaurants")
      await restaurantCollection.updateOne({ _id: toObjectId(restaurantId) }, { $unset: { rating: "" } })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting review:", error)
    return NextResponse.json({ error: error.message || "Failed to delete review" }, { status: 500 })
  }
}

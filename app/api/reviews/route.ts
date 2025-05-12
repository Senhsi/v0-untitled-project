import { NextResponse } from "next/server"
import { connectToDatabase, toObjectId } from "@/lib/db"
import { verifyToken } from "@/lib/auth"
import { emitToRestaurantOwner } from "@/lib/socket-server"

export async function GET(request: Request) {
  // Existing code...
}

export async function POST(request: Request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    const decoded = await verifyToken(authHeader)
    if (decoded.userType !== "customer") {
      return NextResponse.json({ error: "Only customers can create reviews" }, { status: 403 })
    }

    const body = await request.json()
    const { restaurantId, rating, comment, images = [] } = body

    // Validate input
    if (!restaurantId || !rating || !comment) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Verify restaurant exists
    const restaurantCollection = db.collection("restaurants")
    const restaurant = await restaurantCollection.findOne({ _id: toObjectId(restaurantId) })
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 })
    }

    // Check if user has already reviewed this restaurant
    const reviewCollection = db.collection("reviews")
    const existingReview = await reviewCollection.findOne({
      restaurantId,
      customerId: decoded.userId,
    })

    if (existingReview) {
      return NextResponse.json({ error: "You have already reviewed this restaurant" }, { status: 400 })
    }

    // Get customer details
    const userCollection = db.collection("users")
    const customer = await userCollection.findOne({ _id: toObjectId(decoded.userId) })

    // Create review
    const review = {
      restaurantId,
      customerId: decoded.userId,
      rating: Number(rating),
      comment,
      images,
      date: new Date(),
      status: "pending", // All reviews start as pending for moderation
      helpful: 0,
      reportCount: 0,
    }

    const result = await reviewCollection.insertOne(review)

    // Emit WebSocket event to restaurant owner
    emitToRestaurantOwner(restaurant.ownerId, "new_review", {
      ...review,
      _id: result.insertedId.toString(),
      restaurantName: restaurant.name,
      customerName: customer ? customer.name : "Unknown Customer",
    })

    return NextResponse.json(
      {
        ...review,
        _id: result.insertedId.toString(),
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error("Error creating review:", error)
    return NextResponse.json({ error: error.message || "Failed to create review" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { connectToDatabase, toObjectId } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get("restaurantId")
    const customerId = searchParams.get("customerId")
    const status = searchParams.get("status")
    const sortBy = searchParams.get("sortBy") || "date" // "date", "rating", "helpful"
    const sortOrder = searchParams.get("sortOrder") || "desc" // "asc", "desc"

    // Validate input
    if (!restaurantId && !customerId) {
      return NextResponse.json({ error: "Either restaurantId or customerId is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const collection = db.collection("reviews")

    // Build query
    const query: any = {}
    if (restaurantId) {
      query.restaurantId = restaurantId
    }
    if (customerId) {
      query.customerId = customerId
    }
    if (status) {
      query.status = status
    } else {
      // By default only return approved reviews for public access
      query.status = "approved"
    }

    // Check if request is authenticated and from restaurant owner
    let isRestaurantOwner = false
    const authHeader = request.headers.get("authorization")
    if (authHeader) {
      try {
        const decoded = await verifyToken(authHeader)
        if (decoded.userType === "restaurant" && restaurantId) {
          // Check if this restaurant belongs to the user
          const restaurantCollection = db.collection("restaurants")
          const restaurant = await restaurantCollection.findOne({
            _id: toObjectId(restaurantId),
            ownerId: decoded.userId,
          })

          if (restaurant) {
            isRestaurantOwner = true
            // Restaurant owners can see all reviews for their restaurant
            delete query.status
          }
        }
      } catch (error) {
        // Continue as unauthenticated if token verification fails
      }
    }

    // Get reviews
    let reviews

    // Sort options
    const sortOptions: any = {}
    if (sortBy === "rating") {
      sortOptions.rating = sortOrder === "asc" ? 1 : -1
    } else if (sortBy === "helpful") {
      sortOptions.helpful = sortOrder === "asc" ? 1 : -1
    } else {
      sortOptions.date = sortOrder === "asc" ? 1 : -1
    }

    reviews = await collection.find(query).sort(sortOptions).toArray()

    // Transform _id to string and add user/restaurant details
    const formattedReviews = await Promise.all(
      reviews.map(async (review) => {
        const userCollection = db.collection("users")
        const restaurantCollection = db.collection("restaurants")

        const customer = await userCollection.findOne({ _id: toObjectId(review.customerId) })
        const restaurant = await restaurantCollection.findOne({ _id: toObjectId(review.restaurantId) })

        return {
          ...review,
          _id: review._id.toString(),
          customerName: customer ? customer.name : "Unknown Customer",
          restaurantName: restaurant ? restaurant.name : "Unknown Restaurant",
        }
      }),
    )

    return NextResponse.json(formattedReviews)
  } catch (error: any) {
    console.error("Error fetching reviews:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch reviews" }, { status: 500 })
  }
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

    // Update restaurant rating only for approved reviews
    // This will be updated when the review is approved

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

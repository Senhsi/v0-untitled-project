import { NextResponse } from "next/server"
import { connectToDatabase, toObjectId } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    const decoded = await verifyToken(authHeader)
    if (decoded.userType !== "customer") {
      return NextResponse.json({ error: "Only customers can access favorites" }, { status: 403 })
    }

    const { db } = await connectToDatabase()
    const collection = db.collection("favorites")

    // Get favorites for this customer
    const favorites = await collection.find({ customerId: decoded.userId }).toArray()

    // Get restaurant details for each favorite
    const restaurantCollection = db.collection("restaurants")
    const formattedFavorites = await Promise.all(
      favorites.map(async (favorite) => {
        const restaurant = await restaurantCollection.findOne({ _id: toObjectId(favorite.restaurantId) })

        return {
          ...favorite,
          _id: favorite._id.toString(),
          restaurant: restaurant
            ? {
                _id: restaurant._id.toString(),
                name: restaurant.name,
                cuisine: restaurant.cuisine,
                rating: restaurant.rating || 0,
              }
            : null,
        }
      }),
    )

    return NextResponse.json(formattedFavorites)
  } catch (error: any) {
    console.error("Error fetching favorites:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch favorites" }, { status: 500 })
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
      return NextResponse.json({ error: "Only customers can add favorites" }, { status: 403 })
    }

    const body = await request.json()
    const { restaurantId } = body

    // Validate input
    if (!restaurantId) {
      return NextResponse.json({ error: "Restaurant ID is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Verify restaurant exists
    const restaurantCollection = db.collection("restaurants")
    const restaurant = await restaurantCollection.findOne({ _id: toObjectId(restaurantId) })
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 })
    }

    // Check if already in favorites
    const favoriteCollection = db.collection("favorites")
    const existingFavorite = await favoriteCollection.findOne({
      customerId: decoded.userId,
      restaurantId,
    })

    if (existingFavorite) {
      return NextResponse.json({ error: "Restaurant already in favorites" }, { status: 400 })
    }

    // Add to favorites
    const favorite = {
      customerId: decoded.userId,
      restaurantId,
      createdAt: new Date(),
    }

    const result = await favoriteCollection.insertOne(favorite)

    return NextResponse.json(
      {
        ...favorite,
        _id: result.insertedId.toString(),
        restaurant: {
          _id: restaurant._id.toString(),
          name: restaurant.name,
          cuisine: restaurant.cuisine,
          rating: restaurant.rating || 0,
        },
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error("Error adding to favorites:", error)
    return NextResponse.json({ error: error.message || "Failed to add to favorites" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get("customerId")
    const restaurantId = searchParams.get("restaurantId")

    if (!customerId || !restaurantId) {
      return NextResponse.json({ error: "Customer ID and Restaurant ID are required" }, { status: 400 })
    }

    // In a real app, you would delete from database
    console.log("Removing restaurant from favorites:", { customerId, restaurantId })

    // Mock response
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("Error removing from favorites:", error)
    return NextResponse.json({ error: "Failed to remove from favorites" }, { status: 500 })
  }
}

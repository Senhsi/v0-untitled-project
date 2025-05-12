import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const cuisine = searchParams.get("cuisine")
    const location = searchParams.get("location")
    const priceRange = searchParams.get("priceRange")
    const isLgbtqFriendly = searchParams.get("isLgbtqFriendly")
    const isSmokingAllowed = searchParams.get("isSmokingAllowed")
    const hasOutdoorSeating = searchParams.get("hasOutdoorSeating")
    const isWheelchairAccessible = searchParams.get("isWheelchairAccessible")
    const hasVeganOptions = searchParams.get("hasVeganOptions")
    const hasVegetarianOptions = searchParams.get("hasVegetarianOptions")

    const { db } = await connectToDatabase()
    const collection = db.collection("restaurants")

    // Build query
    const query: any = {}
    if (cuisine) {
      query.cuisine = cuisine
    }
    if (location) {
      query.location = location
    }
    if (priceRange) {
      query.priceRange = priceRange
    }
    if (isLgbtqFriendly === "true") {
      query.isLgbtqFriendly = true
    }
    if (isSmokingAllowed === "true") {
      query.isSmokingAllowed = true
    }
    if (hasOutdoorSeating === "true") {
      query.hasOutdoorSeating = true
    }
    if (isWheelchairAccessible === "true") {
      query.isWheelchairAccessible = true
    }
    if (hasVeganOptions === "true") {
      query.hasVeganOptions = true
    }
    if (hasVegetarianOptions === "true") {
      query.hasVegetarianOptions = true
    }

    // Get restaurants
    const restaurants = await collection.find(query).toArray()

    // Transform _id to string
    const formattedRestaurants = restaurants.map((restaurant) => ({
      ...restaurant,
      _id: restaurant._id.toString(),
    }))

    return NextResponse.json(formattedRestaurants)
  } catch (error: any) {
    console.error("Error fetching restaurants:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch restaurants" }, { status: 500 })
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
    if (decoded.userType !== "restaurant") {
      return NextResponse.json({ error: "Only restaurant owners can create restaurants" }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      description,
      cuisine,
      location,
      phone,
      hours,
      priceRange,
      isLgbtqFriendly,
      isSmokingAllowed,
      hasOutdoorSeating,
      isWheelchairAccessible,
      hasVeganOptions,
      hasVegetarianOptions,
    } = body

    // Validate input
    if (!name || !cuisine || !location) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const collection = db.collection("restaurants")

    // Create restaurant
    const restaurant = {
      ownerId: decoded.userId,
      name,
      description: description || "",
      cuisine,
      location,
      phone: phone || "",
      hours: hours || "",
      images: [],
      menu: [],
      createdAt: new Date(),
      // New attributes with default values
      priceRange: priceRange || "medium",
      isLgbtqFriendly: isLgbtqFriendly || false,
      isSmokingAllowed: isSmokingAllowed || false,
      hasOutdoorSeating: hasOutdoorSeating || false,
      isWheelchairAccessible: isWheelchairAccessible || false,
      hasVeganOptions: hasVeganOptions || false,
      hasVegetarianOptions: hasVegetarianOptions || false,
    }

    const result = await collection.insertOne(restaurant)

    return NextResponse.json(
      {
        ...restaurant,
        _id: result.insertedId.toString(),
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error("Error creating restaurant:", error)
    return NextResponse.json({ error: error.message || "Failed to create restaurant" }, { status: 500 })
  }
}

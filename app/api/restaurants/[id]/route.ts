import { NextResponse } from "next/server"
import { connectToDatabase, toObjectId } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    const { db } = await connectToDatabase()
    const collection = db.collection("restaurants")

    // Get restaurant
    const restaurant = await collection.findOne({ _id: toObjectId(id) })

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 })
    }

    // Transform _id to string
    const formattedRestaurant = {
      ...restaurant,
      _id: restaurant._id.toString(),
    }

    return NextResponse.json(formattedRestaurant)
  } catch (error: any) {
    console.error("Error fetching restaurant:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch restaurant" }, { status: 500 })
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
    const collection = db.collection("restaurants")

    // Check if restaurant exists and belongs to the user
    const restaurant = await collection.findOne({ _id: toObjectId(id) })
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 })
    }

    if (restaurant.ownerId !== decoded.userId) {
      return NextResponse.json({ error: "Not authorized to update this restaurant" }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      description,
      cuisine,
      location,
      phone,
      hours,
      menu,
      priceRange,
      isLgbtqFriendly,
      isSmokingAllowed,
      hasOutdoorSeating,
      isWheelchairAccessible,
      hasVeganOptions,
      hasVegetarianOptions,
    } = body

    // Update restaurant
    const updateData: any = {}
    if (name) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (cuisine) updateData.cuisine = cuisine
    if (location) updateData.location = location
    if (phone !== undefined) updateData.phone = phone
    if (hours !== undefined) updateData.hours = hours
    if (menu) updateData.menu = menu
    if (priceRange) updateData.priceRange = priceRange
    if (isLgbtqFriendly !== undefined) updateData.isLgbtqFriendly = isLgbtqFriendly
    if (isSmokingAllowed !== undefined) updateData.isSmokingAllowed = isSmokingAllowed
    if (hasOutdoorSeating !== undefined) updateData.hasOutdoorSeating = hasOutdoorSeating
    if (isWheelchairAccessible !== undefined) updateData.isWheelchairAccessible = isWheelchairAccessible
    if (hasVeganOptions !== undefined) updateData.hasVeganOptions = hasVeganOptions
    if (hasVegetarianOptions !== undefined) updateData.hasVegetarianOptions = hasVegetarianOptions

    await collection.updateOne({ _id: toObjectId(id) }, { $set: updateData })

    // Get updated restaurant
    const updatedRestaurant = await collection.findOne({ _id: toObjectId(id) })

    return NextResponse.json({
      ...updatedRestaurant,
      _id: updatedRestaurant?._id.toString(),
    })
  } catch (error: any) {
    console.error("Error updating restaurant:", error)
    return NextResponse.json({ error: error.message || "Failed to update restaurant" }, { status: 500 })
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
    const restaurantCollection = db.collection("restaurants")

    // Check if restaurant exists and belongs to the user
    const restaurant = await restaurantCollection.findOne({ _id: toObjectId(id) })
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 })
    }

    if (restaurant.ownerId !== decoded.userId) {
      return NextResponse.json({ error: "Not authorized to delete this restaurant" }, { status: 403 })
    }

    // Delete restaurant
    await restaurantCollection.deleteOne({ _id: toObjectId(id) })

    // Also delete related data (reservations, reviews, favorites)
    const reservationCollection = db.collection("reservations")
    await reservationCollection.deleteMany({ restaurantId: id })

    const reviewCollection = db.collection("reviews")
    await reviewCollection.deleteMany({ restaurantId: id })

    const favoriteCollection = db.collection("favorites")
    await favoriteCollection.deleteMany({ restaurantId: id })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting restaurant:", error)
    return NextResponse.json({ error: error.message || "Failed to delete restaurant" }, { status: 500 })
  }
}

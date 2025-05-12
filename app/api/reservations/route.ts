import { NextResponse } from "next/server"
import { connectToDatabase, toObjectId } from "@/lib/db"
import { verifyToken } from "@/lib/auth"
import { emitToRestaurantOwner } from "@/lib/socket-server"

export async function GET(request: Request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    const decoded = await verifyToken(authHeader)
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get("restaurantId")
    const customerId = searchParams.get("customerId")

    const { db } = await connectToDatabase()
    const collection = db.collection("reservations")

    // Build query
    const query: any = {}

    // If user is a customer, they can only see their own reservations
    if (decoded.userType === "customer") {
      query.customerId = decoded.userId
    }
    // If user is a restaurant owner, they can only see reservations for their restaurants
    else if (decoded.userType === "restaurant") {
      // If restaurantId is provided, verify it belongs to the user
      if (restaurantId) {
        const restaurantCollection = db.collection("restaurants")
        const restaurant = await restaurantCollection.findOne({
          _id: toObjectId(restaurantId),
          ownerId: decoded.userId,
        })

        if (!restaurant) {
          return NextResponse.json({ error: "Restaurant not found or not owned by you" }, { status: 404 })
        }

        query.restaurantId = restaurantId
      } else {
        // Get all restaurants owned by this user
        const restaurantCollection = db.collection("restaurants")
        const restaurants = await restaurantCollection.find({ ownerId: decoded.userId }).toArray()
        const restaurantIds = restaurants.map((r) => r._id.toString())

        query.restaurantId = { $in: restaurantIds }
      }
    }

    // Additional filters
    if (customerId && decoded.userType === "restaurant") {
      query.customerId = customerId
    }

    // Get reservations
    const reservations = await collection.find(query).toArray()

    // Transform _id to string
    const formattedReservations = await Promise.all(
      reservations.map(async (reservation) => {
        // Get restaurant and customer details
        const restaurantCollection = db.collection("restaurants")
        const userCollection = db.collection("users")

        const restaurant = await restaurantCollection.findOne({ _id: toObjectId(reservation.restaurantId) })
        const customer = await userCollection.findOne({ _id: toObjectId(reservation.customerId) })

        return {
          ...reservation,
          _id: reservation._id.toString(),
          restaurantName: restaurant ? restaurant.name : "Unknown Restaurant",
          customerName: customer ? customer.name : "Unknown Customer",
        }
      }),
    )

    return NextResponse.json(formattedReservations)
  } catch (error: any) {
    console.error("Error fetching reservations:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch reservations" }, { status: 500 })
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
      return NextResponse.json({ error: "Only customers can create reservations" }, { status: 403 })
    }

    const body = await request.json()
    const { restaurantId, date, time, guests, specialRequests } = body

    // Validate input
    if (!restaurantId || !date || !time || !guests) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Verify restaurant exists
    const restaurantCollection = db.collection("restaurants")
    const restaurant = await restaurantCollection.findOne({ _id: toObjectId(restaurantId) })
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 })
    }

    const reservationCollection = db.collection("reservations")

    // Create reservation
    const reservation = {
      restaurantId,
      customerId: decoded.userId,
      date: new Date(date),
      time,
      guests: Number(guests),
      status: "pending",
      specialRequests: specialRequests || "",
      createdAt: new Date(),
    }

    const result = await reservationCollection.insertOne(reservation)

    const newReservation = {
      ...reservation,
      _id: result.insertedId.toString(),
    }

    // Get customer details for notification
    const userCollection = db.collection("users")
    const customer = await userCollection.findOne({ _id: toObjectId(decoded.userId) })

    // Emit WebSocket event to restaurant owner
    emitToRestaurantOwner(restaurant.ownerId, "new_reservation", {
      ...newReservation,
      restaurantName: restaurant.name,
      customerName: customer ? customer.name : "Unknown Customer",
    })

    return NextResponse.json(newReservation, { status: 201 })
  } catch (error: any) {
    console.error("Error creating reservation:", error)
    return NextResponse.json({ error: error.message || "Failed to create reservation" }, { status: 500 })
  }
}

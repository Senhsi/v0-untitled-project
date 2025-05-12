import { NextResponse } from "next/server"
import { connectToDatabase, toObjectId } from "@/lib/db"
import { verifyToken } from "@/lib/auth"
import { emitToUser, emitToRestaurantOwner } from "@/lib/socket-server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  // Existing code...
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
    const collection = db.collection("reservations")

    // Check if reservation exists
    const reservation = await collection.findOne({ _id: toObjectId(id) })
    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 })
    }

    const body = await request.json()

    // Different update logic based on user type
    if (decoded.userType === "customer") {
      // Customers can only update their own reservations
      if (reservation.customerId !== decoded.userId) {
        return NextResponse.json({ error: "Not authorized to update this reservation" }, { status: 403 })
      }

      // Customers can only update if status is pending
      if (reservation.status !== "pending") {
        return NextResponse.json({ error: "Cannot modify a confirmed or cancelled reservation" }, { status: 400 })
      }

      const { date, time, guests, specialRequests } = body

      // Update reservation
      const updateData: any = {}
      if (date) updateData.date = new Date(date)
      if (time) updateData.time = time
      if (guests) updateData.guests = Number(guests)
      if (specialRequests !== undefined) updateData.specialRequests = specialRequests

      await collection.updateOne({ _id: toObjectId(id) }, { $set: updateData })

      // Get restaurant details
      const restaurantCollection = db.collection("restaurants")
      const restaurant = await restaurantCollection.findOne({ _id: toObjectId(reservation.restaurantId) })

      // Emit WebSocket event to restaurant owner
      if (restaurant) {
        emitToRestaurantOwner(restaurant.ownerId, "reservation_updated", {
          _id: id,
          ...updateData,
          status: reservation.status,
          restaurantId: reservation.restaurantId,
          restaurantName: restaurant.name,
        })
      }
    } else if (decoded.userType === "restaurant") {
      // Restaurant owners can only update reservations for their restaurants
      const restaurantCollection = db.collection("restaurants")
      const restaurant = await restaurantCollection.findOne({
        _id: toObjectId(reservation.restaurantId),
        ownerId: decoded.userId,
      })

      if (!restaurant) {
        return NextResponse.json({ error: "Not authorized to update this reservation" }, { status: 403 })
      }

      const { status } = body

      // Restaurant owners can only update status
      if (!status) {
        return NextResponse.json({ error: "Status is required" }, { status: 400 })
      }

      if (!["pending", "confirmed", "cancelled"].includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 })
      }

      await collection.updateOne({ _id: toObjectId(id) }, { $set: { status } })

      // Emit WebSocket event to customer
      emitToUser(reservation.customerId, "reservation_updated", {
        _id: id,
        status,
        restaurantId: reservation.restaurantId,
        restaurantName: restaurant.name,
        date: reservation.date,
        time: reservation.time,
      })
    }

    // Get updated reservation
    const updatedReservation = await collection.findOne({ _id: toObjectId(id) })

    return NextResponse.json({
      ...updatedReservation,
      _id: updatedReservation?._id.toString(),
    })
  } catch (error: any) {
    console.error("Error updating reservation:", error)
    return NextResponse.json({ error: error.message || "Failed to update reservation" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  // Existing code...
}

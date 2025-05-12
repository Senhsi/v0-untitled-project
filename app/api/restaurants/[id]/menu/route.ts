import { NextResponse } from "next/server"
import { connectToDatabase, toObjectId } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

// GET /api/restaurants/:id/menu - Get restaurant menu
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

    // Return menu
    return NextResponse.json(restaurant.menu || [])
  } catch (error: any) {
    console.error("Error fetching menu:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch menu" }, { status: 500 })
  }
}

// PUT /api/restaurants/:id/menu - Update entire menu structure
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
      return NextResponse.json({ error: "Not authorized to update this restaurant's menu" }, { status: 403 })
    }

    const menu = await request.json()

    // Validate menu structure
    if (!Array.isArray(menu)) {
      return NextResponse.json({ error: "Menu must be an array of categories" }, { status: 400 })
    }

    // Add timestamps to menu items
    const now = new Date()
    const menuWithTimestamps = menu.map((category: any) => ({
      ...category,
      items: Array.isArray(category.items)
        ? category.items.map((item: any) => ({
            ...item,
            updatedAt: now,
            createdAt: item.createdAt || now,
          }))
        : [],
    }))

    // Update menu
    await collection.updateOne({ _id: toObjectId(id) }, { $set: { menu: menuWithTimestamps } })

    return NextResponse.json({ success: true, menu: menuWithTimestamps })
  } catch (error: any) {
    console.error("Error updating menu:", error)
    return NextResponse.json({ error: error.message || "Failed to update menu" }, { status: 500 })
  }
}

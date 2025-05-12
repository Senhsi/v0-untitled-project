import { NextResponse } from "next/server"
import { connectToDatabase, toObjectId } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

// POST /api/restaurants/:id/menu/categories - Add a new category
export async function POST(request: Request, { params }: { params: { id: string } }) {
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

    const { name, description } = await request.json()

    // Validate input
    if (!name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 })
    }

    // Create category
    const newCategory = {
      _id: new toObjectId(),
      name,
      description: description || "",
      items: [],
      order: (restaurant.menu?.length || 0) + 1,
    }

    // Add category to menu
    const menu = Array.isArray(restaurant.menu) ? restaurant.menu : []

    await collection.updateOne({ _id: toObjectId(id) }, { $push: { menu: newCategory } })

    return NextResponse.json(newCategory, { status: 201 })
  } catch (error: any) {
    console.error("Error creating category:", error)
    return NextResponse.json({ error: error.message || "Failed to create category" }, { status: 500 })
  }
}

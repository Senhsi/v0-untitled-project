import { NextResponse } from "next/server"
import { connectToDatabase, toObjectId } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

// POST /api/restaurants/:id/menu/categories/:categoryId/items - Add a new menu item
export async function POST(request: Request, { params }: { params: { id: string; categoryId: string } }) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    const decoded = await verifyToken(authHeader)
    const { id, categoryId } = params

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

    // Check if category exists
    const category = restaurant.menu?.find((c: any) => c._id.toString() === categoryId)
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    const {
      name,
      description,
      price,
      imageUrl,
      isAvailable = true,
      allergens = [],
      isVegetarian = false,
      isVegan = false,
      isGlutenFree = false,
    } = await request.json()

    // Validate input
    if (!name || price === undefined) {
      return NextResponse.json({ error: "Name and price are required" }, { status: 400 })
    }

    // Create menu item
    const newItem = {
      _id: new toObjectId(),
      name,
      description: description || "",
      price: Number(price),
      imageUrl: imageUrl || "",
      isAvailable,
      category: categoryId,
      allergens,
      isVegetarian,
      isVegan,
      isGlutenFree,
      createdAt: new Date(),
    }

    // Add item to category
    await collection.updateOne(
      { _id: toObjectId(id), "menu._id": toObjectId(categoryId) },
      { $push: { "menu.$.items": newItem } },
    )

    return NextResponse.json(newItem, { status: 201 })
  } catch (error: any) {
    console.error("Error creating menu item:", error)
    return NextResponse.json({ error: error.message || "Failed to create menu item" }, { status: 500 })
  }
}

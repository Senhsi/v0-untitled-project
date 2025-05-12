import { NextResponse } from "next/server"
import { connectToDatabase, toObjectId } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

// PUT /api/restaurants/:id/menu/categories/:categoryId - Update a category
export async function PUT(request: Request, { params }: { params: { id: string; categoryId: string } }) {
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

    const { name, description, order } = await request.json()

    // Validate input
    if (!name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 })
    }

    // Update category
    await collection.updateOne(
      {
        _id: toObjectId(id),
        "menu._id": toObjectId(categoryId),
      },
      {
        $set: {
          "menu.$.name": name,
          "menu.$.description": description || "",
          "menu.$.order": order || 0,
        },
      },
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error updating category:", error)
    return NextResponse.json({ error: error.message || "Failed to update category" }, { status: 500 })
  }
}

// DELETE /api/restaurants/:id/menu/categories/:categoryId - Delete a category
export async function DELETE(request: Request, { params }: { params: { id: string; categoryId: string } }) {
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

    // Delete category
    await collection.updateOne({ _id: toObjectId(id) }, { $pull: { menu: { _id: toObjectId(categoryId) } } })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting category:", error)
    return NextResponse.json({ error: error.message || "Failed to delete category" }, { status: 500 })
  }
}

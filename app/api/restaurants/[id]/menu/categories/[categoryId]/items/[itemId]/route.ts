import { NextResponse } from "next/server"
import { connectToDatabase, toObjectId } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

// PUT /api/restaurants/:id/menu/categories/:categoryId/items/:itemId - Update a menu item
export async function PUT(
  request: Request,
  { params }: { params: { id: string; categoryId: string; itemId: string } },
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    const decoded = await verifyToken(authHeader)
    const { id, categoryId, itemId } = params

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

    const { name, description, price, imageUrl, isAvailable, allergens, isVegetarian, isVegan, isGlutenFree } =
      await request.json()

    // Validate input
    if (!name || price === undefined) {
      return NextResponse.json({ error: "Name and price are required" }, { status: 400 })
    }

    // Check if the item exists and get its original values to maintain createdAt
    const category = restaurant.menu?.find((c: any) => c._id.toString() === categoryId)
    const originalItem = category?.items?.find((i: any) => i._id.toString() === itemId)

    if (!originalItem) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404 })
    }

    // Update item
    const updatedItem = {
      _id: toObjectId(itemId),
      name,
      description: description || "",
      price: Number(price),
      imageUrl: imageUrl || "",
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      category: categoryId,
      allergens: allergens || [],
      isVegetarian: isVegetarian !== undefined ? isVegetarian : false,
      isVegan: isVegan !== undefined ? isVegan : false,
      isGlutenFree: isGlutenFree !== undefined ? isGlutenFree : false,
      createdAt: originalItem.createdAt,
      updatedAt: new Date(),
    }

    // Update the item
    await collection.updateOne(
      {
        _id: toObjectId(id),
        "menu._id": toObjectId(categoryId),
        "menu.items._id": toObjectId(itemId),
      },
      {
        $set: { "menu.$[category].items.$[item]": updatedItem },
      },
      {
        arrayFilters: [{ "category._id": toObjectId(categoryId) }, { "item._id": toObjectId(itemId) }],
      },
    )

    return NextResponse.json(updatedItem)
  } catch (error: any) {
    console.error("Error updating menu item:", error)
    return NextResponse.json({ error: error.message || "Failed to update menu item" }, { status: 500 })
  }
}

// DELETE /api/restaurants/:id/menu/categories/:categoryId/items/:itemId - Delete a menu item
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; categoryId: string; itemId: string } },
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    const decoded = await verifyToken(authHeader)
    const { id, categoryId, itemId } = params

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

    // Delete the item
    await collection.updateOne(
      { _id: toObjectId(id), "menu._id": toObjectId(categoryId) },
      { $pull: { "menu.$.items": { _id: toObjectId(itemId) } } },
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting menu item:", error)
    return NextResponse.json({ error: error.message || "Failed to delete menu item" }, { status: 500 })
  }
}

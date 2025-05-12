import { NextResponse } from "next/server"
import { connectToDatabase, toObjectId } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    const decoded = await verifyToken(authHeader)
    if (decoded.userType !== "customer") {
      return NextResponse.json({ error: "Only customers can remove favorites" }, { status: 403 })
    }

    const id = params.id

    const { db } = await connectToDatabase()
    const collection = db.collection("favorites")

    // Check if favorite exists and belongs to this user
    const favorite = await collection.findOne({
      _id: toObjectId(id),
      customerId: decoded.userId,
    })

    if (!favorite) {
      return NextResponse.json({ error: "Favorite not found or not owned by you" }, { status: 404 })
    }

    // Remove from favorites
    await collection.deleteOne({ _id: toObjectId(id) })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error removing from favorites:", error)
    return NextResponse.json({ error: error.message || "Failed to remove from favorites" }, { status: 500 })
  }
}

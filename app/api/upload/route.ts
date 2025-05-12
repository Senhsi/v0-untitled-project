import { NextResponse } from "next/server"
import { writeFile } from "fs/promises"
import { join } from "path"
import { verifyToken } from "@/lib/auth"
import { validateFile, generateUniqueFilename } from "@/lib/upload-utils"

export async function POST(request: Request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    const decoded = await verifyToken(authHeader)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Parse the FormData
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 })
    }

    // Validate file type and size
    const validation = validateFile(file)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Generate a unique filename
    const uniqueFilename = generateUniqueFilename(file)

    // Create public/uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads")

    // Convert the file to a Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Save the file
    const filePath = join(uploadsDir, uniqueFilename)
    await writeFile(filePath, buffer)

    // Return the URL to the saved file
    const fileUrl = `/uploads/${uniqueFilename}`

    return NextResponse.json({
      success: true,
      url: fileUrl,
    })
  } catch (error: any) {
    console.error("Error uploading file:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to upload file",
      },
      { status: 500 },
    )
  }
}

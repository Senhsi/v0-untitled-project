import { v4 as uuidv4 } from "uuid"

// Maximum file size (5MB)
export const MAX_FILE_SIZE = 5 * 1024 * 1024

// Allowed image formats
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"]

export type UploadResult = {
  success: boolean
  url?: string
  error?: string
}

// Function to validate file before upload
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds the maximum allowed size (5MB)`,
    }
  }

  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "File type not supported. Please upload a JPEG, JPG, PNG, or WebP image",
    }
  }

  return { valid: true }
}

// Generate unique filename to prevent collisions
export function generateUniqueFilename(file: File): string {
  const extension = file.name.split(".").pop()
  return `${uuidv4()}.${extension}`
}

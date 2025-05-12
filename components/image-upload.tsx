"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { X, ImageIcon } from "lucide-react"
import { fetchWithAuth } from "@/lib/api-utils"
import { useToast } from "@/components/ui/use-toast"
import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE } from "@/lib/upload-utils"

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  className?: string
}

export function ImageUpload({ value, onChange, className }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(value || null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Max file size is 5MB",
        variant: "destructive",
      })
      return
    }

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only JPG, PNG, and WebP images are allowed",
        variant: "destructive",
      })
      return
    }

    // Create a preview
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)

    // Upload the file
    try {
      setIsUploading(true)

      const formData = new FormData()
      formData.append("file", file)

      const response = await fetchWithAuth("/api/upload", {
        method: "POST",
        body: formData,
        headers: {
          // Don't set Content-Type here, it will be automatically set by the browser
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to upload image")
      }

      const data = await response.json()
      onChange(data.url)

      toast({
        title: "Image uploaded",
        description: "Your image has been uploaded successfully",
      })
    } catch (error: any) {
      console.error("Upload error:", error)
      toast({
        title: "Upload failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPreview(null)
    onChange("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div
      onClick={handleClick}
      className={`relative flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed p-6 transition-all hover:bg-muted/50 ${className}`}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleChange}
        accept={ALLOWED_IMAGE_TYPES.join(",")}
        className="hidden"
      />

      {preview ? (
        <div className="relative aspect-square w-full overflow-hidden rounded-md">
          <img src={preview || "/placeholder.svg"} alt="Preview" className="h-full w-full object-cover" />
          <Button
            variant="destructive"
            size="icon"
            className="absolute right-2 top-2"
            onClick={handleRemove}
            disabled={isUploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className="rounded-full bg-muted p-2">
            <ImageIcon className="h-6 w-6" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">Click to upload an image</p>
            <p className="text-xs text-muted-foreground">JPG, PNG, WebP (max 5MB)</p>
          </div>
        </div>
      )}

      {isUploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  )
}

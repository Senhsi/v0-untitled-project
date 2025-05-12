"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Star } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { ImageUpload } from "@/components/image-upload"
import { postWithAuth } from "@/lib/api-utils"

interface ReviewFormProps {
  restaurantId: string
  onSuccess?: () => void
}

export function ReviewForm({ restaurantId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState("")
  const [images, setImages] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleRatingClick = (value: number) => {
    setRating(value)
  }

  const handleImageUpload = (url: string) => {
    setImages((prev) => [...prev, url])
  }

  const handleImageRemove = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating from 1 to 5 stars",
        variant: "destructive",
      })
      return
    }

    if (!comment.trim()) {
      toast({
        title: "Comment Required",
        description: "Please write a review comment",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      await postWithAuth("/api/reviews", {
        restaurantId,
        rating,
        comment,
        images,
      })

      toast({
        title: "Review Submitted",
        description: "Your review has been submitted and will be moderated soon",
      })

      // Reset form
      setRating(0)
      setComment("")
      setImages([])

      // Call onSuccess if provided
      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      console.error("Error submitting review:", error)
      toast({
        title: "Submission Failed",
        description: error.message || "Could not submit your review",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="rating" className="block mb-2">
          Rating
        </Label>
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              className="p-1"
              onClick={() => handleRatingClick(value)}
              onMouseEnter={() => setHoveredRating(value)}
              onMouseLeave={() => setHoveredRating(0)}
            >
              <Star
                className={`h-8 w-8 ${
                  value <= (hoveredRating || rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                }`}
              />
            </button>
          ))}
          <span className="ml-2 text-muted-foreground">
            {rating > 0 ? `${rating} star${rating !== 1 ? "s" : ""}` : "Select a rating"}
          </span>
        </div>
      </div>

      <div>
        <Label htmlFor="comment" className="block mb-2">
          Your Review
        </Label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          placeholder="Share your experience at this restaurant..."
          className="resize-none"
        />
      </div>

      <div>
        <Label className="block mb-2">Add Photos (Optional)</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative">
              <img
                src={image || "/placeholder.svg"}
                alt={`Review photo ${index + 1}`}
                className="h-40 w-full object-cover rounded-md"
              />
              <Button
                type="button"
                size="sm"
                variant="destructive"
                className="absolute top-2 right-2"
                onClick={() => handleImageRemove(index)}
              >
                X
              </Button>
            </div>
          ))}
          {images.length < 3 && <ImageUpload value="" onChange={handleImageUpload} className="h-40" />}
        </div>
        <p className="text-xs text-muted-foreground mt-1">You can upload up to 3 images</p>
      </div>

      <div className="pt-2">
        <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
          {isSubmitting ? "Submitting..." : "Submit Review"}
        </Button>
        <p className="text-xs text-muted-foreground mt-2">Your review will be moderated before appearing publicly</p>
      </div>
    </form>
  )
}

"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/context/auth-context"
import { postWithAuth } from "@/lib/api-utils"
import { Breadcrumb } from "@/components/breadcrumb"

export default function AddCategoryPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Find restaurant ID (assuming user has only one restaurant)
      const restaurantsResponse = await fetch("/api/restaurants")
      const restaurants = await restaurantsResponse.json()
      const ownedRestaurant = restaurants.find((r: any) => r.ownerId === user?._id)

      if (!ownedRestaurant) {
        toast({
          title: "Error",
          description: "No restaurant found for your account",
          variant: "destructive",
        })
        return
      }

      await postWithAuth(`/api/restaurants/${ownedRestaurant._id}/menu/categories`, formData)

      toast({
        title: "Success",
        description: "Category added successfully",
      })

      router.push("/dashboard/menu")
    } catch (error) {
      console.error("Error adding category:", error)
      toast({
        title: "Error",
        description: "Failed to add category",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <Breadcrumb />
      <h1 className="text-3xl font-bold mb-6">Add Menu Category</h1>

      <Card className="max-w-xl mx-auto">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Create New Category</CardTitle>
            <CardDescription>Add a new section to your menu to organize your items</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Appetizers, Main Courses, Desserts"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Briefly describe this category"
                rows={3}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Category"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

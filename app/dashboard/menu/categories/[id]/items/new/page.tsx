"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ImageUpload } from "@/components/image-upload"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/context/auth-context"
import { postWithAuth } from "@/lib/api-utils"

export default function AddMenuItemPage() {
  const params = useParams()
  const categoryId = params.id as string
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [restaurantId, setRestaurantId] = useState<string>("")
  const [categoryName, setCategoryName] = useState<string>("")
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    isAvailable: true,
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    allergens: "",
  })

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Find restaurant ID
        const restaurantsResponse = await fetch("/api/restaurants")
        const restaurants = await restaurantsResponse.json()
        const ownedRestaurant = restaurants.find((r: any) => r.ownerId === user?._id)

        if (!ownedRestaurant) {
          toast({
            title: "Error",
            description: "No restaurant found for your account",
            variant: "destructive",
          })
          router.push("/dashboard/menu")
          return
        }

        setRestaurantId(ownedRestaurant._id)

        // Find the category
        const category = ownedRestaurant.menu?.find((c: any) => c._id === categoryId)

        if (!category) {
          toast({
            title: "Error",
            description: "Category not found",
            variant: "destructive",
          })
          router.push("/dashboard/menu")
          return
        }

        setCategoryName(category.name)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchData()
    }
  }, [user, categoryId, router, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleImageChange = (url: string) => {
    setFormData((prev) => ({ ...prev, imageUrl: url }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Process allergens from comma-separated string to array
      const allergens = formData.allergens
        ? formData.allergens
            .split(",")
            .map((a) => a.trim())
            .filter((a) => a)
        : []

      const data = {
        ...formData,
        allergens,
        price: Number.parseFloat(formData.price),
      }

      await postWithAuth(`/api/restaurants/${restaurantId}/menu/categories/${categoryId}/items`, data)

      toast({
        title: "Success",
        description: "Menu item added successfully",
      })

      router.push("/dashboard/menu")
    } catch (error) {
      console.error("Error adding menu item:", error)
      toast({
        title: "Error",
        description: "Failed to add menu item",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Add Menu Item</h1>
      <p className="text-muted-foreground mb-6">
        Adding item to: <span className="font-medium">{categoryName}</span>
      </p>

      <Card className="max-w-xl mx-auto">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Create New Menu Item</CardTitle>
            <CardDescription>Add details about this dish to display on your menu</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Item Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Margherita Pizza"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe this dish, including ingredients and preparation"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">$</div>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={handleChange}
                  className="pl-7"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Item Image</Label>
              <ImageUpload value={formData.imageUrl} onChange={handleImageChange} className="h-40" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="allergens">Allergens</Label>
              <Input
                id="allergens"
                name="allergens"
                value={formData.allergens}
                onChange={handleChange}
                placeholder="e.g., nuts, dairy, gluten (comma separated)"
              />
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isAvailable">Available</Label>
                  <p className="text-sm text-muted-foreground">Is this item currently available?</p>
                </div>
                <Switch
                  id="isAvailable"
                  checked={formData.isAvailable}
                  onCheckedChange={(checked) => handleSwitchChange("isAvailable", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isVegetarian">Vegetarian</Label>
                  <p className="text-sm text-muted-foreground">Is this item vegetarian?</p>
                </div>
                <Switch
                  id="isVegetarian"
                  checked={formData.isVegetarian}
                  onCheckedChange={(checked) => handleSwitchChange("isVegetarian", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isVegan">Vegan</Label>
                  <p className="text-sm text-muted-foreground">Is this item vegan?</p>
                </div>
                <Switch
                  id="isVegan"
                  checked={formData.isVegan}
                  onCheckedChange={(checked) => handleSwitchChange("isVegan", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isGlutenFree">Gluten Free</Label>
                  <p className="text-sm text-muted-foreground">Is this item gluten free?</p>
                </div>
                <Switch
                  id="isGlutenFree"
                  checked={formData.isGlutenFree}
                  onCheckedChange={(checked) => handleSwitchChange("isGlutenFree", checked)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Item"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

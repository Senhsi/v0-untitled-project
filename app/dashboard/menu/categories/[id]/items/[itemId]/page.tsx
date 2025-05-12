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
import { Trash } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/context/auth-context"
import { putWithAuth, deleteWithAuth } from "@/lib/api-utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function EditMenuItemPage() {
  const params = useParams()
  const categoryId = params.id as string
  const itemId = params.itemId as string
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
        // Find restaurant and menu item
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

        // Find the menu item
        const menuItem = category.items?.find((i: any) => i._id === itemId)

        if (!menuItem) {
          toast({
            title: "Error",
            description: "Menu item not found",
            variant: "destructive",
          })
          router.push("/dashboard/menu")
          return
        }

        // Format allergens from array to string
        const allergensString = menuItem.allergens?.join(", ") || ""

        setFormData({
          name: menuItem.name,
          description: menuItem.description || "",
          price: menuItem.price.toString(),
          imageUrl: menuItem.imageUrl || "",
          isAvailable: menuItem.isAvailable,
          isVegetarian: menuItem.isVegetarian || false,
          isVegan: menuItem.isVegan || false,
          isGlutenFree: menuItem.isGlutenFree || false,
          allergens: allergensString,
        })
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load menu item data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchData()
    }
  }, [user, categoryId, itemId, router, toast])

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

      await putWithAuth(`/api/restaurants/${restaurantId}/menu/categories/${categoryId}/items/${itemId}`, data)

      toast({
        title: "Success",
        description: "Menu item updated successfully",
      })

      router.push("/dashboard/menu")
    } catch (error) {
      console.error("Error updating menu item:", error)
      toast({
        title: "Error",
        description: "Failed to update menu item",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setIsSubmitting(true)

    try {
      await deleteWithAuth(`/api/restaurants/${restaurantId}/menu/categories/${categoryId}/items/${itemId}`)

      toast({
        title: "Success",
        description: "Menu item deleted successfully",
      })

      router.push("/dashboard/menu")
    } catch (error) {
      console.error("Error deleting menu item:", error)
      toast({
        title: "Error",
        description: "Failed to delete menu item",
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
      <h1 className="text-3xl font-bold mb-6">Edit Menu Item</h1>
      <p className="text-muted-foreground mb-6">
        Category: <span className="font-medium">{categoryName}</span>
      </p>

      <Card className="max-w-xl mx-auto">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Edit Menu Item</CardTitle>
            <CardDescription>Update this dish's details</CardDescription>
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
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" type="button" disabled={isSubmitting}>
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this menu item. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

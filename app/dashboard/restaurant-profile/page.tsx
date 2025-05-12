"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { getWithAuth, putWithAuth, postWithAuth } from "@/lib/api-utils"
import type { Restaurant } from "@/lib/db"

export default function RestaurantProfilePage() {
  const { user, token } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [restaurant, setRestaurant] = useState<Partial<Restaurant>>({
    name: "",
    description: "",
    cuisine: "",
    location: "",
    phone: "",
    hours: "",
    priceRange: "medium",
    isLgbtqFriendly: false,
    isSmokingAllowed: false,
    hasOutdoorSeating: false,
    isWheelchairAccessible: false,
    hasVeganOptions: false,
    hasVegetarianOptions: false,
  })

  useEffect(() => {
    // Redirect if not logged in or not a restaurant owner
    if (!user || !token) {
      router.push("/login")
      return
    }

    if (user.userType !== "restaurant") {
      router.push("/dashboard")
      return
    }

    // Fetch restaurant profile
    const fetchRestaurant = async () => {
      setIsLoading(true)
      try {
        // First check if the restaurant owner already has a restaurant
        const restaurants = await getWithAuth("/api/restaurants")
        const ownedRestaurant = restaurants.find((r: any) => r.ownerId === user._id)

        if (ownedRestaurant) {
          setRestaurant(ownedRestaurant)
        }
      } catch (error) {
        console.error("Error fetching restaurant:", error)
        toast({
          title: "Error",
          description: "Failed to load restaurant profile",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchRestaurant()
  }, [user, token, router, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setRestaurant((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setRestaurant((prev) => ({ ...prev, [name]: checked }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setRestaurant((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      let response

      if (restaurant._id) {
        // Update existing restaurant
        response = await putWithAuth(`/api/restaurants/${restaurant._id}`, restaurant)
      } else {
        // Create new restaurant
        response = await postWithAuth("/api/restaurants", restaurant)
      }

      setRestaurant(response)

      toast({
        title: "Success",
        description: restaurant._id ? "Restaurant profile updated" : "Restaurant profile created",
      })
    } catch (error) {
      console.error("Error saving restaurant:", error)
      toast({
        title: "Error",
        description: "Failed to save restaurant profile",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
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
      <h1 className="text-3xl font-bold mb-6">Restaurant Profile</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Provide the basic details about your restaurant</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Restaurant Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={restaurant.name}
                  onChange={handleChange}
                  placeholder="Enter restaurant name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={restaurant.description}
                  onChange={handleChange}
                  placeholder="Describe your restaurant"
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cuisine">Cuisine</Label>
                <Input
                  id="cuisine"
                  name="cuisine"
                  value={restaurant.cuisine}
                  onChange={handleChange}
                  placeholder="e.g., Italian, Japanese, etc."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  value={restaurant.location}
                  onChange={handleChange}
                  placeholder="Address"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={restaurant.phone}
                  onChange={handleChange}
                  placeholder="Phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hours">Business Hours</Label>
                <Input
                  id="hours"
                  name="hours"
                  value={restaurant.hours}
                  onChange={handleChange}
                  placeholder="e.g., Mon-Fri: 9am-10pm, Sat-Sun: 10am-11pm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceRange">Price Range</Label>
                <Select
                  value={restaurant.priceRange as string}
                  onValueChange={(value) => handleSelectChange("priceRange", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select price range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">$ (Budget-friendly)</SelectItem>
                    <SelectItem value="medium">$$ (Moderate)</SelectItem>
                    <SelectItem value="high">$$$ (Expensive)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Restaurant Features</CardTitle>
              <CardDescription>Help customers find your restaurant based on these features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isLgbtqFriendly">LGBTQ+ Friendly</Label>
                  <p className="text-sm text-muted-foreground">Is your restaurant LGBTQ+ friendly?</p>
                </div>
                <Switch
                  id="isLgbtqFriendly"
                  checked={restaurant.isLgbtqFriendly}
                  onCheckedChange={(checked) => handleSwitchChange("isLgbtqFriendly", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isSmokingAllowed">Smoking Allowed</Label>
                  <p className="text-sm text-muted-foreground">Is smoking allowed in your restaurant?</p>
                </div>
                <Switch
                  id="isSmokingAllowed"
                  checked={restaurant.isSmokingAllowed}
                  onCheckedChange={(checked) => handleSwitchChange("isSmokingAllowed", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="hasOutdoorSeating">Outdoor Seating</Label>
                  <p className="text-sm text-muted-foreground">Does your restaurant offer outdoor seating?</p>
                </div>
                <Switch
                  id="hasOutdoorSeating"
                  checked={restaurant.hasOutdoorSeating}
                  onCheckedChange={(checked) => handleSwitchChange("hasOutdoorSeating", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isWheelchairAccessible">Wheelchair Accessible</Label>
                  <p className="text-sm text-muted-foreground">Is your restaurant wheelchair accessible?</p>
                </div>
                <Switch
                  id="isWheelchairAccessible"
                  checked={restaurant.isWheelchairAccessible}
                  onCheckedChange={(checked) => handleSwitchChange("isWheelchairAccessible", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="hasVeganOptions">Vegan Options</Label>
                  <p className="text-sm text-muted-foreground">Does your restaurant offer vegan options?</p>
                </div>
                <Switch
                  id="hasVeganOptions"
                  checked={restaurant.hasVeganOptions}
                  onCheckedChange={(checked) => handleSwitchChange("hasVeganOptions", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="hasVegetarianOptions">Vegetarian Options</Label>
                  <p className="text-sm text-muted-foreground">Does your restaurant offer vegetarian options?</p>
                </div>
                <Switch
                  id="hasVegetarianOptions"
                  checked={restaurant.hasVegetarianOptions}
                  onCheckedChange={(checked) => handleSwitchChange("hasVegetarianOptions", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <Button type="submit" size="lg" disabled={isSaving}>
            {isSaving ? "Saving..." : restaurant._id ? "Update Profile" : "Create Profile"}
          </Button>
        </div>
      </form>
    </div>
  )
}

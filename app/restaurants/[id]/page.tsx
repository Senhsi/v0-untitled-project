"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { MapPin, Phone, Clock, Star, Calendar, Heart, Check, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/context/auth-context"
import { getWithAuth, postWithAuth } from "@/lib/api-utils"
import { ReviewList } from "@/components/review-list"
import { ReviewForm } from "@/components/review-form"
import { BackButton } from "@/components/back-button"
import type { Restaurant } from "@/lib/db"

export default function RestaurantPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = params.id as string
  const { toast } = useToast()
  const { user, token } = useAuth()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isAddingToFavorites, setIsAddingToFavorites] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const reservationRef = useRef<HTMLDivElement>(null)

  // Get the active tab from URL or default to "menu"
  const defaultTab = searchParams.get("tab") || "menu"
  const [activeTab, setActiveTab] = useState(defaultTab)

  // Scroll to reservation section if hash is present
  useEffect(() => {
    if (window.location.hash === "#reservation" && reservationRef.current) {
      reservationRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [restaurant])

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    router.push(`/restaurants/${id}?tab=${value}`, { scroll: false })
  }

  useEffect(() => {
    const fetchRestaurant = async () => {
      setIsLoading(true)
      try {
        // Fetch restaurant details
        const response = await fetch(`/api/restaurants/${id}`)
        if (!response.ok) {
          throw new Error("Failed to fetch restaurant")
        }
        const data = await response.json()
        setRestaurant(data)

        // Check if restaurant is in user's favorites
        if (user && token && user.userType === "customer") {
          try {
            const favorites = await getWithAuth("/api/favorites")
            setIsFavorite(favorites.some((fav: any) => fav.restaurantId === id))
          } catch (error) {
            console.error("Error checking favorites:", error)
          }
        }
      } catch (error) {
        console.error("Error fetching restaurant:", error)
        toast({
          title: "Error",
          description: "Failed to load restaurant details",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchRestaurant()
    }
  }, [id, user, token, toast])

  const handleAddToFavorites = async () => {
    if (!user || !token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to add restaurants to favorites",
        variant: "destructive",
      })
      return
    }

    setIsAddingToFavorites(true)
    try {
      await postWithAuth("/api/favorites", { restaurantId: id })
      setIsFavorite(true)
      toast({
        title: "Success",
        description: "Restaurant added to favorites",
      })
    } catch (error) {
      console.error("Error adding to favorites:", error)
      toast({
        title: "Error",
        description: "Failed to add restaurant to favorites",
        variant: "destructive",
      })
    } finally {
      setIsAddingToFavorites(false)
    }
  }

  const handleReviewSubmit = () => {
    setShowReviewForm(false)
    // Refresh the page to show the new review
    window.location.reload()
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="container py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Restaurant not found</h1>
        <p className="text-muted-foreground mb-6">
          The restaurant you're looking for doesn't exist or has been removed.
        </p>
        <Button asChild>
          <a href="/restaurants">Browse Restaurants</a>
        </Button>
      </div>
    )
  }

  // Helper function to render feature badges
  const renderFeatureBadge = (isActive: boolean | undefined, label: string) => {
    if (isActive === undefined) return null

    return (
      <Badge variant={isActive ? "default" : "outline"} className="flex items-center gap-1">
        {isActive ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
        {label}
      </Badge>
    )
  }

  // Check if the current user is the restaurant owner
  const isOwner = user && user.userType === "restaurant" && restaurant.ownerId === user._id

  return (
    <div className="container py-8">
      <BackButton href="/restaurants" label="Back to Restaurants" />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Restaurant Info */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <div className="aspect-video w-full overflow-hidden rounded-lg">
              <img
                src={restaurant.images?.[0] || "/placeholder.svg?height=400&width=800"}
                alt={restaurant.name}
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">{restaurant.name}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {restaurant.location}
              </div>
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-1" />
                {restaurant.phone || "Not provided"}
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {restaurant.hours || "Not provided"}
              </div>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center">
                <Star className="h-5 w-5 fill-primary text-primary mr-1" />
                <span className="font-medium">{restaurant.rating?.toFixed(1) || "New"}</span>
                <span className="text-muted-foreground ml-1">
                  ({restaurant.rating ? "Based on customer reviews" : "No reviews yet"})
                </span>
              </div>
              <div className="text-muted-foreground">{restaurant.cuisine}</div>
              <div className="text-muted-foreground">
                {restaurant.priceRange === "low" && "$"}
                {restaurant.priceRange === "medium" && "$$"}
                {restaurant.priceRange === "high" && "$$$"}
              </div>
            </div>
            <p className="text-muted-foreground mb-4">{restaurant.description}</p>

            {/* Restaurant Features */}
            <div className="flex flex-wrap gap-2 mb-4">
              {renderFeatureBadge(restaurant.isLgbtqFriendly, "LGBTQ+ Friendly")}
              {renderFeatureBadge(restaurant.isSmokingAllowed, "Smoking Allowed")}
              {renderFeatureBadge(restaurant.hasOutdoorSeating, "Outdoor Seating")}
              {renderFeatureBadge(restaurant.isWheelchairAccessible, "Wheelchair Accessible")}
              {renderFeatureBadge(restaurant.hasVeganOptions, "Vegan Options")}
              {renderFeatureBadge(restaurant.hasVegetarianOptions, "Vegetarian Options")}
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="menu">Menu</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="photos">Photos</TabsTrigger>
            </TabsList>
            <TabsContent value="menu" className="pt-4">
              {restaurant.menu && restaurant.menu.length > 0 ? (
                restaurant.menu.map((category, index) => (
                  <div key={index} className="mb-6">
                    <h3 className="text-xl font-semibold mb-3">{category.name}</h3>
                    <div className="space-y-4">
                      {category.items &&
                        category.items.map((item, itemIndex) => (
                          <div key={itemIndex} className="flex justify-between">
                            <div className="flex gap-4">
                              {item.imageUrl && (
                                <div className="h-16 w-16 overflow-hidden rounded-md">
                                  <img
                                    src={item.imageUrl || "/placeholder.svg"}
                                    alt={item.name}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              )}
                              <div>
                                <h4 className="font-medium flex items-center">
                                  {item.name}
                                  {item.isVegetarian && (
                                    <Badge variant="outline" className="ml-2 text-green-600 border-green-600">
                                      V
                                    </Badge>
                                  )}
                                  {item.isVegan && (
                                    <Badge variant="outline" className="ml-2 text-green-600 border-green-600">
                                      VG
                                    </Badge>
                                  )}
                                  {item.isGlutenFree && (
                                    <Badge variant="outline" className="ml-2 text-amber-600 border-amber-600">
                                      GF
                                    </Badge>
                                  )}
                                </h4>
                                <p className="text-sm text-muted-foreground">{item.description}</p>
                                {item.allergens && item.allergens.length > 0 && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Allergens: {item.allergens.join(", ")}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="font-medium">${item.price.toFixed(2)}</div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Menu not available</p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="reviews" className="pt-4">
              {user && user.userType === "customer" && !showReviewForm && (
                <div className="mb-6">
                  <Button onClick={() => setShowReviewForm(true)}>Write a Review</Button>
                </div>
              )}

              {showReviewForm && (
                <Card className="mb-6">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-4">Write a Review</h3>
                    <ReviewForm restaurantId={id} onSuccess={handleReviewSubmit} />
                  </CardContent>
                </Card>
              )}

              <ReviewList restaurantId={id} isOwner={isOwner} />
            </TabsContent>
            <TabsContent value="photos" className="pt-4">
              {restaurant.images && restaurant.images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {restaurant.images.map((image, i) => (
                    <div key={i} className="aspect-square overflow-hidden rounded-md">
                      <img
                        src={image || "/placeholder.svg"}
                        alt={`${restaurant.name} photo ${i + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No photos available</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Reservation Card */}
        <div>
          <Card className="sticky top-20" ref={reservationRef}>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Make a Reservation</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="date"
                      className="w-full rounded-md border border-input bg-background px-9 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Time</label>
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <option value="">Select a time</option>
                    <option value="17:00">5:00 PM</option>
                    <option value="17:30">5:30 PM</option>
                    <option value="18:00">6:00 PM</option>
                    <option value="18:30">6:30 PM</option>
                    <option value="19:00">7:00 PM</option>
                    <option value="19:30">7:30 PM</option>
                    <option value="20:00">8:00 PM</option>
                    <option value="20:30">8:30 PM</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Party Size</label>
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <option value="1">1 person</option>
                    <option value="2">2 people</option>
                    <option value="3">3 people</option>
                    <option value="4">4 people</option>
                    <option value="5">5 people</option>
                    <option value="6">6 people</option>
                    <option value="7">7 people</option>
                    <option value="8">8 people</option>
                  </select>
                </div>
                <Button className="w-full">Book Now</Button>
                {user && token && user.userType === "customer" && (
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-center"
                    onClick={handleAddToFavorites}
                    disabled={isFavorite || isAddingToFavorites}
                  >
                    <Heart className={`mr-2 h-4 w-4 ${isFavorite ? "fill-primary" : ""}`} />
                    {isFavorite ? "Added to Favorites" : isAddingToFavorites ? "Adding..." : "Add to Favorites"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

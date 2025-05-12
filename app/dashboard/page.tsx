"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, Users, Star, PlusCircle, ImageIcon } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { getWithAuth } from "@/lib/api-utils"

export default function DashboardPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [customerReservations, setCustomerReservations] = useState([])
  const [restaurantReservations, setRestaurantReservations] = useState([])
  const [favoriteRestaurants, setFavoriteRestaurants] = useState([])
  const [restaurantReviews, setRestaurantReviews] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [restaurant, setRestaurant] = useState(null) // Added restaurant state

  useEffect(() => {
    // Fetch data based on user type
    const fetchData = async () => {
      setIsLoading(true)
      try {
        if (user?.userType === "customer") {
          // Fetch customer reservations
          const reservationsData = await getWithAuth("/api/reservations")
          setCustomerReservations(reservationsData)

          // Fetch favorite restaurants
          const favoritesData = await getWithAuth("/api/favorites")
          setFavoriteRestaurants(favoritesData)
        } else if (user?.userType === "restaurant") {
          // Fetch restaurant reservations
          const reservationsData = await getWithAuth("/api/reservations")
          setRestaurantReservations(reservationsData)

          // Fetch restaurant reviews
          const reviewsData = await getWithAuth(`/api/reviews?restaurantId=${user._id}`)
          setRestaurantReviews(reviewsData)

          // Fetch restaurant data
          const restaurantData = await getWithAuth(`/api/restaurants/${user._id}`)
          setRestaurant(restaurantData)
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchData()
    }
  }, [user, toast])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {user?.userType === "customer" ? "Customer Dashboard" : "Restaurant Dashboard"}
        </h1>
        <p className="text-muted-foreground">
          {user?.userType === "customer"
            ? "Manage your reservations, favorites, and reviews"
            : "Manage your restaurant profile, reservations, and reviews"}
        </p>
      </div>

      {user?.userType === "customer" ? (
        <Tabs defaultValue="reservations">
          <TabsList className="mb-4">
            <TabsTrigger value="reservations">My Reservations</TabsTrigger>
            <TabsTrigger value="favorites">Favorite Restaurants</TabsTrigger>
          </TabsList>
          <TabsContent value="reservations">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {customerReservations.length > 0 ? (
                customerReservations.map((reservation: any) => (
                  <Card key={reservation._id}>
                    <CardHeader className="pb-2">
                      <CardTitle>{reservation.restaurantName}</CardTitle>
                      <CardDescription>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            reservation.status === "confirmed"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                              : reservation.status === "cancelled"
                                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                          }`}
                        >
                          {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>{new Date(reservation.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>{reservation.time}</span>
                        </div>
                        <div className="flex items-center">
                          <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>
                            {reservation.guests} {reservation.guests === 1 ? "guest" : "guests"}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          disabled={reservation.status !== "pending"}
                        >
                          Modify
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex-1"
                          disabled={reservation.status === "cancelled"}
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-muted-foreground mb-4">You don't have any reservations yet</p>
                  <Link href="/restaurants">
                    <Button>Find Restaurants</Button>
                  </Link>
                </div>
              )}
              <Card className="flex flex-col items-center justify-center p-6">
                <div className="mb-4 rounded-full bg-primary/10 p-3">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-medium">Book a Table</h3>
                <p className="mb-4 text-center text-sm text-muted-foreground">
                  Find and book your next dining experience
                </p>
                <Link href="/restaurants">
                  <Button>Find Restaurants</Button>
                </Link>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="favorites">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {favoriteRestaurants.length > 0 ? (
                favoriteRestaurants.map((favorite: any) => (
                  <Card key={favorite._id}>
                    <CardHeader>
                      <CardTitle>{favorite.restaurant?.name || "Restaurant"}</CardTitle>
                      <CardDescription>{favorite.restaurant?.cuisine || "Various Cuisine"}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center mb-4">
                        <Star className="h-5 w-5 fill-primary text-primary mr-1" />
                        <span>{favorite.restaurant?.rating || "N/A"}</span>
                      </div>
                      <div className="flex space-x-2">
                        <Link href={`/restaurants/${favorite.restaurantId}`} className="flex-1">
                          <Button variant="outline" className="w-full">
                            View
                          </Button>
                        </Link>
                        <Link href={`/restaurants/${favorite.restaurantId}#reservation`} className="flex-1">
                          <Button className="w-full">Reserve</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-muted-foreground mb-4">You don't have any favorite restaurants yet</p>
                  <Link href="/restaurants">
                    <Button>Explore Restaurants</Button>
                  </Link>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <Tabs defaultValue="overview">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="reservations">Upcoming Reservations</TabsTrigger>
            <TabsTrigger value="reviews">Recent Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Reservations</CardTitle>
                  <CardDescription>Manage your upcoming reservations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{restaurantReservations.length}</div>
                  <p className="text-sm text-muted-foreground">Upcoming reservations</p>
                </CardContent>
                <CardFooter>
                  <Link href="/dashboard/reservations" className="w-full">
                    <Button variant="outline" className="w-full">
                      View All
                    </Button>
                  </Link>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Menu</CardTitle>
                  <CardDescription>Manage your restaurant menu</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{restaurant?.menu?.length || 0}</div>
                  <p className="text-sm text-muted-foreground">Menu categories</p>
                </CardContent>
                <CardFooter>
                  <Link href="/dashboard/menu" className="w-full">
                    <Button variant="outline" className="w-full">
                      Manage Menu
                    </Button>
                  </Link>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Reviews</CardTitle>
                  <CardDescription>View and respond to customer reviews</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{restaurantReviews.length}</div>
                  <p className="text-sm text-muted-foreground">Customer reviews</p>
                </CardContent>
                <CardFooter>
                  <Link href="/dashboard/reviews" className="w-full">
                    <Button variant="outline" className="w-full">
                      View Reviews
                    </Button>
                  </Link>
                </CardFooter>
              </Card>

              <Card className="md:col-span-2 lg:col-span-3">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common tasks for restaurant management</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Link href="/dashboard/menu/categories/new">
                      <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center">
                        <PlusCircle className="h-8 w-8 mb-2" />
                        <span>Add Menu Category</span>
                      </Button>
                    </Link>
                    <Link href="/dashboard/restaurant-profile">
                      <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center">
                        <Star className="h-8 w-8 mb-2" />
                        <span>Update Profile</span>
                      </Button>
                    </Link>
                    <Link href="/dashboard/images">
                      <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center">
                        <ImageIcon className="h-8 w-8 mb-2" />
                        <span>Manage Images</span>
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reservations">
            <Card>
              <CardHeader>
                <CardTitle>Reservation Management</CardTitle>
                <CardDescription>View and manage upcoming reservations for your restaurant</CardDescription>
              </CardHeader>
              <CardContent>
                {restaurantReservations.length > 0 ? (
                  <div className="rounded-md border">
                    <div className="grid grid-cols-6 border-b px-4 py-3 font-medium">
                      <div>Customer</div>
                      <div>Date</div>
                      <div>Time</div>
                      <div>Guests</div>
                      <div>Status</div>
                      <div className="text-right">Actions</div>
                    </div>
                    {restaurantReservations.map((reservation: any) => (
                      <div
                        key={reservation._id}
                        className="grid grid-cols-6 items-center px-4 py-3 border-b last:border-0"
                      >
                        <div>{reservation.customerName}</div>
                        <div>{new Date(reservation.date).toLocaleDateString()}</div>
                        <div>{reservation.time}</div>
                        <div>{reservation.guests}</div>
                        <div>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              reservation.status === "confirmed"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                : reservation.status === "cancelled"
                                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                            }`}
                          >
                            {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                          </span>
                        </div>
                        <div className="flex justify-end space-x-2">
                          {reservation.status === "pending" && (
                            <Button size="sm" variant="outline">
                              Confirm
                            </Button>
                          )}
                          <Button size="sm" variant="destructive" disabled={reservation.status === "cancelled"}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">You don't have any reservations yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>Customer Reviews</CardTitle>
                <CardDescription>See what customers are saying about your restaurant</CardDescription>
              </CardHeader>
              <CardContent>
                {restaurantReviews.length > 0 ? (
                  <div className="space-y-4">
                    {restaurantReviews.map((review: any) => (
                      <div key={review._id} className="rounded-lg border p-4">
                        <div className="flex justify-between mb-2">
                          <div className="font-medium">{review.customerName}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(review.date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating ? "fill-primary text-primary" : "text-muted-foreground"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-sm">{review.comment}</p>
                        {review.reply ? (
                          <div className="mt-2 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                            <p className="text-sm font-medium">Your reply:</p>
                            <p className="text-sm">{review.reply}</p>
                          </div>
                        ) : (
                          <div className="mt-2">
                            <Button size="sm" variant="outline">
                              Reply
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">You don't have any reviews yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

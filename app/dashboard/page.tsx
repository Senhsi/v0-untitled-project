"use client"

import { Badge } from "@/components/ui/badge"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { useApi } from "@/hooks/use-api"
import { Breadcrumb } from "@/components/breadcrumb"
import { RealTimeActivity } from "@/components/real-time-activity"
import { Skeleton } from "@/components/ui/skeleton"
import { CalendarDays, Users, Star, Clock, TrendingUp, Utensils } from "lucide-react"

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")

  // Fetch restaurant data if user is a restaurant owner
  const {
    data: restaurant,
    isLoading: isLoadingRestaurant,
    error: restaurantError,
  } = useApi("/api/restaurants", {
    requireAuth: true,
    onSuccess: (data) => {
      // If restaurant owner has no restaurant, redirect to create one
      if (user?.userType === "restaurant" && (!data || data.length === 0)) {
        toast({
          title: "No Restaurant Found",
          description: "Please create a restaurant profile first",
        })
        router.push("/dashboard/restaurant-profile")
      }
      return data && data.length > 0 ? data[0] : null
    },
    onError: () => {},
  })

  // Fetch reservations
  const { data: reservations = [], isLoading: isLoadingReservations } = useApi("/api/reservations", {
    requireAuth: true,
    onError: () => {},
  })

  // Fetch reviews if user is a restaurant owner
  const { data: reviews = [], isLoading: isLoadingReviews } = useApi(
    restaurant ? `/api/reviews?restaurantId=${restaurant._id}` : "",
    {
      requireAuth: true,
      onError: () => {},
    },
  )

  // Fetch favorites if user is a customer
  const { data: favorites = [], isLoading: isLoadingFavorites } = useApi("/api/favorites", {
    requireAuth: true,
    onError: () => {},
  })

  // Calculate stats
  const pendingReservations = reservations.filter((r: any) => r.status === "pending").length
  const confirmedReservations = reservations.filter((r: any) => r.status === "confirmed").length
  const totalReviews = reviews.length
  const averageRating = reviews.length
    ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "N/A"

  if (!user) {
    return null // Will be redirected by middleware
  }

  const isLoading = isLoadingRestaurant || isLoadingReservations || isLoadingReviews || isLoadingFavorites

  return (
    <div>
      <Breadcrumb />
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {user.userType === "restaurant" && <TabsTrigger value="analytics">Analytics</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {isLoading ? (
              // Skeleton loaders for stats
              <>
                {[...Array(4)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-7 w-16 mb-1" />
                      <Skeleton className="h-4 w-28" />
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : (
              <>
                {/* Stats cards based on user type */}
                {user.userType === "restaurant" ? (
                  // Restaurant owner stats
                  <>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Reservations</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{pendingReservations}</div>
                        <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Confirmed Reservations</CardTitle>
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{confirmedReservations}</div>
                        <p className="text-xs text-muted-foreground">Upcoming bookings</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
                        <Star className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{totalReviews}</div>
                        <p className="text-xs text-muted-foreground">Customer feedback</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{averageRating}</div>
                        <p className="text-xs text-muted-foreground">Out of 5 stars</p>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  // Customer stats
                  <>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">My Reservations</CardTitle>
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{reservations.length}</div>
                        <p className="text-xs text-muted-foreground">Total bookings</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Upcoming Reservations</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {
                            reservations.filter((r: any) => r.status === "confirmed" && new Date(r.date) >= new Date())
                              .length
                          }
                        </div>
                        <p className="text-xs text-muted-foreground">Confirmed bookings</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Favorite Restaurants</CardTitle>
                        <Utensils className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{favorites.length}</div>
                        <p className="text-xs text-muted-foreground">Saved places</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">My Reviews</CardTitle>
                        <Star className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {reviews.filter((r: any) => r.customerId === user._id).length}
                        </div>
                        <p className="text-xs text-muted-foreground">Submitted feedback</p>
                      </CardContent>
                    </Card>
                  </>
                )}
              </>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Recent Activity */}
            <RealTimeActivity />

            {/* Recent Reservations */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Reservations</CardTitle>
                <CardDescription>Your latest bookings</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingReservations ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[200px]" />
                          <Skeleton className="h-4 w-[150px]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : reservations.length > 0 ? (
                  <div className="space-y-4">
                    {reservations.slice(0, 5).map((reservation: any) => (
                      <div key={reservation._id} className="flex items-center gap-4">
                        <div className="rounded-full p-2 bg-muted">
                          <Users className="h-4 w-4" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">
                            {user.userType === "restaurant" ? reservation.customerName : reservation.restaurantName}
                          </p>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <span>
                              {new Date(reservation.date).toLocaleDateString()} at {reservation.time}
                            </span>
                            <span className="mx-2">•</span>
                            <span>{reservation.guests} guests</span>
                            <span className="mx-2">•</span>
                            <Badge
                              variant={
                                reservation.status === "confirmed"
                                  ? "default"
                                  : reservation.status === "pending"
                                    ? "outline"
                                    : "destructive"
                              }
                              className="text-[10px] h-5"
                            >
                              {reservation.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">No reservations found</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {user.userType === "restaurant" && (
          <TabsContent value="analytics" className="space-y-4">
            {/* Analytics content */}
            <Card>
              <CardHeader>
                <CardTitle>Restaurant Analytics</CardTitle>
                <CardDescription>Performance metrics for your restaurant</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6 text-muted-foreground">Analytics dashboard coming soon...</div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

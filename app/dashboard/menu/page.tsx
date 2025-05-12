"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusCircle, Edit, DollarSign } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/context/auth-context"
import { getWithAuth } from "@/lib/api-utils"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb } from "@/components/breadcrumb"
import type { MenuItem, Restaurant } from "@/lib/db"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function MenuManagementPage() {
  const { user, token } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [activeTab, setActiveTab] = useState("categories")

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

    const fetchRestaurantData = async () => {
      setIsLoading(true)
      try {
        // First check if the restaurant owner already has a restaurant
        const restaurants = await getWithAuth("/api/restaurants")
        const ownedRestaurant = restaurants.find((r: any) => r.ownerId === user._id)

        if (ownedRestaurant) {
          setRestaurant(ownedRestaurant)
        } else {
          // Redirect to create restaurant profile
          toast({
            title: "No Restaurant Found",
            description: "Please create a restaurant profile first",
            variant: "destructive",
          })
          router.push("/dashboard/restaurant-profile")
        }
      } catch (error) {
        console.error("Error fetching restaurant:", error)
        toast({
          title: "Error",
          description: "Failed to load restaurant data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchRestaurantData()
  }, [user, token, router, toast])

  // Navigation to different pages of the menu management system
  const goToAddCategory = () => {
    router.push("/dashboard/menu/categories/new")
  }

  const goToEditCategory = (categoryId: string) => {
    router.push(`/dashboard/menu/categories/${categoryId}`)
  }

  const goToAddMenuItem = (categoryId: string) => {
    router.push(`/dashboard/menu/categories/${categoryId}/items/new`)
  }

  const goToEditMenuItem = (categoryId: string, itemId: string) => {
    router.push(`/dashboard/menu/categories/${categoryId}/items/${itemId}`)
  }

  const renderDietaryIcons = (item: MenuItem) => {
    return (
      <div className="flex space-x-1">
        {item.isVegetarian && (
          <Badge variant="outline" className="text-green-600 border-green-600">
            V
          </Badge>
        )}
        {item.isVegan && (
          <Badge variant="outline" className="text-green-600 border-green-600">
            VG
          </Badge>
        )}
        {item.isGlutenFree && (
          <Badge variant="outline" className="text-amber-600 border-amber-600">
            GF
          </Badge>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div>
        <Breadcrumb />
        <h1 className="text-3xl font-bold mb-6">Menu Management</h1>
        <Alert>
          <AlertDescription>You need to create a restaurant profile before managing your menu.</AlertDescription>
        </Alert>
        <Button onClick={() => router.push("/dashboard/restaurant-profile")} className="mt-4">
          Create Restaurant Profile
        </Button>
      </div>
    )
  }

  const sortedCategories = [...(restaurant.menu || [])].sort((a, b) => a.order - b.order)

  return (
    <div>
      <Breadcrumb />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Menu Management</h1>
        <Button onClick={goToAddCategory}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      <Tabs defaultValue="categories" value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="categories">Menu Categories</TabsTrigger>
          <TabsTrigger value="items">Menu Items</TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          {sortedCategories.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sortedCategories.map((category) => (
                <Card key={category._id?.toString()}>
                  <CardHeader>
                    <CardTitle>{category.name}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{category.items?.length || 0} items</p>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={() => goToEditCategory(category._id!.toString())}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button variant="outline" onClick={() => goToAddMenuItem(category._id!.toString())}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Item
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No menu categories yet</p>
              <Button onClick={goToAddCategory}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Your First Category
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="items">
          {sortedCategories.length > 0 ? (
            <div className="space-y-8">
              {sortedCategories.map((category) => (
                <div key={category._id?.toString()}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">{category.name}</h2>
                    <Button variant="outline" size="sm" onClick={() => goToAddMenuItem(category._id!.toString())}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Item
                    </Button>
                  </div>

                  {category.items && category.items.length > 0 ? (
                    <div className="space-y-4">
                      {category.items.map((item) => (
                        <div
                          key={item._id?.toString()}
                          className={`p-4 border rounded-lg ${!item.isAvailable ? "bg-muted" : ""}`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="font-medium">{item.name}</h3>
                                {renderDietaryIcons(item)}
                                {!item.isAvailable && (
                                  <Badge variant="outline" className="text-gray-500">
                                    Unavailable
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                            </div>
                            <div className="flex flex-col items-end">
                              <div className="flex items-center mb-2">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{item.price.toFixed(2)}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => goToEditMenuItem(category._id!.toString(), item._id!.toString())}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {item.imageUrl && (
                            <div className="mt-2 h-24 w-24 overflow-hidden rounded">
                              <img
                                src={item.imageUrl || "/placeholder.svg"}
                                alt={item.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 border rounded-lg">
                      <p className="text-muted-foreground">No items in this category</p>
                    </div>
                  )}

                  <Separator className="my-6" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No menu categories or items yet</p>
              <Button onClick={() => setActiveTab("categories")}>Manage Categories First</Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, MapPin, Star, Filter, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useApi } from "@/hooks/use-api"
import type { Restaurant } from "@/lib/db"

export default function RestaurantsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([])
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "")
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    cuisine: searchParams.get("cuisine") || "",
    priceRange: searchParams.get("price") || "",
    isLgbtqFriendly: searchParams.get("lgbtq") === "true",
    isSmokingAllowed: searchParams.get("smoking") === "true",
    hasOutdoorSeating: searchParams.get("outdoor") === "true",
    isWheelchairAccessible: searchParams.get("wheelchair") === "true",
    hasVeganOptions: searchParams.get("vegan") === "true",
    hasVegetarianOptions: searchParams.get("vegetarian") === "true",
  })

  // Fetch restaurants using our custom hook
  const { data: restaurants, isLoading, error, refetch } = useApi<Restaurant[]>("/api/restaurants")

  // Update URL with filters
  useEffect(() => {
    const params = new URLSearchParams()

    if (searchTerm) params.set("search", searchTerm)
    if (filters.cuisine) params.set("cuisine", filters.cuisine)
    if (filters.priceRange) params.set("price", filters.priceRange)
    if (filters.isLgbtqFriendly) params.set("lgbtq", "true")
    if (filters.isSmokingAllowed) params.set("smoking", "true")
    if (filters.hasOutdoorSeating) params.set("outdoor", "true")
    if (filters.isWheelchairAccessible) params.set("wheelchair", "true")
    if (filters.hasVeganOptions) params.set("vegan", "true")
    if (filters.hasVegetarianOptions) params.set("vegetarian", "true")

    const queryString = params.toString()
    const url = queryString ? `/restaurants?${queryString}` : "/restaurants"

    // Only update URL if filters have been applied
    if (Object.values(filters).some((value) => value) || searchTerm) {
      router.push(url, { scroll: false })
    }
  }, [filters, searchTerm, router])

  // Apply filters when restaurants data changes
  useEffect(() => {
    if (!restaurants) return

    // Apply filters and search
    let results = [...restaurants]

    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      results = results.filter(
        (restaurant) =>
          restaurant.name.toLowerCase().includes(term) ||
          restaurant.cuisine.toLowerCase().includes(term) ||
          restaurant.description?.toLowerCase().includes(term) ||
          restaurant.location.toLowerCase().includes(term),
      )
    }

    // Apply filters
    if (filters.cuisine) {
      results = results.filter((restaurant) => restaurant.cuisine.toLowerCase().includes(filters.cuisine.toLowerCase()))
    }

    if (filters.priceRange) {
      results = results.filter((restaurant) => restaurant.priceRange === filters.priceRange)
    }

    if (filters.isLgbtqFriendly) {
      results = results.filter((restaurant) => restaurant.isLgbtqFriendly)
    }

    if (filters.isSmokingAllowed) {
      results = results.filter((restaurant) => restaurant.isSmokingAllowed)
    }

    if (filters.hasOutdoorSeating) {
      results = results.filter((restaurant) => restaurant.hasOutdoorSeating)
    }

    if (filters.isWheelchairAccessible) {
      results = results.filter((restaurant) => restaurant.isWheelchairAccessible)
    }

    if (filters.hasVeganOptions) {
      results = results.filter((restaurant) => restaurant.hasVeganOptions)
    }

    if (filters.hasVegetarianOptions) {
      results = results.filter((restaurant) => restaurant.hasVegetarianOptions)
    }

    setFilteredRestaurants(results)
  }, [restaurants, searchTerm, filters])

  const handleFilterChange = (name: string, value: any) => {
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  const clearFilters = () => {
    setFilters({
      cuisine: "",
      priceRange: "",
      isLgbtqFriendly: false,
      isSmokingAllowed: false,
      hasOutdoorSeating: false,
      isWheelchairAccessible: false,
      hasVeganOptions: false,
      hasVegetarianOptions: false,
    })
    setSearchTerm("")
    router.push("/restaurants")
  }

  // Get unique cuisines for filter dropdown
  const cuisines = restaurants ? [...new Set(restaurants.map((r) => r.cuisine))].sort() : []

  // Count active filters
  const activeFilterCount = Object.values(filters).filter((value) => value).length

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Find Restaurants</h1>

      {/* Search and Filter */}
      <div className="mb-8 p-4 border rounded-lg bg-background">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search restaurants..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="md:w-auto" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
            {(activeFilterCount > 0 || searchTerm) && (
              <Button variant="ghost" onClick={clearFilters} className="md:w-auto">
                <X className="mr-2 h-4 w-4" />
                Clear
              </Button>
            )}
          </div>

          {showFilters && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-2">
              <div>
                <Label htmlFor="cuisine">Cuisine</Label>
                <select
                  id="cuisine"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={filters.cuisine}
                  onChange={(e) => handleFilterChange("cuisine", e.target.value)}
                >
                  <option value="">All Cuisines</option>
                  {cuisines.map((cuisine) => (
                    <option key={cuisine} value={cuisine}>
                      {cuisine}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="priceRange">Price Range</Label>
                <select
                  id="priceRange"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={filters.priceRange}
                  onChange={(e) => handleFilterChange("priceRange", e.target.value)}
                >
                  <option value="">Any Price</option>
                  <option value="low">$ (Budget-friendly)</option>
                  <option value="medium">$$ (Moderate)</option>
                  <option value="high">$$$ (Expensive)</option>
                </select>
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <Label className="mb-2 block">Features</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isLgbtqFriendly"
                      checked={filters.isLgbtqFriendly}
                      onCheckedChange={(checked) => handleFilterChange("isLgbtqFriendly", checked)}
                    />
                    <label
                      htmlFor="isLgbtqFriendly"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      LGBTQ+ Friendly
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isSmokingAllowed"
                      checked={filters.isSmokingAllowed}
                      onCheckedChange={(checked) => handleFilterChange("isSmokingAllowed", checked)}
                    />
                    <label
                      htmlFor="isSmokingAllowed"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Smoking Allowed
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasOutdoorSeating"
                      checked={filters.hasOutdoorSeating}
                      onCheckedChange={(checked) => handleFilterChange("hasOutdoorSeating", checked)}
                    />
                    <label
                      htmlFor="hasOutdoorSeating"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Outdoor Seating
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isWheelchairAccessible"
                      checked={filters.isWheelchairAccessible}
                      onCheckedChange={(checked) => handleFilterChange("isWheelchairAccessible", checked)}
                    />
                    <label
                      htmlFor="isWheelchairAccessible"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Wheelchair Accessible
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasVeganOptions"
                      checked={filters.hasVeganOptions}
                      onCheckedChange={(checked) => handleFilterChange("hasVeganOptions", checked)}
                    />
                    <label
                      htmlFor="hasVeganOptions"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Vegan Options
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasVegetarianOptions"
                      checked={filters.hasVegetarianOptions}
                      onCheckedChange={(checked) => handleFilterChange("hasVegetarianOptions", checked)}
                    />
                    <label
                      htmlFor="hasVegetarianOptions"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Vegetarian Options
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-video w-full">
                <Skeleton className="h-full w-full" />
              </div>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">Error loading restaurants</h3>
          <p className="text-muted-foreground mb-4">{error.message}</p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      ) : (
        <>
          {/* Results count */}
          <div className="mb-4 text-muted-foreground">
            {filteredRestaurants.length} {filteredRestaurants.length === 1 ? "restaurant" : "restaurants"} found
          </div>

          {/* Restaurant List */}
          {filteredRestaurants.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredRestaurants.map((restaurant) => (
                <Card key={restaurant._id?.toString()} className="overflow-hidden">
                  <Link href={`/restaurants/${restaurant._id}`} className="block">
                    <div className="aspect-video w-full overflow-hidden">
                      <img
                        src={restaurant.images?.[0] || "/placeholder.svg?height=200&width=300"}
                        alt={restaurant.name}
                        className="h-full w-full object-cover transition-all hover:scale-105"
                      />
                    </div>
                  </Link>
                  <CardHeader>
                    <CardTitle>
                      <Link href={`/restaurants/${restaurant._id}`} className="hover:underline">
                        {restaurant.name}
                      </Link>
                    </CardTitle>
                    <CardDescription className="flex items-center justify-between">
                      <span>{restaurant.cuisine}</span>
                      <span className="flex items-center">
                        <Star className="h-4 w-4 fill-primary text-primary mr-1" />
                        {restaurant.rating?.toFixed(1) || "New"}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm text-muted-foreground mb-2">
                      <MapPin className="h-4 w-4 mr-1" />
                      {restaurant.location}
                    </div>
                    <p className="text-sm line-clamp-2">{restaurant.description}</p>

                    {/* Feature badges */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {restaurant.isLgbtqFriendly && (
                        <Badge variant="outline" className="text-xs">
                          LGBTQ+
                        </Badge>
                      )}
                      {restaurant.hasOutdoorSeating && (
                        <Badge variant="outline" className="text-xs">
                          Outdoor
                        </Badge>
                      )}
                      {restaurant.isWheelchairAccessible && (
                        <Badge variant="outline" className="text-xs">
                          Accessible
                        </Badge>
                      )}
                      {restaurant.hasVeganOptions && (
                        <Badge variant="outline" className="text-xs">
                          Vegan
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Link href={`/restaurants/${restaurant._id}`} className="w-full">
                      <Button variant="outline" className="w-full">
                        View Details
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">No restaurants found</h3>
              <p className="text-muted-foreground mb-4">Try adjusting your filters or search term</p>
              <Button onClick={clearFilters}>Clear Filters</Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

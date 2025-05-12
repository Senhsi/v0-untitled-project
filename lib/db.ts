import { MongoClient, type Db, ObjectId } from "mongodb"

// Types for our collections
export interface User {
  _id?: string | ObjectId
  name: string
  email: string
  password: string
  userType: "customer" | "restaurant"
  createdAt: Date
  profileImage?: string
  phone?: string
  bio?: string
  // Enhanced user preferences and settings
  settings?: {
    notifications?: {
      email: boolean
      marketing: boolean
      reservationReminders: boolean
      reservationUpdates: boolean
      specialOffers: boolean
      newReviews: boolean // for restaurant owners
    }
    privacy?: {
      profileVisibility: "public" | "registered" | "private"
      showReviews: boolean
      showReservations: boolean // for restaurant owners to show reservation availability
      shareDataWithPartners: boolean
    }
    personalization?: {
      theme: "light" | "dark" | "system"
      language: string
      currency: string
      dateFormat: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD"
      timeFormat: "12h" | "24h"
    }
  }
}

export interface MenuItem {
  _id?: string | ObjectId
  name: string
  description: string
  price: number
  imageUrl?: string
  isAvailable: boolean
  category: string
  allergens?: string[]
  isVegetarian?: boolean
  isVegan?: boolean
  isGlutenFree?: boolean
  createdAt: Date
  updatedAt?: Date
}

export interface MenuCategory {
  _id?: string | ObjectId
  name: string
  description?: string
  items: MenuItem[]
  order: number
}

export interface Restaurant {
  _id?: string | ObjectId
  ownerId: string
  name: string
  description: string
  cuisine: string
  location: string
  phone: string
  hours: string
  images: string[]
  menu: MenuCategory[]
  createdAt: Date
  // New attributes
  isLgbtqFriendly: boolean
  isSmokingAllowed: boolean
  hasOutdoorSeating: boolean
  isWheelchairAccessible: boolean
  hasVeganOptions: boolean
  hasVegetarianOptions: boolean
  priceRange: "low" | "medium" | "high"
  rating?: number
}

export interface Reservation {
  _id?: string | ObjectId
  restaurantId: string
  customerId: string
  date: Date
  time: string
  guests: number
  status: "pending" | "confirmed" | "cancelled"
  specialRequests?: string
  createdAt: Date
}

export interface Review {
  _id?: string | ObjectId
  restaurantId: string
  customerId: string
  rating: number
  comment: string
  date: Date
  reply?: string
  images?: string[]
  status?: "pending" | "approved" | "rejected"
  helpful?: number
  reportCount?: number
  updatedAt?: Date
}

export interface Favorite {
  _id?: string | ObjectId
  customerId: string
  restaurantId: string
  createdAt: Date
}

export interface Report {
  _id?: string | ObjectId
  reviewId: string
  reporterId: string
  reason: string
  date: Date
  status: "pending" | "resolved" | "dismissed"
}

// Connection caching
let cachedClient: MongoClient | null = null
let cachedDb: Db | null = null

if (!process.env.MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable")
}

const uri = process.env.MONGODB_URI
const options = {}

export async function connectToDatabase() {
  // If we already have a connection, use it
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb }
  }

  // Create a new connection
  const client = new MongoClient(uri, options)
  await client.connect()
  const db = client.db("restaurant-reservation")

  // Cache the connection
  cachedClient = client
  cachedDb = db

  return { client, db }
}

// Helper function to convert string IDs to ObjectIds
export function toObjectId(id: string) {
  return new ObjectId(id)
}

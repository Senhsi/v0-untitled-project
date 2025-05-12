import { connectToDatabase, type User } from "./db"
import { compare, hash } from "bcryptjs"
import { sign, verify } from "jsonwebtoken"
import { ObjectId } from "mongodb"

// JWT secret (in a real app, this would be in an environment variable)
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not defined")
}

export async function registerUser(userData: Omit<User, "_id" | "createdAt">) {
  const { db } = await connectToDatabase()
  const collection = db.collection("users")

  // Check if user already exists
  const existingUser = await collection.findOne({ email: userData.email })
  if (existingUser) {
    throw new Error("User already exists")
  }

  // Hash the password
  const hashedPassword = await hash(userData.password, 10)

  // Create the user
  const newUser = {
    ...userData,
    password: hashedPassword,
    createdAt: new Date(),
  }

  const result = await collection.insertOne(newUser)

  // Create JWT token
  const token = sign(
    {
      userId: result.insertedId.toString(),
      email: userData.email,
      userType: userData.userType,
    },
    JWT_SECRET,
    { expiresIn: "7d" },
  )

  return {
    user: {
      _id: result.insertedId.toString(),
      name: userData.name,
      email: userData.email,
      userType: userData.userType,
    },
    token,
  }
}

export async function loginUser(email: string, password: string) {
  const { db } = await connectToDatabase()
  const collection = db.collection("users")

  // Find the user
  const user = await collection.findOne({ email })
  if (!user) {
    throw new Error("User not found")
  }

  // Compare passwords
  const isPasswordValid = await compare(password, user.password)
  if (!isPasswordValid) {
    throw new Error("Invalid password")
  }

  // Create JWT token
  const token = sign(
    {
      userId: user._id.toString(),
      email: user.email,
      userType: user.userType,
    },
    JWT_SECRET,
    { expiresIn: "7d" },
  )

  return {
    user: {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      userType: user.userType,
    },
    token,
  }
}

export async function getCurrentUser(token: string) {
  try {
    // Verify the token
    const decoded = verify(token, JWT_SECRET) as {
      userId: string
      email: string
      userType: string
    }

    const { db } = await connectToDatabase()
    const collection = db.collection("users")

    // Find the user
    const user = await collection.findOne({ _id: new ObjectId(decoded.userId) })
    if (!user) {
      throw new Error("User not found")
    }

    return {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      userType: user.userType,
    }
  } catch (error) {
    throw new Error("Invalid token")
  }
}

// Middleware to verify JWT token
export async function verifyToken(token: string) {
  if (!token) {
    throw new Error("No token provided")
  }

  try {
    // Remove "Bearer " prefix if present
    const tokenValue = token.startsWith("Bearer ") ? token.slice(7) : token

    // Verify the token
    const decoded = verify(tokenValue, JWT_SECRET) as {
      userId: string
      email: string
      userType: string
    }

    return decoded
  } catch (error) {
    throw new Error("Invalid token")
  }
}

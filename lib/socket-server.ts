import type { Server as HTTPServer } from "http"
import { Server as SocketIOServer } from "socket.io"
import { verifyToken } from "@/lib/auth"

let io: SocketIOServer | null = null

export const initSocketServer = (httpServer: HTTPServer) => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  })

  // Middleware for authentication
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token
    if (!token) {
      return next(new Error("Authentication error"))
    }

    try {
      const decoded = await verifyToken(token)
      socket.data.user = decoded
      next()
    } catch (error) {
      next(new Error("Authentication error"))
    }
  })

  io.on("connection", (socket) => {
    const user = socket.data.user
    console.log(`User connected: ${user.userId} (${user.userType})`)

    // Join user-specific room
    socket.join(`user:${user.userId}`)

    // If restaurant owner, join restaurant-specific room
    if (user.userType === "restaurant") {
      socket.join(`restaurant-owner:${user.userId}`)
    }

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${user.userId}`)
    })
  })

  console.log("Socket.IO server initialized")
  return io
}

export const getSocketIO = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized")
  }
  return io
}

// Helper functions to emit events
export const emitToUser = (userId: string, event: string, data: any) => {
  const socketIO = getSocketIO()
  socketIO.to(`user:${userId}`).emit(event, data)
}

export const emitToRestaurantOwner = (ownerId: string, event: string, data: any) => {
  const socketIO = getSocketIO()
  socketIO.to(`restaurant-owner:${ownerId}`).emit(event, data)
}

export const emitToAll = (event: string, data: any) => {
  const socketIO = getSocketIO()
  socketIO.emit(event, data)
}

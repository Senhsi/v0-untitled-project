"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { io, type Socket } from "socket.io-client"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/components/ui/use-toast"

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  notifications: Notification[]
  markNotificationAsRead: (id: string) => void
  clearNotifications: () => void
}

interface Notification {
  id: string
  type: "reservation" | "review" | "message" | "system"
  title: string
  message: string
  data?: any
  read: boolean
  createdAt: Date
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  notifications: [],
  markNotificationAsRead: () => {},
  clearNotifications: () => {},
})

export const useSocket = () => useContext(SocketContext)

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const { user, token } = useAuth()
  const { toast } = useToast()

  // Initialize socket connection when user is authenticated
  useEffect(() => {
    if (!user || !token) {
      if (socket) {
        socket.disconnect()
        setSocket(null)
        setIsConnected(false)
      }
      return
    }

    // Create socket connection
    const socketUrl = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== "undefined" ? window.location.origin : "")

    const socketInstance = io(socketUrl, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    // Set up event listeners
    socketInstance.on("connect", () => {
      console.log("Socket connected")
      setIsConnected(true)
    })

    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected")
      setIsConnected(false)
    })

    socketInstance.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message)
      setIsConnected(false)
    })

    // Handle notifications
    socketInstance.on("notification", (data: Omit<Notification, "id" | "read" | "createdAt">) => {
      const newNotification: Notification = {
        id: Math.random().toString(36).substring(2, 9),
        ...data,
        read: false,
        createdAt: new Date(),
      }

      setNotifications((prev) => [newNotification, ...prev])

      // Show toast for new notification
      toast({
        title: newNotification.title,
        description: newNotification.message,
      })
    })

    // Event handlers for specific notification types
    socketInstance.on("new_reservation", (data) => {
      const notification: Notification = {
        id: Math.random().toString(36).substring(2, 9),
        type: "reservation",
        title: "New Reservation",
        message: `New reservation for ${data.guests} guests on ${new Date(data.date).toLocaleDateString()}`,
        data,
        read: false,
        createdAt: new Date(),
      }

      setNotifications((prev) => [notification, ...prev])

      toast({
        title: notification.title,
        description: notification.message,
      })
    })

    socketInstance.on("reservation_updated", (data) => {
      const notification: Notification = {
        id: Math.random().toString(36).substring(2, 9),
        type: "reservation",
        title: "Reservation Updated",
        message: `Reservation status changed to ${data.status}`,
        data,
        read: false,
        createdAt: new Date(),
      }

      setNotifications((prev) => [notification, ...prev])

      toast({
        title: notification.title,
        description: notification.message,
      })
    })

    socketInstance.on("new_review", (data) => {
      const notification: Notification = {
        id: Math.random().toString(36).substring(2, 9),
        type: "review",
        title: "New Review",
        message: `New ${data.rating}-star review received`,
        data,
        read: false,
        createdAt: new Date(),
      }

      setNotifications((prev) => [notification, ...prev])

      toast({
        title: notification.title,
        description: notification.message,
      })
    })

    setSocket(socketInstance)

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect()
    }
  }, [user, token, toast])

  // Function to mark notification as read
  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  // Function to clear all notifications
  const clearNotifications = () => {
    setNotifications([])
  }

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        notifications,
        markNotificationAsRead,
        clearNotifications,
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}

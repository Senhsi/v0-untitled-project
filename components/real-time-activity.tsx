"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useSocket } from "@/context/socket-context"
import { Calendar, Clock, Star, User } from "lucide-react"

interface Activity {
  id: string
  type: "reservation" | "review" | "message" | "system"
  title: string
  description: string
  time: Date
  data?: any
}

export function RealTimeActivity() {
  const { notifications } = useSocket()
  const [activities, setActivities] = useState<Activity[]>([])

  // Convert notifications to activities
  useEffect(() => {
    const newActivities = notifications.slice(0, 10).map((notification) => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      description: notification.message,
      time: notification.createdAt,
      data: notification.data,
    }))

    setActivities(newActivities)
  }, [notifications])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "reservation":
        return <Calendar className="h-4 w-4" />
      case "review":
        return <Star className="h-4 w-4" />
      case "message":
        return <User className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getActivityBadge = (type: string) => {
    switch (type) {
      case "reservation":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Reservation
          </Badge>
        )
      case "review":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            Review
          </Badge>
        )
      case "message":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Message
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            System
          </Badge>
        )
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()

    // Less than a minute
    if (diff < 60000) {
      return "Just now"
    }

    // Less than an hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000)
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`
    }

    // Less than a day
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000)
      return `${hours} hour${hours > 1 ? "s" : ""} ago`
    }

    // Format as date
    return new Date(date).toLocaleDateString()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Real-time updates from your restaurant</CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4">
                <div className="rounded-full p-2 bg-muted">{getActivityIcon(activity.type)}</div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{activity.title}</p>
                    {getActivityBadge(activity.type)}
                  </div>
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">{formatTime(activity.time)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">No recent activity</div>
        )}
      </CardContent>
    </Card>
  )
}

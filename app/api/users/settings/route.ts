import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase, toObjectId } from "@/lib/db"
import { getAuthUser, handleApiError } from "@/lib/api-utils"

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    const { db } = await connectToDatabase()

    const userSettings = await db.collection("users").findOne(
      { _id: toObjectId(user.userId) },
      {
        projection: {
          settings: 1,
          userType: 1,
        },
      },
    )

    if (!userSettings) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // If no settings exist yet, return default settings
    if (!userSettings.settings) {
      const defaultSettings = getDefaultSettings(userSettings.userType)
      return NextResponse.json(defaultSettings)
    }

    return NextResponse.json(userSettings.settings)
  } catch (error) {
    const { error: errorMessage, status } = handleApiError(error)
    return NextResponse.json({ error: errorMessage }, { status })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    const { db } = await connectToDatabase()
    const settingsData = await req.json()

    // Get user type to validate settings
    const userDoc = await db
      .collection("users")
      .findOne({ _id: toObjectId(user.userId) }, { projection: { userType: 1 } })

    if (!userDoc) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Validate settings based on user type
    const validatedSettings = validateSettings(settingsData, userDoc.userType)

    // Update the user's settings
    const result = await db
      .collection("users")
      .updateOne({ _id: toObjectId(user.userId) }, { $set: { settings: validatedSettings } })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
      settings: validatedSettings,
    })
  } catch (error) {
    const { error: errorMessage, status } = handleApiError(error)
    return NextResponse.json({ error: errorMessage }, { status })
  }
}

// Helper function to get default settings based on user type
function getDefaultSettings(userType: string) {
  const commonSettings = {
    notifications: {
      email: true,
      marketing: false,
      reservationReminders: true,
      reservationUpdates: true,
      specialOffers: false,
    },
    privacy: {
      profileVisibility: "registered",
      showReviews: true,
      shareDataWithPartners: false,
    },
    personalization: {
      theme: "system",
      language: "en",
      currency: "USD",
      dateFormat: "MM/DD/YYYY",
      timeFormat: "12h",
    },
  }

  // Add restaurant-specific default settings
  if (userType === "restaurant") {
    return {
      ...commonSettings,
      notifications: {
        ...commonSettings.notifications,
        newReviews: true,
      },
      privacy: {
        ...commonSettings.privacy,
        showReservations: true,
      },
    }
  }

  return commonSettings
}

// Helper function to validate and sanitize settings
function validateSettings(settings: any, userType: string) {
  const defaultSettings = getDefaultSettings(userType)

  // Deep merge with defaults to ensure all required fields exist
  const merged = {
    notifications: {
      ...defaultSettings.notifications,
      ...settings.notifications,
    },
    privacy: {
      ...defaultSettings.privacy,
      ...settings.privacy,
    },
    personalization: {
      ...defaultSettings.personalization,
      ...settings.personalization,
    },
  }

  // Ensure proper types for boolean values
  for (const key in merged.notifications) {
    merged.notifications[key] = Boolean(merged.notifications[key])
  }

  for (const key in merged.privacy) {
    if (key === "profileVisibility") {
      // Validate enum values
      if (!["public", "registered", "private"].includes(merged.privacy[key])) {
        merged.privacy[key] = defaultSettings.privacy.profileVisibility
      }
    } else {
      merged.privacy[key] = Boolean(merged.privacy[key])
    }
  }

  // Validate personalization settings
  if (!["light", "dark", "system"].includes(merged.personalization.theme)) {
    merged.personalization.theme = defaultSettings.personalization.theme
  }

  if (!["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"].includes(merged.personalization.dateFormat)) {
    merged.personalization.dateFormat = defaultSettings.personalization.dateFormat
  }

  if (!["12h", "24h"].includes(merged.personalization.timeFormat)) {
    merged.personalization.timeFormat = defaultSettings.personalization.timeFormat
  }

  return merged
}

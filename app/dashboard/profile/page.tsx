"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { useTheme } from "@/context/theme-context"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ImageUpload } from "@/components/image-upload"
import { Loader2, User, Lock, BellIcon, ShieldIcon, PaletteIcon } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export default function ProfilePage() {
  const { user, isLoading: authLoading } = useAuth()
  const { theme, setTheme } = useTheme()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    bio: "",
    profileImage: "",
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      marketing: false,
      reservationReminders: true,
      reservationUpdates: true,
      specialOffers: false,
      newReviews: true,
    },
    privacy: {
      profileVisibility: "registered" as "public" | "registered" | "private",
      showReviews: true,
      showReservations: true,
      shareDataWithPartners: false,
    },
    personalization: {
      theme: "system" as "light" | "dark" | "system",
      language: "en",
      currency: "USD",
      dateFormat: "MM/DD/YYYY" as "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD",
      timeFormat: "12h" as "12h" | "24h",
    },
  })

  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [settingsError, setSettingsError] = useState("")
  const [settingsSuccess, setSettingsSuccess] = useState("")

  const [error, setError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
      return
    }

    if (user) {
      fetchUserProfile()
      fetchUserSettings()
    }
  }, [user, authLoading, router])

  // Update theme provider when settings theme changes
  useEffect(() => {
    setTheme(settings.personalization.theme)
  }, [settings.personalization.theme, setTheme])

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/users/profile")

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to fetch profile")
      }

      const data = await response.json()

      setProfileData({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        bio: data.bio || "",
        profileImage: data.profileImage || "",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load profile",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUserSettings = async () => {
    try {
      const response = await fetch("/api/users/settings")

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to fetch settings")
      }

      const data = await response.json()
      setSettings(data)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load settings",
        variant: "destructive",
      })
    }
  }

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProfileData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData((prev) => ({ ...prev, [name]: value }))
  }

  const handleProfileImageChange = (url: string) => {
    setProfileData((prev) => ({ ...prev, profileImage: url }))
  }

  const handleNotificationChange = (key: string, value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value,
      },
    }))
  }

  const handlePrivacyChange = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: value,
      },
    }))
  }

  const handlePersonalizationChange = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      personalization: {
        ...prev.personalization,
        [key]: value,
      },
    }))
  }

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccessMessage("")

    try {
      setIsSaving(true)

      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile")
      }

      setSuccessMessage("Profile updated successfully")
      toast({
        title: "Success",
        description: "Your profile has been updated",
      })
    } catch (error: any) {
      setError(error.message || "Failed to update profile")
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError("")
    setPasswordSuccess("")

    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords do not match")
      return
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long")
      return
    }

    try {
      setIsChangingPassword(true)

      const response = await fetch("/api/users/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to change password")
      }

      setPasswordSuccess("Password changed successfully")
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })

      toast({
        title: "Success",
        description: "Your password has been changed",
      })
    } catch (error: any) {
      setPasswordError(error.message || "Failed to change password")
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSettingsError("")
    setSettingsSuccess("")

    try {
      setIsSavingSettings(true)

      const response = await fetch("/api/users/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update settings")
      }

      setSettings(data.settings)
      setSettingsSuccess("Settings updated successfully")
      toast({
        title: "Success",
        description: "Your settings have been updated",
      })
    } catch (error: any) {
      setSettingsError(error.message || "Failed to update settings")
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      })
    } finally {
      setIsSavingSettings(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="mb-6 text-3xl font-bold">Profile Settings</h1>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Profile Information</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            <span>Security</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <PaletteIcon className="h-4 w-4" />
            <span>Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information and how others see you on the platform</CardDescription>
            </CardHeader>

            <form onSubmit={saveProfile}>
              <CardContent className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {successMessage && (
                  <Alert className="border-green-500 text-green-500">
                    <AlertTitle>Success</AlertTitle>
                    <AlertDescription>{successMessage}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="profileImage">Profile Picture</Label>
                  <ImageUpload
                    value={profileData.profileImage}
                    onChange={handleProfileImageChange}
                    className="h-40 w-40 mx-auto md:mx-0"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={profileData.name}
                      onChange={handleProfileChange}
                      placeholder="Your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={profileData.email}
                      onChange={handleProfileChange}
                      placeholder="Your email address"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={profileData.phone || ""}
                    onChange={handleProfileChange}
                    placeholder="Your phone number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={profileData.bio || ""}
                    onChange={handleProfileChange}
                    placeholder="Tell us a little about yourself"
                    rows={4}
                  />
                </div>
              </CardContent>

              <CardFooter>
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your password and account security</CardDescription>
            </CardHeader>

            <form onSubmit={changePassword}>
              <CardContent className="space-y-6">
                {passwordError && (
                  <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{passwordError}</AlertDescription>
                  </Alert>
                )}

                {passwordSuccess && (
                  <Alert className="border-green-500 text-green-500">
                    <AlertTitle>Success</AlertTitle>
                    <AlertDescription>{passwordSuccess}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Your current password"
                  />
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Your new password"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="Confirm your new password"
                    />
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  Password must be at least 8 characters long and include a mix of letters, numbers, and special
                  characters for better security.
                </div>
              </CardContent>

              <CardFooter>
                <Button type="submit" disabled={isChangingPassword}>
                  {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Change Password
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <form onSubmit={saveSettings}>
            {settingsError && (
              <Alert variant="destructive" className="mb-6">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{settingsError}</AlertDescription>
              </Alert>
            )}

            {settingsSuccess && (
              <Alert className="border-green-500 text-green-500 mb-6">
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>{settingsSuccess}</AlertDescription>
              </Alert>
            )}

            {/* Notification Settings */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BellIcon className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>Control how you receive notifications and updates from the platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive important notifications via email</p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={settings.notifications.email}
                    onCheckedChange={(checked) => handleNotificationChange("email", checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="reservation-reminders">Reservation Reminders</Label>
                    <p className="text-sm text-muted-foreground">Get reminded about your upcoming reservations</p>
                  </div>
                  <Switch
                    id="reservation-reminders"
                    checked={settings.notifications.reservationReminders}
                    onCheckedChange={(checked) => handleNotificationChange("reservationReminders", checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="reservation-updates">Reservation Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications when your reservation status changes
                    </p>
                  </div>
                  <Switch
                    id="reservation-updates"
                    checked={settings.notifications.reservationUpdates}
                    onCheckedChange={(checked) => handleNotificationChange("reservationUpdates", checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="special-offers">Special Offers</Label>
                    <p className="text-sm text-muted-foreground">Get notified about special offers and promotions</p>
                  </div>
                  <Switch
                    id="special-offers"
                    checked={settings.notifications.specialOffers}
                    onCheckedChange={(checked) => handleNotificationChange("specialOffers", checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="marketing">Marketing Emails</Label>
                    <p className="text-sm text-muted-foreground">Receive marketing and newsletter emails</p>
                  </div>
                  <Switch
                    id="marketing"
                    checked={settings.notifications.marketing}
                    onCheckedChange={(checked) => handleNotificationChange("marketing", checked)}
                  />
                </div>

                {user?.userType === "restaurant" && (
                  <>
                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="new-reviews">New Review Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified when someone leaves a review for your restaurant
                        </p>
                      </div>
                      <Switch
                        id="new-reviews"
                        checked={settings.notifications.newReviews}
                        onCheckedChange={(checked) => handleNotificationChange("newReviews", checked)}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Privacy Settings */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldIcon className="h-5 w-5" />
                  Privacy Settings
                </CardTitle>
                <CardDescription>Control your data visibility and account privacy</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="profile-visibility">Profile Visibility</Label>
                  <RadioGroup
                    id="profile-visibility"
                    value={settings.privacy.profileVisibility}
                    onValueChange={(value: "public" | "registered" | "private") =>
                      handlePrivacyChange("profileVisibility", value)
                    }
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="public" id="public" />
                      <Label htmlFor="public" className="font-normal">
                        Public - Anyone can view your profile
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="registered" id="registered" />
                      <Label htmlFor="registered" className="font-normal">
                        Registered Users Only - Only registered users can view your profile
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="private" id="private" />
                      <Label htmlFor="private" className="font-normal">
                        Private - Only you can view your profile
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-reviews">Show My Reviews</Label>
                    <p className="text-sm text-muted-foreground">Allow others to see reviews you've written</p>
                  </div>
                  <Switch
                    id="show-reviews"
                    checked={settings.privacy.showReviews}
                    onCheckedChange={(checked) => handlePrivacyChange("showReviews", checked)}
                  />
                </div>

                {user?.userType === "restaurant" && (
                  <>
                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="show-reservations">Show Reservation Availability</Label>
                        <p className="text-sm text-muted-foreground">
                          Display your restaurant's reservation availability
                        </p>
                      </div>
                      <Switch
                        id="show-reservations"
                        checked={settings.privacy.showReservations}
                        onCheckedChange={(checked) => handlePrivacyChange("showReservations", checked)}
                      />
                    </div>
                  </>
                )}

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="share-data">Data Sharing with Partners</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow sharing your data with trusted partners for improved services
                    </p>
                  </div>
                  <Switch
                    id="share-data"
                    checked={settings.privacy.shareDataWithPartners}
                    onCheckedChange={(checked) => handlePrivacyChange("shareDataWithPartners", checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Personalization Settings */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PaletteIcon className="h-5 w-5" />
                  Personalization
                </CardTitle>
                <CardDescription>Customize your experience on the platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="theme">Theme</Label>
                  <RadioGroup
                    id="theme"
                    value={settings.personalization.theme}
                    onValueChange={(value: "light" | "dark" | "system") => handlePersonalizationChange("theme", value)}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="light" id="light" />
                      <Label htmlFor="light" className="font-normal">
                        Light Theme
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="dark" id="dark" />
                      <Label htmlFor="dark" className="font-normal">
                        Dark Theme
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="system" id="system" />
                      <Label htmlFor="system" className="font-normal">
                        System Default - Follow your device settings
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={settings.personalization.language}
                    onValueChange={(value) => handlePersonalizationChange("language", value)}
                  >
                    <SelectTrigger id="language">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="zh">中文</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={settings.personalization.currency}
                    onValueChange={(value) => handlePersonalizationChange("currency", value)}
                  >
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="JPY">JPY (¥)</SelectItem>
                      <SelectItem value="CAD">CAD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label htmlFor="date-format">Date Format</Label>
                  <Select
                    value={settings.personalization.dateFormat}
                    onValueChange={(value: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD") =>
                      handlePersonalizationChange("dateFormat", value)
                    }
                  >
                    <SelectTrigger id="date-format">
                      <SelectValue placeholder="Select date format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (e.g., 05/12/2025)</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (e.g., 12/05/2025)</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (e.g., 2025-05-12)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label htmlFor="time-format">Time Format</Label>
                  <Select
                    value={settings.personalization.timeFormat}
                    onValueChange={(value: "12h" | "24h") => handlePersonalizationChange("timeFormat", value)}
                  >
                    <SelectTrigger id="time-format">
                      <SelectValue placeholder="Select time format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12h">12-hour (e.g., 2:30 PM)</SelectItem>
                      <SelectItem value="24h">24-hour (e.g., 14:30)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Button type="submit" disabled={isSavingSettings} className="w-full md:w-auto">
              {isSavingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save All Settings
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  )
}

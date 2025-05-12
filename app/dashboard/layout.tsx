"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Calendar, Star, Settings, List, Home, LogOut, MenuIcon, ImageIcon, ChevronRight, X, User } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, token, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileSidebarOpen(false)
  }, [pathname])

  // Redirect if not logged in
  useEffect(() => {
    if (!user && !token) {
      router.push("/login")
    }
  }, [user, token, router])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  // Helper function to determine if a link is active
  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return pathname === path
    }
    return pathname.startsWith(path)
  }

  // Navigation links based on user type
  const getNavLinks = () => {
    const commonLinks = [
      { href: "/dashboard", label: "Dashboard", icon: Home },
      { href: "/dashboard/reservations", label: "Reservations", icon: Calendar },
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ]

    const customerLinks = [
      { href: "/dashboard/favorites", label: "Favorites", icon: Star },
      { href: "/dashboard/reviews", label: "My Reviews", icon: List },
    ]

    const restaurantLinks = [
      { href: "/dashboard/restaurant-profile", label: "Restaurant Profile", icon: User },
      { href: "/dashboard/menu", label: "Menu Management", icon: MenuIcon },
      { href: "/dashboard/reviews", label: "Reviews", icon: Star },
      { href: "/dashboard/images", label: "Image Gallery", icon: ImageIcon },
    ]

    if (user?.userType === "customer") {
      return [...commonLinks, ...customerLinks]
    } else {
      return [...commonLinks, ...restaurantLinks]
    }
  }

  const navLinks = getNavLinks()

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Mobile Sidebar Toggle */}
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-4 right-4 z-50 md:hidden shadow-lg rounded-full h-12 w-12"
        onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      >
        {isMobileSidebarOpen ? <X className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
      </Button>

      {/* Sidebar - Desktop (always visible) and Mobile (conditionally visible) */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col bg-white dark:bg-gray-800 p-4 shadow-sm">
          <div className="mb-8 flex items-center">
            <Link href="/" className="text-xl font-bold">
              TableReserve
            </Link>
          </div>
          <nav className="space-y-1 flex-1">
            {navLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center rounded-lg px-4 py-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100",
                    isActive(link.href) && "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100",
                  )}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {link.label}
                </Link>
              )
            })}
          </nav>
          <button
            onClick={handleLogout}
            className="flex w-full items-center rounded-lg px-4 py-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100 mt-auto"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 md:p-6">{children}</div>
      </div>
    </div>
  )
}

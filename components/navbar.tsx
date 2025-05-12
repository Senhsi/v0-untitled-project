"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  // Helper function to determine if a link is active
  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === path
    }
    return pathname.startsWith(path)
  }

  // Navigation links configuration
  const navLinks = [
    { href: "/restaurants", label: "Restaurants" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ]

  return (
    <header className="px-4 lg:px-6 h-16 flex items-center border-b sticky top-0 z-50 bg-background">
      <Link className="flex items-center justify-center" href="/">
        <span className="font-bold text-xl">TableReserve</span>
      </Link>
      <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
        <div className="hidden md:flex gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              className={`text-sm font-medium hover:underline underline-offset-4 ${
                isActive(link.href) ? "text-primary underline" : ""
              }`}
              href={link.href}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="hidden md:flex gap-2">
          {user ? (
            <>
              <Link href="/dashboard">
                <Button variant={isActive("/dashboard") ? "default" : "outline"}>Dashboard</Button>
              </Link>
              <Button onClick={handleLogout}>Log Out</Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant={isActive("/login") ? "default" : "outline"}>Log In</Button>
              </Link>
              <Link href="/register">
                <Button variant={isActive("/register") ? "default" : "secondary"}>Sign Up</Button>
              </Link>
            </>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          <span className="sr-only">Toggle menu</span>
        </Button>
      </nav>
      {isMenuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-background border-b z-50 md:hidden">
          <nav className="flex flex-col gap-4 p-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                className={`text-sm font-medium hover:underline underline-offset-4 ${
                  isActive(link.href) ? "text-primary underline" : ""
                }`}
                href={link.href}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 mt-2">
              {user ? (
                <>
                  <Link href="/dashboard">
                    <Button variant={isActive("/dashboard") ? "default" : "outline"} className="w-full">
                      Dashboard
                    </Button>
                  </Link>
                  <Button onClick={handleLogout} className="w-full">
                    Log Out
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant={isActive("/login") ? "default" : "outline"} className="w-full">
                      Log In
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button variant={isActive("/register") ? "default" : "secondary"} className="w-full">
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

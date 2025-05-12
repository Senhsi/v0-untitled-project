"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"

interface BreadcrumbProps {
  homeElement?: React.ReactNode
  separator?: React.ReactNode
  containerClasses?: string
  listClasses?: string
  activeClasses?: string
  capitalizeLinks?: boolean
}

export function Breadcrumb({
  homeElement = <Home className="h-4 w-4" />,
  separator = <ChevronRight className="h-4 w-4" />,
  containerClasses = "flex items-center space-x-2 text-sm text-muted-foreground py-4",
  listClasses = "flex items-center",
  activeClasses = "font-medium text-foreground",
  capitalizeLinks = true,
}: BreadcrumbProps) {
  const paths = usePathname()
  const pathNames = paths.split("/").filter((path) => path)

  return (
    <nav aria-label="Breadcrumb" className={containerClasses}>
      <ol className={listClasses}>
        <li className="flex items-center">
          <Link href="/" className="flex items-center hover:text-foreground">
            {homeElement}
          </Link>
        </li>
        {pathNames.length > 0 && (
          <li className="flex items-center mx-2" aria-hidden="true">
            {separator}
          </li>
        )}

        {pathNames.map((link, index) => {
          const isLast = index === pathNames.length - 1
          const href = `/${pathNames.slice(0, index + 1).join("/")}`

          // Format the link text
          let linkText = link.replace(/-/g, " ")
          if (capitalizeLinks) {
            linkText = linkText
              .split(" ")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")
          }

          return (
            <li key={index} className="flex items-center">
              {isLast ? (
                <span className={activeClasses}>{linkText}</span>
              ) : (
                <>
                  <Link href={href} className="hover:text-foreground">
                    {linkText}
                  </Link>
                  <span className="mx-2" aria-hidden="true">
                    {separator}
                  </span>
                </>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

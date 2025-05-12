"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/components/ui/use-toast"

interface FetchOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE"
  body?: any
  headers?: Record<string, string>
  requireAuth?: boolean
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
}

interface ApiResponse<T> {
  data: T | null
  error: Error | null
  isLoading: boolean
  isError: boolean
  refetch: () => Promise<void>
}

export function useApi<T = any>(url: string, options: FetchOptions = {}): ApiResponse<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const { user, token } = useAuth()
  const { toast } = useToast()

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Check if authentication is required but user is not logged in
      if (options.requireAuth && (!user || !token)) {
        throw new Error("Authentication required")
      }

      // Prepare headers
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...options.headers,
      }

      // Add authorization header if token exists
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      // Prepare request options
      const fetchOptions: RequestInit = {
        method: options.method || "GET",
        headers,
      }

      // Add body for non-GET requests
      if (options.method !== "GET" && options.body) {
        if (options.body instanceof FormData) {
          // Remove Content-Type header for FormData (browser will set it with boundary)
          delete headers["Content-Type"]
          fetchOptions.body = options.body
        } else {
          fetchOptions.body = JSON.stringify(options.body)
        }
      }

      // Make the request
      const response = await fetch(url, fetchOptions)

      // Handle non-2xx responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Request failed with status ${response.status}`)
      }

      // Parse response
      const responseData = await response.json()
      setData(responseData)

      // Call onSuccess callback if provided
      if (options.onSuccess) {
        options.onSuccess(responseData)
      }
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(err.message || "An unknown error occurred"))

      // Show toast notification for errors
      toast({
        title: "Error",
        description: err.message || "An error occurred while fetching data",
        variant: "destructive",
      })

      // Call onError callback if provided
      if (options.onError) {
        options.onError(err)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch data on mount or when dependencies change
  useEffect(() => {
    fetchData()
  }, [url, options.method, JSON.stringify(options.body)])

  return {
    data,
    error,
    isLoading,
    isError: error !== null,
    refetch: fetchData,
  }
}

// Mutation hook for POST, PUT, DELETE operations
export function useMutation<T = any, D = any>(url: string, method: "POST" | "PUT" | "DELETE" = "POST") {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const { user, token } = useAuth()
  const { toast } = useToast()

  const mutate = async (body?: D): Promise<T | null> => {
    try {
      setIsLoading(true)
      setError(null)

      // Check if user is logged in
      if (!user || !token) {
        throw new Error("Authentication required")
      }

      // Prepare headers
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      }

      // Prepare request options
      const fetchOptions: RequestInit = {
        method,
        headers,
      }

      // Add body if provided
      if (body) {
        if (body instanceof FormData) {
          // Remove Content-Type header for FormData
          delete headers["Content-Type"]
          fetchOptions.body = body
        } else {
          fetchOptions.body = JSON.stringify(body)
        }
      }

      // Make the request
      const response = await fetch(url, fetchOptions)

      // Handle non-2xx responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Request failed with status ${response.status}`)
      }

      // Parse response
      const responseData = await response.json()
      setData(responseData)

      // Show success toast
      toast({
        title: "Success",
        description: "Operation completed successfully",
      })

      return responseData
    } catch (err: any) {
      const errorObj = err instanceof Error ? err : new Error(err.message || "An unknown error occurred")
      setError(errorObj)

      // Show toast notification for errors
      toast({
        title: "Error",
        description: err.message || "An error occurred",
        variant: "destructive",
      })

      return null
    } finally {
      setIsLoading(false)
    }
  }

  return {
    mutate,
    data,
    error,
    isLoading,
    isError: error !== null,
  }
}

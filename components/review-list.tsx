"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Star, ThumbsUp, Flag, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp, Filter } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useApi, useMutation } from "@/hooks/use-api"

interface Review {
  _id: string
  restaurantId: string
  customerId: string
  customerName: string
  rating: number
  comment: string
  date: Date
  status: "pending" | "approved" | "rejected"
  images?: string[]
  reply?: string
  helpful: number
  reportCount: number
}

interface ReviewListProps {
  restaurantId: string
  isOwner?: boolean // Pass true if the current user is the restaurant owner
}

export function ReviewList({ restaurantId, isOwner = false }: ReviewListProps) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("all")
  const [openReportDialog, setOpenReportDialog] = useState(false)
  const [reportReason, setReportReason] = useState("")
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [sortOption, setSortOption] = useState("date")
  const [sortOrder, setSortOrder] = useState("desc")
  const [expandedImages, setExpandedImages] = useState<string | null>(null)

  // Fetch reviews with our custom hook
  const {
    data: reviews = [],
    isLoading,
    refetch,
  } = useApi<Review[]>(
    `/api/reviews?restaurantId=${restaurantId}&status=${isOwner ? "" : "approved"}&sortBy=${sortOption}&sortOrder=${sortOrder}`,
    {
      onSuccess: (data) => {
        // Format the dates
        return data.map((review: any) => ({
          ...review,
          date: new Date(review.date),
        }))
      },
    },
  )

  // Mutations
  const { mutate: markHelpful } = useMutation(`/api/reviews/${selectedReview?._id}/helpful`)
  const { mutate: reportReview } = useMutation(`/api/reviews/${selectedReview?._id}/report`)
  const { mutate: moderateReview } = useMutation(`/api/reviews/${selectedReview?._id}/moderate`)
  const { mutate: replyToReview } = useMutation(`/api/reviews/${replyingTo}`)

  // Filter reviews based on active tab
  const getFilteredReviews = () => {
    let filtered = [...reviews]

    switch (activeTab) {
      case "recent":
        filtered = [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        break
      case "highest":
        filtered = [...filtered].sort((a, b) => b.rating - a.rating)
        break
      case "lowest":
        filtered = [...filtered].sort((a, b) => a.rating - b.rating)
        break
      case "helpful":
        filtered = [...filtered].sort((a, b) => b.helpful - a.helpful)
        break
      case "pending":
        filtered = filtered.filter((review) => review.status === "pending")
        break
      case "approved":
        filtered = filtered.filter((review) => review.status === "approved")
        break
      case "rejected":
        filtered = filtered.filter((review) => review.status === "rejected")
        break
      default:
        // Keep the default sorting
        break
    }

    return filtered
  }

  const filteredReviews = getFilteredReviews()

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  const handleSortChange = (value: string) => {
    setSortOption(value)
  }

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
  }

  const handleMarkHelpful = async (reviewId: string) => {
    if (!user) {
      return
    }

    setSelectedReview(reviews.find((r) => r._id === reviewId) || null)
    await markHelpful({})
    refetch()
  }

  const handleReportClick = (review: Review) => {
    if (!user) {
      return
    }

    setSelectedReview(review)
    setReportReason("")
    setOpenReportDialog(true)
  }

  const handleReportSubmit = async () => {
    if (!selectedReview || !reportReason.trim()) {
      return
    }

    await reportReview({ reason: reportReason })
    setOpenReportDialog(false)
    refetch()
  }

  const handleModerateReview = async (reviewId: string, status: "approved" | "rejected") => {
    setSelectedReview(reviews.find((r) => r._id === reviewId) || null)
    await moderateReview({ status })
    refetch()
  }

  const handleReplyClick = (reviewId: string, existingReply?: string) => {
    setReplyingTo(reviewId)
    setReplyContent(existingReply || "")
  }

  const handleSubmitReply = async () => {
    if (!replyingTo || !replyContent.trim()) {
      return
    }

    await replyToReview({ reply: replyContent })
    setReplyingTo(null)
    setReplyContent("")
    refetch()
  }

  const handleExpandImage = (imageUrl: string) => {
    setExpandedImages(imageUrl)
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className={`h-4 w-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
        ))}
      </div>
    )
  }

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="flex items-center">
            <Clock className="mr-1 h-3 w-3" /> Pending Review
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="outline" className="text-green-600 border-green-600 flex items-center">
            <CheckCircle2 className="mr-1 h-3 w-3" /> Approved
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="text-red-600 border-red-600 flex items-center">
            <XCircle className="mr-1 h-3 w-3" /> Rejected
          </Badge>
        )
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-6 w-40" />
          <div className="flex items-center space-x-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-9" />
          </div>
        </div>

        <Skeleton className="h-10 w-full mb-6" />

        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-24" />
              </div>
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-3" />
              <div className="flex justify-between">
                <div className="flex space-x-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h3 className="text-xl font-semibold mb-4">
          Customer Reviews
          {reviews.length > 0 && (
            <span className="text-muted-foreground text-sm font-normal ml-2">({reviews.length})</span>
          )}
        </h3>

        <div className="flex items-center space-x-2 mb-4 sm:mb-0">
          <Select value={sortOption} onValueChange={handleSortChange}>
            <SelectTrigger className="h-8 w-[140px]">
              <Filter className="h-3.5 w-3.5 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
              <SelectItem value="helpful">Helpful</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" onClick={toggleSortOrder}>
            {sortOrder === "desc" ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="highest">Highest Rating</TabsTrigger>
          <TabsTrigger value="lowest">Lowest Rating</TabsTrigger>
          <TabsTrigger value="helpful">Most Helpful</TabsTrigger>
          {isOwner && (
            <>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value={activeTab} className="pt-4">
          {filteredReviews.length > 0 ? (
            <div className="space-y-4">
              {filteredReviews.map((review) => (
                <Card key={review._id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium">{review.customerName}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(review.date).toLocaleDateString()}
                        </div>
                      </div>
                      {isOwner && renderStatusBadge(review.status)}
                    </div>

                    <div className="flex items-center mb-3">{renderStars(review.rating)}</div>

                    <p className="mb-3">{review.comment}</p>

                    {/* Review images */}
                    {review.images && review.images.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {review.images.map((image, index) => (
                          <img
                            key={index}
                            src={image || "/placeholder.svg"}
                            alt={`Review from ${review.customerName}`}
                            className="h-16 w-16 object-cover rounded-md cursor-pointer"
                            onClick={() => handleExpandImage(image)}
                          />
                        ))}
                      </div>
                    )}

                    {/* Review actions */}
                    <div className="flex justify-between items-center">
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkHelpful(review._id)}
                          disabled={!user || user.userType !== "customer"}
                          className="text-xs"
                        >
                          <ThumbsUp className="h-3.5 w-3.5 mr-1" />
                          Helpful {review.helpful > 0 && `(${review.helpful})`}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReportClick(review)}
                          disabled={!user || user.userType !== "customer"}
                          className="text-xs"
                        >
                          <Flag className="h-3.5 w-3.5 mr-1" />
                          Report
                        </Button>
                      </div>

                      {/* Owner moderation actions */}
                      {isOwner && (
                        <div className="flex space-x-2">
                          {review.status === "pending" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleModerateReview(review._id, "approved")}
                                className="text-xs"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                Approve
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleModerateReview(review._id, "rejected")}
                                className="text-xs text-red-600 border-red-600"
                              >
                                <XCircle className="h-3.5 w-3.5 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}

                          <Button
                            variant={review.reply ? "outline" : "secondary"}
                            size="sm"
                            onClick={() => handleReplyClick(review._id, review.reply)}
                            className="text-xs"
                          >
                            {review.reply ? "Edit Reply" : "Reply"}
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Owner's reply */}
                    {review.reply && (
                      <div className="mt-3 p-3 bg-muted rounded-md">
                        <div className="text-sm font-medium mb-1">Owner's Response:</div>
                        <p className="text-sm">{review.reply}</p>
                      </div>
                    )}

                    {/* Reply form */}
                    {replyingTo === review._id && (
                      <div className="mt-3 p-3 border rounded-md">
                        <Label htmlFor="reply" className="text-sm font-medium mb-1">
                          Your Reply:
                        </Label>
                        <Textarea
                          id="reply"
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="Write your response to this review..."
                          className="mt-1 mb-2"
                          rows={3}
                        />
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="sm" onClick={() => setReplyingTo(null)}>
                            Cancel
                          </Button>
                          <Button size="sm" onClick={handleSubmitReply}>
                            Submit Reply
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No reviews found</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Report Dialog */}
      <Dialog open={openReportDialog} onOpenChange={setOpenReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Review</DialogTitle>
            <DialogDescription>
              Please provide a reason for reporting this review. Our moderators will review your report.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reportReason">Reason for reporting</Label>
              <Textarea
                id="reportReason"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Please explain why this review should be removed..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenReportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleReportSubmit}>Submit Report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Expanded Image Dialog */}
      <Dialog open={!!expandedImages} onOpenChange={(open) => !open && setExpandedImages(null)}>
        <DialogContent className="max-w-3xl">
          <div className="flex justify-center">
            <img
              src={expandedImages || "/placeholder.svg"}
              alt="Review image"
              className="max-h-[70vh] object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

'use client'

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Calendar, Clock, Package, Briefcase, User, Mail, Phone, Shield, CreditCard, FileText, CheckCircle, XCircle, Play, CheckCheck, Loader2 } from "lucide-react"

type BookingStatus =
  | "rfq"
  | "quoted"
  | "quote_accepted"
  | "quote_rejected"
  | "payment_pending"
  | "booked"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "dispute"
  | "refunded"
  | string

interface BookingDetail {
  _id: string
  bookingType: "professional" | "project"
  status: BookingStatus
  rfqData?: {
    serviceType?: string
    description?: string
    preferredStartDate?: string
    urgency?: "low" | "medium" | "high" | "urgent"
    budget?: {
      min?: number
      max?: number
      currency?: string
    }
  }
  quote?: {
    amount?: number
    currency?: string
    description?: string
    breakdown?: Array<{ item: string; amount: number }>
    validUntil?: string
    termsAndConditions?: string
    estimatedDuration?: string
    submittedAt?: string
  }
  scheduledStartDate?: string
  scheduledEndDate?: string
  createdAt?: string
  updatedAt?: string
  project?: {
    _id: string
    title?: string
    category?: string
    service?: string
    description?: string
  }
  professional?: {
    _id: string
    name?: string
    email?: string
    phone?: string
    businessInfo?: {
      companyName?: string
    }
  }
  customer?: {
    _id: string
    name?: string
    email?: string
    phone?: string
    customerType?: string
  }
}

const DETAIL_STATUS_STYLES: Record<string, string> = {
  rfq: "bg-indigo-50 text-indigo-700 border border-indigo-100",
  quoted: "bg-blue-50 text-blue-700 border border-blue-100",
  quote_accepted: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  payment_pending: "bg-amber-50 text-amber-700 border border-amber-100",
  booked: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  in_progress: "bg-sky-50 text-sky-700 border border-sky-100",
  completed: "bg-teal-50 text-teal-700 border border-teal-100",
  cancelled: "bg-rose-50 text-rose-700 border border-rose-100",
  refunded: "bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-100",
  dispute: "bg-red-50 text-red-700 border border-red-100",
}

const formatCurrencyRange = (booking: BookingDetail): string | null => {
  const budget = booking.rfqData?.budget
  if (!budget || (budget.min == null && budget.max == null)) return null

  const currency = budget.currency || "€"
  if (budget.min != null && budget.max != null && budget.min !== budget.max) {
    return `${currency}${budget.min.toLocaleString()} – ${currency}${budget.max.toLocaleString()}`
  }
  const value = budget.min ?? budget.max
  if (value == null) return null
  return `${currency}${value.toLocaleString()}`
}

export default function BookingDetailPage() {
  const { user, isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const bookingId = (params?.id || params?.bookingId) as string | undefined

  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showQuoteForm, setShowQuoteForm] = useState(false)
  const [quoteAmount, setQuoteAmount] = useState("")
  const [quoteDescription, setQuoteDescription] = useState("")
  const [submittingQuote, setSubmittingQuote] = useState(false)
  const [respondingToQuote, setRespondingToQuote] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login?redirect=/dashboard")
    }
  }, [isAuthenticated, loading, router])

  useEffect(() => {
    if (!bookingId || !isAuthenticated) return

    const fetchBooking = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/bookings/${bookingId}`,
          { credentials: "include" }
        )
        const data = await response.json()

        if (response.ok && data.success) {
          setBooking(data.booking)
        } else {
          setError(data.msg || "Failed to load booking details.")
        }
      } catch (err) {
        console.error("Failed to fetch booking:", err)
        setError("Failed to load booking details.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchBooking()
  }, [bookingId, isAuthenticated])

  const handleSubmitQuote = async () => {
    if (!quoteAmount || parseFloat(quoteAmount) <= 0) {
      alert("Please enter a valid quote amount")
      return
    }

    setSubmittingQuote(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/bookings/${bookingId}/quote`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            amount: parseFloat(quoteAmount),
            currency: "EUR",
            description: quoteDescription || "Quote for your booking request"
          })
        }
      )

      const data = await response.json()
      if (response.ok && data.success) {
        alert("Quote submitted successfully!")
        setShowQuoteForm(false)
        // Refresh booking data
        window.location.reload()
      } else {
        alert(data.msg || "Failed to submit quote")
      }
    } catch (err) {
      console.error("Error submitting quote:", err)
      alert("Failed to submit quote. Please try again.")
    } finally {
      setSubmittingQuote(false)
    }
  }

  const handleRespondToQuote = async (action: "accept" | "reject") => {
    setRespondingToQuote(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/bookings/${bookingId}/respond`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ action })
        }
      )

      const data = await response.json()
      if (response.ok && data.success) {
        if (action === "accept") {
          alert("Quote accepted! Redirecting to payment...")
          router.push(`/bookings/${bookingId}/payment`)
        } else {
          alert("Quote rejected")
          window.location.reload()
        }
      } else {
        alert(data.msg || `Failed to ${action} quote`)
      }
    } catch (err) {
      console.error(`Error ${action}ing quote:`, err)
      alert(`Failed to ${action} quote. Please try again.`)
    } finally {
      setRespondingToQuote(false)
    }
  }

  const handleUpdateStatus = async (newStatus: BookingStatus, confirmMessage?: string) => {
    if (confirmMessage && !confirm(confirmMessage)) {
      return
    }

    setUpdatingStatus(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/bookings/${bookingId}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status: newStatus })
        }
      )

      const data = await response.json()
      if (response.ok && data.success) {
        // Show success message based on status
        if (newStatus === "completed") {
          alert("✅ Booking marked as completed!\n\nPayment has been transferred to the professional.\nFunds will arrive in the professional's bank account within 2-7 business days.")
        } else if (newStatus === "in_progress") {
          alert("✅ Work started! Good luck with the project.")
        }

        // Reload to show updated status
        window.location.reload()
      } else {
        const errorMsg = data.error?.message || data.msg || `Failed to update booking status`
        alert(`❌ Error: ${errorMsg}`)
      }
    } catch (err) {
      console.error("Error updating status:", err)
      alert("❌ Failed to update booking status. Please try again.")
    } finally {
      setUpdatingStatus(false)
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500 mx-auto" />
          <p className="mt-4 text-gray-600 text-sm">Loading booking details...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto pt-20 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">
              Booking details
            </h1>
            <p className="text-sm text-gray-600">
              See all the information about this booking.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="bg-white/80 backdrop-blur border-indigo-100 hover:border-indigo-300"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        {error && (
          <Card className="bg-rose-50 border border-rose-100">
            <CardContent className="py-4 text-sm text-rose-700">
              {error}
            </CardContent>
          </Card>
        )}

        {!error && booking && (
          <div className="bg-gradient-to-r from-pink-100 via-purple-100 to-blue-100 rounded-2xl p-[1px]">
            <Card className="bg-white/90 backdrop-blur rounded-[1rem] shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {booking.bookingType === "project" ? (
                        <Package className="h-5 w-5 text-indigo-500" />
                      ) : (
                        <Briefcase className="h-5 w-5 text-indigo-500" />
                      )}
                      <CardTitle className="text-lg text-gray-900">
                        {booking.project?.title ||
                          booking.professional?.businessInfo?.companyName ||
                          booking.rfqData?.serviceType ||
                          "Booking"}
                      </CardTitle>
                    </div>
                    <CardDescription className="text-xs text-gray-500">
                      {booking.bookingType === "project"
                        ? "Project booking"
                        : "Professional booking"}
                    </CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs font-medium capitalize rounded-full px-2.5 py-1 ${
                      DETAIL_STATUS_STYLES[booking.status] ||
                      "bg-slate-50 text-slate-700 border border-slate-100"
                    }`}
                  >
                    {booking.status.replace(/_/g, " ")}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-6">
                {/* Payment Action - Show when quote is accepted but not yet paid (CUSTOMER ONLY) */}
                {user?.role === 'customer' && (booking.status === 'quote_accepted' || booking.status === 'payment_pending') && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-blue-900 mb-1">
                          Payment Required
                        </h3>
                        <p className="text-xs text-blue-700">
                          Your quote has been accepted. Please proceed with payment to confirm your booking.
                        </p>
                      </div>
                      <Button
                        onClick={() => router.push(`/bookings/${booking._id}/payment`)}
                        className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                        size="sm"
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pay Now
                      </Button>
                    </div>
                  </div>
                )}

                {/* Professional: Quote Accepted - Waiting for Payment */}
                {user?.role === 'professional' && (booking.status === 'quote_accepted' || booking.status === 'payment_pending') && (
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-semibold text-amber-900 mb-1">
                          Quote Accepted - Awaiting Payment
                        </h3>
                        <p className="text-xs text-amber-700">
                          The customer has accepted your quote. Once they complete payment, you&apos;ll be notified to begin work.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Professional: Submit Quote (when status is RFQ) */}
                {user?.role === 'professional' && booking.status === 'rfq' && (
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4">
                    {!showQuoteForm ? (
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-sm font-semibold text-purple-900 mb-1">
                            Quote Requested
                          </h3>
                          <p className="text-xs text-purple-700">
                            The customer is waiting for your quote. Please review the requirements and submit your quote.
                          </p>
                        </div>
                        <Button
                          onClick={() => setShowQuoteForm(true)}
                          className="bg-purple-600 hover:bg-purple-700 text-white shrink-0"
                          size="sm"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Submit Quote
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-purple-900">Submit Your Quote</h3>
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="quoteAmount" className="text-xs">Quote Amount (EUR) *</Label>
                            <Input
                              id="quoteAmount"
                              type="number"
                              placeholder="1500"
                              value={quoteAmount}
                              onChange={(e) => setQuoteAmount(e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="quoteDescription" className="text-xs">Description (Optional)</Label>
                            <Textarea
                              id="quoteDescription"
                              placeholder="Brief description of what's included..."
                              value={quoteDescription}
                              onChange={(e) => setQuoteDescription(e.target.value)}
                              className="mt-1"
                              rows={3}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={handleSubmitQuote}
                              disabled={submittingQuote}
                              className="bg-purple-600 hover:bg-purple-700 text-white"
                              size="sm"
                            >
                              {submittingQuote ? "Submitting..." : "Submit Quote"}
                            </Button>
                            <Button
                              onClick={() => setShowQuoteForm(false)}
                              variant="outline"
                              size="sm"
                              disabled={submittingQuote}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Customer: Quote Ready - Accept/Reject */}
                {user?.role === 'customer' && booking.status === 'quoted' && booking.quote && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-green-900 mb-3">Quote Received</h3>
                    <div className="bg-white rounded-lg p-4 mb-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Quote Amount:</span>
                        <span className="text-2xl font-bold text-green-600">
                          {booking.quote.currency || '€'}{booking.quote.amount?.toLocaleString()}
                        </span>
                      </div>
                      {booking.quote.description && (
                        <div className="pt-2 border-t">
                          <p className="text-xs text-gray-600 mb-1">Description:</p>
                          <p className="text-sm text-gray-800">{booking.quote.description}</p>
                        </div>
                      )}
                      {booking.quote.submittedAt && (
                        <p className="text-xs text-gray-500 pt-2">
                          Submitted: {new Date(booking.quote.submittedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleRespondToQuote("accept")}
                        disabled={respondingToQuote}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {respondingToQuote ? "Processing..." : "Accept & Pay"}
                      </Button>
                      <Button
                        onClick={() => handleRespondToQuote("reject")}
                        disabled={respondingToQuote}
                        variant="outline"
                        className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                        size="sm"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                )}

                {/* Professional: Start Work (when status is booked) */}
                {user?.role === 'professional' && booking.status === 'booked' && (
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-blue-900 mb-1">
                          Ready to Start Work
                        </h3>
                        <p className="text-xs text-blue-700">
                          Payment has been authorized and is held in escrow. Click below to mark the work as started.
                        </p>
                      </div>
                      <Button
                        onClick={() => handleUpdateStatus("in_progress")}
                        disabled={updatingStatus}
                        className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                        size="sm"
                      >
                        {updatingStatus ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Starting...
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Start Work
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Professional: Customer must confirm completion */}
                {user?.role === 'professional' && booking.status === 'in_progress' && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-green-900 mb-1">
                          Waiting for customer confirmation
                        </h3>
                        <p className="text-xs text-green-700 mb-2">
                          Finish the work and notify your customer. Only they can confirm completion and release the payment from escrow.
                        </p>
                        <p className="text-xs text-green-600 font-medium">
                          Funds stay protected until the customer marks the booking as completed.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {/* Customer: Confirm Work Completion (when status is in_progress) */}
                {user?.role === 'customer' && booking.status === 'in_progress' && (
                  <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-teal-900 mb-1">
                          Work In Progress
                        </h3>
                        <p className="text-xs text-teal-700 mb-2">
                          The professional is currently working on your request. Once they complete the work, you can confirm completion.
                        </p>
                        <p className="text-xs text-teal-600 font-medium">
                          💰 Payment will be released from escrow when you confirm completion
                        </p>
                      </div>
                      <Button
                        onClick={() => handleUpdateStatus(
                          "completed",
                          "Are you satisfied with the work?\n\n✅ This will release the payment from escrow to the professional."
                        )}
                        disabled={updatingStatus}
                        className="bg-teal-600 hover:bg-teal-700 text-white shrink-0"
                        size="sm"
                      >
                        {updatingStatus ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCheck className="h-4 w-4 mr-2" />
                            Confirm Complete
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Both: Work Completed */}
                {booking.status === 'completed' && (
                  <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-6 w-6 text-emerald-600 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-semibold text-emerald-900 mb-1">
                          ✅ Work Completed
                        </h3>
                        <p className="text-xs text-emerald-700">
                          This booking has been marked as completed. Payment has been transferred to the professional.
                        </p>
                        {user?.role === 'professional' && (
                          <p className="text-xs text-emerald-600 font-medium mt-2">
                            💰 Funds will arrive in your bank account within 2-7 business days
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Core info */}
                <section className="grid md:grid-cols-2 gap-4 text-xs text-gray-700">
                  {booking.createdAt && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span>
                        Requested on{" "}
                        <span className="font-medium">
                          {new Date(booking.createdAt).toLocaleString()}
                        </span>
                      </span>
                    </div>
                  )}
                  {booking.rfqData?.preferredStartDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-indigo-500" />
                      <span>
                        Preferred start:{" "}
                        <span className="font-medium">
                          {new Date(booking.rfqData.preferredStartDate).toLocaleDateString()}
                        </span>
                      </span>
                    </div>
                  )}
                  {booking.scheduledStartDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-emerald-500" />
                      <span>
                        Scheduled start:{" "}
                        <span className="font-medium">
                          {new Date(booking.scheduledStartDate).toLocaleDateString()}
                        </span>
                      </span>
                    </div>
                  )}
                  {booking.scheduledEndDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-emerald-500" />
                      <span>
                        Scheduled end:{" "}
                        <span className="font-medium">
                          {new Date(booking.scheduledEndDate).toLocaleDateString()}
                        </span>
                      </span>
                    </div>
                  )}
                  {booking.rfqData?.urgency && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-amber-500" />
                      <span className="capitalize">
                        Urgency:{" "}
                        <span className="font-medium">
                          {booking.rfqData.urgency}
                        </span>
                      </span>
                    </div>
                  )}
                  {formatCurrencyRange(booking) && (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-semibold">
                        €
                      </span>
                      <span>
                        Budget:{" "}
                        <span className="font-medium">
                          {formatCurrencyRange(booking)}
                        </span>
                      </span>
                    </div>
                  )}
                </section>

                {/* Description */}
                {booking.rfqData?.description && (
                  <section className="space-y-2">
                    <h2 className="text-sm font-semibold text-gray-900">
                      Request details
                    </h2>
                    <p className="text-xs leading-relaxed text-gray-700 whitespace-pre-line">
                      {booking.rfqData.description}
                    </p>
                  </section>
                )}

                {/* Parties */}
                <section className="grid md:grid-cols-2 gap-4">
                  {booking.customer && (
                    <Card className="bg-slate-50/60 border border-slate-100">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-xs">
                          <User className="h-4 w-4 text-slate-600" />
                          Customer
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-1 text-xs text-gray-700">
                        {booking.customer.name && (
                          <div className="flex items-center gap-2">
                            <Shield className="h-3 w-3 text-gray-400" />
                            <span>{booking.customer.name}</span>
                          </div>
                        )}
                        {booking.customer.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3 text-gray-400" />
                            <span>{booking.customer.email}</span>
                          </div>
                        )}
                        {booking.customer.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span>{booking.customer.phone}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {(booking.professional || booking.project) && (
                    <Card className="bg-slate-50/60 border border-slate-100">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-xs">
                          {booking.bookingType === "project" ? (
                            <Package className="h-4 w-4 text-slate-600" />
                          ) : (
                            <Briefcase className="h-4 w-4 text-slate-600" />
                          )}
                          Service provider
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-1 text-xs text-gray-700">
                        {booking.bookingType === "project" && booking.project && (
                          <>
                            {booking.project.title && (
                              <div className="flex items-center gap-2">
                                <Shield className="h-3 w-3 text-gray-400" />
                                <span>{booking.project.title}</span>
                              </div>
                            )}
                            {booking.project.service && (
                              <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-indigo-400" />
                                <span className="text-[11px] text-gray-600">
                                  {booking.project.service}
                                </span>
                              </div>
                            )}
                          </>
                        )}

                        {booking.bookingType === "professional" && booking.professional && (
                          <>
                            {booking.professional.businessInfo?.companyName && (
                              <div className="flex items-center gap-2">
                                <Shield className="h-3 w-3 text-gray-400" />
                                <span>{booking.professional.businessInfo.companyName}</span>
                              </div>
                            )}
                            {booking.professional.name && (
                              <div className="flex items-center gap-2">
                                <User className="h-3 w-3 text-gray-400" />
                                <span>{booking.professional.name}</span>
                              </div>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </section>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}


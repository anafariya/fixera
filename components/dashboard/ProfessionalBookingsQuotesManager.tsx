'use client'

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { getAuthToken } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Briefcase, Calendar, Clock, FileText, Package, RefreshCw } from "lucide-react"

type ManagerMode = "bookings" | "quotes"

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

interface Booking {
  _id: string
  bookingType: "professional" | "project"
  status: BookingStatus
  customer?: {
    _id: string
    name?: string
  }
  rfqData?: {
    serviceType?: string
  }
  createdAt?: string
  project?: {
    _id: string
    title?: string
  }
  professional?: {
    _id: string
    businessInfo?: {
      companyName?: string
    }
  }
}

const BOOKING_STATUS_STYLES: Record<string, string> = {
  rfq: "bg-indigo-50 text-indigo-700 border border-indigo-100",
  quoted: "bg-blue-50 text-blue-700 border border-blue-100",
  quote_accepted: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  quote_rejected: "bg-rose-50 text-rose-700 border border-rose-100",
  payment_pending: "bg-amber-50 text-amber-700 border border-amber-100",
  booked: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  in_progress: "bg-sky-50 text-sky-700 border border-sky-100",
  completed: "bg-teal-50 text-teal-700 border border-teal-100",
  cancelled: "bg-rose-50 text-rose-700 border border-rose-100",
  refunded: "bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-100",
  dispute: "bg-red-50 text-red-700 border border-red-100",
  unknown: "bg-slate-50 text-slate-700 border border-slate-100",
}

const QUOTE_STATUSES = new Set<BookingStatus>(["rfq", "quoted", "quote_accepted", "quote_rejected"])
const QUOTE_FINISHED_STATUSES = new Set<BookingStatus>(["quote_accepted", "quote_rejected"])
const BOOKING_FINISHED_STATUSES = new Set<BookingStatus>(["completed", "cancelled", "refunded"])

const getBookingStatusMeta = (status?: BookingStatus) => {
  const rawStatus = status || "unknown"
  return {
    label: rawStatus.replace(/_/g, " "),
    className: BOOKING_STATUS_STYLES[rawStatus] || BOOKING_STATUS_STYLES.unknown,
  }
}

const getBookingTitle = (booking: Booking) => {
  const isProject = booking.bookingType === "project"
  return (
    (isProject ? booking.project?.title : booking.professional?.businessInfo?.companyName) ||
    booking.rfqData?.serviceType ||
    "Booking"
  )
}

interface ProfessionalBookingsQuotesManagerProps {
  mode: ManagerMode
}

export default function ProfessionalBookingsQuotesManager({ mode }: ProfessionalBookingsQuotesManagerProps) {
  const router = useRouter()
  const { user, isAuthenticated, loading: authLoading } = useAuth()

  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const pageCopy = mode === "bookings"
    ? {
      title: "Manage Bookings",
      description: "View all pending and finished bookings.",
      pendingTitle: "Pending Bookings",
      finishedTitle: "Finished Bookings",
      empty: "No bookings found.",
    }
    : {
      title: "Manage Quotes",
      description: "View all pending and finished quotes.",
      pendingTitle: "Pending Quotes",
      finishedTitle: "Finished Quotes",
      empty: "No quotes found.",
    }

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      const redirect = mode === "bookings" ? "/dashboard/bookings" : "/dashboard/quotes"
      router.push(`/login?redirect=${encodeURIComponent(redirect)}`)
    }
  }, [authLoading, isAuthenticated, mode, router])

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role && user.role !== "professional") {
      router.push("/dashboard")
    }
  }, [authLoading, isAuthenticated, router, user?.role])

  const fetchBookings = useCallback(async () => {
    if (!isAuthenticated || user?.role !== "professional") return

    setIsLoading(true)
    setError(null)

    try {
      const token = getAuthToken()
      const headers: Record<string, string> = {}
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/bookings/my-bookings?limit=100`,
        { credentials: "include", headers }
      )
      const data = await response.json()

      if (response.ok && data.success) {
        setBookings(data.bookings || [])
      } else {
        setError(data.msg || "Failed to load bookings.")
      }
    } catch (fetchError) {
      console.error("Failed to fetch bookings:", fetchError)
      setError("Failed to load bookings.")
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, user?.role])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  const relevantBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const isQuote = QUOTE_STATUSES.has(booking.status)
      return mode === "quotes" ? isQuote : !isQuote
    })
  }, [bookings, mode])

  const pendingBookings = useMemo(() => {
    return relevantBookings.filter((booking) => {
      if (mode === "quotes") {
        return !QUOTE_FINISHED_STATUSES.has(booking.status)
      }
      return !BOOKING_FINISHED_STATUSES.has(booking.status)
    })
  }, [mode, relevantBookings])

  const finishedBookings = useMemo(() => {
    return relevantBookings.filter((booking) => {
      if (mode === "quotes") {
        return QUOTE_FINISHED_STATUSES.has(booking.status)
      }
      return BOOKING_FINISHED_STATUSES.has(booking.status)
    })
  }, [mode, relevantBookings])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-3 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || user?.role !== "professional") {
    return null
  }

  const renderBookingList = (items: Booking[], emptyLabel: string) => {
    if (items.length === 0) {
      return <p className="text-sm text-gray-500 py-6 text-center">{emptyLabel}</p>
    }

    return (
      <div className="space-y-3">
        {items.map((booking) => {
          const isProject = booking.bookingType === "project"
          const { label, className } = getBookingStatusMeta(booking.status)
          const createdAt = booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : null

          return (
            <div
              key={booking._id}
              className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {isProject ? (
                      <Package className="h-4 w-4 text-indigo-500 shrink-0" />
                    ) : (
                      <Briefcase className="h-4 w-4 text-indigo-500 shrink-0" />
                    )}
                    <h3 className="font-semibold text-sm text-gray-900 truncate">
                      {getBookingTitle(booking)}
                    </h3>
                  </div>
                  <div className="text-xs text-gray-600 flex flex-wrap gap-3">
                    <span>Customer: {booking.customer?.name || "Unknown"}</span>
                    {createdAt && <span>Created: {createdAt}</span>}
                  </div>
                  <div className="mt-2">
                    <Badge variant="outline" className={`text-xs capitalize ${className}`}>
                      {label}
                    </Badge>
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/bookings/${booking._id}`)}
                    className="text-xs"
                  >
                    View
                  </Button>
                  {mode === "quotes" && booking.status === "rfq" && (
                    <Button
                      size="sm"
                      onClick={() => router.push(`/bookings/${booking._id}`)}
                      className="text-xs bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      Quote
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto pt-20 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <Button variant="outline" onClick={fetchBookings} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-gray-900">{pageCopy.title}</h1>
          <p className="text-gray-600 mt-1">{pageCopy.description}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total</CardDescription>
              <CardTitle>{relevantBookings.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending</CardDescription>
              <CardTitle>{pendingBookings.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Finished</CardDescription>
              <CardTitle>{finishedBookings.length}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {isLoading && (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              Loading...
            </CardContent>
          </Card>
        )}

        {!isLoading && error && (
          <Card className="border border-rose-100 bg-rose-50">
            <CardContent className="py-4 text-sm text-rose-700">
              {error}
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && (
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-amber-600" />
                  {pageCopy.pendingTitle}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderBookingList(pendingBookings, `No pending ${mode}.`)}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5 text-emerald-600" />
                  {pageCopy.finishedTitle}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderBookingList(finishedBookings, `No finished ${mode}.`)}
              </CardContent>
            </Card>
          </div>
        )}

        {!isLoading && !error && relevantBookings.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-gray-500">
              {pageCopy.empty}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

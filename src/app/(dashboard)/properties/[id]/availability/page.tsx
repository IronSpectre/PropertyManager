"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Property {
  id: string;
  name: string;
  smoobuId: string | null;
}

interface Booking {
  id: string;
  smoobuId: string | null;
  guestName: string;
  checkIn: string;
  checkOut: string;
  status: string;
}

export default function AvailabilityPage() {
  const params = useParams();
  const propertyId = params.id as string;

  const [property, setProperty] = useState<Property | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBlocking, setIsBlocking] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedRange, setSelectedRange] = useState<{
    start: string | null;
    end: string | null;
  }>({ start: null, end: null });
  const [blockNote, setBlockNote] = useState("");
  const [showBlockForm, setShowBlockForm] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const propRes = await fetch(`/api/properties/${propertyId}`);
        if (propRes.ok) {
          const propData = await propRes.json();
          setProperty(propData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [propertyId]);

  const fetchBookings = async () => {
    const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 2, 0);

    try {
      const availRes = await fetch(
        `/api/smoobu/availability?propertyId=${propertyId}&startDate=${formatDate(startDate)}&endDate=${formatDate(endDate)}`
      );
      if (availRes.ok) {
        const data = await availRes.json();
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error("Error fetching availability:", error);
    }
  };

  useEffect(() => {
    if (property?.smoobuId) {
      fetchBookings();
    }
  }, [currentMonth, property?.smoobuId]);

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const getBookingForDate = (dateStr: string) => {
    return bookings.find((b) => {
      const checkIn = new Date(b.checkIn);
      const checkOut = new Date(b.checkOut);
      const date = new Date(dateStr);
      return date >= checkIn && date < checkOut;
    });
  };

  const handleDateClick = (dateStr: string) => {
    if (!selectedRange.start) {
      setSelectedRange({ start: dateStr, end: null });
    } else if (!selectedRange.end) {
      if (dateStr < selectedRange.start) {
        setSelectedRange({ start: dateStr, end: selectedRange.start });
      } else {
        setSelectedRange({ ...selectedRange, end: dateStr });
      }
      setShowBlockForm(true);
    } else {
      setSelectedRange({ start: dateStr, end: null });
      setShowBlockForm(false);
    }
  };

  const handleBlock = async () => {
    if (!selectedRange.start || !selectedRange.end) return;

    setIsBlocking(true);
    try {
      const response = await fetch("/api/smoobu/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          startDate: selectedRange.start,
          endDate: selectedRange.end,
          note: blockNote,
        }),
      });

      if (response.ok) {
        await fetchBookings();
        setSelectedRange({ start: null, end: null });
        setBlockNote("");
        setShowBlockForm(false);
      }
    } catch (error) {
      console.error("Error blocking dates:", error);
    } finally {
      setIsBlocking(false);
    }
  };

  const handleUnblock = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/smoobu/availability?bookingId=${bookingId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchBookings();
      }
    } catch (error) {
      console.error("Error unblocking dates:", error);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];

    const startPadding = firstDay.getDay();
    for (let i = startPadding - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push(d);
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    const endPadding = 6 - lastDay.getDay();
    for (let i = 1; i <= endPadding; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  };

  const isInSelectedRange = (dateStr: string) => {
    if (!selectedRange.start) return false;
    if (!selectedRange.end) return dateStr === selectedRange.start;
    return dateStr >= selectedRange.start && dateStr <= selectedRange.end;
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  if (isLoading) {
    return (
      <div className="space-y-10">
        <div>
          <h1 className="text-2xl font-light text-foreground">Availability</h1>
          <p className="text-muted-foreground mt-1">Loading...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="space-y-10">
        <div>
          <h1 className="text-2xl font-light text-foreground">Property Not Found</h1>
        </div>
        <Button asChild>
          <Link href="/properties">Back to Properties</Link>
        </Button>
      </div>
    );
  }

  if (!property.smoobuId) {
    return (
      <div className="space-y-10">
        <div>
          <h1 className="text-2xl font-light text-foreground">Availability</h1>
          <p className="text-muted-foreground mt-1">{property.name}</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              This property is not linked to Smoobu. Add a Smoobu ID to manage availability.
            </p>
            <Button asChild>
              <Link href={`/properties/${property.id}/edit`}>Edit Property</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const days = getDaysInMonth(currentMonth);
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-light text-foreground">Availability</h1>
          <p className="text-muted-foreground mt-1">
            <Link href={`/properties/${property.id}`} className="hover:underline">
              {property.name}
            </Link>
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/properties/${property.id}`}>Back to Property</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>
                {currentMonth.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </CardTitle>
              <CardDescription>
                Click two dates to select a range to block
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={prevMonth}>
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={nextMonth}>
                Next
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
              {days.map((day, index) => {
                const dateStr = formatDate(day);
                const booking = getBookingForDate(dateStr);
                const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                const isToday = formatDate(new Date()) === dateStr;
                const isSelected = isInSelectedRange(dateStr);
                const isBlocked = booking?.guestName === "Blocked";
                const isBooked = booking && !isBlocked;

                return (
                  <button
                    key={index}
                    onClick={() => isCurrentMonth && !isBooked && handleDateClick(dateStr)}
                    className={`
                      p-2 min-h-16 text-left rounded-lg border transition-colors
                      ${isCurrentMonth ? "" : "opacity-40"}
                      ${isBooked ? "bg-red-50 border-red-200 cursor-default" : ""}
                      ${isBlocked ? "bg-gray-100 border-gray-300 cursor-pointer hover:bg-gray-200" : ""}
                      ${!booking && isCurrentMonth ? "hover:bg-muted/50 cursor-pointer" : ""}
                      ${isSelected ? "ring-2 ring-primary bg-primary/10" : ""}
                      ${isToday && !booking ? "bg-primary/5" : ""}
                    `}
                    disabled={!isCurrentMonth || !!isBooked}
                  >
                    <div className="text-sm font-medium">{day.getDate()}</div>
                    {booking && isCurrentMonth && (
                      <div className={`text-xs mt-1 truncate ${isBlocked ? "text-gray-600" : "text-red-600"}`}>
                        {isBlocked ? "Blocked" : booking.guestName}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-50 border border-red-200 rounded"></div>
                <span>Booked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
                <span>Blocked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-primary/10 border border-primary rounded"></div>
                <span>Selected</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {showBlockForm && selectedRange.start && selectedRange.end && (
            <Card>
              <CardHeader>
                <CardTitle>Block Dates</CardTitle>
                <CardDescription>
                  {new Date(selectedRange.start).toLocaleDateString()} —{" "}
                  {new Date(selectedRange.end).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="note">Note (optional)</Label>
                  <Textarea
                    id="note"
                    value={blockNote}
                    onChange={(e) => setBlockNote(e.target.value)}
                    placeholder="Reason for blocking..."
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleBlock}
                    disabled={isBlocking}
                    className="flex-1"
                  >
                    {isBlocking ? "Blocking..." : "Block Dates"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedRange({ start: null, end: null });
                      setShowBlockForm(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Blocked Dates</CardTitle>
              <CardDescription>Click to unblock</CardDescription>
            </CardHeader>
            <CardContent>
              {bookings.filter((b) => b.guestName === "Blocked").length === 0 ? (
                <p className="text-sm text-muted-foreground">No blocked dates</p>
              ) : (
                <div className="space-y-2">
                  {bookings
                    .filter((b) => b.guestName === "Blocked")
                    .map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-2 border rounded-lg"
                      >
                        <div className="text-sm">
                          {new Date(booking.checkIn).toLocaleDateString()} —{" "}
                          {new Date(booking.checkOut).toLocaleDateString()}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnblock(booking.id)}
                        >
                          Unblock
                        </Button>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

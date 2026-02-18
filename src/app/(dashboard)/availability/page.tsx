"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Property {
  id: string;
  name: string;
  dailyRate: number | null;
}

interface Booking {
  id: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  status: string;
}

interface RateData {
  date: string;
  rate: number;
  isCustom: boolean;
}

export default function AvailabilityPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rates, setRates] = useState<RateData[]>([]);
  const [defaultRate, setDefaultRate] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Selection state
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [selectionStart, setSelectionStart] = useState<string | null>(null);

  // Dialog state
  const [isRateDialogOpen, setIsRateDialogOpen] = useState(false);
  const [newRate, setNewRate] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Fetch properties
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await fetch("/api/properties");
        if (response.ok) {
          const data = await response.json();
          setProperties(data);
          if (data.length > 0 && !selectedPropertyId) {
            setSelectedPropertyId(data[0].id);
          }
        }
      } catch {
        console.error("Error fetching properties");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProperties();
  }, []);

  // Fetch bookings and rates when property or month changes
  const fetchData = useCallback(async () => {
    if (!selectedPropertyId) return;

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const startDate = new Date(year, month, 1).toISOString().split("T")[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split("T")[0];

    try {
      const [bookingsRes, ratesRes] = await Promise.all([
        fetch(`/api/bookings?propertyId=${selectedPropertyId}`),
        fetch(`/api/properties/${selectedPropertyId}/rates?startDate=${startDate}&endDate=${endDate}`),
      ]);

      if (bookingsRes.ok) {
        const data = await bookingsRes.json();
        // Filter bookings that overlap with current month
        const startOfMonth = new Date(year, month, 1);
        const endOfMonth = new Date(year, month + 1, 0);
        const monthBookings = data.filter((b: Booking) => {
          const checkIn = new Date(b.checkIn);
          const checkOut = new Date(b.checkOut);
          return checkIn <= endOfMonth && checkOut >= startOfMonth;
        });
        setBookings(monthBookings);
      }

      if (ratesRes.ok) {
        const data = await ratesRes.json();
        setRates(data.rates || []);
        setDefaultRate(data.property?.defaultRate || null);
      }
    } catch {
      console.error("Error fetching data");
    }
  }, [selectedPropertyId, currentMonth]);

  useEffect(() => {
    fetchData();
    setSelectedDates([]);
    setSelectionStart(null);
  }, [fetchData]);

  const selectedProperty = properties.find((p) => p.id === selectedPropertyId);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    setSelectedDates([]);
    setSelectionStart(null);
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    setSelectedDates([]);
    setSelectionStart(null);
  };

  const getBookingForDate = (dateStr: string): Booking | undefined => {
    return bookings.find((b) => {
      const checkIn = new Date(b.checkIn).toISOString().split("T")[0];
      const checkOut = new Date(b.checkOut).toISOString().split("T")[0];
      return dateStr >= checkIn && dateStr < checkOut;
    });
  };

  const getRateForDate = (dateStr: string): RateData | undefined => {
    return rates.find((r) => r.date === dateStr);
  };

  const handleDateClick = (dateStr: string) => {
    const booking = getBookingForDate(dateStr);
    if (booking) return; // Don't select booked dates

    if (!selectionStart) {
      // First click: set as start of selection
      setSelectionStart(dateStr);
      setSelectedDates([dateStr]);
    } else if (selectionStart === dateStr) {
      // Clicked same date again: keep single date selected, ready to set rate
      // Selection is already correct, do nothing
    } else {
      // Second click on different date: create range
      const start = new Date(selectionStart);
      const end = new Date(dateStr);
      const [earlier, later] = start <= end ? [start, end] : [end, start];

      const range: string[] = [];
      const current = new Date(earlier);
      while (current <= later) {
        const d = current.toISOString().split("T")[0];
        if (!getBookingForDate(d)) {
          range.push(d);
        }
        current.setDate(current.getDate() + 1);
      }
      setSelectedDates(range);
      setSelectionStart(null); // Reset for next selection
    }
  };

  const handleSetRate = async () => {
    if (!newRate || selectedDates.length === 0) return;

    setIsSaving(true);
    try {
      const sortedDates = [...selectedDates].sort();
      const response = await fetch(`/api/properties/${selectedPropertyId}/rates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: sortedDates[0],
          endDate: sortedDates[sortedDates.length - 1],
          rate: parseFloat(newRate),
        }),
      });

      if (response.ok) {
        toast.success(`Rate set for ${selectedDates.length} date(s)`);
        setIsRateDialogOpen(false);
        setSelectedDates([]);
        setSelectionStart(null);
        setNewRate("");
        fetchData();
      } else {
        throw new Error("Failed to set rate");
      }
    } catch {
      toast.error("Failed to set rate");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearRate = async () => {
    if (selectedDates.length === 0) return;

    setIsSaving(true);
    try {
      const sortedDates = [...selectedDates].sort();
      const response = await fetch(
        `/api/properties/${selectedPropertyId}/rates?startDate=${sortedDates[0]}&endDate=${sortedDates[sortedDates.length - 1]}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        toast.success("Custom rates cleared");
        setIsRateDialogOpen(false);
        setSelectedDates([]);
        setSelectionStart(null);
        fetchData();
      } else {
        throw new Error("Failed to clear rates");
      }
    } catch {
      toast.error("Failed to clear rates");
    } finally {
      setIsSaving(false);
    }
  };

  // Calendar grid calculations
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentMonth.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  // Adjust for Monday start
  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

  // Create calendar days array
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < adjustedFirstDay; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const getDateString = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-light text-foreground">Availability</h1>
          <p className="text-muted-foreground mt-1">Loading...</p>
        </div>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-light text-foreground">Availability</h1>
          <p className="text-muted-foreground mt-1">No properties found</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Add properties to manage availability and rates.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-light text-foreground">Availability</h1>
          <p className="text-muted-foreground mt-1">Manage availability and rates</p>
        </div>
        <Select value={selectedPropertyId} onValueChange={(v) => {
          setSelectedPropertyId(v);
          setSelectedDates([]);
        }}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select property" />
          </SelectTrigger>
          <SelectContent>
            {properties.map((property) => (
              <SelectItem key={property.id} value={property.id}>
                {property.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Default Rate Info */}
      <div className="bg-card rounded-lg border border-border shadow-sm p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Default Rate for {selectedProperty?.name}</p>
          <p className="text-lg font-medium">
            {defaultRate ? `£${defaultRate}/night` : "Not set"}
          </p>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        {/* Month Navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-medium">{monthName}</h2>
          <Button variant="ghost" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/30">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div
              key={day}
              className="px-2 py-3 text-center text-xs font-medium text-muted-foreground uppercase"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="h-24 border-b border-r border-border bg-muted/10" />;
            }

            const dateStr = getDateString(day);
            const booking = getBookingForDate(dateStr);
            const rateData = getRateForDate(dateStr);
            const isSelected = selectedDates.includes(dateStr);
            const isBooked = !!booking;

            return (
              <div
                key={day}
                className={`h-24 border-b border-r border-border p-2 transition-colors select-none ${
                  isBooked
                    ? "bg-red-50 cursor-default"
                    : isSelected
                    ? "bg-primary/10 ring-2 ring-primary ring-inset cursor-pointer"
                    : rateData?.isCustom
                    ? "bg-amber-50 hover:bg-amber-100 cursor-pointer"
                    : "hover:bg-muted/30 cursor-pointer"
                }`}
                onClick={() => handleDateClick(dateStr)}
              >
                <div className="flex flex-col h-full">
                  <span className={`text-sm ${isSelected ? "font-semibold" : ""}`}>
                    {day}
                  </span>

                  {isBooked ? (
                    <div className="mt-1">
                      <span className="text-xs text-red-700 font-medium truncate block">
                        {booking.guestName}
                      </span>
                      <span className="text-[10px] text-red-600 capitalize">
                        {booking.status.toLowerCase().replace("_", " ")}
                      </span>
                    </div>
                  ) : (
                    <span
                      className={`mt-auto text-sm tabular-nums ${
                        rateData?.isCustom
                          ? "font-medium text-amber-700"
                          : "text-muted-foreground"
                      }`}
                    >
                      {rateData?.rate ? `£${rateData.rate}` : defaultRate ? `£${defaultRate}` : "—"}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selection Actions */}
        {(selectedDates.length > 0 || selectionStart) && (
          <div className="px-6 py-4 border-t border-border bg-muted/30 flex items-center justify-between">
            <p className="text-sm">
              {selectionStart && selectedDates.length === 1 ? (
                <span className="text-muted-foreground">
                  Click another date for a range, or click "Set Rate" for single date
                </span>
              ) : (
                <>
                  <span className="font-medium">{selectedDates.length}</span> date
                  {selectedDates.length !== 1 ? "s" : ""} selected
                </>
              )}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedDates([]);
                  setSelectionStart(null);
                }}
              >
                Clear
              </Button>
              <Button size="sm" onClick={() => setIsRateDialogOpen(true)}>
                Set Rate
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-card border border-border" />
          <span>Available (Default Rate)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-50 border border-amber-200" />
          <span>Custom Rate</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-50 border border-red-200" />
          <span>Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-primary/10 border-2 border-primary" />
          <span>Selected</span>
        </div>
      </div>

      {/* Upcoming Bookings */}
      {bookings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Bookings This Month</CardTitle>
            <CardDescription>{bookings.length} booking(s)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{booking.guestName}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(booking.checkIn).toLocaleDateString()} — {new Date(booking.checkOut).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    booking.status === "CONFIRMED" || booking.status === "CHECKED_IN"
                      ? "bg-emerald-50 text-emerald-700"
                      : booking.status === "PENDING"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-gray-100 text-gray-700"
                  }`}>
                    {booking.status.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Set Rate Dialog */}
      <Dialog open={isRateDialogOpen} onOpenChange={setIsRateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Rate</DialogTitle>
            <DialogDescription>
              Set the nightly rate for {selectedDates.length} selected date
              {selectedDates.length !== 1 ? "s" : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rate">Rate per night (£)</Label>
              <Input
                id="rate"
                type="number"
                min="0"
                step="1"
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
                placeholder={defaultRate ? `Default: £${defaultRate}` : "e.g. 100"}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleSetRate} disabled={isSaving || !newRate}>
                {isSaving ? "Saving..." : "Set Rate"}
              </Button>
              <Button
                variant="outline"
                onClick={handleClearRate}
                disabled={isSaving}
              >
                Clear Custom Rate
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

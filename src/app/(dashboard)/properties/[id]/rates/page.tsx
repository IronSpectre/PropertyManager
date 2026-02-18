"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface RateData {
  date: string;
  rate: number;
  isCustom: boolean;
}

interface PropertyInfo {
  id: string;
  name: string;
  defaultRate: number | null;
}

export default function RatesCalendarPage() {
  const params = useParams();
  const propertyId = params.id as string;

  const [property, setProperty] = useState<PropertyInfo | null>(null);
  const [rates, setRates] = useState<RateData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newRate, setNewRate] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartDate, setDragStartDate] = useState<string | null>(null);

  const fetchRates = useCallback(async () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const startDate = new Date(year, month, 1).toISOString().split("T")[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split("T")[0];

    try {
      const response = await fetch(
        `/api/properties/${propertyId}/rates?startDate=${startDate}&endDate=${endDate}`
      );
      if (response.ok) {
        const data = await response.json();
        setProperty(data.property);
        setRates(data.rates);
      }
    } catch {
      console.error("Failed to fetch rates");
    } finally {
      setIsLoading(false);
    }
  }, [propertyId, currentMonth]);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    setSelectedDates([]);
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    setSelectedDates([]);
  };

  const handleDateClick = (date: string) => {
    if (selectedDates.includes(date)) {
      setSelectedDates(selectedDates.filter((d) => d !== date));
    } else {
      setSelectedDates([...selectedDates, date].sort());
    }
  };

  const handleMouseDown = (date: string) => {
    setIsDragging(true);
    setDragStartDate(date);
    setSelectedDates([date]);
  };

  const handleMouseEnter = (date: string) => {
    if (isDragging && dragStartDate) {
      const start = new Date(dragStartDate);
      const end = new Date(date);
      const [earlier, later] = start <= end ? [start, end] : [end, start];

      const range: string[] = [];
      const current = new Date(earlier);
      while (current <= later) {
        range.push(current.toISOString().split("T")[0]);
        current.setDate(current.getDate() + 1);
      }
      setSelectedDates(range);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStartDate(null);
  };

  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, []);

  const handleSetRate = async () => {
    if (!newRate || selectedDates.length === 0) return;

    setIsSaving(true);
    try {
      const sortedDates = [...selectedDates].sort();
      const response = await fetch(`/api/properties/${propertyId}/rates`, {
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
        setIsDialogOpen(false);
        setSelectedDates([]);
        setNewRate("");
        fetchRates();
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
        `/api/properties/${propertyId}/rates?startDate=${sortedDates[0]}&endDate=${sortedDates[sortedDates.length - 1]}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        toast.success("Custom rates cleared");
        setIsDialogOpen(false);
        setSelectedDates([]);
        fetchRates();
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

  // Adjust for Monday start (0 = Monday, 6 = Sunday)
  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

  // Create calendar days array
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < adjustedFirstDay; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  // Get rate for a specific day
  const getRateForDay = (day: number): RateData | undefined => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return rates.find((r) => r.date === dateStr);
  };

  const getDateString = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-light text-foreground">Rates Calendar</h1>
          <p className="text-muted-foreground mt-1">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-light text-foreground">Rates Calendar</h1>
          <p className="text-muted-foreground mt-1">{property?.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link href={`/properties/${propertyId}`}>Back to Property</Link>
          </Button>
        </div>
      </div>

      {/* Default Rate Info */}
      <div className="bg-card rounded-lg border border-border shadow-sm p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Default Rate</p>
          <p className="text-lg font-medium">
            {property?.defaultRate ? `£${property.defaultRate}/night` : "Not set"}
          </p>
        </div>
        <Button variant="outline" asChild size="sm">
          <Link href={`/properties/${propertyId}/edit`}>Edit Default Rate</Link>
        </Button>
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
              return <div key={`empty-${index}`} className="h-20 border-b border-r border-border bg-muted/10" />;
            }

            const dateStr = getDateString(day);
            const rateData = getRateForDay(day);
            const isSelected = selectedDates.includes(dateStr);

            return (
              <div
                key={day}
                className={`h-20 border-b border-r border-border p-2 cursor-pointer transition-colors select-none ${
                  isSelected
                    ? "bg-primary/10 ring-2 ring-primary ring-inset"
                    : rateData?.isCustom
                    ? "bg-amber-50 hover:bg-amber-100"
                    : "hover:bg-muted/30"
                }`}
                onClick={() => handleDateClick(dateStr)}
                onMouseDown={() => handleMouseDown(dateStr)}
                onMouseEnter={() => handleMouseEnter(dateStr)}
              >
                <div className="flex flex-col h-full">
                  <span className={`text-sm ${isSelected ? "font-semibold" : ""}`}>
                    {day}
                  </span>
                  <span
                    className={`mt-auto text-sm tabular-nums ${
                      rateData?.isCustom
                        ? "font-medium text-amber-700"
                        : "text-muted-foreground"
                    }`}
                  >
                    {rateData?.rate ? `£${rateData.rate}` : "—"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selection Actions */}
        {selectedDates.length > 0 && (
          <div className="px-6 py-4 border-t border-border bg-muted/30 flex items-center justify-between">
            <p className="text-sm">
              <span className="font-medium">{selectedDates.length}</span> date
              {selectedDates.length !== 1 ? "s" : ""} selected
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDates([])}
              >
                Clear Selection
              </Button>
              <Button size="sm" onClick={() => setIsDialogOpen(true)}>
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
          <span>Default Rate</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-50 border border-amber-200" />
          <span>Custom Rate</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-primary/10 border-2 border-primary" />
          <span>Selected</span>
        </div>
      </div>

      {/* Set Rate Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                placeholder="e.g. 100"
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

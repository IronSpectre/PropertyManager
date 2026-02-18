"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Booking {
  id: string;
  guestName: string;
  guestEmail: string | null;
  checkIn: string;
  checkOut: string;
  numGuests: number;
  status: string;
  source: string;
  property: {
    id: string;
    name: string;
  };
}

const statusLabel: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  CHECKED_IN: "Checked In",
  CHECKED_OUT: "Checked Out",
  CANCELLED: "Cancelled",
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchBookings = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }

      const response = await fetch(`/api/bookings?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      }
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch("/api/bookings/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          `Synced ${data.synced} bookings (${data.created} new, ${data.updated} updated)`
        );
        fetchBookings();
      } else {
        toast.error(data.error || "Failed to sync bookings");
      }
    } catch {
      toast.error("Failed to sync bookings");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDelete = async (id: string, guestName: string) => {
    if (!confirm(`Delete booking for ${guestName}?`)) return;
    setDeletingId(id);
    try {
      const response = await fetch(`/api/bookings/${id}`, { method: "DELETE" });
      if (response.ok) {
        toast.success("Booking deleted");
        fetchBookings();
      } else {
        toast.error("Failed to delete booking");
      }
    } catch {
      toast.error("Failed to delete booking");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDateRange = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return { start, end, nights };
  };

  if (isLoading) {
    return (
      <div className="space-y-10">
        <div>
          <h1 className="text-2xl font-light text-foreground">Bookings</h1>
          <p className="text-muted-foreground mt-1">Loading reservations...</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-light text-foreground">Bookings</h1>
          <p className="text-muted-foreground mt-1">
            {bookings.length} {bookings.length === 1 ? 'reservation' : 'reservations'} total
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSync} disabled={isSyncing}>
            {isSyncing ? "Syncing..." : "Sync Smoobu"}
          </Button>
          <Button asChild>
            <Link href="/bookings/new">Add Booking</Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">Filter:</span>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
            <SelectItem value="CHECKED_IN">Checked In</SelectItem>
            <SelectItem value="CHECKED_OUT">Checked Out</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-16 border border-border rounded-lg bg-card">
          <h2 className="text-lg font-medium mb-2">No bookings yet</h2>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            Add a booking manually or sync from Smoobu to get started.
          </p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={handleSync}>
              Sync Smoobu
            </Button>
            <Button asChild>
              <Link href="/bookings/new">Add Booking</Link>
            </Button>
          </div>
        </div>
      ) : (
        /* Bookings List */
        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Guest</th>
                <th className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Property</th>
                <th className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Dates</th>
                <th className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Status</th>
                <th className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Nights</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {bookings.map((booking) => {
                const { start, end, nights } = formatDateRange(booking.checkIn, booking.checkOut);
                return (
                  <tr key={booking.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium">{booking.guestName}</p>
                      <p className="text-sm text-muted-foreground">{booking.source}</p>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell text-muted-foreground">
                      {booking.property.name}
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell text-muted-foreground">
                      {start.toLocaleDateString()} — {end.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${
                        booking.status === "CONFIRMED" || booking.status === "CHECKED_IN"
                          ? "bg-emerald-50 text-emerald-700"
                          : booking.status === "PENDING"
                          ? "bg-amber-50 text-amber-700"
                          : booking.status === "CANCELLED"
                          ? "bg-red-50 text-red-700"
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {statusLabel[booking.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right tabular-nums">
                      {nights}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/bookings/${booking.id}`}
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleDelete(booking.id, booking.guestName)}
                          disabled={deletingId === booking.id}
                          className="text-sm text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                        >
                          {deletingId === booking.id ? "..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

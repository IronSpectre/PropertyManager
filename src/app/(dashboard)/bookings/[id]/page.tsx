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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

interface Booking {
  id: string;
  smoobuId: string | null;
  guestName: string;
  guestEmail: string | null;
  guestPhone: string | null;
  checkIn: string;
  checkOut: string;
  numGuests: number;
  totalAmount: number | null;
  source: string;
  status: string;
  notes: string | null;
  property: {
    id: string;
    name: string;
  };
}

interface Message {
  id: string;
  content: string;
  sender: "HOST" | "GUEST";
  sentAt: string;
}

export default function BookingDetailPage() {
  const params = useParams();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookingRes, messagesRes] = await Promise.all([
          fetch(`/api/bookings/${bookingId}`),
          fetch(`/api/smoobu/messages?bookingId=${bookingId}`),
        ]);

        if (bookingRes.ok) {
          const bookingData = await bookingRes.json();
          setBooking(bookingData);
        }

        if (messagesRes.ok) {
          const messagesData = await messagesRes.json();
          setMessages(messagesData.messages || []);
        }
      } catch (error) {
        console.error("Error fetching booking:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [bookingId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setIsSending(true);
    try {
      const response = await fetch("/api/smoobu/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          content: newMessage,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages([...messages, data.message]);
        setNewMessage("");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-10">
        <div>
          <h1 className="text-2xl font-light text-foreground">Booking Details</h1>
          <p className="text-muted-foreground mt-1">Loading...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="space-y-10">
        <div>
          <h1 className="text-2xl font-light text-foreground">Booking Not Found</h1>
          <p className="text-muted-foreground mt-1">
            The booking you are looking for does not exist.
          </p>
        </div>
        <Button asChild>
          <Link href="/bookings">Back to Bookings</Link>
        </Button>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    CONFIRMED: "bg-emerald-50 text-emerald-700",
    CHECKED_IN: "bg-blue-50 text-blue-700",
    CHECKED_OUT: "bg-gray-100 text-gray-700",
    CANCELLED: "bg-red-50 text-red-700",
    PENDING: "bg-amber-50 text-amber-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-light text-foreground">
              {booking.guestName}
            </h1>
            <Badge className={statusColors[booking.status] || "bg-gray-100"}>
              {booking.status.toLowerCase().replace("_", " ")}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            <Link
              href={`/properties/${booking.property.id}`}
              className="hover:underline"
            >
              {booking.property.name}
            </Link>
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/bookings">Back to Bookings</Link>
        </Button>
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="messages">
            Messages {messages.length > 0 && `(${messages.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Booking Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Check-in</span>
                  <span>{new Date(booking.checkIn).toLocaleDateString()}</span>
                  <span className="text-muted-foreground">Check-out</span>
                  <span>{new Date(booking.checkOut).toLocaleDateString()}</span>
                  <span className="text-muted-foreground">Guests</span>
                  <span>{booking.numGuests}</span>
                  <span className="text-muted-foreground">Total</span>
                  <span>
                    {booking.totalAmount
                      ? `£${booking.totalAmount.toFixed(2)}`
                      : "—"}
                  </span>
                  <span className="text-muted-foreground">Source</span>
                  <span>{booking.source}</span>
                  {booking.smoobuId && (
                    <>
                      <span className="text-muted-foreground">Smoobu ID</span>
                      <span>{booking.smoobuId}</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Guest Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Name</span>
                  <span>{booking.guestName}</span>
                  <span className="text-muted-foreground">Email</span>
                  <span>
                    {booking.guestEmail ? (
                      <a
                        href={`mailto:${booking.guestEmail}`}
                        className="text-primary hover:underline"
                      >
                        {booking.guestEmail}
                      </a>
                    ) : (
                      "—"
                    )}
                  </span>
                  <span className="text-muted-foreground">Phone</span>
                  <span>
                    {booking.guestPhone ? (
                      <a
                        href={`tel:${booking.guestPhone}`}
                        className="text-primary hover:underline"
                      >
                        {booking.guestPhone}
                      </a>
                    ) : (
                      "—"
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>

            {booking.notes && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{booking.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Guest Messages</CardTitle>
              <CardDescription>
                {booking.smoobuId
                  ? "Messages are synced with Smoobu"
                  : "Local messages only (no Smoobu connection)"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {messages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No messages yet
                </p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-3 rounded-lg ${
                        message.sender === "HOST"
                          ? "bg-primary/10 ml-8"
                          : "bg-muted mr-8"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">
                          {message.sender === "HOST" ? "You" : "Guest"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.sentAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {booking.smoobuId && (
                <div className="border-t pt-4 space-y-3">
                  <Textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSendMessage}
                      disabled={isSending || !newMessage.trim()}
                    >
                      {isSending ? "Sending..." : "Send Message"}
                    </Button>
                  </div>
                </div>
              )}

              {!booking.smoobuId && (
                <p className="text-sm text-muted-foreground text-center py-4 border-t">
                  Messaging is only available for bookings synced with Smoobu
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  status: string;
  _count: {
    bookings: number;
    tasks: number;
  };
}

interface Booking {
  id: string;
  propertyId: string;
  checkIn: string;
  checkOut: string;
  status: string;
  guestName: string;
}

type PropertyStatus = "available" | "booked" | "blocked";

const statusLabel: Record<string, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  MAINTENANCE: "Maintenance",
};

const containerStyle = {
  width: "100%",
  height: "calc(100vh - 280px)",
};

const defaultCenter = {
  lat: 51.5074,
  lng: -0.1278,
};

export default function MapPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [propertiesRes, bookingsRes] = await Promise.all([
          fetch("/api/properties"),
          fetch("/api/bookings"),
        ]);

        if (propertiesRes.ok) {
          const data = await propertiesRes.json();
          setProperties(data);

          const withCoords = data.find(
            (p: Property) => p.latitude && p.longitude
          );
          if (withCoords) {
            setMapCenter({ lat: withCoords.latitude!, lng: withCoords.longitude! });
          }
        }

        if (bookingsRes.ok) {
          const data = await bookingsRes.json();
          setBookings(data);
        }
      } catch {
        console.error("Failed to fetch data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Get property status for a specific date
  const getPropertyStatusForDate = useCallback((property: Property, date: Date): PropertyStatus => {
    // Check if property is blocked (inactive or maintenance)
    if (property.status === "INACTIVE" || property.status === "MAINTENANCE") {
      return "blocked";
    }

    // Check if property is booked on this date
    const dateStr = date.toISOString().split("T")[0];
    const isBooked = bookings.some((booking) => {
      if (booking.propertyId !== property.id) return false;
      if (booking.status === "CANCELLED") return false;

      const checkIn = new Date(booking.checkIn).toISOString().split("T")[0];
      const checkOut = new Date(booking.checkOut).toISOString().split("T")[0];
      return dateStr >= checkIn && dateStr < checkOut;
    });

    return isBooked ? "booked" : "available";
  }, [bookings]);

  // Get marker color based on status
  const getMarkerColor = (status: PropertyStatus): string => {
    switch (status) {
      case "available": return "#059669"; // green
      case "booked": return "#dc2626"; // red
      case "blocked": return "#6b7280"; // gray
    }
  };

  // Get booking for property on selected date
  const getBookingForPropertyOnDate = (propertyId: string, date: Date): Booking | undefined => {
    const dateStr = date.toISOString().split("T")[0];
    return bookings.find((booking) => {
      if (booking.propertyId !== propertyId) return false;
      if (booking.status === "CANCELLED") return false;

      const checkIn = new Date(booking.checkIn).toISOString().split("T")[0];
      const checkOut = new Date(booking.checkOut).toISOString().split("T")[0];
      return dateStr >= checkIn && dateStr < checkOut;
    });
  };

  // Generate dates for mini calendar (3 days before, today, 3 days after)
  const getCalendarDates = () => {
    const dates: Date[] = [];
    for (let i = -3; i <= 3; i++) {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const calendarDates = getCalendarDates();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const onLoad = useCallback(() => {}, []);
  const onUnmount = useCallback(() => {}, []);

  const propertiesWithCoords = properties.filter(
    (p) => p.latitude && p.longitude
  );

  if (isLoading) {
    return (
      <div className="space-y-10">
        <div>
          <h1 className="text-2xl font-light text-foreground">Map</h1>
          <p className="text-muted-foreground mt-1">Loading properties...</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="space-y-10">
        <div>
          <h1 className="text-2xl font-light text-foreground">Map</h1>
          <p className="text-muted-foreground mt-1">Property locations</p>
        </div>

        <div className="text-center py-16 border border-border rounded-lg bg-card">
          <h2 className="text-lg font-medium mb-2">Google Maps not configured</h2>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env file
          </p>
        </div>

        {/* Properties List Fallback */}
        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Property</th>
                <th className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Location</th>
                <th className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {properties.map((property) => (
                <tr key={property.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium">{property.name}</p>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell text-muted-foreground">
                    {property.city}, {property.country}
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${
                      property.status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-700"
                        : property.status === "MAINTENANCE"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-gray-100 text-gray-700"
                    }`}>
                      {statusLabel[property.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/properties/${property.id}`}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-light text-foreground">Map</h1>
          <p className="text-muted-foreground mt-1">
            {propertiesWithCoords.length} of {properties.length} properties on map
          </p>
        </div>
      </div>

      {/* Mini Calendar */}
      <div className="bg-card rounded-lg border border-border shadow-sm p-4">
        {selectedProperty && (
          <div className="mb-3 pb-3 border-b border-border">
            <p className="text-sm font-medium">{selectedProperty.name}</p>
            <p className="text-xs text-muted-foreground">Showing availability for this property</p>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => {
              const newDate = new Date(selectedDate);
              newDate.setDate(newDate.getDate() - 7);
              setSelectedDate(newDate);
            }}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <div className="flex-1 grid grid-cols-7 gap-1">
            {calendarDates.map((date, index) => {
              const isSelected = date.toDateString() === selectedDate.toDateString();
              const isToday = date.toDateString() === today.toDateString();
              const dayName = date.toLocaleDateString("en-GB", { weekday: "short" });
              const dayNum = date.getDate();
              const monthName = date.toLocaleDateString("en-GB", { month: "short" });

              // Get status for selected property on this date, or summary for all properties
              let availableCount = 0;
              let bookedCount = 0;
              let blockedCount = 0;

              if (selectedProperty) {
                const status = getPropertyStatusForDate(selectedProperty, date);
                if (status === "available") availableCount = 1;
                else if (status === "booked") bookedCount = 1;
                else blockedCount = 1;
              } else {
                // Count status across all properties
                properties.forEach((p) => {
                  const status = getPropertyStatusForDate(p, date);
                  if (status === "available") availableCount++;
                  else if (status === "booked") bookedCount++;
                  else blockedCount++;
                });
              }

              const total = availableCount + bookedCount + blockedCount;

              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(date)}
                  className={`flex flex-col items-center py-2 rounded-lg transition-colors ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : isToday
                      ? "bg-muted border border-border"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <span className={`text-[10px] uppercase ${isSelected ? "" : "text-muted-foreground"}`}>
                    {dayName}
                  </span>
                  <span className="text-lg font-medium">{dayNum}</span>
                  <span className={`text-[10px] ${isSelected ? "" : "text-muted-foreground"}`}>
                    {monthName}
                  </span>
                  {/* Status bar */}
                  <div className={`mt-1.5 h-1.5 w-full max-w-[40px] rounded-full overflow-hidden flex ${
                    isSelected ? "opacity-80" : ""
                  }`}>
                    {availableCount > 0 && (
                      <div
                        className="h-full bg-[#059669]"
                        style={{ width: `${(availableCount / total) * 100}%` }}
                      />
                    )}
                    {bookedCount > 0 && (
                      <div
                        className="h-full bg-[#dc2626]"
                        style={{ width: `${(bookedCount / total) * 100}%` }}
                      />
                    )}
                    {blockedCount > 0 && (
                      <div
                        className="h-full bg-[#6b7280]"
                        style={{ width: `${(blockedCount / total) * 100}%` }}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => {
              const newDate = new Date(selectedDate);
              newDate.setDate(newDate.getDate() + 7);
              setSelectedDate(newDate);
            }}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#059669]" />
            <span className="text-muted-foreground">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#dc2626]" />
            <span className="text-muted-foreground">Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#6b7280]" />
            <span className="text-muted-foreground">Blocked</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedDate(new Date())}
            className="ml-4"
          >
            Today
          </Button>
          {selectedProperty && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedProperty(null)}
            >
              Clear Selection
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Map */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-border overflow-hidden shadow-sm">
            {isLoaded ? (
              <GoogleMap
                mapContainerStyle={containerStyle}
                center={mapCenter}
                zoom={10}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={{
                  mapTypeId: "roadmap",
                  zoomControl: true,
                  mapTypeControl: true,
                  streetViewControl: true,
                  fullscreenControl: true,
                  styles: [
                    {
                      featureType: "poi",
                      stylers: [{ visibility: "off" }],
                    },
                    {
                      featureType: "transit.station",
                      stylers: [{ visibility: "off" }],
                    },
                    {
                      featureType: "road",
                      elementType: "labels",
                      stylers: [{ visibility: "off" }],
                    },
                  ],
                }}
              >
                {propertiesWithCoords.map((property) => {
                  const status = getPropertyStatusForDate(property, selectedDate);
                  const markerColor = getMarkerColor(status);

                  return (
                    <Marker
                      key={property.id}
                      position={{
                        lat: property.latitude!,
                        lng: property.longitude!,
                      }}
                      onClick={() => setSelectedProperty(property)}
                      label={{
                        text: property.name,
                        color: "#ffffff",
                        fontSize: "12px",
                        fontWeight: "600",
                        className: `marker-label marker-label-${status}`,
                      }}
                      icon={{
                        path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
                        fillColor: markerColor,
                        fillOpacity: 1,
                        strokeColor: "#ffffff",
                        strokeWeight: 2,
                        scale: 1.8,
                        anchor: new google.maps.Point(12, 22),
                        labelOrigin: new google.maps.Point(12, -10),
                      }}
                    />
                  );
                })}

                {selectedProperty && selectedProperty.latitude && selectedProperty.longitude && (() => {
                  const status = getPropertyStatusForDate(selectedProperty, selectedDate);
                  const booking = getBookingForPropertyOnDate(selectedProperty.id, selectedDate);

                  return (
                    <InfoWindow
                      position={{
                        lat: selectedProperty.latitude,
                        lng: selectedProperty.longitude,
                      }}
                      onCloseClick={() => setSelectedProperty(null)}
                    >
                      <div className="p-2 min-w-48">
                        <h3 className="font-semibold">{selectedProperty.name}</h3>
                        <p className="text-sm text-gray-600">
                          {selectedProperty.address}
                        </p>
                        <div className="mt-2 py-2 border-t border-gray-200">
                          <p className="text-xs text-gray-500 mb-1">
                            {selectedDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })}
                          </p>
                          <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                            status === "available"
                              ? "bg-green-100 text-green-700"
                              : status === "booked"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                          }`}>
                            {status === "available" ? "Available" : status === "booked" ? "Booked" : "Blocked"}
                          </span>
                          {booking && (
                            <p className="text-sm text-gray-600 mt-1">
                              Guest: {booking.guestName}
                            </p>
                          )}
                        </div>
                        <Link
                          href={`/properties/${selectedProperty.id}`}
                          className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                        >
                          View details
                        </Link>
                      </div>
                    </InfoWindow>
                  );
                })()}
              </GoogleMap>
            ) : (
              <div className="h-96 flex items-center justify-center">
                <p className="text-muted-foreground">Loading map...</p>
              </div>
            )}
          </div>
        </div>

        {/* Properties Sidebar */}
        <div className="space-y-6">
          <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="font-medium">Properties</h2>
            </div>
            <div className="divide-y divide-border max-h-96 overflow-auto">
              {properties.map((property) => {
                const status = getPropertyStatusForDate(property, selectedDate);
                const booking = getBookingForPropertyOnDate(property.id, selectedDate);

                return (
                  <div
                    key={property.id}
                    className={`px-6 py-4 cursor-pointer transition-colors ${
                      selectedProperty?.id === property.id
                        ? "bg-muted/50"
                        : "hover:bg-muted/30"
                    }`}
                    onClick={() => {
                      setSelectedProperty(property);
                      if (property.latitude && property.longitude) {
                        setMapCenter({
                          lat: property.latitude,
                          lng: property.longitude,
                        });
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{property.name}</p>
                        <p className="text-xs text-muted-foreground">{property.city}</p>
                      </div>
                      <div
                        className={`w-3 h-3 rounded-full ${
                          status === "available"
                            ? "bg-[#059669]"
                            : status === "booked"
                            ? "bg-[#dc2626]"
                            : "bg-[#6b7280]"
                        }`}
                        title={status === "booked" && booking ? `Booked: ${booking.guestName}` : status}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {selectedProperty && (() => {
            const status = getPropertyStatusForDate(selectedProperty, selectedDate);
            const booking = getBookingForPropertyOnDate(selectedProperty.id, selectedDate);

            return (
              <div className="bg-card rounded-lg border border-border shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{selectedProperty.name}</h3>
                  <Link
                    href={`/properties/${selectedProperty.id}`}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    View
                  </Link>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">{selectedProperty.address}</p>
                  <p className="text-muted-foreground">{selectedProperty.city}, {selectedProperty.country}</p>
                </div>

                {/* Status for selected date */}
                <div className="pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">
                    {selectedDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })}
                  </p>
                  <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${
                    status === "available"
                      ? "bg-emerald-50 text-emerald-700"
                      : status === "booked"
                      ? "bg-red-50 text-red-700"
                      : "bg-gray-100 text-gray-700"
                  }`}>
                    {status === "available" ? "Available" : status === "booked" ? "Booked" : "Blocked"}
                  </span>
                  {booking && (
                    <p className="text-sm mt-2">
                      <span className="text-muted-foreground">Guest:</span> {booking.guestName}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border text-sm">
                  <div>
                    <p className="font-medium">{selectedProperty._count.bookings}</p>
                    <p className="text-muted-foreground">Bookings</p>
                  </div>
                  <div>
                    <p className="font-medium">{selectedProperty._count.tasks}</p>
                    <p className="text-muted-foreground">Tasks</p>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

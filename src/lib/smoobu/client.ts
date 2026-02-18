import { BookingSource, BookingStatus, MessageSender } from "@prisma/client";

const SMOOBU_API_URL = "https://login.smoobu.com/api";
const SMOOBU_BOOKING_URL = "https://login.smoobu.com/booking";

// ==================== RESERVATION INTERFACES ====================

interface SmoobuReservation {
  id: number;
  "reference-id": string;
  apartment: {
    id: number;
    name: string;
  };
  channel: {
    id: number;
    name: string;
  };
  arrival: string;
  departure: string;
  "created-at": string;
  "guest-name": string;
  email: string;
  phone: string;
  adults: number;
  children: number;
  price: number;
  "price-paid": number;
  deposit: number;
  "deposit-paid": number;
  language: string;
  "guest-notice": string;
  "host-notice": string;
  status: string;
  "is-blocked-booking"?: boolean;
}

interface SmoobuReservationsResponse {
  page_count: number;
  page_size: number;
  total_items: number;
  page: number;
  bookings: SmoobuReservation[];
}

// ==================== APARTMENT INTERFACES ====================

interface SmoobuApartment {
  id: number;
  name: string;
  street: string;
  postalCode: string;
  city: string;
  country: {
    id: number;
    name: string;
  };
  timezone: string;
  currency: string;
  price: {
    minimal: number;
    maximal: number;
  };
  rooms: {
    maxOccupancy: number;
    bedrooms: number;
    bathrooms: number;
  };
  location: {
    latitude: number;
    longitude: number;
  };
}

interface SmoobuApartmentsResponse {
  apartments: SmoobuApartment[];
}

// ==================== RATES INTERFACES ====================

interface SmoobuRate {
  date: string;
  price: number;
  min_length_of_stay: number;
  available: 0 | 1;
}

interface SmoobuRatesResponse {
  data: {
    [apartmentId: string]: {
      [date: string]: SmoobuRate;
    };
  };
}

interface SmoobuRateUpdate {
  apartments: number[];
  dateFrom: string;
  dateTo: string;
  daily_price?: number;
  min_length_of_stay?: number;
  available?: 0 | 1;
}

// ==================== AVAILABILITY INTERFACES ====================

interface SmoobuAvailabilityRequest {
  arrivalDate: string;
  departureDate: string;
  apartments: number[];
  customerId?: number;
}

interface SmoobuAvailabilityResponse {
  availableApartments: number[];
}

// ==================== MESSAGE INTERFACES ====================

interface SmoobuMessage {
  id: number;
  subject: string;
  messageHtml: string;
  messageText: string;
  createdAt: string;
  direction: "in" | "out";
  channel: string;
}

interface SmoobuMessagesResponse {
  messages: SmoobuMessage[];
}

// ==================== GUEST INTERFACES ====================

interface SmoobuGuest {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
}

interface SmoobuGuestsResponse {
  guests: SmoobuGuest[];
  page: number;
  pageCount: number;
  pageSize: number;
  totalItems: number;
}

export class SmoobuClient {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.SMOOBU_API_KEY || "";
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.apiKey) {
      throw new Error("Smoobu API key not configured");
    }

    const response = await fetch(`${SMOOBU_API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Api-Key": this.apiKey,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Smoobu API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async getReservations(params?: {
    from?: string;
    to?: string;
    apartmentId?: number;
    page?: number;
    pageSize?: number;
  }): Promise<SmoobuReservationsResponse> {
    const searchParams = new URLSearchParams();

    if (params?.from) searchParams.set("from", params.from);
    if (params?.to) searchParams.set("to", params.to);
    if (params?.apartmentId)
      searchParams.set("apartment_id", String(params.apartmentId));
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.pageSize) searchParams.set("page_size", String(params.pageSize));

    const query = searchParams.toString();
    return this.request<SmoobuReservationsResponse>(
      `/reservations${query ? `?${query}` : ""}`
    );
  }

  async getReservation(id: number): Promise<SmoobuReservation> {
    return this.request<SmoobuReservation>(`/reservations/${id}`);
  }

  mapReservationToBooking(reservation: SmoobuReservation) {
    const channelMap: Record<string, BookingSource> = {
      Airbnb: BookingSource.AIRBNB,
      "Booking.com": BookingSource.BOOKING_COM,
      VRBO: BookingSource.VRBO,
      Direct: BookingSource.DIRECT,
    };

    return {
      smoobuId: String(reservation.id),
      guestName: reservation["guest-name"],
      guestEmail: reservation.email || null,
      guestPhone: reservation.phone || null,
      checkIn: new Date(reservation.arrival),
      checkOut: new Date(reservation.departure),
      numGuests: (reservation.adults || 0) + (reservation.children || 0),
      totalAmount: reservation.price || null,
      source: channelMap[reservation.channel?.name] || BookingSource.SMOOBU,
      status: this.mapStatus(reservation.status),
      notes: reservation["guest-notice"] || null,
      syncedAt: new Date(),
    };
  }

  private mapStatus(status: string): BookingStatus {
    const statusMap: Record<string, BookingStatus> = {
      confirmed: BookingStatus.CONFIRMED,
      pending: BookingStatus.PENDING,
      cancelled: BookingStatus.CANCELLED,
      "checked-in": BookingStatus.CHECKED_IN,
      "checked-out": BookingStatus.CHECKED_OUT,
    };
    return statusMap[status?.toLowerCase()] || BookingStatus.CONFIRMED;
  }

  // ==================== APARTMENTS ====================

  async getApartments(): Promise<SmoobuApartment[]> {
    const response = await this.request<SmoobuApartmentsResponse>("/apartments");
    return response.apartments || [];
  }

  async getApartment(id: number): Promise<SmoobuApartment> {
    return this.request<SmoobuApartment>(`/apartments/${id}`);
  }

  mapApartmentToProperty(apartment: SmoobuApartment) {
    return {
      smoobuId: String(apartment.id),
      name: apartment.name,
      address: apartment.street || "",
      city: apartment.city || "",
      postalCode: apartment.postalCode || null,
      country: apartment.country?.name || "",
      latitude: apartment.location?.latitude || null,
      longitude: apartment.location?.longitude || null,
      bedrooms: apartment.rooms?.bedrooms || null,
    };
  }

  // ==================== RATES ====================

  async getRates(params: {
    apartmentIds: number[];
    startDate: string;
    endDate: string;
  }): Promise<SmoobuRatesResponse> {
    const searchParams = new URLSearchParams();
    searchParams.set("start_date", params.startDate);
    searchParams.set("end_date", params.endDate);
    params.apartmentIds.forEach((id) => {
      searchParams.append("apartments[]", String(id));
    });

    return this.request<SmoobuRatesResponse>(`/rates?${searchParams.toString()}`);
  }

  async updateRates(rateUpdate: SmoobuRateUpdate): Promise<void> {
    await this.request("/rates", {
      method: "POST",
      body: JSON.stringify(rateUpdate),
    });
  }

  // ==================== AVAILABILITY ====================

  async checkAvailability(params: {
    apartmentId: number;
    startDate: string;
    endDate: string;
  }): Promise<boolean> {
    if (!this.apiKey) {
      throw new Error("Smoobu API key not configured");
    }

    const response = await fetch(`${SMOOBU_BOOKING_URL}/checkApartmentAvailability`, {
      method: "POST",
      headers: {
        "Api-Key": this.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        arrivalDate: params.startDate,
        departureDate: params.endDate,
        apartments: [params.apartmentId],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Smoobu API error: ${response.status} - ${error}`);
    }

    const data: SmoobuAvailabilityResponse = await response.json();
    return data.availableApartments.includes(params.apartmentId);
  }

  async blockDates(params: {
    apartmentId: number;
    startDate: string;
    endDate: string;
    note?: string;
  }): Promise<SmoobuReservation> {
    return this.request<SmoobuReservation>("/reservations", {
      method: "POST",
      body: JSON.stringify({
        apartment_id: params.apartmentId,
        arrival: params.startDate,
        departure: params.endDate,
        "guest-name": "Blocked",
        "is-blocked-booking": true,
        "host-notice": params.note || "Blocked via Property Manager",
      }),
    });
  }

  async cancelReservation(reservationId: number): Promise<void> {
    await this.request(`/reservations/${reservationId}`, {
      method: "DELETE",
    });
  }

  // ==================== MESSAGES ====================

  async getMessages(reservationId: number): Promise<SmoobuMessage[]> {
    const response = await this.request<SmoobuMessagesResponse>(
      `/reservations/${reservationId}/messages`
    );
    return response.messages || [];
  }

  async sendMessageToGuest(
    reservationId: number,
    message: string,
    subject?: string
  ): Promise<void> {
    await this.request(`/reservations/${reservationId}/messages/send-message-to-guest`, {
      method: "POST",
      body: JSON.stringify({
        message,
        subject: subject || "Message from host",
      }),
    });
  }

  mapMessageToLocal(message: SmoobuMessage, bookingId: string) {
    return {
      smoobuId: String(message.id),
      bookingId,
      content: message.messageText || message.messageHtml,
      sender: message.direction === "out" ? MessageSender.HOST : MessageSender.GUEST,
      sentAt: new Date(message.createdAt),
      syncedAt: new Date(),
    };
  }

  // ==================== GUESTS ====================

  async getGuests(page = 1): Promise<SmoobuGuestsResponse> {
    return this.request<SmoobuGuestsResponse>(`/guests?page=${page}`);
  }
}

export const smoobuClient = new SmoobuClient();

// Export types for use in other files
export type {
  SmoobuApartment,
  SmoobuReservation,
  SmoobuRate,
  SmoobuRateUpdate,
  SmoobuMessage,
  SmoobuGuest,
};

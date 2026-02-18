import { Suspense } from "react";
import { BookingForm } from "@/components/bookings/booking-form";

export default function NewBookingPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Add Booking</h1>
        <p className="text-muted-foreground">Create a new reservation</p>
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        <BookingForm />
      </Suspense>
    </div>
  );
}

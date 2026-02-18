import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { smoobuClient } from "@/lib/smoobu/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!propertyId || !startDate || !endDate) {
      return NextResponse.json(
        { error: "propertyId, startDate, and endDate are required" },
        { status: 400 }
      );
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property?.smoobuId) {
      return NextResponse.json(
        { error: "Property not found or not linked to Smoobu" },
        { status: 404 }
      );
    }

    const smoobuId = parseInt(property.smoobuId);
    const isAvailable = await smoobuClient.checkAvailability({
      apartmentId: smoobuId,
      startDate,
      endDate,
    });

    // Also get bookings for this period to show blocked dates
    const bookings = await prisma.booking.findMany({
      where: {
        propertyId,
        OR: [
          {
            checkIn: { lte: new Date(endDate) },
            checkOut: { gte: new Date(startDate) },
          },
        ],
        status: { not: "CANCELLED" },
      },
      orderBy: { checkIn: "asc" },
    });

    return NextResponse.json({
      propertyId,
      startDate,
      endDate,
      isAvailable,
      bookings: bookings.map((b) => ({
        id: b.id,
        smoobuId: b.smoobuId,
        guestName: b.guestName,
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        status: b.status,
      })),
    });
  } catch (error) {
    console.error("Error checking availability:", error);
    return NextResponse.json(
      { error: "Failed to check availability" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { propertyId, startDate, endDate, note } = body;

    if (!propertyId || !startDate || !endDate) {
      return NextResponse.json(
        { error: "propertyId, startDate, and endDate are required" },
        { status: 400 }
      );
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property?.smoobuId) {
      return NextResponse.json(
        { error: "Property not found or not linked to Smoobu" },
        { status: 404 }
      );
    }

    const smoobuId = parseInt(property.smoobuId);

    // Create a blocked booking in Smoobu
    const blockedReservation = await smoobuClient.blockDates({
      apartmentId: smoobuId,
      startDate,
      endDate,
      note,
    });

    // Create a local booking record for the block
    const booking = await prisma.booking.create({
      data: {
        propertyId,
        smoobuId: String(blockedReservation.id),
        guestName: "Blocked",
        checkIn: new Date(startDate),
        checkOut: new Date(endDate),
        status: "CONFIRMED",
        source: "SMOOBU",
        notes: note || "Blocked via Property Manager",
        syncedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      booking,
      message: "Dates blocked successfully",
    });
  } catch (error) {
    console.error("Error blocking dates:", error);
    return NextResponse.json(
      { error: "Failed to block dates" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("bookingId");

    if (!bookingId) {
      return NextResponse.json(
        { error: "bookingId is required" },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Only allow unblocking if it's a blocked booking
    if (booking.guestName !== "Blocked") {
      return NextResponse.json(
        { error: "Can only unblock blocked dates, not actual bookings" },
        { status: 400 }
      );
    }

    if (booking.smoobuId) {
      // Cancel in Smoobu
      await smoobuClient.cancelReservation(parseInt(booking.smoobuId));
    }

    // Delete local booking
    await prisma.booking.delete({
      where: { id: bookingId },
    });

    return NextResponse.json({
      success: true,
      message: "Dates unblocked successfully",
    });
  } catch (error) {
    console.error("Error unblocking dates:", error);
    return NextResponse.json(
      { error: "Failed to unblock dates" },
      { status: 500 }
    );
  }
}

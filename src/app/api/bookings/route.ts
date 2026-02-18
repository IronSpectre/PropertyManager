import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");
    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: Record<string, unknown> = {};

    if (propertyId) {
      where.propertyId = propertyId;
    }

    if (status && status !== "all") {
      where.status = status;
    }

    if (from || to) {
      where.OR = [
        {
          checkIn: {
            gte: from ? new Date(from) : undefined,
            lte: to ? new Date(to) : undefined,
          },
        },
        {
          checkOut: {
            gte: from ? new Date(from) : undefined,
            lte: to ? new Date(to) : undefined,
          },
        },
      ];
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        property: true,
      },
      orderBy: { checkIn: "desc" },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      propertyId,
      guestName,
      guestEmail,
      guestPhone,
      checkIn,
      checkOut,
      numGuests,
      totalAmount,
      source,
      status,
      notes,
    } = body;

    if (!propertyId || !guestName || !checkIn || !checkOut) {
      return NextResponse.json(
        { error: "Property, guest name, check-in and check-out are required" },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.create({
      data: {
        propertyId,
        guestName,
        guestEmail,
        guestPhone,
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        numGuests: numGuests || 1,
        totalAmount: totalAmount ? parseFloat(totalAmount) : null,
        source: source || "DIRECT",
        status: status || "CONFIRMED",
        notes,
      },
      include: {
        property: true,
      },
    });

    // Auto-create cleaning job for check-out
    await prisma.cleaningJob.create({
      data: {
        propertyId,
        bookingId: booking.id,
        scheduledDate: new Date(checkOut),
        status: "PENDING",
      },
    });

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { SmoobuClient } from "@/lib/smoobu/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { propertyId } = body;

    // Get Smoobu API key from environment
    const apiKey = process.env.SMOOBU_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Smoobu API key not configured" },
        { status: 400 }
      );
    }

    const client = new SmoobuClient(apiKey);

    // Get all properties with Smoobu IDs or filter by propertyId
    const whereClause: Record<string, unknown> = { smoobuId: { not: null } };
    if (propertyId) {
      whereClause.id = propertyId;
    }

    const properties = await prisma.property.findMany({
      where: whereClause,
    });

    if (properties.length === 0) {
      return NextResponse.json(
        { error: "No properties with Smoobu IDs found" },
        { status: 400 }
      );
    }

    let syncedCount = 0;
    let createdCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    // Sync reservations for each property
    for (const property of properties) {
      if (!property.smoobuId) continue;

      try {
        // Get reservations from Smoobu
        const response = await client.getReservations({
          apartmentId: parseInt(property.smoobuId),
          pageSize: 100,
        });

        for (const reservation of response.bookings) {
          const bookingData = client.mapReservationToBooking(reservation);

          // Check if booking already exists
          const existingBooking = await prisma.booking.findUnique({
            where: { smoobuId: bookingData.smoobuId },
          });

          if (existingBooking) {
            // Update existing booking
            await prisma.booking.update({
              where: { id: existingBooking.id },
              data: {
                ...bookingData,
                propertyId: property.id,
              },
            });
            updatedCount++;
          } else {
            // Create new booking
            const booking = await prisma.booking.create({
              data: {
                ...bookingData,
                propertyId: property.id,
              },
            });

            // Auto-create cleaning job for check-out
            await prisma.cleaningJob.create({
              data: {
                propertyId: property.id,
                bookingId: booking.id,
                scheduledDate: booking.checkOut,
                status: "PENDING",
              },
            });

            createdCount++;
          }

          syncedCount++;
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        errors.push(`Property ${property.name}: ${message}`);
      }
    }

    return NextResponse.json({
      success: true,
      synced: syncedCount,
      created: createdCount,
      updated: updatedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error syncing bookings:", error);
    return NextResponse.json(
      { error: "Failed to sync bookings" },
      { status: 500 }
    );
  }
}

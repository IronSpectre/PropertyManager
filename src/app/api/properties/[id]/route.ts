import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

async function geocodeAddress(address: string, city: string, postalCode: string | null, country: string) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  const fullAddress = [address, city, postalCode, country].filter(Boolean).join(", ");
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      return { latitude: lat, longitude: lng };
    }
  } catch (error) {
    console.error("Geocoding error:", error);
  }

  return null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        payoutAccount: true,
        rentSourceAccount: true,
        images: { orderBy: { order: "asc" } },
        documents: true,
        bookings: {
          orderBy: { checkIn: "desc" },
          take: 10,
        },
        tasks: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        cleaningJobs: {
          orderBy: { scheduledDate: "desc" },
          take: 10,
        },
        transactions: {
          orderBy: { date: "desc" },
          take: 10,
        },
      },
    });

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    return NextResponse.json(property);
  } catch (error) {
    console.error("Error fetching property:", error);
    return NextResponse.json(
      { error: "Failed to fetch property" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Get current property to check if address changed
    const current = await prisma.property.findUnique({ where: { id } });

    // Geocode if address fields changed
    let coords = null;
    if (current && (
      current.address !== body.address ||
      current.city !== body.city ||
      current.postalCode !== body.postalCode ||
      current.country !== body.country
    )) {
      coords = await geocodeAddress(body.address, body.city, body.postalCode, body.country);
    }

    const property = await prisma.property.update({
      where: { id },
      data: {
        name: body.name,
        address: body.address,
        city: body.city,
        postalCode: body.postalCode,
        country: body.country,
        latitude: coords ? coords.latitude : undefined,
        longitude: coords ? coords.longitude : undefined,
        tenancyType: body.tenancyType || undefined,
        bedrooms: body.bedrooms ? parseInt(body.bedrooms) : null,
        rent: body.rent ? parseFloat(body.rent) : null,
        rentDueDay: body.rentDueDay ? parseInt(body.rentDueDay) : null,
        dailyRate: body.dailyRate ? parseFloat(body.dailyRate) : null,
        smoobuId: body.smoobuId || null,
        notes: body.notes,
        status: body.status,
        // New fields
        tenantName: body.tenantName || null,
        tenantEmail: body.tenantEmail || null,
        tenantPhone: body.tenantPhone || null,
        rentSourceAccountId: body.rentSourceAccountId && body.rentSourceAccountId !== "none" ? body.rentSourceAccountId : null,
        payoutAccountId: body.payoutAccountId && body.payoutAccountId !== "none" ? body.payoutAccountId : null,
        airbnbEmail: body.airbnbEmail || null,
        airbnbPassword: body.airbnbPassword || null,
        bookingComEmail: body.bookingComEmail || null,
        bookingComPassword: body.bookingComPassword || null,
      },
      include: {
        payoutAccount: true,
        rentSourceAccount: true,
      },
    });

    return NextResponse.json(property);
  } catch (error) {
    console.error("Error updating property:", error);
    return NextResponse.json(
      { error: "Failed to update property" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.property.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting property:", error);
    return NextResponse.json(
      { error: "Failed to delete property" },
      { status: 500 }
    );
  }
}

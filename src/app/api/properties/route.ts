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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};

    if (status && status !== "all") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
      ];
    }

    const properties = await prisma.property.findMany({
      where,
      include: {
        payoutAccount: true,
        _count: {
          select: {
            bookings: true,
            tasks: true,
            cleaningJobs: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(properties);
  } catch (error) {
    console.error("Error fetching properties:", error);
    return NextResponse.json(
      { error: "Failed to fetch properties" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      address,
      city,
      postalCode,
      country,
      tenancyType,
      bedrooms,
      rent,
      rentDueDay,
      dailyRate,
      smoobuId,
      notes,
      status,
      // New fields
      tenantName,
      tenantEmail,
      tenantPhone,
      rentSourceAccountId,
      payoutAccountId,
      airbnbEmail,
      airbnbPassword,
      bookingComEmail,
      bookingComPassword,
    } = body;

    if (!name || !address || !city || !country) {
      return NextResponse.json(
        { error: "Name, address, city, and country are required" },
        { status: 400 }
      );
    }

    // Geocode the address to get coordinates
    const coords = await geocodeAddress(address, city, postalCode, country);

    const property = await prisma.property.create({
      data: {
        name,
        address,
        city,
        postalCode,
        country,
        latitude: coords?.latitude || null,
        longitude: coords?.longitude || null,
        tenancyType: tenancyType || "OTHER",
        bedrooms: bedrooms ? parseInt(bedrooms) : null,
        rent: rent ? parseFloat(rent) : null,
        rentDueDay: rentDueDay ? parseInt(rentDueDay) : null,
        dailyRate: dailyRate ? parseFloat(dailyRate) : null,
        smoobuId: smoobuId || null,
        notes,
        status: status || "ACTIVE",
        // New fields
        tenantName: tenantName || null,
        tenantEmail: tenantEmail || null,
        tenantPhone: tenantPhone || null,
        rentSourceAccountId: rentSourceAccountId && rentSourceAccountId !== "none" ? rentSourceAccountId : null,
        payoutAccountId: payoutAccountId && payoutAccountId !== "none" ? payoutAccountId : null,
        airbnbEmail: airbnbEmail || null,
        airbnbPassword: airbnbPassword || null,
        bookingComEmail: bookingComEmail || null,
        bookingComPassword: bookingComPassword || null,
      },
      include: {
        payoutAccount: true,
        rentSourceAccount: true,
      },
    });

    return NextResponse.json(property);
  } catch (error) {
    console.error("Error creating property:", error);
    return NextResponse.json(
      { error: "Failed to create property" },
      { status: 500 }
    );
  }
}

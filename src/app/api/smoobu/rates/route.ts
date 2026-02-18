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
    const ratesResponse = await smoobuClient.getRates({
      apartmentIds: [smoobuId],
      startDate,
      endDate,
    });

    const rates = ratesResponse.data[property.smoobuId] || {};

    return NextResponse.json({
      propertyId,
      smoobuId: property.smoobuId,
      rates,
    });
  } catch (error) {
    console.error("Error fetching rates:", error);
    return NextResponse.json(
      { error: "Failed to fetch rates from Smoobu" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { propertyId, startDate, endDate, price, minStay, available } = body;

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

    await smoobuClient.updateRates({
      apartments: [smoobuId],
      dateFrom: startDate,
      dateTo: endDate,
      daily_price: price !== undefined ? price : undefined,
      min_length_of_stay: minStay !== undefined ? minStay : undefined,
      available: available !== undefined ? (available ? 1 : 0) : undefined,
    });

    return NextResponse.json({
      success: true,
      message: "Rates updated successfully",
    });
  } catch (error) {
    console.error("Error updating rates:", error);
    return NextResponse.json(
      { error: "Failed to update rates in Smoobu" },
      { status: 500 }
    );
  }
}

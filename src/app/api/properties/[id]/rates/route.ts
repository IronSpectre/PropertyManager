import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "startDate and endDate are required" },
        { status: 400 }
      );
    }

    // Get the property with its default rate
    const property = await prisma.property.findUnique({
      where: { id },
      select: { id: true, name: true, dailyRate: true },
    });

    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    // Get custom rates for the date range
    const customRates = await prisma.propertyRate.findMany({
      where: {
        propertyId: id,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: { date: "asc" },
    });

    // Create a map of custom rates by date
    const rateMap = new Map<string, number>();
    customRates.forEach((rate) => {
      const dateKey = rate.date.toISOString().split("T")[0];
      rateMap.set(dateKey, rate.rate);
    });

    // Generate all dates in range with rates
    const rates: { date: string; rate: number; isCustom: boolean }[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const current = new Date(start);

    while (current <= end) {
      const dateKey = current.toISOString().split("T")[0];
      const customRate = rateMap.get(dateKey);
      rates.push({
        date: dateKey,
        rate: customRate ?? property.dailyRate ?? 0,
        isCustom: customRate !== undefined,
      });
      current.setDate(current.getDate() + 1);
    }

    return NextResponse.json({
      property: {
        id: property.id,
        name: property.name,
        defaultRate: property.dailyRate,
      },
      rates,
    });
  } catch (error) {
    console.error("Error fetching rates:", error);
    return NextResponse.json(
      { error: "Failed to fetch rates" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { startDate, endDate, rate } = body;

    if (!startDate || !endDate || rate === undefined) {
      return NextResponse.json(
        { error: "startDate, endDate, and rate are required" },
        { status: 400 }
      );
    }

    // Verify property exists
    const property = await prisma.property.findUnique({
      where: { id },
    });

    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    // Generate all dates in range
    const dates: Date[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const current = new Date(start);

    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    // Upsert rates for each date
    const upsertPromises = dates.map((date) =>
      prisma.propertyRate.upsert({
        where: {
          propertyId_date: {
            propertyId: id,
            date,
          },
        },
        update: { rate },
        create: {
          propertyId: id,
          date,
          rate,
        },
      })
    );

    await Promise.all(upsertPromises);

    return NextResponse.json({
      success: true,
      message: `Updated ${dates.length} date(s)`,
    });
  } catch (error) {
    console.error("Error setting rates:", error);
    return NextResponse.json(
      { error: "Failed to set rates" },
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
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "startDate and endDate are required" },
        { status: 400 }
      );
    }

    // Delete custom rates in the range (reverts to default)
    const result = await prisma.propertyRate.deleteMany({
      where: {
        propertyId: id,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Removed ${result.count} custom rate(s)`,
    });
  } catch (error) {
    console.error("Error removing rates:", error);
    return NextResponse.json(
      { error: "Failed to remove rates" },
      { status: 500 }
    );
  }
}

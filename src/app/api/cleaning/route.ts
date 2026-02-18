import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (propertyId) where.propertyId = propertyId;
    if (status && status !== "all") where.status = status;

    const cleaningJobs = await prisma.cleaningJob.findMany({
      where,
      include: {
        property: true,
        booking: true,
        assignedTo: true,
      },
      orderBy: { scheduledDate: "asc" },
    });

    return NextResponse.json(cleaningJobs);
  } catch (error) {
    console.error("Error fetching cleaning jobs:", error);
    return NextResponse.json({ error: "Failed to fetch cleaning jobs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { propertyId, bookingId, assignedToId, scheduledDate, notes, status } = body;

    const cleaningJob = await prisma.cleaningJob.create({
      data: {
        propertyId,
        bookingId,
        assignedToId,
        scheduledDate: new Date(scheduledDate),
        notes,
        status: status || "PENDING",
      },
      include: { property: true, booking: true, assignedTo: true },
    });

    return NextResponse.json(cleaningJob);
  } catch (error) {
    console.error("Error creating cleaning job:", error);
    return NextResponse.json({ error: "Failed to create cleaning job" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const cleaningJob = await prisma.cleaningJob.update({
      where: { id },
      data: {
        assignedToId: body.assignedToId,
        scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : undefined,
        status: body.status,
        notes: body.notes,
        completedAt: body.status === "COMPLETED" ? new Date() : null,
      },
      include: { property: true, booking: true, assignedTo: true },
    });

    return NextResponse.json(cleaningJob);
  } catch (error) {
    console.error("Error updating cleaning job:", error);
    return NextResponse.json({ error: "Failed to update cleaning job" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.cleaningJob.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting cleaning job:", error);
    return NextResponse.json({ error: "Failed to delete cleaning job" }, { status: 500 });
  }
}

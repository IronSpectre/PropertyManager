import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");

    const where: Record<string, unknown> = {};
    if (propertyId) where.propertyId = propertyId;
    if (status && status !== "all") where.status = status;
    if (priority && priority !== "all") where.priority = priority;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        property: true,
        assignedTo: true,
        createdBy: true,
        _count: { select: { comments: true, attachments: true } },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { propertyId, title, description, type, priority, status, dueDate, assignedToId } = body;

    const task = await prisma.task.create({
      data: {
        propertyId,
        title,
        description,
        type: type || "AD_HOC",
        priority: priority || "MEDIUM",
        status: status || "OPEN",
        dueDate: dueDate ? new Date(dueDate) : null,
        assignedToId,
      },
      include: { property: true, assignedTo: true, createdBy: true },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}

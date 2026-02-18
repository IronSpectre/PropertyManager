import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        property: true,
        assignedTo: true,
        createdBy: true,
        comments: { include: { user: true }, orderBy: { createdAt: "desc" } },
        attachments: { orderBy: { createdAt: "desc" } },
        history: { orderBy: { changedAt: "desc" } },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Get current task for history tracking
    const currentTask = await prisma.task.findUnique({ where: { id } });
    if (!currentTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Track status changes
    const historyEntries = [];
    if (body.status && body.status !== currentTask.status) {
      historyEntries.push({
        taskId: id,
        field: "status",
        oldValue: currentTask.status,
        newValue: body.status,
      });
    }
    if (body.priority && body.priority !== currentTask.priority) {
      historyEntries.push({
        taskId: id,
        field: "priority",
        oldValue: currentTask.priority,
        newValue: body.priority,
      });
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        type: body.type,
        priority: body.priority,
        status: body.status,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        assignedToId: body.assignedToId,
        completedAt: body.status === "COMPLETED" ? new Date() : null,
      },
      include: { property: true, assignedTo: true, createdBy: true },
    });

    // Create history entries
    if (historyEntries.length > 0) {
      await prisma.taskHistory.createMany({ data: historyEntries });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}

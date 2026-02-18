import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        propertyId: body.propertyId,
        type: body.type,
        category: body.category,
        amount: body.amount ? parseFloat(body.amount) : undefined,
        currency: body.currency,
        description: body.description,
        date: body.date ? new Date(body.date) : undefined,
        accountId: body.accountId,
      },
      include: { property: true },
    });

    return NextResponse.json(transaction);
  } catch (error) {
    console.error("Error updating transaction:", error);
    return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.transaction.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return NextResponse.json({ error: "Failed to delete transaction" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");
    const type = searchParams.get("type");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: Record<string, unknown> = {};
    if (propertyId) where.propertyId = propertyId;
    if (type && type !== "all") where.type = type;
    if (from || to) {
      where.date = {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(to) }),
      };
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: { property: true },
      orderBy: { date: "desc" },
    });

    // Calculate totals
    const totals = transactions.reduce(
      (acc, t) => {
        if (t.type === "INCOME") acc.income += t.amount;
        else acc.expense += t.amount;
        return acc;
      },
      { income: 0, expense: 0 }
    );

    return NextResponse.json({ transactions, totals });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { propertyId, type, category, amount, currency, description, date, accountId } = body;

    const transaction = await prisma.transaction.create({
      data: {
        propertyId,
        type,
        category,
        amount: parseFloat(amount),
        currency: currency || "EUR",
        description,
        date: new Date(date),
        accountId,
      },
      include: { property: true },
    });

    return NextResponse.json(transaction);
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
  }
}

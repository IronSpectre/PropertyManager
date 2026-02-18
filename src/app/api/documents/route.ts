import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { DocumentCategory } from "@prisma/client";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");
    const category = searchParams.get("category");

    const where: Record<string, unknown> = {};
    if (propertyId) where.propertyId = propertyId;
    if (category && category !== "all") where.category = category;

    const documents = await prisma.document.findMany({
      where,
      include: { property: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const propertyId = formData.get("propertyId") as string | null;
    const name = formData.get("name") as string;
    const category = formData.get("category") as string;
    const notes = formData.get("notes") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Create uploads directory
    const uploadsDir = join(process.cwd(), "public", "uploads", "documents");
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique filename with sanitized name
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${timestamp}-${sanitizedName}`;
    const filePath = join(uploadsDir, filename);

    // Write file
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    // Save to database
    const document = await prisma.document.create({
      data: {
        propertyId: propertyId || null,
        name: name || file.name,
        filePath: `/uploads/documents/${filename}`,
        fileType: file.type,
        category: (category as DocumentCategory) || DocumentCategory.OTHER,
        notes,
      },
      include: { property: true },
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error("Error uploading document:", error);
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
  }
}

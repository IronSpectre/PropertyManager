import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const items = await prisma.inventoryItem.findMany({
      where: { propertyId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
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
    const formData = await request.formData();

    const name = formData.get("name") as string;
    const description = formData.get("description") as string | null;
    const category = formData.get("category") as string;
    const quantity = parseInt(formData.get("quantity") as string) || 1;
    const condition = formData.get("condition") as string;
    const location = formData.get("location") as string | null;
    const brand = formData.get("brand") as string | null;
    const model = formData.get("model") as string | null;
    const serialNumber = formData.get("serialNumber") as string | null;
    const purchaseDate = formData.get("purchaseDate") as string | null;
    const purchasePrice = formData.get("purchasePrice") as string | null;
    const notes = formData.get("notes") as string | null;
    const image = formData.get("image") as File | null;

    if (!name) {
      return NextResponse.json(
        { error: "Item name is required" },
        { status: 400 }
      );
    }

    let imagePath = null;

    // Handle image upload
    if (image && image.size > 0) {
      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), "public", "uploads", "inventory", id);
      await mkdir(uploadsDir, { recursive: true });

      // Generate unique filename
      const ext = path.extname(image.name);
      const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
      const filepath = path.join(uploadsDir, filename);

      await writeFile(filepath, buffer);
      imagePath = `/uploads/inventory/${id}/${filename}`;
    }

    const item = await prisma.inventoryItem.create({
      data: {
        propertyId: id,
        name,
        description: description || null,
        category: category as any || "OTHER",
        quantity,
        condition: condition as any || "GOOD",
        location: location || null,
        brand: brand || null,
        model: model || null,
        serialNumber: serialNumber || null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
        imagePath,
        notes: notes || null,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error creating inventory item:", error);
    return NextResponse.json(
      { error: "Failed to create inventory item" },
      { status: 500 }
    );
  }
}

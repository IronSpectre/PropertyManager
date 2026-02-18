import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      include: { property: true },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error fetching inventory item:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory item" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formData = await request.formData();

    const currentItem = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!currentItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

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
    const removeImage = formData.get("removeImage") === "true";

    let imagePath = currentItem.imagePath;

    // Handle image removal
    if (removeImage && currentItem.imagePath) {
      try {
        const oldPath = path.join(process.cwd(), "public", currentItem.imagePath);
        await unlink(oldPath);
      } catch {
        // Ignore if file doesn't exist
      }
      imagePath = null;
    }

    // Handle new image upload
    if (image && image.size > 0) {
      // Delete old image if exists
      if (currentItem.imagePath) {
        try {
          const oldPath = path.join(process.cwd(), "public", currentItem.imagePath);
          await unlink(oldPath);
        } catch {
          // Ignore if file doesn't exist
        }
      }

      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadsDir = path.join(process.cwd(), "public", "uploads", "inventory", currentItem.propertyId);
      await mkdir(uploadsDir, { recursive: true });

      const ext = path.extname(image.name);
      const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
      const filepath = path.join(uploadsDir, filename);

      await writeFile(filepath, buffer);
      imagePath = `/uploads/inventory/${currentItem.propertyId}/${filename}`;
    }

    const item = await prisma.inventoryItem.update({
      where: { id },
      data: {
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
    console.error("Error updating inventory item:", error);
    return NextResponse.json(
      { error: "Failed to update inventory item" },
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

    const item = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Delete associated image
    if (item.imagePath) {
      try {
        const imagePath = path.join(process.cwd(), "public", item.imagePath);
        await unlink(imagePath);
      } catch {
        // Ignore if file doesn't exist
      }
    }

    await prisma.inventoryItem.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting inventory item:", error);
    return NextResponse.json(
      { error: "Failed to delete inventory item" },
      { status: 500 }
    );
  }
}

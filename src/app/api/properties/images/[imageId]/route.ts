import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ imageId: string }> }
) {
  try {
    const { imageId } = await params;

    const image = await prisma.propertyImage.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Delete file from filesystem
    try {
      const filePath = path.join(process.cwd(), "public", image.filePath);
      await unlink(filePath);
    } catch {
      // Ignore if file doesn't exist
    }

    // Delete from database
    await prisma.propertyImage.delete({
      where: { id: imageId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting property image:", error);
    return NextResponse.json(
      { error: "Failed to delete property image" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ imageId: string }> }
) {
  try {
    const { imageId } = await params;
    const body = await request.json();

    const image = await prisma.propertyImage.update({
      where: { id: imageId },
      data: {
        caption: body.caption,
        order: body.order,
      },
    });

    return NextResponse.json(image);
  } catch (error) {
    console.error("Error updating property image:", error);
    return NextResponse.json(
      { error: "Failed to update property image" },
      { status: 500 }
    );
  }
}

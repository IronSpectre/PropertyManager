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

    const images = await prisma.propertyImage.findMany({
      where: { propertyId: id },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(images);
  } catch (error) {
    console.error("Error fetching property images:", error);
    return NextResponse.json(
      { error: "Failed to fetch property images" },
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

    const files = formData.getAll("images") as File[];
    const captions = formData.getAll("captions") as string[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No images provided" },
        { status: 400 }
      );
    }

    // Get current max order
    const maxOrder = await prisma.propertyImage.findFirst({
      where: { propertyId: id },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    let currentOrder = (maxOrder?.order ?? -1) + 1;

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "gallery", id);
    await mkdir(uploadsDir, { recursive: true });

    const createdImages = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file || file.size === 0) continue;

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const ext = path.extname(file.name);
      const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
      const filepath = path.join(uploadsDir, filename);

      await writeFile(filepath, buffer);

      const image = await prisma.propertyImage.create({
        data: {
          propertyId: id,
          filePath: `/uploads/gallery/${id}/${filename}`,
          fileName: file.name,
          caption: captions[i] || null,
          order: currentOrder++,
        },
      });

      createdImages.push(image);
    }

    return NextResponse.json(createdImages);
  } catch (error) {
    console.error("Error uploading property images:", error);
    return NextResponse.json(
      { error: "Failed to upload property images" },
      { status: 500 }
    );
  }
}

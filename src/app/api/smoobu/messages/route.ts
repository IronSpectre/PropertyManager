import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { smoobuClient } from "@/lib/smoobu/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("bookingId");

    if (!bookingId) {
      return NextResponse.json(
        { error: "bookingId is required" },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { messages: { orderBy: { sentAt: "asc" } } },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // If the booking has a smoobuId, try to sync messages from Smoobu
    if (booking.smoobuId) {
      try {
        const smoobuMessages = await smoobuClient.getMessages(
          parseInt(booking.smoobuId)
        );

        // Sync any new messages
        for (const smoobuMessage of smoobuMessages) {
          const existingMessage = await prisma.message.findUnique({
            where: { smoobuId: String(smoobuMessage.id) },
          });

          if (!existingMessage) {
            const messageData = smoobuClient.mapMessageToLocal(
              smoobuMessage,
              booking.id
            );
            await prisma.message.create({ data: messageData });
          }
        }
      } catch (syncError) {
        console.error("Error syncing messages from Smoobu:", syncError);
        // Continue with local messages if sync fails
      }
    }

    // Fetch fresh messages after potential sync
    const messages = await prisma.message.findMany({
      where: { bookingId },
      orderBy: { sentAt: "asc" },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bookingId, content, subject } = body;

    if (!bookingId || !content) {
      return NextResponse.json(
        { error: "bookingId and content are required" },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // If booking has smoobuId, send via Smoobu
    if (booking.smoobuId) {
      try {
        await smoobuClient.sendMessageToGuest(
          parseInt(booking.smoobuId),
          content,
          subject
        );
      } catch (smoobuError) {
        console.error("Error sending message via Smoobu:", smoobuError);
        return NextResponse.json(
          { error: "Failed to send message via Smoobu" },
          { status: 500 }
        );
      }
    }

    // Create local message record
    const message = await prisma.message.create({
      data: {
        bookingId,
        content,
        sender: "HOST",
        sentAt: new Date(),
        syncedAt: booking.smoobuId ? new Date() : null,
      },
    });

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}

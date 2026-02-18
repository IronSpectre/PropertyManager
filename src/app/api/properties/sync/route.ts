import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { smoobuClient } from "@/lib/smoobu/client";

export async function POST() {
  try {
    const apartments = await smoobuClient.getApartments();

    if (apartments.length === 0) {
      return NextResponse.json({
        synced: 0,
        created: 0,
        updated: 0,
        message: "No apartments found in Smoobu",
      });
    }

    let created = 0;
    let updated = 0;

    for (const apartment of apartments) {
      const propertyData = smoobuClient.mapApartmentToProperty(apartment);

      const existing = await prisma.property.findUnique({
        where: { smoobuId: propertyData.smoobuId },
      });

      if (existing) {
        await prisma.property.update({
          where: { id: existing.id },
          data: {
            name: propertyData.name,
            address: propertyData.address || existing.address,
            city: propertyData.city || existing.city,
            postalCode: propertyData.postalCode,
            country: propertyData.country || existing.country,
            latitude: propertyData.latitude,
            longitude: propertyData.longitude,
            bedrooms: propertyData.bedrooms,
          },
        });
        updated++;
      } else {
        await prisma.property.create({
          data: {
            ...propertyData,
            status: "ACTIVE",
          },
        });
        created++;
      }
    }

    return NextResponse.json({
      synced: apartments.length,
      created,
      updated,
      message: `Synced ${apartments.length} properties from Smoobu`,
    });
  } catch (error) {
    console.error("Error syncing properties from Smoobu:", error);
    return NextResponse.json(
      { error: "Failed to sync properties from Smoobu" },
      { status: 500 }
    );
  }
}

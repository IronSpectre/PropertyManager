import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { PropertyForm } from "@/components/properties/property-form";

async function getProperty(id: string) {
  try {
    return await prisma.property.findUnique({
      where: { id },
      include: {
        payoutAccount: true,
        rentSourceAccount: true,
      },
    });
  } catch {
    return null;
  }
}

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getProperty(id);

  if (!property) {
    notFound();
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Property</h1>
        <p className="text-muted-foreground">Update property details</p>
      </div>
      <PropertyForm property={property} />
    </div>
  );
}

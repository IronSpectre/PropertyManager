import Link from "next/link";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SyncSmoobuButton } from "@/components/properties/sync-smoobu-button";

export const dynamic = "force-dynamic";

async function getProperties() {
  try {
    return await prisma.property.findMany({
      include: {
        _count: {
          select: {
            bookings: true,
            documents: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error fetching properties:", error);
    return [];
  }
}

const statusLabel: Record<string, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  MAINTENANCE: "Maintenance",
};

export default async function PropertiesPage() {
  const properties = await getProperties();

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-light text-foreground">Properties</h1>
          <p className="text-muted-foreground mt-1">
            {properties.length} {properties.length === 1 ? 'property' : 'properties'} in your portfolio
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SyncSmoobuButton />
          <Button asChild>
            <Link href="/properties/new">Add Property</Link>
          </Button>
        </div>
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-16 border border-border rounded-lg bg-card">
          <h2 className="text-lg font-medium mb-2">No properties yet</h2>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            Add your first property to start managing your rental portfolio.
          </p>
          <Button asChild>
            <Link href="/properties/new">Add Property</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <Link key={property.id} href={`/properties/${property.id}`}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-medium text-lg">{property.name}</h3>
                    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                      property.status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-700"
                        : property.status === "MAINTENANCE"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-gray-100 text-gray-700"
                    }`}>
                      {statusLabel[property.status]}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground mb-1">
                    {property.address}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {property.city}{property.postalCode ? `, ${property.postalCode}` : ''}, {property.country}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground pt-3 border-t">
                    {property.bedrooms && (
                      <span>{property.bedrooms} bed</span>
                    )}
                    {property.rent && (
                      <span>£{property.rent.toFixed(0)}/mo</span>
                    )}
                    {property.tenancyType && property.tenancyType !== "OTHER" && (
                      <span>{property.tenancyType}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
                    <span>{property._count.bookings} bookings</span>
                    <span>{property._count.documents} documents</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

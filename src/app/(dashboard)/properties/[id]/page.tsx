import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoryList } from "@/components/inventory/inventory-list";
import { PropertyGallery } from "@/components/gallery/property-gallery";

async function getProperty(id: string) {
  try {
    return await prisma.property.findUnique({
      where: { id },
      include: {
        payoutAccount: true,
        rentSourceAccount: true,
        documents: { orderBy: { createdAt: "desc" } },
      },
    });
  } catch {
    return null;
  }
}

export default async function PropertyDetailPage({
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
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-light text-foreground">{property.name}</h1>
            <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${
              property.status === "ACTIVE"
                ? "bg-emerald-50 text-emerald-700"
                : property.status === "MAINTENANCE"
                ? "bg-amber-50 text-amber-700"
                : "bg-gray-100 text-gray-700"
            }`}>
              {property.status.toLowerCase()}
            </span>
          </div>
          <p className="text-muted-foreground mt-1">
            {property.address}, {property.city}, {property.country}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link href="/properties">Back</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/properties/${property.id}/rates`}>
              Manage Rates
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/properties/${property.id}/edit`}>
              Edit Property
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Address</span>
                  <span>{property.address}</span>
                  <span className="text-muted-foreground">City</span>
                  <span>{property.city}</span>
                  <span className="text-muted-foreground">Postal Code</span>
                  <span>{property.postalCode || "-"}</span>
                  <span className="text-muted-foreground">Country</span>
                  <span>{property.country}</span>
                  {property.tenancyType && (
                    <>
                      <span className="text-muted-foreground">Tenancy Type</span>
                      <span>{property.tenancyType}</span>
                    </>
                  )}
                  {property.bedrooms && (
                    <>
                      <span className="text-muted-foreground">Bedrooms</span>
                      <span>{property.bedrooms}</span>
                    </>
                  )}
                  {property.rent && (
                    <>
                      <span className="text-muted-foreground">Rent</span>
                      <span>£{property.rent.toFixed(2)}/month</span>
                    </>
                  )}
                  {property.dailyRate && (
                    <>
                      <span className="text-muted-foreground">Daily Rate</span>
                      <span>£{property.dailyRate.toFixed(2)}/night</span>
                    </>
                  )}
                  {property.smoobuId && (
                    <>
                      <span className="text-muted-foreground">Smoobu ID</span>
                      <span>{property.smoobuId}</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Owner Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {property.ownerName || property.ownerContact ? (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {property.ownerName && (
                      <>
                        <span className="text-muted-foreground">Name</span>
                        <span>{property.ownerName}</span>
                      </>
                    )}
                    {property.ownerContact && (
                      <>
                        <span className="text-muted-foreground">Contact</span>
                        <span>{property.ownerContact}</span>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No owner information
                  </p>
                )}
                {property.registrationInfo && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground mb-1">
                      Registration Info
                    </p>
                    <p className="text-sm whitespace-pre-wrap">
                      {property.registrationInfo}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tenant Information */}
            {(property.tenantName || property.tenantEmail || property.tenantPhone) && (
              <Card>
                <CardHeader>
                  <CardTitle>Tenant Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {property.tenantName && (
                      <>
                        <span className="text-muted-foreground">Name</span>
                        <span>{property.tenantName}</span>
                      </>
                    )}
                    {property.tenantEmail && (
                      <>
                        <span className="text-muted-foreground">Email</span>
                        <span>{property.tenantEmail}</span>
                      </>
                    )}
                    {property.tenantPhone && (
                      <>
                        <span className="text-muted-foreground">Phone</span>
                        <span>{property.tenantPhone}</span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bank Accounts */}
            {(property.rentSourceAccount || property.payoutAccount) && (
              <Card>
                <CardHeader>
                  <CardTitle>Bank Accounts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {property.rentSourceAccount && (
                      <>
                        <span className="text-muted-foreground">Rent From</span>
                        <span>
                          {property.rentSourceAccount.name}
                          {property.rentSourceAccount.bankName && (
                            <span className="text-muted-foreground"> ({property.rentSourceAccount.bankName})</span>
                          )}
                        </span>
                      </>
                    )}
                    {property.payoutAccount && (
                      <>
                        <span className="text-muted-foreground">Income To</span>
                        <span>
                          {property.payoutAccount.name}
                          {property.payoutAccount.bankName && (
                            <span className="text-muted-foreground"> ({property.payoutAccount.bankName})</span>
                          )}
                        </span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Platform Credentials */}
            {(property.airbnbEmail || property.bookingComEmail) && (
              <Card>
                <CardHeader>
                  <CardTitle>Platform Credentials</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    {property.airbnbEmail && (
                      <div>
                        <p className="text-muted-foreground mb-1">Airbnb</p>
                        <p>{property.airbnbEmail}</p>
                        {property.airbnbPassword && (
                          <p className="text-muted-foreground">Password saved</p>
                        )}
                      </div>
                    )}
                    {property.bookingComEmail && (
                      <div className={property.airbnbEmail ? "pt-2 border-t" : ""}>
                        <p className="text-muted-foreground mb-1">Booking.com</p>
                        <p>{property.bookingComEmail}</p>
                        {property.bookingComPassword && (
                          <p className="text-muted-foreground">Password saved</p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {property.notes && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{property.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="gallery" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Property Gallery</CardTitle>
              <CardDescription>Interior photos and images of this property</CardDescription>
            </CardHeader>
            <CardContent>
              <PropertyGallery propertyId={property.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory</CardTitle>
              <CardDescription>Track items and furnishings in this property</CardDescription>
            </CardHeader>
            <CardContent>
              <InventoryList propertyId={property.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Documents</CardTitle>
                <CardDescription>Property files and media</CardDescription>
              </div>
              <Button asChild size="sm">
                <Link href={`/properties/${property.id}/documents/upload`}>
                  Upload
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {property.documents.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No documents uploaded
                </p>
              ) : (
                <div className="space-y-3">
                  {property.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {doc.category.toLowerCase()}
                        </p>
                      </div>
                      <a
                        href={encodeURI(doc.filePath)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Open
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

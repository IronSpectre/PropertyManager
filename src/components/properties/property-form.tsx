"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { Property, PayoutAccount } from "@prisma/client";

interface PropertyFormProps {
  property?: Property & {
    payoutAccount?: PayoutAccount | null;
    rentSourceAccount?: PayoutAccount | null;
  };
}

export function PropertyForm({ property }: PropertyFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<PayoutAccount[]>([]);
  const [showPasswords, setShowPasswords] = useState({ airbnb: false, bookingCom: false });

  useEffect(() => {
    async function fetchBankAccounts() {
      try {
        const res = await fetch("/api/bank-accounts");
        if (res.ok) {
          const data = await res.json();
          setBankAccounts(data);
        }
      } catch (error) {
        console.error("Failed to fetch bank accounts:", error);
      }
    }
    fetchBankAccounts();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      address: formData.get("address") as string,
      city: formData.get("city") as string,
      postalCode: formData.get("postalCode") as string,
      country: formData.get("country") as string,
      tenancyType: formData.get("tenancyType") as string,
      bedrooms: formData.get("bedrooms") as string,
      rent: formData.get("rent") as string,
      rentDueDay: formData.get("rentDueDay") as string,
      dailyRate: formData.get("dailyRate") as string,
      smoobuId: formData.get("smoobuId") as string,
      notes: formData.get("notes") as string,
      status: formData.get("status") as string,
      // Tenant info
      tenantName: formData.get("tenantName") as string,
      tenantEmail: formData.get("tenantEmail") as string,
      tenantPhone: formData.get("tenantPhone") as string,
      // Bank accounts
      rentSourceAccountId: formData.get("rentSourceAccountId") as string,
      payoutAccountId: formData.get("payoutAccountId") as string,
      // Platform credentials
      airbnbEmail: formData.get("airbnbEmail") as string,
      airbnbPassword: formData.get("airbnbPassword") as string,
      bookingComEmail: formData.get("bookingComEmail") as string,
      bookingComPassword: formData.get("bookingComPassword") as string,
    };

    try {
      const url = property
        ? `/api/properties/${property.id}`
        : "/api/properties";
      const method = property ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save property");
      }

      toast.success(property ? "Property updated" : "Property created");
      router.push("/properties");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="bg-card rounded-lg border border-border shadow-sm p-6 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Property Name</Label>
          <Input
            id="name"
            name="name"
            defaultValue={property?.name}
            placeholder="e.g. Beach House Villa"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            name="address"
            defaultValue={property?.address}
            placeholder="e.g. 123 Ocean Drive"
            required
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              name="city"
              defaultValue={property?.city}
              placeholder="e.g. London"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postalCode">Postal Code</Label>
            <Input
              id="postalCode"
              name="postalCode"
              defaultValue={property?.postalCode || ""}
              placeholder="e.g. SW1A 1AA"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              name="country"
              defaultValue={property?.country || "United Kingdom"}
              placeholder="e.g. United Kingdom"
              required
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="tenancyType">Tenancy Type</Label>
            <Select name="tenancyType" defaultValue={property?.tenancyType || "OTHER"}>
              <SelectTrigger>
                <SelectValue placeholder="Select tenancy type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GUARDIANSHIP">Guardianship</SelectItem>
                <SelectItem value="AST">AST</SelectItem>
                <SelectItem value="COMMERCIAL">Commercial</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bedrooms">Bedrooms</Label>
            <Input
              id="bedrooms"
              name="bedrooms"
              type="number"
              min="0"
              defaultValue={property?.bedrooms || ""}
              placeholder="e.g. 3"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="rent">Rent (£/month)</Label>
            <Input
              id="rent"
              name="rent"
              type="number"
              min="0"
              step="0.01"
              defaultValue={property?.rent || ""}
              placeholder="e.g. 1500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rentDueDay">Rent Due Day</Label>
            <Select name="rentDueDay" defaultValue={property?.rentDueDay?.toString() || ""}>
              <SelectTrigger>
                <SelectValue placeholder="Select day of month" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                  <SelectItem key={day} value={day.toString()}>
                    {day}{day === 1 ? "st" : day === 2 ? "nd" : day === 3 ? "rd" : "th"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dailyRate">Daily Rate (£/night)</Label>
            <Input
              id="dailyRate"
              name="dailyRate"
              type="number"
              min="0"
              step="0.01"
              defaultValue={property?.dailyRate || ""}
              placeholder="e.g. 100"
            />
            <p className="text-xs text-muted-foreground">For break-even calculation</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select name="status" defaultValue={property?.status || "ACTIVE"}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="smoobuId">Smoobu ID (optional)</Label>
            <Input
              id="smoobuId"
              name="smoobuId"
              defaultValue={property?.smoobuId || ""}
              placeholder="e.g. 3093151"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea
            id="notes"
            name="notes"
            defaultValue={property?.notes || ""}
            placeholder="Any additional notes about this property..."
            rows={3}
          />
        </div>
      </div>

      {/* Tenant Information */}
      <div className="bg-card rounded-lg border border-border shadow-sm p-6 space-y-6">
        <h3 className="text-lg font-medium">Tenant Information</h3>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="tenantName">Tenant Name</Label>
            <Input
              id="tenantName"
              name="tenantName"
              defaultValue={property?.tenantName || ""}
              placeholder="e.g. John Smith"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tenantEmail">Tenant Email</Label>
            <Input
              id="tenantEmail"
              name="tenantEmail"
              type="email"
              defaultValue={property?.tenantEmail || ""}
              placeholder="e.g. john@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tenantPhone">Tenant Phone</Label>
            <Input
              id="tenantPhone"
              name="tenantPhone"
              defaultValue={property?.tenantPhone || ""}
              placeholder="e.g. +44 7700 900000"
            />
          </div>
        </div>
      </div>

      {/* Bank Accounts */}
      <div className="bg-card rounded-lg border border-border shadow-sm p-6 space-y-6">
        <h3 className="text-lg font-medium">Bank Accounts</h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="rentSourceAccountId">Rent Paid From (Tenant&apos;s Account)</Label>
            <Select
              name="rentSourceAccountId"
              defaultValue={property?.rentSourceAccountId || "none"}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select bank account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {bankAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} {account.bankName ? `(${account.bankName})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Bank account the rent is paid from</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="payoutAccountId">Income Goes To</Label>
            <Select
              name="payoutAccountId"
              defaultValue={property?.payoutAccountId || "none"}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select bank account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {bankAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} {account.bankName ? `(${account.bankName})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Bank account where Airbnb/booking income goes</p>
          </div>
        </div>
      </div>

      {/* Platform Credentials */}
      <div className="bg-card rounded-lg border border-border shadow-sm p-6 space-y-6">
        <h3 className="text-lg font-medium">Platform Credentials</h3>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="airbnbEmail">Airbnb Email</Label>
              <Input
                id="airbnbEmail"
                name="airbnbEmail"
                type="email"
                defaultValue={property?.airbnbEmail || ""}
                placeholder="e.g. airbnb@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="airbnbPassword">Airbnb Password</Label>
              <div className="relative">
                <Input
                  id="airbnbPassword"
                  name="airbnbPassword"
                  type={showPasswords.airbnb ? "text" : "password"}
                  defaultValue={property?.airbnbPassword || ""}
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPasswords(prev => ({ ...prev, airbnb: !prev.airbnb }))}
                >
                  {showPasswords.airbnb ? "Hide" : "Show"}
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bookingComEmail">Booking.com Email</Label>
              <Input
                id="bookingComEmail"
                name="bookingComEmail"
                type="email"
                defaultValue={property?.bookingComEmail || ""}
                placeholder="e.g. booking@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bookingComPassword">Booking.com Password</Label>
              <div className="relative">
                <Input
                  id="bookingComPassword"
                  name="bookingComPassword"
                  type={showPasswords.bookingCom ? "text" : "password"}
                  defaultValue={property?.bookingComPassword || ""}
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPasswords(prev => ({ ...prev, bookingCom: !prev.bookingCom }))}
                >
                  {showPasswords.bookingCom ? "Hide" : "Show"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? property
              ? "Saving..."
              : "Adding..."
            : property
            ? "Save Changes"
            : "Add Property"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

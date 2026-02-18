"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function UploadDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: propertyId } = use(params);
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUploading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("propertyId", propertyId);

    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        toast.success("Document uploaded");
        router.push(`/properties/${propertyId}?tab=documents`);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to upload");
      }
    } catch {
      toast.error("Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-light text-foreground">Upload Document</h1>
        <p className="text-muted-foreground mt-1">Add a document to this property</p>
      </div>

      {/* Upload Form */}
      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden max-w-xl">
        <form onSubmit={handleUpload} className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="file">File</Label>
            <Input id="file" name="file" type="file" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Document Name</Label>
            <Input id="name" name="name" placeholder="e.g. Rental Agreement 2024" />
            <p className="text-xs text-muted-foreground">Leave blank to use filename</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select name="category" defaultValue="OTHER">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CONTRACT">Contract</SelectItem>
                <SelectItem value="INSURANCE">Insurance</SelectItem>
                <SelectItem value="LICENSE">License</SelectItem>
                <SelectItem value="TAX">Tax</SelectItem>
                <SelectItem value="INVOICE">Invoice</SelectItem>
                <SelectItem value="MANUAL">Manual</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isUploading}>
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href={`/properties/${propertyId}`}>Cancel</Link>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

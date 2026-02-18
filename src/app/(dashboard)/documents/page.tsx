"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Document {
  id: string;
  name: string;
  filePath: string;
  fileType: string | null;
  category: string;
  notes: string | null;
  createdAt: string;
  property: { id: string; name: string } | null;
}

interface Property {
  id: string;
  name: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchDocuments = async () => {
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      const response = await fetch(`/api/documents?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch {
      console.error("Failed to fetch documents");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await fetch("/api/properties");
      if (response.ok) {
        const data = await response.json();
        setProperties(data);
      }
    } catch {
      console.error("Failed to fetch properties");
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchProperties();
  }, [categoryFilter]);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUploading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        toast.success("Document uploaded");
        setDialogOpen(false);
        fetchDocuments();
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

  if (isLoading) {
    return (
      <div className="space-y-10">
        <div>
          <h1 className="text-2xl font-light text-foreground">Documents</h1>
          <p className="text-muted-foreground mt-1">Loading documents...</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-light text-foreground">Documents</h1>
          <p className="text-muted-foreground mt-1">
            {documents.length} {documents.length === 1 ? 'document' : 'documents'} stored
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>Upload Document</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
              <DialogDescription>
                Add a new document to your repository
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file">File</Label>
                <Input id="file" name="file" type="file" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Document Name</Label>
                <Input id="name" name="name" placeholder="Contract 2024" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="propertyId">Property (optional)</Label>
                <Select name="propertyId">
                  <SelectTrigger>
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <Button type="submit" className="w-full" disabled={isUploading}>
                {isUploading ? "Uploading..." : "Upload"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">Filter:</span>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
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

      {documents.length === 0 ? (
        <div className="text-center py-16 border border-border rounded-lg bg-card">
          <h2 className="text-lg font-medium mb-2">No documents</h2>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            Upload your first document to get started.
          </p>
          <Button onClick={() => setDialogOpen(true)}>Upload Document</Button>
        </div>
      ) : (
        /* Documents List */
        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Property</th>
                <th className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Category</th>
                <th className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Date</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-sm text-muted-foreground">{doc.fileType || "File"}</p>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell text-muted-foreground">
                    {doc.property?.name || "—"}
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                      {doc.category.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell text-muted-foreground">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <a
                      href={encodeURI(doc.filePath)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Open
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

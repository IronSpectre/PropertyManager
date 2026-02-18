"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function DeletePropertyButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete "${name}" and all its bookings, images, and documents? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/properties/${id}`, { method: "DELETE" });
      if (response.ok) {
        toast.success(`"${name}" deleted`);
        router.refresh();
      } else {
        toast.error("Failed to delete property");
      }
    } catch {
      toast.error("Failed to delete property");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="text-xs text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
    >
      {deleting ? "Deleting..." : "Delete"}
    </button>
  );
}

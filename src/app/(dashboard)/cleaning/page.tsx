"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { GripVertical, Home, User, Calendar } from "lucide-react";

interface CleaningJob {
  id: string;
  scheduledDate: string;
  status: string;
  completedAt: string | null;
  notes: string | null;
  property: { id: string; name: string };
  booking: { id: string; guestName: string; checkOut: string } | null;
  assignedTo: { id: string; name: string } | null;
}

const columns = [
  { id: "PENDING", title: "Pending", color: "bg-amber-500", statuses: ["PENDING", "SCHEDULED"] },
  { id: "IN_PROGRESS", title: "In Progress", color: "bg-blue-500", statuses: ["IN_PROGRESS"] },
  { id: "COMPLETED", title: "Completed", color: "bg-emerald-500", statuses: ["COMPLETED"] },
];

export default function CleaningPage() {
  const [jobs, setJobs] = useState<CleaningJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  const [draggedJob, setDraggedJob] = useState<CleaningJob | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      const response = await fetch("/api/cleaning");
      if (response.ok) {
        const data = await response.json();
        setJobs(data);

        // Extract unique properties for filter
        const uniqueProperties = Array.from(
          new Map(data.map((j: CleaningJob) => [j.property.id, j.property])).values()
        ) as { id: string; name: string }[];
        setProperties(uniqueProperties);
      }
    } catch {
      console.error("Failed to fetch cleaning jobs");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleDragStart = (e: React.DragEvent, job: CleaningJob) => {
    setDraggedJob(job);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggedJob) {
      return;
    }

    // Check if already in this column
    const column = columns.find(c => c.id === newStatus);
    if (column?.statuses.includes(draggedJob.status)) {
      setDraggedJob(null);
      return;
    }

    // Optimistically update the UI
    const previousJobs = [...jobs];
    setJobs(jobs.map(j =>
      j.id === draggedJob.id ? { ...j, status: newStatus } : j
    ));

    try {
      const response = await fetch(`/api/cleaning/${draggedJob.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update job");
      }

      toast.success(`Job moved to ${column?.title}`);
    } catch {
      // Revert on error
      setJobs(previousJobs);
      toast.error("Failed to update job status");
    }

    setDraggedJob(null);
  };

  const getJobsByColumn = (columnId: string) => {
    const column = columns.find(c => c.id === columnId);
    if (!column) return [];

    return jobs
      .filter(job => column.statuses.includes(job.status))
      .filter(job => propertyFilter === "all" || job.property.id === propertyFilter)
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
  };

  const filteredJobs = propertyFilter === "all"
    ? jobs
    : jobs.filter(j => j.property.id === propertyFilter);

  const cancelledJobs = filteredJobs.filter(j => j.status === "CANCELLED");

  if (isLoading) {
    return (
      <div className="space-y-10">
        <div>
          <h1 className="text-2xl font-light text-foreground">Cleaning</h1>
          <p className="text-muted-foreground mt-1">Loading cleaning jobs...</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-light text-foreground">Cleaning</h1>
          <p className="text-muted-foreground mt-1">
            {filteredJobs.length} {filteredJobs.length === 1 ? "job" : "jobs"} total
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={propertyFilter} onValueChange={setPropertyFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by property" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All properties</SelectItem>
              {properties.map((property) => (
                <SelectItem key={property.id} value={property.id}>
                  {property.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((column) => {
          const columnJobs = getJobsByColumn(column.id);
          const isOver = dragOverColumn === column.id;

          return (
            <div
              key={column.id}
              className={`flex flex-col rounded-lg border border-border bg-muted/30 transition-colors ${
                isOver ? "ring-2 ring-primary ring-offset-2" : ""
              }`}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div className="flex items-center gap-2 p-3 border-b border-border">
                <div className={`w-2 h-2 rounded-full ${column.color}`} />
                <h3 className="font-medium text-sm">{column.title}</h3>
                <span className="ml-auto text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-full">
                  {columnJobs.length}
                </span>
              </div>

              {/* Jobs Container */}
              <div className="flex-1 p-2 space-y-2 min-h-[200px] overflow-y-auto max-h-[calc(100vh-300px)]">
                {columnJobs.length === 0 ? (
                  <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
                    No jobs
                  </div>
                ) : (
                  columnJobs.map((job) => (
                    <Card
                      key={job.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, job)}
                      className={`p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${
                        draggedJob?.id === job.id ? "opacity-50" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground/50 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <Home className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="font-medium text-sm truncate">
                              {job.property.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(job.scheduledDate).toLocaleDateString()}</span>
                          </div>

                          {job.booking && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              After: {job.booking.guestName}
                            </p>
                          )}

                          {job.assignedTo && (
                            <div className="flex items-center gap-1.5 mt-2 text-[10px] text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>{job.assignedTo.name}</span>
                            </div>
                          )}

                          {job.notes && (
                            <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2 italic">
                              {job.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cancelled Jobs Section */}
      {cancelledJobs.length > 0 && (
        <div className="border-t border-border pt-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Cancelled ({cancelledJobs.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {cancelledJobs.map((job) => (
              <div
                key={job.id}
                className="text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-md"
              >
                {job.property.name} - {new Date(job.scheduledDate).toLocaleDateString()}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

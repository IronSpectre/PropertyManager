"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { GripVertical, Plus } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string | null;
  type: string;
  priority: string;
  status: string;
  dueDate: string | null;
  property: { id: string; name: string } | null;
  assignedTo: { id: string; name: string } | null;
  createdBy: { id: string; name: string };
  _count: { comments: number; attachments: number };
}

const columns = [
  { id: "OPEN", title: "Open", color: "bg-amber-500" },
  { id: "IN_PROGRESS", title: "In Progress", color: "bg-blue-500" },
  { id: "COMPLETED", title: "Completed", color: "bg-emerald-500" },
];

const priorityColors: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-700",
  MEDIUM: "bg-blue-50 text-blue-700",
  HIGH: "bg-orange-50 text-orange-700",
  URGENT: "bg-red-50 text-red-700",
};

const priorityLabel: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (priorityFilter !== "all") params.set("priority", priorityFilter);
      const response = await fetch(`/api/tasks?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch {
      console.error("Failed to fetch tasks");
    } finally {
      setIsLoading(false);
    }
  }, [priorityFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
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

    if (!draggedTask || draggedTask.status === newStatus) {
      setDraggedTask(null);
      return;
    }

    // Optimistically update the UI
    const previousTasks = [...tasks];
    setTasks(tasks.map(t =>
      t.id === draggedTask.id ? { ...t, status: newStatus } : t
    ));

    try {
      const response = await fetch(`/api/tasks/${draggedTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draggedTask, status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update task");
      }

      toast.success(`Task moved to ${columns.find(c => c.id === newStatus)?.title}`);
    } catch {
      // Revert on error
      setTasks(previousTasks);
      toast.error("Failed to update task status");
    }

    setDraggedTask(null);
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  if (isLoading) {
    return (
      <div className="space-y-10">
        <div>
          <h1 className="text-2xl font-light text-foreground">Tasks</h1>
          <p className="text-muted-foreground mt-1">Loading tasks...</p>
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
          <h1 className="text-2xl font-light text-foreground">Tasks</h1>
          <p className="text-muted-foreground mt-1">
            {tasks.length} {tasks.length === 1 ? "task" : "tasks"} total
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
            </SelectContent>
          </Select>
          <Button asChild>
            <Link href="/tasks/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Link>
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((column) => {
          const columnTasks = getTasksByStatus(column.id);
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
                  {columnTasks.length}
                </span>
              </div>

              {/* Tasks Container */}
              <div className="flex-1 p-2 space-y-2 min-h-[200px] overflow-y-auto max-h-[calc(100vh-300px)]">
                {columnTasks.length === 0 ? (
                  <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
                    No tasks
                  </div>
                ) : (
                  columnTasks.map((task) => (
                    <Card
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      className={`p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${
                        draggedTask?.id === task.id ? "opacity-50" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground/50 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/tasks/${task.id}`}
                            className="font-medium text-sm hover:text-primary transition-colors line-clamp-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {task.title}
                          </Link>

                          {task.property && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              {task.property.name}
                            </p>
                          )}

                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded ${
                                priorityColors[task.priority]
                              }`}
                            >
                              {priorityLabel[task.priority]}
                            </span>

                            {task.dueDate && (
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>

                          {task.assignedTo && (
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {task.assignedTo.name}
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

      {/* Cancelled Tasks Section */}
      {tasks.filter(t => t.status === "CANCELLED").length > 0 && (
        <div className="border-t border-border pt-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Cancelled ({tasks.filter(t => t.status === "CANCELLED").length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {tasks
              .filter(t => t.status === "CANCELLED")
              .map((task) => (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className="text-sm text-muted-foreground hover:text-foreground bg-muted px-3 py-1.5 rounded-md transition-colors"
                >
                  {task.title}
                </Link>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

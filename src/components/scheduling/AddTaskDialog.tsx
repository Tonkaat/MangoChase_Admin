import { useState, useCallback } from "react";
import { format } from "date-fns";
import { CalendarIcon, Plus, X, Users, Layers, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import type { Task, TaskType, TaskPriority } from "@/types/task.types";
import { TASK_TYPE_CONFIG, TASK_PRIORITY_CONFIG } from "@/types/task.types";

export interface Cluster {
  id: string;
  name: string;
  /** UID of the farmer assigned to this cluster */
  assignedFarmerId?: string;
  /** Display name of the farmer */
  assignedFarmerName?: string;
}

interface AddTaskDialogProps {
  open: boolean;
  onClose: () => void;
  /**
   * Called once per cluster selected (or once with no cluster if "All Clusters").
   * If 2 clusters are selected, this is called twice with separate tasks.
   */
  onAddTask: (task: Omit<Task, 'id' | 'farmId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  /**
   * Called after all tasks have been successfully created.
   * Receives the total number of tasks created so the parent can show a toast.
   */
  onTasksCreated?: (tasksCreated: number) => void;
  initialDate?: Date;
  clusters?: Cluster[];
}

export function AddTaskDialog({
  open,
  onClose,
  onAddTask,
  onTasksCreated,
  initialDate,
  clusters = [],
}: AddTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<TaskType>("inspection");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState<Date>(initialDate || new Date());
  const [dueTime, setDueTime] = useState("09:00");
  // Multi-select: array of cluster IDs. Empty array = "All Clusters"
  const [selectedClusterIds, setSelectedClusterIds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleCluster = useCallback((clusterId: string) => {
    setSelectedClusterIds((prev) =>
      prev.includes(clusterId)
        ? prev.filter((id) => id !== clusterId)
        : [...prev, clusterId]
    );
  }, []);

  const clearClusters = useCallback(() => setSelectedClusterIds([]), []);

  /** Clusters that will receive the task */
  const targetClusters = clusters.filter((c) => selectedClusterIds.includes(c.id));

  /** Unique farmer UIDs that will be auto-assigned */
  const autoAssignedFarmers = Array.from(
    new Set(
      targetClusters
        .filter((c) => c.assignedFarmerId)
        .map((c) => c.assignedFarmerId as string)
    )
  );

  const taskCount = selectedClusterIds.length === 0 ? 1 : selectedClusterIds.length;

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setIsSubmitting(true);

    const [hours, minutes] = dueTime.split(":").map(Number);
    const fullDueDate = new Date(dueDate);
    fullDueDate.setHours(hours, minutes, 0, 0);

    try {
      if (selectedClusterIds.length === 0) {
        // Farm-wide task — no cluster
        await onAddTask({
          title: title.trim(),
          description: description.trim(),
          type,
          priority,
          status: "pending",
          dueDate: fullDueDate,
          clusterId: undefined,
          clusterName: undefined,
          assignedTo: undefined,
          notes: notes.trim() || undefined,
          isAIGenerated: false,
        });
      } else {
        // Create one task per selected cluster (in parallel)
        await Promise.all(
          targetClusters.map((cluster) =>
            onAddTask({
              title: title.trim(),
              description: description.trim(),
              type,
              priority,
              status: "pending",
              dueDate: fullDueDate,
              clusterId: cluster.id,
              clusterName: cluster.name,
              // Auto-assign the cluster's farmer if present
              assignedTo: cluster.assignedFarmerId,
              notes: notes.trim() || undefined,
              isAIGenerated: false,
            })
          )
        );
      }

      // Reset form
      const created = selectedClusterIds.length === 0 ? 1 : selectedClusterIds.length;
      setTitle("");
      setDescription("");
      setType("inspection");
      setPriority("medium");
      setDueDate(initialDate || new Date());
      setDueTime("09:00");
      setSelectedClusterIds([]);
      setNotes("");
      onTasksCreated?.(created);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Task
          </DialogTitle>
          <DialogDescription>
            Create a new task for your farm schedule
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Enter task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Type & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Task Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as TaskType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TASK_TYPE_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <span className={config.color}>{config.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TASK_PRIORITY_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <span className={config.color}>{config.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dueDate, "MMM d, yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={(date) => date && setDueDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
              />
            </div>
          </div>

          {/* ── Cluster Assignment ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" />
                Assigned Clusters
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[220px] text-xs">
                      Select multiple clusters to create a separate task per cluster.
                      The cluster's assigned farmer will be auto-assigned to each task.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              {selectedClusterIds.length > 0 && (
                <button
                  onClick={clearClusters}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <X className="h-3 w-3" />
                  Clear
                </button>
              )}
            </div>

            {clusters.length === 0 ? (
              <p className="text-xs text-muted-foreground italic px-1">
                No clusters configured for this farm.
              </p>
            ) : (
              <div className="border rounded-lg divide-y">
                {/* "All Clusters" option */}
                <label
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors",
                    "hover:bg-accent/40",
                    selectedClusterIds.length === 0 && "bg-primary/5"
                  )}
                >
                  <Checkbox
                    checked={selectedClusterIds.length === 0}
                    onCheckedChange={clearClusters}
                  />
                  <span className="text-sm font-medium">All Clusters (farm-wide)</span>
                </label>

                <Separator />

                {clusters.map((cluster) => (
                  <label
                    key={cluster.id}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors",
                      "hover:bg-accent/40",
                      selectedClusterIds.includes(cluster.id) && "bg-primary/5"
                    )}
                  >
                    <Checkbox
                      checked={selectedClusterIds.includes(cluster.id)}
                      onCheckedChange={() => toggleCluster(cluster.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{cluster.name}</p>
                      {cluster.assignedFarmerName && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Users className="h-3 w-3" />
                          {cluster.assignedFarmerName}
                        </p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}

            {/* Preview of what will be created */}
            {selectedClusterIds.length > 1 && (
              <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 px-3 py-2.5 text-xs space-y-1">
                <p className="font-medium text-primary flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5" />
                  {taskCount} tasks will be created
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {targetClusters.map((c) => (
                    <Badge key={c.id} variant="secondary" className="text-xs">
                      {c.name}
                      {c.assignedFarmerName && (
                        <span className="ml-1 opacity-60">→ {c.assignedFarmerName}</span>
                      )}
                    </Badge>
                  ))}
                </div>
                {autoAssignedFarmers.length > 0 && (
                  <p className="text-muted-foreground mt-1">
                    Farmers auto-assigned based on cluster ownership.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add task description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || isSubmitting}>
            {isSubmitting
              ? "Creating..."
              : taskCount > 1
              ? `Create ${taskCount} Tasks`
              : "Create Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
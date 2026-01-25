import { format } from "date-fns";
import { X, CheckCircle2, Trash2, Calendar, Clock, MapPin, Sparkles, User, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import type { Task } from "@/types/task.types";
import { TASK_TYPE_CONFIG, TASK_PRIORITY_CONFIG } from "@/types/task.types";
import { Droplets, Leaf, Scissors, Search, Bug, Apple, ClipboardList } from "lucide-react";

interface TaskDetailsSheetProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onToggleStatus: (task: Task) => void;
  onDelete: (task: Task) => void;
  onEdit?: (task: Task) => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Droplets,
  Leaf,
  Scissors,
  Search,
  Bug,
  Apple,
  ClipboardList,
};

export function TaskDetailsSheet({ task, open, onClose, onToggleStatus, onDelete, onEdit }: TaskDetailsSheetProps) {
  if (!task) return null;

  const config = TASK_TYPE_CONFIG[task.type];
  const priorityConfig = TASK_PRIORITY_CONFIG[task.priority];
  const isCompleted = task.status === 'done';
  const Icon = iconMap[config.icon] || ClipboardList;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className={cn("p-3 rounded-xl", config.bgColor)}>
              <Icon className={cn("h-6 w-6", config.color)} />
            </div>
            <div className="flex-1">
              <SheetTitle className={cn(isCompleted && "line-through text-muted-foreground")}>
                {task.title}
              </SheetTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={cn("text-xs", config.color)}>
                  {config.label}
                </Badge>
                <Badge variant="outline" className={cn("text-xs", priorityConfig.color)}>
                  {priorityConfig.label} Priority
                </Badge>
              </div>
            </div>
          </div>
        </SheetHeader>

        <Separator />

        <div className="py-6 space-y-6">
          {/* Status */}
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg",
              isCompleted ? "bg-secondary/10 text-secondary" : "bg-amber-100 text-amber-700"
            )}>
              {isCompleted ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
              <span className="font-medium text-sm">
                {isCompleted ? 'Completed' : 'Pending'}
              </span>
            </div>
            {task.isAIGenerated && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
                <span className="font-medium text-sm">AI Generated</span>
              </div>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Description</h4>
              <p className="text-sm">{task.description}</p>
            </div>
          )}

          {/* Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Due Date
              </p>
              <p className="font-medium">
                {format(new Date(task.dueDate), "MMMM d, yyyy")}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Time
              </p>
              <p className="font-medium">
                {format(new Date(task.dueDate), "h:mm a")}
              </p>
            </div>
            {task.clusterName && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  Location
                </p>
                <p className="font-medium">{task.clusterName}</p>
              </div>
            )}
            {task.assignedTo && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  Assigned To
                </p>
                <p className="font-medium">{task.assignedTo}</p>
              </div>
            )}
          </div>

          {/* Notes */}
          {task.notes && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Notes</h4>
              <div className="p-3 rounded-lg bg-muted text-sm">
                {task.notes}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
            <p>Created: {format(new Date(task.createdAt), "MMM d, yyyy 'at' h:mm a")}</p>
            <p>Updated: {format(new Date(task.updatedAt), "MMM d, yyyy 'at' h:mm a")}</p>
            {task.completedAt && (
              <p>Completed: {format(new Date(task.completedAt), "MMM d, yyyy 'at' h:mm a")}</p>
            )}
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="pt-4 flex gap-3">
          <Button
            variant={isCompleted ? "outline" : "default"}
            className="flex-1"
            onClick={() => {
              onToggleStatus(task);
              onClose();
            }}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {isCompleted ? 'Mark Pending' : 'Mark Complete'}
          </Button>
          {onEdit && (
            <Button variant="outline" size="icon" onClick={() => onEdit(task)}>
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="destructive"
            size="icon"
            onClick={() => {
              onDelete(task);
              onClose();
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

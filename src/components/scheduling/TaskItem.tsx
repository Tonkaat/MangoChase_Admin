import { CheckCircle2, Circle, Clock, MapPin, Sparkles, MoreVertical, Trash2, Eye, Edit2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Task } from "@/types/task.types";
import { TASK_TYPE_CONFIG, TASK_PRIORITY_CONFIG } from "@/types/task.types";
import { Droplets, Leaf, Scissors, Search, Bug, Apple, ClipboardList } from "lucide-react";

interface TaskItemProps {
  task: Task;
  onToggleStatus: (task: Task) => void;
  onView: (task: Task) => void;
  onEdit?: (task: Task) => void;
  onDelete: (task: Task) => void;
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

export function TaskItem({ task, onToggleStatus, onView, onEdit, onDelete }: TaskItemProps) {
  const config = TASK_TYPE_CONFIG[task.type];
  const priorityConfig = TASK_PRIORITY_CONFIG[task.priority];
  const isCompleted = task.status === 'done';
  const Icon = iconMap[config.icon] || ClipboardList;

  return (
    <div
      className={cn(
        "group bg-card rounded-xl border p-4 shadow-sm transition-all hover:shadow-md",
        isCompleted && "opacity-70"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={() => onToggleStatus(task)}
          className={cn(
            "mt-0.5 flex-shrink-0 transition-colors",
            isCompleted ? "text-secondary" : "text-muted-foreground hover:text-secondary"
          )}
        >
          {isCompleted ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <Circle className="h-5 w-5" />
          )}
        </button>

        {/* Task Icon */}
        <div className={cn("p-2 rounded-lg flex-shrink-0", config.bgColor)}>
          <Icon className={cn("h-4 w-4", config.color)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className={cn(
                "font-medium truncate",
                isCompleted && "line-through text-muted-foreground"
              )}>
                {task.title}
              </h4>
              {task.description && (
                <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                  {task.description}
                </p>
              )}
            </div>

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(task)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(task)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Task
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(task)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant="outline" className={cn("text-xs", config.color)}>
              {config.label}
            </Badge>
            
            {task.priority !== 'medium' && (
              <Badge variant="outline" className={cn("text-xs", priorityConfig.color)}>
                {priorityConfig.label}
              </Badge>
            )}

            {task.clusterName && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {task.clusterName}
              </span>
            )}

            {task.isAIGenerated && (
              <span className="flex items-center gap-1 text-xs text-primary">
                <Sparkles className="h-3 w-3" />
                AI Generated
              </span>
            )}

            <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
              <Clock className="h-3 w-3" />
              {format(new Date(task.dueDate), "h:mm a")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

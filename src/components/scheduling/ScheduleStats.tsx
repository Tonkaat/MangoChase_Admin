import { CheckCircle2, Clock, AlertTriangle, CalendarDays, ListTodo, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task, TaskStats } from "@/types/task.types";
import { isSameDay, isAfter, startOfDay, endOfWeek, startOfWeek } from "date-fns";

interface ScheduleStatsProps {
  tasks: Task[];
  selectedDate: Date;
}

export function ScheduleStats({ tasks, selectedDate }: ScheduleStatsProps) {
  const today = startOfDay(new Date());
  const weekStart = startOfWeek(today);
  const weekEnd = endOfWeek(today);

  const stats: TaskStats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'done').length,
    overdue: tasks.filter(t => {
      const dueDate = startOfDay(new Date(t.dueDate));
      return t.status !== 'done' && isAfter(today, dueDate);
    }).length,
    todaysTasks: tasks.filter(t => isSameDay(new Date(t.dueDate), today)).length,
    weeklyTasks: tasks.filter(t => {
      const dueDate = new Date(t.dueDate);
      return dueDate >= weekStart && dueDate <= weekEnd;
    }).length,
  };

  const tasksForSelectedDate = tasks.filter(t => isSameDay(new Date(t.dueDate), selectedDate));
  const completedToday = tasksForSelectedDate.filter(t => t.status === 'done').length;
  const pendingToday = tasksForSelectedDate.filter(t => t.status !== 'done').length;

  const statCards = [
    {
      label: "Today's Tasks",
      value: stats.todaysTasks,
      icon: CalendarDays,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Pending",
      value: stats.pending,
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      label: "Completed",
      value: stats.completed,
      icon: CheckCircle2,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      label: "Overdue",
      value: stats.overdue,
      icon: AlertTriangle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-card rounded-xl border p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", stat.bgColor)}>
                <stat.icon className={cn("h-4 w-4", stat.color)} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Date Summary */}
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <ListTodo className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">
                {isSameDay(selectedDate, today) ? "Today" : selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </p>
              <p className="text-sm text-muted-foreground">
                {tasksForSelectedDate.length} {tasksForSelectedDate.length === 1 ? 'task' : 'tasks'} scheduled
              </p>
            </div>
          </div>
          {tasksForSelectedDate.length > 0 && (
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-secondary" />
                <span>{completedToday} done</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span>{pendingToday} pending</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Weekly Progress */}
        <div className="mt-4 pt-3 border-t">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              Weekly Progress
            </p>
            <span className="text-sm font-medium">
              {stats.completed} / {stats.weeklyTasks} tasks
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-secondary to-primary rounded-full transition-all duration-500"
              style={{ width: stats.weeklyTasks > 0 ? `${(stats.completed / stats.weeklyTasks) * 100}%` : '0%' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

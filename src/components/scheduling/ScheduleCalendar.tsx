import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Task } from "@/types/task.types";

interface ScheduleCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  tasks: Task[];
}

export function ScheduleCalendar({ selectedDate, onDateSelect, tasks }: ScheduleCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(selectedDate));

  const getTasksForDate = (date: Date): Task[] => {
    return tasks.filter(task => isSameDay(new Date(task.dueDate), date));
  };

  const getTaskIndicators = (date: Date) => {
    const dayTasks = getTasksForDate(date);
    const pending = dayTasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;
    const completed = dayTasks.filter(t => t.status === 'done').length;
    return { pending, completed, total: dayTasks.length };
  };

  const renderHeader = () => (
    <div className="flex items-center justify-between mb-4 px-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        className="h-8 w-8"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <h2 className="font-semibold text-lg">
        {format(currentMonth, "MMMM yyyy")}
      </h2>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        className="h-8 w-8"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );

  const renderDays = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return (
      <div className="grid grid-cols-7 mb-2">
        {days.map(day => (
          <div
            key={day}
            className="text-center text-xs font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const { pending, completed, total } = getTaskIndicators(day);
        const isSelected = isSameDay(day, selectedDate);
        const isToday = isSameDay(day, new Date());
        const isCurrentMonth = isSameMonth(day, monthStart);

        days.push(
          <button
            key={day.toString()}
            onClick={() => onDateSelect(cloneDay)}
            className={cn(
              "relative h-12 w-full flex flex-col items-center justify-start pt-1 rounded-lg transition-all",
              "hover:bg-accent/50",
              !isCurrentMonth && "opacity-40",
              isSelected && "bg-primary text-primary-foreground hover:bg-primary/90",
              isToday && !isSelected && "ring-2 ring-primary/50"
            )}
          >
            <span className={cn(
              "text-sm font-medium",
              isSelected && "text-primary-foreground"
            )}>
              {format(day, "d")}
            </span>
            {total > 0 && (
              <div className="flex gap-0.5 mt-0.5">
                {pending > 0 && (
                  <span className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    isSelected ? "bg-primary-foreground/70" : "bg-amber-500"
                  )} />
                )}
                {completed > 0 && (
                  <span className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    isSelected ? "bg-primary-foreground" : "bg-secondary"
                  )} />
                )}
              </div>
            )}
          </button>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7 gap-1">
          {days}
        </div>
      );
      days = [];
    }
    return <div className="space-y-1">{rows}</div>;
  };

  return (
    <div className="bg-card rounded-xl border p-4 shadow-sm">
      {renderHeader()}
      {renderDays()}
      {renderCells()}
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          <span>Pending</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-secondary" />
          <span>Completed</span>
        </div>
      </div>
    </div>
  );
}

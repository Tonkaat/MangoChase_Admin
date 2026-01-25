import { CalendarDays, Sparkles, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyScheduleProps {
  selectedDate: Date;
  onAddTask: () => void;
  onGenerateAI: () => void;
  canGenerateAI: boolean;
}

export function EmptySchedule({ selectedDate, onAddTask, onGenerateAI, canGenerateAI }: EmptyScheduleProps) {
  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const dateLabel = isToday 
    ? "today" 
    : selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div className="bg-card rounded-xl border p-8 shadow-sm text-center">
      <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <CalendarDays className="h-8 w-8 text-muted-foreground" />
      </div>
      
      <h3 className="font-semibold text-lg mb-2">No tasks for {dateLabel}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
        Your schedule is clear! Add a task manually or let AI generate an optimized schedule for you.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button variant="outline" onClick={onAddTask}>
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
        {canGenerateAI && (
          <Button onClick={onGenerateAI} className="bg-primary hover:bg-primary/90">
            <Sparkles className="h-4 w-4 mr-2" />
            AI Generate
          </Button>
        )}
      </div>
    </div>
  );
}

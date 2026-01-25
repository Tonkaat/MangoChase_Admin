import { Sparkles, Calendar, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface AIScheduleBannerProps {
  canGenerate: boolean;
  nextAvailableDate: Date | null;
  isGenerating: boolean;
  onGenerate: () => void;
  lastGeneratedDate?: Date | null;
  tasksGenerated?: number;
}

export function AIScheduleBanner({
  canGenerate,
  nextAvailableDate,
  isGenerating,
  onGenerate,
  lastGeneratedDate,
  tasksGenerated,
}: AIScheduleBannerProps) {
  if (canGenerate) {
    return (
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 rounded-xl border border-primary/20 p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/20">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold flex items-center gap-2">
              AI Schedule Ready
              <CheckCircle2 className="h-4 w-4 text-secondary" />
            </h3>
            <p className="text-sm text-muted-foreground">
              Generate an optimized 7-day task schedule based on weather, farm health, and seasonal needs.
            </p>
          </div>
          <Button
            onClick={onGenerate}
            disabled={isGenerating}
            className="bg-primary hover:bg-primary/90"
          >
            {isGenerating ? (
              <>
                <div className="h-4 w-4 mr-2 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Schedule
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Cooldown active
  const daysRemaining = nextAvailableDate
    ? Math.ceil((nextAvailableDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 7;

  const cooldownProgress = ((7 - daysRemaining) / 7) * 100;

  return (
    <div className="bg-card rounded-xl border p-4 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-muted">
          <Clock className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold flex items-center gap-2">
            AI Schedule Cooldown
            <span className="text-xs font-normal text-muted-foreground">
              ({daysRemaining} days remaining)
            </span>
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            You can generate a new schedule on{" "}
            <span className="font-medium text-foreground">
              {nextAvailableDate ? format(nextAvailableDate, "MMMM d, yyyy") : "soon"}
            </span>
          </p>

          {/* Progress Bar */}
          <div className="mt-3">
            <Progress value={cooldownProgress} className="h-2" />
          </div>

          {/* Last Generation Info */}
          {lastGeneratedDate && (
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Last generated {formatDistanceToNow(lastGeneratedDate)} ago
              </div>
              {tasksGenerated && (
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {tasksGenerated} tasks created
                </div>
              )}
            </div>
          )}
        </div>
        <Button variant="outline" disabled className="opacity-60">
          <Sparkles className="h-4 w-4 mr-2" />
          Generate
        </Button>
      </div>
    </div>
  );
}

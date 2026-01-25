import { useState } from "react";
import { Sparkles, Cloud, HeartPulse, Calendar, Leaf, Check, Loader2 } from "lucide-react";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

interface AIGenerateDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isGenerating: boolean;
  generationProgress?: number;
  generationStatus?: string;
}

export function AIGenerateDialog({
  open,
  onClose,
  onConfirm,
  isGenerating,
  generationProgress = 0,
  generationStatus = "Initializing...",
}: AIGenerateDialogProps) {
  const features = [
    { icon: Cloud, label: "Weather forecast analysis", description: "Optimizes tasks based on upcoming weather" },
    { icon: HeartPulse, label: "Farm health data", description: "Considers tree health and disease detection" },
    { icon: Leaf, label: "Seasonal requirements", description: "Includes growth stage specific tasks" },
    { icon: Calendar, label: "7-day schedule", description: "Creates a complete weekly plan" },
  ];

  const nextGenerationDate = addDays(new Date(), 7);

  if (isGenerating) {
    return (
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md [&>button]:hidden">
          <div className="py-8 text-center">
            <div className="relative mx-auto w-20 h-20 mb-6">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
              <div className="relative flex items-center justify-center w-full h-full rounded-full bg-primary/10">
                <Sparkles className="h-10 w-10 text-primary animate-pulse" />
              </div>
            </div>
            
            <h3 className="text-xl font-semibold mb-2">AI is Working</h3>
            <p className="text-muted-foreground mb-6">{generationStatus}</p>
            
            <div className="space-y-2 max-w-xs mx-auto">
              <Progress value={generationProgress} className="h-2" />
              <p className="text-sm text-muted-foreground">{generationProgress}% complete</p>
            </div>

            <div className="mt-6 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
              Please don't close this dialog...
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Generate AI Schedule
          </DialogTitle>
          <DialogDescription>
            Create an optimized task schedule for the next 7 days based on your farm data.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Features */}
          <div className="space-y-3">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
              >
                <div className="p-2 rounded-lg bg-secondary/10">
                  <feature.icon className="h-4 w-4 text-secondary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{feature.label}</p>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
                <Check className="h-4 w-4 text-secondary ml-auto mt-1" />
              </div>
            ))}
          </div>

          {/* Cooldown Notice */}
          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm text-amber-800 dark:text-amber-200">
                  7-Day Cooldown
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  After generating, you can create a new schedule on{" "}
                  <span className="font-semibold">{format(nextGenerationDate, "MMMM d, yyyy")}</span>.
                  This ensures you complete current tasks first.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onConfirm} className="bg-primary hover:bg-primary/90">
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Success Dialog Component
interface AISuccessDialogProps {
  open: boolean;
  onClose: () => void;
  tasksCreated: number;
  nextAvailableDate: Date;
}

export function AISuccessDialog({ open, onClose, tasksCreated, nextAvailableDate }: AISuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <div className="py-6 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mb-4">
            <Check className="h-8 w-8 text-secondary" />
          </div>
          
          <h3 className="text-xl font-semibold mb-2">Schedule Generated!</h3>
          <p className="text-muted-foreground">
            Created {tasksCreated} optimized tasks for the next 7 days
          </p>

          <div className="mt-6 p-4 rounded-lg bg-primary/10">
            <Calendar className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Next generation available on</p>
            <p className="font-semibold text-primary">
              {format(nextAvailableDate, "MMMM d, yyyy")}
            </p>
          </div>
        </div>

        <DialogFooter className="sm:justify-center">
          <Button onClick={onClose} className="bg-primary hover:bg-primary/90 min-w-[120px]">
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

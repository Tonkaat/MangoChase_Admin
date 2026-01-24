import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Loader2, TreeDeciduous, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TreeCreationProgressProps {
  isOpen: boolean;
  totalTrees: number;
  createdTrees: number;
  currentVariety?: string;
  isComplete: boolean;
}

export function TreeCreationProgress({
  isOpen,
  totalTrees,
  createdTrees,
  currentVariety,
  isComplete,
}: TreeCreationProgressProps) {
  const progress = totalTrees > 0 ? (createdTrees / totalTrees) * 100 : 0;

  return (
    <Dialog open={isOpen}>
      <DialogContent 
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isComplete ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-secondary" />
                Setup Complete!
              </>
            ) : (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                Creating Your Farm
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isComplete 
              ? "Your farm is ready. Redirecting to dashboard..."
              : "Please wait while we set up your trees..."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress visualization */}
          <div className="flex justify-center">
            <div className={cn(
              "relative w-32 h-32 rounded-full flex items-center justify-center",
              "bg-gradient-to-br from-primary/10 to-secondary/10"
            )}>
              <div className={cn(
                "absolute inset-2 rounded-full border-4 border-primary/20",
                "flex items-center justify-center"
              )}>
                <TreeDeciduous 
                  className={cn(
                    "w-12 h-12 transition-colors",
                    isComplete ? "text-secondary" : "text-primary animate-pulse"
                  )} 
                />
              </div>
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="58"
                  fill="none"
                  strokeWidth="8"
                  stroke="currentColor"
                  className="text-muted"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="58"
                  fill="none"
                  strokeWidth="8"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeDasharray={`${progress * 3.64} 364`}
                  className={cn(
                    "transition-all duration-300",
                    isComplete ? "text-secondary" : "text-primary"
                  )}
                />
              </svg>
            </div>
          </div>

          {/* Progress stats */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-bold">
                {createdTrees.toLocaleString()} / {totalTrees.toLocaleString()}
              </span>
            </div>
            <Progress 
              value={progress} 
              className={cn(
                "h-3",
                isComplete && "[&>div]:bg-secondary"
              )}
            />
            {currentVariety && !isComplete && (
              <p className="text-center text-sm text-muted-foreground">
                Creating <span className="font-medium">{currentVariety}</span> trees...
              </p>
            )}
          </div>

          {/* Info text */}
          <div className="text-center text-xs text-muted-foreground space-y-1">
            <p>Each tree gets a unique ID and QR code for tracking</p>
            {!isComplete && <p>This may take a moment for larger farms</p>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

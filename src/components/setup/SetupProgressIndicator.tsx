import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SetupProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
}

const defaultLabels = [
  "Farm Info",
  "Details",
  "Varieties",
  "Age Groups",
  "Review",
];

export function SetupProgressIndicator({
  currentStep,
  totalSteps,
  stepLabels = defaultLabels,
}: SetupProgressIndicatorProps) {
  return (
    <div className="w-full px-4 py-6">
      <div className="flex items-center justify-between relative">
        {/* Progress line background */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-border mx-8" />
        
        {/* Active progress line */}
        <div 
          className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-primary to-secondary mx-8 transition-all duration-500"
          style={{ 
            width: `calc(${(currentStep / (totalSteps - 1)) * 100}% - 4rem)`,
          }}
        />
        
        {/* Step indicators */}
        {Array.from({ length: totalSteps }).map((_, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          
          return (
            <div 
              key={index} 
              className="flex flex-col items-center z-10"
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300",
                  isCompleted && "bg-secondary text-secondary-foreground shadow-md",
                  isCurrent && "bg-primary text-primary-foreground shadow-lg ring-4 ring-primary/20 scale-110",
                  !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  index + 1
                )}
              </div>
              <span 
                className={cn(
                  "mt-2 text-xs font-medium transition-colors hidden sm:block",
                  isCurrent ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {stepLabels[index]}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Mobile step label */}
      <div className="sm:hidden text-center mt-4">
        <span className="text-sm font-medium text-foreground">
          Step {currentStep + 1}: {stepLabels[currentStep]}
        </span>
      </div>
    </div>
  );
}

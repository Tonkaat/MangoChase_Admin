import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2, Sparkles, SkipForward } from "lucide-react";

interface SetupBottomNavigationProps {
  currentStep: number;
  totalSteps: number;
  isLoading: boolean;
  canProceed: boolean;
  showSkip?: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onSkip?: () => void;
}

export function SetupBottomNavigation({
  currentStep,
  totalSteps,
  isLoading,
  canProceed,
  showSkip = false,
  onNext,
  onPrevious,
  onSkip,
}: SetupBottomNavigationProps) {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div className="border-t border-border bg-card/80 backdrop-blur-sm px-6 py-4">
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
        {/* Previous button */}
        <Button
          variant="ghost"
          onClick={onPrevious}
          disabled={isFirstStep || isLoading}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </Button>

        {/* Step indicator (mobile) */}
        <div className="text-sm text-muted-foreground">
          {currentStep + 1} / {totalSteps}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {showSkip && onSkip && (
            <Button
              variant="outline"
              onClick={onSkip}
              disabled={isLoading}
              className="gap-2"
            >
              <SkipForward className="w-4 h-4" />
              <span className="hidden sm:inline">Skip</span>
            </Button>
          )}
          
          <Button
            variant={isLastStep ? "hero" : "mango"}
            onClick={onNext}
            disabled={!canProceed || isLoading}
            className="gap-2 min-w-[100px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Processing...</span>
              </>
            ) : isLastStep ? (
              <>
                <Sparkles className="w-4 h-4" />
                Complete Setup
              </>
            ) : (
              <>
                <span className="hidden sm:inline">Continue</span>
                <span className="sm:hidden">Next</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

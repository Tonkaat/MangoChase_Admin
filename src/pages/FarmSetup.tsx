import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { BrandLogo } from "@/components/common/BrandLogo";
import { SetupProgressIndicator } from "@/components/setup/SetupProgressIndicator";
import { SetupBottomNavigation } from "@/components/setup/SetupBottomNavigation";
import { TreeCreationProgress } from "@/components/setup/TreeCreationProgress";
import { FarmInfoStep } from "@/components/setup/steps/FarmInfoStep";
import { FarmDetailsStep } from "@/components/setup/steps/FarmDetailsStep";
import { VarietyConfigStep } from "@/components/setup/steps/VarietyConfigStep";
import { AgeConfigStep } from "@/components/setup/steps/AgeConfigStep";
import { ReviewStep } from "@/components/setup/steps/ReviewStep";
import { 
  FarmSetupData, 
  VarietyConfig, 
  AgeGroupConfig,
  generateUniqueId,
  getGrowthStageForAge,
  DEFAULT_MANGO_VARIETIES,
} from "@/types/farm.types";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const TOTAL_STEPS = 5;

const initialData: FarmSetupData = {
  farmName: "",
  farmLocation: "",
  cropType: "mango",
  farmSize: 0,
  numberOfTrees: 0,
  farmingType: "personal",
  varieties: [],
  ageGroups: [],
};

export default function FarmSetup() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [data, setData] = useState<FarmSetupData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Tree creation progress
  const [showProgress, setShowProgress] = useState(false);
  const [createdTrees, setCreatedTrees] = useState(0);
  const [currentVariety, setCurrentVariety] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  // Update handlers
  const updateField = useCallback(<K extends keyof FarmSetupData>(
    field: K, 
    value: FarmSetupData[K]
  ) => {
    setData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: "" }));
  }, []);

  // Validation
  const validateStep = useCallback((step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 0: // Farm Info
        if (!data.farmName.trim() || data.farmName.length < 3) {
          newErrors.farmName = "Farm name must be at least 3 characters";
        }
        if (!data.farmLocation.trim() || data.farmLocation.length < 3) {
          newErrors.farmLocation = "Location must be at least 3 characters";
        }
        break;

      case 1: // Farm Details
        if (!data.farmSize || data.farmSize <= 0) {
          newErrors.farmSize = "Please enter a valid farm size";
        }
        if (!data.numberOfTrees || data.numberOfTrees <= 0) {
          newErrors.numberOfTrees = "Please enter a valid number of trees";
        }
        if (data.numberOfTrees > 100000) {
          newErrors.numberOfTrees = "Maximum 100,000 trees allowed";
        }
        break;

      case 2: // Variety Config
        if (data.varieties.length > 0) {
          const allocated = data.varieties.reduce((sum, v) => sum + v.quantity, 0);
          if (allocated !== data.numberOfTrees) {
            toast.error(`Please allocate all ${data.numberOfTrees} trees`);
            return false;
          }
        }
        break;

      case 3: // Age Config
        if (data.ageGroups.length > 0) {
          const allocated = data.ageGroups.reduce((sum, g) => sum + g.quantity, 0);
          if (allocated !== data.numberOfTrees) {
            toast.error(`Please allocate all ${data.numberOfTrees} trees`);
            return false;
          }
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [data]);

  const canProceed = useCallback((): boolean => {
    switch (currentStep) {
      case 0:
        return data.farmName.length >= 3 && data.farmLocation.length >= 3;
      case 1:
        return data.farmSize > 0 && data.numberOfTrees > 0 && data.numberOfTrees <= 100000;
      case 2:
        if (data.varieties.length === 0) return true; // Skip allowed
        const varietyTotal = data.varieties.reduce((sum, v) => sum + v.quantity, 0);
        return varietyTotal === data.numberOfTrees;
      case 3:
        if (data.ageGroups.length === 0) return true; // Skip allowed
        const ageTotal = data.ageGroups.reduce((sum, g) => sum + g.quantity, 0);
        return ageTotal === data.numberOfTrees;
      case 4:
        return true;
      default:
        return false;
    }
  }, [currentStep, data]);

  // Navigation
  const handleNext = useCallback(async () => {
    if (!validateStep(currentStep)) return;

    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(prev => prev + 1);
      toast.success(`Step ${currentStep + 1} completed`);
    } else {
      await completeSetup();
    }
  }, [currentStep, validateStep]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    // Only for variety and age steps
    if (currentStep === 2 || currentStep === 3) {
      setCurrentStep(prev => prev + 1);
      toast.info("Using default configuration");
    }
  }, [currentStep]);

  // Setup completion
  const completeSetup = async () => {
    setIsLoading(true);
    setShowProgress(true);
    setCreatedTrees(0);
    setIsComplete(false);

    try {
      // Simulate farm creation
      await new Promise(resolve => setTimeout(resolve, 500));

      // Generate default varieties if not configured
      let varietiesToUse = data.varieties;
      if (varietiesToUse.length === 0) {
        const defaultVarieties = data.cropType === 'mango' 
          ? ['Carabao', 'Pico', 'Apple Mango'] 
          : ['Standard'];
        const perVariety = Math.floor(data.numberOfTrees / defaultVarieties.length);
        const remainder = data.numberOfTrees % defaultVarieties.length;
        
        varietiesToUse = defaultVarieties.map((name, i) => ({
          id: crypto.randomUUID(),
          name,
          quantity: perVariety + (i < remainder ? 1 : 0),
        }));
      }

      // Generate default age groups if not configured
      let ageGroupsToUse = data.ageGroups;
      if (ageGroupsToUse.length === 0) {
        const distribution = [
          { age: 1, label: "Seedlings (1 year)", percent: 0.3 },
          { age: 3, label: "Young (3 years)", percent: 0.3 },
          { age: 7, label: "Mature (7 years)", percent: 0.3 },
          { age: 15, label: "Old (15+ years)", percent: 0.1 },
        ];
        let remaining = data.numberOfTrees;
        ageGroupsToUse = distribution.map((d, i) => {
          const quantity = i === distribution.length - 1 
            ? remaining 
            : Math.round(data.numberOfTrees * d.percent);
          remaining -= quantity;
          return {
            id: crypto.randomUUID(),
            age: d.age,
            label: d.label,
            quantity: Math.max(0, quantity),
          };
        });
      }

      // Simulate tree creation with progress
      let totalCreated = 0;
      for (const variety of varietiesToUse) {
        setCurrentVariety(variety.name);
        
        // Simulate batch creation
        const batchSize = Math.min(50, variety.quantity);
        for (let i = 0; i < variety.quantity; i += batchSize) {
          await new Promise(resolve => setTimeout(resolve, 100));
          totalCreated += Math.min(batchSize, variety.quantity - i);
          setCreatedTrees(totalCreated);
        }
      }

      setIsComplete(true);
      toast.success("🎉 Farm setup completed!");

      // Navigate to dashboard after a short delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      navigate("/dashboard", { replace: true });

    } catch (error) {
      console.error("Setup error:", error);
      toast.error("Setup failed. Please try again.");
      setShowProgress(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSetup = () => {
    setShowCancelDialog(true);
  };

  const confirmCancel = () => {
    navigate("/dashboard", { replace: true });
  };

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <FarmInfoStep
            farmName={data.farmName}
            farmLocation={data.farmLocation}
            cropType={data.cropType}
            onFarmNameChange={(v) => updateField("farmName", v)}
            onFarmLocationChange={(v) => updateField("farmLocation", v)}
            onCropTypeChange={(v) => updateField("cropType", v)}
            errors={errors}
          />
        );
      case 1:
        return (
          <FarmDetailsStep
            farmSize={data.farmSize ? String(data.farmSize) : ""}
            numberOfTrees={data.numberOfTrees ? String(data.numberOfTrees) : ""}
            farmingType={data.farmingType}
            onFarmSizeChange={(v) => updateField("farmSize", parseFloat(v) || 0)}
            onNumberOfTreesChange={(v) => updateField("numberOfTrees", parseInt(v) || 0)}
            onFarmingTypeChange={(v) => updateField("farmingType", v)}
            errors={errors}
          />
        );
      case 2:
        return (
          <VarietyConfigStep
            totalTrees={data.numberOfTrees}
            varieties={data.varieties}
            cropType={data.cropType}
            onVarietiesChange={(v) => updateField("varieties", v)}
          />
        );
      case 3:
        return (
          <AgeConfigStep
            totalTrees={data.numberOfTrees}
            ageGroups={data.ageGroups}
            onAgeGroupsChange={(g) => updateField("ageGroups", g)}
          />
        );
      case 4:
        return <ReviewStep data={data} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-mango-field flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b bg-card/80 backdrop-blur-sm">
        <BrandLogo />
        <button
          onClick={handleCancelSetup}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip for now
        </button>
      </header>

      {/* Progress indicator */}
      <SetupProgressIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        {renderStepContent()}
      </main>

      {/* Bottom navigation */}
      <SetupBottomNavigation
        currentStep={currentStep}
        totalSteps={TOTAL_STEPS}
        isLoading={isLoading}
        canProceed={canProceed()}
        showSkip={currentStep === 2 || currentStep === 3}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onSkip={handleSkip}
      />

      {/* Tree creation progress dialog */}
      <TreeCreationProgress
        isOpen={showProgress}
        totalTrees={data.numberOfTrees}
        createdTrees={createdTrees}
        currentVariety={currentVariety}
        isComplete={isComplete}
      />

      {/* Cancel confirmation dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Skip Farm Setup?</AlertDialogTitle>
            <AlertDialogDescription>
              You can complete the setup later from Settings. Some features may be limited until setup is complete.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Setup</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel}>
              Skip for Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

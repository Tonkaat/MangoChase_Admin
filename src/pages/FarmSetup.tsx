// src/pages/FarmSetup.tsx
// FIXED: Preserves admin role during farm setup

import { useState, useCallback, useEffect } from "react";
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
  CROP_TYPES,
  FARMING_TYPES,
  getGrowthStageForAge
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
import { firebaseService } from "@/services/firebase";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { v4 as uuidv4 } from "uuid";
import { FarmCodeDialog } from "@/components/setup/FarmCodeDialog";

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
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [data, setData] = useState<FarmSetupData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Tree creation progress
  const [showProgress, setShowProgress] = useState(false);
  const [createdTrees, setCreatedTrees] = useState(0);
  const [currentVariety, setCurrentVariety] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  
  // Farm code dialog state
  const [showFarmCodeDialog, setShowFarmCodeDialog] = useState(false);
  const [farmCode, setFarmCode] = useState("");

  // Check if user has already completed setup
  useEffect(() => {
    checkExistingSetup();
  }, []);

  const checkExistingSetup = async () => {
    try {
      const user = firebaseService.getCurrentUser();
      if (!user) {
        navigate('/login', { replace: true });
        return;
      }

      // Get user profile to check if already has farm
      const userProfile = await firebaseService.getUserProfile();
      
      if (userProfile?.farmId) {
        const farmProfile = await firebaseService.getFarmProfile(userProfile.farmId);
        
        if (farmProfile?.setupCompleted) {
          // User has already completed setup, redirect to dashboard
          toast.info("Welcome back! Your farm is already set up.");
          navigate('/dashboard', { replace: true });
          return;
        }
      }
      
      setIsCheckingSetup(false);
    } catch (error) {
      console.error("Error checking setup:", error);
      setIsCheckingSetup(false);
    }
  };

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
          newErrors.farmSize = "Please enter a valid farm size (hectares)";
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
            toast.error(`Please allocate all ${data.numberOfTrees} trees across varieties`);
            return false;
          }
        }
        break;

      case 3: // Age Config
        if (data.ageGroups.length > 0) {
          const allocated = data.ageGroups.reduce((sum, g) => sum + g.quantity, 0);
          if (allocated !== data.numberOfTrees) {
            toast.error(`Please allocate all ${data.numberOfTrees} trees across age groups`);
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
        if (data.varieties.length === 0) return true;
        const varietyTotal = data.varieties.reduce((sum, v) => sum + v.quantity, 0);
        return varietyTotal === data.numberOfTrees;
      case 3:
        if (data.ageGroups.length === 0) return true;
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
    if (currentStep === 2 || currentStep === 3) {
      setCurrentStep(prev => prev + 1);
      toast.info("Using default configuration");
      
      // Set defaults when skipping
      if (currentStep === 2 && data.varieties.length === 0) {
        // Add default single variety
        const defaultVariety: VarietyConfig = {
          id: uuidv4(),
          name: data.cropType === "mango" ? "Carabao" : "Default",
          quantity: data.numberOfTrees
        };
        updateField("varieties", [defaultVariety]);
      }
      
      if (currentStep === 3 && data.ageGroups.length === 0) {
        // Add default age groups
        const defaultAgeGroups: AgeGroupConfig[] = [
          { id: uuidv4(), age: 2, quantity: Math.floor(data.numberOfTrees * 0.2), label: "Young" },
          { id: uuidv4(), age: 5, quantity: Math.floor(data.numberOfTrees * 0.5), label: "Mature" },
          { id: uuidv4(), age: 10, quantity: Math.floor(data.numberOfTrees * 0.3), label: "Old" },
        ];
        updateField("ageGroups", defaultAgeGroups);
      }
    }
  }, [currentStep, data, updateField]);

  // Helper function to create trees based on variety and age distribution
  const createTrees = async (farmId: string, varieties: VarietyConfig[], ageGroups: AgeGroupConfig[]) => {
    if (varieties.length === 0 || ageGroups.length === 0) {
      toast.error("Variety or age configuration missing");
      return;
    }

    let currentCount = 0;
    
    // Distribute trees across varieties and ages
    for (const variety of varieties) {
      setCurrentVariety(variety.name);
      
      for (let i = 0; i < variety.quantity; i++) {
        try {
          // Determine tree age based on age group distribution
          let age = 5; // default age
          let ageIndex = 0;
          let accumulated = 0;
          
          for (const ageGroup of ageGroups) {
            accumulated += ageGroup.quantity;
            if (i < accumulated) {
              age = ageGroup.age;
              break;
            }
            ageIndex++;
          }
          
          const growthStage = getGrowthStageForAge(age);
          
          // Generate tree data using the tree naming service
          const treeData = await firebaseService.generateTreeData({
            farmId,
            variety: variety.name,
            additionalData: {
              type: CROP_TYPES.find(c => c.value === data.cropType)?.label || "Mango",
              healthStatus: "Healthy",
              growthStage: growthStage.toLowerCase(),
              cluster: "Default",
              flagged: false,
              plantedDate: new Date(Date.now() - age * 365 * 24 * 60 * 60 * 1000), // Approximate planted date
              notes: `Created during farm setup. Variety: ${variety.name}, Age: ${age} years`,
              lastInspection: new Date(),
            }
          });
          
          await firebaseService.addTree(farmId, treeData);
          currentCount++;
          setCreatedTrees(currentCount);
          
          // Small delay to show progress
          if (currentCount % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 10));
          }
          
        } catch (error) {
          console.error(`Error creating tree ${currentCount + 1}:`, error);
        }
      }
    }
  };

  // Setup completion with database integration
  const completeSetup = async () => {
    setIsLoading(true);
    setShowProgress(true);
    setCreatedTrees(0);
    setIsComplete(false);

    try {
      const user = firebaseService.getCurrentUser();
      if (!user) {
        throw new Error("No authenticated user");
      }

      console.log("🚀 Starting farm setup...");
      console.log("📊 Setup data:", data);

      // ✅ FIXED: Get current user profile to preserve role
      const currentProfile = await firebaseService.getUserProfile();
      const userRole = currentProfile?.role || 'admin'; // Default to admin if not set

      // Create or update farm profile
      const farmId = await firebaseService.createOrUpdateFarmProfile({
        name: data.farmName,
        location: data.farmLocation,
        farmSize: data.farmSize,
        numberOfTrees: data.numberOfTrees,
        cropType: data.cropType,
        farmingType: data.farmingType,
        ownerId: user.uid,
      });

      console.log("✅ Farm created with ID:", farmId);

      // Get the farm code
      const generatedFarmCode = await firebaseService.getFarmCode(farmId);
      if (generatedFarmCode) {
        setFarmCode(generatedFarmCode);
      }

      // ✅ FIXED: Update user profile with farmId BUT PRESERVE ROLE
      await firebaseService.upsertUserProfile({
        name: user.displayName || currentProfile?.name || "Admin",
        email: user.email || "",
        role: userRole, // ✅ Use existing role instead of hardcoding
        farmId: farmId,
        settings: {
          hasCompletedSetup: true,
          notifications: true,
          darkMode: false,
          businessMode: userRole === 'admin', // ✅ Enable business mode for admins
        }
      });

      console.log("✅ User profile updated with role:", userRole);

      // Mark farm setup as complete
      await firebaseService.updateFarmProfile(farmId, {
        setupCompleted: true,
        setupCompletedAt: new Date(),
      });

      console.log("✅ Farm marked as setup complete");

      // Create trees
      console.log("🌳 Creating trees...");
      await createTrees(farmId, data.varieties, data.ageGroups);

      setIsComplete(true);
      setShowProgress(false); // Hide progress dialog
      
      toast.success("🎉 Farm setup completed!");
      
      // Show farm code dialog
      setShowFarmCodeDialog(true);

      console.log("✅ Setup complete");

    } catch (error: any) {
      console.error("❌ Setup error:", error);
      toast.error(error.message || "Setup failed. Please try again.");
      setShowProgress(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for closing farm code dialog
  const handleFarmCodeDialogClose = () => {
    setShowFarmCodeDialog(false);
    navigate("/dashboard", { replace: true });
  };

  const handleCancelSetup = () => {
    setShowCancelDialog(true);
  };

  const confirmCancel = async () => {
    try {
      const user = firebaseService.getCurrentUser();
      if (user) {
        // ✅ FIXED: Get current user profile to preserve role
        const currentProfile = await firebaseService.getUserProfile();
        const userRole = currentProfile?.role || 'admin';

        // Create a minimal farm profile if skipping setup
        const farmId = await firebaseService.createOrUpdateFarmProfile({
          name: "My Farm",
          location: "Unknown",
          farmSize: 1,
          numberOfTrees: 0,
          cropType: "mango",
          farmingType: "personal",
          ownerId: user.uid,
        });

        // ✅ FIXED: Update user profile with minimal setup BUT PRESERVE ROLE
        await firebaseService.upsertUserProfile({
          name: user.displayName || currentProfile?.name || "Admin",
          email: user.email || "",
          role: userRole, // ✅ Use existing role
          farmId: farmId,
          settings: {
            hasCompletedSetup: false, // Mark as not complete
            notifications: true,
            darkMode: false,
            businessMode: userRole === 'admin', // ✅ Enable for admins
          }
        });
      }
      
      toast.info("Setup skipped. You can complete it later in Settings.");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error("Error skipping setup:", error);
      toast.error("Could not skip setup. Please try again.");
    }
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

  // Show loading while checking setup status
  if (isCheckingSetup) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner className="w-12 h-12" />
          <p className="mt-4 text-muted-foreground">Checking your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b bg-card/80 backdrop-blur-sm">
        <BrandLogo />
        {/* <button
          onClick={handleCancelSetup}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          disabled={isLoading}
        >
          Skip for now
        </button> */}
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

      {/* Farm Code Dialog */}
      <FarmCodeDialog
        isOpen={showFarmCodeDialog}
        farmCode={farmCode}
        farmName={data.farmName}
        treesCreated={data.numberOfTrees}
        onClose={handleFarmCodeDialogClose}
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
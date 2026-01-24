import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Ruler, TreeDeciduous, Building2, Home, Users } from "lucide-react";
import { FARMING_TYPES } from "@/types/farm.types";
import { cn } from "@/lib/utils";

interface FarmDetailsStepProps {
  farmSize: string;
  numberOfTrees: string;
  farmingType: string;
  onFarmSizeChange: (value: string) => void;
  onNumberOfTreesChange: (value: string) => void;
  onFarmingTypeChange: (value: string) => void;
  errors?: {
    farmSize?: string;
    numberOfTrees?: string;
  };
}

const farmingTypeIcons: Record<string, React.ReactNode> = {
  personal: <Home className="w-6 h-6" />,
  commercial: <Building2 className="w-6 h-6" />,
  cooperative: <Users className="w-6 h-6" />,
};

export function FarmDetailsStep({
  farmSize,
  numberOfTrees,
  farmingType,
  onFarmSizeChange,
  onNumberOfTreesChange,
  onFarmingTypeChange,
  errors,
}: FarmDetailsStepProps) {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary/10 mb-2">
          <TreeDeciduous className="w-8 h-8 text-secondary" />
        </div>
        <h2 className="font-display text-2xl font-bold">Farm Details</h2>
        <p className="text-muted-foreground">
          Help us understand the scale of your operation
        </p>
      </div>

      {/* Farm Size */}
      <Card className="shadow-soft">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Ruler className="w-5 h-5 text-primary" />
            Farm Size
          </CardTitle>
          <CardDescription>
            Total area of your farm in hectares
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="relative">
              <Input
                id="farmSize"
                type="number"
                min="0.1"
                step="0.1"
                placeholder="e.g., 5.5"
                value={farmSize}
                onChange={(e) => onFarmSizeChange(e.target.value)}
                className={cn(
                  "text-base pr-20",
                  errors?.farmSize && "border-destructive focus-visible:ring-destructive"
                )}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                hectares
              </span>
            </div>
            {errors?.farmSize && (
              <p className="text-sm text-destructive">{errors.farmSize}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Number of Trees */}
      <Card className="shadow-soft">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TreeDeciduous className="w-5 h-5 text-secondary" />
            Number of Trees
          </CardTitle>
          <CardDescription>
            How many trees do you currently have?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="relative">
              <Input
                id="numberOfTrees"
                type="number"
                min="1"
                placeholder="e.g., 500"
                value={numberOfTrees}
                onChange={(e) => onNumberOfTreesChange(e.target.value)}
                className={cn(
                  "text-base pr-14",
                  errors?.numberOfTrees && "border-destructive focus-visible:ring-destructive"
                )}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                trees
              </span>
            </div>
            {errors?.numberOfTrees && (
              <p className="text-sm text-destructive">{errors.numberOfTrees}</p>
            )}
            {numberOfTrees && parseInt(numberOfTrees) > 0 && (
              <p className="text-sm text-muted-foreground">
                We'll create {parseInt(numberOfTrees).toLocaleString()} trees with unique IDs for tracking
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Farming Type */}
      <Card className="shadow-soft">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Farming Type</CardTitle>
          <CardDescription>
            What type of farming operation is this?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={farmingType}
            onValueChange={onFarmingTypeChange}
            className="grid gap-3"
          >
            {FARMING_TYPES.map((type) => (
              <Label
                key={type.value}
                htmlFor={`farming-${type.value}`}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all",
                  "hover:border-primary/50 hover:bg-accent/50",
                  farmingType === type.value 
                    ? "border-primary bg-accent shadow-md" 
                    : "border-border"
                )}
              >
                <RadioGroupItem
                  value={type.value}
                  id={`farming-${type.value}`}
                  className="sr-only"
                />
                <div className={cn(
                  "p-2 rounded-lg",
                  farmingType === type.value ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  {farmingTypeIcons[type.value]}
                </div>
                <div className="flex-1">
                  <span className="font-medium block">{type.label}</span>
                  <span className="text-sm text-muted-foreground">{type.description}</span>
                </div>
              </Label>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  );
}

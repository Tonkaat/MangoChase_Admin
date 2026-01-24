import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MapPin, Warehouse } from "lucide-react";
import { CROP_TYPES } from "@/types/farm.types";
import { cn } from "@/lib/utils";

interface FarmInfoStepProps {
  farmName: string;
  farmLocation: string;
  cropType: string;
  onFarmNameChange: (value: string) => void;
  onFarmLocationChange: (value: string) => void;
  onCropTypeChange: (value: string) => void;
  errors?: {
    farmName?: string;
    farmLocation?: string;
  };
}

export function FarmInfoStep({
  farmName,
  farmLocation,
  cropType,
  onFarmNameChange,
  onFarmLocationChange,
  onCropTypeChange,
  errors,
}: FarmInfoStepProps) {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
          <Warehouse className="w-8 h-8 text-primary" />
        </div>
        <h2 className="font-display text-2xl font-bold">Let's set up your farm</h2>
        <p className="text-muted-foreground">
          Tell us about your farm to get started with Mangochase
        </p>
      </div>

      {/* Farm Name */}
      <Card className="shadow-soft">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Farm Name</CardTitle>
          <CardDescription>
            Give your farm a memorable name
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Input
              id="farmName"
              placeholder="e.g., Green Valley Mango Farm"
              value={farmName}
              onChange={(e) => onFarmNameChange(e.target.value)}
              className={cn(
                "text-base",
                errors?.farmName && "border-destructive focus-visible:ring-destructive"
              )}
            />
            {errors?.farmName && (
              <p className="text-sm text-destructive">{errors.farmName}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Farm Location */}
      <Card className="shadow-soft">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="w-5 h-5 text-secondary" />
            Farm Location
          </CardTitle>
          <CardDescription>
            Where is your farm located?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Input
              id="farmLocation"
              placeholder="e.g., Guimaras, Philippines"
              value={farmLocation}
              onChange={(e) => onFarmLocationChange(e.target.value)}
              className={cn(
                "text-base",
                errors?.farmLocation && "border-destructive focus-visible:ring-destructive"
              )}
            />
            {errors?.farmLocation && (
              <p className="text-sm text-destructive">{errors.farmLocation}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Crop Type Selection */}
      <Card className="shadow-soft">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">What do you grow?</CardTitle>
          <CardDescription>
            Select your primary crop type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={cropType}
            onValueChange={onCropTypeChange}
            className="grid grid-cols-2 sm:grid-cols-3 gap-3"
          >
            {CROP_TYPES.map((type) => (
              <Label
                key={type.value}
                htmlFor={type.value}
                className={cn(
                  "flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all",
                  "hover:border-primary/50 hover:bg-accent/50",
                  cropType === type.value 
                    ? "border-primary bg-accent shadow-md" 
                    : "border-border"
                )}
              >
                <RadioGroupItem
                  value={type.value}
                  id={type.value}
                  className="sr-only"
                />
                <span className="text-3xl mb-2">{type.icon}</span>
                <span className="font-medium text-sm">{type.label}</span>
              </Label>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  );
}

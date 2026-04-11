import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle2, 
  Warehouse, 
  MapPin, 
  Ruler, 
  TreeDeciduous, 
  Leaf, 
  Clock,
  Sparkles
} from "lucide-react";
import { FarmSetupData, CROP_TYPES, FARMING_TYPES, getGrowthStageForAge } from "@/types/farm.types";
import { cn } from "@/lib/utils";

interface ReviewStepProps {
  data: FarmSetupData;
}

export function ReviewStep({ data }: ReviewStepProps) {
  const cropType = CROP_TYPES.find(c => c.value === data.cropType);
  const farmingType = FARMING_TYPES.find(f => f.value === data.farmingType);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary from-primary to-secondary mb-2">
          <Sparkles className="w-8 h-8 text-primary-foreground" />
        </div>
        <h2 className="font-display text-2xl font-bold">Review Your Setup</h2>
        <p className="text-muted-foreground">
          Confirm your farm configuration before we create everything
        </p>
      </div>

      {/* Success Preview */}
      <Card className="shadow-soft border-secondary/50 bg-gradient-to-br from-secondary/5 to-transparent">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <CheckCircle2 className="w-6 h-6 text-secondary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-secondary">Ready to create your farm!</p>
              <p className="text-sm text-muted-foreground mt-1">
                We'll generate {data.numberOfTrees.toLocaleString()} trees with unique QR codes and IDs for smart tracking.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Farm Info Summary */}
      <Card className="shadow-soft">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Warehouse className="w-5 h-5 text-primary" />
            Farm Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Farm Name</p>
              <p className="font-medium">{data.farmName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Crop Type</p>
              <p className="font-medium flex items-center gap-2">
                <span>{cropType?.icon}</span>
                {cropType?.label}
              </p>
            </div>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-medium">{data.farmLocation}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Ruler className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Farm Size</p>
                <p className="font-medium">{data.farmSize} hectares</p>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <TreeDeciduous className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Total Trees</p>
                <p className="font-medium">{data.numberOfTrees.toLocaleString()} trees</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Farming Type</p>
              <Badge variant="secondary">{farmingType?.label}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Variety Configuration Summary */}
      <Card className="shadow-soft">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Leaf className="w-5 h-5 text-secondary" />
            Variety Distribution
          </CardTitle>
          <CardDescription>
            {data.varieties.length > 0 
              ? `${data.varieties.length} varieties configured`
              : 'Using default variety distribution'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.varieties.length > 0 ? (
            <div className="space-y-2">
              {data.varieties.map((variety) => (
                <div
                  key={variety.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                >
                  <span className="font-medium">{variety.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {variety.quantity.toLocaleString()} trees
                    </span>
                    <Badge variant="outline">
                      {Math.round((variety.quantity / data.numberOfTrees) * 100)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Trees will be distributed evenly across default varieties based on crop type.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Age Distribution Summary */}
      <Card className="shadow-soft">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Age Distribution
          </CardTitle>
          <CardDescription>
            {data.ageGroups.length > 0 
              ? `${data.ageGroups.length} age groups configured`
              : 'Using default age distribution'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.ageGroups.length > 0 ? (
            <div className="space-y-2">
              {data.ageGroups.map((group) => {
                const stage = getGrowthStageForAge(group.age);
                return (
                  <div
                    key={group.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="secondary"
                        className={cn(
                          stage === 'Seedling' && "bg-emerald-100 text-emerald-700",
                          stage === 'Young' && "bg-lime-100 text-lime-700",
                          stage === 'Mature' && "bg-green-100 text-green-700",
                          stage === 'Old' && "bg-amber-100 text-amber-700"
                        )}
                      >
                        {stage}
                      </Badge>
                      <span className="font-medium">{group.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {group.quantity.toLocaleString()} trees
                      </span>
                      <Badge variant="outline">
                        {Math.round((group.quantity / data.numberOfTrees) * 100)}%
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Trees will use default age distribution: 30% seedlings, 30% young, 30% mature, 10% old.
            </p>
          )}
        </CardContent>
      </Card>

      {/* What happens next */}
      <Card className="shadow-soft border-primary/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">What happens next?</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
              <span>Your farm profile will be created in the system</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
              <span>{data.numberOfTrees.toLocaleString()} trees with unique IDs and QR codes will be generated</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
              <span>You'll be redirected to the dashboard to start managing your farm</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

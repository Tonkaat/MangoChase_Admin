import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Plus, Trash2, Clock, AlertCircle, Sprout, TreeDeciduous, TreePine } from "lucide-react";
import { AgeGroupConfig, getGrowthStageForAge } from "@/types/farm.types";
import { cn } from "@/lib/utils";

interface AgeConfigStepProps {
  totalTrees: number;
  ageGroups: AgeGroupConfig[];
  onAgeGroupsChange: (ageGroups: AgeGroupConfig[]) => void;
}

const DEFAULT_AGE_GROUPS = [
  { age: 1, label: "Seedlings (1 year)", icon: Sprout },
  { age: 3, label: "Young (3 years)", icon: TreeDeciduous },
  { age: 7, label: "Mature (7 years)", icon: TreeDeciduous },
  { age: 15, label: "Old (15+ years)", icon: TreePine },
];

export function AgeConfigStep({
  totalTrees,
  ageGroups,
  onAgeGroupsChange,
}: AgeConfigStepProps) {
  const allocatedTrees = ageGroups.reduce((sum, g) => sum + g.quantity, 0);
  const remainingTrees = totalTrees - allocatedTrees;
  const allocationPercent = totalTrees > 0 ? (allocatedTrees / totalTrees) * 100 : 0;
  const isFullyAllocated = remainingTrees === 0;
  const isOverAllocated = remainingTrees < 0;

  const addAgeGroup = (age: number, label: string) => {
    if (ageGroups.some(g => g.age === age)) return;
    
    const newGroup: AgeGroupConfig = {
      id: crypto.randomUUID(),
      age,
      label,
      quantity: remainingTrees > 0 ? Math.min(remainingTrees, Math.floor(totalTrees / 4)) : 0,
    };
    
    onAgeGroupsChange([...ageGroups, newGroup].sort((a, b) => a.age - b.age));
  };

  const updateGroupQuantity = (id: string, quantity: number) => {
    onAgeGroupsChange(
      ageGroups.map(g => g.id === id ? { ...g, quantity: Math.max(0, quantity) } : g)
    );
  };

  const updateGroupAge = (id: string, age: number) => {
    onAgeGroupsChange(
      ageGroups.map(g => g.id === id ? { ...g, age, label: `${age} year${age !== 1 ? 's' : ''} old` } : g)
        .sort((a, b) => a.age - b.age)
    );
  };

  const removeAgeGroup = (id: string) => {
    onAgeGroupsChange(ageGroups.filter(g => g.id !== id));
  };

  const distributeEvenly = () => {
    if (ageGroups.length === 0) return;
    
    const perGroup = Math.floor(totalTrees / ageGroups.length);
    const remainder = totalTrees % ageGroups.length;
    
    onAgeGroupsChange(
      ageGroups.map((g, i) => ({
        ...g,
        quantity: perGroup + (i < remainder ? 1 : 0),
      }))
    );
  };

  const useDefaultDistribution = () => {
    // 30% seedlings, 30% young, 30% mature, 10% old
    const distribution = [
      { age: 1, label: "Seedlings (1 year)", percent: 0.3 },
      { age: 3, label: "Young (3 years)", percent: 0.3 },
      { age: 7, label: "Mature (7 years)", percent: 0.3 },
      { age: 15, label: "Old (15+ years)", percent: 0.1 },
    ];
    
    let remaining = totalTrees;
    const newGroups: AgeGroupConfig[] = distribution.map((d, i) => {
      const quantity = i === distribution.length - 1 
        ? remaining 
        : Math.round(totalTrees * d.percent);
      remaining -= quantity;
      return {
        id: crypto.randomUUID(),
        age: d.age,
        label: d.label,
        quantity: Math.max(0, quantity),
      };
    });
    
    onAgeGroupsChange(newGroups);
  };

  const suggestedGroups = DEFAULT_AGE_GROUPS.filter(
    g => !ageGroups.some(existing => existing.age === g.age)
  );

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
          <Clock className="w-8 h-8 text-primary" />
        </div>
        <h2 className="font-display text-2xl font-bold">Age Distribution</h2>
        <p className="text-muted-foreground">
          Configure the age distribution of your {totalTrees.toLocaleString()} trees
        </p>
      </div>

      {/* Quick Action */}
      {ageGroups.length === 0 && (
        <Card className="shadow-soft border-dashed border-2">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Start with a recommended distribution or add custom age groups
              </p>
              <Button variant="mango" onClick={useDefaultDistribution}>
                Use Recommended Distribution
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Allocation Progress */}
      {ageGroups.length > 0 && (
        <Card className={cn(
          "shadow-soft transition-colors",
          isOverAllocated && "border-destructive",
          isFullyAllocated && !isOverAllocated && "border-secondary"
        )}>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Tree Allocation</span>
                <span className={cn(
                  "font-bold",
                  isOverAllocated && "text-destructive",
                  isFullyAllocated && !isOverAllocated && "text-secondary"
                )}>
                  {allocatedTrees.toLocaleString()} / {totalTrees.toLocaleString()}
                </span>
              </div>
              <Progress 
                value={Math.min(allocationPercent, 100)} 
                className={cn(
                  "h-3",
                  isOverAllocated && "[&>div]:bg-destructive",
                  isFullyAllocated && !isOverAllocated && "[&>div]:bg-secondary"
                )}
              />
              {isOverAllocated && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  <span>Over-allocated by {Math.abs(remainingTrees).toLocaleString()} trees</span>
                </div>
              )}
              {!isFullyAllocated && !isOverAllocated && (
                <p className="text-sm text-muted-foreground">
                  {remainingTrees.toLocaleString()} trees remaining
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Age Groups List */}
      {ageGroups.length > 0 && (
        <Card className="shadow-soft">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Age Groups</CardTitle>
                <CardDescription>
                  Configure each age group's tree count
                </CardDescription>
              </div>
              {ageGroups.length > 1 && (
                <Button variant="outline" size="sm" onClick={distributeEvenly}>
                  Distribute Evenly
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {ageGroups.map((group) => {
              const stage = getGrowthStageForAge(group.age);
              return (
                <div
                  key={group.id}
                  className="p-4 rounded-lg border bg-card space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">{stage}</Badge>
                      <span className="font-medium">{group.label}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAgeGroup(group.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Age (years)</Label>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[group.age]}
                          onValueChange={([value]) => updateGroupAge(group.id, value)}
                          min={1}
                          max={50}
                          step={1}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          min={1}
                          max={50}
                          value={group.age}
                          onChange={(e) => updateGroupAge(group.id, parseInt(e.target.value) || 1)}
                          className="w-16 text-center"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Number of trees</Label>
                      <Input
                        type="number"
                        min={0}
                        value={group.quantity}
                        onChange={(e) => updateGroupQuantity(group.id, parseInt(e.target.value) || 0)}
                        className="text-center"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Add new age group */}
      {suggestedGroups.length > 0 && (
        <Card className="shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Add Age Group</CardTitle>
            <CardDescription>
              Select from common age groups
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {suggestedGroups.map((group) => {
                const Icon = group.icon;
                return (
                  <Button
                    key={group.age}
                    variant="outline"
                    className="h-auto py-3 justify-start gap-3"
                    onClick={() => addAgeGroup(group.age, group.label)}
                  >
                    <Icon className="w-5 h-5 text-secondary" />
                    <span>{group.label}</span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

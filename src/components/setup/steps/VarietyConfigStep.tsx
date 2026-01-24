import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Trash2, Leaf, AlertCircle } from "lucide-react";
import { VarietyConfig, DEFAULT_MANGO_VARIETIES } from "@/types/farm.types";
import { cn } from "@/lib/utils";

interface VarietyConfigStepProps {
  totalTrees: number;
  varieties: VarietyConfig[];
  cropType: string;
  onVarietiesChange: (varieties: VarietyConfig[]) => void;
}

export function VarietyConfigStep({
  totalTrees,
  varieties,
  cropType,
  onVarietiesChange,
}: VarietyConfigStepProps) {
  const [newVarietyName, setNewVarietyName] = useState("");
  
  const allocatedTrees = varieties.reduce((sum, v) => sum + v.quantity, 0);
  const remainingTrees = totalTrees - allocatedTrees;
  const allocationPercent = totalTrees > 0 ? (allocatedTrees / totalTrees) * 100 : 0;
  const isFullyAllocated = remainingTrees === 0;
  const isOverAllocated = remainingTrees < 0;

  const addVariety = (name: string) => {
    if (!name.trim() || varieties.some(v => v.name.toLowerCase() === name.toLowerCase())) {
      return;
    }
    
    const newVariety: VarietyConfig = {
      id: crypto.randomUUID(),
      name: name.trim(),
      quantity: remainingTrees > 0 ? Math.min(remainingTrees, Math.floor(totalTrees / 3)) : 0,
    };
    
    onVarietiesChange([...varieties, newVariety]);
    setNewVarietyName("");
  };

  const updateVarietyQuantity = (id: string, quantity: number) => {
    onVarietiesChange(
      varieties.map(v => v.id === id ? { ...v, quantity: Math.max(0, quantity) } : v)
    );
  };

  const removeVariety = (id: string) => {
    onVarietiesChange(varieties.filter(v => v.id !== id));
  };

  const distributeEvenly = () => {
    if (varieties.length === 0) return;
    
    const perVariety = Math.floor(totalTrees / varieties.length);
    const remainder = totalTrees % varieties.length;
    
    onVarietiesChange(
      varieties.map((v, i) => ({
        ...v,
        quantity: perVariety + (i < remainder ? 1 : 0),
      }))
    );
  };

  const suggestedVarieties = cropType === 'mango' 
    ? DEFAULT_MANGO_VARIETIES.filter(v => !varieties.some(existing => existing.name.toLowerCase() === v.toLowerCase()))
    : [];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary/10 mb-2">
          <Leaf className="w-8 h-8 text-secondary" />
        </div>
        <h2 className="font-display text-2xl font-bold">Configure Varieties</h2>
        <p className="text-muted-foreground">
          Allocate your {totalTrees.toLocaleString()} trees across different varieties
        </p>
      </div>

      {/* Allocation Progress */}
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
                {remainingTrees.toLocaleString()} trees remaining to allocate
              </p>
            )}
            {isFullyAllocated && !isOverAllocated && (
              <p className="text-sm text-secondary font-medium">
                ✓ All trees allocated
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Varieties List */}
      <Card className="shadow-soft">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Your Varieties</CardTitle>
              <CardDescription>
                Add and configure tree varieties
              </CardDescription>
            </div>
            {varieties.length > 1 && (
              <Button variant="outline" size="sm" onClick={distributeEvenly}>
                Distribute Evenly
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing varieties */}
          {varieties.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Leaf className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No varieties added yet</p>
              <p className="text-sm">Add varieties below or select from suggestions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {varieties.map((variety) => (
                <div
                  key={variety.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                >
                  <div className="flex-1">
                    <Label className="font-medium">{variety.name}</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max={totalTrees}
                      value={variety.quantity}
                      onChange={(e) => updateVarietyQuantity(variety.id, parseInt(e.target.value) || 0)}
                      className="w-24 text-center"
                    />
                    <span className="text-sm text-muted-foreground w-12">trees</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeVariety(variety.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add new variety */}
          <div className="flex gap-2 pt-2">
            <Input
              placeholder="Enter variety name..."
              value={newVarietyName}
              onChange={(e) => setNewVarietyName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addVariety(newVarietyName)}
            />
            <Button
              variant="secondary"
              onClick={() => addVariety(newVarietyName)}
              disabled={!newVarietyName.trim()}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>

          {/* Suggested varieties */}
          {suggestedVarieties.length > 0 && (
            <div className="pt-4 border-t">
              <Label className="text-sm text-muted-foreground mb-2 block">
                Quick add popular {cropType} varieties:
              </Label>
              <div className="flex flex-wrap gap-2">
                {suggestedVarieties.slice(0, 6).map((name) => (
                  <Badge
                    key={name}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => addVariety(name)}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

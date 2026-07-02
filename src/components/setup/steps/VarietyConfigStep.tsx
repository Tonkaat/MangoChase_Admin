// VarietyConfigStep.tsx
import { useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Leaf, Info } from "lucide-react";
import { VarietyConfig } from "@/types/farm.types";

interface VarietyConfigStepProps {
  totalTrees: number;
  varieties: VarietyConfig[];
  cropType: string;
  onVarietiesChange: (varieties: VarietyConfig[]) => void;
}

const FIXED_VARIETY_NAME = "Carabao";

export function VarietyConfigStep({
  totalTrees,
  varieties,
  onVarietiesChange,
}: VarietyConfigStepProps) {
  // Keep one stable id for the fixed variety so re-renders don't churn it
  const varietyIdRef = useRef<string>(varieties[0]?.id ?? crypto.randomUUID());

  // Always keep `varieties` as exactly one Carabao entry, quantity synced to totalTrees.
  // This runs whenever totalTrees changes (e.g. user edits it on the previous step)
  // or if varieties ever gets out of sync (e.g. coming back from Review).
  useEffect(() => {
    const existing = varieties[0];
    const isInSync =
      varieties.length === 1 &&
      existing.name === FIXED_VARIETY_NAME &&
      existing.quantity === totalTrees;

    if (!isInSync) {
      onVarietiesChange([
        {
          id: varietyIdRef.current,
          name: FIXED_VARIETY_NAME,
          quantity: totalTrees,
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalTrees, varieties]);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary/10 mb-2">
          <Leaf className="w-8 h-8 text-secondary" />
        </div>
        <h2 className="font-display text-2xl font-bold">Variety</h2>
        <p className="text-muted-foreground">
          All {totalTrees.toLocaleString()} trees will be set up as Carabao mango
        </p>
      </div>

      {/* Focus notice */}
      <Card className="shadow-soft border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium">We're currently focused on Carabao mango</p>
              <p className="text-sm text-muted-foreground">
                To keep setup simple and reliable, we currently support the Carabao
                mango variety only. Support for additional varieties is on the
                roadmap — for now, all your trees will be created as Carabao mango.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fixed variety summary (read-only) */}
      <Card className="shadow-soft border-secondary/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Your Variety</CardTitle>
          <CardDescription>Fixed for this release</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-secondary" />
              <span className="font-medium">Carabao Mango</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {totalTrees.toLocaleString()} trees
              </span>
              <Badge variant="secondary">100%</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
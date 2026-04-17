// src/components/trees/RecordHarvestModal.tsx
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Calendar, Loader2, Scale, TreeDeciduous, Wheat } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Cluster, HarvestRecord } from "@/types/tree.types";

interface RecordHarvestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clusters: Cluster[];
  onSubmit: (harvest: Omit<HarvestRecord, 'id' | 'createdAt'>) => Promise<void>;
  farmId: string;
  /** Pre-select a cluster (e.g., opened from cluster panel) */
  defaultClusterId?: string;
}

export function RecordHarvestModal({
  open,
  onOpenChange,
  clusters,
  onSubmit,
  farmId,
  defaultClusterId,
}: RecordHarvestModalProps) {
  const [clusterId, setClusterId] = useState(defaultClusterId ?? "");
  const [totalKg, setTotalKg] = useState("");
  const [harvestDate, setHarvestDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Reset when opening
  useEffect(() => {
    if (open) {
      setClusterId(defaultClusterId ?? "");
      setTotalKg("");
      setHarvestDate(new Date());
      setNotes("");
      setError("");
    }
  }, [open, defaultClusterId]);

  const selectedCluster = clusters.find((c) => c.id === clusterId || c.name === clusterId);
  const treeCount = selectedCluster?.treeCount ?? 0;
  const kgPerTree = treeCount > 0 && totalKg ? (parseFloat(totalKg) / treeCount) : 0;

  const handleSubmit = async () => {
    setError("");
    if (!clusterId) return setError("Please select a cluster");
    if (!totalKg || parseFloat(totalKg) <= 0) return setError("Please enter a valid total yield");
    if (!selectedCluster) return setError("Cluster not found");

    try {
      setSubmitting(true);
      await onSubmit({
        farmId,
        clusterId: selectedCluster.id,
        clusterName: selectedCluster.name,
        harvestDate,
        totalKg: parseFloat(totalKg),
        kgPerTree: treeCount > 0 ? parseFloat(totalKg) / treeCount : parseFloat(totalKg),
        treeCount,
        variety: selectedCluster.varieties?.join(", "),
        notes: notes.trim() || undefined,
      });
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Failed to record harvest");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wheat className="h-5 w-5 text-amber-600" />
            Record Harvest
          </DialogTitle>
          <DialogDescription>
            Log a harvest for a cluster. This updates yield data used in AI predictions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Cluster */}
          <div className="space-y-1.5">
            <Label className="text-xs">
              Cluster <span className="text-destructive">*</span>
            </Label>
            <Select value={clusterId} onValueChange={setClusterId} disabled={submitting}>
              <SelectTrigger>
                <SelectValue placeholder="Select a cluster…" />
              </SelectTrigger>
              <SelectContent>
                {clusters.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="flex items-center gap-2">
                      <TreeDeciduous className="h-3.5 w-3.5 text-muted-foreground" />
                      {c.name}
                      <span className="text-xs text-muted-foreground">({c.treeCount} trees)</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Harvest date */}
          <div className="space-y-1.5">
            <Label className="text-xs">Harvest Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal")}
                  disabled={submitting}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {format(harvestDate, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={harvestDate}
                  onSelect={(d) => d && setHarvestDate(d)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Total yield */}
          <div className="space-y-1.5">
            <Label className="text-xs">
              Total Yield (kg) <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Scale className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                min="0"
                step="0.5"
                placeholder="e.g., 2500"
                value={totalKg}
                onChange={(e) => setTotalKg(e.target.value)}
                disabled={submitting}
                className="pl-9"
              />
            </div>
          </div>

          {/* Auto-computed kg/tree */}
          {treeCount > 0 && totalKg && parseFloat(totalKg) > 0 && (
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/60 dark:border-emerald-800/40 p-3">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-lg font-bold tabular-nums">{parseFloat(totalKg).toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total kg</p>
                </div>
                <div>
                  <p className="text-lg font-bold tabular-nums">{treeCount}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Trees</p>
                </div>
                <div>
                  <p className="text-lg font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                    {kgPerTree.toFixed(1)}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">kg / tree</p>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs">Notes (Optional)</Label>
            <Textarea
              placeholder="Quality observations, weather conditions, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={submitting}
              rows={2}
              className="resize-none text-sm"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting} className="bg-amber-600 hover:bg-amber-700 text-white">
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Record Harvest
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
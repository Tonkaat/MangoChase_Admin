// src/components/trees/HarvestRecordModal.tsx
// Modal for recording a harvest for a cluster.
// Call treeService.addHarvestRecord() on submit — it writes lastYield to all
// trees in the cluster and refreshes cluster stats automatically.

import { useState } from "react";
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
import { Calendar, Loader2, Wheat, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Cluster, HarvestRecord } from "@/types/tree.types";
import { treeService } from "@/services/firebase/tree-service";
import { auth } from "@/config/firebase";
import { toast } from "sonner";

interface HarvestRecordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  farmId: string;
  clusters: Cluster[];
  /** Pre-select a cluster (e.g., opened from cluster card) */
  defaultClusterId?: string;
  onSuccess?: () => void;
}

export function HarvestRecordModal({
  open,
  onOpenChange,
  farmId,
  clusters,
  defaultClusterId,
  onSuccess,
}: HarvestRecordModalProps) {
  const [selectedClusterId, setSelectedClusterId] = useState(defaultClusterId ?? "");
  const [harvestDate, setHarvestDate] = useState<Date>(new Date());
  const [totalKg, setTotalKg] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const selectedCluster = clusters.find((c) => c.id === selectedClusterId);
  const treeCount = selectedCluster?.stats?.treeCount ?? selectedCluster?.treeCount ?? 0;
  const kgPerTree = totalKg && treeCount > 0
    ? (parseFloat(totalKg) / treeCount).toFixed(2)
    : null;

  const handleSubmit = async () => {
    setError("");

    if (!selectedClusterId) return setError("Please select a cluster");
    if (!totalKg || parseFloat(totalKg) <= 0) return setError("Please enter a valid total harvest (kg)");
    if (!selectedCluster) return setError("Selected cluster not found");

    const totalKgNum = parseFloat(totalKg);
    const kgPerTreeNum = treeCount > 0 ? totalKgNum / treeCount : totalKgNum;

    const record: HarvestRecord = {
      clusterId: selectedCluster.id,
      clusterName: selectedCluster.name,
      harvestDate,
      totalKg: totalKgNum,
      kgPerTree: kgPerTreeNum,
      variety: selectedCluster.stats?.varieties?.[0],
      notes: notes.trim() || undefined,
      recordedBy: auth.currentUser?.uid,
    };

    try {
      setSubmitting(true);
      await treeService.addHarvestRecord(farmId, record);
      toast.success(`Harvest recorded for ${selectedCluster.name}`);
      onOpenChange(false);
      onSuccess?.();
      // Reset
      setTotalKg("");
      setNotes("");
      setSelectedClusterId(defaultClusterId ?? "");
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
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-500/10 p-2.5">
              <Wheat className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <DialogTitle>Record Harvest</DialogTitle>
              <DialogDescription>
                Log yield data for a cluster to improve AI predictions.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Cluster select */}
          <div className="space-y-1.5">
            <Label className="text-xs">Cluster <span className="text-destructive">*</span></Label>
            <Select value={selectedClusterId} onValueChange={setSelectedClusterId} disabled={submitting}>
              <SelectTrigger>
                <SelectValue placeholder="Select cluster…" />
              </SelectTrigger>
              <SelectContent>
                {clusters.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                    {c.stats?.treeCount ? (
                      <span className="ml-2 text-xs text-muted-foreground">({c.stats.treeCount} trees)</span>
                    ) : null}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Harvest date */}
          <div className="space-y-1.5">
            <Label className="text-xs">Harvest Date <span className="text-destructive">*</span></Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !harvestDate && "text-muted-foreground")}
                  disabled={submitting}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {harvestDate ? format(harvestDate, "PPP") : "Pick date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={harvestDate}
                  onSelect={(d) => d && setHarvestDate(d)}
                  initialFocus
                  disabled={(d) => d > new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Total kg */}
          <div className="space-y-1.5">
            <Label className="text-xs">Total Harvest <span className="text-destructive">*</span></Label>
            <div className="relative">
              <Input
                type="number"
                min="0"
                step="0.5"
                placeholder="e.g., 2500"
                value={totalKg}
                onChange={(e) => setTotalKg(e.target.value)}
                disabled={submitting}
                className="pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">kg</span>
            </div>
          </div>

          {/* Live kg/tree preview */}
          {kgPerTree && selectedCluster && (
            <div className="flex items-center gap-3 rounded-lg border border-emerald-200/60 bg-emerald-50/50 dark:border-emerald-900/30 dark:bg-emerald-900/10 p-3">
              <TrendingUp className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <div className="text-sm">
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  {kgPerTree} kg/tree
                </span>
                <span className="text-muted-foreground ml-1">
                  across {treeCount} trees in {selectedCluster.name}
                </span>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs">Notes (Optional)</Label>
            <Textarea
              placeholder="Harvest conditions, quality observations…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={submitting}
              rows={2}
              className="resize-none text-sm"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting} className="bg-amber-600 hover:bg-amber-700">
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Record Harvest
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
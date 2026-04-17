// src/components/trees/AddTreeModal.tsx
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tree,
  TreeData,
  HealthStatus,
  GrowthStage,
  normalizeHealthStatus,
  normalizeGrowthStage,
} from "@/types/tree.types";
import {
  Loader2,
  Calendar,
  Plus,
  Copy,
  TreeDeciduous,
  Layers,
  X,
  ChevronDown,
  ChevronUp,
  Ruler,
  Leaf,
  Droplets,
  Scale,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface AddTreeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TreeData) => Promise<void>;
  onBatchSubmit?: (data: TreeData[]) => Promise<void>;
  clusters: string[];
  editingTree?: Tree | null;
}

type FormEntry = {
  id: string;
  type: string;
  variety: string;
  healthStatus: HealthStatus;
  growthStage: GrowthStage;
  cluster: string;
  notes: string;
  location: string;
  plantedDate: Date | undefined;
  // ── NEW: Agronomic fields ──
  height: string;        // metres — string for input binding
  canopySpread: string;  // metres
  lastYield: string;     // kg
};

const DEFAULT_ENTRY = (): FormEntry => ({
  id: Math.random().toString(36).slice(2),
  type: "",
  variety: "",
  healthStatus: "Healthy" as HealthStatus,
  growthStage: "seedling" as GrowthStage,
  cluster: "",
  notes: "",
  location: "",
  plantedDate: undefined,
  height: "",
  canopySpread: "",
  lastYield: "",
});

const HEALTH_STATUSES: { value: HealthStatus; label: string; color: string }[] = [
  { value: "Healthy", label: "Healthy", color: "text-emerald-600" },
  { value: "Warning", label: "Warning", color: "text-amber-600" },
  { value: "Critical", label: "Critical", color: "text-red-600" },
  { value: "Unknown", label: "Unknown", color: "text-muted-foreground" },
];

const GROWTH_STAGES: { value: GrowthStage; label: string }[] = [
  { value: "seedling", label: "Seedling" },
  { value: "juvenile", label: "Juvenile" },
  { value: "mature", label: "Mature" },
  { value: "flowering", label: "Flowering" },
  { value: "fruiting", label: "Fruiting" },
];

// ─── Single tree form ────────────────────────────────────────────────────────

function SingleTreeForm({
  entry,
  clusters,
  disabled,
  onChange,
}: {
  entry: FormEntry;
  clusters: string[];
  disabled: boolean;
  onChange: (field: keyof FormEntry, value: any) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Type + Variety */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">
            Tree Type <span className="text-destructive">*</span>
          </Label>
          <Input
            placeholder="e.g., Mango"
            value={entry.type}
            onChange={(e) => onChange("type", e.target.value)}
            disabled={disabled}
            className="h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">
            Variety <span className="text-destructive">*</span>
          </Label>
          <Input
            placeholder="e.g., Carabao"
            value={entry.variety}
            onChange={(e) => onChange("variety", e.target.value)}
            disabled={disabled}
            className="h-9"
          />
        </div>
      </div>

      {/* Health + Growth */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Health Status</Label>
          <Select
            value={entry.healthStatus}
            onValueChange={(v) => onChange("healthStatus", v as HealthStatus)}
            disabled={disabled}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HEALTH_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  <span className={s.color}>{s.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Growth Stage</Label>
          <Select
            value={entry.growthStage}
            onValueChange={(v) => onChange("growthStage", v as GrowthStage)}
            disabled={disabled}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GROWTH_STAGES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cluster */}
      <div className="space-y-1.5">
        <Label className="text-xs">Cluster (Optional)</Label>
        <Select
          value={entry.cluster || "none"}
          onValueChange={(v) => onChange("cluster", v === "none" ? "" : v)}
          disabled={disabled}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="No cluster" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Cluster (Default)</SelectItem>
            {clusters.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Location + Planted Date */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Location (Optional)</Label>
          <Input
            placeholder="Row 3, Position 15"
            value={entry.location}
            onChange={(e) => onChange("location", e.target.value)}
            disabled={disabled}
            className="h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Planted Date (Optional)</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-9 w-full justify-start text-left font-normal text-sm",
                  !entry.plantedDate && "text-muted-foreground",
                )}
                disabled={disabled}
              >
                <Calendar className="mr-2 h-3.5 w-3.5" />
                {entry.plantedDate ? format(entry.plantedDate, "PP") : "Pick date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={entry.plantedDate}
                onSelect={(d) => onChange("plantedDate", d)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* ── NEW: Agronomic fields (collapsible) ── */}
      <Accordion type="single" collapsible>
        <AccordionItem value="agronomic" className="border rounded-lg px-3">
          <AccordionTrigger className="text-xs font-medium text-muted-foreground hover:no-underline py-2">
            <span className="flex items-center gap-1.5">
              <Ruler className="h-3.5 w-3.5" />
              Agronomic Details
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-1">
                Improves yield prediction
              </Badge>
            </span>
          </AccordionTrigger>
          <AccordionContent className="pb-3">
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-2 gap-3">
                {/* Height */}
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1">
                    <Ruler className="h-3 w-3 text-muted-foreground" />
                    Height (metres)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="e.g., 4.5"
                    value={entry.height}
                    onChange={(e) => onChange("height", e.target.value)}
                    disabled={disabled}
                    className="h-9"
                  />
                </div>
                {/* Canopy */}
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1">
                    <Leaf className="h-3 w-3 text-muted-foreground" />
                    Canopy Spread (m)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="e.g., 3.5"
                    value={entry.canopySpread}
                    onChange={(e) => onChange("canopySpread", e.target.value)}
                    disabled={disabled}
                    className="h-9"
                  />
                </div>
              </div>
              {/* Last Yield */}
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <Scale className="h-3 w-3 text-muted-foreground" />
                  Last Known Yield (kg/tree)
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="e.g., 20"
                  value={entry.lastYield}
                  onChange={(e) => onChange("lastYield", e.target.value)}
                  disabled={disabled}
                  className="h-9"
                />
                <p className="text-[10px] text-muted-foreground">
                  Leave blank if unknown — yield data is also captured via harvest records.
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label className="text-xs">Notes (Optional)</Label>
        <Textarea
          placeholder="Additional observations…"
          value={entry.notes}
          onChange={(e) => onChange("notes", e.target.value)}
          disabled={disabled}
          rows={2}
          className="resize-none text-sm"
        />
      </div>
    </div>
  );
}

// ─── Batch card ───────────────────────────────────────────────────────────────

function BatchTreeCard({
  entry,
  index,
  clusters,
  disabled,
  isExpanded,
  onToggle,
  onChange,
  onDuplicate,
  onRemove,
  canRemove,
}: {
  entry: FormEntry;
  index: number;
  clusters: string[];
  disabled: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onChange: (field: keyof FormEntry, value: any) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const isValid = entry.type.trim() && entry.variety.trim();
  const summary = entry.type && entry.variety
    ? `${entry.type} · ${entry.variety}${entry.cluster ? ` · ${entry.cluster}` : ""}`
    : "Fill in type and variety";

  return (
    <div className={`rounded-lg border transition-all ${isValid ? "border-border" : "border-dashed border-muted-foreground/40"}`}>
      <div className="flex cursor-pointer items-center gap-3 p-3" onClick={onToggle}>
        <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${isValid ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm truncate ${isValid ? "text-foreground" : "text-muted-foreground"}`}>
            {summary}
          </p>
          {!isValid && <p className="text-xs text-destructive/70">Type and variety required</p>}
        </div>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDuplicate} disabled={disabled} title="Duplicate">
            <Copy className="h-3 w-3" />
          </Button>
          {canRemove && (
            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={onRemove} disabled={disabled}>
              <X className="h-3 w-3" />
            </Button>
          )}
          {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t px-3 pb-3 pt-3">
          <SingleTreeForm entry={entry} clusters={clusters} disabled={disabled} onChange={onChange} />
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AddTreeModal({
  open,
  onOpenChange,
  onSubmit,
  onBatchSubmit,
  clusters,
  editingTree,
}: AddTreeModalProps) {
  const [mode, setMode] = useState<"single" | "batch">("single");
  const [singleEntry, setSingleEntry] = useState<FormEntry>(DEFAULT_ENTRY());
  const [batchEntries, setBatchEntries] = useState<FormEntry[]>([DEFAULT_ENTRY(), DEFAULT_ENTRY()]);
  const [expandedIdx, setExpandedIdx] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      if (editingTree) {
        setSingleEntry({
          id: editingTree.id,
          type: editingTree.type || "",
          variety: editingTree.variety || "",
          healthStatus: editingTree.healthStatus || "Healthy",
          growthStage: editingTree.growthStage || "seedling",
          cluster: editingTree.cluster || "",
          notes: editingTree.notes || "",
          location: editingTree.location || "",
          plantedDate: editingTree.plantedDate,
          height: editingTree.height != null ? String(editingTree.height) : "",
          canopySpread: editingTree.canopySpread != null ? String(editingTree.canopySpread) : "",
          lastYield: editingTree.lastYield != null ? String(editingTree.lastYield) : "",
        });
        setMode("single");
      } else {
        setSingleEntry(DEFAULT_ENTRY());
        setBatchEntries([DEFAULT_ENTRY(), DEFAULT_ENTRY()]);
        setExpandedIdx(0);
      }
      setError("");
    }
  }, [open, editingTree]);

  const updateSingleField = (field: keyof FormEntry, value: any) =>
    setSingleEntry((prev) => ({ ...prev, [field]: value }));

  const updateBatchField = (idx: number, field: keyof FormEntry, value: any) =>
    setBatchEntries((prev) => prev.map((e, i) => (i === idx ? { ...e, [field]: value } : e)));

  const addBatchEntry = () => {
    setBatchEntries((prev) => [...prev, DEFAULT_ENTRY()]);
    setExpandedIdx(batchEntries.length);
  };

  const duplicateBatchEntry = (idx: number) => {
    const copy = { ...batchEntries[idx], id: Math.random().toString(36).slice(2) };
    const next = [...batchEntries];
    next.splice(idx + 1, 0, copy);
    setBatchEntries(next);
    setExpandedIdx(idx + 1);
  };

  const removeBatchEntry = (idx: number) => {
    setBatchEntries((prev) => prev.filter((_, i) => i !== idx));
    setExpandedIdx(Math.max(0, expandedIdx - 1));
  };

  const entryToTreeData = (entry: FormEntry): TreeData => ({
    type: entry.type.trim(),
    variety: entry.variety.trim(),
    healthStatus: normalizeHealthStatus(entry.healthStatus),
    growthStage: normalizeGrowthStage(entry.growthStage),
    cluster: entry.cluster.trim() || undefined,
    flagged: false,
    notes: entry.notes.trim() || undefined,
    location: entry.location.trim() || undefined,
    plantedDate: entry.plantedDate,
    lastInspection: new Date(),
    // ── Agronomic ──
    height: entry.height ? parseFloat(entry.height) : undefined,
    canopySpread: entry.canopySpread ? parseFloat(entry.canopySpread) : undefined,
    lastYield: entry.lastYield ? parseFloat(entry.lastYield) : undefined,
    missedSprayings: 0,
  });

  const handleSubmit = async () => {
    setError("");

    if (mode === "single") {
      if (!singleEntry.type.trim()) return setError("Tree type is required");
      if (!singleEntry.variety.trim()) return setError("Variety is required");
      try {
        setSubmitting(true);
        await onSubmit(entryToTreeData(singleEntry));
        onOpenChange(false);
      } catch (err: any) {
        setError(err.message || "Failed to save tree");
      } finally {
        setSubmitting(false);
      }
    } else {
      const invalid = batchEntries.filter((e) => !e.type.trim() || !e.variety.trim());
      if (invalid.length > 0) {
        return setError(`${invalid.length} entr${invalid.length === 1 ? "y" : "ies"} missing type or variety`);
      }
      try {
        setSubmitting(true);
        const treeDataList = batchEntries.map(entryToTreeData);
        if (onBatchSubmit) {
          await onBatchSubmit(treeDataList);
        } else {
          for (const data of treeDataList) await onSubmit(data);
        }
        onOpenChange(false);
      } catch (err: any) {
        setError(err.message || "Failed to save trees");
      } finally {
        setSubmitting(false);
      }
    }
  };

  const validBatchCount = batchEntries.filter((e) => e.type.trim() && e.variety.trim()).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col sm:max-w-[640px] max-h-[90vh]">
        <DialogHeader className="shrink-0">
          <DialogTitle>{editingTree ? "Edit Tree" : "Add Tree"}</DialogTitle>
          <DialogDescription>
            {editingTree
              ? `Editing: ${editingTree.tree_name || editingTree.id.slice(0, 8)}`
              : "Add one or multiple trees at once. Agronomic details improve yield predictions."}
          </DialogDescription>
        </DialogHeader>

        {!editingTree && (
          <Tabs value={mode} onValueChange={(v) => setMode(v as "single" | "batch")} className="shrink-0">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single" className="gap-1.5">
                <TreeDeciduous className="h-3.5 w-3.5" />
                Single Tree
              </TabsTrigger>
              <TabsTrigger value="batch" className="gap-1.5">
                <Layers className="h-3.5 w-3.5" />
                Batch Add
                {batchEntries.length > 0 && (
                  <Badge variant="secondary" className="text-xs">{batchEntries.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        <div className="flex-1 overflow-y-auto min-h-0">
          {(mode === "single" || editingTree) && (
            <div className="py-2">
              <SingleTreeForm
                entry={singleEntry}
                clusters={clusters}
                disabled={submitting}
                onChange={updateSingleField}
              />
            </div>
          )}

          {mode === "batch" && !editingTree && (
            <div className="space-y-2 py-2">
              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                <span>
                  <span className="font-medium text-foreground">{batchEntries.length}</span> trees ·{" "}
                  <span className="font-medium text-primary">{validBatchCount}</span> ready
                </span>
                <span>Click a card to expand</span>
              </div>

              {batchEntries.map((entry, idx) => (
                <BatchTreeCard
                  key={entry.id}
                  entry={entry}
                  index={idx}
                  clusters={clusters}
                  disabled={submitting}
                  isExpanded={expandedIdx === idx}
                  onToggle={() => setExpandedIdx(expandedIdx === idx ? -1 : idx)}
                  onChange={(field, value) => updateBatchField(idx, field, value)}
                  onDuplicate={() => duplicateBatchEntry(idx)}
                  onRemove={() => removeBatchEntry(idx)}
                  canRemove={batchEntries.length > 1}
                />
              ))}

              <Button variant="outline" size="sm" className="w-full border-dashed" onClick={addBatchEntry} disabled={submitting}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add Another Tree
              </Button>
            </div>
          )}
        </div>

        {error && (
          <div className="shrink-0 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <DialogFooter className="shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editingTree
              ? "Save Changes"
              : mode === "batch"
              ? `Add ${validBatchCount > 0 ? validBatchCount : batchEntries.length} Tree${batchEntries.length !== 1 ? "s" : ""}`
              : "Add Tree"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
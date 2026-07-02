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
// NOTE: The Agronomic Details accordion is temporarily disabled (see SingleTreeForm).
// Re-enable this import if you bring that section back.
// import {
//   Accordion,
//   AccordionContent,
//   AccordionItem,
//   AccordionTrigger,
// } from "@/components/ui/accordion";
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
  Leaf,
  Settings2,
} from "lucide-react";
// NOTE: `Ruler` and `Scale` icons were used by the Agronomic Details accordion
// (now disabled below). Re-import them alongside the Accordion import above if re-enabled.
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
  // ── Agronomic fields (UI temporarily disabled, data shape kept) ──
  height: string;        // metres — string for input binding
  canopySpread: string;  // metres
  lastYield: string;     // kg
};

// ─── Fixed study parameters ────────────────────────────────────────────────
// This study currently only tracks one type/variety combination, so these
// are no longer editable per-tree — just displayed. If that changes, turn
// the static info row in SingleTreeForm back into Type/Variety inputs.
const TREE_TYPE = "Mango";
const TREE_VARIETY = "Carabao";

const DEFAULT_ENTRY = (overrides?: Partial<FormEntry>): FormEntry => ({
  id: Math.random().toString(36).slice(2),
  type: TREE_TYPE,
  variety: TREE_VARIETY,
  healthStatus: "Healthy" as HealthStatus,
  growthStage: "seedling" as GrowthStage,
  cluster: "",
  notes: "",
  location: "",
  plantedDate: undefined,
  height: "",
  canopySpread: "",
  lastYield: "",
  ...overrides,
});

const HEALTH_STATUSES: { value: HealthStatus; label: string; color: string }[] = [
  { value: "Healthy", label: "Healthy", color: "text-emerald-600" },
  { value: "Infected", label: "Infected", color: "text-red-600" },
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
      {/* Type + Variety — fixed for this study, displayed only (not editable) */}
      <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
        <Leaf className="h-4 w-4 text-emerald-600" />
        <span className="text-sm font-medium">{TREE_TYPE}</span>
        <span className="text-muted-foreground">·</span>
        <Badge variant="secondary" className="text-xs">{TREE_VARIETY}</Badge>
        <span className="ml-auto text-[10px] text-muted-foreground">Fixed for this study</span>
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

      {/* Location (Optional) — temporarily disabled.
          To re-enable: uncomment this block and put it back in a
          `grid grid-cols-2 gap-3` row next to Planted Date below. */}
      {/*
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
      */}

      {/* Planted Date (Optional) */}
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

      {/* ── Agronomic Details — temporarily disabled ──
          To re-enable: uncomment this block, restore the Accordion import
          at the top of the file, and restore the `Ruler, Scale` icon imports. */}
      {/*
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
      */}

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
}) {
  // Type/variety are fixed now, so every card is "valid" by default —
  // the summary just surfaces whatever's been customized.
  const summaryParts = [
    entry.cluster ? `Cluster: ${entry.cluster}` : null,
    entry.healthStatus !== "Healthy" ? entry.healthStatus : null,
    entry.growthStage !== "seedling"
      ? GROWTH_STAGES.find((s) => s.value === entry.growthStage)?.label
      : null,
  ].filter(Boolean) as string[];
  const summary = summaryParts.length > 0 ? summaryParts.join(" · ") : "Default settings";

  return (
    <div className="rounded-lg border border-border">
      <div className="flex cursor-pointer items-center gap-3 p-3" onClick={onToggle}>
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm truncate text-foreground">
            {TREE_TYPE} · {TREE_VARIETY}
          </p>
          <p className="text-xs text-muted-foreground truncate">{summary}</p>
        </div>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDuplicate} disabled={disabled} title="Duplicate">
            <Copy className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={onRemove} disabled={disabled} title="Remove">
            <X className="h-3 w-3" />
          </Button>
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
  const [batchEntries, setBatchEntries] = useState<FormEntry[]>([]);
  const [expandedIdx, setExpandedIdx] = useState<number>(-1);
  const [bulkCount, setBulkCount] = useState<string>("10");
  const [quickDefaults, setQuickDefaults] = useState<{
    healthStatus: HealthStatus;
    growthStage: GrowthStage;
    cluster: string;
    plantedDate: Date | undefined;
  }>({
    healthStatus: "Healthy",
    growthStage: "seedling",
    cluster: "",
    plantedDate: undefined,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      if (editingTree) {
        setSingleEntry({
          id: editingTree.id,
          type: TREE_TYPE,
          variety: TREE_VARIETY,
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
        setBatchEntries([]);
        setExpandedIdx(-1);
        setBulkCount("10");
        setQuickDefaults({
          healthStatus: "Healthy",
          growthStage: "seedling",
          cluster: "",
          plantedDate: undefined,
        });
      }
      setError("");
    }
  }, [open, editingTree]);

  const updateSingleField = (field: keyof FormEntry, value: any) =>
    setSingleEntry((prev) => ({ ...prev, [field]: value }));

  const updateBatchField = (idx: number, field: keyof FormEntry, value: any) =>
    setBatchEntries((prev) => prev.map((e, i) => (i === idx ? { ...e, [field]: value } : e)));

  // ── Bulk add: the main fix for "100 trees, one click at a time" ──
  const addBulkEntries = (count: number) => {
    const n = Math.max(1, Math.min(500, Math.floor(count) || 0));
    if (n <= 0) return;
    const newEntries = Array.from({ length: n }, () =>
      DEFAULT_ENTRY({
        healthStatus: quickDefaults.healthStatus,
        growthStage: quickDefaults.growthStage,
        cluster: quickDefaults.cluster,
        plantedDate: quickDefaults.plantedDate,
      }),
    );
    setBatchEntries((prev) => [...prev, ...newEntries]);
    setExpandedIdx(-1); // keep the list collapsed — nothing's required, nothing to fix
  };

  // Retroactively stamp the current quick-defaults onto every entry already added
  const applyDefaultsToAll = () => {
    setBatchEntries((prev) =>
      prev.map((e) => ({
        ...e,
        healthStatus: quickDefaults.healthStatus,
        growthStage: quickDefaults.growthStage,
        cluster: quickDefaults.cluster,
        plantedDate: quickDefaults.plantedDate,
      })),
    );
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
    setExpandedIdx(-1);
  };

  const clearAllBatch = () => {
    setBatchEntries([]);
    setExpandedIdx(-1);
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
    // Agronomic inputs are hidden for now; entry.height/canopySpread/lastYield
    // stay "" so these resolve to undefined until that section is re-enabled.
    height: entry.height ? parseFloat(entry.height) : undefined,
    canopySpread: entry.canopySpread ? parseFloat(entry.canopySpread) : undefined,
    lastYield: entry.lastYield ? parseFloat(entry.lastYield) : undefined,
    missedSprayings: 0,
  });

  const handleSubmit = async () => {
    setError("");

    if (mode === "single") {
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
      if (batchEntries.length === 0) {
        return setError("Add at least one tree before submitting");
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col sm:max-w-[640px] max-h-[90vh]">
        <DialogHeader className="shrink-0">
          <DialogTitle>{editingTree ? "Edit Tree" : "Add Tree"}</DialogTitle>
          <DialogDescription>
            {editingTree
              ? `Editing: ${editingTree.tree_name || editingTree.id.slice(0, 8)}`
              : `Tree type is fixed to ${TREE_TYPE} (${TREE_VARIETY}) for this study. Use Batch Add to add many trees at once.`}
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
            <div className="space-y-3 py-2">
              {/* Default values applied to newly added trees */}
              <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
                <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Settings2 className="h-3.5 w-3.5" />
                  Default values for new trees
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Health Status</Label>
                    <Select
                      value={quickDefaults.healthStatus}
                      onValueChange={(v) =>
                        setQuickDefaults((prev) => ({ ...prev, healthStatus: v as HealthStatus }))
                      }
                      disabled={submitting}
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
                      value={quickDefaults.growthStage}
                      onValueChange={(v) =>
                        setQuickDefaults((prev) => ({ ...prev, growthStage: v as GrowthStage }))
                      }
                      disabled={submitting}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GROWTH_STAGES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Cluster (Optional)</Label>
                    <Select
                      value={quickDefaults.cluster || "none"}
                      onValueChange={(v) =>
                        setQuickDefaults((prev) => ({ ...prev, cluster: v === "none" ? "" : v }))
                      }
                      disabled={submitting}
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
                  <div className="space-y-1.5">
                    <Label className="text-xs">Planted Date (Optional)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "h-9 w-full justify-start text-left font-normal text-sm",
                            !quickDefaults.plantedDate && "text-muted-foreground",
                          )}
                          disabled={submitting}
                        >
                          <Calendar className="mr-2 h-3.5 w-3.5" />
                          {quickDefaults.plantedDate ? format(quickDefaults.plantedDate, "PP") : "Pick date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={quickDefaults.plantedDate}
                          onSelect={(d) => setQuickDefaults((prev) => ({ ...prev, plantedDate: d }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                {batchEntries.length > 0 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={applyDefaultsToAll}
                    disabled={submitting}
                  >
                    Apply these values to all {batchEntries.length} trees already added
                  </Button>
                )}
              </div>

              {/* Bulk add control */}
              <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
                <p className="text-xs font-medium text-muted-foreground">Add multiple trees at once</p>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={500}
                    value={bulkCount}
                    onChange={(e) => setBulkCount(e.target.value)}
                    className="h-9 w-24"
                    disabled={submitting}
                  />
                  <Button
                    className="flex-1"
                    onClick={() => addBulkEntries(parseInt(bulkCount, 10))}
                    disabled={submitting}
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Add {bulkCount || 0} Tree{bulkCount === "1" ? "" : "s"}
                  </Button>
                </div>
                <div className="flex gap-1.5">
                  {[10, 25, 50, 100].map((n) => (
                    <Button
                      key={n}
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => addBulkEntries(n)}
                      disabled={submitting}
                    >
                      +{n}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Summary + list */}
              {batchEntries.length > 0 ? (
                <>
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                    <span>
                      <span className="font-medium text-foreground">{batchEntries.length}</span> trees ready to add
                    </span>
                    <button
                      type="button"
                      onClick={clearAllBatch}
                      className="text-destructive hover:underline disabled:opacity-50"
                      disabled={submitting}
                    >
                      Clear all
                    </button>
                  </div>

                  <div className="space-y-2">
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
                      />
                    ))}
                  </div>
                </>
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No trees added yet — use the controls above to add trees in bulk.
                </p>
              )}
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
          <Button
            onClick={handleSubmit}
            disabled={submitting || (mode === "batch" && !editingTree && batchEntries.length === 0)}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editingTree
              ? "Save Changes"
              : mode === "batch"
              ? `Add ${batchEntries.length} Tree${batchEntries.length !== 1 ? "s" : ""}`
              : "Add Tree"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
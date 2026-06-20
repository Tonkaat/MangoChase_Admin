// src/components/trees/TreeFilters.tsx
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TreeFilter, HealthStatus, GrowthStage } from "@/types/tree.types";
import {
  Search,
  X,
  Heart,
  AlertTriangle,
  Activity,
  FolderTree,
  SlidersHorizontal,
} from "lucide-react";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface TreeFiltersProps {
  filters: TreeFilter;
  clusters: string[];
  onFiltersChange: (filters: TreeFilter) => void;
  onClearFilters: () => void;
}

const HEALTH_OPTIONS = [
  { value: "all", label: "All Health", icon: null },
  { value: "Healthy", label: "Healthy", icon: <Heart className="h-3 w-3" />, color: "text-emerald-600" },
  { value: "Infected", label: "Infected", icon: <AlertTriangle className="h-3 w-3" />, color: "text-red-600" },
  { value: "Unknown", label: "Unknown", icon: <Activity className="h-3 w-3" />, color: "text-muted-foreground" },
];

const GROWTH_OPTIONS = [
  { value: "all", label: "All Stages" },
  { value: "seedling", label: "Seedling" },
  { value: "juvenile", label: "Juvenile" },
  { value: "mature", label: "Mature" },
  { value: "flowering", label: "Flowering" },
  { value: "fruiting", label: "Fruiting" },
];

export function TreeFilters({
  filters,
  clusters,
  onFiltersChange,
  onClearFilters,
}: TreeFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const activeFilterCount = [
    filters.healthStatus !== "all",
    filters.growthStage !== "all",
    filters.cluster !== "all",
  ].filter(Boolean).length;

  const hasActiveFilters =
    filters.search ||
    filters.healthStatus !== "all" ||
    filters.growthStage !== "all" ||
    filters.cluster !== "all";

  return (
    <div className="space-y-3">
      {/* Primary search bar row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by name, type, variety, cluster…"
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="pl-10 h-9"
          />
          {filters.search && (
            <button
              onClick={() => onFiltersChange({ ...filters, search: "" })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <Button
          variant={showAdvanced ? "secondary" : "outline"}
          size="sm"
          className="h-9 gap-1.5 shrink-0"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
          {activeFilterCount > 0 && (
            <Badge
              variant="default"
              className="h-4 w-4 rounded-full p-0 text-[10px] flex items-center justify-center"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-muted-foreground hover:text-foreground"
            onClick={onClearFilters}
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>

      {/* Quick health filter chips */}
      <div className="flex flex-wrap gap-1.5">
        {HEALTH_OPTIONS.map((opt) => {
          // Normalize comparison: both "Healthy" and "healthy" map to same filter
          const isActive =
            opt.value === "all"
              ? filters.healthStatus === "all"
              : filters.healthStatus?.toLowerCase() === opt.value.toLowerCase() ||
                filters.healthStatus === opt.value;

          return (
            <button
              key={opt.value}
              onClick={() =>
                onFiltersChange({
                  ...filters,
                  healthStatus: (opt.value === "all" ? "all" : opt.value) as HealthStatus | "all",
                })
              }
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
                isActive
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:border-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.icon && (
                <span className={isActive ? "text-primary" : opt.color ?? ""}>
                  {opt.icon}
                </span>
              )}
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Advanced filters (collapsible) */}
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleContent>
          <div className="grid grid-cols-1 gap-3 rounded-lg border bg-muted/30 p-3 sm:grid-cols-3">
            {/* Growth Stage */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Growth Stage</label>
              <Select
                value={filters.growthStage}
                onValueChange={(value) =>
                  onFiltersChange({ ...filters, growthStage: value as GrowthStage | "all" })
                }
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="All stages" />
                </SelectTrigger>
                <SelectContent>
                  {GROWTH_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cluster */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Cluster</label>
              <Select
                value={filters.cluster}
                onValueChange={(value) => onFiltersChange({ ...filters, cluster: value })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="All clusters" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clusters</SelectItem>
                  {clusters.map((cluster) => (
                    <SelectItem key={cluster} value={cluster}>
                      {cluster}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
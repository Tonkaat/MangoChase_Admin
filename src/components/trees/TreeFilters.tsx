import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { TreeFilter, HealthStatus, GrowthStage } from "@/types/tree.types";
import { Search, X, SlidersHorizontal } from "lucide-react";

interface TreeFiltersProps {
  filters: TreeFilter;
  clusters: string[];
  onFiltersChange: (filters: TreeFilter) => void;
  onClearFilters: () => void;
}

export function TreeFilters({
  filters,
  clusters,
  onFiltersChange,
  onClearFilters,
}: TreeFiltersProps) {
  const hasActiveFilters =
    filters.search ||
    filters.healthStatus !== "all" ||
    filters.growthStage !== "all" ||
    filters.cluster !== "all" ||
    filters.flagged !== "all";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search trees by ID, type, or variety..."
            value={filters.search}
            onChange={(e) =>
              onFiltersChange({ ...filters, search: e.target.value })
            }
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select
            value={filters.healthStatus}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                healthStatus: value as HealthStatus | "all",
              })
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Health" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Health</SelectItem>
              <SelectItem value="healthy">Healthy</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="unknown">Unknown</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.growthStage}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                growthStage: value as GrowthStage | "all",
              })
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Growth" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              <SelectItem value="seedling">Seedling</SelectItem>
              <SelectItem value="juvenile">Juvenile</SelectItem>
              <SelectItem value="mature">Mature</SelectItem>
              <SelectItem value="flowering">Flowering</SelectItem>
              <SelectItem value="fruiting">Fruiting</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.cluster}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, cluster: value })
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Cluster" />
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

          <Select
            value={filters.flagged}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                flagged: value as "all" | "flagged" | "unflagged",
              })
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Flagged" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Trees</SelectItem>
              <SelectItem value="flagged">Flagged Only</SelectItem>
              <SelectItem value="unflagged">Unflagged Only</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={onClearFilters}>
              <X className="mr-1 h-4 w-4" /> Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

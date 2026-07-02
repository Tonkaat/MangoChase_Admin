// src/components/scans/ScanFilters.tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { defaultScanFilters, ScanFiltersState } from "@/types/scan.types";
import { Search, X } from "lucide-react";

interface ScanFiltersProps {
  filters: ScanFiltersState;
  onChange: (filters: ScanFiltersState) => void;
  diseaseOptions: string[];
  clusterOptions: string[];
}

export function ScanFilters({
  filters,
  onChange,
  diseaseOptions,
  clusterOptions,
}: ScanFiltersProps) {
  const hasActiveFilter =
    filters.search !== defaultScanFilters.search ||
    filters.disease !== defaultScanFilters.disease ||
    filters.status !== defaultScanFilters.status ||
    filters.cluster !== defaultScanFilters.cluster;

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-soft md:flex-row md:items-center md:justify-between">
      <div className="relative w-full md:max-w-xs">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Search Tree ID or Barcode ID"
          className="pl-8"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={filters.disease}
          onValueChange={(value) => onChange({ ...filters, disease: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Disease type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All disease types</SelectItem>
            {diseaseOptions.map((disease) => (
              <SelectItem key={disease} value={disease}>
                {disease}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status}
          onValueChange={(value) =>
            onChange({ ...filters, status: value as ScanFiltersState["status"] })
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Infection status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="healthy">Healthy</SelectItem>
            <SelectItem value="infected">Infected</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.cluster}
          onValueChange={(value) => onChange({ ...filters, cluster: value })}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Cluster / Farm" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All clusters</SelectItem>
            {clusterOptions.map((cluster) => (
              <SelectItem key={cluster} value={cluster}>
                {cluster}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange(defaultScanFilters)}
            className="gap-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
}
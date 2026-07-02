import { useState } from "react";   
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Tree, HealthStatus } from "@/types/tree.types";
import { ImageIcon, Loader2, QrCode, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { scanService } from "@/services/firebase/scanService";
import { deriveInfectionStatus } from "@/types/scan.types";
import {
  TreeLatestScanModal,
  LatestScanInfo,
} from "@/components/trees/TreeLatestScanModal";

interface TreeInventoryTableProps {
  trees: Tree[];
  selectedTrees: string[];
  onSelectionChange: (ids: string[]) => void;
  farmId: string;
  pageSize?: number;
}

const healthStatusConfig: Record<HealthStatus, { label: string; className: string }> = {
  healthy: { label: "Healthy", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  infected: { label: "Infected", className: "bg-red-500/10 text-red-600 border-red-500/20" },
  unknown: { label: "Unknown", className: "bg-muted text-muted-foreground border-muted" },
  Healthy: { label: "Healthy", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  Infected: { label: "Infected", className: "bg-red-500/10 text-red-600 border-red-500/20" },
  Unknown: { label: "Unknown", className: "bg-muted text-muted-foreground border-muted" },
};

const growthStageLabels: Record<string, string> = {
  seedling: "Seedling",
  juvenile: "Juvenile",
  mature: "Mature",
  flowering: "Flowering",
  fruiting: "Fruiting",
};

export function TreeInventoryTable({
  trees,
  selectedTrees,
  onSelectionChange,
  farmId,
  pageSize = 6,
}: TreeInventoryTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // ── Latest-scan modal state ──
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [scanModalTreeName, setScanModalTreeName] = useState<string | null>(null);
  const [scanModalLoading, setScanModalLoading] = useState(false);
  const [scanModalError, setScanModalError] = useState<string | null>(null);
  const [scanModalData, setScanModalData] = useState<LatestScanInfo | null>(null);
  const [loadingTreeId, setLoadingTreeId] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(trees.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pagedTrees = trees.slice(startIndex, startIndex + pageSize);

  const allPageSelected =
    pagedTrees.length > 0 && pagedTrees.every((t) => selectedTrees.includes(t.id));
  const somePageSelected =
    pagedTrees.some((t) => selectedTrees.includes(t.id)) && !allPageSelected;

  const handleSelectAll = () => {
    const pageIds = pagedTrees.map((t) => t.id);
    if (allPageSelected) {
      onSelectionChange(selectedTrees.filter((id) => !pageIds.includes(id)));
    } else {
      const merged = Array.from(new Set([...selectedTrees, ...pageIds]));
      onSelectionChange(merged);
    }
  };

  const handleSelectTree = (treeId: string) => {
    if (selectedTrees.includes(treeId)) {
      onSelectionChange(selectedTrees.filter((id) => id !== treeId));
    } else {
      onSelectionChange([...selectedTrees, treeId]);
    }
  };

  const handleViewLatestScan = async (tree: Tree) => {
    setScanModalOpen(true);
    setScanModalTreeName(tree.tree_name || tree.id);
    setScanModalLoading(true);
    setScanModalError(null);
    setScanModalData(null);
    setLoadingTreeId(tree.id);

    try {
      const raw = await scanService.getLatestScanForTree(farmId, tree.id);

      if (!raw) {
        setScanModalData(null);
      } else {
        const detectedDisease = raw.detectedDisease || "Unknown";
        setScanModalData({
          imageUrl: raw.imageUrl,
          detectedDisease,
          infectionStatus: deriveInfectionStatus(detectedDisease),
          createdAt: raw.timestamp?.toDate?.() ?? new Date(0),
        });
      }
    } catch (err) {
      setScanModalError("Failed to load the latest scan. Please try again.");
    } finally {
      setScanModalLoading(false);
      setLoadingTreeId(null);
    }
  };

  if (trees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 rounded-full bg-muted p-4">
          <QrCode className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">No trees found</h3>
        <p className="text-sm text-muted-foreground">
          Add trees to your farm or adjust your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-lg border bg-card">
      {/* Table — fixed height for exactly pageSize rows */}
      <div className="overflow-x-auto">
        <Table className="min-w-[800px] lg:min-w-full">
          <TableHeader className="sticky top-0 bg-card z-10">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12 sticky left-0 bg-card z-20">
                <Checkbox
                  checked={allPageSelected}
                  ref={(el) => {
                    if (el) (el as any).indeterminate = somePageSelected;
                  }}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="min-w-[100px]">Tree ID</TableHead>
              <TableHead className="min-w-[120px]">Type / Variety</TableHead>
              <TableHead className="min-w-[110px]">Health Status</TableHead>
              <TableHead className="min-w-[100px]">Growth Stage</TableHead>
              <TableHead className="min-w-[120px]">Cluster</TableHead>
              <TableHead className="min-w-[130px]">Last Inspection</TableHead>
              <TableHead className="w-12 sticky right-0 bg-card z-20">Scan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedTrees.map((tree) => {
              const healthConfig = healthStatusConfig[tree.healthStatus] || healthStatusConfig.unknown;
              const isLoadingThisRow = loadingTreeId === tree.id;
              return (
                <TableRow
                  key={tree.id}
                  className="transition-colors hover:bg-muted/50"
                >
                  <TableCell className="sticky left-0 bg-card z-10">
                    <Checkbox
                      checked={selectedTrees.includes(tree.id)}
                      onCheckedChange={() => handleSelectTree(tree.id)}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    <span className="truncate max-w-[100px]">{tree.id.slice(0, 8)}</span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium truncate max-w-[120px]">{tree.type}</div>
                      {tree.variety && (
                        <div className="text-xs text-muted-foreground truncate max-w-[120px]">
                          {tree.variety}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("whitespace-nowrap", healthConfig.className)}>
                      {healthConfig.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <span className="truncate block max-w-[100px]">
                      {growthStageLabels[tree.growthStage] || tree.growthStage || "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {tree.cluster ? (
                      <Badge variant="secondary" className="max-w-[120px] truncate">
                        {tree.cluster}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {tree.lastInspectionDate
                      ? format(tree.lastInspectionDate, "MMM d, yyyy")
                      : "—"}
                  </TableCell>
                  <TableCell className="sticky right-0 bg-card z-10">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={isLoadingThisRow}
                      onClick={() => handleViewLatestScan(tree)}
                      aria-label="View latest scan"
                      title="View latest scan"
                    >
                      {isLoadingThisRow ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ImageIcon className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination footer */}
      <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground">
        <span>
          {startIndex + 1}–{Math.min(startIndex + pageSize, trees.length)} of {trees.length} tree{trees.length !== 1 ? "s" : ""}
          {selectedTrees.length > 0 && ` · ${selectedTrees.length} selected`}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={safePage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-2 tabular-nums">
            {safePage} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={safePage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <TreeLatestScanModal
        open={scanModalOpen}
        onClose={() => setScanModalOpen(false)}
        treeName={scanModalTreeName}
        isLoading={scanModalLoading}
        error={scanModalError}
        scan={scanModalData}
      />
    </div>
  );
}
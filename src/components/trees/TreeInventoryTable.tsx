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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tree, HealthStatus } from "@/types/tree.types";
import { MoreHorizontal, Eye, QrCode, Flag, Trash2, Edit, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface TreeInventoryTableProps {
  trees: Tree[];
  selectedTrees: string[];
  onSelectionChange: (ids: string[]) => void;
  onViewTree: (tree: Tree) => void;
  onGenerateQR: (tree: Tree) => void;
  onToggleFlag: (tree: Tree) => void;
  onDeleteTree: (tree: Tree) => void;
  onEditTree: (tree: Tree) => void;
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
  onViewTree,
  onGenerateQR,
  onToggleFlag,
  onDeleteTree,
  onEditTree,
  pageSize = 6,
}: TreeInventoryTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

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
              <TableHead className="w-12 sticky right-0 bg-card z-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedTrees.map((tree) => {
              const healthConfig = healthStatusConfig[tree.healthStatus] || healthStatusConfig.unknown;
              return (
                <TableRow
                  key={tree.id}
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                  onClick={() => onViewTree(tree)}
                >
                  <TableCell className="sticky left-0 bg-card z-10" onClick={(e) => e.stopPropagation()}>
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
                  <TableCell className="sticky right-0 bg-card z-10" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => onViewTree(tree)}>
                          <Eye className="mr-2 h-4 w-4" /> View details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditTree(tree)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onGenerateQR(tree)}>
                          <QrCode className="mr-2 h-4 w-4" /> Generate QR
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onToggleFlag(tree)}>
                          <Flag className="mr-2 h-4 w-4" />
                          {tree.flagged ? "Remove flag" : "Flag tree"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDeleteTree(tree)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
    </div>
  );
}
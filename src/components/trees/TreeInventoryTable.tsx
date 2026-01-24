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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tree, HealthStatus } from "@/types/tree.types";
import { MoreHorizontal, Eye, QrCode, Flag, Trash2, Edit } from "lucide-react";
import { format } from "date-fns";

interface TreeInventoryTableProps {
  trees: Tree[];
  selectedTrees: string[];
  onSelectionChange: (ids: string[]) => void;
  onViewTree: (tree: Tree) => void;
  onGenerateQR: (tree: Tree) => void;
  onToggleFlag: (tree: Tree) => void;
  onDeleteTree: (tree: Tree) => void;
  onEditTree: (tree: Tree) => void;
}

const healthStatusConfig: Record<HealthStatus, { label: string; className: string }> = {
  healthy: { label: "Healthy", className: "bg-brand-leaf/20 text-brand-leaf border-brand-leaf/30" },
  warning: { label: "Warning", className: "bg-brand-mango/20 text-brand-mango border-brand-mango/30" },
  critical: { label: "Critical", className: "bg-destructive/20 text-destructive border-destructive/30" },
  unknown: { label: "Unknown", className: "bg-muted text-muted-foreground border-muted" },
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
}: TreeInventoryTableProps) {
  const allSelected = trees.length > 0 && selectedTrees.length === trees.length;
  const someSelected = selectedTrees.length > 0 && selectedTrees.length < trees.length;

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(trees.map((t) => t.id));
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
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                ref={(el) => {
                  if (el) (el as any).indeterminate = someSelected;
                }}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead>Tree ID</TableHead>
            <TableHead>Type / Variety</TableHead>
            <TableHead>Health Status</TableHead>
            <TableHead>Growth Stage</TableHead>
            <TableHead>Cluster</TableHead>
            <TableHead>Last Inspection</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trees.map((tree) => {
            const healthConfig = healthStatusConfig[tree.healthStatus] || healthStatusConfig.unknown;
            return (
              <TableRow
                key={tree.id}
                className={`cursor-pointer ${tree.flagged ? "bg-destructive/5" : ""}`}
                onClick={() => onViewTree(tree)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedTrees.includes(tree.id)}
                    onCheckedChange={() => handleSelectTree(tree.id)}
                  />
                </TableCell>
                <TableCell className="font-mono text-sm">
                  <div className="flex items-center gap-2">
                    {tree.flagged && <Flag className="h-3 w-3 text-destructive fill-destructive" />}
                    {tree.id.slice(0, 8)}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{tree.type}</div>
                    {tree.variety && (
                      <div className="text-xs text-muted-foreground">{tree.variety}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={healthConfig.className}>
                    {healthConfig.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {growthStageLabels[tree.growthStage] || tree.growthStage}
                </TableCell>
                <TableCell>
                  {tree.cluster ? (
                    <Badge variant="secondary">{tree.cluster}</Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {tree.lastInspectionDate
                    ? format(tree.lastInspectionDate, "MMM d, yyyy")
                    : "—"}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
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
  );
}

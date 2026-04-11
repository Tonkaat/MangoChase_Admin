// src/components/trees/BulkOperationsPanel.tsx
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { X, Flag, FlagOff, Trash2, QrCode, FolderInput, Check } from "lucide-react";
import { useState } from "react";

interface BulkOperationsPanelProps {
  selectedCount: number;
  clusters: string[];
  onClearSelection: () => void;
  onBulkFlag: (flag: boolean) => void;
  onBulkChangeCluster: (cluster: string) => void;
  onBulkDelete: () => void;
  onBulkGenerateQR: () => void;
}

export function BulkOperationsPanel({
  selectedCount,
  clusters,
  onClearSelection,
  onBulkFlag,
  onBulkChangeCluster,
  onBulkDelete,
  onBulkGenerateQR,
}: BulkOperationsPanelProps) {
  const [targetCluster, setTargetCluster] = useState<string>("");

  if (selectedCount === 0) return null;

  return (
    <TooltipProvider>
      <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
        <div
          className="flex items-center gap-2 rounded-xl border bg-card/95 px-3 py-2 shadow-lg backdrop-blur-sm"
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)" }}
        >
          {/* Count */}
          <div className="flex items-center gap-1.5 pr-1">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
              {selectedCount}
            </div>
            <span className="text-sm font-medium text-foreground">
              {selectedCount === 1 ? "tree" : "trees"} selected
            </span>
          </div>

          <div className="h-5 w-px bg-border" />

          {/* Flag actions */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 px-2.5 text-xs"
                  onClick={() => onBulkFlag(true)}
                >
                  <Flag className="h-3.5 w-3.5 text-amber-500" />
                  Flag
                </Button>
              </TooltipTrigger>
              <TooltipContent>Flag selected trees for attention</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 px-2.5 text-xs"
                  onClick={() => onBulkFlag(false)}
                >
                  <FlagOff className="h-3.5 w-3.5 text-muted-foreground" />
                  Unflag
                </Button>
              </TooltipTrigger>
              <TooltipContent>Remove flags from selected trees</TooltipContent>
            </Tooltip>
          </div>

          <div className="h-5 w-px bg-border" />

          {/* Move to cluster */}
          <div className="flex items-center gap-1.5">
            <Select value={targetCluster} onValueChange={setTargetCluster}>
              <SelectTrigger className="h-8 w-[130px] border-dashed text-xs">
                <FolderInput className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Move to…" />
              </SelectTrigger>
              <SelectContent>
                {clusters.map((cluster) => (
                  <SelectItem key={cluster} value={cluster} className="text-xs">
                    {cluster}
                  </SelectItem>
                ))}
                <SelectItem value="__new__" className="text-xs text-primary">
                  + New cluster
                </SelectItem>
              </SelectContent>
            </Select>
            {targetCluster && (
              <Button
                size="sm"
                className="h-8 px-2.5 text-xs"
                onClick={() => {
                  onBulkChangeCluster(targetCluster);
                  setTargetCluster("");
                }}
              >
                <Check className="mr-1 h-3 w-3" />
                Apply
              </Button>
            )}
          </div>

          <div className="h-5 w-px bg-border" />

          {/* QR + Delete */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 px-2.5 text-xs"
                  onClick={onBulkGenerateQR}
                >
                  <QrCode className="h-3.5 w-3.5" />
                  QR
                </Button>
              </TooltipTrigger>
              <TooltipContent>Generate QR codes for selected trees</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 px-2.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={onBulkDelete}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete selected trees</TooltipContent>
            </Tooltip>
          </div>

          <div className="h-5 w-px bg-border" />

          {/* Dismiss */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onClearSelection}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clear selection</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
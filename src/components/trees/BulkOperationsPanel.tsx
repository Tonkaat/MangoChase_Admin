import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Flag, FlagOff, Trash2, QrCode, FolderInput } from "lucide-react";
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
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 transform">
      <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-lg">
        <Badge variant="secondary" className="text-sm">
          {selectedCount} selected
        </Badge>

        <div className="h-6 w-px bg-border" />

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onBulkFlag(true)}>
            <Flag className="mr-1 h-4 w-4" /> Flag
          </Button>
          <Button variant="outline" size="sm" onClick={() => onBulkFlag(false)}>
            <FlagOff className="mr-1 h-4 w-4" /> Unflag
          </Button>
        </div>

        <div className="h-6 w-px bg-border" />

        <div className="flex items-center gap-2">
          <Select value={targetCluster} onValueChange={setTargetCluster}>
            <SelectTrigger className="h-8 w-[130px]">
              <FolderInput className="mr-1 h-4 w-4" />
              <SelectValue placeholder="Move to..." />
            </SelectTrigger>
            <SelectContent>
              {clusters.map((cluster) => (
                <SelectItem key={cluster} value={cluster}>
                  {cluster}
                </SelectItem>
              ))}
              <SelectItem value="__new__">+ New cluster</SelectItem>
            </SelectContent>
          </Select>
          {targetCluster && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                onBulkChangeCluster(targetCluster);
                setTargetCluster("");
              }}
            >
              Apply
            </Button>
          )}
        </div>

        <div className="h-6 w-px bg-border" />

        <Button variant="outline" size="sm" onClick={onBulkGenerateQR}>
          <QrCode className="mr-1 h-4 w-4" /> QR Codes
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={onBulkDelete}
        >
          <Trash2 className="mr-1 h-4 w-4" /> Delete
        </Button>

        <div className="h-6 w-px bg-border" />

        <Button variant="ghost" size="icon" onClick={onClearSelection}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

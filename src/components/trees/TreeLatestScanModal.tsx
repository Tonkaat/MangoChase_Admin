// src/components/trees/TreeLatestScanModal.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, ImageOff, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LatestScanInfo {
  imageUrl: string;
  detectedDisease: string;
  infectionStatus: "healthy" | "infected";
  createdAt: Date;
}

interface TreeLatestScanModalProps {
  open: boolean;
  onClose: () => void;
  treeName: string | null;
  isLoading: boolean;
  error: string | null;
  scan: LatestScanInfo | null;
}

const statusStyles: Record<"healthy" | "infected", string> = {
  healthy: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  infected: "bg-red-500/10 text-red-600 border-red-500/20",
};

export function TreeLatestScanModal({
  open,
  onClose,
  treeName,
  isLoading,
  error,
  scan,
}: TreeLatestScanModalProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-lg overflow-hidden p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-base">
            Latest scan{treeName ? ` · ${treeName}` : ""}
          </DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading latest scan…</p>
          </div>
        )}

        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <ImageOff className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">{error}</p>
          </div>
        )}

        {!isLoading && !error && !scan && (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <ImageOff className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              No scans recorded for this tree yet.
            </p>
            <p className="text-xs text-muted-foreground">
              Scan a leaf on this tree to see results here.
            </p>
          </div>
        )}

        {!isLoading && !error && scan && (
          <div className="space-y-4 pb-6">
            <div className="bg-muted">
              <img
                src={scan.imageUrl}
                alt={`Latest leaf scan for ${treeName ?? "tree"}`}
                loading="lazy"
                className="max-h-[360px] w-full object-contain"
              />
            </div>

            <div className="flex items-center justify-between gap-3 px-6">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {scan.detectedDisease}
                </p>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {scan.createdAt.toLocaleString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>

              <Badge
                variant="outline"
                className={cn("whitespace-nowrap", statusStyles[scan.infectionStatus])}
              >
                {scan.infectionStatus === "healthy" ? "Healthy" : "Infected"}
              </Badge>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
// src/components/scans/ScanDetailsModal.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScanStatusBadge } from "./ScanStatusBadge";
import { ScanRecord } from "@/types/scan.types";
import { QrCode, MapPin, Gauge, CalendarDays, ScanLine } from "lucide-react";

interface ScanDetailsModalProps {
  scan: ScanRecord | null;
  onClose: () => void;
}

export function ScanDetailsModal({ scan, onClose }: ScanDetailsModalProps) {
  if (!scan) return null;

  const confidencePct = Math.round(scan.confidence * 100);
  const scannedAt = scan.createdAt.toLocaleString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Dialog open={!!scan} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl overflow-hidden p-0">
        <div className="bg-muted">
          <img
            src={scan.imageUrl}
            alt={`Full leaf scan for ${scan.treeName}`}
            loading="lazy"
            className="max-h-[420px] w-full object-contain"
          />
        </div>

        <div className="space-y-4 p-6">
          <DialogHeader className="space-y-1">
            <div className="flex items-center justify-between gap-3">
              <DialogTitle className="text-lg">{scan.detectedDisease}</DialogTitle>
              <ScanStatusBadge status={scan.infectionStatus} />
            </div>
          </DialogHeader>

          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <QrCode className="h-4 w-4 text-muted-foreground" />
              <div>
                <dt className="text-xs text-muted-foreground">Tree</dt>
                <dd className="font-medium text-foreground">{scan.treeName}</dd>
              </div>
            </div>

            {scan.treeBarcodeId && (
              <div className="flex items-center gap-2">
                <ScanLine className="h-4 w-4 text-muted-foreground" />
                <div>
                  <dt className="text-xs text-muted-foreground">Barcode / Tree ID</dt>
                  <dd className="font-medium text-foreground">
                    {scan.treeBarcodeId}
                  </dd>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <dt className="text-xs text-muted-foreground">Cluster / Farm</dt>
                <dd className="font-medium text-foreground">
                  {scan.clusterName}
                </dd>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-muted-foreground" />
              <div>
                <dt className="text-xs text-muted-foreground">Confidence</dt>
                <dd className="font-medium text-foreground">
                  {confidencePct}%
                </dd>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <div>
                <dt className="text-xs text-muted-foreground">Date scanned</dt>
                <dd className="font-medium text-foreground">{scannedAt}</dd>
              </div>
            </div>
          </dl>

          <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
            Scan ID: {scan.id}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
// src/components/scans/ScanCard.tsx
import { Card, CardContent } from "@/components/ui/card";
import { ScanStatusBadge } from "./ScanStatusBadge";
import { ScanRecord } from "../../types/scan.types";
import { QrCode, CalendarDays, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScanCardProps {
  scan: ScanRecord;
  onClick: (scan: ScanRecord) => void;
}

export function ScanCard({ scan, onClick }: ScanCardProps) {
  const confidencePct = Math.round(scan.confidence * 100);
  const scannedAt = scan.createdAt.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onClick(scan)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick(scan);
      }}
      className="group cursor-pointer overflow-hidden rounded-xl border shadow-soft transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        <img
          src={scan.imageUrl}
          alt={`Leaf scan for ${scan.treeName}`}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
        />
        <div className="absolute left-2 top-2">
          <ScanStatusBadge status={scan.infectionStatus} />
        </div>
        {scan.verificationStatus !== "not_required" && (
          <span
            className={cn(
              "absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold",
              scan.verificationStatus === "pending"
                ? "bg-amber-100 text-amber-800"
                : "bg-emerald-100 text-emerald-800"
            )}
          >
            {scan.verificationStatus === "pending" ? "Needs verification" : "Verified by admin"}
          </span>
        )}
      </div>

      <CardContent className="space-y-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <QrCode className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{scan.treeName}</span>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">
            {scan.clusterName}
          </span>
        </div>

        <p className="truncate text-sm font-medium text-foreground">
          {scan.detectedDisease}
        </p>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Gauge className="h-3.5 w-3.5" />
            <span
              className={cn(
                "font-medium",
                confidencePct >= 80
                  ? "text-emerald-600"
                  : confidencePct >= 50
                  ? "text-amber-600"
                  : "text-red-600"
              )}
            >
              {confidencePct}% confidence
            </span>
          </span>
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            {scannedAt}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
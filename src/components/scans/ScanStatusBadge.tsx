// src/components/scans/ScanStatusBadge.tsx
import { cn } from "@/lib/utils";
import { InfectionStatus } from "@/types/scan.types";
import { CheckCircle2, AlertTriangle } from "lucide-react";

const STATUS_CONFIG: Record<
  InfectionStatus,
  { label: string; className: string; Icon: typeof CheckCircle2 }
> = {
  healthy: {
    label: "Healthy",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Icon: CheckCircle2,
  },
  infected: {
    label: "Infected",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    Icon: AlertTriangle,
  },
};

interface ScanStatusBadgeProps {
  status: InfectionStatus;
  className?: string;
}

export function ScanStatusBadge({ status, className }: ScanStatusBadgeProps) {
  const { label, className: statusClass, Icon } = STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
        statusClass,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
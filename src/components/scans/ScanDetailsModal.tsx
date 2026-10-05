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
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { scanService } from "@/services/firebase/scanService";
import { ExpertContactsDialog, EXPERT_CONTACTS } from "./ExpertContactsDialog";
import { BadgeCheck, AlertTriangle } from "lucide-react";

interface ScanDetailsModalProps {
  scan: ScanRecord | null;
  farmId: string;
  onClose: () => void;
}

export function ScanDetailsModal({ scan, farmId, onClose }: ScanDetailsModalProps) {
  
  if (!scan) return null;

  const [contactsOpen, setContactsOpen] = useState(false);
  const [contacted, setContacted] = useState(false);
  const [expertName, setExpertName] = useState(EXPERT_CONTACTS[0]?.name ?? "");
  const [saving, setSaving] = useState(false);
  const confidencePct = Math.round(scan.confidence * 100);

  const handleVerify = async () => {
    try {
      setSaving(true);
      await scanService.verifyScan(farmId, scan.id, { expertContacted: expertName });
      toast.success("Scan marked as verified");
      setContacted(false);
    } catch {
      toast.error("Failed to verify scan");
    } finally {
      setSaving(false);
    }
  };

  const scannedAt = scan.createdAt.toLocaleString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Dialog open={!!scan} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col gap-0 overflow-hidden p-0">
        <div className="shrink-0 bg-muted">
          <img
            src={scan.imageUrl}
            alt={`Full leaf scan for ${scan.treeName}`}
            loading="lazy"
            className="max-h-[240px] w-full object-contain sm:max-h-[280px]"
          />
        </div>

        <div className="space-y-4 overflow-y-auto p-5">
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
          

  {scan.verificationStatus === "pending" && (
    <div className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-3">
      <div className="flex items-center gap-2 text-sm font-medium text-amber-800">
        <AlertTriangle className="h-4 w-4" />
        Low confidence, expert verification needed
      </div>

      <Button variant="outline" size="sm" onClick={() => setContactsOpen(true)}>
        View expert contacts
      </Button>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={contacted} onChange={(e) => setContacted(e.target.checked)} />
        I have contacted an expert
      </label>

      <Button size="sm" disabled={!contacted || saving} onClick={handleVerify} className="gap-1">
        <BadgeCheck className="h-4 w-4" />
        {saving ? "Saving..." : "Mark as Verified"}
      </Button>
    </div>
  )}

  {scan.verificationStatus === "verified" && (
    <div className="flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800">
      <BadgeCheck className="h-4 w-4 shrink-0" />
      <span>
        Verified by admin
        {scan.verifiedAt ? ` on ${scan.verifiedAt.toLocaleDateString()}` : ""}
        {scan.expertContacted ? ` · Expert: ${scan.expertContacted}` : ""}
      </span>
    </div>
  )}

  <ExpertContactsDialog open={contactsOpen} onClose={() => setContactsOpen(false)} />

          <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
            Scan ID: {scan.id}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
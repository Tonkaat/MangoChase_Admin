import { useState } from "react";
import { toast } from "sonner";
import { FlaskConical, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { scanService } from "@/services/firebase/scanService";

const TEST_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
      <rect width="100%" height="100%" fill="#d1fae5"/>
      <text x="50%" y="50%" font-size="28" text-anchor="middle" fill="#065f46">TEST SCAN</text>
    </svg>`
  );

const PRESETS = [
  { label: "Anthracnose 65% (needs verification)", disease: "Anthracnose", confidence: 0.65 },
  { label: "Anthracnose 85% (needs verification)", disease: "Anthracnose", confidence: 0.85 },
  { label: "Anthracnose 95% (should NOT flag)", disease: "Anthracnose", confidence: 0.95 },
  { label: "Healthy 60% (should NOT flag)", disease: "Healthy", confidence: 0.6 },
];

export function DebugScanCard({ farmId }: { farmId: string }) {
  const [busy, setBusy] = useState(false);

  const createTestScan = async (disease: string, confidence: number) => {
    try {
      setBusy(true);
      await scanService.addScan({
        farmId,
        imageUrl: TEST_IMAGE,
        detectedDisease: disease,
        confidence,
        additionalData: { isTest: true },
      });
      toast.success(`Test scan created: ${disease} ${Math.round(confidence * 100)}%`);
    } catch {
      toast.error("Failed to create test scan");
    } finally {
      setBusy(false);
    }
  };

  const clearTestScans = async () => {
    try {
      setBusy(true);
      const count = await scanService.deleteTestScans(farmId);
      toast.success(`Deleted ${count} test scan${count !== 1 ? "s" : ""}`);
    } catch {
      toast.error("Failed to delete test scans");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="border-dashed border-amber-400 bg-amber-50/50">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
          <FlaskConical className="h-4 w-4" />
          Debug: verification tester (dev only)
        </div>

        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <Button
              key={p.label}
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => createTestScan(p.disease, p.confidence)}
              className="gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              {p.label}
            </Button>
          ))}

          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={clearTestScans}
            className="gap-1 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete all test scans
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
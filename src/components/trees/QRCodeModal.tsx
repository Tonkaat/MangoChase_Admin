// src/components/trees/QRCodeModal.tsx
import { useState, useMemo, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tree } from "@/types/tree.types";
import { QRCodeSVG } from "qrcode.react";
import {
  Download,
  Printer,
  Copy,
  Check,
  Search,
  FolderTree,
  TreeDeciduous,
  ArrowLeft,
  ListChecks,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface QRCodeModalProps {
  trees: Tree[];
  allTrees?: Tree[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectUrl?: string;
}

type QRSize = "sm" | "md" | "lg";
type Step = "select" | "export";

const QR_SIZES: Record<QRSize, { px: number; label: string }> = {
  sm: { px: 80, label: "Small" },
  md: { px: 120, label: "Medium" },
  lg: { px: 160, label: "Large" },
};

const PRINT_LAYOUTS: { value: string; label: string; cols: number }[] = [
  { value: "2x4", label: "2×4 (8/page)", cols: 2 },
  { value: "3x3", label: "3×3 (9/page)", cols: 3 },
  { value: "4x4", label: "4×4 (16/page)", cols: 4 },
];

export function QRCodeModal({
  trees: initialTrees,
  allTrees,
  open,
  onOpenChange,
}: QRCodeModalProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [qrSize, setQrSize] = useState<QRSize>("md");
  const [printLayout, setPrintLayout] = useState("3x3");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(initialTrees.map((t) => t.id))
  );

  // Only show the "choose which trees" step when there's actually a bigger
  // pool to choose from. If we were handed exactly the trees to use, skip
  // straight to export.
  const hasSelectionStep = !!allTrees && allTrees.length > 0;
  const [step, setStep] = useState<Step>(hasSelectionStep ? "select" : "export");

  // `allTrees` is often still empty/undefined on first paint right after a
  // page refresh (it loads in async a beat later), so the useState
  // initializer above can lock in "export" before that data ever arrives —
  // that's the "lands on empty preview" bug. Re-derive the step:
  //   1. every time the dialog transitions from closed -> open, and
  //   2. if allTrees goes from empty to populated while already open.
  const wasOpen = useRef(false);
  const hadSelectionStep = useRef(hasSelectionStep);

  useEffect(() => {
    const justOpened = open && !wasOpen.current;
    const selectionStepJustBecameAvailable = open && hasSelectionStep && !hadSelectionStep.current;

    if (justOpened || selectionStepJustBecameAvailable) {
      setStep(hasSelectionStep ? "select" : "export");
      // initialTrees can also still be empty on the very first paint after
      // a refresh — re-sync the default selection alongside the step so we
      // don't open into a step with nothing selected either.
      setSelectedIds(new Set(initialTrees.map((t) => t.id)));
    }

    wasOpen.current = open;
    hadSelectionStep.current = hasSelectionStep;
  }, [open, hasSelectionStep, initialTrees]);

  const treesToUse = allTrees ?? initialTrees;

  const filteredTrees = useMemo(() => {
    if (!search.trim()) return treesToUse;
    const s = search.toLowerCase();
    return treesToUse.filter(
      (t) =>
        t.id.toLowerCase().includes(s) ||
        t.type?.toLowerCase().includes(s) ||
        t.variety?.toLowerCase().includes(s) ||
        t.cluster?.toLowerCase().includes(s) ||
        t.tree_name?.toLowerCase().includes(s)
    );
  }, [treesToUse, search]);

  const groupedByCluster = useMemo(() => {
    const groups: Record<string, Tree[]> = {};
    filteredTrees.forEach((tree) => {
      const key = tree.cluster || "Ungrouped";
      if (!groups[key]) groups[key] = [];
      groups[key].push(tree);
    });
    return groups;
  }, [filteredTrees]);

  const selectedTrees = treesToUse.filter((t) => selectedIds.has(t.id));

  const handleCopy = async (tree: Tree) => {
    await navigator.clipboard.writeText(tree.id);
    setCopied(tree.id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownloadSingle = (tree: Tree) => {
    const svg = document.getElementById(`qr-modal-${tree.id}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const size = QR_SIZES[qrSize].px * 2;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      ctx!.fillStyle = "#ffffff";
      ctx!.fillRect(0, 0, size, size);
      ctx!.drawImage(img, 0, 0, size, size);
      const pngFile = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.download = `${tree.tree_name || tree.id.slice(0, 8)}-qr.png`;
      a.href = pngFile;
      a.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const handleDownloadAll = () => {
    selectedTrees.forEach((tree, i) => {
      setTimeout(() => handleDownloadSingle(tree), i * 150);
    });
  };

  const handlePrint = () => {
    const layout = PRINT_LAYOUTS.find((l) => l.value === printLayout) ?? PRINT_LAYOUTS[1];
    const qrPx = QR_SIZES[qrSize].px;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // Each item gets an empty container div — qrcodejs renders INTO this
    // element itself (it doesn't accept a pre-made canvas as a target).
    const qrItems = selectedTrees
      .map(
        (tree) => `
        <div class="qr-item">
          <div class="qr-wrapper">
            <div class="qr-target" id="pqr-${tree.id}"></div>
          </div>
          <div class="tree-name">${tree.tree_name || tree.id.slice(0, 8)}</div>
          <div class="tree-sub">${tree.type || ""}${tree.variety ? ` · ${tree.variety}` : ""}${tree.cluster ? ` · ${tree.cluster}` : ""}</div>
        </div>`
      )
      .join("");

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>QR Codes — ${selectedTrees.length} trees</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; padding: 16px; background: #fff; }
    .grid { display: grid; grid-template-columns: repeat(${layout.cols}, 1fr); gap: 12px; }
    .qr-item { border: 1px solid #ddd; border-radius: 8px; padding: 12px; text-align: center; page-break-inside: avoid; }
    .qr-wrapper { background: #fff; display: inline-block; padding: 4px; border-radius: 4px; }
    .qr-target { width: ${qrPx}px; height: ${qrPx}px; }
    .qr-target img, .qr-target canvas { display: block; width: ${qrPx}px; height: ${qrPx}px; }
    .tree-name { font-family: monospace; font-size: 11px; margin-top: 6px; font-weight: 600; color: #111; }
    .tree-sub { font-size: 10px; color: #666; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    @media print { body { padding: 8px; } @page { margin: 10mm; } }
  </style>
</head>
<body>
  <div class="grid">${qrItems}</div>
  <script>
    const trees = ${JSON.stringify(selectedTrees.map((t) => ({ id: t.id })))};
    function renderAll() {
      trees.forEach(({ id }) => {
        const el = document.getElementById('pqr-' + id);
        if (!el) return;
        // qrcodejs renders directly into this div — do not replace it
        // or hand it a separate canvas, that's what broke this before.
        new QRCode(el, {
          text: id,
          width: ${qrPx},
          height: ${qrPx},
          correctLevel: QRCode.CorrectLevel.H,
        });
      });
      setTimeout(() => window.print(), 400);
    }
    if (typeof QRCode === 'undefined') {
      // CDN script can occasionally lag behind page paint; retry briefly
      // instead of silently rendering nothing.
      let attempts = 0;
      const wait = setInterval(() => {
        attempts++;
        if (typeof QRCode !== 'undefined') {
          clearInterval(wait);
          renderAll();
        } else if (attempts > 20) {
          clearInterval(wait);
          document.body.insertAdjacentHTML('afterbegin', '<p style="color:#b00;font-family:system-ui">QR library failed to load — check your connection and try printing again.</p>');
        }
      }, 100);
    } else {
      renderAll();
    }
  </script>
</body>
</html>`);
    printWindow.document.close();
  };

  const toggleTree = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCluster = (cluster: string) => {
    const clusterIds = groupedByCluster[cluster].map((t) => t.id);
    const allSelected = clusterIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      clusterIds.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(treesToUse.map((t) => t.id)));
  const clearAll = () => setSelectedIds(new Set());

  const totalCount = treesToUse.length;
  const selectedCount = selectedTrees.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-3xl">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            {step === "select" ? (
              <>
                <ListChecks className="h-4 w-4" />
                Choose trees for QR codes
              </>
            ) : (
              <>
                <TreeDeciduous className="h-4 w-4" />
                QR codes
              </>
            )}
            <Badge variant="secondary">
              {selectedCount} of {totalCount} selected
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {step === "select"
              ? "Pick the trees you want codes for, then continue to preview and print."
              : "Preview each code, download individually, or print a sheet for the field."}
          </DialogDescription>
        </DialogHeader>

        {/* ---------------- STEP 1: SELECT ---------------- */}
        {step === "select" && (
          <div className="flex flex-1 flex-col min-h-0 gap-3 pt-1">
            <div className="flex shrink-0 gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search by name, type, variety, or cluster…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 pl-8 text-sm"
                />
              </div>
              <Button variant="outline" size="sm" className="h-9 text-xs" onClick={selectAll}>
                Select all
              </Button>
              <Button variant="outline" size="sm" className="h-9 text-xs" onClick={clearAll}>
                Clear
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 space-y-3 pr-1">
              {Object.keys(groupedByCluster).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <Search className="mb-3 h-8 w-8 opacity-30" />
                  <p className="text-sm">No trees match "{search}".</p>
                </div>
              ) : (
                Object.entries(groupedByCluster).map(([cluster, clusterTrees]) => {
                  const clusterIds = clusterTrees.map((t) => t.id);
                  const allSel = clusterIds.every((id) => selectedIds.has(id));
                  const someSel = clusterIds.some((id) => selectedIds.has(id));
                  const checkboxState: boolean | "indeterminate" = allSel
                    ? true
                    : someSel
                    ? "indeterminate"
                    : false;

                  return (
                    <div key={cluster} className="rounded-lg border overflow-hidden">
                      <div
                        className="flex cursor-pointer items-center gap-2 bg-muted/50 px-3 py-2"
                        onClick={() => toggleCluster(cluster)}
                      >
                        <Checkbox
                          checked={checkboxState}
                          onCheckedChange={() => toggleCluster(cluster)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <FolderTree className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="flex-1 text-sm font-medium">{cluster}</span>
                        <Badge variant="outline" className="text-xs">
                          {clusterIds.filter((id) => selectedIds.has(id)).length} / {clusterTrees.length}
                        </Badge>
                      </div>

                      <div className="divide-y">
                        {clusterTrees.map((tree) => (
                          <label
                            key={tree.id}
                            className="flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-muted/30"
                          >
                            <Checkbox
                              checked={selectedIds.has(tree.id)}
                              onCheckedChange={() => toggleTree(tree.id)}
                            />
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-mono font-medium">
                                {tree.tree_name || tree.id.slice(0, 8)}
                              </span>
                              <span className="ml-2 text-xs text-muted-foreground">
                                {tree.type}
                                {tree.variety ? ` · ${tree.variety}` : ""}
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <DialogFooter className="shrink-0 pt-2">
              <Button
                onClick={() => setStep("export")}
                disabled={selectedCount === 0}
              >
                Continue with {selectedCount} {selectedCount === 1 ? "tree" : "trees"}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* ---------------- STEP 2: EXPORT / PREVIEW ---------------- */}
        {step === "export" && (
          <div className="flex flex-1 flex-col min-h-0 gap-3 pt-1">
            {/* Toolbar: everything that affects how the export looks lives together */}
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2">
              <div className="flex items-center gap-3">
                {hasSelectionStep && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                    onClick={() => setStep("select")}
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Edit selection
                  </Button>
                )}
                <Separator orientation="vertical" className="h-5" />
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Code size</span>
                  <div className="flex gap-1">
                    {(["sm", "md", "lg"] as QRSize[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => setQrSize(s)}
                        className={`rounded px-2 py-0.5 text-xs transition-all ${
                          qrSize === s
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted-foreground/20"
                        }`}
                      >
                        {QR_SIZES[s].label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Print layout</span>
                <Select value={printLayout} onValueChange={setPrintLayout}>
                  <SelectTrigger className="h-8 w-[130px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRINT_LAYOUTS.map((l) => (
                      <SelectItem key={l.value} value={l.value} className="text-xs">
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Preview grid */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {selectedTrees.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <TreeDeciduous className="mb-3 h-8 w-8 opacity-30" />
                  <p className="text-sm">No trees selected yet.</p>
                  {hasSelectionStep && (
                    <Button variant="ghost" size="sm" className="mt-2" onClick={() => setStep("select")}>
                      Choose trees
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {selectedTrees.map((tree) => {
                    const sz = QR_SIZES[qrSize].px;
                    return (
                      <div
                        key={tree.id}
                        className="flex flex-col items-center rounded-lg border bg-card p-3 transition-all hover:border-primary/40"
                      >
                        <div className="mb-2 rounded-lg bg-white p-2">
                          <QRCodeSVG
                            id={`qr-modal-${tree.id}`}
                            value={tree.id}
                            size={sz}
                            level="H"
                            includeMargin={false}
                          />
                        </div>
                        <div className="mb-0.5 font-mono text-[11px] font-semibold text-foreground">
                          {tree.tree_name || tree.id.slice(0, 8)}
                        </div>
                        <div className="mb-2 text-center text-[10px] text-muted-foreground leading-tight">
                          {tree.type}
                          {tree.variety ? ` · ${tree.variety}` : ""}
                          {tree.cluster && (
                            <span className="block text-primary/70">{tree.cluster}</span>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleDownloadSingle(tree)}
                            title="Download PNG"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleCopy(tree)}
                            title="Copy ID"
                          >
                            {copied === tree.id ? (
                              <Check className="h-3 w-3 text-emerald-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <DialogFooter className="shrink-0 gap-2 pt-2 sm:justify-end">
              <Button
                variant="outline"
                onClick={handleDownloadAll}
                disabled={selectedTrees.length === 0}
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Download all
              </Button>
              <Button onClick={handlePrint} disabled={selectedTrees.length === 0}>
                <Printer className="mr-1.5 h-3.5 w-3.5" />
                Print {selectedTrees.length > 0 ? `(${selectedTrees.length})` : ""}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
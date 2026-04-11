// src/components/trees/QRCodeModal.tsx
import { useRef, useState, useMemo } from "react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  CheckSquare,
  Square,
  Layers,
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
  projectUrl = window.location.origin,
}: QRCodeModalProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [qrSize, setQrSize] = useState<QRSize>("md");
  const [printLayout, setPrintLayout] = useState("3x3");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(initialTrees.map((t) => t.id))
  );
  const [tab, setTab] = useState<"preview" | "select">(
    allTrees && allTrees.length > initialTrees.length ? "select" : "preview"
  );

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

  // Group by cluster for selection view
  const groupedByCluster = useMemo(() => {
    const groups: Record<string, Tree[]> = {};
    filteredTrees.forEach((tree) => {
      const key = tree.cluster || "Default";
      if (!groups[key]) groups[key] = [];
      groups[key].push(tree);
    });
    return groups;
  }, [filteredTrees]);

  const selectedTrees = treesToUse.filter((t) => selectedIds.has(t.id));

  const handleCopy = async (tree: Tree) => {
    const qrValue = `${projectUrl}/trees/${tree.farmId}/${tree.id}`;
    await navigator.clipboard.writeText(qrValue);
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

    const qrItems = selectedTrees
      .map(
        (tree) => `
        <div class="qr-item">
          <div class="qr-wrapper">
            <svg id="pqr-${tree.id}" width="${qrPx}" height="${qrPx}"></svg>
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
    .tree-name { font-family: monospace; font-size: 11px; margin-top: 6px; font-weight: 600; color: #111; }
    .tree-sub { font-size: 10px; color: #666; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    @media print { body { padding: 8px; } @page { margin: 10mm; } }
  </style>
</head>
<body>
  <div class="grid">${qrItems}</div>
  <script>
    const trees = ${JSON.stringify(
      selectedTrees.map((t) => ({
        id: t.id,
        url: `${projectUrl}/trees/${t.farmId}/${t.id}`,
      }))
    )};
    trees.forEach(({ id, url }) => {
      const el = document.getElementById('pqr-' + id);
      if (!el) return;
      const canvas = document.createElement('canvas');
      el.replaceWith(canvas);
      new QRCode(canvas, { text: url, width: ${qrPx}, height: ${qrPx}, correctLevel: QRCode.CorrectLevel.H });
    });
    setTimeout(() => window.print(), 800);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-3xl">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            QR Code Generator
            <Badge variant="secondary">{selectedTrees.length} selected</Badge>
          </DialogTitle>
          <DialogDescription>
            Generate, download, or print QR codes for quick tree identification.
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as "preview" | "select")}
          className="flex flex-1 flex-col min-h-0"
        >
          <div className="flex shrink-0 items-center justify-between gap-3">
            <TabsList>
              <TabsTrigger value="preview" className="gap-1.5">
                <TreeDeciduous className="h-3.5 w-3.5" />
                Preview
              </TabsTrigger>
              {allTrees && (
                <TabsTrigger value="select" className="gap-1.5">
                  <Layers className="h-3.5 w-3.5" />
                  Select Trees
                </TabsTrigger>
              )}
            </TabsList>

            {/* QR size picker */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Size:</span>
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

          {/* Preview tab */}
          <TabsContent value="preview" className="mt-3 flex-1 overflow-y-auto min-h-0">
            {selectedTrees.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <TreeDeciduous className="mb-3 h-8 w-8 opacity-30" />
                <p className="text-sm">No trees selected.</p>
                {allTrees && (
                  <Button variant="ghost" size="sm" className="mt-2" onClick={() => setTab("select")}>
                    Select trees
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {selectedTrees.map((tree) => {
                  const qrValue = `${projectUrl}/trees/${tree.farmId}/${tree.id}`;
                  const sz = QR_SIZES[qrSize].px;
                  return (
                    <div
                      key={tree.id}
                      className="flex flex-col items-center rounded-lg border bg-card p-3 transition-all hover:border-primary/40"
                    >
                      <div className="mb-2 rounded-lg bg-white p-2">
                        <QRCodeSVG
                          id={`qr-modal-${tree.id}`}
                          value={qrValue}
                          size={sz}
                          level="H"
                          includeMargin={false}
                        />
                      </div>
                      <div className="mb-0.5 font-mono text-[11px] font-semibold text-foreground">
                        {tree.tree_name || tree.id.slice(0, 8)}
                      </div>
                      <div className="mb-2 text-center text-[10px] text-muted-foreground leading-tight">
                        {tree.type}{tree.variety ? ` · ${tree.variety}` : ""}
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
                          title="Copy URL"
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
          </TabsContent>

          {/* Selection tab */}
          {allTrees && (
            <TabsContent value="select" className="mt-3 flex-1 overflow-y-auto min-h-0 space-y-3">
              {/* Search + bulk actions */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Search trees…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-8 pl-8 text-sm"
                  />
                </div>
                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={selectAll}>
                  All
                </Button>
                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={clearAll}>
                  None
                </Button>
              </div>

              {/* Cluster groups */}
              <div className="space-y-3">
                {Object.entries(groupedByCluster).map(([cluster, clusterTrees]) => {
                  const clusterIds = clusterTrees.map((t) => t.id);
                  const allSel = clusterIds.every((id) => selectedIds.has(id));
                  const someSel = clusterIds.some((id) => selectedIds.has(id));

                  return (
                    <div key={cluster} className="rounded-lg border">
                      {/* Cluster header */}
                      <div
                        className="flex cursor-pointer items-center gap-2 rounded-t-lg bg-muted/50 px-3 py-2"
                        onClick={() => toggleCluster(cluster)}
                      >
                        <Checkbox
                          checked={allSel}
                          className={someSel && !allSel ? "opacity-60" : ""}
                          onCheckedChange={() => toggleCluster(cluster)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <FolderTree className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="flex-1 text-sm font-medium">{cluster}</span>
                        <Badge variant="outline" className="text-xs">
                          {clusterIds.filter((id) => selectedIds.has(id)).length} / {clusterTrees.length}
                        </Badge>
                      </div>

                      {/* Tree list */}
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
                                {tree.type}{tree.variety ? ` · ${tree.variety}` : ""}
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          )}
        </Tabs>

        {/* Footer */}
        <div className="shrink-0 space-y-3 pt-3">
          <Separator />
          <div className="flex items-center justify-between gap-3">
            {/* Print layout picker */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Layout:</span>
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

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadAll}
                disabled={selectedTrees.length === 0}
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Download All
              </Button>
              <Button
                size="sm"
                onClick={handlePrint}
                disabled={selectedTrees.length === 0}
              >
                <Printer className="mr-1.5 h-3.5 w-3.5" />
                Print {selectedTrees.length > 0 ? `(${selectedTrees.length})` : ""}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
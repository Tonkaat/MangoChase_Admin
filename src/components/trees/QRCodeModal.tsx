import { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tree } from "@/types/tree.types";
import { QRCodeSVG } from "qrcode.react";
import { Download, Printer, Copy, Check } from "lucide-react";
import { useState } from "react";

interface QRCodeModalProps {
  trees: Tree[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectUrl?: string;
}

export function QRCodeModal({
  trees,
  open,
  onOpenChange,
  projectUrl = window.location.origin,
}: QRCodeModalProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handleCopy = async (tree: Tree) => {
    const qrValue = `${projectUrl}/trees/${tree.farmId}/${tree.id}`;
    await navigator.clipboard.writeText(qrValue);
    setCopied(tree.id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownload = (tree: Tree) => {
    const svg = document.getElementById(`qr-${tree.id}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = 256;
      canvas.height = 256;
      ctx?.fillRect(0, 0, canvas.width, canvas.height);
      ctx?.drawImage(img, 0, 0, 256, 256);
      
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `tree-${tree.id.slice(0, 8)}-qr.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const handlePrintAll = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const qrCodes = trees.map((tree) => {
      const qrValue = `${projectUrl}/trees/${tree.farmId}/${tree.id}`;
      return `
        <div style="page-break-inside: avoid; margin: 20px; text-align: center; display: inline-block;">
          <div style="border: 2px solid #000; padding: 16px; border-radius: 8px;">
            <svg id="print-qr-${tree.id}" width="128" height="128"></svg>
            <div style="margin-top: 8px; font-family: monospace; font-size: 12px;">
              ${tree.id.slice(0, 8)}
            </div>
            <div style="font-size: 10px; color: #666;">
              ${tree.type}${tree.cluster ? ` • ${tree.cluster}` : ""}
            </div>
          </div>
        </div>
      `;
    }).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Tree QR Codes</title>
          <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
          <style>
            body { 
              font-family: system-ui, sans-serif; 
              padding: 20px;
              display: flex;
              flex-wrap: wrap;
              justify-content: center;
            }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          ${qrCodes}
          <script>
            ${trees.map((tree) => {
              const qrValue = `${projectUrl}/trees/${tree.farmId}/${tree.id}`;
              return `
                QRCode.toCanvas(document.createElement('canvas'), '${qrValue}', { width: 128 }, function(err, canvas) {
                  if (err) return;
                  const container = document.getElementById('print-qr-${tree.id}');
                  if (container) {
                    container.replaceWith(canvas);
                  }
                });
              `;
            }).join("")}
            setTimeout(() => window.print(), 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">
            QR Codes ({trees.length} {trees.length === 1 ? "tree" : "trees"})
          </DialogTitle>
          <DialogDescription>
            Generate and download QR codes for quick tree identification
          </DialogDescription>
        </DialogHeader>

        <div
          ref={printRef}
          className="grid gap-4 py-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {trees.map((tree) => {
            const qrValue = `${projectUrl}/trees/${tree.farmId}/${tree.id}`;
            return (
              <div
                key={tree.id}
                className="flex flex-col items-center rounded-lg border bg-card p-4"
              >
                <div className="mb-2 rounded-lg bg-white p-2">
                  <QRCodeSVG
                    id={`qr-${tree.id}`}
                    value={qrValue}
                    size={100}
                    level="H"
                    includeMargin={false}
                  />
                </div>
                <div className="mb-1 font-mono text-xs">{tree.id.slice(0, 8)}</div>
                <div className="mb-2 text-center text-xs text-muted-foreground">
                  {tree.type}
                  {tree.cluster && ` • ${tree.cluster}`}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleDownload(tree)}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleCopy(tree)}
                  >
                    {copied === tree.id ? (
                      <Check className="h-3 w-3 text-brand-leaf" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handlePrintAll}>
            <Printer className="mr-2 h-4 w-4" /> Print All
          </Button>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tree, HealthStatus } from "@/types/tree.types";
import { format } from "date-fns";
import {
  MapPin,
  Calendar,
  AlertTriangle,
  QrCode,
  Flag,
  Edit,
  Trash2,
  Clock,
  Leaf,
  Activity,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface TreeDetailsDrawerProps {
  tree: Tree | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (tree: Tree) => void;
  onToggleFlag: (tree: Tree) => void;
  onDelete: (tree: Tree) => void;
  projectUrl?: string;
}

const healthStatusConfig: Record<
  HealthStatus,
  { label: string; className: string; icon: React.ReactNode }
> = {
  healthy: {
    label: "Healthy",
    className: "bg-brand-leaf/20 text-brand-leaf",
    icon: <Leaf className="h-4 w-4" />,
  },
  warning: {
    label: "Warning",
    className: "bg-brand-mango/20 text-brand-mango",
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  critical: {
    label: "Critical",
    className: "bg-destructive/20 text-destructive",
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  unknown: {
    label: "Unknown",
    className: "bg-muted text-muted-foreground",
    icon: <Activity className="h-4 w-4" />,
  },
};

const growthStageLabels: Record<string, string> = {
  seedling: "Seedling",
  juvenile: "Juvenile",
  mature: "Mature",
  flowering: "Flowering",
  fruiting: "Fruiting",
};

export function TreeDetailsDrawer({
  tree,
  open,
  onOpenChange,
  onEdit,
  onToggleFlag,
  onDelete,
  projectUrl = window.location.origin,
}: TreeDetailsDrawerProps) {
  if (!tree) return null;

  const healthConfig = healthStatusConfig[tree.healthStatus] || healthStatusConfig.unknown;
  const qrValue = `${projectUrl}/trees/${tree.farmId}/${tree.id}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="space-y-1">
          <div className="flex items-center gap-2">
            {tree.flagged && (
              <Flag className="h-4 w-4 fill-destructive text-destructive" />
            )}
            <SheetTitle className="font-display">
              Tree {tree.id.slice(0, 8)}
            </SheetTitle>
          </div>
          <SheetDescription>
            {tree.type}
            {tree.variety && ` • ${tree.variety}`}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* QR Code Section */}
          <div className="flex flex-col items-center rounded-lg border bg-card p-4">
            <div className="mb-3 rounded-lg bg-white p-3">
              <QRCodeSVG
                value={qrValue}
                size={160}
                level="H"
                includeMargin={false}
              />
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Scan to access tree details
            </p>
            <Button variant="outline" size="sm" className="mt-2">
              <QrCode className="mr-2 h-4 w-4" /> Download QR
            </Button>
          </div>

          {/* Status Overview */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border bg-card p-3">
              <div className="mb-1 text-xs text-muted-foreground">
                Health Status
              </div>
              <Badge className={healthConfig.className}>
                {healthConfig.icon}
                <span className="ml-1">{healthConfig.label}</span>
              </Badge>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <div className="mb-1 text-xs text-muted-foreground">
                Growth Stage
              </div>
              <div className="font-medium">
                {growthStageLabels[tree.growthStage] || tree.growthStage}
              </div>
            </div>
          </div>

          <Separator />

          {/* Details Section */}
          <div className="space-y-4">
            <h4 className="font-semibold">Details</h4>

            <div className="space-y-3">
              {tree.cluster && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Leaf className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-muted-foreground">Cluster</div>
                    <div className="font-medium">{tree.cluster}</div>
                  </div>
                </div>
              )}

              {tree.plantedDate && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-muted-foreground">Planted Date</div>
                    <div className="font-medium">
                      {format(tree.plantedDate, "MMMM d, yyyy")}
                    </div>
                  </div>
                </div>
              )}

              {tree.lastInspectionDate && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-muted-foreground">Last Inspection</div>
                    <div className="font-medium">
                      {format(tree.lastInspectionDate, "MMMM d, yyyy")}
                    </div>
                  </div>
                </div>
              )}

              {tree.location?.latitude && tree.location?.longitude && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-muted-foreground">Location</div>
                    <div className="font-mono text-xs">
                      {tree.location.latitude.toFixed(6)},{" "}
                      {tree.location.longitude.toFixed(6)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {tree.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-semibold">Notes</h4>
                <p className="text-sm text-muted-foreground">{tree.notes}</p>
              </div>
            </>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button variant="outline" onClick={() => onEdit(tree)}>
              <Edit className="mr-2 h-4 w-4" /> Edit Tree
            </Button>
            <Button
              variant="outline"
              onClick={() => onToggleFlag(tree)}
              className={tree.flagged ? "border-destructive/50" : ""}
            >
              <Flag className="mr-2 h-4 w-4" />
              {tree.flagged ? "Remove Flag" : "Flag for Attention"}
            </Button>
            <Button
              variant="ghost"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onDelete(tree)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete Tree
            </Button>
          </div>

          {/* Timestamps */}
          <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            <div>Created: {format(tree.createdAt, "MMM d, yyyy 'at' h:mm a")}</div>
            <div>Updated: {format(tree.updatedAt, "MMM d, yyyy 'at' h:mm a")}</div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

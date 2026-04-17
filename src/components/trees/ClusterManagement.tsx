// src/components/trees/ClusterManagement.tsx
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Cluster } from "@/types/tree.types";
import {
  FolderTree,
  Plus,
  QrCode,
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
  TreeDeciduous,
  Heart,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ClusterUser {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  role?: string;
}

interface ClusterWithUsers extends Cluster {
  assignedUsers?: ClusterUser[];
}

interface ClusterManagementProps {
  clusters: ClusterWithUsers[];
  selectedCluster: string | null;
  onSelectCluster: (clusterId: string | null) => void;
  onCreateCluster: () => void;
  onEditCluster: (cluster: Cluster) => void;
  onDeleteCluster: (cluster: Cluster) => void;
  onGenerateClusterQR: (cluster: Cluster) => void;
  onRecordHarvest?: (clusterName: string) => void;
  /** Max visible height before the list scrolls. Defaults to 480px. */
  maxHeight?: number;
  className?: string;
}

function UserAvatar({ user, size = "sm" }: { user: ClusterUser; size?: "sm" | "xs" }) {
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const sizeClass = size === "sm" ? "h-6 w-6 text-[10px]" : "h-5 w-5 text-[9px]";

  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.name}
        className={`${sizeClass} rounded-full object-cover ring-1 ring-background`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-primary/10 text-primary font-medium flex items-center justify-center ring-1 ring-background`}
    >
      {initials}
    </div>
  );
}

function HealthBar({
  healthy,
  warning,
  critical,
  total,
}: {
  healthy: number;
  warning: number;
  critical: number;
  total: number;
}) {
  if (total === 0) return null;

  const healthyPct = Math.round((healthy / total) * 100);
  const warningPct = Math.round((warning / total) * 100);
  const criticalPct = Math.round((critical / total) * 100);

  return (
    <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
      {healthyPct > 0 && (
        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${healthyPct}%` }} />
      )}
      {warningPct > 0 && (
        <div className="h-full bg-amber-400 transition-all" style={{ width: `${warningPct}%` }} />
      )}
      {criticalPct > 0 && (
        <div className="h-full bg-red-500 transition-all" style={{ width: `${criticalPct}%` }} />
      )}
    </div>
  );
}

export function ClusterManagement({
  clusters,
  selectedCluster,
  onSelectCluster,
  onCreateCluster,
  onEditCluster,
  onDeleteCluster,
  onGenerateClusterQR,
  maxHeight = 480,
  className,
}: ClusterManagementProps) {
  const totalTrees = clusters.reduce((acc, c) => acc + c.treeCount, 0);
  const totalHealthy = clusters.reduce((acc, c) => acc + c.healthyCount, 0);
  const totalWarning = clusters.reduce((acc, c) => acc + c.warningCount, 0);
  const totalCritical = clusters.reduce((acc, c) => acc + c.criticalCount, 0);

  return (
    <TooltipProvider>
      {/* The card itself no longer stretches — it's bounded by maxHeight */}
      <Card className={cn("shadow-soft flex flex-col", className)} style={{ maxHeight }}>
        {/* Fixed header — never scrolls */}
        <CardHeader className="pb-2 pt-4 px-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderTree className="h-4 w-4 text-brand-leaf" />
              <CardTitle className="text-sm font-semibold">Clusters</CardTitle>
              <Badge variant="secondary" className="text-xs font-normal">
                {clusters.length}
              </Badge>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={onCreateCluster}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Create new cluster</TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>

        {/* Scrollable list — only this overflows */}
        <CardContent className="p-3 pt-0 overflow-y-auto min-h-0 flex-1">
          <div className="space-y-1">
            {/* All Trees */}
            <button
              onClick={() => onSelectCluster(null)}
              className={cn(
                "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all",
                selectedCluster === null
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted/50 text-foreground"
              )}
            >
              <TreeDeciduous
                className={cn(
                  "h-4 w-4 shrink-0",
                  selectedCluster === null ? "text-primary" : "text-muted-foreground"
                )}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">All Trees</span>
                  <Badge
                    variant={selectedCluster === null ? "default" : "secondary"}
                    className="text-xs shrink-0"
                  >
                    {totalTrees}
                  </Badge>
                </div>
                {totalTrees > 0 && (
                  <div className="mt-1.5">
                    <HealthBar
                      healthy={totalHealthy}
                      warning={totalWarning}
                      critical={totalCritical}
                      total={totalTrees}
                    />
                  </div>
                )}
              </div>
            </button>

            {clusters.length > 0 && <div className="mx-2 my-2 border-t" />}

            {clusters.length === 0 ? (
              <div className="py-8 text-center">
                <FolderTree className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground">No clusters yet</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-7 text-xs"
                  onClick={onCreateCluster}
                >
                  <Plus className="mr-1 h-3 w-3" /> Create your first cluster
                </Button>
              </div>
            ) : (
              clusters.map((cluster) => {
                const isSelected = selectedCluster === cluster.id;
                const assignedUsers = cluster.assignedUsers ?? [];

                return (
                  <div
                    key={cluster.id}
                    className={cn(
                      "group relative flex items-start gap-2 rounded-lg px-3 py-2.5 transition-all",
                      isSelected ? "bg-primary/10" : "hover:bg-muted/50"
                    )}
                  >
                    <button
                      className="flex flex-1 flex-col gap-1.5 text-left min-w-0"
                      onClick={() => onSelectCluster(cluster.id)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "text-sm font-medium truncate",
                            isSelected ? "text-primary" : "text-foreground"
                          )}
                        >
                          {cluster.name}
                        </span>
                        <Badge
                          variant={isSelected ? "default" : "outline"}
                          className="shrink-0 text-xs"
                        >
                          {cluster.treeCount}
                        </Badge>
                      </div>

                      {cluster.treeCount > 0 && (
                        <div className="mt-0.5">
                          <HealthBar
                            healthy={cluster.healthyCount}
                            warning={cluster.warningCount}
                            critical={cluster.criticalCount}
                            total={cluster.treeCount}
                          />
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-[11px]">
                        {cluster.healthyCount > 0 && (
                          <span className="flex items-center gap-0.5 text-emerald-600">
                            <Heart className="h-2.5 w-2.5" />
                            {cluster.healthyCount}
                          </span>
                        )}
                        {cluster.warningCount > 0 && (
                          <span className="flex items-center gap-0.5 text-amber-600">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            {cluster.warningCount}
                          </span>
                        )}
                        {cluster.criticalCount > 0 && (
                          <span className="flex items-center gap-0.5 text-red-600">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            {cluster.criticalCount}
                          </span>
                        )}
                      </div>

                      {assignedUsers.length > 0 ? (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="flex -space-x-1.5">
                            {assignedUsers.slice(0, 3).map((user) => (
                              <Tooltip key={user.id}>
                                <TooltipTrigger asChild>
                                  <div>
                                    <UserAvatar user={user} size="xs" />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs">
                                  <p className="font-medium">{user.name}</p>
                                  {user.role && (
                                    <p className="text-muted-foreground">{user.role}</p>
                                  )}
                                </TooltipContent>
                              </Tooltip>
                            ))}
                            {assignedUsers.length > 3 && (
                              <div className="h-5 w-5 rounded-full bg-muted text-[9px] font-medium flex items-center justify-center ring-1 ring-background text-muted-foreground">
                                +{assignedUsers.length - 3}
                              </div>
                            )}
                          </div>
                          <span className="text-[11px] text-muted-foreground truncate">
                            {assignedUsers.length === 1
                              ? assignedUsers[0].name.split(" ")[0]
                              : `${assignedUsers.length} farmers`}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground/60 mt-0.5">
                          <Users className="h-2.5 w-2.5" />
                          <span>No farmer assigned</span>
                        </div>
                      )}
                    </button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => onGenerateClusterQR(cluster)}>
                          <QrCode className="mr-2 h-3.5 w-3.5" /> Print QR Codes
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onEditCluster(cluster)}>
                          <Pencil className="mr-2 h-3.5 w-3.5" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDeleteCluster(cluster)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
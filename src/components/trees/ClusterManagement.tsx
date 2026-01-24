import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Cluster } from "@/types/tree.types";
import { FolderTree, Plus, QrCode, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ClusterManagementProps {
  clusters: Cluster[];
  selectedCluster: string | null;
  onSelectCluster: (clusterId: string | null) => void;
  onCreateCluster: (name: string, description?: string) => void;
  onEditCluster: (cluster: Cluster) => void;
  onDeleteCluster: (cluster: Cluster) => void;
  onGenerateClusterQR: (cluster: Cluster) => void;
}

export function ClusterManagement({
  clusters,
  selectedCluster,
  onSelectCluster,
  onCreateCluster,
  onEditCluster,
  onDeleteCluster,
  onGenerateClusterQR,
}: ClusterManagementProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newClusterName, setNewClusterName] = useState("");
  const [newClusterDescription, setNewClusterDescription] = useState("");

  const handleCreate = () => {
    if (newClusterName.trim()) {
      onCreateCluster(newClusterName.trim(), newClusterDescription.trim() || undefined);
      setNewClusterName("");
      setNewClusterDescription("");
      setShowCreateDialog(false);
    }
  };

  const totalTrees = clusters.reduce((acc, c) => acc + c.treeCount, 0);

  return (
    <>
      <Card className="shadow-soft">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FolderTree className="h-5 w-5 text-brand-leaf" />
              Clusters
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* All Trees Option */}
          <button
            onClick={() => onSelectCluster(null)}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors ${
              selectedCluster === null
                ? "bg-primary/10 text-primary"
                : "hover:bg-muted"
            }`}
          >
            <span className="font-medium">All Trees</span>
            <Badge variant="secondary">{totalTrees}</Badge>
          </button>

          {clusters.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No clusters yet
            </p>
          ) : (
            clusters.map((cluster) => (
              <div
                key={cluster.id}
                className={`group flex items-center justify-between rounded-lg px-3 py-2 transition-colors ${
                  selectedCluster === cluster.id
                    ? "bg-primary/10"
                    : "hover:bg-muted"
                }`}
              >
                <button
                  onClick={() => onSelectCluster(cluster.id)}
                  className="flex flex-1 flex-col text-left"
                >
                  <span
                    className={`font-medium ${
                      selectedCluster === cluster.id ? "text-primary" : ""
                    }`}
                  >
                    {cluster.name}
                  </span>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <span className="text-brand-leaf">
                      {cluster.healthyCount} healthy
                    </span>
                    {cluster.warningCount > 0 && (
                      <span className="text-brand-mango">
                        {cluster.warningCount} warning
                      </span>
                    )}
                    {cluster.criticalCount > 0 && (
                      <span className="text-destructive">
                        {cluster.criticalCount} critical
                      </span>
                    )}
                  </div>
                </button>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs">
                    {cluster.treeCount}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onGenerateClusterQR(cluster)}>
                        <QrCode className="mr-2 h-4 w-4" /> Generate QR
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEditCluster(cluster)}>
                        <Pencil className="mr-2 h-4 w-4" /> Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDeleteCluster(cluster)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Create Cluster Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Cluster</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Cluster Name
              </label>
              <Input
                placeholder="e.g., North Block A"
                value={newClusterName}
                onChange={(e) => setNewClusterName(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">
                Description (optional)
              </label>
              <Input
                placeholder="e.g., Premium mango trees"
                value={newClusterDescription}
                onChange={(e) => setNewClusterDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!newClusterName.trim()}>
              Create Cluster
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

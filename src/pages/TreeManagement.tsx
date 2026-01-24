import { useState, useMemo, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TreeInventoryTable } from "@/components/trees/TreeInventoryTable";
import { TreeFilters } from "@/components/trees/TreeFilters";
import { BulkOperationsPanel } from "@/components/trees/BulkOperationsPanel";
import { TreeDetailsDrawer } from "@/components/trees/TreeDetailsDrawer";
import { QRCodeModal } from "@/components/trees/QRCodeModal";
import { ClusterManagement } from "@/components/trees/ClusterManagement";
import { TreeStatsCards } from "@/components/trees/TreeStatsCards";
import { AddTreeModal } from "@/components/trees/AddTreeModal";
import { Tree, TreeFilter, Cluster, TreeStats, autoCalculateGrowthStage } from "@/types/tree.types";
import { Plus, Download, Upload, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { treeService } from "@/services/treeService";
import { farmService } from "@/services/farmService";

const initialFilters: TreeFilter = {
  search: "",
  healthStatus: "all",
  growthStage: "all",
  cluster: "all",
  flagged: "all",
};

interface TreeManagementProps {
  farmId: string; // Pass the current farm ID as a prop
}

export default function TreeManagement({ farmId }: TreeManagementProps) {
  const [trees, setTrees] = useState<Tree[]>([]);
  const [filters, setFilters] = useState<TreeFilter>(initialFilters);
  const [selectedTrees, setSelectedTrees] = useState<string[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [viewingTree, setViewingTree] = useState<Tree | null>(null);
  const [editingTree, setEditingTree] = useState<Tree | null>(null);
  const [qrModalTrees, setQrModalTrees] = useState<Tree[]>([]);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirmTree, setDeleteConfirmTree] = useState<Tree | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  

  // Load trees from Firebase
const loadTrees = useCallback(async () => {
  if (!farmId) return;
  
  try {
    setLoading(true);
    const treesData = await treeService.getTrees(farmId);
    
    // Auto-calculate growth stages based on age
    const updatedTrees = treesData.map(tree => ({
      ...tree,
      growthStage: autoCalculateGrowthStage(tree)
    }));
    
    setTrees(updatedTrees);
  } catch (error) {
    console.error("Error loading trees:", error);
    toast.error("Failed to load trees");
  } finally {
    setLoading(false);
  }
}, [farmId]);

  // Initial load
  useEffect(() => {
    loadTrees();
  }, [loadTrees]);

  // Derive clusters from trees
  const clusters: Cluster[] = useMemo(() => {
    const clusterMap = new Map<string, Cluster>();
    
    trees.forEach((tree) => {
      if (tree.cluster) {
        const existing = clusterMap.get(tree.cluster);
        if (existing) {
          existing.treeCount++;
          if (tree.healthStatus === "healthy") existing.healthyCount++;
          if (tree.healthStatus === "warning") existing.warningCount++;
          if (tree.healthStatus === "critical") existing.criticalCount++;
        } else {
          clusterMap.set(tree.cluster, {
            id: tree.cluster,
            name: tree.cluster,
            farmId: tree.farmId,
            treeCount: 1,
            healthyCount: tree.healthStatus === "healthy" ? 1 : 0,
            warningCount: tree.healthStatus === "warning" ? 1 : 0,
            criticalCount: tree.healthStatus === "critical" ? 1 : 0,
          });
        }
      }
    });

    return Array.from(clusterMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [trees]);

  const clusterNames = useMemo(() => clusters.map((c) => c.name), [clusters]);

  // Calculate stats
  const stats: TreeStats = useMemo(() => ({
    total: trees.length,
    healthy: trees.filter((t) => t.healthStatus === "healthy").length,
    warning: trees.filter((t) => t.healthStatus === "warning").length,
    critical: trees.filter((t) => t.healthStatus === "critical").length,
    flagged: trees.filter((t) => t.flagged).length,
    clusters: clusters.length,
  }), [trees, clusters]);

  // Filter trees
  const filteredTrees = useMemo(() => {
    return trees.filter((tree) => {
      if (selectedCluster && tree.cluster !== selectedCluster) return false;

      if (filters.search) {
        const search = filters.search.toLowerCase();
        const matches =
          tree.id.toLowerCase().includes(search) ||
          tree.type.toLowerCase().includes(search) ||
          tree.variety?.toLowerCase().includes(search) ||
          tree.cluster?.toLowerCase().includes(search);
        if (!matches) return false;
      }

      if (filters.healthStatus !== "all" && tree.healthStatus !== filters.healthStatus) {
        return false;
      }

      if (filters.growthStage !== "all" && tree.growthStage !== filters.growthStage) {
        return false;
      }

      if (filters.cluster !== "all" && tree.cluster !== filters.cluster) {
        return false;
      }

      if (filters.flagged === "flagged" && !tree.flagged) return false;
      if (filters.flagged === "unflagged" && tree.flagged) return false;

      return true;
    });
  }, [trees, filters, selectedCluster]);

  // Handlers
  const handleSync = useCallback(async () => {
    setSyncing(true);
    await loadTrees();
    setSyncing(false);
    toast.success("Trees synced successfully");
  }, [loadTrees]);

  const handleClearFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  const handleViewTree = useCallback((tree: Tree) => {
    setViewingTree(tree);
  }, []);

  const handleEditTree = useCallback((tree: Tree) => {
    setEditingTree(tree);
    setShowAddModal(true);
    setViewingTree(null);
  }, []);

  const handleGenerateQR = useCallback((tree: Tree) => {
    setQrModalTrees([tree]);
    setShowQRModal(true);
  }, []);

  const handleToggleFlag = useCallback(async (tree: Tree) => {
    try {
      const newFlaggedState = !tree.flagged;
      await treeService.flagTree(farmId, tree.id, newFlaggedState);
      
      setTrees((prev) =>
        prev.map((t) =>
          t.id === tree.id
            ? { ...t, flagged: newFlaggedState, updatedAt: new Date() }
            : t
        )
      );
      
      toast.success(newFlaggedState ? "Tree flagged for attention" : "Flag removed");
      setViewingTree(null);
    } catch (error) {
      console.error("Error toggling flag:", error);
      toast.error("Failed to update flag");
    }
  }, [farmId]);

  const handleDeleteTree = useCallback((tree: Tree) => {
    setDeleteConfirmTree(tree);
    setViewingTree(null);
  }, []);

  const confirmDeleteTree = useCallback(async () => {
    if (!deleteConfirmTree) return;

    try {
      await treeService.deleteTree(farmId, deleteConfirmTree.id);
      setTrees((prev) => prev.filter((t) => t.id !== deleteConfirmTree.id));
      toast.success("Tree deleted successfully");
      setDeleteConfirmTree(null);
    } catch (error) {
      console.error("Error deleting tree:", error);
      toast.error("Failed to delete tree");
    }
  }, [deleteConfirmTree, farmId]);

  const handleAddTree = useCallback(async (data: Partial<Tree>) => {
    try {
      if (editingTree) {
        // Update existing tree
        await treeService.updateTree(farmId, editingTree.id, data);
        
        setTrees((prev) =>
          prev.map((t) =>
            t.id === editingTree.id
              ? { ...t, ...data, updatedAt: new Date() }
              : t
          )
        );
        
        toast.success("Tree updated successfully");
        setEditingTree(null);
      } else {
        // Create new tree
        const treeId = await treeService.addTree(farmId, {
          type: data.type || "Unknown",
          variety: data.variety,
          healthStatus: data.healthStatus || "unknown",
          growthStage: data.growthStage || "seedling",
          cluster: data.cluster,
          flagged: false,
          notes: data.notes,
          location: data.location,
        });

        // Reload trees to get the newly created tree with all fields
        await loadTrees();
        toast.success("Tree added successfully");
      }
    } catch (error) {
      console.error("Error saving tree:", error);
      toast.error("Failed to save tree");
    }
  }, [editingTree, farmId, loadTrees]);

  // Bulk operations
  const handleBulkFlag = useCallback(async (flag: boolean) => {
    try {
      await treeService.batchFlagTrees(farmId, selectedTrees, flag);

      setTrees((prev) =>
        prev.map((t) =>
          selectedTrees.includes(t.id)
            ? { ...t, flagged: flag, updatedAt: new Date() }
            : t
        )
      );

      toast.success(`${selectedTrees.length} trees ${flag ? "flagged" : "unflagged"}`);
      setSelectedTrees([]);
    } catch (error) {
      console.error("Error bulk flagging:", error);
      toast.error("Failed to update flags");
    }
  }, [selectedTrees, farmId]);

  const handleBulkChangeCluster = useCallback(async (cluster: string) => {
    if (cluster === "__new__") {
      toast.info("Create new cluster functionality coming soon");
      return;
    }

    try {
      await treeService.batchUpdateTreesCluster(farmId, selectedTrees, cluster);

      setTrees((prev) =>
        prev.map((t) =>
          selectedTrees.includes(t.id)
            ? { ...t, cluster, updatedAt: new Date() }
            : t
        )
      );

      toast.success(`${selectedTrees.length} trees moved to ${cluster}`);
      setSelectedTrees([]);
    } catch (error) {
      console.error("Error changing cluster:", error);
      toast.error("Failed to change cluster");
    }
  }, [selectedTrees, farmId]);

  const handleBulkDelete = useCallback(() => {
    setShowBulkDeleteConfirm(true);
  }, []);

  const confirmBulkDelete = useCallback(async () => {
    try {
      await treeService.batchDeleteTrees(farmId, selectedTrees);

      setTrees((prev) => prev.filter((t) => !selectedTrees.includes(t.id)));
      toast.success(`${selectedTrees.length} trees deleted`);
      setSelectedTrees([]);
      setShowBulkDeleteConfirm(false);
    } catch (error) {
      console.error("Error bulk deleting:", error);
      toast.error("Failed to delete trees");
    }
  }, [selectedTrees, farmId]);

  const handleBulkGenerateQR = useCallback(() => {
    const treesToGenerate = trees.filter((t) => selectedTrees.includes(t.id));
    setQrModalTrees(treesToGenerate);
    setShowQRModal(true);
  }, [selectedTrees, trees]);

  const handleCreateCluster = useCallback((name: string) => {
    toast.success(`Cluster "${name}" created`);
  }, []);

  const handleEditCluster = useCallback((cluster: Cluster) => {
    toast.info("Edit cluster functionality coming soon");
  }, []);

  const handleDeleteCluster = useCallback((cluster: Cluster) => {
    toast.info("Delete cluster functionality coming soon");
  }, []);

  const handleGenerateClusterQR = useCallback((cluster: Cluster) => {
    const clusterTrees = trees.filter((t) => t.cluster === cluster.name);
    setQrModalTrees(clusterTrees);
    setShowQRModal(true);
  }, [trees]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Tree Management</h1>
          <p className="text-muted-foreground">
            Track inventory, clusters, health status, and generate QR codes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Upload className="mr-2 h-4 w-4" /> Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button variant="leaf" onClick={() => setShowAddModal(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Tree
          </Button>
        </div>
      </header>

      {/* Stats */}
      <TreeStatsCards stats={stats} />

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Sidebar - Cluster Management */}
        <div className="space-y-4">
          <ClusterManagement
            clusters={clusters}
            selectedCluster={selectedCluster}
            onSelectCluster={setSelectedCluster}
            onCreateCluster={handleCreateCluster}
            onEditCluster={handleEditCluster}
            onDeleteCluster={handleDeleteCluster}
            onGenerateClusterQR={handleGenerateClusterQR}
          />
        </div>

        {/* Main Table Area */}
        <div className="space-y-4">
          <Card className="shadow-soft">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Tree Inventory
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({filteredTrees.length} trees)
                  </span>
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSync}
                  disabled={syncing}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} /> 
                  Sync
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <TreeFilters
                filters={filters}
                clusters={clusterNames}
                onFiltersChange={setFilters}
                onClearFilters={handleClearFilters}
              />
              <TreeInventoryTable
                trees={filteredTrees}
                selectedTrees={selectedTrees}
                onSelectionChange={setSelectedTrees}
                onViewTree={handleViewTree}
                onGenerateQR={handleGenerateQR}
                onToggleFlag={handleToggleFlag}
                onDeleteTree={handleDeleteTree}
                onEditTree={handleEditTree}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bulk Operations Panel */}
      <BulkOperationsPanel
        selectedCount={selectedTrees.length}
        clusters={clusterNames}
        onClearSelection={() => setSelectedTrees([])}
        onBulkFlag={handleBulkFlag}
        onBulkChangeCluster={handleBulkChangeCluster}
        onBulkDelete={handleBulkDelete}
        onBulkGenerateQR={handleBulkGenerateQR}
      />

      {/* Tree Details Drawer */}
      <TreeDetailsDrawer
        tree={viewingTree}
        open={Boolean(viewingTree)}
        onOpenChange={(open) => !open && setViewingTree(null)}
        onEdit={handleEditTree}
        onToggleFlag={handleToggleFlag}
        onDelete={handleDeleteTree}
      />

      {/* QR Code Modal */}
      <QRCodeModal
        trees={qrModalTrees}
        open={showQRModal}
        onOpenChange={setShowQRModal}
      />

      {/* Add/Edit Tree Modal */}
      <AddTreeModal
        open={showAddModal}
        onOpenChange={(open) => {
          setShowAddModal(open);
          if (!open) setEditingTree(null);
        }}
        clusters={clusterNames}
        onSubmit={handleAddTree}
        editingTree={editingTree}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={Boolean(deleteConfirmTree)}
        onOpenChange={(open) => !open && setDeleteConfirmTree(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tree</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete tree {deleteConfirmTree?.id.slice(0, 8)}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteTree}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog
        open={showBulkDeleteConfirm}
        onOpenChange={setShowBulkDeleteConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedTrees.length} Trees</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedTrees.length} trees?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
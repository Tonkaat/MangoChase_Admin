// src/pages/TreeManagement.tsx
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
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
import { AddEditClusterModal } from "@/components/trees/AddEditClusterModal";
import { 
  Tree, 
  TreeFilter, 
  Cluster, 
  TreeStats, 
  TreeData,
  ClusterData,
  autoCalculateGrowthStage,
  convertFirestoreTree as convertFirestoreTreeHelper,
  convertFirestoreCluster as convertFirestoreClusterHelper,
  normalizeHealthStatus,
  normalizeGrowthStage
} from "@/types/tree.types";
import { Plus, Download, Upload, RefreshCw, Loader2, Trees } from "lucide-react";
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
import { firebaseService } from "@/services/firebase";
import { treeNamingService } from "@/services/firebase/treeNamingService";
import { auth } from "@/config/firebase";

// Types for Firestore data
interface FirestoreTree {
  id: string;
  tree_id?: string;
  tree_name?: string;
  type?: string;
  healthStatus?: string;
  growthStage?: string;
  cluster?: string;
  flagged?: boolean;
  variety?: string;
  location?: string;
  notes?: string;
  plantedDate?: any;
  lastInspection?: any;
  createdAt?: any;
  updatedAt?: any;
  farmId?: string;
}

interface FirestoreCluster {
  id: string;
  name: string;
  description?: string;
  location?: string;
  createdAt?: any;
  treeCount?: number;
  farmId?: string;
}

const initialFilters: TreeFilter = {
  search: "",
  healthStatus: "all",
  growthStage: "all",
  cluster: "all",
  flagged: "all",
};

export default function TreeManagement() {
  const [farmId, setFarmId] = useState<string>("");
  const [trees, setTrees] = useState<Tree[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [filters, setFilters] = useState<TreeFilter>(initialFilters);
  const [selectedTrees, setSelectedTrees] = useState<string[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [viewingTree, setViewingTree] = useState<Tree | null>(null);
  const [editingTree, setEditingTree] = useState<Tree | null>(null);
  const [editingCluster, setEditingCluster] = useState<Cluster | null>(null);
  const [qrModalTrees, setQrModalTrees] = useState<Tree[]>([]);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showAddTreeModal, setShowAddTreeModal] = useState(false);
  const [showAddClusterModal, setShowAddClusterModal] = useState(false);
  const [deleteConfirmTree, setDeleteConfirmTree] = useState<Tree | null>(null);
  const [deleteConfirmCluster, setDeleteConfirmCluster] = useState<Cluster | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  
  // Refs for Firebase listeners
  const treesUnsubscribeRef = useRef<() => void>(() => {});
  const clustersUnsubscribeRef = useRef<() => void>(() => {});

  // Get farmId from current user
  useEffect(() => {
    const loadFarmId = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const profile = await firebaseService.getUserProfile();
          if (profile?.farmId) {
            setFarmId(profile.farmId);
          } else {
            toast.error("No farm associated with your account");
            setLoading(false);
          }
        }
      } catch (error) {
        console.error("Error loading farm ID:", error);
        toast.error("Failed to load farm information");
        setLoading(false);
      }
    };

    loadFarmId();

    // Cleanup function
    return () => {
      treesUnsubscribeRef.current();
      clustersUnsubscribeRef.current();
    };
  }, []);

  // Helper to convert Firestore tree to Tree type (FIXED)
  const convertFirestoreTree = (firestoreTree: FirestoreTree): Tree => {
    // Use the helper function from tree.types.ts
    return convertFirestoreTreeHelper({
      id: firestoreTree.id,
      ...firestoreTree
    });
  };

  // Helper to convert Firestore cluster to Cluster type (FIXED)
  const convertFirestoreCluster = (firestoreCluster: FirestoreCluster): Cluster => {
    const treeCount = trees.filter(tree => tree.cluster === firestoreCluster.name).length;
    
    // Use the helper function from tree.types.ts
    return convertFirestoreClusterHelper({
      id: firestoreCluster.id,
      ...firestoreCluster
    }, treeCount);
  };

  // Setup real-time listeners for trees and clusters
  useEffect(() => {
    if (!farmId) return;

    const setupListeners = () => {
      // Setup trees listener
      treesUnsubscribeRef.current = firebaseService.getTrees(farmId, (snapshot) => {
        const firestoreTrees: FirestoreTree[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const convertedTrees = firestoreTrees.map(convertFirestoreTree);
        setTrees(convertedTrees);
        setLoading(false);
      });

      // Setup clusters listener
      clustersUnsubscribeRef.current = firebaseService.getClusters(farmId, (snapshot) => {
        const firestoreClusters: FirestoreCluster[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const convertedClusters = firestoreClusters.map(convertFirestoreCluster);
        setClusters(convertedClusters);
      });
    };

    setupListeners();
  }, [farmId]);

  const clusterNames = useMemo(() => clusters.map((c) => c.name), [clusters]);

  // Calculate stats
  const stats: TreeStats = useMemo(() => ({
    total: trees.length,
    healthy: trees.filter((t) => t.healthStatus === "Healthy" || t.healthStatus === "healthy").length,
    warning: trees.filter((t) => t.healthStatus === "Warning" || t.healthStatus === "warning").length,
    critical: trees.filter((t) => t.healthStatus === "Critical" || t.healthStatus === "critical").length,
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
          tree.tree_id?.toLowerCase().includes(search) ||
          tree.tree_name?.toLowerCase().includes(search) ||
          tree.type?.toLowerCase().includes(search) ||
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
    // Manually reload data by re-establishing listeners
    treesUnsubscribeRef.current();
    clustersUnsubscribeRef.current();
    
    setTimeout(() => {
      if (farmId) {
        treesUnsubscribeRef.current = firebaseService.getTrees(farmId, (snapshot) => {
          const firestoreTrees: FirestoreTree[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          const convertedTrees = firestoreTrees.map(convertFirestoreTree);
          setTrees(convertedTrees);
        });

        clustersUnsubscribeRef.current = firebaseService.getClusters(farmId, (snapshot) => {
          const firestoreClusters: FirestoreCluster[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          const convertedClusters = firestoreClusters.map(convertFirestoreCluster);
          setClusters(convertedClusters);
        });
      }
      setSyncing(false);
      toast.success("Data synced successfully");
    }, 100);
  }, [farmId]);

  const handleClearFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  const handleViewTree = useCallback((tree: Tree) => {
    setViewingTree(tree);
  }, []);

  const handleEditTree = useCallback((tree: Tree) => {
    setEditingTree(tree);
    setShowAddTreeModal(true);
    setViewingTree(null);
  }, []);

  const handleGenerateQR = useCallback((tree: Tree) => {
    setQrModalTrees([tree]);
    setShowQRModal(true);
  }, []);

  const handleToggleFlag = useCallback(async (tree: Tree) => {
    if (!farmId) return;
    
    try {
      const newFlaggedState = !tree.flagged;
      await firebaseService.flagTree(farmId, tree.id, newFlaggedState);
      
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
    if (!deleteConfirmTree || !farmId) return;

    try {
      await firebaseService.deleteTree(farmId, deleteConfirmTree.id);
      toast.success("Tree deleted successfully");
      setDeleteConfirmTree(null);
    } catch (error) {
      console.error("Error deleting tree:", error);
      toast.error("Failed to delete tree");
    }
  }, [deleteConfirmTree, farmId]);

  // FIXED: Updated handleAddTree function
  const handleAddTree = useCallback(async (data: TreeData) => {
    if (!farmId || !data.variety) return;
    
    try {
      if (editingTree) {
        // For updates, use firebaseService.updateTree directly
        const updates: TreeData = {};
        
        if (data.type) updates.type = data.type;
        if (data.variety) updates.variety = data.variety;
        if (data.healthStatus) updates.healthStatus = normalizeHealthStatus(data.healthStatus);
        if (data.growthStage) updates.growthStage = normalizeGrowthStage(data.growthStage);
        if (data.cluster !== undefined) updates.cluster = data.cluster || undefined;
        if (data.notes !== undefined) updates.notes = data.notes;
        if (data.location !== undefined) updates.location = data.location;
        if (data.plantedDate) updates.plantedDate = data.plantedDate;
        
        updates.lastInspection = new Date();
        
        await firebaseService.updateTree(farmId, editingTree.id, updates);
        
        toast.success("Tree updated successfully");
        setEditingTree(null);
      } else {
        // For new trees, use treeNamingService
        const treeData = await treeNamingService.generateTreeData({
          farmId,
          variety: data.variety,
          additionalData: {
            type: data.type || "Mango",
            healthStatus: normalizeHealthStatus(data.healthStatus || "Healthy"),
            growthStage: normalizeGrowthStage(data.growthStage || "seedling"),
            cluster: data.cluster || undefined, // undefined for no cluster
            flagged: false,
            notes: data.notes,
            location: data.location,
            plantedDate: data.plantedDate || new Date(),
          }
        });

        await firebaseService.addTree(farmId, treeData);
        toast.success("Tree added successfully");
      }

    } catch (error: any) {
      console.error("Error saving tree:", error);
      toast.error(error.message || "Failed to save tree");
    }
  }, [editingTree, farmId]);

  // Bulk operations
  const handleBulkFlag = useCallback(async (flag: boolean) => {
    if (!farmId || selectedTrees.length === 0) return;
    
    try {
      // Update each tree individually
      for (const treeId of selectedTrees) {
        await firebaseService.flagTree(farmId, treeId, flag);
      }

      toast.success(`${selectedTrees.length} trees ${flag ? "flagged" : "unflagged"}`);
      setSelectedTrees([]);
    } catch (error) {
      console.error("Error bulk flagging:", error);
      toast.error("Failed to update flags");
    }
  }, [selectedTrees, farmId]);

  const handleBulkChangeCluster = useCallback(async (cluster: string) => {
    if (!farmId || selectedTrees.length === 0) return;
    
    if (cluster === "__new__") {
      setShowAddClusterModal(true);
      return;
    }

    try {
      await firebaseService.batchUpdateTreesCluster(farmId, selectedTrees, cluster);
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
    if (!farmId || selectedTrees.length === 0) return;
    
    try {
      // Delete each tree individually
      for (const treeId of selectedTrees) {
        await firebaseService.deleteTree(farmId, treeId);
      }

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

  // Cluster handlers (FIXED: Uses ClusterData type)
  const handleCreateCluster = useCallback(() => {
    setEditingCluster(null);
    setShowAddClusterModal(true);
  }, []);

  const handleEditCluster = useCallback((cluster: Cluster) => {
    setEditingCluster(cluster);
    setShowAddClusterModal(true);
  }, []);

  const handleDeleteCluster = useCallback((cluster: Cluster) => {
    setDeleteConfirmCluster(cluster);
  }, []);

  const confirmDeleteCluster = useCallback(async () => {
    if (!deleteConfirmCluster || !farmId) return;

    try {
      await firebaseService.deleteClusterFromCollection(farmId, deleteConfirmCluster.name);
      
      toast.success(`Cluster "${deleteConfirmCluster.name}" deleted`);
      setDeleteConfirmCluster(null);
    } catch (error) {
      console.error("Error deleting cluster:", error);
      toast.error("Failed to delete cluster");
    }
  }, [deleteConfirmCluster, farmId]);

  // FIXED: Updated handleSubmitCluster function
  const handleSubmitCluster = useCallback(async (data: ClusterData) => {
    if (!farmId || !data.name) return;

    try {
      if (editingCluster) {
        // Rename cluster
        await firebaseService.renameCluster(farmId, editingCluster.name, data.name);
        toast.success("Cluster renamed successfully");
      } else {
        // Create new cluster
        await firebaseService.addCluster(farmId, data.name);
        toast.success(`Cluster "${data.name}" created successfully`);
      }

      setEditingCluster(null);
    } catch (error: any) {
      console.error("Error saving cluster:", error);
      throw error;
    }
  }, [editingCluster, farmId]);

  const handleGenerateClusterQR = useCallback((cluster: Cluster) => {
    const clusterTrees = trees.filter((t) => t.cluster === cluster.name);
    setQrModalTrees(clusterTrees);
    setShowQRModal(true);
  }, [trees]);

  if (loading && !farmId) {
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
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5">
              <Trees className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold">Mango Trees</h1>
              <p className="text-muted-foreground">
                Seb's basement...
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Upload className="mr-2 h-4 w-4" /> Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button variant="leaf" onClick={() => setShowAddTreeModal(true)}>
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
      {selectedTrees.length > 0 && (
        <BulkOperationsPanel
          selectedCount={selectedTrees.length}
          clusters={clusterNames}
          onClearSelection={() => setSelectedTrees([])}
          onBulkFlag={handleBulkFlag}
          onBulkChangeCluster={handleBulkChangeCluster}
          onBulkDelete={handleBulkDelete}
          onBulkGenerateQR={handleBulkGenerateQR}
        />
      )}

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
        open={showAddTreeModal}
        onOpenChange={(open) => {
          setShowAddTreeModal(open);
          if (!open) setEditingTree(null);
        }}
        clusters={clusterNames}
        onSubmit={handleAddTree}
        editingTree={editingTree}
      />

      {/* Add/Edit Cluster Modal */}
      <AddEditClusterModal
        open={showAddClusterModal}
        onOpenChange={(open) => {
          setShowAddClusterModal(open);
          if (!open) setEditingCluster(null);
        }}
        onSubmit={handleSubmitCluster}
        editingCluster={editingCluster}
        existingClusterNames={clusterNames}
      />

      {/* Delete Tree Confirmation */}
      <AlertDialog
        open={Boolean(deleteConfirmTree)}
        onOpenChange={(open) => !open && setDeleteConfirmTree(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tree</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete tree {deleteConfirmTree?.tree_name || deleteConfirmTree?.id.slice(0, 8)}?
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

      {/* Delete Cluster Confirmation */}
      <AlertDialog
        open={Boolean(deleteConfirmCluster)}
        onOpenChange={(open) => !open && setDeleteConfirmCluster(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Cluster</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete cluster "{deleteConfirmCluster?.name}"?
              This will remove the cluster assignment from {deleteConfirmCluster?.treeCount || 0} tree(s).
              The trees themselves will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteCluster}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Cluster
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
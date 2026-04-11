// src/pages/TreeManagement.tsx
// Key changes vs v1.0:
//  - handleAddTree now supports batch via onBatchSubmit prop
//  - QRCodeModal now receives allTrees for selection/batch printing
//  - ClusterManagement receives clusters with assignedUsers
//  - handleSync cleaned up
//  - Minor code tidying

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
  convertFirestoreTree as convertFirestoreTreeHelper,
  convertFirestoreCluster as convertFirestoreClusterHelper,
  normalizeHealthStatus,
  normalizeGrowthStage,
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
  // Users assigned to this cluster come from the users collection
  assignedUserIds?: string[];
}

// Farmer profile shape (minimal)
interface FarmerProfile {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  role?: string;
  clusterAssignment?: string; // cluster name
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
  const [farmers, setFarmers] = useState<FarmerProfile[]>([]);
  const [filters, setFilters] = useState<TreeFilter>(initialFilters);
  const [selectedTrees, setSelectedTrees] = useState<string[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [viewingTree, setViewingTree] = useState<Tree | null>(null);
  const [editingTree, setEditingTree] = useState<Tree | null>(null);
  const [editingCluster, setEditingCluster] = useState<Cluster | null>(null);
  const [qrModalTrees, setQrModalTrees] = useState<Tree[]>([]);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrShowAll, setQrShowAll] = useState(false);
  const [showAddTreeModal, setShowAddTreeModal] = useState(false);
  const [showAddClusterModal, setShowAddClusterModal] = useState(false);
  const [deleteConfirmTree, setDeleteConfirmTree] = useState<Tree | null>(null);
  const [deleteConfirmCluster, setDeleteConfirmCluster] = useState<Cluster | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const treesUnsubscribeRef = useRef<() => void>(() => {});
  const clustersUnsubscribeRef = useRef<() => void>(() => {});

  // Load farmId from user profile
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
    return () => {
      treesUnsubscribeRef.current();
      clustersUnsubscribeRef.current();
    };
  }, []);

  const convertFirestoreTree = (firestoreTree: FirestoreTree): Tree =>
    convertFirestoreTreeHelper({ id: firestoreTree.id, ...firestoreTree });

  const convertFirestoreCluster = useCallback(
    (firestoreCluster: FirestoreCluster): Cluster & { assignedUsers?: FarmerProfile[] } => {
      const treeCount = trees.filter((t) => t.cluster === firestoreCluster.name).length;
      const base = convertFirestoreClusterHelper(
        { id: firestoreCluster.id, ...firestoreCluster },
        treeCount
      );
      // Attach assigned farmers
      const assignedUsers = farmers.filter(
        (f) => f.clusterAssignment === firestoreCluster.name
      );
      return { ...base, assignedUsers };
    },
    [trees, farmers]
  );

  // Real-time listeners
  useEffect(() => {
    if (!farmId) return;

    treesUnsubscribeRef.current = firebaseService.getTrees(farmId, (snapshot) => {
      const firestoreTrees: FirestoreTree[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTrees(firestoreTrees.map(convertFirestoreTree));
      setLoading(false);
    });

    clustersUnsubscribeRef.current = firebaseService.getClusters(farmId, (snapshot) => {
      const firestoreClusters: FirestoreCluster[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setClusters(firestoreClusters.map((c) => convertFirestoreCluster(c)));
    });

    // Load farmers for the farm
    // NOTE: Replace with your actual user/farmer loading method
    // Example: firebaseService.getFarmers(farmId, (snapshot) => { ... })
  }, [farmId]);

  // Re-derive cluster assignedUsers whenever farmers or trees change
  useEffect(() => {
    if (clusters.length > 0 && farmers.length > 0) {
      setClusters((prev) =>
        prev.map((c) => ({
          ...c,
          assignedUsers: farmers.filter((f) => f.clusterAssignment === c.name),
        }))
      );
    }
  }, [farmers]);

  const clusterNames = useMemo(() => clusters.map((c) => c.name), [clusters]);

  // Stats
  const stats: TreeStats = useMemo(
    () => ({
      total: trees.length,
      healthy: trees.filter(
        (t) => t.healthStatus === "Healthy" || t.healthStatus === "healthy"
      ).length,
      warning: trees.filter(
        (t) => t.healthStatus === "Warning" || t.healthStatus === "warning"
      ).length,
      critical: trees.filter(
        (t) => t.healthStatus === "Critical" || t.healthStatus === "critical"
      ).length,
      flagged: trees.filter((t) => t.flagged).length,
      clusters: clusters.length,
    }),
    [trees, clusters]
  );

  // Filtered trees
  const filteredTrees = useMemo(() => {
    return trees.filter((tree) => {
      if (selectedCluster !== null && tree.cluster !== selectedCluster) return false;

      if (filters.search) {
        const s = filters.search.toLowerCase();
        const match =
          tree.id.toLowerCase().includes(s) ||
          tree.tree_id?.toLowerCase().includes(s) ||
          tree.tree_name?.toLowerCase().includes(s) ||
          tree.type?.toLowerCase().includes(s) ||
          tree.variety?.toLowerCase().includes(s) ||
          tree.cluster?.toLowerCase().includes(s);
        if (!match) return false;
      }

      if (
        filters.healthStatus !== "all" &&
        tree.healthStatus?.toLowerCase() !== filters.healthStatus.toLowerCase()
      ) {
        return false;
      }

      if (
        filters.growthStage !== "all" &&
        tree.growthStage?.toLowerCase() !== filters.growthStage.toLowerCase()
      ) {
        return false;
      }

      if (filters.cluster !== "all" && tree.cluster !== filters.cluster) return false;
      if (filters.flagged === "flagged" && !tree.flagged) return false;
      if (filters.flagged === "unflagged" && tree.flagged) return false;

      return true;
    });
  }, [trees, filters, selectedCluster]);

  // Handlers
  const handleSync = useCallback(async () => {
    if (!farmId) return;
    setSyncing(true);
    treesUnsubscribeRef.current();
    clustersUnsubscribeRef.current();
    setTimeout(() => {
      treesUnsubscribeRef.current = firebaseService.getTrees(farmId, (snapshot) => {
        setTrees(
          snapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() } as FirestoreTree))
            .map(convertFirestoreTree)
        );
      });
      clustersUnsubscribeRef.current = firebaseService.getClusters(farmId, (snapshot) => {
        setClusters(
          snapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() } as FirestoreCluster))
            .map((c) => convertFirestoreCluster(c))
        );
      });
      setSyncing(false);
      toast.success("Synced successfully");
    }, 100);
  }, [farmId]);

  const handleViewTree = useCallback((tree: Tree) => setViewingTree(tree), []);
  const handleEditTree = useCallback((tree: Tree) => {
    setEditingTree(tree);
    setShowAddTreeModal(true);
    setViewingTree(null);
  }, []);

  const handleGenerateQR = useCallback(
    (tree: Tree) => {
      setQrModalTrees([tree]);
      setQrShowAll(false);
      setShowQRModal(true);
    },
    []
  );

  const handleToggleFlag = useCallback(
    async (tree: Tree) => {
      if (!farmId) return;
      try {
        await firebaseService.flagTree(farmId, tree.id, !tree.flagged);
        toast.success(!tree.flagged ? "Tree flagged" : "Flag removed");
        setViewingTree(null);
      } catch {
        toast.error("Failed to update flag");
      }
    },
    [farmId]
  );

  const handleDeleteTree = useCallback((tree: Tree) => {
    setDeleteConfirmTree(tree);
    setViewingTree(null);
  }, []);

  const confirmDeleteTree = useCallback(async () => {
    if (!deleteConfirmTree || !farmId) return;
    try {
      await firebaseService.deleteTree(farmId, deleteConfirmTree.id);
      toast.success("Tree deleted");
      setDeleteConfirmTree(null);
    } catch {
      toast.error("Failed to delete tree");
    }
  }, [deleteConfirmTree, farmId]);

  // Single tree add/edit
  const handleAddTree = useCallback(
    async (data: TreeData) => {
      if (!farmId || !data.variety) return;
      if (editingTree) {
        const updates: TreeData = {
          ...(data.type && { type: data.type }),
          ...(data.variety && { variety: data.variety }),
          ...(data.healthStatus && { healthStatus: normalizeHealthStatus(data.healthStatus) }),
          ...(data.growthStage && { growthStage: normalizeGrowthStage(data.growthStage) }),
          cluster: data.cluster || undefined,
          notes: data.notes,
          location: data.location,
          ...(data.plantedDate && { plantedDate: data.plantedDate }),
          lastInspection: new Date(),
        };
        await firebaseService.updateTree(farmId, editingTree.id, updates);
        toast.success("Tree updated");
        setEditingTree(null);
      } else {
        const treeData = await treeNamingService.generateTreeData({
          farmId,
          variety: data.variety,
          additionalData: {
            type: data.type || "Mango",
            healthStatus: normalizeHealthStatus(data.healthStatus || "Healthy"),
            growthStage: normalizeGrowthStage(data.growthStage || "seedling"),
            cluster: data.cluster || undefined,
            flagged: false,
            notes: data.notes,
            location: data.location,
            plantedDate: data.plantedDate || new Date(),
          },
        });
        await firebaseService.addTree(farmId, treeData);
        toast.success("Tree added");
      }
    },
    [editingTree, farmId]
  );

  // Batch tree add
  const handleBatchAddTrees = useCallback(
    async (dataList: TreeData[]) => {
      if (!farmId) return;
      let added = 0;
      const errors: string[] = [];

      for (const data of dataList) {
        if (!data.variety) continue;
        try {
          const treeData = await treeNamingService.generateTreeData({
            farmId,
            variety: data.variety,
            additionalData: {
              type: data.type || "Mango",
              healthStatus: normalizeHealthStatus(data.healthStatus || "Healthy"),
              growthStage: normalizeGrowthStage(data.growthStage || "seedling"),
              cluster: data.cluster || undefined,
              flagged: false,
              notes: data.notes,
              location: data.location,
              plantedDate: data.plantedDate || new Date(),
            },
          });
          await firebaseService.addTree(farmId, treeData);
          added++;
        } catch (err: any) {
          errors.push(err.message || "Unknown error");
        }
      }

      if (added > 0) toast.success(`${added} tree${added !== 1 ? "s" : ""} added successfully`);
      if (errors.length > 0) toast.error(`${errors.length} tree${errors.length !== 1 ? "s" : ""} failed to add`);

      if (added === 0 && errors.length > 0) throw new Error("All trees failed to add");
    },
    [farmId]
  );

  // Bulk ops
  const handleBulkFlag = useCallback(
    async (flag: boolean) => {
      if (!farmId || !selectedTrees.length) return;
      try {
        for (const id of selectedTrees) await firebaseService.flagTree(farmId, id, flag);
        toast.success(`${selectedTrees.length} trees ${flag ? "flagged" : "unflagged"}`);
        setSelectedTrees([]);
      } catch {
        toast.error("Failed to update flags");
      }
    },
    [selectedTrees, farmId]
  );

  const handleBulkChangeCluster = useCallback(
    async (cluster: string) => {
      if (!farmId || !selectedTrees.length) return;
      if (cluster === "__new__") {
        setShowAddClusterModal(true);
        return;
      }
      try {
        await firebaseService.batchUpdateTreesCluster(farmId, selectedTrees, cluster);
        toast.success(`${selectedTrees.length} trees moved to ${cluster}`);
        setSelectedTrees([]);
      } catch {
        toast.error("Failed to change cluster");
      }
    },
    [selectedTrees, farmId]
  );

  const handleBulkDelete = useCallback(() => setShowBulkDeleteConfirm(true), []);

  const confirmBulkDelete = useCallback(async () => {
    if (!farmId || !selectedTrees.length) return;
    try {
      for (const id of selectedTrees) await firebaseService.deleteTree(farmId, id);
      toast.success(`${selectedTrees.length} trees deleted`);
      setSelectedTrees([]);
      setShowBulkDeleteConfirm(false);
    } catch {
      toast.error("Failed to delete trees");
    }
  }, [selectedTrees, farmId]);

  const handleBulkGenerateQR = useCallback(() => {
    const selected = trees.filter((t) => selectedTrees.includes(t.id));
    setQrModalTrees(selected);
    setQrShowAll(false);
    setShowQRModal(true);
  }, [selectedTrees, trees]);

  // Cluster ops
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
    } catch {
      toast.error("Failed to delete cluster");
    }
  }, [deleteConfirmCluster, farmId]);

  const handleSubmitCluster = useCallback(
    async (data: ClusterData) => {
      if (!farmId || !data.name) return;
      if (editingCluster) {
        await firebaseService.renameCluster(farmId, editingCluster.name, data.name);
        toast.success("Cluster renamed");
      } else {
        await firebaseService.addCluster(farmId, data.name);
        toast.success(`Cluster "${data.name}" created`);
      }
      setEditingCluster(null);
    },
    [editingCluster, farmId]
  );

  const handleGenerateClusterQR = useCallback(
    (cluster: Cluster) => {
      const clusterTrees = trees.filter((t) => t.cluster === cluster.name);
      setQrModalTrees(clusterTrees);
      setQrShowAll(false);
      setShowQRModal(true);
    },
    [trees]
  );

  if (loading && !farmId) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <Trees className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">Tree Management</h1>
            <p className="text-muted-foreground text-sm">
              {stats.total} trees · {clusters.length} clusters
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Upload className="mr-2 h-4 w-4" /> Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setQrModalTrees(trees);
              setQrShowAll(true);
              setShowQRModal(true);
            }}
          >
            Batch QR
          </Button>
          <Button onClick={() => setShowAddTreeModal(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Tree
          </Button>
        </div>
      </header>

      {/* Stats */}
      <TreeStatsCards stats={stats} />

      {/* Main layout */}
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <div className="space-y-4">
          <ClusterManagement
            clusters={clusters as any}
            selectedCluster={selectedCluster}
            onSelectCluster={setSelectedCluster}
            onCreateCluster={handleCreateCluster}
            onEditCluster={handleEditCluster}
            onDeleteCluster={handleDeleteCluster}
            onGenerateClusterQR={handleGenerateClusterQR}
          />
        </div>

        {/* Table area */}
        <div className="space-y-4">
          <Card className="shadow-soft">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  Tree Inventory
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({filteredTrees.length}
                    {filteredTrees.length !== trees.length && ` of ${trees.length}`})
                  </span>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSync}
                  disabled={syncing}
                >
                  <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
                  Sync
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <TreeFilters
                filters={filters}
                clusters={clusterNames}
                onFiltersChange={setFilters}
                onClearFilters={() => setFilters(initialFilters)}
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

      {/* Bulk Panel */}
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

      {/* QR Modal — passes allTrees for batch selection */}
      <QRCodeModal
        trees={qrModalTrees}
        allTrees={qrShowAll ? trees : undefined}
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
        onBatchSubmit={handleBatchAddTrees}
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

      {/* Delete Tree */}
      <AlertDialog
        open={Boolean(deleteConfirmTree)}
        onOpenChange={(open) => !open && setDeleteConfirmTree(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tree</AlertDialogTitle>
            <AlertDialogDescription>
              Delete{" "}
              <strong>{deleteConfirmTree?.tree_name || deleteConfirmTree?.id.slice(0, 8)}</strong>?
              This cannot be undone.
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

      {/* Delete Cluster */}
      <AlertDialog
        open={Boolean(deleteConfirmCluster)}
        onOpenChange={(open) => !open && setDeleteConfirmCluster(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Cluster</AlertDialogTitle>
            <AlertDialogDescription>
              Delete cluster <strong>"{deleteConfirmCluster?.name}"</strong>?{" "}
              {deleteConfirmCluster?.treeCount
                ? `${deleteConfirmCluster.treeCount} tree(s) will be unassigned but not deleted.`
                : "The trees will not be deleted."}
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

      {/* Bulk Delete */}
      <AlertDialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedTrees.length} Trees</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedTrees.length} trees. This cannot be undone.
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
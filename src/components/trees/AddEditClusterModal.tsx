// src/components/trees/AddEditClusterModal.tsx
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Cluster, ClusterData } from "@/types/tree.types";
import { Loader2 } from "lucide-react";

interface AddEditClusterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ClusterData) => Promise<void>;
  editingCluster?: Cluster | null;
  existingClusterNames?: string[];
}

export function AddEditClusterModal({
  open,
  onOpenChange,
  onSubmit,
  editingCluster,
  existingClusterNames = [],
}: AddEditClusterModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Reset form when modal opens/closes or editing cluster changes
  useEffect(() => {
    if (open) {
      if (editingCluster) {
        setName(editingCluster.name);
        setDescription(editingCluster.description || "");
        setLocation(editingCluster.location || "");
      } else {
        setName("");
        setDescription("");
        setLocation("");
      }
      setError("");
    }
  }, [open, editingCluster]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!name.trim()) {
      setError("Cluster name is required");
      return;
    }

    // Check for duplicate names (only when creating new or changing name)
    const trimmedName = name.trim();
    if (
      (!editingCluster || editingCluster.name !== trimmedName) &&
      existingClusterNames.includes(trimmedName)
    ) {
      setError("A cluster with this name already exists");
      return;
    }

    // Check for reserved name
    if (trimmedName.toLowerCase() === "default") {
      setError('"Default" is a reserved cluster name');
      return;
    }

    // Validate name format (alphanumeric and underscores)
    if (!/^[a-zA-Z0-9_\s]+$/.test(trimmedName)) {
      setError("Cluster name can only contain letters, numbers, spaces, and underscores");
      return;
    }

    try {
      setSubmitting(true);

      // ⚠️ Prepare data in Firestore format (matching Flutter)
      const clusterData: ClusterData = {
        name: trimmedName,
        description: description.trim() || undefined,
        location: location.trim() || undefined,
      };

      // Remove undefined values
      Object.keys(clusterData).forEach(key => {
        if (clusterData[key] === undefined) {
          delete clusterData[key];
        }
      });

      await onSubmit(clusterData);
      onOpenChange(false);
    } catch (err: any) {
      console.error("Error submitting cluster:", err);
      setError(err.message || "Failed to save cluster. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {editingCluster ? "Edit Cluster" : "Create New Cluster"}
            </DialogTitle>
            <DialogDescription>
              {editingCluster
                ? "Update the cluster information below."
                : "Create a new cluster to organize your trees."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cluster-name">
                Cluster Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cluster-name"
                placeholder="e.g., North Field, Block A, Section 1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={submitting}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Only letters, numbers, spaces, and underscores allowed. "Default" is reserved.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cluster-description">Description (Optional)</Label>
              <Textarea
                id="cluster-description"
                placeholder="Optional description or notes about this cluster"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={submitting}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cluster-location">Location (Optional)</Label>
              <Input
                id="cluster-location"
                placeholder="e.g., GPS coordinates, landmark reference"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={submitting}
              />
            </div>

            {/* Info Box for Editing */}
            {editingCluster && editingCluster.treeCount !== undefined && (
              <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                <div className="font-medium">Cluster Info:</div>
                <ul className="mt-1 list-inside list-disc">
                  <li>{editingCluster.treeCount} tree(s) in this cluster</li>
                  <li>Renaming will update all trees in this cluster</li>
                </ul>
              </div>
            )}

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Database Info Box */}
            <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-700 dark:bg-gray-900 dark:text-gray-300">
              <div className="font-medium">Database Information:</div>
              <ul className="mt-1 list-inside list-disc">
                <li>Stored in: <code>farms/{"{farmId}"}/clusters/{"{clusterName}"}</code></li>
                <li>Document ID = Cluster Name</li>
                <li>Timestamps are auto-generated</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingCluster ? "Update Cluster" : "Create Cluster"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
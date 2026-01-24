import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tree, HealthStatus, GrowthStage } from "@/types/tree.types";

interface AddTreeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clusters: string[];
  onSubmit: (data: Partial<Tree>) => void;
  editingTree?: Tree | null;
}

const treeTypes = [
  "Alphonso",
  "Kesar",
  "Langra",
  "Dasheri",
  "Totapuri",
  "Banganapalli",
  "Neelam",
  "Mallika",
  "Amrapali",
  "Chausa",
  "Other",
];

export function AddTreeModal({
  open,
  onOpenChange,
  clusters,
  onSubmit,
  editingTree,
}: AddTreeModalProps) {
  const [formData, setFormData] = useState<Partial<Tree>>(
    editingTree || {
      type: "",
      variety: "",
      healthStatus: "healthy",
      growthStage: "mature",
      cluster: "",
      notes: "",
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.type) {
      onSubmit(formData);
      setFormData({
        type: "",
        variety: "",
        healthStatus: "healthy",
        growthStage: "mature",
        cluster: "",
        notes: "",
      });
      onOpenChange(false);
    }
  };

  const isEditing = Boolean(editingTree);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {isEditing ? "Edit Tree" : "Add New Tree"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">Mango Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {treeTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="variety">Variety (optional)</Label>
              <Input
                id="variety"
                placeholder="e.g., Organic"
                value={formData.variety || ""}
                onChange={(e) =>
                  setFormData({ ...formData, variety: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Health Status</Label>
              <Select
                value={formData.healthStatus}
                onValueChange={(value) =>
                  setFormData({ ...formData, healthStatus: value as HealthStatus })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="healthy">Healthy</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Growth Stage</Label>
              <Select
                value={formData.growthStage}
                onValueChange={(value) =>
                  setFormData({ ...formData, growthStage: value as GrowthStage })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seedling">Seedling</SelectItem>
                  <SelectItem value="juvenile">Juvenile</SelectItem>
                  <SelectItem value="mature">Mature</SelectItem>
                  <SelectItem value="flowering">Flowering</SelectItem>
                  <SelectItem value="fruiting">Fruiting</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cluster</Label>
            <Select
              value={formData.cluster || ""}
              onValueChange={(value) =>
                setFormData({ ...formData, cluster: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Assign to cluster (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No Cluster</SelectItem>
                {clusters.map((cluster) => (
                  <SelectItem key={cluster} value={cluster}>
                    {cluster}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes about this tree..."
              value={formData.notes || ""}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.type}>
              {isEditing ? "Save Changes" : "Add Tree"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Layers, X } from 'lucide-react';
import type { UserAccount, UserRole } from '@/types/user.types';

interface Cluster {
  id: string;
  name: string;
  treeCount?: number;
  farmerName?: string; // farmer currently assigned to this cluster
}

interface AddEditUserDialogProps {
  user: UserAccount | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (user: Partial<UserAccount>) => void;
  clusters: Cluster[];
  mode: 'add' | 'edit';
}

export function AddEditUserDialog({
  user,
  open,
  onOpenChange,
  onSave,
  clusters,
  mode,
}: AddEditUserDialogProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('farmer');
  const [selectedClusters, setSelectedClusters] = useState<string[]>([]);

  useEffect(() => {
    if (user && mode === 'edit') {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setRole(user.role || 'farmer');
      setSelectedClusters(user.assignedClusters || []);
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setRole('farmer');
      setSelectedClusters([]);
    }
  }, [user, mode, open]);

  const handleSubmit = () => {
    if (!name.trim() || !email.trim()) return;
    onSave({
      id: user?.id,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      role,
      assignedClusters: selectedClusters,
    });
    onOpenChange(false);
  };

  const toggleCluster = (clusterId: string) => {
    setSelectedClusters((prev) =>
      prev.includes(clusterId)
        ? prev.filter((c) => c !== clusterId)
        : [...prev, clusterId]
    );
  };

  const removeCluster = (clusterId: string) => {
    setSelectedClusters((prev) => prev.filter((c) => c !== clusterId));
  };

  const isFormValid = name.trim() && email.trim();

  const selectedClusterObjects = clusters.filter((c) => selectedClusters.includes(c.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add New User' : 'Edit User'}</DialogTitle>
          <DialogDescription>
            {mode === 'add'
              ? 'Create a user account and assign clusters'
              : 'Update user information and cluster assignments'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="name" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Juan dela Cruz"
                className="h-9"
              />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="juan@example.com"
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Phone
              </Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+63 9XX XXX XXXX"
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Role
              </Label>
              <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="manager">Farm Manager</SelectItem>
                  <SelectItem value="farmer">Farmer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Cluster assignment */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Assign Clusters
              </Label>
              {selectedClusters.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {selectedClusters.length} selected
                </span>
              )}
            </div>

            {/* Selected cluster chips */}
            {selectedClusterObjects.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedClusterObjects.map((cluster) => (
                  <Badge
                    key={cluster.id}
                    variant="secondary"
                    className="gap-1 pr-1 text-xs"
                  >
                    <Layers className="h-3 w-3" />
                    {cluster.name}
                    <button
                      onClick={() => removeCluster(cluster.id)}
                      className="ml-0.5 rounded hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <div className="max-h-44 overflow-y-auto rounded-lg border">
              {clusters.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <Layers className="mb-2 h-6 w-6 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No clusters available</p>
                </div>
              ) : (
                <div className="divide-y">
                  {clusters.map((cluster) => {
                    const isSelected = selectedClusters.includes(cluster.id);
                    const hasOtherFarmer =
                      cluster.farmerName &&
                      (!user || cluster.farmerName !== user.name);

                    return (
                      <label
                        key={cluster.id}
                        htmlFor={`cluster-${cluster.id}`}
                        className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/50 ${
                          isSelected ? 'bg-primary/5' : ''
                        }`}
                      >
                        <Checkbox
                          id={`cluster-${cluster.id}`}
                          checked={isSelected}
                          onCheckedChange={() => toggleCluster(cluster.id)}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{cluster.name}</span>
                            {cluster.treeCount !== undefined && (
                              <span className="text-xs text-muted-foreground">
                                {cluster.treeCount} trees
                              </span>
                            )}
                          </div>
                          {hasOtherFarmer && (
                            <p className="text-xs text-amber-600">
                              Currently: {cluster.farmerName}
                            </p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isFormValid}>
            {mode === 'add' ? 'Create User' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
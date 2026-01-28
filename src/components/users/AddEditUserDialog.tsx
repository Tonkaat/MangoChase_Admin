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
import type { UserAccount, UserRole } from '@/types/user.types';

interface AddEditUserDialogProps {
  user: UserAccount | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (user: Partial<UserAccount>) => void;
  farms: { id: string; name: string }[];
  mode: 'add' | 'edit';
}

export function AddEditUserDialog({
  user,
  open,
  onOpenChange,
  onSave,
  farms,
  mode,
}: AddEditUserDialogProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('farmer');
  const [selectedFarms, setSelectedFarms] = useState<string[]>([]);

  useEffect(() => {
    if (user && mode === 'edit') {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setRole(user.role || 'farmer');
      setSelectedFarms(user.assignedFarms || []);
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setRole('farmer');
      setSelectedFarms([]);
    }
  }, [user, mode, open]);

  const handleSubmit = () => {
    if (!name.trim() || !email.trim()) {
      return;
    }
    
    onSave({
      id: user?.id,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      role,
      assignedFarms: selectedFarms,
    });
    onOpenChange(false);
  };

  const toggleFarm = (farmId: string) => {
    setSelectedFarms((prev) =>
      prev.includes(farmId) ? prev.filter((f) => f !== farmId) : [...prev, farmId]
    );
  };

  const isFormValid = name.trim() && email.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add New User' : 'Edit User'}</DialogTitle>
          <DialogDescription>
            {mode === 'add'
              ? 'Create a new user account and assign farms'
              : 'Update user information and farm assignments'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter full name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+63 XXX XXX XXXX"
            />
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrator</SelectItem>
                <SelectItem value="manager">Farm Manager</SelectItem>
                <SelectItem value="farmer">Farmer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Assign Farms</Label>
            <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border p-3">
              {farms.length === 0 ? (
                <p className="text-sm text-muted-foreground">No farms available</p>
              ) : (
                farms.map((farm) => (
                  <div key={farm.id} className="flex items-center gap-2">
                    <Checkbox
                      id={farm.id}
                      checked={selectedFarms.includes(farm.id)}
                      onCheckedChange={() => toggleFarm(farm.id)}
                    />
                    <label htmlFor={farm.id} className="text-sm">
                      {farm.name || 'Unnamed Farm'}
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
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
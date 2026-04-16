import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserManagement } from '@/hooks/useUserManagement';
import { UserStatsCards } from '@/components/users/UserStatsCards';
import { UserTable } from '@/components/users/UserTable';
import { UserDetailsDialog } from '@/components/users/UserDetailsDialog';
import { AddEditUserDialog } from '@/components/users/AddEditUserDialog';
import { UserActivityLog } from '@/components/users/UserActivityLog';
import { SuspendUserDialog } from '@/components/users/SuspendUserDialog';
import type { UserAccount } from '@/types/user.types';
import { Users, Activity, Shield, Info } from 'lucide-react';
import { toast } from 'sonner';

import { FarmerVerificationTab } from '@/components/board/FarmerVerificationTab';

export default function UserManagement() {
  const {
    users,
    activities,
    clusters,
    loading,
    updateUser,
    deleteUser,
    suspendUser,
    reactivateUser,
  } = useUserManagement();

  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);

  const handleView = (user: UserAccount) => {
    setSelectedUser(user);
    setViewDialogOpen(true);
  };

  const handleEdit = (user: UserAccount) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleSave = async (userData: Partial<UserAccount>) => {
    if (userData.id) {
      await updateUser(userData.id, userData);
      toast.success('User updated successfully');
    }
  };

  const handleDelete = async (user: UserAccount) => {
    if (confirm(`Are you sure you want to remove ${user.name}? This will deactivate their account.`)) {
      await deleteUser(user.id);
      toast.success(`${user.name}'s account deactivated`);
    }
  };

  const handleSuspend = (user: UserAccount) => {
    setSelectedUser(user);
    setSuspendDialogOpen(true);
  };

  const handleConfirmSuspend = async (reason: string) => {
    if (selectedUser) {
      await suspendUser(selectedUser.id, reason);
      toast.success(`${selectedUser.name}'s account suspended`);
    }
  };

  const handleReactivate = async (user: UserAccount) => {
    await reactivateUser(user.id);
    toast.success(`${user.name}'s account reactivated`);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <header>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight">User Management</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Manage farm users, roles, and cluster assignments
              </p>
            </div>
          </div>
        </div>

        {/* Join code hint banner */}
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            New farmers join using their invite code in the mobile app — no manual user creation needed.
          </span>
        </div>
      </header>

      {/* Stats overview */}
      <UserStatsCards users={users} loading={loading} />

      {/* Tabs */}
      <Tabs defaultValue="accounts" className="space-y-6">
        <TabsList className="h-9 gap-1 p-1">
          <TabsTrigger value="accounts" className="h-7 gap-1.5 px-3 text-xs">
            <Users className="h-3.5 w-3.5" />
            Accounts
          </TabsTrigger>
          <TabsTrigger value="verification" className="h-7 gap-1.5 px-3 text-xs">
            <Shield className="h-3.5 w-3.5" />
            Verification
          </TabsTrigger>
          <TabsTrigger value="activity" className="h-7 gap-1.5 px-3 text-xs">
            <Activity className="h-3.5 w-3.5" />
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="accounts">
          <UserTable
            users={users}
            loading={loading}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onSuspend={handleSuspend}
            onReactivate={handleReactivate}
          />
        </TabsContent>

        <TabsContent value="verification">
          <FarmerVerificationTab />
        </TabsContent>

        <TabsContent value="activity">
          <UserActivityLog activities={activities} loading={loading} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <UserDetailsDialog
        user={selectedUser}
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        clusters={clusters}
      />

      <AddEditUserDialog
        user={selectedUser}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleSave}
        clusters={clusters}
        mode="edit"
      />

      <SuspendUserDialog
        user={selectedUser}
        open={suspendDialogOpen}
        onOpenChange={setSuspendDialogOpen}
        onConfirm={handleConfirmSuspend}
      />
    </div>
  );
}
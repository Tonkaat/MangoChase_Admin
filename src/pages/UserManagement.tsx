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
import { Users, Activity, Shield } from 'lucide-react';
import { toast } from 'sonner';

// Import farmer verification components from board
import { FarmerVerificationTab } from '@/components/board/FarmerVerificationTab';

export default function UserManagement() {
  const {
    users,
    activities,
    farms,
    loading,
    addUser,
    updateUser,
    deleteUser,
    suspendUser,
    reactivateUser,
  } = useUserManagement();

  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);

  const handleView = (user: UserAccount) => {
    setSelectedUser(user);
    setViewDialogOpen(true);
  };

  const handleEdit = (user: UserAccount) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedUser(null);
    setAddDialogOpen(true);
  };

  const handleSave = async (userData: Partial<UserAccount>) => {
    if (userData.id) {
      await updateUser(userData.id, userData);
      toast.success('User updated successfully');
    } else {
      await addUser(userData);
      toast.success('User created successfully');
    }
  };

  const handleDelete = async (user: UserAccount) => {
    if (confirm(`Are you sure you want to delete ${user.name}?`)) {
      await deleteUser(user.id);
      toast.success('User deleted successfully');
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
      <header>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">Mango Users</h1>
            <p className="text-muted-foreground">
              Seb the discord mod and his lolicon army
            </p>
          </div>
        </div>
      </header>

      <UserStatsCards users={users} loading={loading} />

      <Tabs defaultValue="accounts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 gap-2 sm:w-auto sm:flex sm:gap-1">
          <TabsTrigger value="accounts" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Accounts</span>
          </TabsTrigger>
          <TabsTrigger value="verification" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Verification</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Activity</span>
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
            onAdd={handleAdd}
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
        farms={farms}
      />

      <AddEditUserDialog
        user={selectedUser}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleSave}
        farms={farms}
        mode="edit"
      />

      <AddEditUserDialog
        user={null}
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSave={handleSave}
        farms={farms}
        mode="add"
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

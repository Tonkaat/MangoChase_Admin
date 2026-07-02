import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { UserAccount, UserRole } from '@/types/user.types';
import { ROLE_CONFIG, VERIFICATION_TIER_CONFIG } from '@/types/user.types';
import {
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  UserX,
  RefreshCw,
  Shield,
  Star,
  Users,
  X,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface UserTableProps {
  users: UserAccount[];
  loading: boolean;
  onView: (user: UserAccount) => void;
  onEdit: (user: UserAccount) => void;
  onDelete: (user: UserAccount) => void;
  onSuspend: (user: UserAccount) => void;
  onReactivate: (user: UserAccount) => void;
}

const getRoleConfig = (role: string) => {
  const normalizedRole = role?.toLowerCase().trim();
  if (normalizedRole === 'admin' || normalizedRole === 'manager' || normalizedRole === 'farmer') {
    return ROLE_CONFIG[normalizedRole];
  }
  return ROLE_CONFIG.farmer;
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const AVATAR_COLORS = [
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-sky-100 text-sky-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-teal-100 text-teal-700',
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function UserTable({
  users,
  loading,
  onView,
  onEdit,
  onDelete,
  onSuspend,
  onReactivate,
}: UserTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const hasActiveFilters = searchQuery || roleFilter !== 'all' || statusFilter !== 'all';

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return users.filter((user) => {
      const matchesSearch =
        !q ||
        user.name?.toLowerCase().includes(q) ||
        user.email?.toLowerCase().includes(q);
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const clearFilters = () => {
    setSearchQuery('');
    setRoleFilter('all');
    setStatusFilter('all');
  };

  const getTierBadge = (tier?: 'basic' | 'verified' | 'trusted') => {
    if (!tier) return null;
    const config = VERIFICATION_TIER_CONFIG[tier] ?? VERIFICATION_TIER_CONFIG.basic;
    const Icon = tier === 'trusted' ? Star : tier === 'verified' ? Shield : Users;
    return (
      <Badge variant="outline" className="gap-1 text-xs font-normal">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        );
      case 'suspended':
        return (
          <span className="flex items-center gap-1.5 text-sm text-destructive">
            <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
            Suspended
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
            Inactive
          </span>
        );
    }
  };

  if (loading) {
    return (
      <Card className="shadow-soft">
        <CardHeader>
          <Skeleton className="h-6 w-36" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold">All Users</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {filteredUsers.length} of {users.length} users
            </p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as UserRole | 'all')}>
              <SelectTrigger className="h-9 w-[130px] text-sm">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="farmer">Farmer</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-[130px] text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-9 gap-1.5 px-3 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16">
            <Users className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium text-muted-foreground">
              {hasActiveFilters ? 'No users match your filters' : 'No users yet'}
            </p>
            {hasActiveFilters && (
              <Button variant="link" onClick={clearFilters} className="mt-1 h-auto p-0 text-xs">
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    User
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Role
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Cluster
                  </TableHead>
                  {/* <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Verification
                  </TableHead> */}
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Last Active
                  </TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const roleConfig = getRoleConfig(user.role);
                  const initials = getInitials(user.name || '?');
                  const avatarColor = getAvatarColor(user.name || '');

                  return (
                    <TableRow
                      key={user.id}
                      className="cursor-pointer"
                      onClick={() => onView(user)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            {user.avatarUrl ? (
                              <img src={user.avatarUrl} alt={user.name} />
                            ) : (
                              <AvatarFallback
                                className={`text-xs font-medium ${avatarColor}`}
                              >
                                {initials}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{user.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${roleConfig.color} text-xs font-normal`}>
                          {roleConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.assignedClusters && user.assignedClusters.length > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm">
                              {user.assignedClusters.length} cluster
                              {user.assignedClusters.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      {/* <TableCell>
                        {user.role === 'farmer' ? getTierBadge(user.verificationTier) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell> */}
                      <TableCell>{getStatusIndicator(user.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.lastActivityAt
                          ? formatDistanceToNow(user.lastActivityAt, { addSuffix: true })
                          : 'Never'}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onView(user)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(user)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.status === 'suspended' ? (
                              <DropdownMenuItem onClick={() => onReactivate(user)}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Reactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => onSuspend(user)}
                                className="text-orange-600"
                              >
                                <UserX className="mr-2 h-4 w-4" />
                                Suspend
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => onDelete(user)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
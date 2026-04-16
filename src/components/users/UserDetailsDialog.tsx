import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { UserAccount, UserRole } from '@/types/user.types';
import { ROLE_CONFIG, VERIFICATION_TIER_CONFIG } from '@/types/user.types';
import {
  Mail,
  Phone,
  Calendar,
  Shield,
  Star,
  Users,
  Layers,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface Cluster {
  id: string;
  name: string;
  treeCount?: number;
}

interface UserDetailsDialogProps {
  user: UserAccount | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clusters: Cluster[];
}

const getRoleConfig = (role: string) => {
  const normalizedRole = role?.toLowerCase().trim();
  if (normalizedRole === 'admin' || normalizedRole === 'manager' || normalizedRole === 'farmer') {
    return ROLE_CONFIG[normalizedRole];
  }
  return ROLE_CONFIG.farmer;
};

const getTierConfig = (tier?: string) => {
  if (!tier) return null;
  if (tier === 'basic' || tier === 'verified' || tier === 'trusted') {
    return VERIFICATION_TIER_CONFIG[tier];
  }
  return VERIFICATION_TIER_CONFIG.basic;
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

export function UserDetailsDialog({ user, open, onOpenChange, clusters }: UserDetailsDialogProps) {
  if (!user) return null;

  const roleConfig = getRoleConfig(user.role);
  const tierConfig = getTierConfig(user.verificationTier);
  const TierIcon =
    user.verificationTier === 'trusted'
      ? Star
      : user.verificationTier === 'verified'
        ? Shield
        : Users;

  const assignedClusterObjects = user.assignedClusters
    ? user.assignedClusters
        .map((cId) => clusters.find((c) => c.id === cId))
        .filter(Boolean) as Cluster[]
    : [];

  const initials = getInitials(user.name || '?');
  const avatarColor = getAvatarColor(user.name || '');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="pb-0">
          {/* User identity hero */}
          <div className="mb-4 flex items-center gap-4">
            <Avatar className="h-14 w-14">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} />
              ) : (
                <AvatarFallback className={`text-base font-semibold ${avatarColor}`}>
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <DialogTitle className="text-xl">{user.name || 'Unnamed User'}</DialogTitle>
              <DialogDescription className="mt-0.5">{user.email}</DialogDescription>
            </div>
          </div>

          {/* Status badges */}
          <div className="flex flex-wrap gap-2">
            <Badge className={`${roleConfig.color} text-xs`}>{roleConfig.label}</Badge>
            {tierConfig && (
              <Badge className={`${tierConfig.color} gap-1 text-xs`}>
                <TierIcon className="h-3 w-3" />
                {tierConfig.label}
              </Badge>
            )}
            <Badge
              className={
                user.status === 'active'
                  ? 'bg-emerald-100 text-emerald-700 text-xs'
                  : user.status === 'suspended'
                    ? 'bg-destructive/15 text-destructive text-xs'
                    : 'bg-muted text-muted-foreground text-xs'
              }
            >
              {user.status === 'active' && <CheckCircle className="mr-1 h-3 w-3" />}
              {user.status === 'suspended' && <XCircle className="mr-1 h-3 w-3" />}
              {user.status
                ? user.status.charAt(0).toUpperCase() + user.status.slice(1)
                : 'Unknown'}
            </Badge>
          </div>
        </DialogHeader>

        <div className="mt-2 space-y-5">
          {/* Contact details */}
          <div className="rounded-xl bg-muted/40 p-4 space-y-2.5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Contact
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 text-sm">
                <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span>{user.email || 'No email'}</span>
              </div>
              {user.phone && (
                <div className="flex items-center gap-2.5 text-sm">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span>{user.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2.5 text-sm">
                <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span>
                  Joined{' '}
                  {user.createdAt ? format(user.createdAt, 'MMMM d, yyyy') : 'Unknown date'}
                </span>
              </div>
              {user.lastActivityAt && (
                <div className="flex items-center gap-2.5 text-sm">
                  <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span>
                    Last active {formatDistanceToNow(user.lastActivityAt, { addSuffix: true })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Assigned clusters */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Assigned Clusters
              </p>
              {assignedClusterObjects.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {assignedClusterObjects.length} cluster
                  {assignedClusterObjects.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            {assignedClusterObjects.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {assignedClusterObjects.map((cluster) => (
                  <div
                    key={cluster.id}
                    className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2"
                  >
                    <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{cluster.name}</p>
                      {cluster.treeCount !== undefined && (
                        <p className="text-xs text-muted-foreground">
                          {cluster.treeCount} trees
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-2.5">
                <Layers className="h-3.5 w-3.5 text-muted-foreground/50" />
                <span className="text-sm text-muted-foreground">No clusters assigned</span>
              </div>
            )}
          </div>

          {/* Role permissions */}
          <div className="rounded-xl bg-muted/40 p-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {roleConfig.label} Permissions
            </p>
            <ul className="space-y-1.5">
              {roleConfig.permissions.map((p) => (
                <li key={p} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-3 w-3 shrink-0 text-emerald-500" />
                  {p.replace(/_/g, ' ')}
                </li>
              ))}
            </ul>
          </div>

          {/* Tier privileges */}
          {tierConfig && (
            <div className="rounded-xl bg-muted/40 p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {tierConfig.label} Privileges
              </p>
              <ul className="space-y-1.5">
                {tierConfig.privileges.map((p, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-3 w-3 shrink-0 text-emerald-500" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suspension notice */}
          {user.status === 'suspended' && user.suspendedReason && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
              <div className="mb-1.5 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <p className="text-sm font-medium text-destructive">Account Suspended</p>
              </div>
              <p className="text-sm text-muted-foreground">{user.suspendedReason}</p>
              {user.suspendedAt && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Since {format(user.suspendedAt, 'MMMM d, yyyy')}
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
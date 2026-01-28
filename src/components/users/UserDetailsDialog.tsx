import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { UserAccount, UserRole } from '@/types/user.types';
import { ROLE_CONFIG, VERIFICATION_TIER_CONFIG } from '@/types/user.types';
import {
  Mail,
  Phone,
  Calendar,
  Shield,
  Star,
  Users,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface UserDetailsDialogProps {
  user: UserAccount | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  farms: { id: string; name: string }[];
}

// Helper function to safely get role config
const getRoleConfig = (role: string) => {
  const normalizedRole = role?.toLowerCase().trim();
  if (normalizedRole === 'admin' || normalizedRole === 'manager' || normalizedRole === 'farmer') {
    return ROLE_CONFIG[normalizedRole];
  }
  return ROLE_CONFIG.farmer;
};

// Helper function to safely get tier config
const getTierConfig = (tier?: string) => {
  if (!tier) return null;
  if (tier === 'basic' || tier === 'verified' || tier === 'trusted') {
    return VERIFICATION_TIER_CONFIG[tier];
  }
  return VERIFICATION_TIER_CONFIG.basic;
};

export function UserDetailsDialog({ user, open, onOpenChange, farms }: UserDetailsDialogProps) {
  if (!user) return null;

  const roleConfig = getRoleConfig(user.role);
  const tierConfig = getTierConfig(user.verificationTier);
  const TierIcon = 
    user.verificationTier === 'trusted' 
      ? Star 
      : user.verificationTier === 'verified' 
        ? Shield 
        : Users;

  const assignedFarmNames = user.assignedFarms
    ? user.assignedFarms
        .map((fId) => farms.find((f) => f.id === fId)?.name)
        .filter(Boolean)
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{user.name || 'Unnamed User'}</DialogTitle>
          <DialogDescription>User profile and account details</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status badges */}
          <div className="flex flex-wrap gap-2">
            <Badge className={roleConfig.color}>{roleConfig.label}</Badge>
            {tierConfig && (
              <Badge className={tierConfig.color}>
                <TierIcon className="mr-1 h-3 w-3" />
                {tierConfig.label}
              </Badge>
            )}
            <Badge
              className={
                user.status === 'active'
                  ? 'bg-secondary/20 text-secondary'
                  : user.status === 'suspended'
                    ? 'bg-destructive/20 text-destructive'
                    : 'bg-muted text-muted-foreground'
              }
            >
              {user.status === 'active' && <CheckCircle className="mr-1 h-3 w-3" />}
              {user.status === 'suspended' && <XCircle className="mr-1 h-3 w-3" />}
              {user.status ? user.status.charAt(0).toUpperCase() + user.status.slice(1) : 'Unknown'}
            </Badge>
          </div>

          {/* Contact info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              {user.email || 'No email'}
            </div>
            {user.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                {user.phone}
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Joined {user.createdAt ? format(user.createdAt, 'MMMM d, yyyy') : 'Unknown date'}
            </div>
            {user.lastActivityAt && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Last active {formatDistanceToNow(user.lastActivityAt, { addSuffix: true })}
              </div>
            )}
          </div>

          {/* Assigned farms */}
          {assignedFarmNames.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">Assigned Farms</p>
              <div className="flex flex-wrap gap-2">
                {assignedFarmNames.map((name) => (
                  <Badge key={name} variant="outline" className="gap-1">
                    <MapPin className="h-3 w-3" />
                    {name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Role permissions */}
          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm font-medium">{roleConfig.label} Permissions</p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {roleConfig.permissions.map((p) => (
                <li key={p} className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-secondary" />
                  {p.replace(/_/g, ' ')}
                </li>
              ))}
            </ul>
          </div>

          {/* Tier privileges for farmers */}
          {tierConfig && (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm font-medium">{tierConfig.label} Tier Privileges</p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {tierConfig.privileges.map((p, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-secondary" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suspension info */}
          {user.status === 'suspended' && user.suspendedReason && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
              <p className="text-sm font-medium text-destructive">Suspension Reason</p>
              <p className="mt-1 text-sm text-muted-foreground">{user.suspendedReason}</p>
              {user.suspendedAt && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Suspended on {format(user.suspendedAt, 'MMMM d, yyyy')}
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
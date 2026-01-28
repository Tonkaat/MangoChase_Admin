// User & Role Management Types

export type UserRole = 'admin' | 'manager' | 'farmer';

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  status: 'active' | 'inactive' | 'suspended';
  avatarUrl?: string;
  assignedFarms: string[];
  verificationTier?: 'basic' | 'verified' | 'trusted';
  verificationStatus?: 'pending' | 'approved' | 'rejected' | 'suspended';
  verificationNotes?: string;
  verifiedAt?: Date;
  verifiedBy?: string;
  suspendedAt?: Date;
  suspendedReason?: string;
  lastLoginAt?: Date;
  lastActivityAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserActivity {
  id: string;
  userId: string;
  userName: string;
  action: 'login' | 'logout' | 'create' | 'update' | 'delete' | 'view' | 'export';
  resource: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export interface FarmAssignment {
  userId: string;
  farmId: string;
  farmName: string;
  role: 'owner' | 'manager' | 'worker';
  assignedAt: Date;
  assignedBy: string;
}

export const ROLE_CONFIG: Record<UserRole, {
  label: string;
  description: string;
  color: string;
  permissions: string[];
}> = {
  admin: {
    label: 'Administrator',
    description: 'Full system access and management',
    color: 'bg-primary text-primary-foreground',
    permissions: ['manage_users', 'manage_farms', 'manage_settings', 'view_analytics', 'export_data', 'approve_content'],
  },
  manager: {
    label: 'Farm Manager',
    description: 'Manage assigned farms and workers',
    color: 'bg-secondary text-secondary-foreground',
    permissions: ['manage_assigned_farms', 'manage_workers', 'view_analytics', 'create_tasks'],
  },
  farmer: {
    label: 'Farmer',
    description: 'Access to assigned farm operations',
    color: 'bg-muted text-muted-foreground',
    permissions: ['view_assigned_farms', 'complete_tasks', 'create_posts', 'view_market_prices'],
  },
};

export const VERIFICATION_TIER_CONFIG: Record<'basic' | 'verified' | 'trusted', {
  label: string;
  description: string;
  color: string;
  privileges: string[];
}> = {
  basic: {
    label: 'Basic',
    description: 'New farmer with limited privileges',
    color: 'bg-muted text-muted-foreground',
    privileges: ['View posts', 'View market prices', 'Create basic posts'],
  },
  verified: {
    label: 'Verified',
    description: 'Identity verified by admin',
    color: 'bg-secondary text-secondary-foreground',
    privileges: ['All basic privileges', 'Create trade listings', 'Report disease alerts', 'Access surplus declarations'],
  },
  trusted: {
    label: 'Trusted',
    description: 'Long-standing verified farmer with excellent track record',
    color: 'bg-primary text-primary-foreground',
    privileges: ['All verified privileges', 'Pin community posts', 'Update market prices', 'Mentor new farmers'],
  },
};

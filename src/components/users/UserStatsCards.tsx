import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserAccount } from '@/types/user.types';
import { Users, UserCheck, Shield, UserX, Clock } from 'lucide-react';

interface UserStatsCardsProps {
  users: UserAccount[];
  loading: boolean;
}

export function UserStatsCards({ users, loading }: UserStatsCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  const totalUsers = users.length || 0;
  const admins = users.filter((u) => u.role === 'admin').length || 0;
  const managers = users.filter((u) => u.role === 'manager').length || 0;
  const farmers = users.filter((u) => u.role === 'farmer').length || 0;
  const suspended = users.filter((u) => u.status === 'suspended').length || 0;
  const pendingVerification = users.filter(
    (u) => u.role === 'farmer' && u.verificationStatus === 'pending'
  ).length || 0;

  const stats = [
    { label: 'Total Users', value: totalUsers, icon: Users, color: 'bg-primary/10 text-primary' },
    { label: 'Admins', value: admins, icon: Shield, color: 'bg-destructive/10 text-destructive' },
    { label: 'Managers', value: managers, icon: UserCheck, color: 'bg-secondary/10 text-secondary' },
    { label: 'Farmers', value: farmers, icon: Users, color: 'bg-accent text-accent-foreground' },
    { label: 'Pending', value: pendingVerification, icon: Clock, color: 'bg-orange-100 text-orange-600' },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {stats.map(({ label, value, icon: Icon, color }) => (
        <Card key={label} className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2.5 ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
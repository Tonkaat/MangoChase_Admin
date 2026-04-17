import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserAccount } from '@/types/user.types';
import { Users, UserCheck, Shield, Clock, Layers } from 'lucide-react';

interface UserStatsCardsProps {
  users: UserAccount[];
  loading: boolean;
}

export function UserStatsCards({ users, loading }: UserStatsCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const totalUsers = users.length;
  const admins = users.filter((u) => u.role === 'admin').length;
  // const managers = users.filter((u) => u.role === 'manager').length;
  const farmers = users.filter((u) => u.role === 'farmer').length;
  // const pendingVerification = users.filter(
  //   (u) => u.role === 'farmer' && u.verificationStatus === 'pending'
  // ).length;

  const stats = [
    {
      label: 'Total Users',
      value: totalUsers,
      icon: Users,
      iconClass: 'text-violet-600',
      bgClass: 'bg-violet-50',
    },
    {
      label: 'Admins',
      value: admins,
      icon: Shield,
      iconClass: 'text-rose-600',
      bgClass: 'bg-rose-50',
    },
    // {
    //   label: 'Managers',
    //   value: managers,
    //   icon: UserCheck,
    //   iconClass: 'text-sky-600',
    //   bgClass: 'bg-sky-50',
    // },
    {
      label: 'Farmers',
      value: farmers,
      icon: Layers,
      iconClass: 'text-emerald-600',
      bgClass: 'bg-emerald-50',
    },
    // {
    //   label: 'Pending',
    //   value: pendingVerification,
    //   icon: Clock,
    //   iconClass: 'text-amber-600',
    //   bgClass: 'bg-amber-50',
    // },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map(({ label, value, icon: Icon, iconClass, bgClass }) => (
        <Card key={label} className="shadow-soft border-0 bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2 ${bgClass}`}>
                <Icon className={`h-4 w-4 ${iconClass}`} />
              </div>
              <div>
                <p className="text-xl font-semibold leading-none">{value}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
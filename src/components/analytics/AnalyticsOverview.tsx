import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { OverallStats } from '@//types/analytics.types';
import { Trees, Leaf, TrendingUp, Heart, Users, ClipboardList } from 'lucide-react';

interface AnalyticsOverviewProps {
  stats: OverallStats;
  loading: boolean;
}

const statCards = [
  // { key: 'totalFarms', label: 'Total Farms', icon: Leaf, format: (v: number) => v.toString() },
  { key: 'totalTrees', label: 'Total Trees', icon: Trees, format: (v: number) => v.toLocaleString() },
  // { key: 'totalYield', label: 'Total Yield (kg)', icon: TrendingUp, format: (v: number) => v.toLocaleString() },
  { key: 'averageHealth', label: 'Avg Health', icon: Heart, format: (v: number) => `${v}%` },
  { key: 'activeFarmers', label: 'Active Farmers', icon: Users, format: (v: number) => v.toString() },
  // { key: 'pendingTasks', label: 'Pending Tasks', icon: ClipboardList, format: (v: number) => v.toString() },
] as const;

export function AnalyticsOverview({ stats, loading }: AnalyticsOverviewProps) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
      {statCards.map(({ key, label, icon: Icon, format }) => (
        <Card key={key} className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2.5">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold">{format(stats[key])}</p>
                <p className="truncate text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ClusterPerformance } from '@/types/analytics.types'; 
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ClusterPerformanceTableProps {
  data: ClusterPerformance[];
  loading: boolean;
}

export function ClusterPerformanceTable({ data, loading }: ClusterPerformanceTableProps) {
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-secondary" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getHealthColor = (percentage: number) => {
    if (percentage >= 85) return 'bg-secondary';
    if (percentage >= 70) return 'bg-primary';
    return 'bg-destructive';
  };

  if (loading) {
    return (
      <Card className="shadow-soft">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="text-base">Cluster Performance Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cluster</TableHead>
              {/* <TableHead>Farm</TableHead> */}
              <TableHead className="text-center">Trees</TableHead>
              <TableHead>Health</TableHead>
              {/* <TableHead className="text-right">Yield/Tree</TableHead>
              <TableHead className="text-right">Total Yield</TableHead>
              <TableHead className="text-center">Trend</TableHead> */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((cluster) => (
              <TableRow key={cluster.clusterId}>
                <TableCell className="font-medium">{cluster.clusterName}</TableCell>
                {/* <TableCell className="text-muted-foreground">{cluster.farmName}</TableCell> */}
                <TableCell className="text-center">{cluster.treeCount}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="relative h-2 w-16 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn('h-full transition-all', getHealthColor(cluster.healthyPercentage))}
                        style={{ width: `${cluster.healthyPercentage}%` }}
                      />
                    </div>
                    <span className="text-sm">{cluster.healthyPercentage}%</span>
                  </div>
                </TableCell>
                {/* <TableCell className="text-right">{cluster.yieldPerTree} kg</TableCell>
                <TableCell className="text-right font-medium">
                  {cluster.totalYield.toLocaleString()} kg
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-1">
                    {getTrendIcon(cluster.trend)}
                    <span
                      className={`text-sm ${
                        cluster.trend === 'up'
                          ? 'text-secondary'
                          : cluster.trend === 'down'
                            ? 'text-destructive'
                            : 'text-muted-foreground'
                      }`}
                    >
                      {cluster.trendPercentage > 0 ? '+' : ''}
                      {cluster.trendPercentage}%
                    </span>
                  </div>
                </TableCell> */}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

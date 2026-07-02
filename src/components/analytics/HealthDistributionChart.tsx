import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';
import type { HealthDistribution } from '@/types/analytics.types';

interface HealthDistributionChartProps {
  data: HealthDistribution[];
  loading: boolean;
}

const STATUS_CONFIG = {
  healthy: { color: 'hsl(var(--secondary))', label: 'Healthy' },
  infected: { color: 'hsl(var(--destructive))', label: 'Infected' },
  unknown: { color: 'hsl(var(--muted-foreground))', label: 'Unknown' },
} as const;

const FALLBACK_CONFIG = { color: 'hsl(var(--muted))', label: 'Other' };

export function HealthDistributionChart({ data, loading }: HealthDistributionChartProps) {
  if (loading) {
    return (
      <Card className="shadow-soft">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="mx-auto h-64 w-64 rounded-full" />
        </CardContent>
      </Card>
    );
  }

  const total = data.reduce((sum, item) => sum + item.count, 0);

  const chartData = data.map((item) => {
    const config = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG] ?? FALLBACK_CONFIG;
    return {
      name: config.label,
      value: item.count,
      percentage: item.percentage,
      color: config.color,
    };
  });

  if (total === 0) {
    return (
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-base">Health Distribution</CardTitle>
        </CardHeader>
        <CardContent className="h-72 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">No tree health data yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="text-base">Health Distribution</CardTitle>
      </CardHeader>
      <CardContent className="h-72 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              label={({ percentage }) => `${percentage}%`}
              labelLine={false}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                borderColor: 'hsl(var(--border))',
                backgroundColor: 'hsl(var(--popover))',
                color: 'hsl(var(--popover-foreground))',
              }}
              formatter={(value: number, name: string) => [
                `${value} trees (${chartData.find((d) => d.name === name)?.percentage}%)`,
                name,
              ]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        {/* Center total, absolutely positioned over the donut hole */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center -mt-4">
          <span className="text-2xl font-bold">{total}</span>
          <span className="text-xs text-muted-foreground">trees</span>
        </div>
      </CardContent>
    </Card>
  );
}
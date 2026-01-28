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
  warning: { color: 'hsl(var(--primary))', label: 'Warning' },
  critical: { color: 'hsl(var(--destructive))', label: 'Critical' },
};

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

  const chartData = data.map((item) => ({
    name: STATUS_CONFIG[item.status].label,
    value: item.count,
    percentage: item.percentage,
    color: STATUS_CONFIG[item.status].color,
  }));

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="text-base">Health Distribution</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
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
              formatter={(value: number, name: string) => [`${value} trees (${chartData.find(d => d.name === name)?.percentage}%)`, name]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

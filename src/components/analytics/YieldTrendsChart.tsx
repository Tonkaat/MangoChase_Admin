import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { YieldTrend } from '@/types/analytics.types';

interface YieldTrendsChartProps {
  data: YieldTrend[];
  loading: boolean;
}

export function YieldTrendsChart({ data, loading }: YieldTrendsChartProps) {
  if (loading) {
    return (
      <Card className="shadow-soft">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="text-base">Yield Trends & Forecast</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ left: 0, right: 16, top: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                borderColor: 'hsl(var(--border))',
                backgroundColor: 'hsl(var(--popover))',
                color: 'hsl(var(--popover-foreground))',
              }}
              formatter={(value: number) => [`${value.toLocaleString()} kg`, '']}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="previousYear"
              name="Previous Year"
              stroke="hsl(var(--muted-foreground))"
              fill="hsl(var(--muted) / 0.5)"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
            <Bar
              dataKey="yield"
              name="Current Yield"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
            />
            <Line
              type="monotone"
              dataKey="forecast"
              name="Forecast"
              stroke="hsl(var(--secondary))"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: 'hsl(var(--secondary))' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

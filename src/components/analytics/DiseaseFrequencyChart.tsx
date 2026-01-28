import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { AlertTriangle } from 'lucide-react';

export interface DiseaseFrequency {
  diseaseName: string;
  count: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface DiseaseFrequencyChartProps {
  data: DiseaseFrequency[];
  loading: boolean;
}

const severityColors = {
  low: 'hsl(142 76% 36%)',
  medium: 'hsl(48 96% 53%)',
  high: 'hsl(25 95% 53%)',
  critical: 'hsl(0 84% 60%)',
};

export function DiseaseFrequencyChart({ data, loading }: DiseaseFrequencyChartProps) {
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
      <CardHeader className="flex flex-row items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-destructive" />
        <CardTitle className="text-base">Disease Frequency</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ left: 0, right: 16, top: 10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
            <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis
              type="category"
              dataKey="diseaseName"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              width={120}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                borderColor: 'hsl(var(--border))',
                backgroundColor: 'hsl(var(--popover))',
                color: 'hsl(var(--popover-foreground))',
              }}
              formatter={(value: number, name: string) => [
                `${value} cases`,
                'Occurrences',
              ]}
            />
            <Bar dataKey="count" name="Cases" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={severityColors[entry.severity]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-4 mt-4 flex-wrap">
          {Object.entries(severityColors).map(([severity, color]) => (
            <div key={severity} className="flex items-center gap-1.5 text-xs">
              <span
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: color }}
              />
              <span className="capitalize text-muted-foreground">{severity}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

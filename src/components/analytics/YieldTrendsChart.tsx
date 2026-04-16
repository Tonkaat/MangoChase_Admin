import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

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
  ReferenceLine,
} from 'recharts';
import type { YieldTrend } from '@/types/analytics.types';
import { TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react';

interface YieldTrendsChartProps {
  data: YieldTrend[];
  loading: boolean;
  predictionConfidence?: number;
  forecastTrend?: 'up' | 'down' | 'stable';
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  const yieldVal = payload.find((p: any) => p.dataKey === 'yield');
  const forecast = payload.find((p: any) => p.dataKey === 'forecast');
  const prevYear = payload.find((p: any) => p.dataKey === 'previousYear');

  return (
    <div
      className="rounded-xl border border-border/60 bg-popover px-4 py-3 shadow-xl"
      style={{ minWidth: 180 }}
    >
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      {yieldVal?.value != null && (
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-muted-foreground">Actual yield</span>
          <span className="text-sm font-bold text-primary">
            {Number(yieldVal.value).toLocaleString()} kg
          </span>
        </div>
      )}
      {forecast?.value != null && (
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3 text-emerald-500" />
            AI forecast
          </span>
          <span className="text-sm font-bold text-emerald-600">
            {Number(forecast.value).toLocaleString()} kg
          </span>
        </div>
      )}
      {prevYear?.value != null && (
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-muted-foreground">Previous year</span>
          <span className="text-sm font-medium text-muted-foreground">
            {Number(prevYear.value).toLocaleString()} kg
          </span>
        </div>
      )}
    </div>
  );
};

export function YieldTrendsChart({
  data,
  loading,
  predictionConfidence = 0,
  forecastTrend = 'stable',
}: YieldTrendsChartProps) {
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

  // Find the dividing index (where actual ends and forecast begins)
  const forecastStartIdx = data.findIndex((d) => d.forecast != null && d.yield == null);
  const forecastLabel = forecastStartIdx > 0 ? data[forecastStartIdx]?.period : null;

  const TrendIcon =
    forecastTrend === 'up'
      ? TrendingUp
      : forecastTrend === 'down'
      ? TrendingDown
      : Minus;

  const trendColor =
    forecastTrend === 'up'
      ? 'text-emerald-600'
      : forecastTrend === 'down'
      ? 'text-destructive'
      : 'text-muted-foreground';

  const confidenceLabel =
    predictionConfidence >= 70
      ? 'High confidence'
      : predictionConfidence >= 40
      ? 'Moderate confidence'
      : 'Low confidence';

  const confidenceColor =
    predictionConfidence >= 70
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
      : predictionConfidence >= 40
      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
      : 'bg-muted text-muted-foreground';

  return (
    <Card className="shadow-soft overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Yield Trends & AI Forecast</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              12-month rolling view · linear regression model
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${confidenceColor}`}
            >
              <Sparkles className="h-3 w-3" />
              {confidenceLabel} · {predictionConfidence}%
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${trendColor}`}
            >
              <TrendIcon className="h-3 w-3" />
              {forecastTrend === 'up'
                ? 'Yield trending up'
                : forecastTrend === 'down'
                ? 'Yield trending down'
                : 'Yield stable'}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="h-80 pb-4 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ left: 0, right: 16, top: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="forecastBand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(142 76% 36%)" stopOpacity={0.15} />
                <stop offset="95%" stopColor="hsl(142 76% 36%)" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="prevYearGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.12} />
                <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />

            <XAxis
              dataKey="period"
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Reference line where forecast begins */}
            {forecastLabel && (
              <ReferenceLine
                x={forecastLabel}
                stroke="hsl(var(--border))"
                strokeDasharray="4 3"
                label={{
                  value: 'Forecast →',
                  position: 'insideTopRight',
                  fill: 'hsl(var(--muted-foreground))',
                  fontSize: 10,
                }}
              />
            )}

            {/* Previous year shaded area */}
            <Area
              type="monotone"
              dataKey="previousYear"
              name="Previous year"
              stroke="hsl(var(--muted-foreground))"
              fill="url(#prevYearGrad)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              activeDot={{ r: 3 }}
            />

            {/* Forecast confidence upper band (invisible line for area fill) */}
            <Area
              type="monotone"
              dataKey="forecastUpper"
              name=""
              stroke="transparent"
              fill="url(#forecastBand)"
              activeDot={false}
              legendType="none"
            />
            <Area
              type="monotone"
              dataKey="forecastLower"
              name=""
              stroke="transparent"
              fill="transparent"
              activeDot={false}
              legendType="none"
            />

            {/* Actual yield bars */}
            <Bar
              dataKey="yield"
              name="Actual yield"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />

            {/* AI forecast line */}
            <Line
              type="monotone"
              dataKey="forecast"
              name="AI forecast"
              stroke="hsl(142 76% 36%)"
              strokeWidth={2.5}
              strokeDasharray="6 3"
              dot={{ fill: 'hsl(142 76% 36%)', r: 4, strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>

      {/* Custom legend */}
      <div className="flex flex-wrap items-center justify-center gap-5 border-t border-border/40 px-6 py-3">
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="h-3 w-6 rounded-sm bg-primary/80" />
          Actual yield
        </span>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className="h-0.5 w-6"
            style={{
              background: 'repeating-linear-gradient(to right, hsl(142 76% 36%) 0, hsl(142 76% 36%) 6px, transparent 6px, transparent 9px)',
            }}
          />
          AI forecast
        </span>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className="h-0.5 w-6"
            style={{
              background: 'repeating-linear-gradient(to right, hsl(var(--muted-foreground)) 0, hsl(var(--muted-foreground)) 4px, transparent 4px, transparent 8px)',
            }}
          />
          Previous year
        </span>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="h-3 w-6 rounded-sm bg-emerald-500/20" />
          Confidence band
        </span>
      </div>
    </Card>
  );
}
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, AlertTriangle, TrendingUp, TrendingDown, Info } from 'lucide-react';
import type { OverallStats, DiseaseFrequency } from '@/types/analytics.types';
import { cn } from '@/lib/utils';

interface PredictionInsightCardProps {
  loading: boolean;
  predictionConfidence: number;
  forecastTrend: 'up' | 'down' | 'stable';
  overallStats: OverallStats;
  diseaseFrequency: DiseaseFrequency[];
}

export function PredictionInsightCard({
  loading,
  predictionConfidence,
  forecastTrend,
  overallStats,
  diseaseFrequency,
}: PredictionInsightCardProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-border/40 bg-gradient-to-r from-primary/5 via-background to-emerald-500/5 p-5">
        <Skeleton className="mb-3 h-4 w-48" />
        <Skeleton className="mb-2 h-6 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  const topDisease = diseaseFrequency[0];
  const criticalDiseases = diseaseFrequency.filter(
    (d) => d.severity === 'critical' || d.severity === 'high',
  );

  // Generate natural-language insight
  const healthScore = overallStats.averageHealth;
  const trendEmoji = forecastTrend === 'up' ? '↑' : forecastTrend === 'down' ? '↓' : '→';

  let headline = '';
  let detail = '';
  let subInsight = '';
  let accent: 'green' | 'amber' | 'red' = 'green';

  if (forecastTrend === 'up' && healthScore >= 75) {
    headline = `Strong harvest season ahead — yield trending ${trendEmoji} upward`;
    detail = `With ${healthScore}% average tree health and a ${predictionConfidence}% model confidence, the next 3 months are projected to outperform historical averages. ${
      criticalDiseases.length === 0
        ? 'No critical disease pressure detected.'
        : `Monitor ${criticalDiseases[0].diseaseName} (${criticalDiseases[0].count} cases) to sustain momentum.`
    }`;
    subInsight = `AI model trained on ${overallStats.totalTrees.toLocaleString()} trees · ${predictionConfidence}% confidence`;
    accent = 'green';
  } else if (forecastTrend === 'down' || healthScore < 60) {
    headline = `Yield risk detected — disease burden affecting ${trendEmoji} forecast`;
    detail = `Tree health at ${healthScore}% is below the 75% optimal threshold. ${
      topDisease
        ? `${topDisease.diseaseName} is the primary stressor (${topDisease.count} active cases, severity: ${topDisease.severity}).`
        : 'Immediate inspection recommended.'
    } Intervention now could recover 10–20% of projected yield.`;
    subInsight = `${criticalDiseases.length} high-risk disease${criticalDiseases.length !== 1 ? 's' : ''} require attention`;
    accent = 'red';
  } else {
    headline = `Stable harvest trajectory — monitor disease trends closely`;
    detail = `The farm is performing at ${healthScore}% health with a stable yield forecast. ${
      topDisease
        ? `Watch ${topDisease.diseaseName} (${topDisease.count} cases) — early treatment prevents escalation.`
        : 'Continue current management practices.'
    } The model shows ${predictionConfidence}% confidence in the 3-month outlook.`;
    subInsight = `Forecast updated from real scan data · linear regression model`;
    accent = 'amber';
  }

  const accentClasses = {
    green: {
      outer: 'from-emerald-500/8 via-background to-primary/5 border-emerald-500/20',
      icon: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
      dot: 'bg-emerald-500',
    },
    amber: {
      outer: 'from-amber-500/8 via-background to-primary/5 border-amber-500/20',
      icon: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
      dot: 'bg-amber-500',
    },
    red: {
      outer: 'from-red-500/8 via-background to-primary/5 border-red-500/20',
      icon: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      dot: 'bg-red-500',
    },
  }[accent];

  const Icon =
    accent === 'green' ? TrendingUp : accent === 'red' ? AlertTriangle : TrendingDown;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-gradient-to-r px-5 py-4',
        accentClasses.outer,
      )}
    >
      {/* Decorative ring */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full border border-current opacity-5" />
      <div className="pointer-events-none absolute -bottom-6 right-16 h-20 w-20 rounded-full border border-current opacity-5" />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        {/* Icon */}
        <div className={cn('flex-shrink-0 rounded-xl p-2.5', accentClasses.icon)}>
          <Icon className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
                accentClasses.badge,
              )}
            >
              <Sparkles className="h-3 w-3" />
              AI Insight
            </span>
            <span className="text-xs text-muted-foreground">{subInsight}</span>
          </div>

          <p className="text-sm font-semibold text-foreground leading-snug">{headline}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{detail}</p>
        </div>

        {/* Confidence meter */}
        <div className="flex-shrink-0 text-right sm:min-w-[80px]">
          <p className="text-2xl font-bold text-foreground">{predictionConfidence}%</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            confidence
          </p>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn('h-full rounded-full transition-all duration-700', accentClasses.dot)}
              style={{ width: `${predictionConfidence}%` }}
            />
          </div>
        </div>
      </div>

      {/* Disease pills row */}
      {criticalDiseases.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-border/30 pt-3">
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Info className="h-3 w-3" /> Risk factors:
          </span>
          {criticalDiseases.slice(0, 4).map((d) => (
            <span
              key={d.diseaseName}
              className={cn(
                'rounded-full px-2.5 py-0.5 text-[11px] font-medium',
                d.severity === 'critical'
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
              )}
            >
              {d.diseaseName} · {d.count}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
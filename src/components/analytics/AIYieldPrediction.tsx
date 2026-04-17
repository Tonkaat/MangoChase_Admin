// src/components/analytics/AIYieldPrediction.tsx
// Cluster-level yield prediction — one AI call per cluster using pre-aggregated stats.

import { useState, useEffect, useCallback } from 'react';
import {
  Sparkles, TreePine, Droplets, CloudRain, TrendingUp, AlertCircle,
  Loader2, RefreshCw, ChevronDown, ChevronUp, Thermometer, Wind,
  Wheat, FolderTree, Activity, CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { OverallStats } from '@/types/analytics.types';
import { weatherService } from '@/services/weatherService';
import type { WeatherData } from '@/types/weather.types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClusterStats {
  id: string;
  name: string;
  treeCount: number;
  healthyCount: number;
  warningCount: number;
  criticalCount: number;
  avgAge: number;
  avgHeight: number;
  avgCanopySpread: number;
  avgLastYield: number;
  totalMissedSprayings: number;
  varieties: string[];
}

interface WeatherSnapshot {
  temp: number;
  humidity: number;
  rainfall: number;
  windSpeed: number;
  condition: string;
  uv: number;
  feelsLike: number;
  isRaining: boolean;
}

interface ClusterPrediction {
  clusterId: string;
  clusterName: string;
  treeCount: number;
  yieldPercentage: number;
  estimatedKgPerTree: number;
  totalEstimatedYield: number;
  confidence: number;
  riskFactors: string[];
  positiveFactors: string[];
  recommendation: string;
  breakdown: {
    healthScore: number;
    sizeScore: number;
    historicalScore: number;
    sprayingScore: number;
    weatherScore: number;
  };
}

interface AIYieldPredictionProps {
  farmId: string | null;
  overallStats: OverallStats;
  loading?: boolean;
  weatherLocation?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapWeatherSnapshot(data: WeatherData): WeatherSnapshot {
  return {
    temp: data.current.temp_c,
    humidity: data.current.humidity,
    rainfall: data.current.precip_mm,
    windSpeed: data.current.wind_kph,
    condition: data.current.condition.text,
    uv: data.current.uv,
    feelsLike: data.current.feelslike_c,
    isRaining: data.current.isRaining,
  };
}

// ─── AI Call ──────────────────────────────────────────────────────────────────

async function predictClustersYield(
  clusters: ClusterStats[],
  weather: WeatherSnapshot,
): Promise<ClusterPrediction[]> {
  const clusterSummaries = clusters.map((c, i) => `
CLUSTER ${i + 1}: "${c.name}"
  Trees: ${c.treeCount} | Healthy: ${c.healthyCount} | Warning: ${c.warningCount} | Critical: ${c.criticalCount}
  Avg age: ${c.avgAge} yrs | Avg height: ${c.avgHeight} m | Avg canopy: ${c.avgCanopySpread} m
  Avg last yield: ${c.avgLastYield > 0 ? c.avgLastYield + ' kg/tree' : 'no data'}
  Missed sprayings (90d): ${c.totalMissedSprayings}
  Varieties: ${c.varieties.length > 0 ? c.varieties.join(', ') : 'mixed/unknown'}`
  ).join('\n');

  const prompt = `You are an expert mango agronomist AI analyzing a Philippine mango farm.
Predict yield for each cluster based on agronomic data and live weather.

CURRENT WEATHER (live):
- Temperature: ${weather.temp}°C (feels like ${weather.feelsLike}°C)
- Humidity: ${weather.humidity}%
- Precipitation: ${weather.rainfall} mm
- Wind: ${weather.windSpeed} km/h | UV: ${weather.uv}
- Condition: ${weather.condition} | Raining now: ${weather.isRaining ? 'Yes' : 'No'}

SCORING CONTEXT (Philippine mango):
- Ideal flowering temp: 18–24°C | Ideal humidity: 50–70%
- UV > 8 risks sunburn | Mature trees (7–15 yr) yield best
- Each missed spraying ≈ +8% disease pressure
- Max potential yield: 25 kg/tree for healthy mature trees
- No lastYield data → use health + size to estimate baseline

${clusterSummaries}

Respond ONLY with a valid JSON array — one object per cluster, same order as above, no markdown:
[
  {
    "clusterName": "<exact name>",
    "yieldPercentage": <0-100>,
    "estimatedKgPerTree": <number, 1 decimal>,
    "confidence": <0-100>,
    "riskFactors": [<up to 4 strings>],
    "positiveFactors": [<up to 3 strings>],
    "recommendation": "<one actionable sentence>",
    "breakdown": {
      "healthScore": <0-100>,
      "sizeScore": <0-100>,
      "historicalScore": <0-100>,
      "sprayingScore": <0-100>,
      "weatherScore": <0-100>
    }
  }
]`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const data = await response.json();
  const rawText = data.content?.map((b: any) => b.text || '').join('') ?? '';
  const clean = rawText.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(clean) as any[];

  return clusters.map((cluster, i) => {
    const p = parsed[i] ?? {};
    return {
      clusterId: cluster.id,
      clusterName: cluster.name,
      treeCount: cluster.treeCount,
      yieldPercentage: p.yieldPercentage ?? 0,
      estimatedKgPerTree: p.estimatedKgPerTree ?? 0,
      totalEstimatedYield: Math.round((p.estimatedKgPerTree ?? 0) * cluster.treeCount),
      confidence: p.confidence ?? 0,
      riskFactors: p.riskFactors ?? [],
      positiveFactors: p.positiveFactors ?? [],
      recommendation: p.recommendation ?? '',
      breakdown: p.breakdown ?? { healthScore: 0, sizeScore: 0, historicalScore: 0, sprayingScore: 0, weatherScore: 0 },
    };
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreBar({ label, score, icon: Icon, color }: {
  label: string; score: number; icon: any; color: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />{label}
        </span>
        <span className="font-semibold tabular-nums">{score}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full transition-all duration-700', color)} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function YieldBadge({ pct }: { pct: number }) {
  if (pct >= 75) return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">{pct}%</Badge>;
  if (pct >= 50) return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0">{pct}%</Badge>;
  return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0">{pct}%</Badge>;
}

function ClusterCard({ pred, expanded, onToggle }: {
  pred: ClusterPrediction;
  expanded: boolean;
  onToggle: () => void;
}) {
  const pct = pred.yieldPercentage;
  const barColor = pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500';
  const ringColor = pct >= 75 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600';

  const totalDisplay = pred.totalEstimatedYield >= 1000
    ? `${(pred.totalEstimatedYield / 1000).toFixed(1)}t`
    : `${pred.totalEstimatedYield}kg`;

  return (
    <div className="rounded-xl border border-border/60 overflow-hidden transition-all">
      {/* Header row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors text-left"
      >
        {/* Cluster name + tree count */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <FolderTree className="h-4 w-4 text-primary shrink-0" />
            <p className="font-semibold text-sm truncate">{pred.clusterName}</p>
            <span className="text-xs text-muted-foreground shrink-0">· {pred.treeCount} trees</span>
          </div>
          {/* Mini progress bar */}
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className={cn('h-full rounded-full transition-all duration-700', barColor)} style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Quick stats */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className={cn('text-xl font-black tabular-nums', ringColor)}>{pct}%</p>
            <p className="text-[10px] text-muted-foreground">{totalDisplay} est.</p>
          </div>
          <div className="text-muted-foreground">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-border/40 p-4 space-y-4 bg-muted/10">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-background border border-border/40 p-2.5 text-center">
              <p className="text-base font-bold tabular-nums">{pred.estimatedKgPerTree}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">kg/tree</p>
            </div>
            <div className="rounded-lg bg-background border border-border/40 p-2.5 text-center">
              <p className="text-base font-bold tabular-nums">{totalDisplay}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">total</p>
            </div>
            <div className="rounded-lg bg-background border border-border/40 p-2.5 text-center">
              <p className="text-base font-bold tabular-nums">{pred.confidence}%</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">confidence</p>
            </div>
          </div>

          {/* AI recommendation */}
          {pred.recommendation && (
            <div className="flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-foreground leading-relaxed">{pred.recommendation}</p>
            </div>
          )}

          {/* Risk + Positive factors */}
          <div className="grid gap-3 sm:grid-cols-2">
            {pred.riskFactors.length > 0 && (
              <div className="rounded-lg border border-red-200/60 bg-red-50/50 dark:border-red-900/30 dark:bg-red-900/10 p-3">
                <p className="mb-2 text-[11px] font-semibold text-red-700 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />Risk Factors
                </p>
                <ul className="space-y-1">
                  {pred.riskFactors.map((r, i) => (
                    <li key={i} className="text-[11px] text-red-700 dark:text-red-300 flex items-start gap-1.5">
                      <span className="mt-1 h-1 w-1 rounded-full bg-red-500 shrink-0" />{r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {pred.positiveFactors.length > 0 && (
              <div className="rounded-lg border border-emerald-200/60 bg-emerald-50/50 dark:border-emerald-900/30 dark:bg-emerald-900/10 p-3">
                <p className="mb-2 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />Positive Factors
                </p>
                <ul className="space-y-1">
                  {pred.positiveFactors.map((p, i) => (
                    <li key={i} className="text-[11px] text-emerald-700 dark:text-emerald-300 flex items-start gap-1.5">
                      <span className="mt-1 h-1 w-1 rounded-full bg-emerald-500 shrink-0" />{p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Score breakdown */}
          <div className="space-y-2.5">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Parameter Breakdown</p>
            <ScoreBar label="Tree health" score={pred.breakdown.healthScore} icon={Activity}
              color={pred.breakdown.healthScore >= 70 ? 'bg-emerald-500' : pred.breakdown.healthScore >= 50 ? 'bg-amber-500' : 'bg-red-500'} />
            <ScoreBar label="Size & age" score={pred.breakdown.sizeScore} icon={TreePine} color="bg-primary" />
            <ScoreBar label="Historical yield" score={pred.breakdown.historicalScore} icon={TrendingUp} color="bg-blue-500" />
            <ScoreBar label="Spraying compliance" score={pred.breakdown.sprayingScore} icon={Droplets}
              color={pred.breakdown.sprayingScore >= 70 ? 'bg-emerald-500' : 'bg-amber-500'} />
            <ScoreBar label="Weather" score={pred.breakdown.weatherScore} icon={CloudRain} color="bg-sky-500" />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AIYieldPrediction({
  farmId,
  overallStats,
  loading: parentLoading,
  weatherLocation = 'Davao City',
}: AIYieldPredictionProps) {
  const [clusters, setClusters] = useState<ClusterStats[]>([]);
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [weatherRaw, setWeatherRaw] = useState<WeatherData | null>(null);
  const [predictions, setPredictions] = useState<ClusterPrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCluster, setExpandedCluster] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Summary totals across clusters
  const totalEstimatedYield = predictions.reduce((s, p) => s + p.totalEstimatedYield, 0);
  const avgYieldPct = predictions.length
    ? Math.round(predictions.reduce((s, p) => s + p.yieldPercentage, 0) / predictions.length)
    : 0;
  const avgConfidence = predictions.length
    ? Math.round(predictions.reduce((s, p) => s + p.confidence, 0) / predictions.length)
    : 0;

  const loadClusters = async (): Promise<ClusterStats[]> => {
    if (!farmId) return [];
    const snap = await getDocs(query(collection(db, 'farms', farmId, 'clusters'), orderBy('name')));
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() } as any))
      .filter((c: any) => (c.treeCount ?? 0) > 0); // skip empty clusters
  };

  const runPrediction = useCallback(async () => {
    if (!farmId) return;
    setLoading(true);
    setError(null);

    try {
      const [fetchedClusters, fetchedWeatherRaw] = await Promise.all([
        loadClusters(),
        weatherService.getCurrentWeather(weatherLocation),
      ]);

      if (fetchedClusters.length === 0) {
        setError('No clusters with trees found. Add trees to clusters to enable yield prediction.');
        setLoading(false);
        return;
      }

      const snapshot = mapWeatherSnapshot(fetchedWeatherRaw);
      setClusters(fetchedClusters);
      setWeatherRaw(fetchedWeatherRaw);
      setWeather(snapshot);

      const results = await predictClustersYield(fetchedClusters, snapshot);
      setPredictions(results);
      setLastUpdated(new Date());

      // Auto-expand the lowest-yielding cluster as a nudge
      if (results.length > 0) {
        const worst = results.reduce((a, b) => a.yieldPercentage < b.yieldPercentage ? a : b);
        setExpandedCluster(worst.clusterId);
      }
    } catch (err) {
      console.error('AI prediction error:', err);
      setError('Unable to generate prediction. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [farmId, weatherLocation]);

  useEffect(() => {
    if (farmId && !parentLoading) runPrediction();
  }, [farmId, parentLoading]);

  if (parentLoading) {
    return (
      <Card className="shadow-soft">
        <CardHeader><Skeleton className="h-6 w-64" /></CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-soft overflow-hidden">
      {/* ── Header ── */}
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5 shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">AI Yield Prediction</CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Cluster-level · health · size · spraying · weather · history
              </p>
            </div>
          </div>
          <button
            onClick={runPrediction}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            {loading ? 'Analyzing…' : 'Refresh'}
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* ── Error ── */}
        {error && !loading && (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* ── Loading skeleton ── */}
        {loading && (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 w-full rounded-xl bg-muted" />
            ))}
          </div>
        )}

        {/* ── Weather strip ── */}
        {weather && !loading && (
          <div className="space-y-1.5">
            {weatherRaw && (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <CloudRain className="h-3 w-3" />
                {weatherRaw.location.name}, {weatherRaw.location.region} · {weather.condition}
                {weather.isRaining && (
                  <span className="ml-1 rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] font-medium text-sky-700 dark:bg-sky-900/30 dark:text-sky-400">
                    Raining now
                  </span>
                )}
              </p>
            )}
            <div className="grid grid-cols-5 gap-2 rounded-xl border border-border/40 bg-muted/30 p-3">
              {[
                { icon: Thermometer, value: `${weather.temp}°C`, label: 'Temp', color: 'text-orange-500' },
                { icon: Droplets, value: `${weather.humidity}%`, label: 'Humidity', color: 'text-blue-500' },
                { icon: CloudRain, value: `${weather.rainfall}mm`, label: 'Rain', color: 'text-sky-500' },
                { icon: Wind, value: `${weather.windSpeed}`, label: 'km/h', color: 'text-teal-500' },
                { icon: Thermometer, value: `${weather.uv}`, label: 'UV', color: 'text-yellow-500' },
              ].map(({ icon: Icon, value, label, color }) => (
                <div key={label} className="text-center">
                  <Icon className={`h-4 w-4 mx-auto mb-0.5 ${color}`} />
                  <p className="text-sm font-semibold">{value}</p>
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Farm summary banner ── */}
        {predictions.length > 0 && !loading && (
          <div className={cn(
            'rounded-2xl border bg-gradient-to-br p-4',
            avgYieldPct >= 75
              ? 'from-emerald-500/10 to-transparent border-emerald-500/20'
              : avgYieldPct >= 50
              ? 'from-amber-500/10 to-transparent border-amber-500/20'
              : 'from-red-500/10 to-transparent border-red-500/20',
          )}>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Farm-wide Summary · {predictions.length} cluster{predictions.length !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className={cn(
                  'text-3xl font-black tabular-nums',
                  avgYieldPct >= 75 ? 'text-emerald-600' : avgYieldPct >= 50 ? 'text-amber-600' : 'text-red-600',
                )}>
                  {avgYieldPct}%
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">avg yield</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black tabular-nums">
                  {totalEstimatedYield >= 1000
                    ? `${(totalEstimatedYield / 1000).toFixed(1)}t`
                    : `${totalEstimatedYield}kg`}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">total est.</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black tabular-nums">{avgConfidence}%</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">AI confidence</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Cluster cards ── */}
        {predictions.length > 0 && !loading && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <FolderTree className="h-3.5 w-3.5" />
              Per-cluster breakdown — click to expand
            </p>
            {predictions
              .slice()
              .sort((a, b) => a.yieldPercentage - b.yieldPercentage) // worst first — needs attention
              .map((pred) => (
                <ClusterCard
                  key={pred.clusterId}
                  pred={pred}
                  expanded={expandedCluster === pred.clusterId}
                  onToggle={() => setExpandedCluster(expandedCluster === pred.clusterId ? null : pred.clusterId)}
                />
              ))}
          </div>
        )}

        {/* ── Footer ── */}
        {lastUpdated && (
          <p className="text-center text-[10px] text-muted-foreground">
            Last analyzed: {lastUpdated.toLocaleTimeString()} ·{' '}
            {overallStats.totalTrees} trees · {predictions.length} clusters · Weather via WeatherAPI · {weatherLocation}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
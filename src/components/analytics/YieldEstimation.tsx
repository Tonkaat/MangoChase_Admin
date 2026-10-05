// src/components/analytics/YieldEstimation.tsx
//
// ════════════════════════════════════════════════════════════════════════════
// YIELD ESTIMATION (rule-based) — replaces AIYieldPrediction.tsx
// ════════════════════════════════════════════════════════════════════════════
//
// WHAT CHANGED FROM THE OLD COMPONENT
// ------------------------------------
//   REMOVED: callPredictionAPI()        — no more FastAPI / Random Forest backend
//   REMOVED: generateExplanations()     — no more Claude API call to explain results
//   REMOVED: handleRetrain()            — there is nothing to "retrain"; the rules
//                                          are fixed and don't depend on a dataset
//   REMOVED: any .pkl / model-source language in the UI copy
//   ADDED:   direct call to estimateClusterYield() from
//            src/lib/yieldEstimation.engine.ts — pure, synchronous, deterministic
//   ADDED:   "How this number is calculated" disclosure per cluster, listing the
//            four factors and their values, in place of an AI-written explanation
//   RENAMED: every UI label that said "Prediction" / "Forecast" now says
//            "Estimate" / "Estimation," per the project's terminology requirement
//
// NOTE ON FACTOR COUNT
// ---------------------
// This component uses FOUR factors (age, cluster health, season, weather),
// not five. An earlier draft of the engine also modeled a continuous
// "infection rate" and a three-state "Warning/Critical" status as separate
// factors — those fields don't exist in the current Firestore schema
// (tree-service.ts only stores a binary healthStatus per tree), so they were
// collapsed into a single `healthFactor` driven by the cluster's healthy/
// total headcount ratio. See the "DATA REALITY CHECK" comment at the top of
// yieldEstimation.engine.ts for the full reasoning and the upgrade path if
// richer fields get added later.
//
// WHY THIS MATTERS FOR THE CAPSTONE DEFENSE
// -------------------------------------------
// Nothing in this component calls an external API to produce the numbers.
// estimateClusterYield() is a pure function — same input always gives the
// same output — so every number on screen can be recomputed by hand on a
// whiteboard during a defense. There is no "trust the model" step.
//
// DATA SOURCE
// -----------
// This component expects the caller to supply per-cluster data (age,
// healthy/total counts, weather) already aggregated from Firestore — it
// does not fetch Firestore itself, to keep this file focused on
// presentation. See `buildClusterRawData` (at the bottom of this file) for
// an adapter that maps tree-service.ts's existing cluster documents
// directly onto the shape this component expects.
//
// ════════════════════════════════════════════════════════════════════════════

import { useState, useMemo, useCallback } from 'react';
import {
  Sprout, TrendingUp, AlertCircle,
  Loader2, RefreshCw, ChevronDown, ChevronUp,
  FolderTree, Activity, Calculator, Info,
  CloudSun, Droplets, CloudOff,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { OverallStats } from '@/types/analytics.types';
import {
  estimateClusterYield,
  detectSeasonFromDate,
  type ClusterYieldInput,
  type ClusterYieldResult,
} from '@/lib/yieldEstimation.engine';

const MAX_YIELD_KG = 25;

// ─── Props ────────────────────────────────────────────────────────────────────

/**
 * Minimal per-cluster shape the caller needs to provide. This mirrors the
 * fields tree-service.ts ACTUALLY computes and stores per cluster today
 * (see `_updateClusterStats` in tree-service.ts): a healthy/total headcount,
 * average age, and current weather. There is no continuous infection
 * severity or Warning/Critical status field in the current schema — see
 * the "DATA REALITY CHECK" comment at the top of yieldEstimation.engine.ts
 * for why this component does not pretend otherwise.
 */
export interface ClusterRawData {
  clusterId: string;
  clusterName: string;
  treeCount: number;
  healthyCount: number;               // trees with healthStatus === 'Healthy'
  avgTreeAgeYears: number;
  temperatureC: number | null;        // from WeatherService; null if unavailable
  rainfallMm: number | null;          // from WeatherService; null if unavailable
  season?: 'Dry' | 'Wet';              // optional manual override; auto-detected if omitted
}

interface YieldEstimationProps {
  farmId: string | null;
  overallStats: OverallStats;
  loading?: boolean;
  /** Cluster data to estimate. In production, wire this to your Firestore
   *  cluster stream via `buildClusterRawData` (see bottom of this file). */
  clusters?: ClusterRawData[];
  /** Live weather reading used for the weather factor — passed through so
   *  the card can show a visible "Weather used in this calculation" chip
   *  with real numbers, instead of the factor being an invisible input. */
  weather?: { location?: { name?: string }; current?: { temp_c?: number; precip_mm?: number; condition?: { text?: string } } } | null;
  weatherLoading?: boolean;
  weatherError?: string | null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FactorBar({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.round(value * 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">×{value.toFixed(2)}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full transition-all duration-700', color)} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  );
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  if (confidence >= 75)
    return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">High confidence</Badge>;
  if (confidence >= 55)
    return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0">Moderate confidence</Badge>;
  return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0">Low confidence</Badge>;
}

/**
 * Visible proof that the weather factor in the formula is driven by a real,
 * live reading — not a hidden constant. Three honest states:
 *   1. Loading: still fetching from WeatherService.
 *   2. Loaded: shows the actual temp_c / precip_mm just pulled.
 *   3. Unavailable: says so plainly (e.g. farm has no location set, or the
 *      API call failed) — this is also the state where the engine is
 *      silently using its documented neutral weather fallback, so the chip
 *      makes that fallback visible instead of hiding it.
 */
function WeatherChip({
  weather,
  weatherLoading,
  weatherError,
}: {
  weather?: { location?: { name?: string }; current?: { temp_c?: number; precip_mm?: number; condition?: { text?: string } } } | null;
  weatherLoading?: boolean;
  weatherError?: string | null;
}) {
  if (weatherLoading) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Fetching weather…
      </span>
    );
  }

  const locationName = weather?.location?.name;
  const temp = weather?.current?.temp_c;
  const rain = weather?.current?.precip_mm;
  const hasReading = typeof temp === 'number' && typeof rain === 'number';

  if (!hasReading) {
    return (
      <span
        title={weatherError ?? 'No live weather reading available — calculation uses a neutral weather factor'}
        className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/60 bg-amber-50/60 px-2.5 py-1 text-xs text-amber-700 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-400"
      >
        <CloudOff className="h-3.5 w-3.5" />
        {weatherError ?? 'Weather unavailable'}
      </span>
    );
  }

  return (
    <span
      title="Live weather reading feeding the weather factor in the calculation"
      className="inline-flex items-center gap-2.5 rounded-full border border-sky-200/60 bg-sky-50/60 px-2.5 py-1 text-xs text-sky-700 dark:border-sky-900/30 dark:bg-sky-900/10 dark:text-sky-400"
    >
      {locationName && (
        <span className="font-medium">{locationName}</span>
      )}
      <span className="inline-flex items-center gap-1">
        <CloudSun className="h-3.5 w-3.5" />
        {temp.toFixed(1)}°C
      </span>
      <span className="inline-flex items-center gap-1">
        <Droplets className="h-3.5 w-3.5" />
        {rain.toFixed(1)}mm
      </span>
    </span>
  );
}

interface ClusterCardProps {
  result: ClusterYieldResult;
  expanded: boolean;
  onToggle: () => void;
}

function ClusterCard({ result, expanded, onToggle }: ClusterCardProps) {
  const pct = Math.round((result.estimatedYield / MAX_YIELD_KG) * 100);
  const barColor = pct >= 65 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500';
  const valColor = pct >= 65 ? 'text-emerald-600' : pct >= 40 ? 'text-amber-600' : 'text-red-600';

  const totalDisplay = result.totalEstimatedYield >= 1000
    ? `${(result.totalEstimatedYield / 1000).toFixed(1)}t`
    : `${result.totalEstimatedYield}kg`;

  return (
    <div className="rounded-xl border border-border/60 overflow-hidden">
      {/* ── Collapsed header ── */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <FolderTree className="h-4 w-4 text-primary shrink-0" />
            <p className="font-semibold text-sm truncate">{result.clusterName}</p>
            <span className="text-xs text-muted-foreground shrink-0">· {result.treeCount} trees</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className={cn('h-full rounded-full transition-all duration-700', barColor)} style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className={cn('text-xl font-black tabular-nums', valColor)}>
              {result.yieldRange.min}–{result.yieldRange.max}
            </p>
            <p className="text-[10px] text-muted-foreground">kg/tree · {totalDisplay} total</p>
          </div>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {/* ── Expanded detail ── */}
      {expanded && (
        <div className="border-t border-border/40 p-4 space-y-4 bg-muted/10">

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-background border border-border/40 p-2.5 text-center">
              <p className="text-base font-bold tabular-nums">{result.estimatedYield}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">kg/tree</p>
            </div>
            <div className="rounded-lg bg-background border border-border/40 p-2.5 text-center">
              <p className="text-base font-bold tabular-nums">{totalDisplay}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">total est.</p>
            </div>
            <div className="rounded-lg bg-background border border-border/40 p-2.5 text-center">
              <p className="text-base font-bold tabular-nums">{result.confidence}%</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">confidence</p>
            </div>
          </div>

          {/* Yield range + confidence badge */}
          <div className="flex items-center justify-between rounded-lg border border-border/30 bg-background px-3 py-2">
            <span className="text-xs text-muted-foreground">Estimated range</span>
            <span className="text-sm font-semibold tabular-nums">
              {result.yieldRange.min} – {result.yieldRange.max} kg/tree
            </span>
            <ConfidenceBadge confidence={result.confidence} />
          </div>

          {/* Notes (template-generated, not AI-generated) */}
          {result.notes.length > 0 && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-primary shrink-0" />
                <p className="text-[11px] font-semibold text-primary uppercase tracking-wide">Why this number</p>
              </div>
              <ul className="space-y-1">
                {result.notes.map((note, i) => (
                  <li key={i} className="text-xs text-foreground leading-relaxed flex items-start gap-1.5">
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-primary/60 shrink-0" />
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Factor breakdown — the actual formula, fully visible */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5">
              <Calculator className="h-3 w-3 text-muted-foreground" />
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                Calculation factors (multipliers on baseline 15 kg/tree)
              </p>
            </div>
            <FactorBar label="Tree age"        value={result.factors.ageFactor}     color="bg-emerald-500" />
            <FactorBar label="Cluster health"  value={result.factors.healthFactor}  color="bg-red-500" />
            <FactorBar label="Season"          value={result.factors.seasonFactor}  color="bg-sky-400" />
            <FactorBar label="Weather"         value={result.factors.weatherFactor} color="bg-blue-500" />
            <p className="text-[10px] text-muted-foreground pt-1">
              estimatedYield = 15.0 × age × health × season × weather
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function YieldEstimation({
  farmId,
  overallStats,
  loading: parentLoading,
  clusters = [],
  weather = null,
  weatherLoading = false,
  weatherError = null,
}: YieldEstimationProps) {
  const [running, setRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCluster, setExpandedCluster] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [results, setResults] = useState<ClusterYieldResult[]>([]);

  // ── Run estimation ──────────────────────────────────────────────────────
  // This is synchronous and instant — there is no network call. The brief
  // "running" state below exists only to make the recompute feel responsive
  // on click (and to support a future async data-refresh step), not because
  // the math itself is slow.
  const runEstimation = useCallback(() => {
    if (!farmId) return;
    setRunning(true);
    setError(null);

    try {
      if (clusters.length === 0) {
        setError('No clusters found for this farm. Add trees with cluster assignments to enable yield estimation.');
        setResults([]);
        setRunning(false);
        setHasRun(true);
        return;
      }

      const computed: ClusterYieldResult[] = clusters.map((c) => {
        const input: ClusterYieldInput = {
          clusterId: c.clusterId,
          clusterName: c.clusterName,
          treeCount: c.treeCount,
          input: {
            treeAgeYears: c.avgTreeAgeYears,
            healthyCount: c.healthyCount,
            totalCount: c.treeCount,
            season: c.season ?? detectSeasonFromDate(),
            // Fall back handled inside the engine if these are not finite numbers.
            temperatureC: c.temperatureC ?? NaN,
            rainfallMm: c.rainfallMm ?? NaN,
          },
        };
        return estimateClusterYield(input);
      });

      setResults(computed);
      setLastUpdated(new Date());

      // Auto-expand the worst-performing cluster, same convenience as before.
      // const worst = computed.reduce((a, b) => (a.estimatedYield < b.estimatedYield ? a : b));
      // setExpandedCluster(worst.clusterId);
      setExpandedCluster(null);
    } catch (err: any) {
      console.error('Yield estimation error:', err);
      setError(err?.message ?? 'Unable to compute yield estimate. Please check your cluster data.');
      setResults([]);
    } finally {
      setRunning(false);
      setHasRun(true);
    }
  }, [farmId, clusters]);

  // Farm-level aggregates
  const totalYield = useMemo(() => results.reduce((s, r) => s + r.totalEstimatedYield, 0), [results]);
  const avgKgPerTree = useMemo(() => (
    results.length
      ? parseFloat((results.reduce((s, r) => s + r.estimatedYield, 0) / results.length).toFixed(1))
      : 0
  ), [results]);
  const avgConfidence = useMemo(() => (
    results.length
      ? Math.round(results.reduce((s, r) => s + r.confidence, 0) / results.length)
      : 0
  ), [results]);

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
              <Sprout className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Yield Estimation</CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Rule-based · 4 condition factors · fully transparent calculation
              </p>
              <div className="mt-2">
                <WeatherChip weather={weather} weatherLoading={weatherLoading} weatherError={weatherError} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={runEstimation}
              disabled={running || !farmId}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              {running ? 'Calculating…' : 'Run estimation'}
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">

        {/* ── Empty state ── */}
        {!hasRun && !running && !error && (
          <div className="rounded-xl border border-border/40 bg-muted/20 p-4 text-center space-y-1">
            <Activity className="h-6 w-6 text-muted-foreground mx-auto" />
            <p className="text-sm font-medium">No estimate yet</p>
            <p className="text-xs text-muted-foreground">
              Click "Run estimation" to calculate expected yield from current tree condition.
            </p>
          </div>
        )}

        {/* ── Error ── */}
        {error && !running && (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* ── Loading skeleton ── */}
        {running && (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map(i => <div key={i} className="h-16 w-full rounded-xl bg-muted" />)}
          </div>
        )}

        {/* ── Farm summary ── */}
        {results.length > 0 && !running && (
          <div className="rounded-2xl border border-border/40 bg-muted/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Farm summary · {results.length} cluster{results.length !== 1 ? 's' : ''} · {overallStats.totalTrees} trees
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-3xl font-black tabular-nums text-foreground">{avgKgPerTree}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">kg/tree avg</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black tabular-nums">
                  {totalYield >= 1000 ? `${(totalYield / 1000).toFixed(1)}t` : `${totalYield}kg`}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">total est.</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black tabular-nums">{avgConfidence}%</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">confidence</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Method note ── */}
        {/* {results.length > 0 && !running && (
          <div className="flex items-start gap-2 rounded-lg border border-emerald-200/60 bg-emerald-50/50 dark:border-emerald-900/30 dark:bg-emerald-900/10 px-3 py-2.5">
            <Calculator className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-emerald-700 dark:text-emerald-300 leading-relaxed">
              <span className="font-semibold">Rule-based calculation.</span>{' '}
              Each cluster's estimate is computed directly from tree age, the proportion of healthy vs. infected trees, season, and weather —
              no machine learning model or training data involved. Expand a cluster to see the exact formula.
            </p>
          </div>
        )} */}

        {/* ── Cluster cards ── */}
        {results.length > 0 && !running && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <FolderTree className="h-3.5 w-3.5" />
              Per-cluster breakdown — lowest-yielding shown first
            </p>
            {results
              .slice()
              .sort((a, b) => a.estimatedYield - b.estimatedYield)
              .map(result => (
                <ClusterCard
                  key={result.clusterId}
                  result={result}
                  expanded={expandedCluster === result.clusterId}
                  onToggle={() =>
                    setExpandedCluster(expandedCluster === result.clusterId ? null : result.clusterId)
                  }
                />
              ))}
          </div>
        )}

        {/* ── Footer ── */}
        {lastUpdated && (
          <p className="text-center text-[10px] text-muted-foreground">
            Last calculated: {lastUpdated.toLocaleTimeString()} · Rule-based yield estimation
          </p>
        )}

      </CardContent>
    </Card>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// WIRING — now implemented in Analytics.tsx
// ════════════════════════════════════════════════════════════════════════════
//
// Analytics.tsx now:
//   1. Reads the farm's `location` via farmService.getFarm(farmId)
//   2. Calls weatherService.getCurrentWeather(location) once per farmId
//   3. Passes that WeatherData into buildClusterRawData() for every cluster
//      (instead of `null`), AND passes weather/weatherLoading/weatherError
//      straight into <YieldEstimation /> so the card can render the
//      WeatherChip above with real numbers.
//
// If a farm has no `location` set, or the weather API call fails, the chip
// shows "Weather unavailable" honestly, and the engine falls back to its
// documented neutral weather factor (visible in that cluster's lower
// confidence score) — nothing is silently faked.
//
/**
 * Adapter: maps a cluster document exactly as written by
 * `TreeService._updateClusterStats` in tree-service.ts — which already
 * stores `treeCount`, `healthyCount`, and `avgAge` per cluster — onto the
 * ClusterRawData shape this component consumes. No invented fields.
 */
export function buildClusterRawData(
  clusterDoc: {
    id: string;            // Firestore doc id == cluster name, per tree-service.ts
    name?: string;
    treeCount: number;
    healthyCount: number;
    avgAge: number;
  },
  weather: { current?: { temp_c?: number; precip_mm?: number } } | null,
): ClusterRawData {
  return {
    clusterId: clusterDoc.id,
    clusterName: clusterDoc.name ?? clusterDoc.id,
    treeCount: clusterDoc.treeCount ?? 0,
    healthyCount: clusterDoc.healthyCount ?? 0,
    avgTreeAgeYears: clusterDoc.avgAge ?? 0,
    temperatureC: weather?.current?.temp_c ?? null,
    rainfallMm: weather?.current?.precip_mm ?? null,
  };
}
// src/components/analytics/AIYieldPrediction.tsx
// Drop this component into your Analytics.tsx page
// Usage: <AIYieldPrediction farmId={farmId} overallStats={overallStats} trees={trees} />

import { useState, useEffect } from 'react';
import { Sparkles, TreePine, Droplets, CloudRain, TrendingUp, AlertCircle, Loader2, RefreshCw, ChevronDown, ChevronUp, Thermometer, Wind } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  collection,
  getDocs,
  query,
  limit,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { OverallStats } from '@/types/analytics.types';
import { weatherService } from '@/services/weatherService';
import type { WeatherData } from '@/types/weather.types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TreeSample {
  id: string;
  healthStatus: string;
  age?: number;
  height?: number;          // meters
  canopySpread?: number;    // meters
  lastYield?: number;       // kg, last harvest
  missedSprayings?: number; // count in last 90 days
  cluster?: string;
}

// Internal shape used by the AI prompt — mapped from WeatherData
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

interface PredictionResult {
  yieldPercentage: number;      // 0–100 predicted % of max yield
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
  /** WeatherAPI.com location string — defaults to Davao City */
  weatherLocation?: string;
}

// ─── Map WeatherData → WeatherSnapshot for the AI prompt ─────────────────────

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

// ─── Anthropic API call ───────────────────────────────────────────────────────

async function callAnthropicForYieldPrediction(
  trees: TreeSample[],
  weather: WeatherSnapshot,
  farmStats: OverallStats,
): Promise<PredictionResult> {
  const avgAge = trees.length
    ? Math.round(trees.reduce((a, t) => a + (t.age ?? 7), 0) / trees.length)
    : 7;
  const avgHeight = trees.length
    ? (trees.reduce((a, t) => a + (t.height ?? 4.5), 0) / trees.length).toFixed(1)
    : '4.5';
  const avgCanopy = trees.length
    ? (trees.reduce((a, t) => a + (t.canopySpread ?? 3.5), 0) / trees.length).toFixed(1)
    : '3.5';
  const avgHistoricalYield = trees.length
    ? Math.round(trees.reduce((a, t) => a + (t.lastYield ?? 20), 0) / trees.length)
    : 20;
  const totalMissedSprayings = trees.reduce((a, t) => a + (t.missedSprayings ?? 0), 0);
  const avgMissedSprayings = trees.length ? (totalMissedSprayings / trees.length).toFixed(1) : '0';
  const healthyPct = farmStats.averageHealth;
  const totalTrees = farmStats.totalTrees || trees.length;

  const prompt = `You are an expert mango agronomist AI. Analyze the following farm data and predict the yield percentage.

FARM DATA:
- Total trees: ${totalTrees}
- Average tree age: ${avgAge} years
- Average tree height: ${avgHeight} m
- Average canopy spread: ${avgCanopy} m
- Average historical yield per tree: ${avgHistoricalYield} kg/tree
- Average missed sprayings (last 90 days): ${avgMissedSprayings} times
- Current tree health: ${healthyPct}% healthy
- Critical/diseased trees: ${100 - healthyPct}%

CURRENT WEATHER (live from WeatherAPI):
- Temperature: ${weather.temp}°C (feels like ${weather.feelsLike}°C)
- Humidity: ${weather.humidity}%
- Precipitation: ${weather.rainfall} mm
- Wind speed: ${weather.windSpeed} km/h
- UV index: ${weather.uv}
- Condition: ${weather.condition}
- Currently raining: ${weather.isRaining ? 'Yes' : 'No'}

SCORING CONTEXT for Philippine mango farming:
- Ideal temp for mango flowering: 18–24°C (current ${weather.temp}°C)
- Ideal humidity: 50–70% (current ${weather.humidity}%)
- UV > 8 risks sunburn on fruits and young leaves
- Mature mango trees (7–15 yrs) produce best yields
- Each missed spraying increases disease risk by ~8%
- Active rain prevents spraying and increases fungal pressure
- Max potential yield: 25 kg/tree for healthy mature trees

Respond ONLY with a valid JSON object (no markdown, no explanation):
{
  "yieldPercentage": <0-100 integer, % of maximum potential yield expected>,
  "estimatedKgPerTree": <number>,
  "confidence": <0-100 integer>,
  "riskFactors": [<up to 4 specific risk factor strings>],
  "positiveFactors": [<up to 3 positive factor strings>],
  "recommendation": "<one actionable sentence for the farmer>",
  "breakdown": {
    "healthScore": <0-100>,
    "sizeScore": <0-100>,
    "historicalScore": <0-100>,
    "sprayingScore": <0-100>,
    "weatherScore": <0-100>
  }
}`;

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

  // Strip possible markdown fences
  const clean = rawText.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(clean) as Omit<PredictionResult, 'totalEstimatedYield'>;

  return {
    ...parsed,
    totalEstimatedYield: Math.round(parsed.estimatedKgPerTree * totalTrees),
  };
}

// ─── Score bar sub-component ──────────────────────────────────────────────────

function ScoreBar({ label, score, icon: Icon, color }: { label: string; score: number; icon: any; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </span>
        <span className="font-semibold tabular-nums">{score}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all duration-700', color)}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AIYieldPrediction({ farmId, overallStats, loading: parentLoading, weatherLocation = 'Davao City' }: AIYieldPredictionProps) {
  const [trees, setTrees] = useState<TreeSample[]>([]);
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [weatherRaw, setWeatherRaw] = useState<WeatherData | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch tree data from Firestore
  const loadTrees = async (): Promise<TreeSample[]> => {
    if (!farmId) return [];
    try {
      const snap = await getDocs(
        query(collection(db, 'farms', farmId, 'trees'), limit(200))
      );
      return snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          healthStatus: data.healthStatus ?? 'healthy',
          age: data.age ?? data.ageYears ?? 7,
          height: data.height ?? data.heightMeters ?? 4.5,
          canopySpread: data.canopySpread ?? data.canopy ?? 3.5,
          lastYield: data.lastYield ?? data.previousYield ?? 20,
          missedSprayings: data.missedSprayings ?? 0,
          cluster: data.cluster,
        };
      });
    } catch {
      return [];
    }
  };

  const runPrediction = async () => {
    if (!farmId) return;
    setLoading(true);
    setError(null);

    try {
      const [fetchedTrees, fetchedWeatherRaw] = await Promise.all([
        loadTrees(),
        weatherService.getCurrentWeather(weatherLocation),
      ]);

      const snapshot = mapWeatherSnapshot(fetchedWeatherRaw);

      setTrees(fetchedTrees);
      setWeatherRaw(fetchedWeatherRaw);
      setWeather(snapshot);

      const result = await callAnthropicForYieldPrediction(fetchedTrees, snapshot, overallStats);
      setPrediction(result);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('AI prediction error:', err);
      setError('Unable to generate prediction. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-run on mount when farmId is ready
  useEffect(() => {
    if (farmId && !parentLoading) {
      runPrediction();
    }
  }, [farmId, parentLoading]);

  // ── Yield gauge color
  const yieldPct = prediction?.yieldPercentage ?? 0;
  const gaugeColor =
    yieldPct >= 75 ? 'text-emerald-600' :
    yieldPct >= 50 ? 'text-amber-600' :
    'text-red-600';
  const gaugeBarColor =
    yieldPct >= 75 ? 'bg-emerald-500' :
    yieldPct >= 50 ? 'bg-amber-500' :
    'bg-red-500';
  const gaugeBg =
    yieldPct >= 75 ? 'from-emerald-500/10 to-transparent border-emerald-500/20' :
    yieldPct >= 50 ? 'from-amber-500/10 to-transparent border-amber-500/20' :
    'from-red-500/10 to-transparent border-red-500/20';

  if (parentLoading) {
    return (
      <Card className="shadow-soft">
        <CardHeader><Skeleton className="h-6 w-64" /></CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-20 w-full" />
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
            <div className="rounded-xl bg-primary/10 p-2.5 flex-shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">AI Yield Prediction</CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Based on tree size · historical yield · spraying · weather · health
              </p>
            </div>
          </div>
          <button
            onClick={runPrediction}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            {loading ? 'Analyzing…' : 'Refresh'}
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* ── Error state ── */}
        {error && !loading && (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
            <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* ── Loading skeleton ── */}
        {loading && (
          <div className="space-y-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="h-24 w-24 rounded-full bg-muted flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-8 w-32 rounded bg-muted" />
                <div className="h-4 w-48 rounded bg-muted" />
                <div className="h-4 w-40 rounded bg-muted" />
              </div>
            </div>
            <div className="space-y-2">
              {[1,2,3,4,5].map(i => <div key={i} className="h-6 w-full rounded bg-muted" />)}
            </div>
          </div>
        )}

        {/* ── Weather strip ── */}
        {weather && !loading && (
          <div className="space-y-1.5">
            {weatherRaw && (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <CloudRain className="h-3 w-3" />
                {weatherRaw.location.name}, {weatherRaw.location.region} · {weather.condition}
                {weather.isRaining && <span className="ml-1 rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] font-medium text-sky-700 dark:bg-sky-900/30 dark:text-sky-400">Raining now</span>}
              </p>
            )}
            <div className="grid grid-cols-5 gap-2 rounded-xl border border-border/40 bg-muted/30 p-3">
              <div className="text-center">
                <Thermometer className="h-4 w-4 text-orange-500 mx-auto mb-0.5" />
                <p className="text-sm font-semibold">{weather.temp}°C</p>
                <p className="text-[10px] text-muted-foreground">Temp</p>
              </div>
              <div className="text-center">
                <Droplets className="h-4 w-4 text-blue-500 mx-auto mb-0.5" />
                <p className="text-sm font-semibold">{weather.humidity}%</p>
                <p className="text-[10px] text-muted-foreground">Humidity</p>
              </div>
              <div className="text-center">
                <CloudRain className="h-4 w-4 text-sky-500 mx-auto mb-0.5" />
                <p className="text-sm font-semibold">{weather.rainfall}mm</p>
                <p className="text-[10px] text-muted-foreground">Rain</p>
              </div>
              <div className="text-center">
                <Wind className="h-4 w-4 text-teal-500 mx-auto mb-0.5" />
                <p className="text-sm font-semibold">{weather.windSpeed}</p>
                <p className="text-[10px] text-muted-foreground">km/h</p>
              </div>
              <div className="text-center">
                <Thermometer className="h-4 w-4 text-yellow-500 mx-auto mb-0.5" />
                <p className="text-sm font-semibold">{weather.uv}</p>
                <p className="text-[10px] text-muted-foreground">UV</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Main prediction result ── */}
        {prediction && !loading && (
          <>
            {/* Yield percentage + stats */}
            <div className={cn(
              'rounded-2xl border bg-gradient-to-br p-5',
              gaugeBg,
            )}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                {/* Big number */}
                <div className="text-center sm:text-left flex-shrink-0">
                  <p className={cn('text-6xl font-black tabular-nums leading-none', gaugeColor)}>
                    {prediction.yieldPercentage}%
                  </p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    of max potential yield
                  </p>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted/50">
                    <div
                      className={cn('h-full rounded-full transition-all duration-1000', gaugeBarColor)}
                      style={{ width: `${prediction.yieldPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Quick stats */}
                <div className="flex-1 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-background/60 p-3 text-center border border-border/30">
                    <p className="text-lg font-bold tabular-nums">{prediction.estimatedKgPerTree}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">kg / tree</p>
                  </div>
                  <div className="rounded-xl bg-background/60 p-3 text-center border border-border/30">
                    <p className="text-lg font-bold tabular-nums">
                      {prediction.totalEstimatedYield >= 1000
                        ? `${(prediction.totalEstimatedYield / 1000).toFixed(1)}t`
                        : `${prediction.totalEstimatedYield}kg`}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">total yield</p>
                  </div>
                  <div className="rounded-xl bg-background/60 p-3 text-center border border-border/30 col-span-2 sm:col-span-1">
                    <p className="text-lg font-bold tabular-nums">{prediction.confidence}%</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">AI confidence</p>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Recommendation */}
            <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <Sparkles className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-primary mb-0.5">AI Recommendation</p>
                <p className="text-sm text-foreground leading-relaxed">{prediction.recommendation}</p>
              </div>
            </div>

            {/* Risk & positive factors */}
            <div className="grid gap-3 sm:grid-cols-2">
              {prediction.riskFactors.length > 0 && (
                <div className="rounded-xl border border-red-200/60 bg-red-50/50 dark:border-red-900/30 dark:bg-red-900/10 p-4">
                  <p className="mb-2 text-xs font-semibold text-red-700 dark:text-red-400 flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Risk Factors
                  </p>
                  <ul className="space-y-1.5">
                    {prediction.riskFactors.map((r, i) => (
                      <li key={i} className="text-xs text-red-700 dark:text-red-300 flex items-start gap-1.5">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {prediction.positiveFactors.length > 0 && (
                <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/50 dark:border-emerald-900/30 dark:bg-emerald-900/10 p-4">
                  <p className="mb-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Positive Factors
                  </p>
                  <ul className="space-y-1.5">
                    {prediction.positiveFactors.map((p, i) => (
                      <li key={i} className="text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-1.5">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Score breakdown toggle */}
            <div className="border border-border/40 rounded-xl overflow-hidden">
              <button
                onClick={() => setShowBreakdown(!showBreakdown)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors"
              >
                <span className="flex items-center gap-2 text-muted-foreground">
                  <TreePine className="h-4 w-4" />
                  View parameter breakdown
                </span>
                {showBreakdown ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {showBreakdown && (
                <div className="border-t border-border/40 px-4 pb-4 pt-3 space-y-3">
                  <ScoreBar
                    label="Tree health"
                    score={prediction.breakdown.healthScore}
                    icon={Sparkles}
                    color={prediction.breakdown.healthScore >= 70 ? 'bg-emerald-500' : prediction.breakdown.healthScore >= 50 ? 'bg-amber-500' : 'bg-red-500'}
                  />
                  <ScoreBar
                    label="Tree size & age"
                    score={prediction.breakdown.sizeScore}
                    icon={TreePine}
                    color="bg-primary"
                  />
                  <ScoreBar
                    label="Historical yield"
                    score={prediction.breakdown.historicalScore}
                    icon={TrendingUp}
                    color="bg-blue-500"
                  />
                  <ScoreBar
                    label="Spraying compliance"
                    score={prediction.breakdown.sprayingScore}
                    icon={Droplets}
                    color={prediction.breakdown.sprayingScore >= 70 ? 'bg-emerald-500' : 'bg-amber-500'}
                  />
                  <ScoreBar
                    label="Weather conditions"
                    score={prediction.breakdown.weatherScore}
                    icon={CloudRain}
                    color="bg-sky-500"
                  />
                </div>
              )}
            </div>

            {/* Last updated */}
            {lastUpdated && (
              <p className="text-center text-[10px] text-muted-foreground">
                Last analyzed: {lastUpdated.toLocaleTimeString()} ·{' '}
                {overallStats.totalTrees} trees · Weather via WeatherAPI · {weatherLocation}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
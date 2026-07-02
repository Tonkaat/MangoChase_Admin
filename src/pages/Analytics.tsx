// src/pages/Analytics.tsx (or wherever this lives in your project)
//
// ════════════════════════════════════════════════════════════════════════════
// CHANGES IN THIS REVISION
// ════════════════════════════════════════════════════════════════════════════
//
//   REMOVED: PredictionInsightCard          — read predictionConfidence/forecastTrend,
//                                              which useAnalytics no longer returns
//                                              (those were R²/regression artifacts)
//   REMOVED: YieldTrendsChart import + the commented-out <YieldTrendsChart />
//            block                          — it read forecast/forecastUpper/
//                                              forecastLower/previousYear, all of
//                                              which were removed from YieldTrend
//   REMOVED: predictionConfidence, forecastTrend from the useAnalytics() destructure
//   FIXED:   <YieldEstimation /> now actually receives a `clusters` prop. Before,
//            it was called with no `clusters` at all, so it defaulted to an empty
//            array and always showed "No clusters found" regardless of what was
//            in Firestore — that was the original bug report.
//   ADDED:   clusterPerformance (already fetched by useAnalytics, and now carrying
//            healthyCount + avgAge — see analytics.types.ts/useAnalytics.ts) is
//            mapped through buildClusterRawData() and passed straight into
//            YieldEstimation. No second Firestore listener needed — the data
//            useAnalytics already fetches is reused as-is.
//   ADDED:   real weather is now fetched and fed into the yield engine instead
//            of `null`. We read the farm's `location` field via
//            farmService.getFarm(farmId), then call
//            weatherService.getCurrentWeather(location) once. The result is
//            passed into buildClusterRawData() for every cluster, AND down
//            into <YieldEstimation /> as a `weather` prop so the card can show
//            a real, visible "Weather used in this calculation" chip — see
//            YieldEstimation.tsx for that part.
//
// "AI-powered forecasting" badge in the header was also reworded, since nothing
// on this page forecasts anymore — every number is a same-instant estimate.
// ════════════════════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { BarChart3, Sparkles, Loader2 } from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { AnalyticsOverview } from '@/components/analytics/AnalyticsOverview';
import { AnalyticsFilters } from '@/components/analytics/AnalyticsFilters';
import { ClusterPerformanceTable } from '@/components/analytics/ClusterPerformanceTable';
import { DiseaseFrequencyChart } from '@/components/analytics/DiseaseFrequencyChart';
import { HealthDistributionChart } from '@/components/analytics/HealthDistributionChart';
import { YieldEstimation, buildClusterRawData } from '@/components/analytics/YieldEstimation';
import { downloadTextFile } from '@/utils/exportHelpers';
import { firebaseService } from '@/services/firebase';
import { farmService } from '@/services/firebase/farmService';
import { weatherService } from '@/services/weatherService';
import type { WeatherData } from '@/types/weather.types';

export default function Analytics() {
  const [farmId, setFarmId] = useState<string | null>(null);
  const [farmLoading, setFarmLoading] = useState(true);
  const [error, setError] = useState<string | null>(null)

  // ── Weather (for the yield engine + the visible weather chip) ─────────────
  // Fetched once per farmId: read the farm's `location` field, then ask
  // WeatherService for current conditions at that location. `weatherError`
  // is tracked separately from the farm-loading error above so a weather
  // outage never blocks the rest of the page — the engine and the UI both
  // handle a missing weather reading honestly (neutral fallback + a visible
  // "unavailable" state) rather than failing.
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadWeather() {
      if (!farmId) return;
      setWeatherLoading(true);
      setWeatherError(null);
      try {
        const farm = await farmService.getFarm(farmId);
        const location = farm?.location;
        if (!location) {
          if (isMounted) setWeatherError('Farm has no location set');
          return;
        }
        const data = await weatherService.getCurrentWeather(location);
        if (isMounted) setWeather(data);
      } catch (err) {
        console.error('❌ Analytics: failed to load weather', err);
        if (isMounted) setWeatherError('Unable to fetch current weather');
      } finally {
        if (isMounted) setWeatherLoading(false);
      }
    }

    loadWeather();
    return () => {
      isMounted = false;
    };
  }, [farmId]);

  useEffect(() => {
    let isMounted = true;

    async function loadFarmId() {
      try {
        setFarmLoading(true);
        setError(null);
        let currentFarmId = await firebaseService.getCurrentUserFarmId();
        if (!currentFarmId) {
          const user = firebaseService.getCurrentUser();
          if (user) {
            const farms = await firebaseService.getUserFarms(user.uid);
            if (farms && farms.length > 0) {
              currentFarmId = farms[0].farmId;
            }
          }
        }
        if (isMounted) {
          if (currentFarmId) {
            setFarmId(currentFarmId);
          } else {
            setError('No farm found. Please create or join a farm first.');
            toast.error('No farm found. Please create or join a farm first.');
          }
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load farm information. Please try again.');
          toast.error('Failed to load farm information');
        }
      } finally {
        if (isMounted) setFarmLoading(false);
      }
    }

    let unsubscribe: (() => void) | undefined;
    const setupUserProfileListener = async () => {
      try {
        const user = firebaseService.getCurrentUser();
        if (user) {
          unsubscribe = firebaseService.getUserProfileStream((userProfile) => {
            if (isMounted && userProfile?.farmId) setFarmId(userProfile.farmId);
          });
        }
      } catch {}
    };

    loadFarmId();
    setupUserProfileListener();
    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const {
    loading: analyticsLoading,
    overallStats,
    yieldTrends,
    clusterPerformance,
    diseaseFrequency,
    healthDistribution,
    refetch,
  } = useAnalytics(farmId);

  // `clusterPerformance` already has everything buildClusterRawData needs
  // (treeCount, healthyCount, avgAge) — see analytics.types.ts. Weather is
  // now the REAL reading fetched above, not null — every cluster's weather
  // factor reflects actual current conditions at the farm's location.
  const yieldEstimationClusters = clusterPerformance.map((c) =>
    buildClusterRawData(
      { id: c.clusterId, name: c.clusterName, treeCount: c.treeCount, healthyCount: c.healthyCount, avgAge: c.avgAge },
      weather,
    ),
  );

  const handleExport = (format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      const headers = ['Period', 'Estimated Yield (kg)'];
      const rows = yieldTrends.map((t) => [t.period, t.yield ?? ''].join(','));
      const csv = [headers.join(','), ...rows].join('\n');
      downloadTextFile('analytics-yield-trends.csv', csv);
      toast.success('CSV exported successfully');
    } else {
      toast.info('PDF export coming soon! Use CSV for now.');
    }
  };

  if (farmLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading farm information...</p>
        </div>
      </div>
    );
  }

  if (error || !farmId) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <div className="text-center max-w-md">
          <div className="rounded-full bg-amber-100 p-3 w-fit mx-auto mb-4">
            <BarChart3 className="h-8 w-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No Farm Found</h2>
          <p className="text-muted-foreground mb-4">
            {error || "You don't have an active farm."}
          </p>
          <button
            onClick={() => (window.location.href = '/farm-setup')}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Create or Join a Farm
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <header>
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-3xl font-bold">Mango Analytics</h1>
            </div>
            <p className="text-muted-foreground">
              Live farm intelligence · Yield estimation · Disease risk analysis
            </p>
          </div>
        </div>
      </header>

      {/* ── Controls ── */}
      <AnalyticsFilters onRefresh={refetch} onExport={handleExport} loading={analyticsLoading} />

      {/* ── KPI overview ── */}
      <AnalyticsOverview stats={overallStats} loading={analyticsLoading} />

      {/* ── Main content ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <YieldEstimation
            farmId={farmId}
            overallStats={overallStats}
            loading={analyticsLoading}
            clusters={yieldEstimationClusters}
            weather={weather}
            weatherLoading={weatherLoading}
            weatherError={weatherError}
          />
        </div>
        <HealthDistributionChart data={healthDistribution} loading={analyticsLoading} />
      </div>

      {/* ── Cluster table ── */}
      <ClusterPerformanceTable data={clusterPerformance} loading={analyticsLoading} />

      {/* ── Disease frequency ── */}
      <DiseaseFrequencyChart data={diseaseFrequency} loading={analyticsLoading} />
    </div>
  );
}
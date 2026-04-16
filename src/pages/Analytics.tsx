// Analytics.tsx — updated to include AIYieldPrediction
// Only the changes are marked with ← ADD and ← CHANGE comments

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { BarChart3, Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { AnalyticsOverview } from '@/components/analytics/AnalyticsOverview';
import { AnalyticsFilters } from '@/components/analytics/AnalyticsFilters';
import { YieldTrendsChart } from '@/components/analytics/YieldTrendsChart';
import { ClusterPerformanceTable } from '@/components/analytics/ClusterPerformanceTable';
import { DiseaseFrequencyChart } from '@/components/analytics/DiseaseFrequencyChart';
import { HealthDistributionChart } from '@/components/analytics/HealthDistributionChart';
import { PredictionInsightCard } from '@/components/analytics/PredictionInsightCard';
import { AIYieldPrediction } from '@/components/analytics/AIYieldPrediction'; // ← ADD THIS IMPORT
import { downloadTextFile } from '@/utils/exportHelpers';
import { firebaseService } from '@/services/firebase';

export default function Analytics() {
  const [farmId, setFarmId] = useState<string | null>(null);
  const [farmLoading, setFarmLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    predictionConfidence,
    forecastTrend,
    refetch,
  } = useAnalytics(farmId);

  const handleExport = (format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      const headers = ['Period', 'Yield (kg)', 'Previous Year', 'AI Forecast'];
      const rows = yieldTrends.map((t) =>
        [t.period, t.yield ?? '', t.previousYear ?? '', t.forecast ?? ''].join(','),
      );
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
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                <Sparkles className="h-3 w-3" />
                AI-powered forecasting
              </span>
            </div>
            <p className="text-muted-foreground">
              Live farm intelligence · yield predictions · disease risk analysis
            </p>
          </div>
        </div>
      </header>

      {/* ── Controls ── */}
      <AnalyticsFilters onRefresh={refetch} onExport={handleExport} loading={analyticsLoading} />

      {/* ── KPI overview ── */}
      <AnalyticsOverview stats={overallStats} loading={analyticsLoading} />

      {/* ── Prediction insight banner ── */}
      <PredictionInsightCard
        loading={analyticsLoading}
        predictionConfidence={predictionConfidence}
        forecastTrend={forecastTrend}
        overallStats={overallStats}
        diseaseFrequency={diseaseFrequency}
      />

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* ← ADD THIS BLOCK — AI Yield Prediction (new multi-parameter model) */}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}

      {/* ── Main charts ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* <YieldTrendsChart
            data={yieldTrends}
            loading={analyticsLoading}
            predictionConfidence={predictionConfidence}
            forecastTrend={forecastTrend}
          /> */}
        <AIYieldPrediction
          farmId={farmId}
          overallStats={overallStats}
          loading={analyticsLoading}
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
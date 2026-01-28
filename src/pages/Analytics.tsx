import { toast } from 'sonner';
import { BarChart3 } from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { AnalyticsOverview } from '@/components/analytics/AnalyticsOverview';
import { AnalyticsFilters } from '@/components/analytics/AnalyticsFilters';
import { YieldTrendsChart } from '@/components/analytics/YieldTrendsChart';
import { ClusterPerformanceTable } from '@/components/analytics/ClusterPerformanceTable';
import { DiseaseFrequencyChart } from '@/components/analytics/DiseaseFrequencyChart';
import { HealthDistributionChart } from '@/components/analytics/HealthDistributionChart';
import { downloadTextFile } from '@/utils/exportHelpers';

export default function Analytics() {
  const {
    loading,
    overallStats,
    yieldTrends,
    clusterPerformance,
    diseaseFrequency,
    healthDistribution,
    refetch,
  } = useAnalytics();

  const handleExport = (format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      // Generate CSV for yield trends
      const headers = ['Period', 'Yield (kg)', 'Previous Year', 'Forecast'];
      const rows = yieldTrends.map((t) =>
        [t.period, t.yield, t.previousYear || '', t.forecast || ''].join(',')
      );
      const csv = [headers.join(','), ...rows].join('\n');
      downloadTextFile('analytics-yield-trends.csv', csv);
      toast.success('CSV exported successfully');
    } else {
      // PDF export placeholder
      toast.info('PDF export coming soon! Use CSV for now.');
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">Mango Analysis</h1>
            <p className="text-muted-foreground">
              Seb's just being a nerd here LMAO
            </p>
          </div>
        </div>
      </header>

      <AnalyticsFilters onRefresh={refetch} onExport={handleExport} loading={loading} />

      <AnalyticsOverview stats={overallStats} loading={loading} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <YieldTrendsChart data={yieldTrends} loading={loading} />
        </div>
        <HealthDistributionChart data={healthDistribution} loading={loading} />
      </div>

      <ClusterPerformanceTable data={clusterPerformance} loading={loading} />

      <DiseaseFrequencyChart data={diseaseFrequency} loading={loading} />
    </div>
  );
}

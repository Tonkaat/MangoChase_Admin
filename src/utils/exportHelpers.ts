import React from 'react';
import { pdf } from '@react-pdf/renderer';
import type { DocumentProps } from '@react-pdf/renderer';
import { AnalyticsPDFReport } from '@/components/analytics/AnalyticsPDFReport';
import type { OverallStats, HealthDistribution, ClusterPerformance } from '@/types/analytics.types';

interface AnalyticsPDFParams {
  overallStats: OverallStats;
  healthDistribution: HealthDistribution[];
  clusterPerformance: ClusterPerformance[];
}

export async function generateAnalyticsPDF({
  overallStats,
  healthDistribution,
  clusterPerformance,
}: AnalyticsPDFParams) {
  const generatedOn = new Date();

  const element = React.createElement(AnalyticsPDFReport, {
    overallStats,
    healthDistribution,
    clusterPerformance,
    generatedOn,
  }) as unknown as React.ReactElement<DocumentProps>;

  const blob = await pdf(element).toBlob();

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `mango-analytics-report-${generatedOn.toISOString().slice(0, 10)}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
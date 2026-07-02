import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import type { OverallStats, HealthDistribution, ClusterPerformance } from '@/types/analytics.types';

// ── Typography ── Inter reads far cleaner in print than the Helvetica default
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.woff', fontWeight: 400 },
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-500-normal.woff', fontWeight: 500 },
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-600-normal.woff', fontWeight: 600 },
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.woff', fontWeight: 700 },
  ],
});

// ── Palette ──
const palette = {
  primary: '#166534',      // deep mango-leaf green
  primaryLight: '#F0F9F2',
  primarySoft: '#DCEDE1',
  text: '#1E1E1E',
  muted: '#6B7280',
  border: '#E7E9E8',
  healthy: '#16A34A',
  infected: '#DC2626',
  unknown: '#9CA3AF',
  rowAlt: '#F8FAF9',
};

const STATUS_META: Record<HealthDistribution['status'], { label: string; color: string }> = {
  healthy: { label: 'Healthy', color: palette.healthy },
  infected: { label: 'Infected', color: palette.infected },
  unknown: { label: 'Unknown', color: palette.unknown },
};

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Inter',
    fontSize: 10,
    color: palette.text,
    paddingBottom: 56,
  },

  // Header
  header: {
    backgroundColor: palette.primary,
    paddingHorizontal: 40,
    paddingVertical: 26,
    marginBottom: 28,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: 400,
    color: palette.primarySoft,
    marginTop: 4,
  },
  headerDate: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 500,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  body: {
    paddingHorizontal: 40,
  },

  // KPI cards
  kpiRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 34,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: palette.primaryLight,
    borderRadius: 6,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.primarySoft,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: 700,
    color: palette.primary,
  },
  kpiLabel: {
    fontSize: 8,
    fontWeight: 600,
    color: palette.muted,
    marginTop: 6,
    letterSpacing: 0.6,
  },

  // Section
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: palette.text,
    marginBottom: 8,
  },
  sectionRule: {
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    marginBottom: 16,
  },
  section: {
    marginBottom: 30,
  },

  // Stacked distribution bar
  stackBar: {
    flexDirection: 'row',
    height: 14,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 14,
  },

  // Distribution legend
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 10,
    fontWeight: 500,
  },
  legendValue: {
    fontSize: 10,
    color: palette.muted,
  },

  // Cluster table
  table: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: palette.primary,
    paddingVertical: 8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontWeight: 700,
    color: '#FFFFFF',
    letterSpacing: 0.4,
    paddingHorizontal: 8,
  },
  tableCell: {
    fontSize: 9,
    color: palette.text,
    paddingHorizontal: 8,
  },
  colCluster: { flex: 2.2 },
  colTrees: { flex: 1, textAlign: 'right' },
  colHealthy: { flex: 1, textAlign: 'right' },
  colAge: { flex: 1.2, textAlign: 'right' },
  colYieldPerTree: { flex: 1.3, textAlign: 'right' },
  colTotalYield: { flex: 1.3, textAlign: 'right' },
  colTrend: { flex: 1.1, textAlign: 'right', paddingRight: 12 },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: palette.border,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: palette.muted,
  },
});

interface AnalyticsPDFReportProps {
  overallStats: OverallStats;
  healthDistribution: HealthDistribution[];
  clusterPerformance: ClusterPerformance[];
  generatedOn: Date;
}

function trendGlyph(trend: ClusterPerformance['trend']): { symbol: string; color: string } {
  if (trend === 'up') {
    return { symbol: '▲', color: palette.healthy };
  }
  if (trend === 'down') {
    return { symbol: '▼', color: palette.infected };
  }
  return { symbol: '—', color: palette.muted };
}

export function AnalyticsPDFReport({
  overallStats,
  healthDistribution,
  clusterPerformance,
  generatedOn,
}: AnalyticsPDFReportProps) {
  const dateStr = generatedOn.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const totalInDistribution = healthDistribution.reduce((sum, d) => sum + d.count, 0);

  return (
    <Document title="Mango Analytics Report" author="Mango Analytics">
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>Mango Analytics Report</Text>
              <Text style={styles.headerSubtitle}>Farm intelligence summary</Text>
            </View>
            <Text style={styles.headerDate}>{dateStr}</Text>
          </View>
        </View>

        <View style={styles.body}>
          {/* KPI cards */}
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{overallStats.totalTrees.toLocaleString()}</Text>
              <Text style={styles.kpiLabel}>TOTAL TREES</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{Math.round(overallStats.averageHealth)}%</Text>
              <Text style={styles.kpiLabel}>AVG HEALTH</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{overallStats.activeFarmers.toLocaleString()}</Text>
              <Text style={styles.kpiLabel}>ACTIVE FARMERS</Text>
            </View>
          </View>

          {/* Health Distribution */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Health Distribution</Text>
            <View style={styles.sectionRule} />

            <View style={styles.stackBar}>
              {totalInDistribution > 0 ? (
                healthDistribution.map((d, i) => (
                  <View
                    key={i}
                    style={{
                      flex: d.count,
                      backgroundColor: STATUS_META[d.status].color,
                    }}
                  />
                ))
              ) : (
                <View style={{ flex: 1, backgroundColor: palette.border }} />
              )}
            </View>

            {healthDistribution.map((d, i) => (
              <View key={i} style={styles.legendRow}>
                <View style={styles.legendLeft}>
                  <View style={[styles.legendDot, { backgroundColor: STATUS_META[d.status].color }]} />
                  <Text style={styles.legendLabel}>{STATUS_META[d.status].label}</Text>
                </View>
                <Text style={styles.legendValue}>
                  {d.count.toLocaleString()} trees · {d.percentage}%
                </Text>
              </View>
            ))}
          </View>

          {/* Cluster Performance Overview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cluster Performance Overview</Text>
            <View style={styles.sectionRule} />

            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableHeaderCell, styles.colCluster]}>CLUSTER</Text>
                <Text style={[styles.tableHeaderCell, styles.colTrees]}>TREES</Text>
                <Text style={[styles.tableHeaderCell, styles.colHealthy]}>HP%</Text>
                <Text style={[styles.tableHeaderCell, styles.colAge]}>AVG AGE</Text>
              </View>

              {clusterPerformance.map((c, i) => {
                const trend = trendGlyph(c.trend);
                return (
                  <View
                    key={c.clusterId}
                    style={[
                      styles.tableRow,
                      i % 2 === 1 ? { backgroundColor: palette.rowAlt } : {},
                    ]}
                  >
                    <Text style={[styles.tableCell, styles.colCluster]}>{c.clusterName}</Text>
                    <Text style={[styles.tableCell, styles.colTrees]}>{c.treeCount.toLocaleString()}</Text>
                    <Text style={[styles.tableCell, styles.colHealthy]}>{Math.round(c.healthyPercentage)}%</Text>
                    <Text style={[styles.tableCell, styles.colAge]}>{c.avgAge.toFixed(1)} yrs</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Mango Analytics — Auto-generated report</Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
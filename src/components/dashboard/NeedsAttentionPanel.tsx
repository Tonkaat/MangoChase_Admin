// src/components/dashboard/NeedsAttentionPanel.tsx
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ClusterAttention } from "@/hooks/useFarmOverview";

interface NeedsAttentionPanelProps {
  clusters: ClusterAttention[];
  loading?: boolean;
}

export function NeedsAttentionPanel({ clusters, loading }: NeedsAttentionPanelProps) {
  const isEmpty = !loading && clusters.length === 0;

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-pop">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-foreground">Needs your attention</h2>
        {clusters.length > 0 && (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
            {clusters.length} cluster{clusters.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {loading && <p className="text-sm text-muted-foreground">Checking your clusters…</p>}

      {isEmpty && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          All clusters look healthy — nothing needs review right now.
        </div>
      )}

      <ul className="space-y-3">
        {clusters.map((cluster) => (
          <li
            key={cluster.name}
            className="flex items-center justify-between rounded-xl border bg-background/50 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <div>
                <p className="text-sm font-medium text-foreground">{cluster.name}</p>
                <p className="text-xs text-muted-foreground">
                  {cluster.infectedCount > 0 &&
                    `${cluster.infectedCount} of ${cluster.treeCount} trees infected (${Math.round(
                      cluster.avgInfectionRate * 100,
                    )}%)`}
                  {cluster.infectedCount > 0 && cluster.totalMissedSprayings > 0 && " · "}
                  {cluster.totalMissedSprayings > 0 &&
                    `${cluster.totalMissedSprayings} missed spraying${
                      cluster.totalMissedSprayings === 1 ? "" : "s"
                    }`}
                </p>
              </div>
            </div>
            <Button asChild variant="ghost" size="sm">
              {/* TODO: adjust the query param to whatever TreeFilters.tsx reads, if anything */}
              <Link to={`/trees?cluster=${encodeURIComponent(cluster.name)}`}>
                Review <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
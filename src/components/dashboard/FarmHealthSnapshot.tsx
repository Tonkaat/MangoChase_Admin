// src/components/dashboard/FarmHealthSnapshot.tsx
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FarmHealthSnapshotProps {
  healthyTrees: number;
  infectedTrees: number;
  totalTrees: number;
  loading?: boolean;
}

export function FarmHealthSnapshot({
  healthyTrees,
  infectedTrees,
  totalTrees,
  loading,
}: FarmHealthSnapshotProps) {
  const otherTrees = Math.max(totalTrees - healthyTrees - infectedTrees, 0);
  const pct = (n: number) => (totalTrees > 0 ? Math.round((n / totalTrees) * 100) : 0);

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-pop">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-foreground">Farm health snapshot</h2>
        <Button asChild variant="ghost" size="sm">
          <Link to="/analytics">
            Full analytics <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Crunching the numbers…</p>
      ) : totalTrees === 0 ? (
        <p className="text-sm text-muted-foreground">
          No tree data yet — add trees to see health trends here.
        </p>
      ) : (
        <>
          <div className="flex h-3 overflow-hidden rounded-full bg-muted">
            <div className="bg-emerald-500" style={{ width: `${pct(healthyTrees)}%` }} />
            <div className="bg-amber-500" style={{ width: `${pct(infectedTrees)}%` }} />
            <div className="bg-slate-300" style={{ width: `${pct(otherTrees)}%` }} />
          </div>
          <div className="mt-4 flex flex-wrap gap-6 text-sm">
            <Legend color="bg-emerald-500" label="Healthy" value={healthyTrees} pct={pct(healthyTrees)} />
            <Legend color="bg-amber-500" label="Infected" value={infectedTrees} pct={pct(infectedTrees)} />
            <Legend color="bg-slate-300" label="Other" value={otherTrees} pct={pct(otherTrees)} />
          </div>
        </>
      )}
    </div>
  );
}

function Legend({
  color,
  label,
  value,
  pct,
}: {
  color: string;
  label: string;
  value: number;
  pct: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value.toLocaleString()}</span>
      <span className="text-muted-foreground">({pct}%)</span>
    </div>
  );
}
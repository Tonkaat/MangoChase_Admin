import { Loader2, ArrowRight, Trees, Layers, HeartPulse, AlertTriangle, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/StatCard";
import { NeedsAttentionPanel } from "@/components/dashboard/NeedsAttentionPanel";
import { FarmHealthSnapshot } from "@/components/dashboard/FarmHealthSnapshot";
// import { RecentActivityCard } from "@/components/dashboard/RecentActivityCard";
// import { QuickActionsPanel } from "@/components/dashboard/QuickActionsPanel";
import { useCurrentFarmId } from "@/hooks/useCurrentFarmId";
import { useFarmOverview } from "@/hooks/useFarmOverview";

export default function Dashboard() {
  const { farmId, loading: farmLoading, error: farmError } = useCurrentFarmId();
  const { totalTrees, healthyTrees, infectedTrees, clusterCount, attentionClusters, loading: overviewLoading } =
    useFarmOverview(farmId ?? undefined);

  const loading = farmLoading || overviewLoading;
  const healthyPct = totalTrees > 0 ? Math.round((healthyTrees / totalTrees) * 100) : 0;
  const attentionCount = attentionClusters.length;

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

  if (farmError || !farmId) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 w-fit rounded-full bg-amber-100 p-3">
            <BarChart3 className="h-8 w-8 text-amber-600" />
          </div>
          <h2 className="mb-2 text-xl font-semibold">No Farm Found</h2>
          <p className="mb-4 text-muted-foreground">
            {farmError || "You don't have an active farm."}
          </p>
          <button
            onClick={() => (window.location.href = "/farm-setup")}
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
      <section className="rounded-2xl border bg-card p-6 shadow-pop">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-4xl font-bold text-foreground">Mango Shunin</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              {overviewLoading
                ? "Loading your farm…"
                : attentionCount > 0
                  ? `${attentionCount} cluster${attentionCount === 1 ? "" : "s"} could use a look today.`
                  : "Everything on the farm looks healthy today."}
            </p>
          </div>
          <Button asChild variant="mango">
            <Link to="/scheduling">
              Review today's tasks <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Trees tracked"
          value={loading ? "—" : totalTrees.toLocaleString()}
          hint="Synced from your clusters"
          icon={Trees}
          tone="mango"
        />
        <StatCard
          title="Active clusters"
          value={loading ? "—" : clusterCount.toLocaleString()}
          hint="Across your farm"
          icon={Layers}
          tone="leaf"
        />
        <StatCard
          title="Healthy trees"
          value={loading ? "—" : `${healthyPct}%`}
          hint={`${healthyTrees.toLocaleString()} of ${totalTrees.toLocaleString()}`}
          icon={HeartPulse}
          tone="slate"
        />
        <StatCard
          title="Needs review"
          value={loading ? "—" : infectedTrees.toLocaleString()}
          hint={infectedTrees > 0 ? "Infected trees flagged" : "Nothing flagged"}
          icon={AlertTriangle}
          tone="slate"
        />
      </section>

      <section className="flex flex-col gap-6">
        <FarmHealthSnapshot
          healthyTrees={healthyTrees}
          infectedTrees={infectedTrees}
          totalTrees={totalTrees}
          loading={overviewLoading}
        />
        <NeedsAttentionPanel clusters={attentionClusters} loading={overviewLoading} />
      </section>

      {/* <section className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <NeedsAttentionPanel clusters={attentionClusters} loading={overviewLoading} />
        </div>
        <div className="space-y-4">
          <QuickActionsPanel />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FarmHealthSnapshot
            healthyTrees={healthyTrees}
            infectedTrees={infectedTrees}
            totalTrees={totalTrees}
            loading={overviewLoading}
          />
        </div>
        <div className="space-y-4">
          <RecentActivityCard />
        </div>
      </section> */}
    </div>
  );
}
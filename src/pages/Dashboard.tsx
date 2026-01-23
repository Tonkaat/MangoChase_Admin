import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/StatCard";
import { AnalyticsChart } from "@/components/dashboard/AnalyticsChart";
import { RecentActivityCard } from "@/components/dashboard/RecentActivityCard";
import { QuickActionsPanel } from "@/components/dashboard/QuickActionsPanel";
import { ArrowRight, Leaf, Trees, Users } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-card p-6 shadow-pop">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-4xl font-bold text-foreground">Mango Shunin</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Seb is the best mango farmer in the world and this is his admin dashboard.
            </p>
          </div>
          <Button variant="mango">
            Review today’s tasks <ArrowRight />
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard title="Active farms" value="12" hint="0 added this month sadge" icon={Leaf} tone="leaf" />
        <StatCard title="Trees tracked" value="8,420" hint="Inventory synced daily" icon={Trees} tone="mango" />
        <StatCard title="Team members" value="34" hint="Shift coverage is strong" icon={Users} tone="slate" />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AnalyticsChart />
        </div>
        <div className="space-y-4">
          <QuickActionsPanel />
          <RecentActivityCard />
        </div>
      </section>
    </div>
  );
}

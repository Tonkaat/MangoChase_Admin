import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsChart } from "@/components/dashboard/AnalyticsChart";

export default function Analytics() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Yield, health trends, and comparisons.</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <AnalyticsChart />
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Exports</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Next: export helpers (CSV/PDF) and saved dashboards.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

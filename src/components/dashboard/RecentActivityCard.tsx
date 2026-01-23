import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const activity = [
  { label: "New task assigned", detail: "Prune Block A (Cluster 3)", status: "Today" },
  { label: "Farm updated", detail: "North Orchard irrigation schedule", status: "Yesterday" },
  { label: "Inspection logged", detail: "Leaf spot check — Sector 2", status: "2d ago" },
];

export function RecentActivityCard() {
  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="text-base">Recent activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activity.map((a) => (
          <div key={a.detail} className="flex items-start justify-between gap-3 rounded-lg border bg-background p-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground">{a.label}</div>
              <div className="truncate text-sm text-muted-foreground">{a.detail}</div>
            </div>
            <Badge variant="secondary" className="shrink-0">
              {a.status}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

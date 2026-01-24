import { Card, CardContent } from "@/components/ui/card";
import { TreeStats } from "@/types/tree.types";
import { TreeDeciduous, Heart, AlertTriangle, Flag, FolderTree } from "lucide-react";

interface TreeStatsCardsProps {
  stats: TreeStats;
}

export function TreeStatsCards({ stats }: TreeStatsCardsProps) {
  const items = [
    {
      label: "Total Trees",
      value: stats.total,
      icon: TreeDeciduous,
      color: "text-brand-slate",
      bg: "bg-brand-slate/10",
    },
    {
      label: "Healthy",
      value: stats.healthy,
      icon: Heart,
      color: "text-brand-leaf",
      bg: "bg-brand-leaf/10",
    },
    {
      label: "Warning",
      value: stats.warning,
      icon: AlertTriangle,
      color: "text-brand-mango",
      bg: "bg-brand-mango/10",
    },
    {
      label: "Critical",
      value: stats.critical,
      icon: AlertTriangle,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    {
      label: "Flagged",
      value: stats.flagged,
      icon: Flag,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    {
      label: "Clusters",
      value: stats.clusters,
      icon: FolderTree,
      color: "text-primary",
      bg: "bg-primary/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {items.map((item) => (
        <Card key={item.label} className="shadow-soft">
          <CardContent className="flex items-center gap-3 p-4">
            <div className={`rounded-lg p-2 ${item.bg}`}>
              <item.icon className={`h-5 w-5 ${item.color}`} />
            </div>
            <div>
              <div className="text-2xl font-bold">{item.value}</div>
              <div className="text-xs text-muted-foreground">{item.label}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

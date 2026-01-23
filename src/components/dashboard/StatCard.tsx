import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  title: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tone?: "mango" | "leaf" | "slate";
};

export function StatCard({ title, value, hint, icon: Icon, tone = "mango" }: StatCardProps) {
  const toneClass =
    tone === "leaf"
      ? "bg-secondary/15 text-secondary"
      : tone === "slate"
        ? "bg-muted text-foreground"
        : "bg-primary/20 text-foreground";

  return (
    <Card className="shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground">{title}</CardTitle>
        <div className={cn("grid h-9 w-9 place-items-center rounded-lg", toneClass)}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="font-display text-3xl font-bold text-foreground">{value}</div>
        <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

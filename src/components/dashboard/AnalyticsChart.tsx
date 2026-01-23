import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";

const data = [
  { day: "Mon", health: 82 },
  { day: "Tue", health: 84 },
  { day: "Wed", health: 83 },
  { day: "Thu", health: 86 },
  { day: "Fri", health: 88 },
  { day: "Sat", health: 87 },
  { day: "Sun", health: 90 },
];

export function AnalyticsChart() {
  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="text-base">Orchard health trend</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: 8, right: 8, top: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[70, 100]} />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                borderColor: "hsl(var(--border))",
                backgroundColor: "hsl(var(--popover))",
                color: "hsl(var(--popover-foreground))",
              }}
            />
            <Area
              type="monotone"
              dataKey="health"
              stroke="hsl(var(--brand-leaf))"
              fill="hsl(var(--brand-leaf) / 0.25)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

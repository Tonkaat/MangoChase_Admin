import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Scheduling() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">Scheduling</h1>
        <p className="text-muted-foreground">Plan tasks across farms and crews.</p>
      </header>
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Master calendar</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">Next: calendar view, templates, and bulk assignment.</CardContent>
      </Card>
    </div>
  );
}

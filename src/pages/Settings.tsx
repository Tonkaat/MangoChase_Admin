import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Settings() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Brand, notifications, and integrations.</p>
      </header>
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Next: connect a backend, invite teammates, and store preferences.
        </CardContent>
      </Card>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TreeManagement() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">Tree management</h1>
        <p className="text-muted-foreground">Track inventory, clusters, and treatments.</p>
      </header>
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Tree inventory table</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Next: add a searchable table, bulk operations, and a details drawer.
        </CardContent>
      </Card>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function FarmManagement() {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Farm management</h1>
          <p className="text-muted-foreground">Organize orchards, blocks, and field notes.</p>
        </div>
        <Button variant="hero">
          <Plus /> Add farm
        </Button>
      </header>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This first version is a styled shell. Next we can add CRUD, maps, and farm profiles.
        </CardContent>
      </Card>
    </div>
  );
}

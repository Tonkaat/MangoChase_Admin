import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Download, Sparkles } from "lucide-react";

export function QuickActionsPanel() {
  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="text-base">Quick actions</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2">
        <Button variant="mango" className="justify-start" onClick={() => {}}>
          <Plus /> Add farm
        </Button>
        <Button variant="leaf" className="justify-start" onClick={() => {}}>
          <Sparkles /> Create task template
        </Button>
        <Button variant="soft" className="justify-start" onClick={() => {}}>
          <Download /> Export report
        </Button>
        <p className="pt-2 text-xs text-muted-foreground">
          These are UI placeholders
        </p>
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function KnowledgeBase() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">Knowledge base</h1>
        <p className="text-muted-foreground">Disease library, cultivation guides, best practices.</p>
      </header>
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Guides</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Next: searchable articles and an internal “field playbook”.
        </CardContent>
      </Card>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function UserManagement() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">User management</h1>
        <p className="text-muted-foreground">Roles, permissions, and team access.</p>
      </header>
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Roles & assignments</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Next: create users, assign roles, and protect routes with real auth.
        </CardContent>
      </Card>
    </div>
  );
}

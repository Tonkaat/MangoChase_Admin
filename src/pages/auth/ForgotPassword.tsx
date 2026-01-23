import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-mango-field bg-[length:200%_200%] opacity-70 motion-reduce:animate-none md:animate-mango-pan" />
      <div className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-6 py-10">
        <Card className="w-full shadow-pop">
          <CardHeader>
            <CardTitle className="font-display text-2xl">Reset password</CardTitle>
            <CardDescription>We’ll send you a reset link (UI placeholder).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="name@company.com" />
            </div>
            <Button className="w-full" variant="leaf">
              Send reset link
            </Button>
            <Link className="block text-center text-sm text-primary underline-offset-4 hover:underline" to="/login">
              Back to sign in
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

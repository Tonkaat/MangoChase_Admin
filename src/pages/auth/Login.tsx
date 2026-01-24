// src/pages/auth/Login.tsx
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandLogo } from "@/components/common/BrandLogo";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Chrome, Loader2 } from "lucide-react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/config/firebase";
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(email, password);
      toast.success('Welcome back!');
      
      // Always navigate to farm-setup
      // SetupGuard will redirect to dashboard if setup is already complete
      navigate('/farm-setup');
      
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Create user profile if first time
      const { uid, displayName, email: userEmail } = result.user;
      await fetch(`https://firestore.googleapis.com/v1/projects/${import.meta.env.VITE_FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            name: { stringValue: displayName || 'User' },
            email: { stringValue: userEmail || '' },
            role: { stringValue: 'admin' },
            createdAt: { timestampValue: new Date().toISOString() },
            updatedAt: { timestampValue: new Date().toISOString() }
          }
        })
      });

      toast.success('Signed in with Google!');
      
      // Always navigate to farm-setup
      // SetupGuard will redirect to dashboard if setup is already complete
      navigate('/farm-setup');
      
    } catch (error: any) {
      toast.error(error.message || 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-mango-field bg-[length:200%_200%] opacity-70 motion-reduce:animate-none md:animate-mango-pan" />
      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6 py-10">
        <div className="grid w-full gap-6 lg:grid-cols-2">
          <div className="hidden rounded-2xl border bg-card p-8 shadow-pop lg:block">
            <BrandLogo />
            <h1 className="mt-6 font-display text-4xl font-bold">Welcome back</h1>
            <p className="mt-2 text-muted-foreground">
              Sign in to manage farms, tree inventory, and schedules — all in one mango-bright workspace.
            </p>
          </div>
          
          <Card className="shadow-pop">
            <CardHeader>
              <CardTitle className="font-display text-2xl">Sign in</CardTitle>
              <CardDescription>Enter your credentials to access your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <Button className="w-full" variant="mango" type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign in
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleGoogleSignIn}
                disabled={googleLoading || loading}
              >
                {googleLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Chrome className="mr-2 h-4 w-4" />
                )}
                Sign in with Google
              </Button>

              <div className="flex items-center justify-between text-sm">
                <Link className="text-primary underline-offset-4 hover:underline" to="/forgot-password">
                  Forgot password?
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
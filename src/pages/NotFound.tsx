import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6">
        <div className="w-full rounded-xl border bg-card p-8 shadow-soft">
          <div className="mb-3 inline-flex items-center rounded-full bg-accent px-3 py-1 text-sm text-accent-foreground">
            Mangochase
          </div>
          <h1 className="text-4xl font-bold text-foreground">404</h1>
          <p className="mt-2 text-muted-foreground">
            That route doesn’t exist: <span className="font-medium text-foreground">{location.pathname}</span>
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild variant="hero">
              <a href="/dashboard">Go to Dashboard</a>
            </Button>
            <Button asChild variant="soft">
              <a href="/login">Sign in</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

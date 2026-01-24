import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppRoutes } from "@/routes";
import Index from "./pages/Index";
import { AuthProvider } from '@/providers/auth-provider';
import { FarmProvider } from '@/providers/farm-provider';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider> {/* ← Add this wrapper */}
      <FarmProvider> {/* Add this */}
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/*" element={<AppRoutes />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </FarmProvider> {/* ← Close wrapper here */}
    </AuthProvider> {/* ← Close wrapper here */}
  </QueryClientProvider>
);

export default App;
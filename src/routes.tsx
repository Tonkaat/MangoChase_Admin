// src/routes.tsx
import { Navigate, Route, Routes } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { useFarm } from '@/providers/farm-provider';
import Dashboard from "@/pages/Dashboard";
import FarmManagement from "@/pages/FarmManagement";
import TreeManagement from "@/pages/TreeManagement";
import UserManagement from "@/pages/UserManagement";
import Scheduling from "@/pages/Scheduling";
import Analytics from "@/pages/Analytics";
import KnowledgeBase from "@/pages/KnowledgeBase";
import Settings from "@/pages/Settings";
import Login from "@/pages/auth/Login";
import FarmSetup from "@/pages/FarmSetup";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import NotFound from "@/pages/NotFound";
import { Loader2 } from "lucide-react";

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();


  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If already logged in, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export function AppRoutes() {
  const { selectedFarmId } = useFarm();
  return (
    <Routes>
      {/* Public routes - redirect to dashboard if logged in */}
      <Route path="login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="setup" element={<PublicRoute><FarmSetup /></PublicRoute>} />
      
      {/* Protected routes */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="farms" element={<FarmManagement />} />
      <Route 
        path="trees" 
        element={<TreeManagement farmId={selectedFarmId || ''} />} 
      />
        <Route path="users" element={<UserManagement />} />
        <Route path="scheduling" element={<Scheduling />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="knowledge" element={<KnowledgeBase />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      
      {/* Root redirect - send to login if not authenticated */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
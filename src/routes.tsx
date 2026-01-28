// src/routes.tsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { SetupGuard } from './components/common/SetupGuard';
import { MainLayout } from './components/layout/MainLayout';

// Pages
import Index from './pages/Index';
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import FarmSetup from './pages/FarmSetup';
import Dashboard from './pages/Dashboard';
import TreeManagement from './pages/TreeManagement';
import FarmManagement from './pages/FarmManagement';
import UserManagement from './pages/UserManagement';
import FarmersBoard from "@/pages/FarmersBoard";
import Scheduling from './pages/Scheduling';
import Analytics from './pages/Analytics';
import Notification from './pages/Notification';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import Journal from './pages/Journal';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Index />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />,
  },
  {
    path: '/farm-setup',
    element: (
      <ProtectedRoute>
        <FarmSetup />
      </ProtectedRoute>
    ),
  },
  {
    element: (
      <ProtectedRoute>
        <SetupGuard requireSetup={true}>
          <MainLayout />
        </SetupGuard>
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/dashboard',
        element: <Dashboard />,
      },
      {
        path: '/board',
        element: <FarmersBoard/>
      },
      {
        path: '/trees',
        element: <TreeManagement />,
      },
      {
        path: '/farms',
        element: <FarmManagement />,
      },
      {
        path: '/users',
        element: <UserManagement />,
      },
      {
        path: '/scheduling',
        element: <Scheduling />,
      },
      {
        path: '/analytics',
        element: <Analytics />,
      },
      {
        path: '/notifications',
        element: <Notification />,
      },
      {
        path: '/journal',
        element: <Journal />,
      },
      {
        path: '/settings',
        element: <Settings />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);

export default router;
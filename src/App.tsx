import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

import LoginPage from './pages/LoginPage';
import Dashboard from './components/layout/Dashboard';
import DashboardPage from './pages/DashboardPage';
import EventLocationsPage from './pages/EventLocationsPage';
import SurveyResponsesPage from './pages/SurveyResponsesPage';
import CheckInPage from './pages/CheckInPage';
import CheckInTablePage from './pages/CheckInTablePage';
import GiftRedemptionPage from './pages/GiftRedemptionPage';
import GiftRedemptionTablePage from './pages/GiftRedemptionTablePage';

const App: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Store last visited route when it changes
  useEffect(() => {
    if (isAuthenticated && !location.pathname.startsWith('/login')) {
      localStorage.setItem('lastRoute', location.pathname);
    }
  }, [isAuthenticated, location.pathname]);

  // Handle authentication redirects
  useEffect(() => {
    if (!isAuthenticated && !location.pathname.startsWith('/login')) {
      // Save current route before redirecting to login
      localStorage.setItem('lastRoute', location.pathname);
      navigate('/login');
    } else if (isAuthenticated && location.pathname === '/login') {
      // Redirect to last visited route or dashboard if none
      const lastRoute = localStorage.getItem('lastRoute') || '/dashboard';
      navigate(lastRoute);
    }
  }, [isAuthenticated, navigate, location.pathname]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <Dashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="customers" element={<DashboardPage />} />
        <Route path="event-locations" element={<EventLocationsPage />} />
        <Route path="survey-responses" element={<SurveyResponsesPage />} />
        <Route path="check-in" element={<CheckInPage />} />
        <Route path="check-in/table" element={<CheckInTablePage />} />
        <Route path="gift-redemption" element={<GiftRedemptionPage />} />
        <Route path="gift-redemption/table" element={<GiftRedemptionTablePage />} />
        {/* Add other dashboard routes here */}
      </Route>
      
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

interface ProtectedRouteProps {
  isAuthenticated: boolean;
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  isAuthenticated, 
  children 
}) => {
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default App;
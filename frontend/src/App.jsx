import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute, { PublicRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';
import ReportSubmission from './components/ReportSubmission';
import ReportListing from './components/ReportListing';
import Profile from './components/Profile';
import Leaderboard from './components/Leaderboard';
import LandingRoute from './components/LandingRoute';

import TestDashboard from './components/TestDashboard';
import './styles/auth.css';
import './styles/home.css';
import './styles/report.css';
import './App.css';
import 'react-toastify/dist/ReactToastify.css';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import AdminLogin from './components/AdminLogin';
import AdminLayout from './components/AdminLayout';
import ReportsManagement from './components/admin/ReportsManagement';
import UsersManagement from './components/admin/UsersManagement';
import AdminLeaderboard from './components/admin/Leaderboard';
import AnalyticsDashboard from './components/admin/AnalyticsDashboard';
import AdminMap from './components/admin/AdminMap';

function App() {
  return (
    <AuthProvider>
      <AdminAuthProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Public routes */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                }
              />

              {/* Admin public route */}
              <Route path="/admin/login" element={<AdminLogin />} />

              {/* Admin protected routes */}
              <Route
                path="/admin"
                element={
                  <AdminProtectedRoute>
                    <AdminLayout />
                  </AdminProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/admin/reports" replace />} />
                <Route path="reports" element={<ReportsManagement />} />
                <Route path="users" element={<UsersManagement />} />
                <Route path="leaderboard" element={<AdminLeaderboard />} />
                <Route path="analytics" element={<AnalyticsDashboard />} />
                <Route path="map" element={<AdminMap />} />
              </Route>

              {/* Protected routes nested under layout */}
              <Route
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route path="/home" element={<Home />} />
                <Route path="/report" element={<ReportSubmission />} />
                <Route path="/reports" element={<ReportListing />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/profile" element={<Profile />} />

              </Route>

              {/* Test route remains public */}
              <Route path="/test" element={<TestDashboard />} />

              {/* Landing page route */}
              <Route path="/" element={<LandingRoute />} />

              {/* 404 fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            
            {/* Toast Notifications */}
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            />
          </div>
        </Router>
      </AdminAuthProvider>
    </AuthProvider>
  );
}

export default App;

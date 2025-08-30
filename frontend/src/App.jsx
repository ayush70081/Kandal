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

import TestDashboard from './components/TestDashboard';
import './styles/auth.css';
import './styles/home.css';
import './styles/report.css';
import './App.css';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <AuthProvider>
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
              <Route path="/profile" element={<Profile />} />

            </Route>

            {/* Test route remains public */}
            <Route path="/test" element={<TestDashboard />} />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/home" replace />} />

            {/* 404 fallback */}
            <Route path="*" element={<Navigate to="/home" replace />} />
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
    </AuthProvider>
  );
}

export default App;

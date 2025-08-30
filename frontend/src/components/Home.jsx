import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const { user, updateProfile, changePassword, isLoading } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Clear messages after 5 seconds
  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, error]);

  return (
    <>
      {/* Messages */}
      {message && <div className="message success">{message}</div>}
      {error && <div className="message error">{error}</div>}

      {/* Main Dashboard Content */}
      <div className="tab-content">
            <h2>🌱 Conservation Dashboard</h2>
            
            {/* Quick Actions */}
            <div className="quick-actions">
              <button 
                className="action-card primary"
                onClick={() => navigate('/report')}
              >
                <div className="action-icon">📸</div>
                <div className="action-content">
                  <h3>Report Incident</h3>
                  <p>Submit a new mangrove incident report</p>
                </div>
              </button>
              
              <button 
                className="action-card secondary"
                onClick={() => navigate('/reports')}
              >
                <div className="action-icon">📋</div>
                <div className="action-content">
                  <h3>View Reports</h3>
                  <p>See all submitted reports and their status</p>
                </div>
              </button>
            </div>
            
            {/* User Stats */}
            <div className="dashboard-stats">
              <div className="stat-card">
                <h3>🎯 Points</h3>
                <p className="stat-value">{user?.points || 0}</p>
                <small>Conservation contribution</small>
              </div>
              <div className="stat-card">
                <h3>📊 Reports Submitted</h3>
                <p className="stat-value">{user?.stats?.reportsSubmitted || 0}</p>
                <small>Incidents reported</small>
              </div>
              <div className="stat-card">
                <h3>🏆 Level</h3>
                <p className="stat-value">{user?.stats?.contributionLevel || 'Bronze'}</p>
                <small>Current achievement level</small>
              </div>
              <div className="stat-card">
                <h3>📅 Member Since</h3>
                <p className="stat-value">{new Date(user?.createdAt).toLocaleDateString()}</p>
                <small>Join date</small>
              </div>
            </div>
            
            {/* Welcome message */}
            <div className="role-info">
              <h3>🌿 Welcome to Mangrove Conservation</h3>
              <div className="role-description">
                <p>Help protect mangrove ecosystems by reporting incidents, participating in conservation efforts, and contributing to environmental monitoring. Together, we can preserve these vital coastal habitats.</p>
              </div>
            </div>
          </div>
    </>
  );
};

export default Home;
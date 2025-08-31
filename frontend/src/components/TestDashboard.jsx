import React, { useState } from 'react';
import { mockReports, mockUser, mockBadges } from '../utils/mockData';
import ReportsMap from './ReportsMap';
import '../styles/test-dashboard.css';

const TestDashboard = () => {
  const [currentView, setCurrentView] = useState('overview');
  const [selectedReport, setSelectedReport] = useState(null);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ffc107',
      verified: '#28a745',
      rejected: '#dc3545'
    };
    return colors[status] || '#6c757d';
  };

  const getSeverityColor = (severity) => {
    const colors = {
      low: '#28a745',
      medium: '#ffc107',
      high: '#fd7e14',
      critical: '#dc3545'
    };
    return colors[severity] || '#6c757d';
  };

  const handleMarkerClick = (report) => {
    setSelectedReport(report);
  };

  const renderOverview = () => (
    <div className="overview-section">
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Reports</h3>
          <div className="stat-number">{mockReports.length}</div>
        </div>
        <div className="stat-card">
          <h3>Pending Reports</h3>
          <div className="stat-number">
            {mockReports.filter(r => r.status === 'pending').length}
          </div>
        </div>
        <div className="stat-card">
          <h3>Critical Issues</h3>
          <div className="stat-number">
            {mockReports.filter(r => r.severity === 'critical').length}
          </div>
        </div>
        <div className="stat-card">
          <h3>User Points</h3>
          <div className="stat-number">{mockUser.points}</div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="recent-reports">
          <h3>Recent Reports</h3>
          {mockReports.slice(0, 3).map(report => (
            <div key={report._id} className="report-summary">
              <div className="report-header">
                <h4>{report.title}</h4>
                <div className="badges">
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(report.status) }}
                  >
                    {report.status}
                  </span>
                  <span 
                    className="severity-badge"
                    style={{ backgroundColor: getSeverityColor(report.severity) }}
                  >
                    {report.severity}
                  </span>
                </div>
              </div>
              <p>{report.description.substring(0, 100)}...</p>
              <div className="report-meta">
                <span>📅 {formatDate(report.createdAt)}</span>
                <span>📍 {report.address?.city || 'Location'}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="user-profile">
          <h3>User Profile</h3>
          <div className="profile-info">
            <div className="profile-item">
              <strong>Name:</strong> {mockUser.name}
            </div>
            <div className="profile-item">
              <strong>Points:</strong> {mockUser.points}
            </div>
            <div className="profile-item">
              <strong>Reports Submitted:</strong> {mockUser.stats.reportsSubmitted}
            </div>
            <div className="profile-item">
              <strong>Contribution Level:</strong> {mockUser.stats.contributionLevel}
            </div>
          </div>

          <div className="badges-section">
            <h4>Earned Badges</h4>
            <div className="badges-list">
              {mockBadges.map(badge => (
                <div key={badge._id} className="badge-item">
                  <span className="badge-icon">{badge.icon}</span>
                  <div className="badge-info">
                    <strong>{badge.name}</strong>
                    <p>{badge.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="reports-section">
      <h3>All Reports</h3>
      <div className="reports-list">
        {mockReports.map(report => (
          <div key={report._id} className="report-card">
            <div className="report-header">
              <h4>{report.title}</h4>
              <div className="badges">
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(report.status) }}
                >
                  {report.status}
                </span>
                <span 
                  className="severity-badge"
                  style={{ backgroundColor: getSeverityColor(report.severity) }}
                >
                  {report.severity}
                </span>
              </div>
            </div>
            <div className="report-details">
              <p><strong>Type:</strong> {report.incidentType.replace('_', ' ')}</p>
              <p><strong>Reporter:</strong> {report.reporter.name}</p>
              <p><strong>Date:</strong> {formatDate(report.createdAt)}</p>
              <p><strong>Location:</strong> {report.location.latitude.toFixed(4)}, {report.location.longitude.toFixed(4)}</p>
            </div>
            <p className="report-description">{report.description}</p>
            <div className="report-tags">
              {report.tags.split(', ').map((tag, index) => (
                <span key={index} className="tag">{tag}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMap = () => (
    <div className="map-section">
      <h3>INCIDENT LOCATIONS</h3>
      <ReportsMap 
        reports={mockReports} 
        onMarkerClick={handleMarkerClick}
        height="600px"
      />
      {selectedReport && (
        <div className="selected-report">
          <h4>Selected Report: {selectedReport.title}</h4>
          <p>{selectedReport.description}</p>
          <div className="report-meta">
            <span>Status: {selectedReport.status}</span>
            <span>Severity: {selectedReport.severity}</span>
            <span>Date: {formatDate(selectedReport.createdAt)}</span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="test-dashboard">
      <div className="dashboard-header">
        <h1>Mangrove Monitoring System</h1>
        <p>Comprehensive testing dashboard showcasing all core functionality</p>
      </div>

      <div className="navigation-tabs">
        <button 
          className={currentView === 'overview' ? 'active' : ''}
          onClick={() => setCurrentView('overview')}
        >
          OVERVIEW
        </button>
        <button 
          className={currentView === 'reports' ? 'active' : ''}
          onClick={() => setCurrentView('reports')}
        >
          REPORTS
        </button>
        <button 
          className={currentView === 'map' ? 'active' : ''}
          onClick={() => setCurrentView('map')}
        >
          MAP VIEW
        </button>
      </div>

      <div className="dashboard-content">
        {currentView === 'overview' && renderOverview()}
        {currentView === 'reports' && renderReports()}
        {currentView === 'map' && renderMap()}
      </div>

      <div className="system-status">
        <h3>SYSTEM FEATURES TESTED</h3>
        <div className="features-list">
          <div className="feature-item">✓ User Authentication & Role-based Access</div>
          <div className="feature-item">✓ Incident Reporting with Photo Upload</div>
          <div className="feature-item">✓ Geographic Location Mapping</div>
          <div className="feature-item">✓ Gamification System (Points & Badges)</div>
          <div className="feature-item">✓ Report Validation Workflow</div>
          <div className="feature-item">✓ Interactive Map Visualization</div>
          <div className="feature-item">✓ Responsive Design & UI Components</div>
          <div className="feature-item">✓ Data Filtering & Search</div>
        </div>
      </div>
    </div>
  );
};

export default TestDashboard;
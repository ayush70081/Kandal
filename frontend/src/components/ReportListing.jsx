import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import { useAuth } from '../contexts/AuthContext';
import ReportsMap from './ReportsMap';
import './ReportListing.css';

const ReportListing = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    incidentType: 'all',
    severity: 'all'
  });
  const [showMap, setShowMap] = useState(true);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  // Incident types for filtering
  const incidentTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'illegal_cutting', label: 'Illegal Tree Cutting' },
    { value: 'dumping', label: 'Waste Dumping' },
    { value: 'pollution', label: 'Water/Soil Pollution' },
    { value: 'land_reclamation', label: 'Land Reclamation' },
    { value: 'wildlife_disturbance', label: 'Wildlife Disturbance' },
    { value: 'erosion', label: 'Coastal Erosion' },
    { value: 'oil_spill', label: 'Oil Spill' },
    { value: 'construction', label: 'Unauthorized Construction' },
    { value: 'other', label: 'Other Environmental Issue' }
  ];

  // Status options
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending Review' },
    { value: 'reviewing', label: 'Under Review' },
    { value: 'verified', label: 'Verified' },
    { value: 'investigating', label: 'Investigating' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'rejected', label: 'Rejected' }
  ];

  // Severity options
  const severityOptions = [
    { value: 'all', label: 'All Priority Levels' },
    { value: 'low', label: 'Low Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'high', label: 'High Priority' },
    { value: 'critical', label: 'Critical Priority' }
  ];

  // Fetch reports
  const fetchReports = async () => {
    try {
      setLoading(true);
      setError('');

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (filters.status !== 'all') queryParams.append('status', filters.status);
      if (filters.incidentType !== 'all') queryParams.append('incidentType', filters.incidentType);
      if (filters.severity !== 'all') queryParams.append('severity', filters.severity);

            const response = await axios.get(`/reports?${queryParams.toString()}`);
      
      const reportsData = response.data.reports || [];
      setReports(reportsData);
    } catch (error) {
      if (error.response?.status === 401) {
        setError('Authentication required. Please log in again.');
      } else if (error.response?.status === 403) {
        setError('You do not have permission to view reports.');
      } else {
        setError(error.response?.data?.message || 'Failed to load reports');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchReports();
    } else {
      setLoading(false);
      setError('Please log in to view reports');
    }
  }, [filters, user]);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      pending: '#ffc107',
      reviewing: '#17a2b8',
      verified: '#28a745',
      investigating: '#fd7e14',
      resolved: '#6f42c1',
      rejected: '#dc3545'
    };
    return colors[status] || '#6c757d';
  };

  // Get severity color
  const getSeverityColor = (severity) => {
    const colors = {
      low: '#28a745',
      medium: '#ffc107',
      high: '#fd7e14',
      critical: '#dc3545'
    };
    return colors[severity] || '#6c757d';
  };

  // Handle marker click
  const handleMarkerClick = (report) => {
    navigate(`/reports/${report._id}`);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="spinner-fullscreen">
        <div className="spinner-icon" aria-hidden="true">✴</div>
      </div>
    );
  }



  return (
    <div className="reports-page">
      <div className="page-container">
        {/* Header Section */}
        <div className="page-header">
          <div className="header-content">
            <h1 className="page-title">Environmental Incident Reports</h1>
            <p className="page-subtitle">
              Monitor, track, and manage environmental incidents affecting mangrove ecosystems
            </p>
          </div>
          <div className="header-actions">
            <button
              className="btn btn-primary"
              onClick={() => navigate('/report')}
            >
              Submit New Report
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-error">
            <div className="alert-content">
              <strong>Error:</strong> {error}
            </div>
          </div>
        )}

        {/* Filters and Controls */}
        <div className="controls-section">
          <div className="filters-container">
            <div className="filter-group">
              <label className="filter-label" htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                className="filter-select"
                value={filters.status}
                onChange={handleFilterChange}
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label" htmlFor="incidentType">Incident Type</label>
              <select
                id="incidentType"
                name="incidentType"
                className="filter-select"
                value={filters.incidentType}
                onChange={handleFilterChange}
              >
                {incidentTypes.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label" htmlFor="severity">Priority Level</label>
              <select
                id="severity"
                name="severity"
                className="filter-select"
                value={filters.severity}
                onChange={handleFilterChange}
              >
                {severityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="view-controls">
            <button
              className={`view-toggle ${!showMap ? 'active' : ''}`}
              onClick={() => setShowMap(false)}
            >
              List View
            </button>
            <button
              className={`view-toggle ${showMap ? 'active' : ''}`}
              onClick={() => setShowMap(true)}
            >
              Map View
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="content-area">
          {showMap ? (
            <div className="map-layout">
              <div className="reports-sidebar">
                <div className="sidebar-header">
                  <h3>Recent Reports</h3>
                  <span className="report-count">{reports.length} reports</span>
                </div>
                
                <div className="reports-list-compact">
                  {reports.length === 0 ? (
                    <div className="empty-state-compact">
                      <p>No reports match your current filters.</p>
                      <button
                        className="btn btn-outline"
                        onClick={() => navigate('/report')}
                      >
                        Submit First Report
                      </button>
                    </div>
                  ) : (
                    reports.slice(0, 10).map(report => (
                      <div key={report._id} className="report-item-compact">
                        <div className="report-compact-header">
                          <h4 className="report-compact-title">{report.title}</h4>
                          <div className="report-compact-badges">
                            <span className={`status-badge status-${report.status}`}>
                              {report.status}
                            </span>
                            <span className={`priority-badge priority-${report.severity}`}>
                              {report.severity}
                            </span>
                          </div>
                        </div>
                        <div className="report-compact-meta">
                          <span className="report-type">
                            {incidentTypes.find(t => t.value === report.incidentType)?.label || report.incidentType}
                          </span>
                          <span className="report-date">{formatDate(report.createdAt)}</span>
                        </div>
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => navigate(`/reports/${report._id}`)}
                        >
                          View Details
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="map-container">
                <div className="map-header">
                  <h3>Incident Locations</h3>
                  <div className="map-legend">
                    <div className="legend-title">Priority Levels</div>
                    <div className="legend-items">
                      <div className="legend-item">
                        <div className="legend-color priority-low"></div>
                        <span>Low</span>
                      </div>
                      <div className="legend-item">
                        <div className="legend-color priority-medium"></div>
                        <span>Medium</span>
                      </div>
                      <div className="legend-item">
                        <div className="legend-color priority-high"></div>
                        <span>High</span>
                      </div>
                      <div className="legend-item">
                        <div className="legend-color priority-critical"></div>
                        <span>Critical</span>
                      </div>
                    </div>
                  </div>
                </div>
                <ReportsMap 
                  reports={reports.filter(report => report.location && report.location.coordinates && report.location.coordinates.length === 2)} 
                  onMarkerClick={handleMarkerClick}
                  height="600px"
                />
              </div>
            </div>
          ) : (
            <div className="list-layout">
              <div className="list-header">
                <h3>All Reports</h3>
                <span className="report-count">{reports.length} reports found</span>
              </div>

              {reports.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-content">
                    <div className="empty-icon"></div>
                    <h3>No Reports Found</h3>
                    <p>No reports match your current filters or no reports have been submitted yet.</p>
                    <button
                      className="btn btn-primary"
                      onClick={() => navigate('/report')}
                    >
                      Submit First Report
                    </button>
                  </div>
                </div>
              ) : (
                <div className="reports-grid">
                  {reports.map(report => (
                    <div key={report._id} className="report-card">
                      <div className="card-header">
                        <div className="card-title-section">
                          <h3 className="card-title">{report.title}</h3>
                          <div className="card-badges">
                            <span className={`status-badge status-${report.status}`}>
                              {report.status}
                            </span>
                            <span className={`priority-badge priority-${report.severity}`}>
                              {report.severity}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="card-content">
                        <div className="card-meta">
                          <div className="meta-item">
                            <span className="meta-label">Type:</span>
                            <span className="meta-value">
                              {incidentTypes.find(t => t.value === report.incidentType)?.label || report.incidentType}
                            </span>
                          </div>
                          <div className="meta-item">
                            <span className="meta-label">Reporter:</span>
                            <span className="meta-value">{report.reporter?.name || 'Anonymous'}</span>
                          </div>
                          <div className="meta-item">
                            <span className="meta-label">Date:</span>
                            <span className="meta-value">{formatDate(report.createdAt)}</span>
                          </div>
                          {report.location && report.location.coordinates && report.location.coordinates.length === 2 && (
                            <div className="meta-item">
                              <span className="meta-label">Location:</span>
                              <span className="meta-value">
                                {report.location.coordinates[1].toFixed(4)}, {report.location.coordinates[0].toFixed(4)}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="card-description">
                          <p>{report.description.length > 150 
                            ? `${report.description.substring(0, 150)}...` 
                            : report.description}
                          </p>
                        </div>

                        {report.photos && report.photos.length > 0 && (
                          <div className="card-attachments">
                            <span className="attachments-label">Attachments:</span>
                            <span className="attachments-count">{report.photos.length} photo(s)</span>
                          </div>
                        )}
                      </div>

                      <div className="card-actions">
                        <button 
                          className="btn btn-outline"
                          onClick={() => navigate(`/reports/${report._id}`)}
                        >
                          View Full Report
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportListing;
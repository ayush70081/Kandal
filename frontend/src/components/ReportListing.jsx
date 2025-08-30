import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import { useAuth } from '../contexts/AuthContext';
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
  // Map view removed; only list view showing current user's reports
  
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
      // Always filter by current user's id so only their reports are shown
      if (user?._id) queryParams.append('reporterId', user._id);
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

  // Navigate to report details
  const goToReportDetails = (reportId) => {
    navigate(`/reports/${reportId}`);
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
            <h1 className="page-title">My Reports</h1>
            <p className="page-subtitle">View reports you have submitted</p>
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

        {/* Filters */}
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

        </div>

        {/* Content Area - List only */}
        <div className="content-area">
          <div className="list-layout">
              <div className="list-header">
                <h3>My Reports</h3>
                <span className="report-count">{reports.length} reports found</span>
              </div>

              {reports.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-content">
                    <div className="empty-icon"></div>
                    <h3>No Reports Found</h3>
                    <p>You haven't submitted any reports yet or none match your current filters.</p>
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
                          onClick={() => goToReportDetails(report._id)}
                        >
                          View Full Report
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportListing;
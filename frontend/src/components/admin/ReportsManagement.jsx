import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../utils/axios';

const ReportsManagement = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [pointsValue, setPointsValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (filter !== 'all') params.status = filter;
      
      const res = await adminAPI.listReports(params);
      if (res.data.success) {
        setReports(res.data.data.reports);
        setError(null);
      } else {
        setError('Failed to load reports');
      }
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  const openApproveModal = (report) => {
    setSelectedReport(report);
    setPointsValue('');
    setShowPointsModal(true);
  };

  const closeApproveModal = () => {
    setShowPointsModal(false);
    setSelectedReport(null);
    setPointsValue('');
    setIsSubmitting(false);
  };

  const submitApproveWithPoints = async () => {
    if (!selectedReport) return;
    const parsedPoints = parseInt(pointsValue, 10);
    if (!Number.isFinite(parsedPoints)) {
      setError('Please enter a valid number of points');
      return;
    }
    try {
      setIsSubmitting(true);
      await adminAPI.approveReport(selectedReport._id, 'Approved by admin');
      // Award points to the report's submitter
      if (selectedReport.reporter && selectedReport.reporter._id) {
        await adminAPI.awardPoints(selectedReport.reporter._id, parsedPoints);
      }
      closeApproveModal();
      await load();
    } catch (e) {
      setIsSubmitting(false);
      setError(`Failed to approve and award points: ${e.response?.data?.message || e.message}`);
    }
  };

  const handleReject = async (id, title) => {
    try {
      await adminAPI.rejectReport(id, 'Rejected due to policy violation');
      await load();
    } catch (e) {
      setError(`Failed to reject report: ${e.response?.data?.message || e.message}`);
    }
  };

  const getStatusBadge = (status) => (
    <span className={`status-badge status-${status}`}>
      {status.replace('_', ' ')}
    </span>
  );

  const getSeverityBadge = (severity) => (
    <span className={`status-badge severity-${severity}`}>
      {severity}
    </span>
  );

  if (loading) return <div className="admin-loading">Loading reports...</div>;

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Reports Management</h1>
        <div>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="admin-form-group"
            style={{ width: 'auto', marginBottom: 0 }}
          >
            <option value="all">All Reports</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="false_positive">Rejected</option>
          </select>
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-cards">
        <div className="admin-card">
          <h3>Total Reports</h3>
          <div className="value">{reports.length}</div>
        </div>
        <div className="admin-card">
          <h3>Pending Review</h3>
          <div className="value">{reports.filter(r => r.status === 'pending').length}</div>
        </div>
        <div className="admin-card">
          <h3>Critical Reports</h3>
          <div className="value">{reports.filter(r => r.severity === 'critical').length}</div>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Reporter</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  No reports found
                </td>
              </tr>
            ) : (
              reports.map(r => (
                <tr key={r._id}>
                  <td>
                    <div style={{ fontWeight: '500' }}>{r.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                      {r.description?.substring(0, 60)}...
                    </div>
                  </td>
                  <td>{r.incidentType?.replace('_', ' ')}</td>
                  <td>{getSeverityBadge(r.severity)}</td>
                  <td>{getStatusBadge(r.status)}</td>
                  <td>
                    <div style={{ fontWeight: '500' }}>{r.reporter?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{r.reporter?.email}</div>
                  </td>
                  <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td>
                    {r.status === 'pending' && (
                      <>
                        <button 
                          className="admin-btn admin-btn-success" 
                          onClick={() => openApproveModal(r)}
                        >
                          Approve
                        </button>
                        <button 
                          className="admin-btn admin-btn-danger" 
                          onClick={() => handleReject(r._id, r.title)}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {r.status !== 'pending' && (
                      <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                        {r.status === 'verified' ? 'Approved' : 'Rejected'}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {showPointsModal && selectedReport && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="admin-form" style={{ width: '100%', maxWidth: '420px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '0.75rem' }}>Approve Report & Award Points</h3>
            <div style={{ marginBottom: '0.75rem', color: '#374151', fontSize: '0.875rem' }}>
              <div style={{ fontWeight: 600 }}>{selectedReport.title}</div>
              <div style={{ color: '#6b7280', marginTop: '0.25rem' }}>Reporter: {selectedReport.reporter?.name} ({selectedReport.reporter?.email})</div>
            </div>
            <div className="admin-form-group">
              <label>Points to award</label>
              <input
                type="number"
                placeholder="e.g., 10"
                value={pointsValue}
                onChange={(e) => setPointsValue(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className="admin-btn admin-btn-secondary" onClick={closeApproveModal} disabled={isSubmitting}>Cancel</button>
              <button className="admin-btn admin-btn-primary" onClick={submitApproveWithPoints} disabled={isSubmitting || pointsValue === ''}>{isSubmitting ? 'Submitting...' : 'Approve & Award'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsManagement;

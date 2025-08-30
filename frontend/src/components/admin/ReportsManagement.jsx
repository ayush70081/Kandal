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
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailReport, setDetailReport] = useState(null);

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

  const getAiDecisionBadge = (aiReview) => {
    const decision = aiReview?.decision || 'inconclusive';
    const colors = {
      approve: '#10b981',
      reject: '#ef4444',
      inconclusive: '#6b7280'
    };
    const bg = colors[decision] || '#6b7280';
    const textColor = decision === 'approve' ? '#fff' : '#fff';
    return (
      <span
        title={aiReview?.reason || ''}
        style={{
          background: bg,
          color: textColor,
          padding: '0.25rem 0.5rem',
          borderRadius: '12px',
          fontSize: '0.75rem',
          fontWeight: 500,
          textTransform: 'capitalize'
        }}
      >
        {decision}
      </span>
    );
  };

  const openDetails = (report) => {
    setDetailReport(report);
    setShowDetailModal(true);
  };

  const closeDetails = () => {
    setDetailReport(null);
    setShowDetailModal(false);
  };

  const getUploadBase = () => {
    const apiBase = import.meta.env?.VITE_API_BASE || 'http://localhost:5000/api';
    return apiBase.replace(/\/api\/?$/, '');
  };

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
              <th>AI Decision</th>
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
                    {getAiDecisionBadge(r.aiReview)}
                  </td>
                  <td>
                    <div style={{ fontWeight: '500' }}>{r.reporter?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{r.reporter?.email}</div>
                  </td>
                  <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button 
                      className="admin-btn admin-btn-secondary" 
                      onClick={() => openDetails(r)}
                      style={{ marginRight: '0.5rem' }}
                    >
                      View Details
                    </button>
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
      {showDetailModal && detailReport && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="admin-form" style={{ width: '100%', maxWidth: '860px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ margin: 0 }}>{detailReport.title}</h3>
              <button className="admin-btn admin-btn-secondary" onClick={closeDetails}>Close</button>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {getStatusBadge(detailReport.status)}
              {getSeverityBadge(detailReport.severity)}
              <span className="status-badge" style={{ background: '#e5e7eb', color: '#374151' }}>{detailReport.incidentType?.replace('_', ' ')}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Reporter</div>
                <div style={{ fontWeight: 500 }}>{detailReport.reporter?.name} <span style={{ color: '#6b7280', fontWeight: 400 }}>({detailReport.reporter?.email})</span></div>
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Date</div>
                <div>{new Date(detailReport.createdAt).toLocaleString()}</div>
              </div>
              {detailReport.location?.coordinates?.length === 2 && (
                <div>
                  <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Location</div>
                  <div>
                    {detailReport.location.coordinates[1].toFixed(6)}, {detailReport.location.coordinates[0].toFixed(6)}
                  </div>
                </div>
              )}
              <div>
                <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>AI Decision</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {getAiDecisionBadge(detailReport.aiReview)}
                  {detailReport.aiReview?.reason && (
                    <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>{detailReport.aiReview.reason}</span>
                  )}
                  {(detailReport.aiReview?.detectedIncidentType || detailReport.aiReview?.detectedSeverity) && (
                    <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>
                      Detected: {detailReport.aiReview?.detectedIncidentType || '—'} / {detailReport.aiReview?.detectedSeverity || '—'}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.25rem' }}>Description</div>
              <div style={{ whiteSpace: 'pre-wrap', color: '#374151', fontSize: '0.95rem' }}>{detailReport.description}</div>
            </div>
            {Array.isArray(detailReport.photos) && detailReport.photos.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.5rem' }}>Photos</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
                  {detailReport.photos.map((p, idx) => {
                    const base = getUploadBase();
                    const thumb = p.thumbnailPath ? `${base}/${p.thumbnailPath}` : `${base}/${p.path}`;
                    const full = `${base}/${p.path}`;
                    return (
                      <a key={idx} href={full} target="_blank" rel="noreferrer" style={{ display: 'block', background: '#f3f4f6', borderRadius: '6px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                        <img src={thumb} alt={p.originalName} style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }} />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              {detailReport.status === 'pending' && (
                <>
                  <button className="admin-btn admin-btn-danger" onClick={() => handleReject(detailReport._id, detailReport.title)}>Reject</button>
                  <button className="admin-btn admin-btn-success" onClick={() => openApproveModal(detailReport)}>Approve & Award</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsManagement;

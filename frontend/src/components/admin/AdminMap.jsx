import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { adminAPI } from '../../utils/axios';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const AdminMap = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('verified');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = { limit: 500 };
        if (filter !== 'all') params.status = filter;
        
        const res = await adminAPI.listReports(params);
        if (res.data.success) {
          // Filter reports that have valid coordinates
          const validReports = res.data.data.reports.filter(r => 
            r.location && 
            r.location.coordinates && 
            r.location.coordinates.length === 2 &&
            !isNaN(r.location.coordinates[0]) &&
            !isNaN(r.location.coordinates[1])
          );
          setReports(validReports);
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
    load();
  }, [filter]);

  const getSeverityColor = (severity) => {
    const colors = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#f97316',
      critical: '#ef4444'
    };
    return colors[severity] || '#6b7280';
  };

  const createCustomIcon = (severity) => {
    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="
        background-color: ${getSeverityColor(severity)};
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
  };

  if (loading) return <div className="admin-loading">Loading map...</div>;

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Reports Map</h1>
        <div>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="admin-form-group"
            style={{ width: 'auto', marginBottom: 0 }}
          >
            <option value="verified">Approved Reports</option>
            <option value="pending">Pending Reports</option>
            <option value="all">All Reports</option>
          </select>
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-cards">
        <div className="admin-card">
          <h3>Reports on Map</h3>
          <div className="value">{reports.length}</div>
        </div>
        <div className="admin-card">
          <h3>Critical Reports</h3>
          <div className="value">{reports.filter(r => r.severity === 'critical').length}</div>
        </div>
        <div className="admin-card">
          <h3>High Priority</h3>
          <div className="value">{reports.filter(r => r.severity === 'high').length}</div>
        </div>
      </div>

      <div className="admin-map-container">
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.875rem' }}>
          <span><strong>Legend:</strong></span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
            <span>Low</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></div>
            <span>Medium</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#f97316' }}></div>
            <span>High</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444' }}></div>
            <span>Critical</span>
          </div>
        </div>
        
        {reports.length > 0 ? (
          <MapContainer 
            center={[20, 0]} 
            zoom={2} 
            style={{ height: '600px', width: '100%', borderRadius: '8px' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
            />
            {reports.map(r => (
              <Marker 
                key={r._id} 
                position={[r.location.coordinates[1], r.location.coordinates[0]]}
                icon={createCustomIcon(r.severity)}
              >
                <Popup maxWidth={300}>
                  <div style={{ padding: '0.5rem' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#1f2937' }}>{r.title}</h4>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                      <div><strong>Type:</strong> {r.incidentType?.replace('_', ' ')}</div>
                      <div><strong>Severity:</strong> 
                        <span 
                          style={{ 
                            color: getSeverityColor(r.severity),
                            fontWeight: '600',
                            marginLeft: '0.25rem'
                          }}
                        >
                          {r.severity}
                        </span>
                      </div>
                      <div><strong>Status:</strong> {r.status?.replace('_', ' ')}</div>
                      <div><strong>Reporter:</strong> {r.reporter?.name}</div>
                      <div><strong>Date:</strong> {new Date(r.createdAt).toLocaleDateString()}</div>
                    </div>
                    {r.description && (
                      <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
                        {r.description.substring(0, 100)}...
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        ) : (
          <div style={{ 
            height: '400px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            color: '#6b7280'
          }}>
            <div style={{ textAlign: 'center' }}>
              <h3>No reports to display on map</h3>
              <p>Reports will appear here once they have valid location data.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMap;



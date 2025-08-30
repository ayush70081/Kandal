import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../utils/axios';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

const AnalyticsDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [geo, setGeo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [o, r, u, g] = await Promise.all([
          adminAPI.analyticsOverview(),
          adminAPI.analyticsReports(),
          adminAPI.analyticsUsers(),
          adminAPI.analyticsGeographic()
        ]);
        if (o.data.success) setOverview(o.data.data);
        if (r.data.success) setReports(r.data.data.monthly || []);
        if (u.data.success) setUsers(u.data.data.contribution || []);
        if (g.data.success) setGeo(g.data.data.byTypeAndSeverity || []);
        setError(null);
      } catch (e) {
        setError(e.response?.data?.message || e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top'
      }
    }
  };

  if (loading) return <div className="admin-loading">Loading analytics...</div>;

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Analytics Dashboard</h1>
      </div>

      {error && <div className="admin-error">{error}</div>}

      {overview && (
        <>
          <div className="admin-cards">
            <div className="admin-card">
              <h3>Total Reports</h3>
              <div className="value">{overview.totalReports}</div>
            </div>
            <div className="admin-card">
              <h3>Active Users</h3>
              <div className="value">{overview.usersCount}</div>
            </div>
            <div className="admin-card">
              <h3>Server Uptime</h3>
              <div className="value">{Math.floor(overview.serverUptimeSec / 3600)}h</div>
            </div>
            <div className="admin-card">
              <h3>Avg Processing</h3>
              <div className="value">
                {overview.processing?.length > 0 
                  ? `${Math.round(overview.processing[0]?.avgProcessingMs / 1000 / 60) || 0}m`
                  : 'N/A'
                }
              </div>
            </div>
          </div>

          {reports.length > 0 && (
            <div className="admin-chart-container">
              <h3>Reports Trend</h3>
              <div style={{ height: '300px' }}>
                <Line 
                  data={{
                    labels: reports.map(r => r._id),
                    datasets: [{
                      label: 'Reports Submitted',
                      data: reports.map(r => r.count),
                      borderColor: '#3b82f6',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      tension: 0.4,
                      fill: true
                    }]
                  }}
                  options={chartOptions}
                />
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
            {users.length > 0 && (
              <div className="admin-chart-container">
                <h3>User Contribution Levels</h3>
                <div style={{ height: '300px' }}>
                  <Bar 
                    data={{
                      labels: users.map(u => u._id),
                      datasets: [{
                        label: 'Number of Users',
                        data: users.map(u => u.count),
                        backgroundColor: [
                          '#cd7f32', // Bronze
                          '#c0c0c0', // Silver
                          '#ffd700', // Gold
                          '#e5e4e2'  // Platinum
                        ],
                        borderWidth: 0
                      }]
                    }}
                    options={chartOptions}
                  />
                </div>
              </div>
            )}

            {overview.statusStats?.length > 0 && (
              <div className="admin-chart-container">
                <h3>Report Status Distribution</h3>
                <div style={{ height: '300px' }}>
                  <Doughnut 
                    data={{
                      labels: overview.statusStats.map(s => s._id.replace('_', ' ')),
                      datasets: [{
                        data: overview.statusStats.map(s => s.count),
                        backgroundColor: [
                          '#fbbf24', // pending
                          '#10b981', // verified
                          '#ef4444', // rejected
                        ],
                        borderWidth: 0
                      }]
                    }}
                    options={chartOptions}
                  />
                </div>
              </div>
            )}
          </div>

          {geo.length > 0 && (
            <div className="admin-chart-container">
              <h3>Reports by Type and Severity</h3>
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Incident Type</th>
                      <th>Severity</th>
                      <th>Count</th>
                      <th>Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {geo.slice(0, 10).map((item, idx) => {
                      const total = geo.reduce((sum, g) => sum + g.count, 0);
                      const percentage = ((item.count / total) * 100).toFixed(1);
                      return (
                        <tr key={idx}>
                          <td>{item._id.type?.replace('_', ' ') || 'Unknown'}</td>
                          <td>
                            <span className={`status-badge severity-${item._id.severity}`}>
                              {item._id.severity}
                            </span>
                          </td>
                          <td><strong>{item.count}</strong></td>
                          <td>{percentage}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {!overview && !loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          <h3>No analytics data available</h3>
          <p>Analytics will appear once there is data to analyze.</p>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;

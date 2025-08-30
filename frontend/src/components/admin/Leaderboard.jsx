import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../utils/axios';

const Leaderboard = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await adminAPI.leaderboard(100);
        if (res.data.success) {
          setRows(res.data.data.leaderboard || []);
          setError(null);
        } else {
          setError('Failed to load leaderboard');
        }
      } catch (e) {
        setError(e.response?.data?.message || e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const getPointsBadge = (points) => {
    const level = points >= 10000 ? 'Gold' : points >= 5000 ? 'Silver' : 'Bronze';
    const colors = { Bronze: '#cd7f32', Silver: '#c0c0c0', Gold: '#ffd700' };
    const textColor = level === 'Silver' ? '#000' : '#fff';
    return (
      <span
        style={{
          background: colors[level],
          color: textColor,
          padding: '0.25rem 0.5rem',
          borderRadius: '12px',
          fontSize: '0.75rem',
          fontWeight: 500
        }}
      >
        {level}
      </span>
    );
  };

  if (loading) return <div className="admin-loading">Loading leaderboard...</div>;

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Leaderboard</h1>
      </div>
      {error && <div className="admin-error">{error}</div>}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>User</th>
              <th>Points</th>
              <th>Badge</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>No data</td>
              </tr>
            ) : (
              rows.map(u => (
                <tr key={u._id}>
                  <td>#{u.rank}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{u.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{u.email}</div>
                  </td>
                  <td><strong>{u.points}</strong></td>
                  <td>{getPointsBadge(u.points || 0)}</td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Leaderboard;



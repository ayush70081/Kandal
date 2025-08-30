import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../utils/axios';

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const uRes = await adminAPI.listUsers({ limit: 50, q: searchTerm });
      if (uRes.data.success) {
        setUsers(uRes.data.data.users);
        setError(null);
      } else {
        setError('Failed to load users');
      }
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    const timeout = setTimeout(load, 300);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  // Award points is handled during report approval; no points awarding here

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

  if (loading) return <div className="admin-loading">Loading users...</div>;

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">User Management</h1>
        <div className="admin-form-group" style={{ width: '300px', marginBottom: 0 }}>
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-cards">
        <div className="admin-card">
          <h3>Total Users</h3>
          <div className="value">{users.length}</div>
        </div>
        <div className="admin-card">
          <h3>Bronze Users</h3>
          <div className="value">{users.filter(u => (u.points || 0) < 5000).length}</div>
        </div>
        <div className="admin-card">
          <h3>Silver Users</h3>
          <div className="value">{users.filter(u => (u.points || 0) >= 5000 && (u.points || 0) < 10000).length}</div>
        </div>
        <div className="admin-card">
          <h3>Gold Users</h3>
          <div className="value">{users.filter(u => (u.points || 0) >= 10000).length}</div>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Stats</th>
              <th>Current Badges</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  {searchTerm ? 'No users found matching your search' : 'No users found'}
                </td>
              </tr>
            ) : (
              users.map(u => (
                <tr key={u._id}>
                  <td>
                    <div style={{ fontWeight: '500' }}>{u.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{u.email}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                      Joined {new Date(u.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <div><strong>{u.points}</strong> points</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {u.stats?.reportsSubmitted || 0} reports submitted
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {u.stats?.reportsValidated || 0} reports validated
                    </div>
                  </td>
                  <td>
                    {getPointsBadge(u.points || 0)}
                  </td>
                  
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersManagement;

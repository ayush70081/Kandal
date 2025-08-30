import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../utils/axios';

const initialForm = {
  name: '',
  description: '',
  icon: '🏅',
  category: 'achievement',
  type: 'bronze',
  criteria: { type: 'points_total', threshold: 100, timeframe: 'all_time' },
  points: 0,
  rarity: 'common'
};

const BadgesManagement = () => {
  const [badges, setBadges] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.listBadges();
      if (res.data.success) {
        setBadges(res.data.data.badges);
        setError(null);
      } else {
        setError('Failed to load badges');
      }
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('criteria.')) {
      const key = name.split('.')[1];
      setForm(prev => ({ 
        ...prev, 
        criteria: { 
          ...prev.criteria, 
          [key]: key === 'threshold' ? parseInt(value, 10) || 0 : value 
        } 
      }));
    } else {
      setForm(prev => ({ 
        ...prev, 
        [name]: name === 'points' ? parseInt(value, 10) || 0 : value 
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createBadge(form);
      setForm(initialForm);
      setShowForm(false);
      await load();
      setError(null);
    } catch (e) {
      setError(`Failed to create badge: ${e.response?.data?.message || e.message}`);
    }
  };

  const getBadgeTypeColor = (type) => {
    const colors = {
      bronze: '#cd7f32',
      silver: '#c0c0c0',
      gold: '#ffd700',
      platinum: '#e5e4e2',
      special: '#9333ea'
    };
    return colors[type] || '#6b7280';
  };

  const getRarityColor = (rarity) => {
    const colors = {
      common: '#6b7280',
      uncommon: '#059669',
      rare: '#0284c7',
      epic: '#7c3aed',
      legendary: '#ea580c'
    };
    return colors[rarity] || '#6b7280';
  };

  if (loading) return <div className="admin-loading">Loading badges...</div>;

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Badge Management</h1>
        <button 
          className="admin-btn admin-btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : 'Create New Badge'}
        </button>
      </div>

      {error && <div className="admin-error">{error}</div>}

      {showForm && (
        <div className="admin-form">
          <h3 style={{ marginTop: 0 }}>Create New Badge</h3>
          <form onSubmit={handleSubmit}>
            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label>Badge Name</label>
                <input 
                  name="name" 
                  placeholder="e.g., First Reporter" 
                  value={form.name} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="admin-form-group">
                <label>Icon</label>
                <input 
                  name="icon" 
                  placeholder="🏅" 
                  value={form.icon} 
                  onChange={handleChange} 
                  required 
                />
              </div>
            </div>

            <div className="admin-form-group">
              <label>Description</label>
              <textarea 
                name="description" 
                placeholder="Describe what this badge represents..." 
                value={form.description} 
                onChange={handleChange} 
                required
                rows="3"
              />
            </div>

            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label>Category</label>
                <select name="category" value={form.category} onChange={handleChange}>
                  <option value="reporting">Reporting</option>
                  <option value="validation">Validation</option>
                  <option value="participation">Participation</option>
                  <option value="expertise">Expertise</option>
                  <option value="achievement">Achievement</option>
                  <option value="leadership">Leadership</option>
                </select>
              </div>
              <div className="admin-form-group">
                <label>Type</label>
                <select name="type" value={form.type} onChange={handleChange}>
                  <option value="bronze">Bronze</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                  <option value="platinum">Platinum</option>
                  <option value="special">Special</option>
                </select>
              </div>
              <div className="admin-form-group">
                <label>Rarity</label>
                <select name="rarity" value={form.rarity} onChange={handleChange}>
                  <option value="common">Common</option>
                  <option value="uncommon">Uncommon</option>
                  <option value="rare">Rare</option>
                  <option value="epic">Epic</option>
                  <option value="legendary">Legendary</option>
                </select>
              </div>
            </div>

            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label>Criteria Type</label>
                <select name="criteria.type" value={form.criteria.type} onChange={handleChange}>
                  <option value="report_count">Report Count</option>
                  <option value="validation_count">Validation Count</option>
                  <option value="points_total">Points Total</option>
                  <option value="consecutive_days">Consecutive Days</option>
                  <option value="special_action">Special Action</option>
                </select>
              </div>
              <div className="admin-form-group">
                <label>Threshold</label>
                <input 
                  name="criteria.threshold" 
                  type="number" 
                  placeholder="100" 
                  value={form.criteria.threshold} 
                  onChange={handleChange}
                  min="1"
                />
              </div>
              <div className="admin-form-group">
                <label>Timeframe</label>
                <select name="criteria.timeframe" value={form.criteria.timeframe} onChange={handleChange}>
                  <option value="all_time">All Time</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>

            <div className="admin-form-group">
              <label>Points Reward</label>
              <input 
                name="points" 
                type="number" 
                placeholder="0" 
                value={form.points} 
                onChange={handleChange}
                min="0"
              />
            </div>

            <button className="admin-btn admin-btn-primary" type="submit">
              Create Badge
            </button>
          </form>
        </div>
      )}

      <div className="admin-cards">
        <div className="admin-card">
          <h3>Total Badges</h3>
          <div className="value">{badges.length}</div>
        </div>
        <div className="admin-card">
          <h3>Active Badges</h3>
          <div className="value">{badges.filter(b => b.isActive).length}</div>
        </div>
        <div className="admin-card">
          <h3>Special Badges</h3>
          <div className="value">{badges.filter(b => b.type === 'special').length}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {badges.map(badge => (
          <div key={badge._id} className="admin-card" style={{ borderLeft: `4px solid ${getBadgeTypeColor(badge.type)}` }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '2rem', marginRight: '1rem' }}>{badge.icon}</span>
              <div>
                <h4 style={{ margin: 0, color: '#1f2937' }}>{badge.name}</h4>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <span 
                    style={{ 
                      background: getBadgeTypeColor(badge.type),
                      color: badge.type === 'silver' || badge.type === 'platinum' ? '#000' : '#fff',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      textTransform: 'capitalize'
                    }}
                  >
                    {badge.type}
                  </span>
                  <span 
                    style={{ 
                      background: getRarityColor(badge.rarity),
                      color: '#fff',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      textTransform: 'capitalize'
                    }}
                  >
                    {badge.rarity}
                  </span>
                </div>
              </div>
            </div>
            <p style={{ margin: '0 0 1rem 0', color: '#6b7280', fontSize: '0.875rem' }}>
              {badge.description}
            </p>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              <div><strong>Category:</strong> {badge.category}</div>
              <div><strong>Criteria:</strong> {badge.criteria.threshold} {badge.criteria.type.replace('_', ' ')} ({badge.criteria.timeframe.replace('_', ' ')})</div>
              <div><strong>Points:</strong> {badge.points}</div>
              <div><strong>Times Earned:</strong> {badge.stats?.timesEarned || 0}</div>
            </div>
          </div>
        ))}
      </div>

      {badges.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          <h3>No badges created yet</h3>
          <p>Create your first badge to start rewarding users for their contributions.</p>
        </div>
      )}
    </div>
  );
};

export default BadgesManagement;

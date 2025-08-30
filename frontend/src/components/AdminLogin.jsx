import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import '../styles/admin.css';

const AdminLogin = () => {
  const { login, isLoading, error } = useAdminAuth();
  const [email, setEmail] = useState('admin@gmail.com');
  const [password, setPassword] = useState('Admin@900');
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(email, password);
    if (result.success) {
      const from = location.state?.from?.pathname || '/admin';
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ color: '#10b981', marginBottom: '0.5rem' }}>Admin Portal</h2>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '0.875rem' }}>Sign in to access the admin dashboard</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              placeholder="admin@gmail.com"
            />
          </div>
          <div className="admin-form-group">
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              placeholder="Enter your password"
            />
          </div>
          {error && <div className="admin-error">{error}</div>}
          <button 
            className="admin-btn admin-btn-primary" 
            type="submit" 
            disabled={isLoading}
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.875rem' }}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.875rem', color: '#6b7280' }}>
          <p>Default credentials: admin@gmail.com / Admin@900</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;

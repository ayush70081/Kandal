import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import '../styles/admin.css';

const AdminLayout = () => {
  const { admin, logout } = useAdminAuth();
  const location = useLocation();

  const navItems = [
    { path: '/admin/reports', label: 'Reports' },
    { path: '/admin/users', label: 'Users' },
    { path: '/admin/leaderboard', label: 'Leaderboard' },
    { path: '/admin/analytics', label: 'Analytics' },
    { path: '/admin/map', label: 'Map' }
  ];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h3>Admin Portal</h3>
        <nav>
          <ul>
            {navItems.map(item => (
              <li key={item.path}>
                <Link 
                  to={item.path}
                  className={location.pathname === item.path ? 'active' : ''}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <main className="admin-content">
        <header className="admin-header">
          <div className="admin-user">
            Welcome, {admin?.name || 'Administrator'}
          </div>
          <button className="admin-btn admin-btn-secondary" onClick={logout}>
            Logout
          </button>
        </header>
        <div className="admin-page">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;

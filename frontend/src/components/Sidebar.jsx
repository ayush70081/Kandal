import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  FileText,
  ClipboardList,
  User,
  Trophy,
  LogOut,
  Leaf,
  AlertTriangle,
  X
} from 'lucide-react';
import '../styles/layout.css';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setShowLogoutModal(false);
    }
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  return (
    <aside className={`app-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="brand">
          <button
            className="brand-icon-btn"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Click to expand sidebar" : "Click to collapse sidebar"}
          >
            <Leaf size={collapsed ? 24 : 20} />
          </button>
          {!collapsed && <span className="brand-name">Mangrove</span>}
        </div>
      </div>



      <nav className="sidebar-nav">
        <NavLink to="/report" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">
            <FileText size={20} />
          </span>
          {!collapsed && <span className="nav-label">Submit Report</span>}
        </NavLink>
        <NavLink to="/reports" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">
            <ClipboardList size={20} />
          </span>
          {!collapsed && <span className="nav-label">Reports</span>}
        </NavLink>
        <NavLink to="/leaderboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">
            <Trophy size={20} />
          </span>
          {!collapsed && <span className="nav-label">Leaderboard</span>}
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">
            <User size={20} />
          </span>
          {!collapsed && <span className="nav-label">Profile</span>}
        </NavLink>


      </nav>

      <div className="sidebar-footer">
        <button className="logout" onClick={handleLogoutClick}>
          <span className="nav-icon">
            <LogOut size={20} />
          </span>
          {!collapsed && <span className="nav-label">Logout</span>}
        </button>
      </div>

      {/* Logout Confirmation Modal (Portal) */}
      {showLogoutModal && createPortal(
        (
          <div className="modal-overlay" onClick={handleCancelLogout}>
            <div className="modal-content logout-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-icon warning">
                  <AlertTriangle size={24} />
                </div>
                <button
                  className="modal-close"
                  onClick={handleCancelLogout}
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body">
                <h3>Confirm Logout</h3>
                <p>Are you sure you want to log out of Mangrove Guardian? You'll need to sign in again to access your account.</p>
              </div>

              <div className="modal-footer">
                <button
                  className="btn secondary"
                  onClick={handleCancelLogout}
                >
                  Cancel
                </button>
                <button
                  className="btn primary"
                  onClick={handleConfirmLogout}
                >
                  Yes, Logout
                </button>
              </div>
            </div>
          </div>
        ),
        document.body
      )}
    </aside>
  );
};

export default Sidebar;




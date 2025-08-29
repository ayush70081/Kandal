import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const { user, logout, updateProfile, changePassword, isLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Profile form state
  const [profileData, setProfileData] = useState({
    name: ''
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Initialize profile data when user is available
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || ''
      });
    }
  }, [user]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, error]);

  // Handle logout
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const result = await updateProfile(profileData);
      if (result.success) {
        setMessage('Profile updated successfully!');
        setIsEditing(false);
      } else {
        setError(result.error || 'Profile update failed');
      }
    } catch (err) {
      setError('Profile update failed');
    }
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
      const result = await changePassword(
        passwordData.currentPassword,
        passwordData.newPassword,
        passwordData.confirmPassword
      );

      if (result.success) {
        setMessage(result.message || 'Password changed successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setIsChangingPassword(false);
        // User will be logged out automatically
      } else {
        setError(result.error || 'Password change failed');
      }
    } catch (err) {
      setError('Password change failed');
    }
  };

  // Handle input changes
  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordInputChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  if (isLoading) {
    return (
      <div className="home-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="header-content">
          <h1>Welcome to Kandal</h1>
          <div className="user-info">
            <span>Hello, {user?.name}</span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="home-main">
        <nav className="home-nav">
          <button 
            className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button 
            className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button 
            className={`nav-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            Security
          </button>
        </nav>

        <div className="home-content">
          {/* Messages */}
          {message && <div className="message success">{message}</div>}
          {error && <div className="message error">{error}</div>}

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="tab-content">
              <h2>Dashboard</h2>
              <div className="dashboard-stats">
                <div className="stat-card">
                  <h3>Account Status</h3>
                  <p className="status active">Active</p>
                </div>
                <div className="stat-card">
                  <h3>Member Since</h3>
                  <p>{new Date(user?.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="stat-card">
                  <h3>Last Login</h3>
                  <p>{user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'First time login'}</p>
                </div>
              </div>
              <div className="user-details">
                <h3>User Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Name:</label>
                    <span>{user?.name}</span>
                  </div>
                  <div className="detail-item">
                    <label>Email:</label>
                    <span>{user?.email}</span>
                  </div>
                  <div className="detail-item">
                    <label>User ID:</label>
                    <span className="user-id">{user?._id}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="tab-content">
              <h2>Profile Management</h2>
              {!isEditing ? (
                <div className="profile-view">
                  <div className="profile-info">
                    <div className="info-item">
                      <label>Name:</label>
                      <span>{user?.name}</span>
                    </div>
                    <div className="info-item">
                      <label>Email:</label>
                      <span>{user?.email}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="btn primary"
                  >
                    Edit Profile
                  </button>
                </div>
              ) : (
                <form onSubmit={handleProfileUpdate} className="profile-form">
                  <div className="form-group">
                    <label htmlFor="name">Full Name:</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={profileData.name}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email:</label>
                    <input
                      type="email"
                      value={user?.email}
                      disabled
                      className="disabled"
                    />
                    <small>Email cannot be changed</small>
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn primary">
                      Save Changes
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        setIsEditing(false);
                        setProfileData({
                          name: user?.name || ''
                        });
                      }}
                      className="btn secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="tab-content">
              <h2>Security Settings</h2>
              {!isChangingPassword ? (
                <div className="security-view">
                  <div className="security-info">
                    <h3>Password</h3>
                    <p>Keep your account secure with a strong password.</p>
                  </div>
                  <button 
                    onClick={() => setIsChangingPassword(true)}
                    className="btn primary"
                  >
                    Change Password
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePasswordChange} className="password-form">
                  <div className="form-group">
                    <label htmlFor="currentPassword">Current Password:</label>
                    <input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="newPassword">New Password:</label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordInputChange}
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm New Password:</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordInputChange}
                      required
                    />
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn primary">
                      Change Password
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        setIsChangingPassword(false);
                        setPasswordData({
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: ''
                        });
                      }}
                      className="btn secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Home;
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import "./Profile.css";

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Profile form state
  const [profileData, setProfileData] = useState({
    name: "",
  });

  // Initialize profile data when user is available
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
      });
    }
  }, [user]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage("");
        setError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, error]);

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      await updateProfile(profileData);
      setMessage("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error("Profile update error:", error);
      setError(error.response?.data?.message || "Failed to update profile");
    }
  };

  // Handle profile change
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <>
      {/* Messages */}
      {message && <div className="message success">{message}</div>}
      {error && <div className="message error">{error}</div>}

      <div className="tab-content">
        <h2>👤 Profile Management</h2>
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
              <div className="info-item">
                <label>Member Since:</label>
                <span>{new Date(user?.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="info-item">
                <label>Points:</label>
                <span>{user?.points || 0}</span>
              </div>
              <div className="info-item">
                <label>Reports Submitted:</label>
                <span>{user?.stats?.reportsSubmitted || 0}</span>
              </div>
            </div>
            <button onClick={() => setIsEditing(true)} className="btn primary">
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
                    name: user?.name || "",
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
    </>
  );
};

export default Profile;

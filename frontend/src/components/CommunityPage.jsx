import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import { useAuth } from '../contexts/AuthContext';
import './CommunityPage.css';

const CommunityPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [communityName, setCommunityName] = useState('Environmental Community');
  const [upvotes, setUpvotes] = useState({});
  const [userUpvotes, setUserUpvotes] = useState({});
  const [showComments, setShowComments] = useState(null);
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState('');
  const [commentCounts, setCommentCounts] = useState({});
  
  const { user } = useAuth();

  // Fetch community name from coordinates
  const getCommunityName = async (lat, lng) => {
    try {
      // Skip API call if no valid API key is available
      // Using a simple location-based name instead
      const latRounded = Math.round(lat * 100) / 100;
      const lngRounded = Math.round(lng * 100) / 100;
      return `Mangrove Community (${latRounded}, ${lngRounded})`;
    } catch (error) {
      console.error('Error generating location name:', error);
      return 'Mangrove Community';
    }
  };

  // Fetch all reports for community
  const fetchReports = async () => {
    try {
      setLoading(true);
      console.log('Fetching reports from:', '/api/reports/all');
      
      // Try the new endpoint first, fallback to existing endpoint
      let response;
      try {
        response = await axios.get('/reports/all');
      } catch (error) {
        console.log('Fallback to /reports endpoint');
        // Fallback to existing reports endpoint
        response = await axios.get('/reports');
      }
      
      // Handle both response formats
      const reportsData = response.data.reports;
      setReports(reportsData);
      
      // Initialize upvote counts, user upvote status, and comment counts
      const upvoteCounts = {};
      const userUpvoteStatus = {};
      const initialCommentCounts = {};
      reportsData.forEach(report => {
        upvoteCounts[report._id] = report.upvoteCount || 0;
        userUpvoteStatus[report._id] = report.hasUpvoted || false;
        initialCommentCounts[report._id] = report.commentCount || 0;
      });
      setUpvotes(upvoteCounts);
      setUserUpvotes(userUpvoteStatus);
      setCommentCounts(initialCommentCounts);
      
      // Get community name from first report's location
      if (reportsData.length > 0 && reportsData[0].location) {
        const name = await getCommunityName(
          reportsData[0].location.coordinates[1],
          reportsData[0].location.coordinates[0]
        );
        setCommunityName(name);
      } else {
        setCommunityName('Mangrove Community');
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError('Failed to load community reports. Please make sure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  // Handle upvote
  const handleUpvote = async (reportId) => {
    try {
      const response = await axios.post(`/reports/${reportId}/upvote`);
      
      if (response.data.success) {
        // Update both count and user upvote status
        setUpvotes(prev => ({
          ...prev,
          [reportId]: response.data.upvoteCount
        }));
        setUserUpvotes(prev => ({
          ...prev,
          [reportId]: response.data.hasUpvoted
        }));
      }
    } catch (error) {
      console.error('Error upvoting:', error);
    }
  };

  // Fetch comments for a specific report
  const fetchComments = async (reportId) => {
    try {
      console.log('Fetching comments for report:', reportId);
      const response = await axios.get(`/reports/${reportId}/comments`);
      console.log('Comments response:', response.data);
      
      // Handle different response structures
      const commentsData = response.data.comments || response.data || [];
      setComments(prev => ({
        ...prev,
        [reportId]: commentsData
      }));
      
      // Update comment count
      setCommentCounts(prev => ({
        ...prev,
        [reportId]: commentsData.length
      }));
    } catch (error) {
      console.error('Error fetching comments:', error);
      console.error('Error details:', error.response?.data);
      // Set empty array on error to prevent undefined issues
      setComments(prev => ({
        ...prev,
        [reportId]: []
      }));
      setCommentCounts(prev => ({
        ...prev,
        [reportId]: 0
      }));
    }
  };

  // Handle comment button click
  const handleCommentClick = (reportId) => {
    if (showComments === reportId) {
      setShowComments(null);
    } else {
      setShowComments(reportId);
      if (!comments[reportId]) {
        fetchComments(reportId);
      }
    }
  };

  // Handle adding a comment
  const handleAddComment = async (reportId) => {
    console.log('handleAddComment called with reportId:', reportId);
    console.log('newComment value:', newComment);
    
    if (!newComment.trim()) {
      console.log('Comment is empty, returning early');
      return;
    }

    try {
      console.log('Sending comment request...');
      const response = await axios.post(`/reports/${reportId}/comments`, {
        content: newComment.trim()
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Comment response:', response.data);

      // Handle different response structures
      const newCommentData = response.data.comment || response.data;
      
      if (newCommentData && (response.data.success !== false)) {
        setNewComment('');
        console.log('Comment added successfully');
        
        // Update comment count immediately
        setCommentCounts(prev => ({
          ...prev,
          [reportId]: (prev[reportId] || 0) + 1
        }));
        
        // Refresh comments immediately to get the persisted data
        fetchComments(reportId);
      } else {
        console.log('Unexpected response format:', response.data);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      console.error('Error details:', error.response?.data);
    }
  };

  // Real-time data refresh for counters
  const refreshCounters = async () => {
    try {
      const response = await axios.get('/reports/all');
      const reportsData = response.data.reports;
      
      // Update upvote counts and comment counts
      const updatedUpvotes = {};
      const updatedUserUpvotes = {};
      const updatedCommentCounts = {};
      
      reportsData.forEach(report => {
        updatedUpvotes[report._id] = report.upvoteCount || 0;
        updatedUserUpvotes[report._id] = report.hasUpvoted || false;
        updatedCommentCounts[report._id] = report.commentCount || 0;
      });
      
      setUpvotes(updatedUpvotes);
      setUserUpvotes(updatedUserUpvotes);
      setCommentCounts(updatedCommentCounts);
    } catch (error) {
      console.error('Error refreshing counters:', error);
    }
  };

  useEffect(() => {
    fetchReports();
    
    // Set up real-time polling for counters every 30 seconds
    const intervalId = setInterval(refreshCounters, 30000);
    
    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  if (loading) {
    return (
      <div className="community-page">
        <div className="loading-container">
          <div className="loading-card">
            <div className="modern-spinner"></div>
            <p>Loading community posts...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="community-page">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchReports} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="community-page">
      {/* Header */}
      <div className="community-header">
        <div className="community-info">
          <div className="community-icon">🌿</div>
          <div className="community-details">
            <h1 className="community-name">r/{communityName}</h1>
            <p className="community-description">
              Mangrove conservation reports from your local community
            </p>
            <div className="community-stats">
              <span className="member-count">{reports.length} posts</span>
              <span className="online-count">🟢 Active now</span>
            </div>
          </div>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="posts-container">
        {reports.length === 0 ? (
          <div className="no-posts">
            <p>No reports have been shared in this community yet.</p>
            <p>Be the first to report an environmental issue!</p>
          </div>
        ) : (
          reports.map((report) => (
            <div key={report._id} className="post-card">
              {/* Post Header */}
              <div className="post-header">
                <div className="user-info">
                  <div className="user-avatar">
                    {report.reporter?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="post-meta">
                    <span className="username">
                      u/{report.reporter?.name || 'Anonymous'}
                    </span>
                    <span className="post-time">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="post-badges">
                  <div className="incident-badge">
                    {report.incidentType?.replace('_', ' ').toUpperCase()}
                  </div>
                  <div className={`status-badge ${report.status || 'pending'}`}>
                    {report.status === 'verified' ? '✓ VERIFIED' : 
                     report.status === 'under_review' ? '⏳ UNDER REVIEW' :
                     report.status === 'resolved' ? '✅ RESOLVED' :
                     '⏱️ PENDING'}
                  </div>
                </div>
              </div>

              {/* Post Title */}
              <h2 className="post-title">{report.title}</h2>

              {/* Post Description */}
              <p className="post-description">{report.description}</p>

              {/* Image Carousel */}
              {report.photos && report.photos.length > 0 && (
                <div className="image-carousel">
                  <div className="carousel-container" id={`carousel-${report._id}`}>
                    {report.photos.map((photo, index) => (
                      <div key={index} className="carousel-slide">
                        <img
                          src={`http://localhost:5000/uploads/reports/${photo.filename || photo.originalName || photo}`}
                          alt={`Environmental report evidence ${index + 1}`}
                          className="post-image"
                          onError={(e) => {
                            console.log('Image failed to load:', e.target.src);
                            console.log('Photo object:', photo);
                            // Try alternative path
                            if (!e.target.dataset.retried) {
                              e.target.dataset.retried = 'true';
                              e.target.src = `http://localhost:5000${photo.path || '/uploads/reports/' + (photo.filename || photo)}`;
                            } else {
                              // Show placeholder
                              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzg3OGE4YyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPvCfk7cgSW1hZ2UgTm90IEF2YWlsYWJsZTwvdGV4dD4KICA8dGV4dCB4PSI1MCUiIHk9IjcwJSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjYWRiNWJkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+RW52aXJvbm1lbnRhbCBSZXBvcnQgRXZpZGVuY2U8L3RleHQ+Cjwvc3ZnPg==';
                              e.target.classList.add('placeholder-image');
                            }
                          }}
                          onLoad={() => console.log('Image loaded successfully:', photo.filename)}
                        />
                      </div>
                    ))}
                  </div>
                  {report.photos.length > 1 && (
                    <div className="carousel-indicators">
                      {report.photos.map((_, index) => (
                        <span 
                          key={index} 
                          className={`indicator ${index === 0 ? 'active' : ''}`}
                          onClick={() => {
                            const carousel = document.getElementById(`carousel-${report._id}`);
                            carousel.scrollTo({ left: index * carousel.offsetWidth, behavior: 'smooth' });
                          }}
                        ></span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Post Footer */}
              <div className="post-footer">
                <button 
                  className={`upvote-btn ${userUpvotes[report._id] ? 'upvoted' : ''}`}
                  onClick={() => handleUpvote(report._id)}
                >
                  <span className="upvote-icon">⬆️</span>
                  <span className="upvote-count">{upvotes[report._id] || 0}</span>
                  <span className="upvote-text">{userUpvotes[report._id] ? 'Upvoted' : 'Upvote'}</span>
                </button>
                
                <button 
                  className={`comment-btn ${showComments === report._id ? 'active' : ''}`}
                  onClick={() => handleCommentClick(report._id)}
                >
                  <span className="comment-icon">💬</span>
                  <span className="comment-text">
                    {commentCounts[report._id] || comments[report._id]?.length || 0} Comments
                  </span>
                </button>
                
                <button className="share-btn">
                  <span className="share-icon">📤</span>
                  <span className="share-text">Share</span>
                </button>
              </div>

              {/* Comments Section */}
              {showComments === report._id && (
                <div className="comments-section">
                  <div className="comments-header">
                    <h3>Comments ({commentCounts[report._id] || comments[report._id]?.length || 0})</h3>
                    <button
                      className="close-comments"
                      onClick={() => setShowComments(null)}
                    >
                      ×
                    </button>
                  </div>
                  
                  <div className="comments-container">
                    {/* Scrollable Comments List */}
                    <div className="comments-list-scrollable">
                      {comments[report._id]?.length > 0 ? (
                        comments[report._id].map((comment) => (
                          <div key={comment._id} className="comment-item">
                            <div className="comment-header">
                              <span className="comment-author">
                                {comment.userId?.name || 'Anonymous User'}
                              </span>
                              <span className="comment-date">
                                {new Date(comment.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="comment-content">
                              {comment.content}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="no-comments">
                          <p>No comments yet. Be the first to comment!</p>
                        </div>
                      )}
                    </div>

                    {/* Fixed Comment Input at Bottom */}
                    <div className="add-comment-form-fixed">
                      <div className="comment-input-container">
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Write a comment..."
                          className="comment-input"
                          rows="3"
                        />
                        <button
                          onClick={() => handleAddComment(report._id)}
                          className="submit-comment-btn"
                          disabled={!newComment.trim()}
                        >
                          Post Comment
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommunityPage;

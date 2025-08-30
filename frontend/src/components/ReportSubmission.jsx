import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from '../utils/axios';
import { useAuth } from '../contexts/AuthContext';
import './ReportSubmission.css';

const ReportSubmission = () => {
  const [formData, setFormData] = useState({
    title: '',
    incidentType: 'illegal_cutting',
    description: '',
    severity: 'medium',
    location: {
      latitude: null,
      longitude: null
    },
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      postalCode: ''
    },
    tags: ''
  });
  
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewPhotos, setPreviewPhotos] = useState([]);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  // Incident type options
  const incidentTypes = [
    { value: 'illegal_cutting', label: 'Illegal Tree Cutting' },
    { value: 'dumping', label: 'Waste Dumping' },
    { value: 'pollution', label: 'Water/Soil Pollution' },
    { value: 'land_reclamation', label: 'Land Reclamation' },
    { value: 'wildlife_disturbance', label: 'Wildlife Disturbance' },
    { value: 'erosion', label: 'Coastal Erosion' },
    { value: 'oil_spill', label: 'Oil Spill' },
    { value: 'construction', label: 'Unauthorized Construction' },
    { value: 'other', label: 'Other Environmental Issue' }
  ];

  // Severity options
  const severityOptions = [
    { value: 'low', label: 'Low Priority', description: 'Minor incident, no immediate threat' },
    { value: 'medium', label: 'Medium Priority', description: 'Moderate damage, requires attention' },
    { value: 'high', label: 'High Priority', description: 'Significant damage, urgent action needed' },
    { value: 'critical', label: 'Critical Priority', description: 'Severe damage, immediate response required' }
  ];

  // Get current location
  const getCurrentLocation = () => {
    setLocationLoading(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            location: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            }
          }));
          setLocationLoading(false);
          toast.success('Location coordinates captured successfully!');
        },
        (error) => {
          console.error('Geolocation error:', error);
          setLocationLoading(false);
          toast.error('Unable to get location. Please enter manually.');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } else {
      setLocationLoading(false);
      toast.error('Geolocation is not supported by this browser.');
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    if (error) setError('');
  };

  // Handle location coordinate changes
  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [name]: parseFloat(value) || null
      }
    }));
  };

  // File upload handling
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.heic']
    },
    maxFiles: 5,
    maxSize: 10 * 1024 * 1024, // 10MB
    onDrop: (acceptedFiles) => {
      setPhotos(prev => [...prev, ...acceptedFiles]);
      
      // Create preview URLs
      const newPreviews = acceptedFiles.map(file => ({
        file,
        url: URL.createObjectURL(file),
        id: Math.random().toString(36).substr(2, 9)
      }));
      
      setPreviewPhotos(prev => [...prev, ...newPreviews]);
    },
    onDropRejected: (rejectedFiles) => {
      rejectedFiles.forEach(rejection => {
        const { file, errors } = rejection;
        errors.forEach(error => {
          if (error.code === 'file-too-large') {
            toast.error(`File ${file.name} is too large. Maximum size is 10MB.`);
          } else if (error.code === 'file-invalid-type') {
            toast.error(`File ${file.name} is not a supported image format.`);
          } else if (error.code === 'too-many-files') {
            toast.error('Maximum 5 photos allowed.');
          }
        });
      });
    }
  });

  // Remove photo
  const removePhoto = (id) => {
    setPreviewPhotos(prev => {
      const photoToRemove = prev.find(p => p.id === id);
      if (photoToRemove) {
        URL.revokeObjectURL(photoToRemove.url);
      }
      return prev.filter(p => p.id !== id);
    });
    
    setPhotos(prev => prev.filter((_, index) => 
      previewPhotos[index] && previewPhotos[index].id !== id
    ));
  };

  // Form validation
  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return false;
    }
    
    if (!formData.description.trim() || formData.description.length < 10) {
      setError('Description must be at least 10 characters long');
      return false;
    }
    
    if (!formData.location.latitude || !formData.location.longitude) {
      setError('Location coordinates are required. Please capture your location or enter manually.');
      return false;
    }
    
    if (photos.length === 0) {
      setError('At least one photo is required as evidence');
      return false;
    }
    
    return true;
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Prepare form data for submission
      const submitData = new FormData();
      
      // Add form fields
      submitData.append('title', formData.title);
      submitData.append('incidentType', formData.incidentType);
      submitData.append('description', formData.description);
      submitData.append('severity', formData.severity);
      submitData.append('location', JSON.stringify(formData.location));
      submitData.append('tags', formData.tags);
      
      // Add address if provided
      if (Object.values(formData.address).some(value => value.trim())) {
        submitData.append('address', JSON.stringify(formData.address));
      }
      
      // Add photos
      photos.forEach((photo) => {
        submitData.append('photos', photo);
      });
      
      // Submit to API
      const response = await axios.post('/reports/submit', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data) {
        toast.success(`Report submitted successfully! You earned ${response.data.pointsAwarded} points.`);
        
        // Clean up preview URLs
        previewPhotos.forEach(photo => {
          URL.revokeObjectURL(photo.url);
        });
        
        // Navigate to reports list or report detail
        navigate(`/reports/${response.data.report._id}`);
      }
      
    } catch (error) {
      console.error('Error submitting report:', error);
      
      if (error.response?.data?.details) {
        // Handle validation errors
        const details = error.response.data.details;
        const errorMessages = details.map(detail => detail.msg).join(', ');
        setError(errorMessages);
      } else {
        setError(error.response?.data?.message || 'Failed to submit report. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      previewPhotos.forEach(photo => {
        URL.revokeObjectURL(photo.url);
      });
    };
  }, []);

  return (
    <div className="report-submission-page">
      <div className="page-container">
        {/* Header Section */}
        <div className="page-header">
          <div className="header-content">
            <h1 className="page-title">Environmental Incident Report</h1>
            <p className="page-subtitle">
              Submit detailed information about environmental incidents to help protect mangrove ecosystems
            </p>
          </div>
        </div>

        {/* Main Form */}
        <div className="form-container">
          <form onSubmit={handleSubmit} className="incident-form">
            {/* Error Alert */}
            {error && (
              <div className="alert alert-error">
                <div className="alert-content">
                  <strong>Error:</strong> {error}
                </div>
              </div>
            )}

            {/* Basic Information Section */}
            <div className="form-section">
              <h2 className="section-title">Basic Information</h2>
              
              <div className="form-grid">
                <div className="form-field full-width">
                  <label className="field-label" htmlFor="title">
                    Report Title <span className="required">*</span>
                  </label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    className="form-input"
                    placeholder="Enter a brief, descriptive title for this incident"
                    value={formData.title}
                    onChange={handleChange}
                    maxLength={200}
                    required
                  />
                  <div className="field-info">
                    {formData.title.length}/200 characters
                  </div>
                </div>

                <div className="form-field full-width">
                  <label className="field-label">
                    Incident Type <span className="required">*</span>
                  </label>
                  <div className="radio-grid">
                    {incidentTypes.map(type => (
                      <label key={type.value} className={`radio-card ${
                        formData.incidentType === type.value ? 'selected' : ''
                      }`}>
                        <input
                          type="radio"
                          name="incidentType"
                          value={type.value}
                          checked={formData.incidentType === type.value}
                          onChange={handleChange}
                          className="radio-input"
                        />
                        <div className="radio-content">
                          <span className="radio-label">{type.label}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-field full-width">
                  <label className="field-label">
                    Priority Level <span className="required">*</span>
                  </label>
                  <div className="priority-options">
                    {severityOptions.map(option => (
                      <label key={option.value} className={`priority-card ${
                        formData.severity === option.value ? 'selected' : ''
                      } priority-${option.value}`}>
                        <input
                          type="radio"
                          name="severity"
                          value={option.value}
                          checked={formData.severity === option.value}
                          onChange={handleChange}
                          className="radio-input"
                        />
                        <div className="priority-content">
                          <span className="priority-label">{option.label}</span>
                          <span className="priority-description">{option.description}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="form-section">
              <h2 className="section-title">Incident Details</h2>
              
              <div className="form-field full-width">
                <label className="field-label" htmlFor="description">
                  Detailed Description <span className="required">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  className="form-textarea"
                  placeholder="Provide comprehensive details about the incident including what you observed, when it occurred, potential causes, and any immediate impacts you noticed..."
                  value={formData.description}
                  onChange={handleChange}
                  rows={6}
                  maxLength={2000}
                  required
                />
                <div className="field-info">
                  {formData.description.length}/2000 characters (minimum 10 required)
                </div>
              </div>
            </div>

            {/* Location Section */}
            <div className="form-section">
              <h2 className="section-title">Location Information</h2>
              
              <div className="location-capture">
                <button
                  type="button"
                  className={`location-button ${locationLoading ? 'loading' : ''}`}
                  onClick={getCurrentLocation}
                  disabled={locationLoading}
                >
                  {locationLoading ? 'Capturing Location...' : 'Capture Current Location'}
                </button>
                <p className="location-help">
                  Click to automatically capture your current GPS coordinates
                </p>
              </div>
              
              <div className="form-grid">
                <div className="form-field">
                  <label className="field-label" htmlFor="latitude">
                    Latitude <span className="required">*</span>
                  </label>
                  <input
                    id="latitude"
                    name="latitude"
                    type="number"
                    step="any"
                    className="form-input"
                    placeholder="12.5678"
                    value={formData.location.latitude || ''}
                    onChange={handleLocationChange}
                  />
                </div>
                <div className="form-field">
                  <label className="field-label" htmlFor="longitude">
                    Longitude <span className="required">*</span>
                  </label>
                  <input
                    id="longitude"
                    name="longitude"
                    type="number"
                    step="any"
                    className="form-input"
                    placeholder="101.2345"
                    value={formData.location.longitude || ''}
                    onChange={handleLocationChange}
                  />
                </div>
              </div>

              <div className="address-section">
                <h3 className="subsection-title">Address (Optional)</h3>
                <div className="form-grid">
                  <div className="form-field full-width">
                    <input
                      name="address.street"
                      className="form-input"
                      placeholder="Street address"
                      value={formData.address.street}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-field">
                    <input
                      name="address.city"
                      className="form-input"
                      placeholder="City"
                      value={formData.address.city}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-field">
                    <input
                      name="address.state"
                      className="form-input"
                      placeholder="State/Province"
                      value={formData.address.state}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-field">
                    <input
                      name="address.country"
                      className="form-input"
                      placeholder="Country"
                      value={formData.address.country}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-field">
                    <input
                      name="address.postalCode"
                      className="form-input"
                      placeholder="Postal Code"
                      value={formData.address.postalCode}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Evidence Section */}
            <div className="form-section">
              <h2 className="section-title">Photo Evidence</h2>
              
              <div className="upload-section">
                <div {...getRootProps()} className={`file-dropzone ${
                  isDragActive ? 'drag-active' : ''
                }`}>
                  <input {...getInputProps()} />
                  <div className="dropzone-content">
                    <div className="upload-icon">
                      <div className="icon-placeholder"></div>
                    </div>
                    <div className="upload-text">
                      <p className="upload-primary">
                        {isDragActive
                          ? 'Drop photos here to upload'
                          : 'Drag and drop photos here, or click to browse'
                        }
                      </p>
                      <p className="upload-secondary">
                        Maximum 5 photos, 10MB each • Supported: JPEG, PNG, WebP, HEIC
                      </p>
                    </div>
                  </div>
                </div>
                
                {previewPhotos.length > 0 && (
                  <div className="photo-grid">
                    {previewPhotos.map((photo) => (
                      <div key={photo.id} className="photo-item">
                        <div className="photo-wrapper">
                          <img src={photo.url} alt="Evidence" className="photo-preview" />
                          <button
                            type="button"
                            className="photo-remove"
                            onClick={() => removePhoto(photo.id)}
                            title="Remove photo"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Additional Information */}
            <div className="form-section">
              <h2 className="section-title">Additional Information</h2>
              
              <div className="form-field full-width">
                <label className="field-label" htmlFor="tags">
                  Tags (Optional)
                </label>
                <input
                  id="tags"
                  name="tags"
                  type="text"
                  className="form-input"
                  placeholder="Enter relevant tags separated by commas (e.g., urgent, pollution, wildlife)"
                  value={formData.tags}
                  onChange={handleChange}
                />
                <div className="field-info">
                  Tags help categorize and prioritize your report
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/home')}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`btn btn-primary ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                {loading ? 'Submitting Report...' : 'Submit Report'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportSubmission;
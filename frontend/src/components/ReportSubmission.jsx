import React, { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "../utils/axios";
import { useAuth } from "../contexts/AuthContext";
import "./ReportSubmission.css";

const ReportSubmission = () => {
  const [formData, setFormData] = useState({
    title: "",
    incidentType: "illegal_cutting",
    description: "",
    severity: "medium",
    location: {
      latitude: null,
      longitude: null,
    },
  });

  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewPhotos, setPreviewPhotos] = useState([]);
  const [analysisResult, setAnalysisResult] = useState("");
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [isMangroveValid, setIsMangroveValid] = useState(true);

  const { user } = useAuth();
  const navigate = useNavigate();

  // Incident type options
  const incidentTypes = [
    { value: "illegal_cutting", label: "Illegal Tree Cutting" },
    { value: "dumping", label: "Waste Dumping" },
    { value: "pollution", label: "Water/Soil Pollution" },
    { value: "land_reclamation", label: "Land Reclamation" },
    { value: "wildlife_disturbance", label: "Wildlife Disturbance" },
    { value: "erosion", label: "Coastal Erosion" },
    { value: "oil_spill", label: "Oil Spill" },
    { value: "construction", label: "Unauthorized Construction" },
    { value: "other", label: "Other Environmental Issue" },
  ];

  // Severity options
  const severityOptions = [
    {
      value: "low",
      label: "Low Priority",
      description: "Minor incident, no immediate threat",
    },
    {
      value: "medium",
      label: "Medium Priority",
      description: "Moderate damage, requires attention",
    },
    {
      value: "high",
      label: "High Priority",
      description: "Significant damage, urgent action needed",
    },
    {
      value: "critical",
      label: "Critical Priority",
      description: "Severe damage, immediate response required",
    },
  ];

  // Analyze Image
  const analyzeImage = async (file) => {
    if (!file) return;

    setAnalysisLoading(true);
    setAnalysisResult("");

    const formData = new FormData();
    // CHANGE THIS LINE:
    formData.append("image", file); // Use 'image' instead of 'photos'

    try {
      const response = await axios.post("/reports/analyze-image", formData);
      setAnalysisResult(response.data.analysis);
      setIsMangroveValid(response.data.isMangrove);
      
      if (!response.data.isMangrove) {
        toast.error("This image does not contain mangrove content. Please upload photos of mangrove areas only.");
      }
    } catch (error) {
      console.error("Image analysis error:", error);
      toast.error("Could not analyze the image.");
      setIsMangroveValid(false);
    } finally {
      setAnalysisLoading(false);
    }
  };

  // Get current location
  const getCurrentLocation = () => {
    if (locationLoading) return;

    setLocationLoading(true);

    if (!("geolocation" in navigator)) {
      setLocationLoading(false);
      toast.error("Geolocation is not supported by this browser.");
      return;
    }

    const hostname = window.location.hostname || "";
    const isLocalhost =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1";
    if (!window.isSecureContext && !isLocalhost) {
      setLocationLoading(false);
      toast.error(
        "Geolocation requires HTTPS or localhost. Please use a secure context."
      );
      return;
    }

    let hasCompleted = false;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (hasCompleted) return;
        hasCompleted = true;

        setFormData((prev) => ({
          ...prev,
          location: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
        }));
        setLocationLoading(false);
        toast.success("Location coordinates captured successfully!");
      },
      (error) => {
        if (hasCompleted) return;
        hasCompleted = true;

        console.error("Geolocation error:", {
          code: error?.code,
          message: error?.message,
        });
        setLocationLoading(false);

        let errorMessage = "Unable to get location. Please enter manually.";

        switch (error?.code) {
          case 1:
            errorMessage =
              "Location access denied. Please enable location permissions and try again.";
            break;
          case 2:
            errorMessage =
              "Location information unavailable. Please enter coordinates manually.";
            break;
          case 3:
            errorMessage =
              "Location request timed out. Please try again or enter manually.";
            break;
          default:
            errorMessage =
              error?.message ||
              "Unable to get location. Please enter coordinates manually.";
            break;
        }

        toast.error(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) setError("");
  };

  // File upload handling
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp", ".heic"],
    },
    maxFiles: 5,
    maxSize: 10 * 1024 * 1024,
    onDrop: (acceptedFiles) => {
      setPhotos((prev) => [...prev, ...acceptedFiles]);

      if (acceptedFiles.length > 0) {
        analyzeImage(acceptedFiles[0]);
      }

      const newPreviews = acceptedFiles.map((file) => ({
        file,
        url: URL.createObjectURL(file),
        id: Math.random().toString(36).substr(2, 9),
      }));

      setPreviewPhotos((prev) => [...prev, ...newPreviews]);
    },
    onDropRejected: (rejectedFiles) => {
      rejectedFiles.forEach((rejection) => {
        const { file, errors } = rejection;
        errors.forEach((error) => {
          if (error.code === "file-too-large") {
            toast.error(
              `File ${file.name} is too large. Maximum size is 10MB.`
            );
          } else if (error.code === "file-invalid-type") {
            toast.error(`File ${file.name} is not a supported image format.`);
          } else if (error.code === "too-many-files") {
            toast.error("Maximum 5 photos allowed.");
          }
        });
      });
    },
  });

  // Remove photo
  const removePhoto = (id) => {
    setPreviewPhotos((prev) => {
      const photoToRemove = prev.find((p) => p.id === id);
      if (photoToRemove) {
        URL.revokeObjectURL(photoToRemove.url);
      }
      return prev.filter((p) => p.id !== id);
    });

    setPhotos((prev) =>
      prev.filter(
        (_, index) => previewPhotos[index] && previewPhotos[index].id !== id
      )
    );
  };

  // Form validation
  const validateForm = () => {
    if (!formData.title.trim()) {
      setError("Title is required");
      return false;
    }

    if (!formData.description.trim() || formData.description.length < 10) {
      setError("Description must be at least 10 characters long");
      return false;
    }

    if (!formData.location.latitude || !formData.location.longitude) {
      setError(
        "Location coordinates are required. Please capture your location."
      );
      return false;
    }

    if (photos.length === 0) {
      setError("At least one photo is required as evidence");
      return false;
    }

    // Check if Gemini API detected non-mangrove content
    if (!isMangroveValid) {
      setError("The uploaded image does not contain mangrove content. Please upload photos of mangrove areas only.");
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
    setError("");

    try {
      const submitData = new FormData();

      submitData.append("title", formData.title);
      submitData.append("incidentType", formData.incidentType);
      submitData.append("description", formData.description);
      submitData.append("severity", formData.severity);
      submitData.append("location", JSON.stringify(formData.location));

      photos.forEach((photo) => {
        submitData.append("photos", photo);
      });

      const response = await axios.post("/reports/submit", submitData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data) {
        toast.success(
          `Report submitted successfully! You earned ${response.data.pointsAwarded} points.`
        );

        previewPhotos.forEach((photo) => {
          URL.revokeObjectURL(photo.url);
        });

        navigate(`/reports/${response.data.report._id}`);
      }
    } catch (error) {
      console.error("Error submitting report:", error);

      if (error.response?.data?.details) {
        const details = error.response.data.details;
        const errorMessages = details.map((detail) => detail.msg).join(", ");
        setError(errorMessages);
      } else {
        setError(
          error.response?.data?.message ||
            "Failed to submit report. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      previewPhotos.forEach((photo) => {
        URL.revokeObjectURL(photo.url);
      });
    };
  }, []);

  return (
    <div className="report-submission-page">
      <div className="page-container">
        <div className="page-header">
          <div className="header-content">
            <h1 className="page-title">Environmental Incident Report</h1>
            <p className="page-subtitle">
              Submit detailed information about environmental incidents to help
              protect mangrove ecosystems
            </p>
          </div>
        </div>

        <div className="form-container">
          <form onSubmit={handleSubmit} className="incident-form">
            {error && (
              <div className="alert alert-error">
                <div className="alert-content">
                  <strong>Error:</strong> {error}
                </div>
              </div>
            )}

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
                    {incidentTypes.map((type) => (
                      <label
                        key={type.value}
                        className={`radio-card ${
                          formData.incidentType === type.value ? "selected" : ""
                        }`}
                      >
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
                    {severityOptions.map((option) => (
                      <label
                        key={option.value}
                        className={`priority-card ${
                          formData.severity === option.value ? "selected" : ""
                        } priority-${option.value}`}
                      >
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
                          <span className="priority-description">
                            {option.description}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

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
                  {formData.description.length}/2000 characters (minimum 10
                  required)
                </div>
              </div>
            </div>

            <div className="form-section">
              <h2 className="section-title">Location Information</h2>

              <div className="location-capture">
                <button
                  type="button"
                  className={`location-button ${
                    locationLoading ? "loading" : ""
                  }`}
                  onClick={getCurrentLocation}
                  disabled={locationLoading}
                >
                  {locationLoading
                    ? "Capturing Location..."
                    : "Capture Current Location"}
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
                    type="text"
                    inputMode="decimal"
                    readOnly
                    className="form-input"
                    placeholder="Auto-Detected"
                    value={
                      typeof formData.location.latitude === "number"
                        ? formData.location.latitude.toFixed(6)
                        : ""
                    }
                  />
                </div>
                <div className="form-field">
                  <label className="field-label" htmlFor="longitude">
                    Longitude <span className="required">*</span>
                  </label>
                  <input
                    id="longitude"
                    name="longitude"
                    type="text"
                    inputMode="decimal"
                    readOnly
                    className="form-input"
                    placeholder="Auto-Detected"
                    value={
                      typeof formData.location.longitude === "number"
                        ? formData.location.longitude.toFixed(6)
                        : ""
                    }
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h2 className="section-title">Photo Evidence</h2>

              <div className="upload-section">
                <div
                  {...getRootProps()}
                  className={`file-dropzone ${
                    isDragActive ? "drag-active" : ""
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="dropzone-content">
                    <div className="upload-icon">
                      <div className="icon-placeholder"></div>
                    </div>
                    <div className="upload-text">
                      <p className="upload-primary">
                        {isDragActive
                          ? "Drop photos here to upload"
                          : "Drag and drop photos here, or click to browse"}
                      </p>
                      <p className="upload-secondary">
                        Maximum 5 photos, 10MB each • Supported: JPEG, PNG,
                        WebP, HEIC
                      </p>
                    </div>
                  </div>
                </div>

                {previewPhotos.length > 0 && (
                  <div className="photo-grid">
                    {previewPhotos.map((photo) => (
                      <div key={photo.id} className="photo-item">
                        <div className="photo-wrapper">
                          <img
                            src={photo.url}
                            alt="Evidence"
                            className="photo-preview"
                          />
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

            {(analysisLoading || (analysisResult && isMangroveValid)) && (
              <div className="form-section">
                <h2 className="section-title">Image Analysis</h2>
                {analysisLoading && (
                  <div className="loading-state">Loading analysis...</div>
                )}
                {analysisResult && isMangroveValid && (
                  <div className="analysis-result analysis-success">
                    <div className="analysis-content">
                      {analysisResult.split("\n").filter(line => line.trim()).map((line, index) => {
                        // Check if line contains threat detection
                        if (line.toLowerCase().includes("threat detected")) {
                          return (
                            <div key={index} className="threat-detection">
                              <strong>🚨 {line}</strong>
                            </div>
                          );
                        }
                        // Check if line contains threat level
                        if (line.toLowerCase().includes("threat level")) {
                          return (
                            <div key={index} className="threat-level">
                              <em>{line}</em>
                            </div>
                          );
                        }
                        // Check if line contains species information
                        if (line.toLowerCase().includes("species") || line.toLowerCase().includes("benefits") || line.toLowerCase().includes("locations")) {
                          return (
                            <div key={index} className="species-info">
                              <span className="info-point">• {line}</span>
                            </div>
                          );
                        }
                        // Regular analysis text
                        return <p key={index} className="analysis-text">{line}</p>;
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate("/reports")}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`btn btn-primary ${loading ? "loading" : ""}`}
                disabled={loading || !isMangroveValid}
              >
                {loading ? "Submitting Report..." : "Submit Report"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportSubmission;

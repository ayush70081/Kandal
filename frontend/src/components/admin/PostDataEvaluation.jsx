import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from '../../utils/axios';
import './PostDataEvaluation.css';

const PostDataEvaluation = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showMetadataModal, setShowMetadataModal] = useState(false);
  const [metadata, setMetadata] = useState({});
  const [estimationResult, setEstimationResult] = useState(null);
  const [estimationLoading, setEstimationLoading] = useState(false);

  // Incident type specific metadata fields
  const metadataFields = {
    illegal_cutting: [
      { key: 'treesCount', label: 'Estimated number of trees cut', type: 'number', unit: 'trees' },
      { key: 'areaAffected', label: 'Area affected', type: 'number', unit: 'hectares' },
      { key: 'biomassLoss', label: 'Estimated biomass loss', type: 'number', unit: 'tons' },
      { key: 'treeAge', label: 'Average age of cut trees', type: 'number', unit: 'years' }
    ],
    dumping: [
      { key: 'wasteVolume', label: 'Volume of waste dumped', type: 'number', unit: 'cubic meters' },
      { key: 'wasteType', label: 'Type of waste', type: 'select', options: ['Plastic', 'Chemical', 'Organic', 'Mixed'] },
      { key: 'areaContaminated', label: 'Area contaminated', type: 'number', unit: 'square meters' },
      { key: 'waterBodyAffected', label: 'Water body affected', type: 'boolean' }
    ],
    pollution: [
      { key: 'pollutantType', label: 'Type of pollutant', type: 'select', options: ['Chemical', 'Oil', 'Heavy Metals', 'Sewage', 'Other'] },
      { key: 'concentrationLevel', label: 'Concentration level', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] },
      { key: 'areaAffected', label: 'Area affected', type: 'number', unit: 'hectares' },
      { key: 'waterQualityImpact', label: 'Water quality impact severity', type: 'select', options: ['Minor', 'Moderate', 'Severe', 'Critical'] }
    ],
    oil_spill: [
      { key: 'spillVolume', label: 'Volume of oil spilled', type: 'number', unit: 'liters' },
      { key: 'spillArea', label: 'Area affected by spill', type: 'number', unit: 'square meters' },
      { key: 'oilType', label: 'Type of oil', type: 'select', options: ['Crude Oil', 'Diesel', 'Gasoline', 'Heavy Fuel Oil', 'Other'] },
      { key: 'cleanupDifficulty', label: 'Cleanup difficulty', type: 'select', options: ['Easy', 'Moderate', 'Difficult', 'Very Difficult'] }
    ],
    land_reclamation: [
      { key: 'areaReclaimed', label: 'Area reclaimed', type: 'number', unit: 'hectares' },
      { key: 'mangroveAreaLost', label: 'Mangrove area lost', type: 'number', unit: 'hectares' },
      { key: 'sedimentVolume', label: 'Volume of sediment used', type: 'number', unit: 'cubic meters' },
      { key: 'ecosystemDisruption', label: 'Ecosystem disruption level', type: 'select', options: ['Low', 'Medium', 'High', 'Complete'] }
    ],
    wildlife_disturbance: [
      { key: 'speciesAffected', label: 'Number of species affected', type: 'number', unit: 'species' },
      { key: 'animalCount', label: 'Estimated number of animals affected', type: 'number', unit: 'animals' },
      { key: 'habitatArea', label: 'Habitat area disturbed', type: 'number', unit: 'hectares' },
      { key: 'disturbanceType', label: 'Type of disturbance', type: 'select', options: ['Noise', 'Physical', 'Chemical', 'Light', 'Multiple'] }
    ]
  };

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/admin/reports/evaluation', {
        params: { status: 'verified,resolved' }
      });
      setReports(response.data.reports || []);
    } catch (error) {
      console.error('Error loading reports:', error);
      toast.error('Failed to load reports for evaluation');
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluateReport = (report) => {
    setSelectedReport(report);
    setMetadata({});
    setEstimationResult(null);
    setShowMetadataModal(true);
  };

  const handleMetadataChange = (key, value) => {
    setMetadata(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const generateEstimation = async () => {
    if (!selectedReport || Object.keys(metadata).length === 0) {
      toast.error('Please fill in the metadata before generating estimation');
      return;
    }

    setEstimationLoading(true);
    try {
      const response = await axios.post('/admin/reports/estimate-loss', {
        reportId: selectedReport._id,
        incidentType: selectedReport.incidentType,
        metadata: metadata
      });
      
      setEstimationResult(response.data.estimation);
      toast.success('Loss estimation generated successfully');
    } catch (error) {
      console.error('Error generating estimation:', error);
      toast.error('Failed to generate loss estimation');
    } finally {
      setEstimationLoading(false);
    }
  };

  const saveEvaluation = async () => {
    if (!selectedReport || !estimationResult) {
      toast.error('Please generate estimation before saving');
      return;
    }

    try {
      await axios.post('/admin/reports/save-evaluation', {
        reportId: selectedReport._id,
        metadata: metadata,
        estimation: estimationResult
      });
      
      toast.success('Evaluation saved successfully');
      setShowMetadataModal(false);
      loadReports(); // Refresh the list
    } catch (error) {
      console.error('Error saving evaluation:', error);
      toast.error('Failed to save evaluation');
    }
  };

  const renderMetadataField = (field) => {
    const value = metadata[field.key] || '';

    switch (field.type) {
      case 'number':
        return (
          <div key={field.key} className="metadata-field">
            <label className="field-label">{field.label}</label>
            <div className="input-with-unit">
              <input
                type="number"
                value={value}
                onChange={(e) => handleMetadataChange(field.key, parseFloat(e.target.value) || 0)}
                className="form-input"
                min="0"
                step="0.01"
              />
              <span className="unit-label">{field.unit}</span>
            </div>
          </div>
        );
      
      case 'select':
        return (
          <div key={field.key} className="metadata-field">
            <label className="field-label">{field.label}</label>
            <select
              value={value}
              onChange={(e) => handleMetadataChange(field.key, e.target.value)}
              className="form-select"
            >
              <option value="">Select {field.label.toLowerCase()}</option>
              {field.options.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        );
      
      case 'boolean':
        return (
          <div key={field.key} className="metadata-field">
            <label className="field-label checkbox-label">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => handleMetadataChange(field.key, e.target.checked)}
                className="form-checkbox"
              />
              {field.label}
            </label>
          </div>
        );
      
      default:
        return (
          <div key={field.key} className="metadata-field">
            <label className="field-label">{field.label}</label>
            <input
              type="text"
              value={value}
              onChange={(e) => handleMetadataChange(field.key, e.target.value)}
              className="form-input"
            />
          </div>
        );
    }
  };

  const renderEstimationGrid = (estimationText) => {
    const lines = estimationText.split('\n').filter(line => line.trim());
    
    // Extract first 2-3 lines as summary (non-numeric lines)
    const summaryLines = lines.slice(0, 3).filter(line => 
      !(/\d/.test(line) && (line.includes('$') || line.includes('tons') || line.includes('hectares') || line.includes('CO2')))
    ).slice(0, 2);
    
    // Extract simple metrics in format "Label: Value"
    const metrics = [];
    lines.forEach(line => {
      const cleanLine = line.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').trim();
      if (cleanLine.includes(':') && (/\d/.test(cleanLine))) {
        const [label, value] = cleanLine.split(':').map(s => s.trim());
        if (label && value) {
          metrics.push(`${label}: ${value}`);
        }
      }
    });

    return (
      <div className="estimation-display">
        {/* Summary */}
        <div className="summary-text">
          {summaryLines.map((line, index) => (
            <p key={index}>{line}</p>
          ))}
        </div>

        {/* Simple Grid */}
        <div className="metrics-grid">
          {metrics.map((metric, index) => (
            <div key={index} className="metric-item">
              {metric}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="post-evaluation-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading reports for evaluation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="post-evaluation-page">
      <div className="page-header">
        <h1>Post Data Evaluation</h1>
        <p>Evaluate verified and resolved reports to estimate environmental losses</p>
      </div>

      <div className="reports-grid">
        {reports.length === 0 ? (
          <div className="empty-state">
            <p>No verified or resolved reports available for evaluation</p>
          </div>
        ) : (
          reports.map(report => (
            <div key={report._id} className="report-card">
              <div className="report-header">
                <h3>{report.title}</h3>
                <span className={`status-badge ${report.status}`}>
                  {report.status.toUpperCase()}
                </span>
              </div>
              
              <div className="report-details">
                <p><strong>Type:</strong> {report.incidentType.replace('_', ' ').toUpperCase()}</p>
                <p><strong>Severity:</strong> {report.severity}</p>
                <p><strong>Date:</strong> {new Date(report.createdAt).toLocaleDateString()}</p>
                <p><strong>Reporter:</strong> {report.reporter?.name || 'Anonymous'}</p>
              </div>

              <div className="report-actions">
                {report.evaluationCompleted ? (
                  <span className="evaluation-completed">✅ Evaluation Completed</span>
                ) : (
                  <button
                    className="btn btn-primary"
                    onClick={() => handleEvaluateReport(report)}
                  >
                    Evaluate Loss
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Metadata Modal */}
      {showMetadataModal && selectedReport && (
        <div className="modal-overlay">
          <div className="modal-content large-modal">
            <div className="modal-header">
              <h2>Evaluate: {selectedReport.title}</h2>
              <button
                className="modal-close"
                onClick={() => setShowMetadataModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="evaluation-sections">
                <div className="metadata-section">
                  <h3>Environmental Impact Data</h3>
                  <p>Please provide specific data about the {selectedReport.incidentType.replace('_', ' ')} incident:</p>
                  
                  <div className="metadata-form">
                    {metadataFields[selectedReport.incidentType]?.map(field => 
                      renderMetadataField(field)
                    )}
                  </div>

                  <div className="section-actions">
                    <button
                      className="btn btn-secondary"
                      onClick={generateEstimation}
                      disabled={estimationLoading}
                    >
                      {estimationLoading ? 'Generating...' : 'Generate Loss Estimation'}
                    </button>
                  </div>
                </div>

                {estimationResult && (
                  <div className="estimation-section">
                    <h3>Environmental Loss Assessment</h3>
                    {renderEstimationGrid(estimationResult)}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowMetadataModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={saveEvaluation}
                disabled={!estimationResult}
              >
                Save Evaluation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostDataEvaluation;

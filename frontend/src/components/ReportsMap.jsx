import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for different incident types
const createCustomIcon = (color = '#4caf50') => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `<div style="
      background-color: ${color};
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

// Get marker color based on severity
const getMarkerColor = (severity) => {
  const colors = {
    low: '#28a745',
    medium: '#ffc107',
    high: '#fd7e14',
    critical: '#dc3545'
  };
  return colors[severity] || '#4caf50';
};

// Component to handle map bounds
const MapBounds = ({ reports }) => {
  const map = useMap();

  useEffect(() => {
    if (reports && reports.length > 0) {
      const bounds = L.latLngBounds(
        reports.map(report => {
          // Handle both GeoJSON and direct lat/lng formats
          const lat = report.location.coordinates ? report.location.coordinates[1] : report.location.latitude;
          const lng = report.location.coordinates ? report.location.coordinates[0] : report.location.longitude;
          return [lat, lng];
        }).filter(coord => coord[0] && coord[1]) // Filter out invalid coordinates
      );
      
      // Only fit bounds if we have multiple points
      if (reports.length > 1) {
        map.fitBounds(bounds, { padding: [20, 20] });
      } else {
        // Center on single point
        const lat = reports[0].location.coordinates ? reports[0].location.coordinates[1] : reports[0].location.latitude;
        const lng = reports[0].location.coordinates ? reports[0].location.coordinates[0] : reports[0].location.longitude;
        if (lat && lng) {
          map.setView([lat, lng], 13);
        }
      }
    }
  }, [reports, map]);

  return null;
};

const ReportsMap = ({ reports = [], onMarkerClick, height = '400px' }) => {
  const [userLocation, setUserLocation] = useState(null);

  // Default center (can be changed based on your region)
  const defaultCenter = [1.3521, 103.8198]; // Singapore coordinates
  const defaultZoom = 10;

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([
            position.coords.latitude,
            position.coords.longitude
          ]);
        },
        (error) => {
          console.log('Could not get user location:', error);
        }
      );
    }
  }, []);

  // Format date for popup
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="reports-map" style={{ height, width: '100%' }}>
      <MapContainer
        center={userLocation || defaultCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* User location marker */}
        {userLocation && (
          <Marker 
            position={userLocation}
            icon={createCustomIcon('#007bff')}
          >
            <Popup>
              <div>
                <strong>Your Location</strong>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Report markers */}
        {reports.map(report => {
          // Handle both GeoJSON and direct lat/lng formats
          const lat = report.location.coordinates ? report.location.coordinates[1] : report.location.latitude;
          const lng = report.location.coordinates ? report.location.coordinates[0] : report.location.longitude;
          
          if (!lat || !lng) return null;
          
          return (
            <Marker
              key={report._id}
              position={[lat, lng]}
              icon={createCustomIcon(getMarkerColor(report.severity))}
              eventHandlers={{
                click: () => onMarkerClick && onMarkerClick(report)
              }}
            >
              <Popup>
                <div className="map-popup">
                  <h4>{report.title}</h4>
                  <p><strong>Type:</strong> {report.incidentType.replace('_', ' ')}</p>
                  <p><strong>Severity:</strong> {report.severity}</p>
                  <p><strong>Status:</strong> {report.status}</p>
                  <p><strong>Date:</strong> {formatDate(report.createdAt)}</p>
                  {report.reporter && (
                    <p><strong>Reporter:</strong> {report.reporter.name}</p>
                  )}
                  <div className="popup-actions">
                    <button 
                      className="btn secondary"
                      onClick={() => onMarkerClick && onMarkerClick(report)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Auto-fit bounds based on reports */}
        <MapBounds reports={reports} />
      </MapContainer>
    </div>
  );
};

export default ReportsMap;
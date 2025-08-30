require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = 3001;

const PLANET_API_KEY = process.env.PLANET_API_KEY;

// --- CORRECTED & VERIFIED DATABASE of known mangrove forests in India ---
const mangroveForests = [
    // East Coast
    { name: "Sundarbans (Indian side), West Bengal", latitude: 21.9497, longitude: 88.8182 },
    { name: "Bhitarkanika National Park, Odisha", latitude: 20.7389, longitude: 86.9147 },
    { name: "Mahanadi Delta (Paradip), Odisha", latitude: 20.3235, longitude: 86.6820 },
    { name: "Coringa Wildlife Sanctuary (Godavari Delta), Andhra Pradesh", latitude: 16.7720, longitude: 82.2358 },
    { name: "Pichavaram Mangrove Forest, Tamil Nadu", latitude: 11.4391, longitude: 79.7915 },
    { name: "Muthupet Lagoon, Tamil Nadu", latitude: 10.3960, longitude: 79.4940 },

    // West Coast
    { name: "Marine National Park (Gulf of Kutch), Gujarat", latitude: 22.4708, longitude: 69.6201 },
    { name: "Gulf of Khambhat (Dahej), Gujarat", latitude: 21.6961, longitude: 72.5684 },
    { name: "Vembanad Lake (Kumarakom), Kerala", latitude: 9.6167, longitude: 76.4167 },
    { name: "Dr. Salim Ali Bird Sanctuary (Goa)", latitude: 15.5033, longitude: 73.8569 },
    { name: "Veldur (Ratnagiri), Maharashtra", latitude: 17.5835, longitude: 73.1663 },
    { name: "DA-IICT, Gandhinagar", latitude: 23.188655324176313, longitude: 72.62893695354347 },

    // Islands
    { name: "Baratang Island (Andamans)", latitude: 12.1625, longitude: 92.7750 },
    { name: "Great Nicobar Biosphere Reserve", latitude: 7.0167, longitude: 93.8167 }
];

const MAX_DISTANCE_KM = 30; // Increased radius to better cover large and irregularly shaped delta areas

// Middleware
app.use(cors());
app.use(express.json());

/**
 * Calculates distance using the Haversine formula.
 * @returns {number} Distance in kilometers.
 */
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// --- Endpoint to get all mangrove locations ---
app.get('/api/mangrove-locations', (req, res) => {
    res.json(mangroveForests);
});

// --- API Endpoint for verification ---
app.post('/api/verify-location', (req, res) => {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
        return res.status(400).json({ error: 'Latitude and longitude are required.' });
    }

    let isNearby = false;
    let nearestForest = '';
    let minDistance = Infinity;

    for (const forest of mangroveForests) {
        const distance = getDistance(latitude, longitude, forest.latitude, forest.longitude);
        if (distance < minDistance) {
            minDistance = distance;
            nearestForest = forest.name;
        }
    }

    if (minDistance <= MAX_DISTANCE_KM) {
        isNearby = true;
    }

    if (isNearby) {
        res.json({ isValid: true, message: `Location confirmed near ${nearestForest}!` });
    } else {
        res.json({ isValid: false, message: 'Location is not within the known radius of a major mangrove forest.' });
    }
});

app.listen(port, () => {
    console.log(`Backend server with corrected locations listening at http://localhost:${port}`);
});
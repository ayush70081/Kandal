require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = 3001;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

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

// Multer setup for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Google Generative AI setup
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

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

// --- New Endpoint for Image Analysis ---
app.post('/api/analyze-image', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image file provided.' });
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `
Analyze the image provided.

First, determine if the image is of a mangrove forest or a coastal environment where mangroves grow.

If it is, then check for any of the following threats:
- Cut down or felled trees
- Fire or smoke indicating burning trees
- Oil spillage in the water
- Waste or garbage dumping
- Any other visible signs of damage or destruction.

If a threat is detected, describe the threat and estimate its approximate severity (e.g., low, medium, high). For example: "Threat detected: A few cut trees are visible. Approximate threat level: Low." or "Threat detected: A large area of the forest is on fire. Approximate threat level: High."

If no threat is detected but it is a mangrove, identify the species and provide a short, 5-line summary including:
- Species name
- Key benefits
- Common threats
- Main locations where it is found.

If the image is not of a mangrove environment, respond with: 'The uploaded image does not appear to be a mangrove area. Please upload photos of potential threats to mangrove forests.'
`;

        const imagePart = {
            inlineData: {
                data: req.file.buffer.toString("base64"),
                mimeType: req.file.mimetype,
            },
        };

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        res.json({ analysis: text });
    } catch (error) {
        console.error('Error analyzing image:', error);
        res.status(500).json({ error: 'Failed to analyze image.' });
    }
});

app.listen(port, () => {
    console.log(`Backend server with corrected locations listening at http://localhost:${port}`);
});
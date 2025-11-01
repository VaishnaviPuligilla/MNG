const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
app.use(cors({
  origin: "*",
}));
app.use(express.json());

// MongoDB Atlas connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Vaishnavi:MGN6@cluster0.frznndh.mongodb.net/MGN?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas successfully!'))
  .catch(err => console.error('❌ MongoDB Atlas connection error:', err));

// District Schema
const districtSchema = new mongoose.Schema({
  district_name: { type: String, required: true },
  state_name: { type: String, required: true },
  financial_year: String,
  month: String,
  total_households_worked: Number,
  total_persons_worked: Number,
  total_person_days: Number,
  women_participation_percent: Number,
  sc_participation_percent: Number,
  st_participation_percent: Number,
  last_updated: { type: Date, default: Date.now }
});

const District = mongoose.model('District', districtSchema);

// API configuration
const DATA_GOV_API_KEY = process.env.DATA_GOV_API_KEY || '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b';
const MGNREGA_URL = 'https://api.data.gov.in/resource/56f16dc5-7d1f-4c39-8fe8-ca0d010f46a2';

// Sample data for fallback
function getSampleData() {
  return [
    {
      district_name: "Jaipur",
      state_name: "Rajasthan",
      financial_year: "2023-2024",
      month: "January",
      total_households_worked: 12500,
      total_persons_worked: 37500,
      total_person_days: 1125000,
      women_participation_percent: 42,
      sc_participation_percent: 22,
      st_participation_percent: 15,
      last_updated: new Date()
    },
    {
      district_name: "Udaipur",
      state_name: "Rajasthan", 
      financial_year: "2023-2024",
      month: "January",
      total_households_worked: 8900,
      total_persons_worked: 26700,
      total_person_days: 801000,
      women_participation_percent: 45,
      sc_participation_percent: 18,
      st_participation_percent: 25,
      last_updated: new Date()
    },
    {
      district_name: "Bhopal",
      state_name: "Madhya Pradesh",
      financial_year: "2023-2024",
      month: "January",
      total_households_worked: 11000,
      total_persons_worked: 33000,
      total_person_days: 990000,
      women_participation_percent: 38,
      sc_participation_percent: 20,
      st_participation_percent: 12,
      last_updated: new Date()
    },
    {
      district_name: "Lucknow",
      state_name: "Uttar Pradesh",
      financial_year: "2023-2024",
      month: "January",
      total_households_worked: 15000,
      total_persons_worked: 45000,
      total_person_days: 1350000,
      women_participation_percent: 35,
      sc_participation_percent: 25,
      st_participation_percent: 8,
      last_updated: new Date()
    }
  ];
}

// Initialize database with sample data
async function initializeData() {
  try {
    const count = await District.countDocuments();
    if (count === 0) {
      console.log("🔄 Loading sample data...");
      await District.insertMany(getSampleData());
      console.log("✅ Sample data loaded successfully!");
    } else {
      console.log(`✅ Database already has ${count} records`);
    }
  } catch (error) {
    console.error("❌ Error initializing data:", error);
  }
}

// API Routes

// Root route
app.get("/", (req, res) => {
  res.json({ 
    message: "✅ MGNREGA Backend Running Successfully!",
    endpoints: {
      states: "/api/states",
      districts: "/api/state/:stateName/districts", 
      districtData: "/api/district/:stateName/:districtName",
      health: "/api/health",
      location: "/api/location"
    }
  });
});

// Get all states
app.get('/api/states', async (req, res) => {
  try {
    const states = await District.distinct("state_name");
    console.log('📊 States found:', states);
    res.json(states);
  } catch (error) {
    console.error('❌ Error fetching states:', error);
    res.json(["Rajasthan", "Madhya Pradesh", "Uttar Pradesh"]);
  }
});

// Get districts by state - FIXED ROUTE
app.get('/api/state/:stateName/districts', async (req, res) => {
  try {
    const stateName = req.params.stateName;
    console.log('🔍 Fetching districts for state:', stateName);
    
    const districts = await District.distinct("district_name", {
      state_name: stateName
    });
    
    console.log('📊 Districts found:', districts);
    res.json(districts);
  } catch (error) {
    console.error('❌ Error fetching districts:', error);
    
    // Fallback sample districts
    const sampleDistricts = {
      "Rajasthan": ["Jaipur", "Udaipur", "Jodhpur", "Bikaner"],
      "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior"],
      "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi"]
    };
    
    res.json(sampleDistricts[req.params.stateName] || []);
  }
});

// Get district data - CORRECTED ROUTE with both state and district
app.get('/api/district/:stateName/:districtName', async (req, res) => {
  try {
    const { stateName, districtName } = req.params;
    console.log('🔍 Fetching data for:', stateName, '-', districtName);
    
    const data = await District.find({ 
      state_name: stateName,
      district_name: districtName 
    }).sort({ last_updated: -1 });
    
    console.log('📊 Data found:', data.length, 'records');
    res.json(data);
  } catch (error) {
    console.error('❌ Error fetching district data:', error);
    res.status(500).json({ error: 'Failed to fetch district data' });
  }
});

// Mock location detection
app.get('/api/location', async (req, res) => {
  try {
    // Mock location - in real app, use IP geolocation
    const mockLocation = {
      state: "Rajasthan",
      district: "Jaipur",
      latitude: 26.9124,
      longitude: 75.7873
    };
    
    console.log('📍 Mock location detected:', mockLocation);
    res.json(mockLocation);
  } catch (error) {
    console.error('❌ Location detection error:', error);
    res.status(500).json({ error: 'Location detection failed' });
  }
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const count = await District.countDocuments();
    res.json({
      status: "OK",
      records: count,
      timestamp: new Date(),
      database: "Connected",
      message: "MGNREGA API Server is running smoothly"
    });
  } catch (error) {
    res.status(500).json({
      status: "Error",
      error: error.message
    });
  }
});

// Start server
initializeData().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  });
}).catch(error => {
  console.error('❌ Failed to start server:', error);
});

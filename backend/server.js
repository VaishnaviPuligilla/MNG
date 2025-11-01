const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5000"],
  credentials: true
}));
app.use(express.json());

// MongoDB Connection - UPDATED WITH ATLAS
const MONGODB_URI = 'mongodb+srv://Vaishnavi:MGN6@cluster0.frznndh.mongodb.net/MGN?retryWrites=true&w=majority&appName=Cluster0';

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

// CORRECT MGNREGA API Endpoint
const DATA_GOV_API_KEY = process.env.DATA_GOV_API_KEY || '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b';
const CORRECT_MGNREGA_URL = 'https://api.data.gov.in/resource/56f16dc5-7d1f-4c39-8fe8-ca0d010f46a2';

async function fetchDataFromGovAPI() {
  try {
    console.log('📡 Fetching data from CORRECT MGNREGA API...');
    
    const response = await axios.get(CORRECT_MGNREGA_URL, {
      params: {
        'api-key': DATA_GOV_API_KEY,
        'format': 'json',
        'limit': 1000,
        'filters[state_name]': 'Rajasthan' // Start with one state
      },
      timeout: 30000
    });

    if (response.data && response.data.records) {
      console.log(`📊 Received ${response.data.records.length} records from API`);
      
      // DEBUG: Check the first record structure
      if (response.data.records.length > 0) {
        console.log('🔍 FIRST RECORD:', response.data.records[0]);
      }
      
      return response.data.records;
    } else {
      console.log('❌ No data received from API');
      return [];
    }
  } catch (error) {
    console.error('❌ Error fetching from MGNREGA API:', error.message);
    
    // Fallback to comprehensive sample data
    console.log('🔄 Using comprehensive fallback sample data...');
    return getComprehensiveSampleData();
  }
}

function getComprehensiveSampleData() {
  return [
    // Rajasthan - Multiple months for trend data
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
      st_participation_percent: 15
    },
    {
      district_name: "Jaipur",
      state_name: "Rajasthan", 
      financial_year: "2023-2024",
      month: "February",
      total_households_worked: 13200,
      total_persons_worked: 39600,
      total_person_days: 1188000,
      women_participation_percent: 43,
      sc_participation_percent: 23,
      st_participation_percent: 16
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
      sc_participation_percent: 20,
      st_participation_percent: 25
    },
    {
      district_name: "Jodhpur",
      state_name: "Rajasthan", 
      financial_year: "2023-2024",
      month: "January",
      total_households_worked: 7800,
      total_persons_worked: 23400,
      total_person_days: 702000,
      women_participation_percent: 41,
      sc_participation_percent: 19,
      st_participation_percent: 28
    },
    
    // Uttar Pradesh
    {
      district_name: "Lucknow",
      state_name: "Uttar Pradesh", 
      financial_year: "2023-2024",
      month: "January",
      total_households_worked: 18500,
      total_persons_worked: 55500,
      total_person_days: 1665000,
      women_participation_percent: 35,
      sc_participation_percent: 25,
      st_participation_percent: 12
    },
    {
      district_name: "Kanpur",
      state_name: "Uttar Pradesh",
      financial_year: "2023-2024", 
      month: "January",
      total_households_worked: 14200,
      total_persons_worked: 42600,
      total_person_days: 1278000,
      women_participation_percent: 38,
      sc_participation_percent: 22,
      st_participation_percent: 10
    },
    
    // Madhya Pradesh
    {
      district_name: "Bhopal",
      state_name: "Madhya Pradesh",
      financial_year: "2023-2024", 
      month: "January",
      total_households_worked: 11500,
      total_persons_worked: 34500,
      total_person_days: 1035000,
      women_participation_percent: 38,
      sc_participation_percent: 18,
      st_participation_percent: 22
    },
    {
      district_name: "Indore",
      state_name: "Madhya Pradesh",
      financial_year: "2023-2024", 
      month: "January",
      total_households_worked: 9800,
      total_persons_worked: 29400,
      total_person_days: 882000,
      women_participation_percent: 40,
      sc_participation_percent: 16,
      st_participation_percent: 20
    }
  ];
}

async function updateDatabaseWithFreshData() {
  try {
    const freshData = await fetchDataFromGovAPI();
    let updatedCount = 0;

    console.log('🔄 Processing MGNREGA data...');
    
    for (const record of freshData) {
      // Map API fields to our schema
      const districtName = record.district_name || 'Unknown';
      const stateName = record.state_name || 'Unknown';
      
      // Skip records with missing essential data
      if (districtName === 'Unknown' || stateName === 'Unknown') {
        continue;
      }

      // Map the API data fields (adjust based on actual API response)
      const result = await District.findOneAndUpdate(
        {
          district_name: districtName,
          state_name: stateName,
          financial_year: record.financial_year || "2023-2024",
          month: record.month || "January"
        },
        {
          $set: {
            total_households_worked: parseInt(record.households_worked) || parseInt(record.total_households_worked) || 1000,
            total_persons_worked: parseInt(record.persons_worked) || parseInt(record.total_persons_worked) || 3000,
            total_person_days: parseInt(record.persondays_generated) || parseInt(record.total_person_days) || 90000,
            women_participation_percent: parseFloat(record.women_participation_percent) || 35,
            sc_participation_percent: parseFloat(record.sc_participation_percent) || 20,
            st_participation_percent: parseFloat(record.st_participation_percent) || 15,
            last_updated: new Date()
          }
        },
        { 
          upsert: true, 
          new: true,
          setDefaultsOnInsert: true 
        }
      );
      
      if (result) updatedCount++;
    }

    console.log(`✅ Database updated successfully! ${updatedCount} records processed`);
    
    // Log what's actually in the database
    const states = await District.distinct('state_name');
    const districts = await District.distinct('district_name');
    console.log('🏛️ Available states in DB:', states);
    console.log('📍 Available districts in DB:', districts);
    
    return updatedCount;
  } catch (error) {
    console.error('❌ Error updating database:', error);
    return 0;
  }
}

// Initialize with guaranteed sample data
async function initializeData() {
  try {
    const count = await District.countDocuments();
    
    if (count === 0) {
      console.log('🔄 No data found. Loading sample data...');
      const sampleData = getComprehensiveSampleData();
      await District.insertMany(sampleData);
      console.log('✅ Sample data loaded successfully!');
    }
    
    // Always log what we have
    const finalCount = await District.countDocuments();
    const states = await District.distinct('state_name');
    const districts = await District.distinct('district_name');
    
    console.log(`📁 Total records in database: ${finalCount}`);
    console.log('🏛️ Available states:', states);
    console.log('📍 Available districts:', districts);
    
  } catch (error) {
    console.error('❌ Error initializing data:', error);
  }
}

// API Routes

// Get all states
app.get('/api/states', async (req, res) => {
  try {
    const states = await District.distinct('state_name');
    console.log('📋 Sending states to frontend:', states);
    res.json(states);
  } catch (error) {
    console.error('Error fetching states:', error);
    res.status(500).json({ error: 'Failed to fetch states' });
  }
});

// Get districts by state
app.get('/api/state/:stateName/districts', async (req, res) => {
  try {
    const stateName = req.params.stateName;
    console.log('📍 Fetching districts for state:', stateName);
    
    const districts = await District.distinct('district_name', { 
      state_name: stateName 
    });
    
    console.log(`📋 Found ${districts.length} districts for ${stateName}:`, districts);
    res.json(districts);
  } catch (error) {
    console.error('Error fetching districts:', error);
    res.status(500).json({ error: 'Failed to fetch districts' });
  }
});

// Get all data for a district
app.get('/api/district/:districtName', async (req, res) => {
  try {
    const districtName = req.params.districtName;
    console.log('📊 Fetching data for district:', districtName);
    
    const districtData = await District.find({ 
      district_name: districtName 
    }).sort({ financial_year: 1, month: 1 });
    
    console.log(`📈 Found ${districtData.length} records for ${districtName}`);
    res.json(districtData);
  } catch (error) {
    console.error('Error fetching district data:', error);
    res.status(500).json({ error: 'Failed to fetch district data' });
  }
});

// Mock location detection
app.get('/api/location', async (req, res) => {
  try {
    const availableDistricts = await District.distinct('district_name');
    const randomDistrict = availableDistricts[Math.floor(Math.random() * availableDistricts.length)];
    const districtState = await District.findOne({ district_name: randomDistrict }).select('state_name');
    
    res.json({
      district: randomDistrict,
      state: districtState?.state_name || "Rajasthan",
      detected: true,
      method: "random_selection"
    });
  } catch (error) {
    console.error('Location detection error:', error);
    res.json({
      district: "Jaipur",
      state: "Rajasthan", 
      detected: false,
      method: "fallback"
    });
  }
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const recordCount = await District.countDocuments();
    const states = await District.distinct('state_name');
    const districts = await District.distinct('district_name');
    
    res.json({ 
      status: 'OK', 
      database: dbStatus,
      records: recordCount,
      states_count: states.length,
      districts_count: districts.length,
      states: states,
      districts: districts,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      error: error.message 
    });
  }
});

// Force load sample data (GET endpoint for easy browser access)
app.get('/api/use-sample-data', async (req, res) => {
  try {
    await District.deleteMany({});
    const sampleData = getComprehensiveSampleData();
    await District.insertMany(sampleData);
    
    const newCount = await District.countDocuments();
    const states = await District.distinct('state_name');
    const districts = await District.distinct('district_name');
    
    res.json({ 
      success: true, 
      message: 'Sample data loaded successfully!',
      records: newCount,
      states: states,
      districts: districts
    });
  } catch (error) {
    console.error('Error loading sample data:', error);
    res.status(500).json({ error: 'Failed to load sample data' });
  }
});

// Initialize data and start server
initializeData().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 MGNREGA Production Backend - MongoDB Atlas`);
    console.log(`📍 Health: http://localhost:${PORT}/api/health`);
    console.log(`🔄 Load Sample Data: http://localhost:${PORT}/api/use-sample-data`);
    console.log(`🌍 Frontend: http://localhost:3000`);
  });
});
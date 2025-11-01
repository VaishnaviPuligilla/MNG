const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ CORS FIX (works for Render + Netlify/Vercel + Localhost)
app.use(cors({
  origin: "*",
}));
app.use(express.json());

// ✅ MongoDB Atlas
const MONGODB_URI = process.env.MONGODB_URI ||
  'mongodb+srv://Vaishnavi:MGN6@cluster0.frznndh.mongodb.net/MGN?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas successfully!'))
  .catch(err => console.error('❌ MongoDB Atlas connection error:', err));

// ✅ District Schema
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

// ✅ Correct MGNREGA API
const DATA_GOV_API_KEY = process.env.DATA_GOV_API_KEY ||
  '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b';

const CORRECT_MGNREGA_URL = 'https://api.data.gov.in/resource/56f16dc5-7d1f-4c39-8fe8-ca0d010f46a2';

// ✅ API fetch function
async function fetchDataFromGovAPI() {
  try {
    console.log('📡 Fetching data from CORRECT MGNREGA API...');

    const response = await axios.get(CORRECT_MGNREGA_URL, {
      params: {
        'api-key': DATA_GOV_API_KEY,
        'format': 'json',
        'limit': 1000
      },
      timeout: 30000
    });

    if (response.data && response.data.records) {
      console.log(`📊 Received ${response.data.records.length} records`);
      return response.data.records;
    } else {
      return [];
    }
  } catch (error) {
    console.error('❌ Error fetching MGNREGA API:', error.message);
    return getSampleData();
  }
}

// ✅ Sample fallback data
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
      st_participation_percent: 15
    }
  ];
}

// ✅ Update DB with fresh API data
async function updateDatabase() {
  try {
    const freshData = await fetchDataFromGovAPI();
    let updatedCount = 0;

    for (const record of freshData) {
      const result = await District.findOneAndUpdate(
        {
          district_name: record.district_name,
          state_name: record.state_name,
          financial_year: record.financial_year || "2023-2024",
          month: record.month || "January"
        },
        {
          $set: {
            total_households_worked: parseInt(record.households_worked) || 1000,
            total_persons_worked: parseInt(record.persons_worked) || 3000,
            total_person_days: parseInt(record.persondays_generated) || 90000,
            women_participation_percent: 40,
            sc_participation_percent: 20,
            st_participation_percent: 15,
            last_updated: new Date()
          }
        },
        { upsert: true }
      );

      if (result) updatedCount++;
    }

    console.log(`✅ Updated ${updatedCount} database records`);
  } catch (error) {
    console.error("❌ Database update error:", error);
  }
}

// ✅ Initialize DB with fallback data
async function initializeData() {
  const count = await District.countDocuments();
  if (count === 0) {
    console.log("🔄 Loading fallback sample data...");
    await District.insertMany(getSampleData());
  }
}

// ✅ ROUTES

// ✅ Root test route (fixes "Cannot GET /")
app.get("/", (req, res) => {
  res.send("✅ MGNREGA Backend Running Successfully!");
});

// ✅ Get all states
app.get('/api/states', async (req, res) => {
  const states = await District.distinct("state_name");
  res.json(states);
});

// ✅ Get districts by state
app.get('/api/state/:stateName/districts', async (req, res) => {
  const districts = await District.distinct("district_name", {
    state_name: req.params.stateName
  });
  res.json(districts);
});

// ✅ Get district details
app.get('/api/district/:districtName', async (req, res) => {
  const data = await District.find({ district_name: req.params.districtName });
  res.json(data);
});

// ✅ Health check
app.get('/api/health', async (req, res) => {
  const count = await District.countDocuments();
  res.json({
    status: "OK",
    records: count,
    timestamp: new Date()
  });
});

// ✅ Start server
initializeData().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});

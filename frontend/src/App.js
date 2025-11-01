import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const App = () => {
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [districtData, setDistrictData] = useState([]);
  const [currentData, setCurrentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [error, setError] = useState('');
  const [language, setLanguage] = useState('english');

  // ✅ PRODUCTION URL - Update this to your Render backend
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://mng-backend-zedt.onrender.com';

  // Translations
  const translations = {
    english: {
      title: "Our Voice, Our Rights",
      subtitle: "MGNREGA District Performance Tracker",
      selectState: "Select Your State",
      selectDistrict: "Select Your District", 
      useLocation: "📍 Use My Location",
      loading: "Loading data...",
      households: "Households Worked",
      persons: "Persons Worked", 
      days: "Person Days",
      women: "Women Participation",
      sc: "SC Participation",
      st: "ST Participation",
      performance: "Performance -",
      trend: "Performance Trend",
      noData: "No data available for",
      footer: "Empowering citizens with transparent MGNREGA performance data",
      compare: "Compare with another district",
      currentMonth: "Current Month",
      lastUpdated: "Last updated"
    },
    hindi: {
      title: "हमारी आवाज, हमारे अधिकार",
      subtitle: "मनरेगा जिला प्रदर्शन ट्रैकर",
      selectState: "अपना राज्य चुनें",
      selectDistrict: "अपना जिला चुनें",
      useLocation: "📍 मेरा स्थान इस्तेमाल करें", 
      loading: "डेटा लोड हो रहा है...",
      households: "काम करने वाले परिवार",
      persons: "काम करने वाले व्यक्ति",
      days: "व्यक्ति दिवस",
      women: "महिला भागीदारी",
      sc: "अनुसूचित जाति भागीदारी", 
      st: "अनुसूचित जनजाति भागीदारी",
      performance: "प्रदर्शन -",
      trend: "प्रदर्शन रुझान",
      noData: "के लिए कोई डेटा उपलब्ध नहीं",
      footer: "पारदर्शी मनरेगा प्रदर्शन डेटा के साथ नागरिकों को सशक्त बनाना",
      compare: "दूसरे जिले से तुलना करें",
      currentMonth: "चालू महीना",
      lastUpdated: "अंतिम अपडेट"
    }
  };

  const t = translations[language];

  useEffect(() => {
    console.log('App started - API URL:', API_BASE_URL);
    fetchStates();
    detectUserLocation();
  }, []);

  const detectUserLocation = async () => {
    try {
      console.log('Detecting user location...');
      const response = await axios.get(`${API_BASE_URL}/api/location`);
      console.log('Location detected:', response.data);
      setUserLocation(response.data);
    } catch (error) {
      console.log('Location detection failed:', error);
      setError('Location detection failed');
    }
  };

  const fetchStates = async () => {
    try {
      console.log('Fetching states from:', `${API_BASE_URL}/api/states`);
      setError('');
      const response = await axios.get(`${API_BASE_URL}/api/states`);
      console.log('States received:', response.data);
      setStates(response.data);
    } catch (error) {
      console.error('Error fetching states:', error);
      setError('Failed to load states. Please check if backend is running.');
      // Fallback states
      setStates(["Rajasthan", "Madhya Pradesh", "Uttar Pradesh"]);
    }
  };

  const fetchDistricts = async (state) => {
    try {
      console.log('Fetching districts for state:', state);
      setError('');
      const response = await axios.get(`${API_BASE_URL}/api/state/${encodeURIComponent(state)}/districts`);
      console.log('Districts received:', response.data);
      setDistricts(response.data);
    } catch (error) {
      console.error('Error fetching districts:', error);
      setError('Failed to load districts.');
      // Fallback districts
      const sampleDistricts = {
        "Rajasthan": ["Jaipur", "Udaipur", "Jodhpur", "Bikaner"],
        "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior"],
        "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi"]
      };
      setDistricts(sampleDistricts[state] || []);
    }
  };

  const fetchDistrictData = async (district) => {
    setLoading(true);
    try {
      console.log('Fetching district data for:', district, 'in state:', selectedState);
      setError('');
      
      // CORRECTED API CALL with both state and district
      const response = await axios.get(
        `${API_BASE_URL}/api/district/${encodeURIComponent(selectedState)}/${encodeURIComponent(district)}`
      );
      
      console.log('District data received:', response.data);
      
      if (response.data && response.data.length > 0) {
        setCurrentData(response.data[0]);
        setDistrictData(response.data);
      } else {
        setCurrentData(null);
        setDistrictData([]);
        setError(`${t.noData} ${district}`);
      }
    } catch (error) {
      console.error('Error fetching district data:', error);
      setError('Failed to load district data. Please try another district.');
      setCurrentData(null);
      setDistrictData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStateChange = (e) => {
    const state = e.target.value;
    console.log('State changed to:', state);
    setSelectedState(state);
    setSelectedDistrict('');
    setDistrictData([]);
    setCurrentData(null);
    if (state) {
      fetchDistricts(state);
    }
  };

  const handleDistrictChange = (e) => {
    const district = e.target.value;
    console.log('District changed to:', district);
    setSelectedDistrict(district);
    if (district) {
      fetchDistrictData(district);
    }
  };

  const useMyLocation = () => {
    console.log('Use my location clicked:', userLocation);
    if (userLocation) {
      setSelectedState(userLocation.state);
      setSelectedDistrict(userLocation.district);
      fetchDistricts(userLocation.state);
      setTimeout(() => {
        fetchDistrictData(userLocation.district);
      }, 500);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'english' ? 'hindi' : 'english');
  };

  const formatNumber = (num) => {
    if (!num && num !== 0) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  return (
    <div className="app">
      {/* Language Toggle */}
      <div className="language-toggle">
        <button 
          onClick={toggleLanguage}
          className={`lang-btn ${language === 'hindi' ? 'active' : ''}`}
        >
          {language === 'english' ? 'हिंदी' : 'English'}
        </button>
      </div>

      <header className="header">
        <h1>🌾 {t.title}</h1>
        <p>{t.subtitle}</p>
      </header>

      <main className="main-content">
        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}
        
        {/* Selection Panel */}
        <div className="selection-panel">
          <div className="form-group">
            <label className="form-label">{t.selectState}:</label>
            <select 
              value={selectedState} 
              onChange={handleStateChange}
              className="form-select large-text"
            >
              <option value="">-- {t.selectState} --</option>
              {states.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">{t.selectDistrict}:</label>
            <select 
              value={selectedDistrict} 
              onChange={handleDistrictChange}
              disabled={!selectedState}
              className="form-select large-text"
            >
              <option value="">-- {t.selectDistrict} --</option>
              {districts.map(district => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>
          </div>

          {userLocation && (
            <button 
              className="location-btn large-btn"
              onClick={useMyLocation}
            >
              {t.useLocation}
            </button>
          )}
        </div>

        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            {t.loading}
          </div>
        )}

        {/* Current Performance Dashboard */}
        {currentData && !loading && (
          <div className="dashboard">
            <div className="dashboard-header">
              <h2>{t.performance} {selectedDistrict}</h2>
              {currentData.last_updated && (
                <div className="last-updated">
                  {t.lastUpdated}: {formatDate(currentData.last_updated)}
                </div>
              )}
            </div>
            
            <div className="stats-grid">
              <div className="stat-card household-card">
                <div className="stat-icon">🏠</div>
                <h3>{t.households}</h3>
                <div className="stat-value">{formatNumber(currentData.total_households_worked)}</div>
                <div className="stat-label">{t.currentMonth}</div>
              </div>
              
              <div className="stat-card persons-card">
                <div className="stat-icon">👥</div>
                <h3>{t.persons}</h3>
                <div className="stat-value">{formatNumber(currentData.total_persons_worked)}</div>
                <div className="stat-label">{t.currentMonth}</div>
              </div>
              
              <div className="stat-card days-card">
                <div className="stat-icon">📅</div>
                <h3>{t.days}</h3>
                <div className="stat-value">{formatNumber(currentData.total_person_days)}</div>
                <div className="stat-label">{t.currentMonth}</div>
              </div>
              
              <div className="stat-card women-card">
                <div className="stat-icon">👩</div>
                <h3>{t.women}</h3>
                <div className="stat-value">{currentData.women_participation_percent}%</div>
                <div className="stat-progress">
                  <div 
                    className="progress-bar" 
                    style={{width: `${currentData.women_participation_percent}%`}}
                  ></div>
                </div>
              </div>
              
              <div className="stat-card sc-card">
                <div className="stat-icon">🔸</div>
                <h3>{t.sc}</h3>
                <div className="stat-value">{currentData.sc_participation_percent}%</div>
                <div className="stat-progress">
                  <div 
                    className="progress-bar" 
                    style={{width: `${currentData.sc_participation_percent}%`}}
                  ></div>
                </div>
              </div>
              
              <div className="stat-card st-card">
                <div className="stat-icon">🔹</div>
                <h3>{t.st}</h3>
                <div className="stat-value">{currentData.st_participation_percent}%</div>
                <div className="stat-progress">
                  <div 
                    className="progress-bar" 
                    style={{width: `${currentData.st_participation_percent}%`}}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!currentData && selectedDistrict && !loading && (
          <div className="no-data">
            <h3>📭 {t.noData} {selectedDistrict}</h3>
            <p>This district might not have reported MGNREGA data for the current period.</p>
          </div>
        )}

        {/* Welcome Message */}
        {!selectedDistrict && !loading && (
          <div className="welcome-message">
            <div className="welcome-icon">👋</div>
            <h3>Welcome to MGNREGA Tracker</h3>
            <p>Select your state and district to see how MGNREGA is performing in your area.</p>
            <p>Or click "Use My Location" to automatically detect your district.</p>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>{t.footer}</p>
        <div className="footer-info">
          <span>Backend: {API_BASE_URL}</span>
          <span>•</span>
          <span>Data Source: MGNREGA Portal</span>
        </div>
      </footer>
    </div>
  );
};

export default App;

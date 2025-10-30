# Public Health Monitor

A real-time mobile application for tracking disease outbreaks through wastewater surveillance data from the Texas Epidemic Public Health Institute (TEPHI).

## Features

### 🗺️ Interactive Map
- View all wastewater sampling locations across Texas
- Color-coded markers showing virus concentration levels (low/medium/high)
- Real-time GPS location tracking for personalized alerts
- Tap markers to see detailed site information and virus levels
- Filter by specific virus types (RSV, COVID-19, Influenza A/B, Measles, Polio, Dengue)

### 📈 Trends & Predictions
- Historical trend analysis with interactive charts
- 14-day outbreak forecasts using machine learning
- Multiple prediction models:
  - Simple trend analysis (rising/falling patterns)
  - Time-series forecasting
  - Multi-factor predictions incorporating historical data
- Outbreak risk assessment (low/medium/high)
- Customizable time ranges (7 days / 30 days)

### 🔔 Smart Alerts
- Real-time notifications when virus levels spike
- Personalized alerts based on your location
- Prediction-based warnings for potential outbreaks
- Configurable notification settings
- Alert history with read/unread tracking

### 📚 Health Information
- Comprehensive virus database with detailed information
- Symptoms, transmission methods, and prevention tips
- Educational content about wastewater surveillance
- Step-by-step explanation of how the monitoring system works

## Technology Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router (file-based routing)
- **Database**: Supabase (PostgreSQL)
- **Maps**: React Native Maps with location services
- **State Management**: React Hooks
- **TypeScript**: Full type safety
- **Icons**: Lucide React Native

## Database Schema

The app uses a comprehensive database schema including:
- `sampling_sites` - Wastewater collection locations
- `virus_types` - Reference data for tracked pathogens
- `wastewater_readings` - Historical surveillance data
- `predictions` - ML-generated outbreak forecasts
- `user_locations` - Personalized location tracking
- `alerts` - Notification history
- `public_health_events` - Other health issues beyond viruses

## Data Sources

The app seeds data based on the TEPHI (Texas Epidemic Public Health Institute) wastewater surveillance program. Currently uses mock data generation for demonstration purposes. Production deployment would integrate with the official TEPHI dashboard API when available.

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
The `.env` file already contains Supabase credentials.

3. Run the development server:
```bash
npm run dev
```

4. Build for web:
```bash
npm run build:web
```

## Features by Screen

### Map Screen (Home)
- Interactive Texas map with sampling site markers
- Virus selector to filter by pathogen type
- Location-based centering
- Detailed site information modal
- Real-time virus level indicators with trend arrows

### Trends Screen
- Location and virus selectors
- Current trend summary (increasing/decreasing/stable)
- Outbreak risk assessment card
- Historical data visualization (bar charts)
- 14-day prediction list with confidence scores

### Alerts Screen
- Notification toggle
- Alert feed (spike alerts, predictions, info)
- Severity levels (critical/warning/info)
- Location and virus tags
- Timestamp tracking
- Information section about alert types

### Info Screen
- Wastewater surveillance overview
- Searchable virus database
- Detailed virus modals with:
  - Symptoms list
  - Transmission information
  - Prevention tips
  - Risk level indicators
- How It Works section with 4-step process
- Medical disclaimer

## Prediction Algorithms

The app implements three prediction approaches:

1. **Simple Trend Analysis**: Calculates moving averages and detects rising/falling patterns
2. **Time-Series Forecasting**: Uses exponential smoothing and volatility calculations
3. **Anomaly Detection**: Identifies unusual spikes that may signal outbreak onset

All predictions include confidence scores based on data quality and time horizon.

## Location Services

The app requests location permissions to:
- Show nearby sampling sites
- Provide personalized alerts for your area
- Calculate distance to monitoring locations
- Filter data by geographic proximity

## Security & Privacy

- Row Level Security (RLS) enabled on all tables
- Public read access for surveillance data
- User-specific data protected by authentication
- No personal health information stored
- Location data used only for app functionality

## Future Enhancements

- Integration with official TEPHI API
- Push notifications via Expo Notifications
- Historical comparison features
- Export reports (PDF/CSV)
- Weather correlation analysis
- Hospital capacity indicators
- Air quality monitoring
- Community reporting features

## Notes

- Maps are optimized for mobile devices (iOS/Android)
- Web version shows a placeholder for the map view
- Data updates occur in real-time via Supabase
- The app automatically seeds initial data on first launch

## Support

For questions about the TEPHI wastewater surveillance program, visit:
- Website: https://tephi.texas.gov
- Dashboard: https://dashboard.tephi.texas.gov
- Email: info@tephi.texas.gov

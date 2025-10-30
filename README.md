# INFEX
**Infectious-disease Forecasting & Epidemiology eXchange**

A real-time mobile application for tracking disease outbreaks through wastewater surveillance data using the CDC's National Wastewater Surveillance System (NWSS) API. We were initially attempting to use the Texas Epidemic Public Health Institute (TEPHI) data, however the dashboard and lack of API integration made it difficult to utilize it's data.

Developed by **Arya Ahmadi** and **Ezra Weng**  
William P. Clements High School

---

## Overview

INFEX provides early warning of viral outbreaks by monitoring wastewater data from sampling sites across Texas. The app uses machine learning to predict disease trends up to 14 days in advance, helping individuals and communities make informed health decisions before widespread illness occurs.

---

## Key Features

### Interactive Disease Tracking Map
- Real-time visualization of wastewater sampling locations across Texas
- Color-coded markers indicating virus concentration levels (low/medium/high)
- GPS-based location tracking for personalized proximity alerts
- Detailed site information with current virus levels and trend indicators
- Filter by specific pathogens: RSV, COVID-19, Influenza A/B

### Predictive Analytics Engine
- **Simple Trend Analysis**: Moving averages to detect rising/falling patterns
- **Time-Series Forecasting**: Exponential smoothing with 14-day predictions
- **Anomaly Detection**: Identifies unusual spikes signaling potential outbreak onset
- Confidence scores based on data quality and prediction horizon
- Historical trend visualization with interactive bar charts

### Smart Alert System
- Real-time push notifications when virus levels spike in your area
- Location-based alerts with configurable radius (default 50km)
- Prediction-based warnings for potential outbreaks
- Alert history tracking with severity levels (critical/warning/info)
- Customizable notification preferences

### Comprehensive Health Information
- Detailed pathogen database with symptoms, transmission, and prevention
- Educational content about wastewater surveillance methodology
- Step-by-step explanation of how the monitoring system works
- Medical disclaimers and links to official health resources

---

## Technology Stack

### Frontend
- **Framework**: React Native 0.81.4 with Expo 54
- **Language**: TypeScript 5.9
- **Navigation**: Expo Router 6 (file-based routing)
- **UI Components**: Lucide React Native icons
- **Maps**: React Native Maps with location services
- **State Management**: React Hooks with Context API

### Backend & Database
- **Database**: SQL
- **API Integration**: CDC NWSS

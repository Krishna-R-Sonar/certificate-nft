// backend/index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const certificateRoutes = require('./routes/certificate');
const adminRoutes = require('./routes/admin');
require('dotenv').config();

const app = express();

// Validate critical environment variables
const requiredEnvVars = ['ALCHEMY_API_URL', 'CONTRACT_ADDRESS', 'PINATA_JWT', 'MONGO_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

// CORS configuration
app.use(cors({
  origin: process.env.REACT_APP_FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => {
    console.error('MongoDB connection error:', err.message, err.stack);
    process.exit(1);
  });

// Routes
app.use('/api/certificate', certificateRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Backend server is running' });
});

// 404 handler for undefined routes
app.use((req, res) => {
  console.warn(`Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', {
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
  });
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
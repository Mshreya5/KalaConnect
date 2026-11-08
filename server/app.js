const express = require('express');
const cors = require('cors');

const organizerRoutes = require('./routes/organizerRoutes');
const eventRoutes = require('./routes/eventRoutes');
const participationRoutes = require('./routes/participationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const lookupRoutes = require('./routes/lookupRoutes');

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.use('/api/organizers', organizerRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/participation', participationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api', lookupRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'KalaConnect Backend API'
  });
});

app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

module.exports = app;

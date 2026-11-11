require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/db');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => res.json({
  status: 'ok',
  service: 'KalaConnect Integrated API (Member 1 + Member 2)',
  timestamp: new Date().toISOString()
}));

// Member 1 Routes
app.use('/api/participants', require('./routes/participants'));
app.use('/api/activities', require('./routes/activities'));
app.use('/api/talents', require('./routes/talents'));
app.use('/api/availability', require('./routes/availability'));
app.get('/api/dashboard/stats', require('./controllers/talentController').dashboardStats);

// Member 2 Routes
app.use('/api/organizers', require('./routes/organizerRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/participation', require('./routes/participationRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api', require('./routes/lookupRoutes'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[API Error]', err.stack || err.message);
  res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
});

// 404 handler
app.use((req, res) => res.status(404).json({ success: false, error: 'Route not found' }));

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  testConnection().then(() => {
    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(` KalaConnect Unified API Server running on port ${PORT}`);
      console.log(` Health:       http://localhost:${PORT}/api/health`);
      console.log(` Participants: http://localhost:${PORT}/api/participants`);
      console.log(` Events:       http://localhost:${PORT}/api/events`);
      console.log(` Organizers:   http://localhost:${PORT}/api/organizers`);
      console.log(` Reports:      http://localhost:${PORT}/api/reports/dashboard-stats`);
      console.log(`====================================================`);
    });
  });
}

module.exports = app;

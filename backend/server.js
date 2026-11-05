require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'KalaConnect API', timestamp: new Date().toISOString() }));

// Dashboard stats
app.get('/api/dashboard/stats', require('./controllers/talentController').dashboardStats);

// Routes
app.use('/api/participants', require('./routes/participants'));
app.use('/api/activities', require('./routes/activities'));
app.use('/api/talents', require('./routes/talents'));
app.use('/api/availability', require('./routes/availability'));

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`KalaConnect API running on http://localhost:${PORT}`));

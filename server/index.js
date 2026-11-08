const app = require('./app');
const { testConnection } = require('./config/db');

const PORT = process.env.PORT || 5000;

async function startServer() {
  await testConnection();

  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` KalaConnect REST API Server is running on port ${PORT}`);
    console.log(` Health check: http://localhost:${PORT}/api/health`);
    console.log(` Events API:   http://localhost:${PORT}/api/events`);
    console.log(` Reports API:  http://localhost:${PORT}/api/reports/deficit`);
    console.log(`====================================================`);
  });
}

startServer();

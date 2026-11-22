/**
 * Frontdesk - Arvo Systems
 * Main Express Server
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const ticketRoutes = require('./routes/ticketRoutes');
const agentRoutes = require('./routes/agentRoutes');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'Frontdesk Support Service',
    time: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/tickets', ticketRoutes);
app.use('/api/agents', agentRoutes);

// In production, serve static frontend assets
if (process.env.NODE_ENV === 'production' || process.env.SERVE_CLIENT === 'true') {
  const clientDistPath = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDistPath));

  app.get('*', (req, res) => {
    if (!req.originalUrl.startsWith('/api')) {
      res.sendFile(path.join(clientDistPath, 'index.html'));
    }
  });
}

// Global error handler
app.use(errorHandler);

// Start server when executed directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🚀 Frontdesk API running on http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Working Hours Engine: 09:30 - 18:30 (Mon-Fri)`);
    console.log(`===============================================`);
  });
}

module.exports = app;

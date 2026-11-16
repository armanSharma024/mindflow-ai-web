require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const notesRoutes = require('./routes/notes');
const aiRoutes = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'MindFlow AI Full-Stack Service',
    database: 'SQLite (WAL Mode)',
    uptime: Math.floor(process.uptime()),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here')
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/ai', aiRoutes);

// Static client assets serving (for cloud deployment)
const clientBuildPath = path.join(__dirname, '..', 'dist', 'client');
const alternateBuildPath = path.join(__dirname, '..', 'client', 'dist');

const activeDist = fs.existsSync(clientBuildPath)
  ? clientBuildPath
  : (fs.existsSync(alternateBuildPath) ? alternateBuildPath : null);

if (activeDist) {
  console.log(`Serving static production build from: ${activeDist}`);
  app.use(express.static(activeDist));
  
  // Express 5 compatible SPA catch-all
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: `Endpoint ${req.method} ${req.path} not found` });
    }
    const indexPath = path.join(activeDist, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      next();
    }
  });
} else {
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: `Endpoint ${req.method} ${req.path} not found` });
    }
    res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>MindFlow AI API</title></head>
        <body style="font-family: system-ui; max-width: 600px; margin: 40px auto; padding: 20px; line-height: 1.6;">
          <h2>🚀 MindFlow AI API Server is running</h2>
          <p>The backend is active on port ${PORT}.</p>
          <p>To run the frontend dev server, execute: <code>cd client && npm run dev</code></p>
          <p>Health status: <a href="/api/health">/api/health</a></p>
        </body>
      </html>
    `);
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal server error occurred',
    message: process.env.NODE_ENV === 'production' ? undefined : err.message
  });
});

// Start listening explicitly on 0.0.0.0
app.listen(PORT, '0.0.0.0', () => {
  console.log(`=========================================`);
  console.log(`✨ MindFlow AI Server running on http://127.0.0.1:${PORT}`);
  console.log(`📊 Health Check: http://127.0.0.1:${PORT}/api/health`);
  console.log(`=========================================`);
});

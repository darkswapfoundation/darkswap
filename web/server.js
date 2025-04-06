/**
 * DarkSwap Web Server
 * 
 * This Express server serves the DarkSwap web application and implements
 * security headers, HTTPS, and other security best practices.
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const https = require('https');
const compression = require('compression');
const helmet = require('helmet');
const { addSecurityHeaders } = require('../security/security-headers');
const rateLimit = require('express-rate-limit');

// Load environment variables
require('dotenv').config();

// Create Express app
const app = express();

// Set environment variables
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const USE_HTTPS = process.env.USE_HTTPS === 'true' || NODE_ENV === 'production';
const CERT_DIR = process.env.CERT_DIR || '../security/certs';

// Apply security headers
app.use(addSecurityHeaders);

// Use Helmet for additional security headers
app.use(helmet());

// Enable gzip compression
app.use(compression());

// Apply rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api/', limiter); // Apply rate limiting to API routes

// Serve static files from the build directory
app.use(express.static(path.join(__dirname, 'build'), {
  maxAge: '1y', // Cache static assets for 1 year
  setHeaders: (res, path) => {
    // Don't cache HTML files
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// API routes
app.use('/api', require('./api'));

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({
    error: {
      code: 'internal_server_error',
      message: 'An unexpected error occurred',
      details: NODE_ENV === 'development' ? err.message : undefined
    }
  });
});

// Start the server
if (USE_HTTPS) {
  try {
    // Load SSL certificates
    const privateKey = fs.readFileSync(path.join(CERT_DIR, `${NODE_ENV}.key`), 'utf8');
    const certificate = fs.readFileSync(path.join(CERT_DIR, `${NODE_ENV}.crt`), 'utf8');
    const dhparam = fs.readFileSync(path.join(CERT_DIR, 'dhparam.pem'), 'utf8');
    
    const credentials = {
      key: privateKey,
      cert: certificate,
      dhparam: dhparam
    };
    
    // Create HTTPS server
    const httpsServer = https.createServer(credentials, app);
    
    httpsServer.listen(PORT, () => {
      console.log(`HTTPS server running on port ${PORT} in ${NODE_ENV} mode`);
    });
    
    // Redirect HTTP to HTTPS
    const httpApp = express();
    httpApp.use((req, res) => {
      res.redirect(`https://${req.hostname}${req.url}`);
    });
    
    httpApp.listen(80, () => {
      console.log('HTTP to HTTPS redirect server running on port 80');
    });
  } catch (error) {
    console.error('Failed to start HTTPS server:', error);
    console.log('Falling back to HTTP server...');
    
    // Fall back to HTTP if certificates can't be loaded
    app.listen(PORT, () => {
      console.log(`HTTP server running on port ${PORT} in ${NODE_ENV} mode`);
    });
  }
} else {
  // Start HTTP server
  app.listen(PORT, () => {
    console.log(`HTTP server running on port ${PORT} in ${NODE_ENV} mode`);
  });
}

// Export app for testing
module.exports = app;
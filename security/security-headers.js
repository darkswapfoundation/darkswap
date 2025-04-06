/**
 * Security Headers Configuration for DarkSwap
 * 
 * This file contains the configuration for security headers that should be
 * applied to all HTTP responses from the DarkSwap application.
 * 
 * These headers help protect against various attacks such as XSS, clickjacking,
 * MIME type sniffing, etc.
 */

// Content Security Policy (CSP)
// Restricts the sources from which resources can be loaded
const contentSecurityPolicy = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    imgSrc: ["'self'", "data:", "https://cdn.jsdelivr.net"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    connectSrc: [
      "'self'",
      "https://api.darkswap.io",
      "wss://api.darkswap.io",
      "wss://relay1.darkswap.io",
      "wss://relay2.darkswap.io"
    ],
    frameSrc: ["'none'"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    manifestSrc: ["'self'"],
    workerSrc: ["'self'", "blob:"],
    childSrc: ["'self'", "blob:"],
    formAction: ["'self'"],
    baseUri: ["'self'"],
    upgradeInsecureRequests: [],
    reportUri: "/csp-report"
  }
};

// Function to convert CSP object to string
const generateCSP = (policy) => {
  return Object.entries(policy.directives)
    .map(([key, values]) => {
      if (values.length === 0) {
        return key;
      }
      return `${key} ${values.join(' ')}`;
    })
    .join('; ');
};

// Security headers configuration
const securityHeaders = {
  // Content Security Policy
  'Content-Security-Policy': generateCSP(contentSecurityPolicy),
  
  // Prevent browsers from interpreting files as a different MIME type
  'X-Content-Type-Options': 'nosniff',
  
  // Prevent clickjacking by not allowing the page to be framed
  'X-Frame-Options': 'DENY',
  
  // Enable browser's XSS filtering
  'X-XSS-Protection': '1; mode=block',
  
  // Force HTTPS for a specified period
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  
  // Control how much referrer information should be included with requests
  'Referrer-Policy': 'no-referrer-when-downgrade',
  
  // Control which browser features can be used
  'Feature-Policy': "camera 'none'; microphone 'none'; geolocation 'none'",
  
  // Control which browser features and APIs can be used (newer version of Feature-Policy)
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

// Express middleware for adding security headers
const addSecurityHeaders = (req, res, next) => {
  Object.entries(securityHeaders).forEach(([header, value]) => {
    res.setHeader(header, value);
  });
  next();
};

// Function to apply security headers to a Next.js application
const applySecurityHeadersNextJS = () => {
  return {
    async headers() {
      return [
        {
          source: '/(.*)',
          headers: Object.entries(securityHeaders).map(([key, value]) => ({
            key,
            value,
          })),
        },
      ];
    },
  };
};

// Function to apply security headers to an Express application
const applySecurityHeadersExpress = (app) => {
  app.use(addSecurityHeaders);
};

// Function to apply security headers to a Netlify site
const generateNetlifyHeaders = () => {
  let content = "/*\n";
  
  Object.entries(securityHeaders).forEach(([header, value]) => {
    content += `  ${header}: ${value}\n`;
  });
  
  return content;
};

// Export the functions and configurations
module.exports = {
  securityHeaders,
  addSecurityHeaders,
  applySecurityHeadersNextJS,
  applySecurityHeadersExpress,
  generateNetlifyHeaders,
  contentSecurityPolicy,
  generateCSP
};
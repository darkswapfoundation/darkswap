/**
 * DarkSwap API Routes
 * 
 * This file defines the API routes for the DarkSwap web application.
 * It includes authentication, input validation, and rate limiting.
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, param, query, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { AccountLockoutManager, InMemoryStore } = require('../../security/password-security');

// Create an in-memory store for development
// In production, use a persistent store like Redis
const lockoutStore = new InMemoryStore();
const lockoutManager = new AccountLockoutManager(lockoutStore);

// JWT secret key (should be in environment variables in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';

// Middleware to parse JSON bodies
router.use(express.json());

// Rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many login attempts, please try again after 15 minutes'
});

// Authentication middleware
const authenticate = (req, res, next) => {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        code: 'authentication_required',
        message: 'Authentication required'
      }
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      error: {
        code: 'invalid_token',
        message: 'Invalid or expired token'
      }
    });
  }
};

// Input validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: {
        code: 'validation_error',
        message: 'Validation error',
        details: errors.array()
      }
    });
  }
  next();
};

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Authentication endpoints
router.post('/auth/login', 
  authLimiter,
  [
    body('username').isString().trim().notEmpty().withMessage('Username is required'),
    body('password').isString().notEmpty().withMessage('Password is required')
  ],
  validate,
  async (req, res) => {
    const { username, password } = req.body;

    try {
      // Check if account is locked
      const lockoutStatus = await lockoutManager.checkLockoutStatus(username);
      if (lockoutStatus.isLocked) {
        const lockedUntil = new Date(lockoutStatus.lockedUntil);
        return res.status(429).json({
          error: {
            code: 'account_locked',
            message: `Account is locked. Try again after ${lockedUntil.toLocaleTimeString()}`,
            lockedUntil: lockoutStatus.lockedUntil
          }
        });
      }

      // In a real application, you would verify the username and password against a database
      // For this example, we'll use a hardcoded user
      if (username === 'admin' && password === 'password') {
        // Reset failed login attempts on successful login
        await lockoutManager.resetAttempts(username);

        // Generate JWT token
        const token = jwt.sign(
          { id: '123', username: 'admin', role: 'admin' },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRY }
        );

        // Calculate expiry time
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // Assuming JWT_EXPIRY is '24h'

        return res.json({
          token,
          expires_at: expiresAt.toISOString()
        });
      }

      // Record failed login attempt
      const lockoutResult = await lockoutManager.recordFailedAttempt(username);
      
      // Return appropriate error message
      if (lockoutResult.isLocked) {
        const lockedUntil = new Date(lockoutResult.lockedUntil);
        return res.status(429).json({
          error: {
            code: 'account_locked',
            message: `Account is locked. Try again after ${lockedUntil.toLocaleTimeString()}`,
            lockedUntil: lockoutResult.lockedUntil
          }
        });
      } else {
        return res.status(401).json({
          error: {
            code: 'invalid_credentials',
            message: 'Invalid username or password',
            attempts_remaining: lockoutResult.attemptsRemaining
          }
        });
      }
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({
        error: {
          code: 'internal_server_error',
          message: 'An unexpected error occurred'
        }
      });
    }
  }
);

router.post('/auth/refresh', authenticate, (req, res) => {
  // Generate new JWT token
  const token = jwt.sign(
    { id: req.user.id, username: req.user.username, role: req.user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );

  // Calculate expiry time
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // Assuming JWT_EXPIRY is '24h'

  return res.json({
    token,
    expires_at: expiresAt.toISOString()
  });
});

// Orders endpoints
router.get('/orders', 
  authenticate,
  [
    query('base_asset').optional().isString().trim(),
    query('quote_asset').optional().isString().trim(),
    query('side').optional().isIn(['buy', 'sell']),
    query('status').optional().isIn(['open', 'filled', 'cancelled', 'expired']),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt()
  ],
  validate,
  (req, res) => {
    // In a real application, you would fetch orders from a database
    // For this example, we'll return mock data
    const orders = [
      {
        id: 'order123',
        base_asset: 'BTC',
        quote_asset: 'USD',
        side: 'buy',
        amount: 1.5,
        price: 50000,
        total: 75000,
        timestamp: '2025-04-05T12:00:00Z',
        status: 'open',
        maker: 'user123'
      },
      {
        id: 'order456',
        base_asset: 'BTC',
        quote_asset: 'USD',
        side: 'sell',
        amount: 0.5,
        price: 51000,
        total: 25500,
        timestamp: '2025-04-05T12:30:00Z',
        status: 'open',
        maker: 'user456'
      }
    ];

    return res.json({
      orders,
      total: 2,
      limit: 100,
      offset: 0
    });
  }
);

router.post('/orders', 
  authenticate,
  [
    body('base_asset').isString().trim().notEmpty().withMessage('Base asset is required'),
    body('quote_asset').isString().trim().notEmpty().withMessage('Quote asset is required'),
    body('side').isIn(['buy', 'sell']).withMessage('Side must be buy or sell'),
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
    body('price').isFloat({ gt: 0 }).withMessage('Price must be greater than 0'),
    body('expiry').optional().isInt({ min: 0 }).withMessage('Expiry must be a positive integer')
  ],
  validate,
  (req, res) => {
    const { base_asset, quote_asset, side, amount, price, expiry } = req.body;

    // In a real application, you would create an order in a database
    // For this example, we'll return mock data
    const order = {
      id: `order${Date.now()}`,
      base_asset,
      quote_asset,
      side,
      amount: parseFloat(amount),
      price: parseFloat(price),
      total: parseFloat(amount) * parseFloat(price),
      timestamp: new Date().toISOString(),
      status: 'open',
      maker: req.user.id
    };

    if (expiry) {
      const expiryDate = new Date();
      expiryDate.setSeconds(expiryDate.getSeconds() + expiry);
      order.expiry = expiryDate.toISOString();
    }

    return res.status(201).json(order);
  }
);

router.get('/orders/:id', 
  authenticate,
  [
    param('id').isString().trim().notEmpty().withMessage('Order ID is required')
  ],
  validate,
  (req, res) => {
    const { id } = req.params;

    // In a real application, you would fetch the order from a database
    // For this example, we'll return mock data
    if (id === 'order123') {
      return res.json({
        id: 'order123',
        base_asset: 'BTC',
        quote_asset: 'USD',
        side: 'buy',
        amount: 1.5,
        price: 50000,
        total: 75000,
        timestamp: '2025-04-05T12:00:00Z',
        status: 'open',
        maker: 'user123',
        expiry: '2025-04-05T13:00:00Z'
      });
    }

    return res.status(404).json({
      error: {
        code: 'order_not_found',
        message: 'Order not found'
      }
    });
  }
);

router.delete('/orders/:id', 
  authenticate,
  [
    param('id').isString().trim().notEmpty().withMessage('Order ID is required')
  ],
  validate,
  (req, res) => {
    const { id } = req.params;

    // In a real application, you would cancel the order in a database
    // For this example, we'll return mock data
    if (id === 'order123') {
      return res.json({
        id: 'order123',
        status: 'cancelled',
        timestamp: new Date().toISOString()
      });
    }

    return res.status(404).json({
      error: {
        code: 'order_not_found',
        message: 'Order not found'
      }
    });
  }
);

router.post('/orders/:id/take', 
  authenticate,
  [
    param('id').isString().trim().notEmpty().withMessage('Order ID is required'),
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0')
  ],
  validate,
  (req, res) => {
    const { id } = req.params;
    const { amount } = req.body;

    // In a real application, you would take the order in a database
    // For this example, we'll return mock data
    if (id === 'order123') {
      return res.json({
        trade_id: `trade${Date.now()}`,
        order_id: id,
        base_asset: 'BTC',
        quote_asset: 'USD',
        side: 'buy',
        amount: parseFloat(amount),
        price: 50000,
        total: parseFloat(amount) * 50000,
        timestamp: new Date().toISOString(),
        status: 'pending',
        maker: 'user123',
        taker: req.user.id
      });
    }

    return res.status(404).json({
      error: {
        code: 'order_not_found',
        message: 'Order not found'
      }
    });
  }
);

// Add more API endpoints as needed

module.exports = router;
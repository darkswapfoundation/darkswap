import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import {
  registerUser,
  loginUser,
  verifyAuthToken,
  generatePasswordResetToken,
  resetPassword,
  changePassword,
} from '../utils/auth';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post(
  '/register',
  [
    // Validate input
    body('username').notEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/[a-z]/)
      .withMessage('Password must contain at least one lowercase letter')
      .matches(/[A-Z]/)
      .withMessage('Password must contain at least one uppercase letter')
      .matches(/[0-9]/)
      .withMessage('Password must contain at least one number')
      .matches(/[^a-zA-Z0-9]/)
      .withMessage('Password must contain at least one special character'),
  ],
  async (req: Request, res: Response) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Extract user data from request body
      const { username, email, password } = req.body;

      // Register the user
      const result = await registerUser(username, email, password);

      // Return the result
      return res.status(201).json(result);
    } catch (error: any) {
      logger.error('Error registering user', error);
      
      // Handle specific errors
      if (error.message === 'Email already in use') {
        return res.status(400).json({ error: 'Email already in use' });
      }
      
      return res.status(500).json({ error: 'Server error' });
    }
  }
);

/**
 * @route POST /api/auth/login
 * @desc Login a user
 * @access Public
 */
router.post(
  '/login',
  [
    // Validate input
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req: Request, res: Response) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Extract user data from request body
      const { email, password } = req.body;

      // Login the user
      const result = await loginUser(email, password);

      // Return the result
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Error logging in user', error);
      
      // Handle specific errors
      if (error.message === 'Invalid credentials') {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      return res.status(500).json({ error: 'Server error' });
    }
  }
);

/**
 * @route GET /api/auth/verify
 * @desc Verify a token
 * @access Public
 */
router.get('/verify', (req: Request, res: Response) => {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    
    // If there is no authorization header, return an error
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }
    
    // Get the token from the authorization header
    const token = authHeader.split(' ')[1];
    
    // If there is no token, return an error
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    // Verify the token
    const userId = verifyAuthToken(token);
    
    // If the token is invalid, return an error
    if (!userId) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    // Return the result
    return res.status(200).json({ valid: true, userId });
  } catch (error: any) {
    logger.error('Error verifying token', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route POST /api/auth/forgot-password
 * @desc Request a password reset
 * @access Public
 */
router.post(
  '/forgot-password',
  [
    // Validate input
    body('email').isEmail().withMessage('Please include a valid email'),
  ],
  async (req: Request, res: Response) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Extract email from request body
      const { email } = req.body;

      // Generate a password reset token
      const resetToken = await generatePasswordResetToken(email);

      // In a real application, you would send an email with the reset token
      // For this example, we'll just return the token
      return res.status(200).json({ message: 'Password reset token generated', resetToken });
    } catch (error: any) {
      logger.error('Error generating password reset token', error);
      
      // Handle specific errors
      if (error.message === 'User not found') {
        return res.status(404).json({ error: 'User not found' });
      }
      
      return res.status(500).json({ error: 'Server error' });
    }
  }
);

/**
 * @route POST /api/auth/reset-password
 * @desc Reset a password
 * @access Public
 */
router.post(
  '/reset-password',
  [
    // Validate input
    body('email').isEmail().withMessage('Please include a valid email'),
    body('resetToken').notEmpty().withMessage('Reset token is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/[a-z]/)
      .withMessage('Password must contain at least one lowercase letter')
      .matches(/[A-Z]/)
      .withMessage('Password must contain at least one uppercase letter')
      .matches(/[0-9]/)
      .withMessage('Password must contain at least one number')
      .matches(/[^a-zA-Z0-9]/)
      .withMessage('Password must contain at least one special character'),
  ],
  async (req: Request, res: Response) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Extract data from request body
      const { email, resetToken, newPassword } = req.body;

      // Reset the password
      await resetPassword(email, resetToken, newPassword);

      // Return success
      return res.status(200).json({ message: 'Password reset successful' });
    } catch (error: any) {
      logger.error('Error resetting password', error);
      
      // Handle specific errors
      if (error.message === 'User not found') {
        return res.status(404).json({ error: 'User not found' });
      }
      
      if (error.message === 'Invalid reset token') {
        return res.status(400).json({ error: 'Invalid reset token' });
      }
      
      if (error.message === 'Reset token has expired') {
        return res.status(400).json({ error: 'Reset token has expired' });
      }
      
      return res.status(500).json({ error: 'Server error' });
    }
  }
);

/**
 * @route POST /api/auth/change-password
 * @desc Change a password
 * @access Private
 */
router.post(
  '/change-password',
  [
    // Validate input
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/[a-z]/)
      .withMessage('Password must contain at least one lowercase letter')
      .matches(/[A-Z]/)
      .withMessage('Password must contain at least one uppercase letter')
      .matches(/[0-9]/)
      .withMessage('Password must contain at least one number')
      .matches(/[^a-zA-Z0-9]/)
      .withMessage('Password must contain at least one special character'),
  ],
  async (req: Request, res: Response) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Extract data from request body
      const { currentPassword, newPassword } = req.body;

      // Get the user ID from the request
      const userId = req.userId;
      
      // If there is no user ID, return an error
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Change the password
      await changePassword(userId, currentPassword, newPassword);

      // Return success
      return res.status(200).json({ message: 'Password changed successfully' });
    } catch (error: any) {
      logger.error('Error changing password', error);
      
      // Handle specific errors
      if (error.message === 'User not found') {
        return res.status(404).json({ error: 'User not found' });
      }
      
      if (error.message === 'Invalid current password') {
        return res.status(400).json({ error: 'Invalid current password' });
      }
      
      return res.status(500).json({ error: 'Server error' });
    }
  }
);

export default router;
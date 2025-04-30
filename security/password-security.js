/**
 * Password Security Module for DarkSwap
 * 
 * This module provides functions for password validation, hashing, and account lockout management.
 * It implements best practices for password security to protect user accounts.
 */

const bcrypt = require('bcrypt');
const zxcvbn = require('zxcvbn');

// Configuration
const PASSWORD_CONFIG = {
  minLength: 12,
  minScore: 3, // zxcvbn score (0-4)
  saltRounds: 12,
  maxHistory: 5, // Number of previous passwords to remember
  expiryDays: 90, // Password expiration in days
  lockout: {
    maxAttempts: 5,
    timeWindow: 15 * 60 * 1000, // 15 minutes in milliseconds
    lockDuration: 30 * 60 * 1000, // 30 minutes in milliseconds
    progressiveMultiplier: 2 // Each subsequent lockout doubles in duration
  }
};

/**
 * Validates a password against security requirements
 * @param {string} password - The password to validate
 * @param {Object} userData - Optional user data to check against (to prevent using personal info in password)
 * @returns {Object} Validation result with isValid flag and feedback
 */
function validatePassword(password, userData = {}) {
  // Check password length
  if (!password || password.length < PASSWORD_CONFIG.minLength) {
    return {
      isValid: false,
      feedback: `Password must be at least ${PASSWORD_CONFIG.minLength} characters long`
    };
  }

  // Use zxcvbn to check password strength
  const userInputs = [];
  if (userData.email) userInputs.push(userData.email);
  if (userData.username) userInputs.push(userData.username);
  if (userData.firstName) userInputs.push(userData.firstName);
  if (userData.lastName) userInputs.push(userData.lastName);

  const result = zxcvbn(password, userInputs);

  // Check if password meets minimum strength requirements
  if (result.score < PASSWORD_CONFIG.minScore) {
    return {
      isValid: false,
      feedback: result.feedback.warning || 'Password is too weak',
      suggestions: result.feedback.suggestions,
      score: result.score
    };
  }

  return {
    isValid: true,
    feedback: 'Password meets requirements',
    score: result.score
  };
}

/**
 * Hashes a password using bcrypt
 * @param {string} password - The password to hash
 * @returns {Promise<string>} The hashed password
 */
async function hashPassword(password) {
  return await bcrypt.hash(password, PASSWORD_CONFIG.saltRounds);
}

/**
 * Verifies a password against a hash
 * @param {string} password - The password to verify
 * @param {string} hash - The hash to verify against
 * @returns {Promise<boolean>} Whether the password matches the hash
 */
async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * Checks if a password has been used before
 * @param {string} password - The password to check
 * @param {Array<string>} passwordHistory - Array of previous password hashes
 * @returns {Promise<boolean>} Whether the password has been used before
 */
async function isPasswordReused(password, passwordHistory) {
  if (!passwordHistory || !Array.isArray(passwordHistory)) {
    return false;
  }

  for (const hash of passwordHistory) {
    if (await verifyPassword(password, hash)) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if a password has expired
 * @param {Date} lastPasswordChange - Date of last password change
 * @returns {boolean} Whether the password has expired
 */
function isPasswordExpired(lastPasswordChange) {
  if (!lastPasswordChange) {
    return true;
  }

  const now = new Date();
  const expiryDate = new Date(lastPasswordChange);
  expiryDate.setDate(expiryDate.getDate() + PASSWORD_CONFIG.expiryDays);

  return now > expiryDate;
}

/**
 * Manages failed login attempts and account lockouts
 */
class AccountLockoutManager {
  constructor(store) {
    // store should be a database or cache that persists between requests
    this.store = store;
  }

  /**
   * Records a failed login attempt
   * @param {string} userId - User ID or username
   * @returns {Promise<Object>} Lockout status
   */
  async recordFailedAttempt(userId) {
    const key = `lockout:${userId}`;
    let record = await this.store.get(key) || {
      attempts: 0,
      firstAttempt: Date.now(),
      lockoutCount: 0,
      lockedUntil: null
    };

    // Check if current lockout has expired
    if (record.lockedUntil && Date.now() > record.lockedUntil) {
      // Reset but increment lockout count for progressive lockouts
      record = {
        attempts: 1,
        firstAttempt: Date.now(),
        lockoutCount: record.lockoutCount,
        lockedUntil: null
      };
    } else if (!record.lockedUntil) {
      // Not locked, increment attempts
      record.attempts += 1;

      // Check if attempts are within the time window
      const timeWindow = PASSWORD_CONFIG.lockout.timeWindow;
      if (Date.now() - record.firstAttempt > timeWindow) {
        // Reset if outside time window
        record.attempts = 1;
        record.firstAttempt = Date.now();
      }

      // Check if account should be locked
      if (record.attempts >= PASSWORD_CONFIG.lockout.maxAttempts) {
        record.lockoutCount += 1;
        
        // Calculate lockout duration with progressive increase
        const baseDuration = PASSWORD_CONFIG.lockout.lockDuration;
        const multiplier = Math.pow(
          PASSWORD_CONFIG.lockout.progressiveMultiplier, 
          Math.min(record.lockoutCount - 1, 5) // Cap at 5 to prevent excessive lockouts
        );
        const lockDuration = baseDuration * multiplier;
        
        record.lockedUntil = Date.now() + lockDuration;
      }
    }

    // Save updated record
    await this.store.set(key, record);

    return {
      isLocked: record.lockedUntil !== null && Date.now() < record.lockedUntil,
      attemptsRemaining: Math.max(0, PASSWORD_CONFIG.lockout.maxAttempts - record.attempts),
      lockedUntil: record.lockedUntil
    };
  }

  /**
   * Checks if an account is locked
   * @param {string} userId - User ID or username
   * @returns {Promise<Object>} Lockout status
   */
  async checkLockoutStatus(userId) {
    const key = `lockout:${userId}`;
    const record = await this.store.get(key);

    if (!record || !record.lockedUntil || Date.now() > record.lockedUntil) {
      return {
        isLocked: false,
        attemptsRemaining: PASSWORD_CONFIG.lockout.maxAttempts,
        lockedUntil: null
      };
    }

    return {
      isLocked: true,
      attemptsRemaining: 0,
      lockedUntil: record.lockedUntil
    };
  }

  /**
   * Resets failed login attempts for a user
   * @param {string} userId - User ID or username
   * @returns {Promise<void>}
   */
  async resetAttempts(userId) {
    const key = `lockout:${userId}`;
    await this.store.delete(key);
  }
}

/**
 * Example in-memory store for development/testing
 */
class InMemoryStore {
  constructor() {
    this.store = new Map();
  }

  async get(key) {
    return this.store.get(key);
  }

  async set(key, value) {
    this.store.set(key, value);
  }

  async delete(key) {
    this.store.delete(key);
  }
}

module.exports = {
  validatePassword,
  hashPassword,
  verifyPassword,
  isPasswordReused,
  isPasswordExpired,
  AccountLockoutManager,
  InMemoryStore,
  PASSWORD_CONFIG
};
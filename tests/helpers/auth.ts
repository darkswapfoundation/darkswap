import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../src/db';

/**
 * Generates an authentication token for a user
 * @param userId User ID
 * @returns Authentication token
 */
export function generateAuthToken(userId: string): string {
  // Get the JWT secret from environment variables
  const jwtSecret = process.env.JWT_SECRET || 'default-secret-for-testing';
  
  // Generate a token
  const token = jwt.sign(
    {
      userId,
      // Add additional claims as needed
    },
    jwtSecret,
    {
      expiresIn: '1h', // Token expires in 1 hour
    }
  );
  
  return token;
}

/**
 * Verifies an authentication token
 * @param token Authentication token
 * @returns User ID if the token is valid, null otherwise
 */
export function verifyAuthToken(token: string): string | null {
  try {
    // Get the JWT secret from environment variables
    const jwtSecret = process.env.JWT_SECRET || 'default-secret-for-testing';
    
    // Verify the token
    const decoded = jwt.verify(token, jwtSecret) as { userId: string };
    
    return decoded.userId;
  } catch (error) {
    return null;
  }
}

/**
 * Creates a test session
 * @param userId User ID
 * @returns Session ID
 */
export async function createTestSession(userId: string): Promise<string> {
  // Generate a unique session ID
  const sessionId = uuidv4();
  
  // Insert the session into the database
  await db.sessions.insert({
    id: sessionId,
    userId,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expires in 24 hours
  });
  
  return sessionId;
}

/**
 * Deletes a test session
 * @param sessionId Session ID
 */
export async function deleteTestSession(sessionId: string): Promise<void> {
  // Delete the session from the database
  await db.sessions.delete({ id: sessionId });
}

/**
 * Gets a test session
 * @param sessionId Session ID
 * @returns Session data
 */
export async function getTestSession(sessionId: string): Promise<any> {
  // Get the session from the database
  return await db.sessions.findOne({ id: sessionId });
}

/**
 * Creates a test API key
 * @param userId User ID
 * @returns API key
 */
export async function createTestApiKey(userId: string): Promise<string> {
  // Generate a unique API key
  const apiKey = uuidv4();
  
  // Insert the API key into the database
  await db.apiKeys.insert({
    key: apiKey,
    userId,
    createdAt: new Date(),
    lastUsedAt: null,
  });
  
  return apiKey;
}

/**
 * Deletes a test API key
 * @param apiKey API key
 */
export async function deleteTestApiKey(apiKey: string): Promise<void> {
  // Delete the API key from the database
  await db.apiKeys.delete({ key: apiKey });
}

/**
 * Gets a test API key
 * @param apiKey API key
 * @returns API key data
 */
export async function getTestApiKey(apiKey: string): Promise<any> {
  // Get the API key from the database
  return await db.apiKeys.findOne({ key: apiKey });
}

/**
 * Creates a test 2FA secret
 * @param userId User ID
 * @returns 2FA secret
 */
export async function createTest2FASecret(userId: string): Promise<string> {
  // Generate a random 2FA secret
  const secret = Array.from({ length: 20 }, () =>
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
  ).join('');
  
  // Insert the 2FA secret into the database
  await db.twoFactorSecrets.insert({
    userId,
    secret,
    verified: false,
    createdAt: new Date(),
  });
  
  return secret;
}

/**
 * Deletes a test 2FA secret
 * @param userId User ID
 */
export async function deleteTest2FASecret(userId: string): Promise<void> {
  // Delete the 2FA secret from the database
  await db.twoFactorSecrets.delete({ userId });
}

/**
 * Gets a test 2FA secret
 * @param userId User ID
 * @returns 2FA secret data
 */
export async function getTest2FASecret(userId: string): Promise<any> {
  // Get the 2FA secret from the database
  return await db.twoFactorSecrets.findOne({ userId });
}
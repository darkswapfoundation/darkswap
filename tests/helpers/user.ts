import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { hashPassword } from '../../src/utils/auth';
import { db } from '../../src/db';

/**
 * User data interface
 */
export interface UserData {
  username: string;
  email: string;
  password: string;
}

/**
 * Creates a test user
 * @param userData User data
 * @returns User ID
 */
export async function createTestUser(userData: UserData): Promise<string> {
  // Generate a unique user ID
  const userId = uuidv4();
  
  // Hash the password
  const hashedPassword = await hashPassword(userData.password);
  
  // Insert the user into the database
  await db.users.insert({
    id: userId,
    username: userData.username,
    email: userData.email,
    password: hashedPassword,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  
  return userId;
}

/**
 * Deletes a test user
 * @param userId User ID
 */
export async function deleteTestUser(userId: string): Promise<void> {
  // Delete the user from the database
  await db.users.delete({ id: userId });
}

/**
 * Gets a test user
 * @param userId User ID
 * @returns User data
 */
export async function getTestUser(userId: string): Promise<any> {
  // Get the user from the database
  return await db.users.findOne({ id: userId });
}

/**
 * Updates a test user
 * @param userId User ID
 * @param userData User data
 */
export async function updateTestUser(userId: string, userData: Partial<UserData>): Promise<void> {
  // Update the user in the database
  await db.users.update(
    { id: userId },
    {
      $set: {
        ...userData,
        updatedAt: new Date(),
      },
    }
  );
}
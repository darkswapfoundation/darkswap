import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

/**
 * Storage service for secure and non-secure data storage
 */
class StorageService {
  private static instance: StorageService;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}

  /**
   * Get singleton instance
   * @returns StorageService instance
   */
  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  /**
   * Save data to AsyncStorage
   * @param key - Storage key
   * @param value - Value to store
   * @returns Promise that resolves when data is saved
   */
  public async saveData(key: string, value: any): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error('Error saving data:', error);
      throw error;
    }
  }

  /**
   * Load data from AsyncStorage
   * @param key - Storage key
   * @returns Promise that resolves with stored value or null if not found
   */
  public async loadData<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Error loading data:', error);
      throw error;
    }
  }

  /**
   * Remove data from AsyncStorage
   * @param key - Storage key
   * @returns Promise that resolves when data is removed
   */
  public async removeData(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing data:', error);
      throw error;
    }
  }

  /**
   * Clear all data from AsyncStorage
   * @returns Promise that resolves when all data is cleared
   */
  public async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }

  /**
   * Save secure data to Keychain
   * @param key - Storage key
   * @param value - Value to store
   * @returns Promise that resolves when data is saved
   */
  public async saveSecureData(key: string, value: string): Promise<void> {
    try {
      await Keychain.setGenericPassword(key, value);
    } catch (error) {
      console.error('Error saving secure data:', error);
      throw error;
    }
  }

  /**
   * Load secure data from Keychain
   * @param key - Storage key
   * @returns Promise that resolves with stored value or null if not found
   */
  public async loadSecureData(key: string): Promise<string | null> {
    try {
      const credentials = await Keychain.getGenericPassword();
      if (credentials && credentials.username === key) {
        return credentials.password;
      }
      return null;
    } catch (error) {
      console.error('Error loading secure data:', error);
      throw error;
    }
  }

  /**
   * Remove secure data from Keychain
   * @returns Promise that resolves when data is removed
   */
  public async removeSecureData(): Promise<void> {
    try {
      await Keychain.resetGenericPassword();
    } catch (error) {
      console.error('Error removing secure data:', error);
      throw error;
    }
  }

  /**
   * Save auth token to Keychain
   * @param token - Auth token
   * @returns Promise that resolves when token is saved
   */
  public async saveAuthToken(token: string): Promise<void> {
    try {
      await Keychain.setGenericPassword('authToken', token);
    } catch (error) {
      console.error('Error saving auth token:', error);
      throw error;
    }
  }

  /**
   * Load auth token from Keychain
   * @returns Promise that resolves with auth token or null if not found
   */
  public async loadAuthToken(): Promise<string | null> {
    try {
      const credentials = await Keychain.getGenericPassword();
      if (credentials && credentials.username === 'authToken') {
        return credentials.password;
      }
      return null;
    } catch (error) {
      console.error('Error loading auth token:', error);
      throw error;
    }
  }

  /**
   * Remove auth token from Keychain
   * @returns Promise that resolves when token is removed
   */
  public async removeAuthToken(): Promise<void> {
    try {
      await Keychain.resetGenericPassword();
    } catch (error) {
      console.error('Error removing auth token:', error);
      throw error;
    }
  }
}

export default StorageService.getInstance();
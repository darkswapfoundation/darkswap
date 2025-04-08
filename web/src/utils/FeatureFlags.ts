/**
 * FeatureFlags.ts - Feature flag system
 * 
 * This file provides a feature flag system for controlled feature rollout.
 */

/**
 * Feature flag value
 */
export type FeatureFlagValue = boolean | string | number | object;

/**
 * Feature flag
 */
export interface FeatureFlag {
  /**
   * Feature name
   */
  name: string;
  
  /**
   * Feature value
   */
  value: FeatureFlagValue;
  
  /**
   * Feature description
   */
  description?: string;
  
  /**
   * Whether the feature is enabled
   */
  enabled: boolean;
  
  /**
   * Feature group
   */
  group?: string;
  
  /**
   * Feature tags
   */
  tags?: string[];
  
  /**
   * Feature metadata
   */
  metadata?: Record<string, any>;
}

/**
 * Feature flag options
 */
export interface FeatureFlagOptions {
  /**
   * Feature description
   */
  description?: string;
  
  /**
   * Feature group
   */
  group?: string;
  
  /**
   * Feature tags
   */
  tags?: string[];
  
  /**
   * Feature metadata
   */
  metadata?: Record<string, any>;
}

/**
 * Feature flag provider
 */
export interface FeatureFlagProvider {
  /**
   * Get a feature flag
   * @param name - Feature name
   * @returns Feature flag or undefined if not found
   */
  getFlag(name: string): FeatureFlag | undefined;
  
  /**
   * Get all feature flags
   * @returns All feature flags
   */
  getAllFlags(): FeatureFlag[];
  
  /**
   * Check if a feature is enabled
   * @param name - Feature name
   * @param defaultValue - Default value if feature flag is not found
   * @returns Whether the feature is enabled
   */
  isEnabled(name: string, defaultValue?: boolean): boolean;
  
  /**
   * Get a feature value
   * @param name - Feature name
   * @param defaultValue - Default value if feature flag is not found
   * @returns Feature value
   */
  getValue<T extends FeatureFlagValue>(name: string, defaultValue?: T): T;
}

/**
 * In-memory feature flag provider
 */
export class InMemoryFeatureFlagProvider implements FeatureFlagProvider {
  /**
   * Feature flags
   */
  private flags: Map<string, FeatureFlag> = new Map();
  
  /**
   * Constructor
   * @param initialFlags - Initial feature flags
   */
  constructor(initialFlags?: Record<string, FeatureFlagValue | FeatureFlag>) {
    // Initialize feature flags
    if (initialFlags) {
      for (const [name, value] of Object.entries(initialFlags)) {
        if (typeof value === 'object' && value !== null && 'name' in value && 'value' in value && 'enabled' in value) {
          // Value is a FeatureFlag
          this.flags.set(name, value as FeatureFlag);
        } else {
          // Value is a FeatureFlagValue
          this.flags.set(name, {
            name,
            value: value as FeatureFlagValue,
            enabled: true,
          });
        }
      }
    }
  }
  
  /**
   * Get a feature flag
   * @param name - Feature name
   * @returns Feature flag or undefined if not found
   */
  getFlag(name: string): FeatureFlag | undefined {
    return this.flags.get(name);
  }
  
  /**
   * Get all feature flags
   * @returns All feature flags
   */
  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }
  
  /**
   * Check if a feature is enabled
   * @param name - Feature name
   * @param defaultValue - Default value if feature flag is not found
   * @returns Whether the feature is enabled
   */
  isEnabled(name: string, defaultValue: boolean = false): boolean {
    const flag = this.flags.get(name);
    return flag ? flag.enabled : defaultValue;
  }
  
  /**
   * Get a feature value
   * @param name - Feature name
   * @param defaultValue - Default value if feature flag is not found
   * @returns Feature value
   */
  getValue<T extends FeatureFlagValue>(name: string, defaultValue?: T): T {
    const flag = this.flags.get(name);
    return (flag ? flag.value : defaultValue) as T;
  }
  
  /**
   * Set a feature flag
   * @param name - Feature name
   * @param value - Feature value
   * @param enabled - Whether the feature is enabled
   * @param options - Feature options
   * @returns Feature flag
   */
  setFlag(
    name: string,
    value: FeatureFlagValue,
    enabled: boolean = true,
    options: FeatureFlagOptions = {},
  ): FeatureFlag {
    // Create feature flag
    const flag: FeatureFlag = {
      name,
      value,
      enabled,
      ...options,
    };
    
    // Set feature flag
    this.flags.set(name, flag);
    
    return flag;
  }
  
  /**
   * Enable a feature
   * @param name - Feature name
   * @returns Whether the feature was enabled
   */
  enableFeature(name: string): boolean {
    // Get feature flag
    const flag = this.flags.get(name);
    
    // Check if feature flag exists
    if (!flag) {
      return false;
    }
    
    // Enable feature
    flag.enabled = true;
    
    return true;
  }
  
  /**
   * Disable a feature
   * @param name - Feature name
   * @returns Whether the feature was disabled
   */
  disableFeature(name: string): boolean {
    // Get feature flag
    const flag = this.flags.get(name);
    
    // Check if feature flag exists
    if (!flag) {
      return false;
    }
    
    // Disable feature
    flag.enabled = false;
    
    return true;
  }
  
  /**
   * Remove a feature flag
   * @param name - Feature name
   * @returns Whether the feature flag was removed
   */
  removeFlag(name: string): boolean {
    return this.flags.delete(name);
  }
  
  /**
   * Clear all feature flags
   */
  clearFlags(): void {
    this.flags.clear();
  }
}

/**
 * Local storage feature flag provider
 */
export class LocalStorageFeatureFlagProvider implements FeatureFlagProvider {
  /**
   * Storage key
   */
  private storageKey: string;
  
  /**
   * In-memory provider
   */
  private inMemoryProvider: InMemoryFeatureFlagProvider;
  
  /**
   * Constructor
   * @param storageKey - Storage key
   * @param initialFlags - Initial feature flags
   */
  constructor(storageKey: string = 'feature-flags', initialFlags?: Record<string, FeatureFlagValue | FeatureFlag>) {
    this.storageKey = storageKey;
    
    // Load feature flags from local storage
    const storedFlags = this.loadFlags();
    
    // Initialize in-memory provider
    this.inMemoryProvider = new InMemoryFeatureFlagProvider({
      ...storedFlags,
      ...initialFlags,
    });
  }
  
  /**
   * Load feature flags from local storage
   * @returns Feature flags
   */
  private loadFlags(): Record<string, FeatureFlag> {
    try {
      // Check if local storage is available
      if (typeof localStorage === 'undefined') {
        return {};
      }
      
      // Get stored flags
      const storedFlags = localStorage.getItem(this.storageKey);
      
      // Check if stored flags exist
      if (!storedFlags) {
        return {};
      }
      
      // Parse stored flags
      return JSON.parse(storedFlags);
    } catch (error) {
      console.error('Failed to load feature flags from local storage:', error);
      return {};
    }
  }
  
  /**
   * Save feature flags to local storage
   */
  private saveFlags(): void {
    try {
      // Check if local storage is available
      if (typeof localStorage === 'undefined') {
        return;
      }
      
      // Get all flags
      const flags = this.inMemoryProvider.getAllFlags();
      
      // Create flags object
      const flagsObject: Record<string, FeatureFlag> = {};
      
      // Add flags to object
      for (const flag of flags) {
        flagsObject[flag.name] = flag;
      }
      
      // Save flags to local storage
      localStorage.setItem(this.storageKey, JSON.stringify(flagsObject));
    } catch (error) {
      console.error('Failed to save feature flags to local storage:', error);
    }
  }
  
  /**
   * Get a feature flag
   * @param name - Feature name
   * @returns Feature flag or undefined if not found
   */
  getFlag(name: string): FeatureFlag | undefined {
    return this.inMemoryProvider.getFlag(name);
  }
  
  /**
   * Get all feature flags
   * @returns All feature flags
   */
  getAllFlags(): FeatureFlag[] {
    return this.inMemoryProvider.getAllFlags();
  }
  
  /**
   * Check if a feature is enabled
   * @param name - Feature name
   * @param defaultValue - Default value if feature flag is not found
   * @returns Whether the feature is enabled
   */
  isEnabled(name: string, defaultValue: boolean = false): boolean {
    return this.inMemoryProvider.isEnabled(name, defaultValue);
  }
  
  /**
   * Get a feature value
   * @param name - Feature name
   * @param defaultValue - Default value if feature flag is not found
   * @returns Feature value
   */
  getValue<T extends FeatureFlagValue>(name: string, defaultValue?: T): T {
    return this.inMemoryProvider.getValue(name, defaultValue);
  }
  
  /**
   * Set a feature flag
   * @param name - Feature name
   * @param value - Feature value
   * @param enabled - Whether the feature is enabled
   * @param options - Feature options
   * @returns Feature flag
   */
  setFlag(
    name: string,
    value: FeatureFlagValue,
    enabled: boolean = true,
    options: FeatureFlagOptions = {},
  ): FeatureFlag {
    // Set flag in in-memory provider
    const flag = this.inMemoryProvider.setFlag(name, value, enabled, options);
    
    // Save flags to local storage
    this.saveFlags();
    
    return flag;
  }
  
  /**
   * Enable a feature
   * @param name - Feature name
   * @returns Whether the feature was enabled
   */
  enableFeature(name: string): boolean {
    // Enable feature in in-memory provider
    const result = this.inMemoryProvider.enableFeature(name);
    
    // Save flags to local storage
    this.saveFlags();
    
    return result;
  }
  
  /**
   * Disable a feature
   * @param name - Feature name
   * @returns Whether the feature was disabled
   */
  disableFeature(name: string): boolean {
    // Disable feature in in-memory provider
    const result = this.inMemoryProvider.disableFeature(name);
    
    // Save flags to local storage
    this.saveFlags();
    
    return result;
  }
  
  /**
   * Remove a feature flag
   * @param name - Feature name
   * @returns Whether the feature flag was removed
   */
  removeFlag(name: string): boolean {
    // Remove flag from in-memory provider
    const result = this.inMemoryProvider.removeFlag(name);
    
    // Save flags to local storage
    this.saveFlags();
    
    return result;
  }
  
  /**
   * Clear all feature flags
   */
  clearFlags(): void {
    // Clear flags in in-memory provider
    this.inMemoryProvider.clearFlags();
    
    // Save flags to local storage
    this.saveFlags();
  }
}

/**
 * Feature flag manager
 */
export class FeatureFlagManager implements FeatureFlagProvider {
  /**
   * Feature flag provider
   */
  private provider: FeatureFlagProvider;
  
  /**
   * Constructor
   * @param provider - Feature flag provider
   */
  constructor(provider: FeatureFlagProvider) {
    this.provider = provider;
  }
  
  /**
   * Get a feature flag
   * @param name - Feature name
   * @returns Feature flag or undefined if not found
   */
  getFlag(name: string): FeatureFlag | undefined {
    return this.provider.getFlag(name);
  }
  
  /**
   * Get all feature flags
   * @returns All feature flags
   */
  getAllFlags(): FeatureFlag[] {
    return this.provider.getAllFlags();
  }
  
  /**
   * Check if a feature is enabled
   * @param name - Feature name
   * @param defaultValue - Default value if feature flag is not found
   * @returns Whether the feature is enabled
   */
  isEnabled(name: string, defaultValue: boolean = false): boolean {
    return this.provider.isEnabled(name, defaultValue);
  }
  
  /**
   * Get a feature value
   * @param name - Feature name
   * @param defaultValue - Default value if feature flag is not found
   * @returns Feature value
   */
  getValue<T extends FeatureFlagValue>(name: string, defaultValue?: T): T {
    return this.provider.getValue(name, defaultValue);
  }
  
  /**
   * Set provider
   * @param provider - Feature flag provider
   */
  setProvider(provider: FeatureFlagProvider): void {
    this.provider = provider;
  }
  
  /**
   * Get provider
   * @returns Feature flag provider
   */
  getProvider(): FeatureFlagProvider {
    return this.provider;
  }
}

/**
 * Global feature flag manager
 */
export const featureFlagManager = new FeatureFlagManager(
  new LocalStorageFeatureFlagProvider()
);

/**
 * Default export
 */
export default featureFlagManager;
import { logger } from './logger';
import Ajv, { JSONSchemaType } from 'ajv';
import addFormats from 'ajv-formats';

/**
 * Input validation options
 */
export interface InputValidationOptions {
  strict?: boolean;
  allErrors?: boolean;
  removeAdditional?: boolean | 'all' | 'failing';
  useDefaults?: boolean;
  coerceTypes?: boolean | 'array';
}

/**
 * Input validation result
 */
export interface InputValidationResult {
  valid: boolean;
  errors?: any[];
}

/**
 * Input validator
 */
export class InputValidator {
  private ajv: Ajv;
  private schemas: Map<string, JSONSchemaType<any>> = new Map();
  
  /**
   * Creates a new input validator
   * @param options Input validation options
   */
  constructor(options: InputValidationOptions = {}) {
    // Create Ajv instance
    this.ajv = new Ajv({
      strict: options.strict !== undefined ? options.strict : false,
      allErrors: options.allErrors !== undefined ? options.allErrors : true,
      removeAdditional: options.removeAdditional !== undefined ? options.removeAdditional : 'all',
      useDefaults: options.useDefaults !== undefined ? options.useDefaults : true,
      coerceTypes: options.coerceTypes !== undefined ? options.coerceTypes : true,
    });
    
    // Add formats
    addFormats(this.ajv);
    
    logger.info('Input validator created', { options });
  }
  
  /**
   * Adds a schema
   * @param name Schema name
   * @param schema Schema
   */
  public addSchema(name: string, schema: JSONSchemaType<any>): void {
    // Add the schema
    this.ajv.addSchema(schema, name);
    
    // Store the schema
    this.schemas.set(name, schema);
    
    logger.info('Schema added', { name });
  }
  
  /**
   * Removes a schema
   * @param name Schema name
   */
  public removeSchema(name: string): void {
    // Remove the schema
    this.ajv.removeSchema(name);
    
    // Remove the schema from the map
    this.schemas.delete(name);
    
    logger.info('Schema removed', { name });
  }
  
  /**
   * Gets a schema
   * @param name Schema name
   * @returns Schema
   */
  public getSchema(name: string): JSONSchemaType<any> | undefined {
    return this.schemas.get(name);
  }
  
  /**
   * Gets all schemas
   * @returns Schemas
   */
  public getSchemas(): Map<string, JSONSchemaType<any>> {
    return this.schemas;
  }
  
  /**
   * Validates data against a schema
   * @param name Schema name
   * @param data Data
   * @returns Validation result
   */
  public validate(name: string, data: any): InputValidationResult {
    try {
      // Get the validate function
      const validate = this.ajv.getSchema(name);
      
      // If the schema doesn't exist, return an error
      if (!validate) {
        return {
          valid: false,
          errors: [{ message: `Schema ${name} not found` }],
        };
      }
      
      // Validate the data
      const valid = validate(data);
      
      // If the data is valid, return success
      if (valid) {
        return {
          valid: true,
        };
      }
      
      // Return the errors
      return {
        valid: false,
        errors: validate.errors,
      };
    } catch (error) {
      logger.error('Error validating data', error);
      
      return {
        valid: false,
        errors: [{ message: 'Error validating data' }],
      };
    }
  }
  
  /**
   * Sanitizes data
   * @param data Data
   * @returns Sanitized data
   */
  public sanitize(data: any): any {
    try {
      // If the data is not an object or array, return it
      if (typeof data !== 'object' || data === null) {
        return this.sanitizeValue(data);
      }
      
      // If the data is an array, sanitize each element
      if (Array.isArray(data)) {
        return data.map((item) => this.sanitize(item));
      }
      
      // Sanitize each property
      const sanitized: any = {};
      
      for (const [key, value] of Object.entries(data)) {
        // Sanitize the key
        const sanitizedKey = this.sanitizeKey(key);
        
        // Sanitize the value
        const sanitizedValue = this.sanitize(value);
        
        // Add the sanitized property
        sanitized[sanitizedKey] = sanitizedValue;
      }
      
      return sanitized;
    } catch (error) {
      logger.error('Error sanitizing data', error);
      return data;
    }
  }
  
  /**
   * Sanitizes a key
   * @param key Key
   * @returns Sanitized key
   */
  private sanitizeKey(key: string): string {
    try {
      // Remove non-alphanumeric characters
      return key.replace(/[^a-zA-Z0-9_]/g, '');
    } catch (error) {
      logger.error('Error sanitizing key', error);
      return key;
    }
  }
  
  /**
   * Sanitizes a value
   * @param value Value
   * @returns Sanitized value
   */
  private sanitizeValue(value: any): any {
    try {
      // If the value is a string, sanitize it
      if (typeof value === 'string') {
        // Remove HTML tags
        return value.replace(/<[^>]*>/g, '');
      }
      
      // Return the value
      return value;
    } catch (error) {
      logger.error('Error sanitizing value', error);
      return value;
    }
  }
}

/**
 * Creates a new input validator
 * @param options Input validation options
 * @returns Input validator
 */
export function createInputValidator(options?: InputValidationOptions): InputValidator {
  return new InputValidator(options);
}

/**
 * Common schemas
 */
export const commonSchemas = {
  /**
   * Email schema
   */
  email: {
    type: 'string',
    format: 'email',
  } as JSONSchemaType<string>,
  
  /**
   * Password schema
   */
  password: {
    type: 'string',
    minLength: 8,
    maxLength: 100,
  } as JSONSchemaType<string>,
  
  /**
   * UUID schema
   */
  uuid: {
    type: 'string',
    format: 'uuid',
  } as JSONSchemaType<string>,
  
  /**
   * Date schema
   */
  date: {
    type: 'string',
    format: 'date',
  } as JSONSchemaType<string>,
  
  /**
   * Date-time schema
   */
  dateTime: {
    type: 'string',
    format: 'date-time',
  } as JSONSchemaType<string>,
  
  /**
   * URL schema
   */
  url: {
    type: 'string',
    format: 'uri',
  } as JSONSchemaType<string>,
  
  /**
   * IP address schema
   */
  ipAddress: {
    type: 'string',
    format: 'ipv4',
  } as JSONSchemaType<string>,
  
  /**
   * Positive integer schema
   */
  positiveInteger: {
    type: 'integer',
    minimum: 1,
  } as JSONSchemaType<number>,
  
  /**
   * Non-negative integer schema
   */
  nonNegativeInteger: {
    type: 'integer',
    minimum: 0,
  } as JSONSchemaType<number>,
  
  /**
   * Positive number schema
   */
  positiveNumber: {
    type: 'number',
    minimum: 0,
    exclusiveMinimum: true,
  } as JSONSchemaType<number>,
  
  /**
   * Non-negative number schema
   */
  nonNegativeNumber: {
    type: 'number',
    minimum: 0,
  } as JSONSchemaType<number>,
};
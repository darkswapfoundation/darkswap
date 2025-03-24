import { useState, useCallback } from 'react';

interface ValidationRule<T> {
  validate: (value: T, formValues?: Record<string, any>) => boolean;
  message: string;
}

interface FieldConfig<T> {
  value: T;
  rules: ValidationRule<T>[];
}

interface FormConfig {
  [key: string]: FieldConfig<any>;
}

interface FormState {
  [key: string]: {
    value: any;
    errors: string[];
    touched: boolean;
    isValid: boolean;
  };
}

interface UseFormValidationReturn {
  formState: FormState;
  isValid: boolean;
  handleChange: (field: string, value: any) => void;
  handleBlur: (field: string) => void;
  validateField: (field: string) => boolean;
  validateForm: () => boolean;
  resetForm: () => void;
  setFieldValue: (field: string, value: any) => void;
  getValues: () => Record<string, any>;
}

/**
 * Custom hook for form validation
 * @param config - Form configuration
 * @returns Form validation state and methods
 */
export function useFormValidation(config: FormConfig): UseFormValidationReturn {
  // Initialize form state
  const initialState: FormState = Object.keys(config).reduce(
    (acc, field) => ({
      ...acc,
      [field]: {
        value: config[field].value,
        errors: [],
        touched: false,
        isValid: true,
      },
    }),
    {}
  );

  const [formState, setFormState] = useState<FormState>(initialState);

  // Validate a single field
  const validateField = useCallback(
    (field: string): boolean => {
      if (!config[field]) return true;

      const fieldConfig = config[field];
      const value = formState[field].value;
      const formValues = getValues();
      
      const errors: string[] = [];
      
      // Check each validation rule
      fieldConfig.rules.forEach((rule) => {
        if (!rule.validate(value, formValues)) {
          errors.push(rule.message);
        }
      });
      
      // Update form state with validation results
      setFormState((prevState) => ({
        ...prevState,
        [field]: {
          ...prevState[field],
          errors,
          isValid: errors.length === 0,
        },
      }));
      
      return errors.length === 0;
    },
    [config, formState]
  );

  // Validate the entire form
  const validateForm = useCallback((): boolean => {
    let isValid = true;
    
    // Validate each field
    Object.keys(config).forEach((field) => {
      const fieldIsValid = validateField(field);
      if (!fieldIsValid) {
        isValid = false;
      }
    });
    
    return isValid;
  }, [config, validateField]);

  // Handle input change
  const handleChange = useCallback(
    (field: string, value: any) => {
      setFormState((prevState) => ({
        ...prevState,
        [field]: {
          ...prevState[field],
          value,
        },
      }));
      
      // Validate field if it's already been touched
      if (formState[field].touched) {
        validateField(field);
      }
    },
    [formState, validateField]
  );

  // Handle input blur
  const handleBlur = useCallback(
    (field: string) => {
      setFormState((prevState) => ({
        ...prevState,
        [field]: {
          ...prevState[field],
          touched: true,
        },
      }));
      
      validateField(field);
    },
    [validateField]
  );

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setFormState(initialState);
  }, [initialState]);

  // Set field value directly
  const setFieldValue = useCallback(
    (field: string, value: any) => {
      setFormState((prevState) => ({
        ...prevState,
        [field]: {
          ...prevState[field],
          value,
        },
      }));
    },
    []
  );

  // Get all form values
  const getValues = useCallback((): Record<string, any> => {
    return Object.keys(formState).reduce(
      (acc, field) => ({
        ...acc,
        [field]: formState[field].value,
      }),
      {}
    );
  }, [formState]);

  // Check if the entire form is valid
  const isValid = Object.keys(formState).every(
    (field) => formState[field].isValid
  );

  return {
    formState,
    isValid,
    handleChange,
    handleBlur,
    validateField,
    validateForm,
    resetForm,
    setFieldValue,
    getValues,
  };
}

// Common validation rules
export const validationRules = {
  required: (message = 'This field is required'): ValidationRule<any> => ({
    validate: (value) => {
      if (value === null || value === undefined) return false;
      if (typeof value === 'string') return value.trim() !== '';
      if (typeof value === 'number') return true;
      if (Array.isArray(value)) return value.length > 0;
      return !!value;
    },
    message,
  }),
  
  min: (min: number, message = `Value must be at least ${min}`): ValidationRule<number> => ({
    validate: (value) => Number(value) >= min,
    message,
  }),
  
  max: (max: number, message = `Value must be at most ${max}`): ValidationRule<number> => ({
    validate: (value) => Number(value) <= max,
    message,
  }),
  
  minLength: (min: number, message = `Must be at least ${min} characters`): ValidationRule<string> => ({
    validate: (value) => value.length >= min,
    message,
  }),
  
  maxLength: (max: number, message = `Must be at most ${max} characters`): ValidationRule<string> => ({
    validate: (value) => value.length <= max,
    message,
  }),
  
  pattern: (regex: RegExp, message = 'Invalid format'): ValidationRule<string> => ({
    validate: (value) => regex.test(value),
    message,
  }),
  
  email: (message = 'Invalid email address'): ValidationRule<string> => ({
    validate: (value) => /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value),
    message,
  }),
  
  match: (field: string, message = 'Fields do not match'): ValidationRule<any> => ({
    validate: (value, formValues) => {
      // Ensure we always return a boolean
      if (!formValues) return false;
      return value === formValues[field];
    },
    message,
  }),
};
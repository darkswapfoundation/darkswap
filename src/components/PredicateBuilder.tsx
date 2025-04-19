import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  FormControl, 
  FormLabel, 
  Input, 
  Select, 
  Stack, 
  Heading, 
  Text, 
  Flex, 
  IconButton,
  useToast,
  Divider,
  Badge,
  Tooltip,
  FormErrorMessage,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Code,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Checkbox
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, CheckIcon, TimeIcon, LockIcon, ViewIcon } from '@chakra-ui/icons';
import { useSDK } from '../contexts/SDKContext';

// Predicate types
enum PredicateType {
  Equality = 'equality',
  TimeLocked = 'timeLocked',
  MultiSignature = 'multiSignature',
  Composite = 'composite'
}

// Time constraint types
enum TimeConstraintType {
  Before = 'before',
  After = 'after',
  Between = 'between'
}

// Logical operators
enum LogicalOperator {
  And = 'and',
  Or = 'or'
}

// Predicate interface
interface Predicate {
  id: string;
  type: PredicateType;
  name: string;
  description: string;
}

// Equality predicate
interface EqualityPredicate extends Predicate {
  leftAlkaneId: string;
  leftAmount: number;
  rightAlkaneId: string;
  rightAmount: number;
}

// Time-locked predicate
interface TimeLockedPredicate extends Predicate {
  alkaneId: string;
  amount: number;
  constraintType: TimeConstraintType;
  timestamp1: number;
  timestamp2?: number;
}

// Multi-signature predicate
interface MultiSignaturePredicate extends Predicate {
  alkaneId: string;
  amount: number;
  publicKeys: string[];
  requiredSignatures: number;
}

// Composite predicate
interface CompositePredicate extends Predicate {
  operator: LogicalOperator;
  predicates: string[]; // IDs of child predicates
}

// Props for the PredicateBuilder component
interface PredicateBuilderProps {
  onSave?: (predicate: Predicate) => void;
  initialPredicate?: Predicate;
}

// PredicateBuilder component
const PredicateBuilder: React.FC<PredicateBuilderProps> = ({ onSave, initialPredicate }) => {
  // Get the SDK context
  const { darkswap } = useSDK();
  
  // Toast for notifications
  const toast = useToast();
  
  // Modal for predicate preview
  const { isOpen: isPreviewOpen, onOpen: onPreviewOpen, onClose: onPreviewClose } = useDisclosure();
  
  // State for predicates
  const [predicates, setPredicates] = useState<Record<string, Predicate>>({});
  const [previewPredicate, setPreviewPredicate] = useState<Predicate | null>(null);
  
  // State for current predicate being edited
  const [currentPredicateId, setCurrentPredicateId] = useState<string>('');
  
  // Common fields
  const [predicateType, setPredicateType] = useState<PredicateType>(PredicateType.Equality);
  const [predicateName, setPredicateName] = useState<string>('');
  const [predicateDescription, setPredicateDescription] = useState<string>('');
  
  // Equality predicate fields
  const [leftAlkaneId, setLeftAlkaneId] = useState<string>('');
  const [leftAmount, setLeftAmount] = useState<number>(0);
  const [rightAlkaneId, setRightAlkaneId] = useState<string>('');
  const [rightAmount, setRightAmount] = useState<number>(0);
  
  // Time-locked predicate fields
  const [timeAlkaneId, setTimeAlkaneId] = useState<string>('');
  const [timeAmount, setTimeAmount] = useState<number>(0);
  const [constraintType, setConstraintType] = useState<TimeConstraintType>(TimeConstraintType.Before);
  const [timestamp1, setTimestamp1] = useState<number>(Math.floor(Date.now() / 1000) + 3600); // 1 hour from now
  const [timestamp2, setTimestamp2] = useState<number>(Math.floor(Date.now() / 1000) + 7200); // 2 hours from now
  
  // Multi-signature predicate fields
  const [multiSigAlkaneId, setMultiSigAlkaneId] = useState<string>('');
  const [multiSigAmount, setMultiSigAmount] = useState<number>(0);
  const [publicKeys, setPublicKeys] = useState<string[]>(['']);
  const [requiredSignatures, setRequiredSignatures] = useState<number>(1);
  
  // Composite predicate fields
  const [logicalOperator, setLogicalOperator] = useState<LogicalOperator>(LogicalOperator.And);
  const [selectedPredicates, setSelectedPredicates] = useState<string[]>([]);
  
  // Form errors
  const [errors, setErrors] = useState<{
    name: string;
    leftAlkaneId: string;
    leftAmount: string;
    rightAlkaneId: string;
    rightAmount: string;
    timeAlkaneId: string;
    timeAmount: string;
    timestamp1: string;
    timestamp2: string;
    multiSigAlkaneId: string;
    multiSigAmount: string;
    publicKeys: string[];
    requiredSignatures: string;
    selectedPredicates: string;
  }>({
    name: '',
    leftAlkaneId: '',
    leftAmount: '',
    rightAlkaneId: '',
    rightAmount: '',
    timeAlkaneId: '',
    timeAmount: '',
    timestamp1: '',
    timestamp2: '',
    multiSigAlkaneId: '',
    multiSigAmount: '',
    publicKeys: [],
    requiredSignatures: '',
    selectedPredicates: ''
  });
  
  // Load predicates from SDK on mount
  useEffect(() => {
    const loadPredicates = async () => {
      if (darkswap && darkswap.getPredicates) {
        try {
          const loadedPredicates = await darkswap.getPredicates();
          setPredicates(loadedPredicates);
        } catch (error) {
          console.error('Error loading predicates:', error);
        }
      }
    };
    
    loadPredicates();
  }, [darkswap]);
  
  // Load initial predicate if provided
  useEffect(() => {
    if (initialPredicate) {
      loadPredicate(initialPredicate);
    }
  }, [initialPredicate]);
  
  // Generate a unique ID
  const generateId = (): string => {
    return `predicate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };
  
  // Handle predicate type change
  const handlePredicateTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPredicateType(e.target.value as PredicateType);
    
    // Reset errors
    setErrors({
      ...errors,
      leftAlkaneId: '',
      leftAmount: '',
      rightAlkaneId: '',
      rightAmount: '',
      timeAlkaneId: '',
      timeAmount: '',
      timestamp1: '',
      timestamp2: '',
      multiSigAlkaneId: '',
      multiSigAmount: '',
      publicKeys: [],
      requiredSignatures: '',
      selectedPredicates: ''
    });
  };
  
  // Handle constraint type change
  const handleConstraintTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setConstraintType(e.target.value as TimeConstraintType);
    
    // Reset timestamp errors
    setErrors({
      ...errors,
      timestamp1: '',
      timestamp2: ''
    });
  };
  
  // Handle logical operator change
  const handleLogicalOperatorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLogicalOperator(e.target.value as LogicalOperator);
  };
  
  // Add a public key field
  const addPublicKeyField = () => {
    setPublicKeys([...publicKeys, '']);
  };
  
  // Remove a public key field
  const removePublicKeyField = (index: number) => {
    const newPublicKeys = [...publicKeys];
    newPublicKeys.splice(index, 1);
    setPublicKeys(newPublicKeys);
    
    // Remove the corresponding error
    const newErrors = { ...errors };
    if (newErrors.publicKeys && newErrors.publicKeys[index]) {
      newErrors.publicKeys.splice(index, 1);
      setErrors(newErrors);
    }
  };
  
  // Update a public key
  const updatePublicKey = (index: number, value: string) => {
    const newPublicKeys = [...publicKeys];
    newPublicKeys[index] = value;
    setPublicKeys(newPublicKeys);
    
    // Clear the error if the field is not empty
    if (value.trim()) {
      const newErrors = { ...errors };
      if (newErrors.publicKeys) {
        newErrors.publicKeys[index] = '';
        setErrors(newErrors);
      }
    }
  };
  
  // Toggle a predicate selection
  const togglePredicateSelection = (id: string) => {
    const newSelectedPredicates = [...selectedPredicates];
    const index = newSelectedPredicates.indexOf(id);
    
    if (index === -1) {
      newSelectedPredicates.push(id);
    } else {
      newSelectedPredicates.splice(index, 1);
    }
    
    setSelectedPredicates(newSelectedPredicates);
    
    // Clear the error if at least one predicate is selected
    if (newSelectedPredicates.length > 0) {
      setErrors({ ...errors, selectedPredicates: '' });
    }
  };
  
  // Validate the form
  const validateForm = (): boolean => {
    const newErrors = { ...errors };
    let isValid = true;
    
    // Validate common fields
    if (!predicateName.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    }
    
    // Validate specific fields based on predicate type
    switch (predicateType) {
      case PredicateType.Equality:
        if (!leftAlkaneId.trim()) {
          newErrors.leftAlkaneId = 'Left alkane ID is required';
          isValid = false;
        }
        
        if (leftAmount <= 0) {
          newErrors.leftAmount = 'Left amount must be greater than 0';
          isValid = false;
        }
        
        if (!rightAlkaneId.trim()) {
          newErrors.rightAlkaneId = 'Right alkane ID is required';
          isValid = false;
        }
        
        if (rightAmount <= 0) {
          newErrors.rightAmount = 'Right amount must be greater than 0';
          isValid = false;
        }
        break;
        
      case PredicateType.TimeLocked:
        if (!timeAlkaneId.trim()) {
          newErrors.timeAlkaneId = 'Alkane ID is required';
          isValid = false;
        }
        
        if (timeAmount <= 0) {
          newErrors.timeAmount = 'Amount must be greater than 0';
          isValid = false;
        }
        
        if (timestamp1 <= Math.floor(Date.now() / 1000)) {
          newErrors.timestamp1 = 'Timestamp must be in the future';
          isValid = false;
        }
        
        if (constraintType === TimeConstraintType.Between) {
          if (timestamp2 <= timestamp1) {
            newErrors.timestamp2 = 'End timestamp must be after start timestamp';
            isValid = false;
          }
        }
        break;
        
      case PredicateType.MultiSignature:
        if (!multiSigAlkaneId.trim()) {
          newErrors.multiSigAlkaneId = 'Alkane ID is required';
          isValid = false;
        }
        
        if (multiSigAmount <= 0) {
          newErrors.multiSigAmount = 'Amount must be greater than 0';
          isValid = false;
        }
        
        const validPublicKeys = publicKeys.filter(pk => pk.trim() !== '');
        if (validPublicKeys.length === 0) {
          newErrors.publicKeys = ['At least one public key is required'];
          isValid = false;
        } else {
          newErrors.publicKeys = publicKeys.map(pk => pk.trim() === '' ? 'Public key is required' : '');
          if (newErrors.publicKeys.some(err => err !== '')) {
            isValid = false;
          }
        }
        
        if (requiredSignatures <= 0 || requiredSignatures > validPublicKeys.length) {
          newErrors.requiredSignatures = `Required signatures must be between 1 and ${validPublicKeys.length}`;
          isValid = false;
        }
        break;
        
      case PredicateType.Composite:
        if (selectedPredicates.length < 2) {
          newErrors.selectedPredicates = 'At least two predicates must be selected';
          isValid = false;
        }
        break;
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  // Preview the predicate
  const previewPredicate = () => {
    const predicate = createPredicateObject();
    setPreviewPredicate(predicate);
    onPreviewOpen();
  };
  
  // Create a predicate object based on the form values
  const createPredicateObject = (): Predicate => {
    const id = currentPredicateId || generateId();
    
    switch (predicateType) {
      case PredicateType.Equality:
        return {
          id,
          type: PredicateType.Equality,
          name: predicateName || `Equality Predicate`,
          description: predicateDescription || `${leftAlkaneId}:${leftAmount} = ${rightAlkaneId}:${rightAmount}`,
          leftAlkaneId,
          leftAmount,
          rightAlkaneId,
          rightAmount
        } as EqualityPredicate;
        
      case PredicateType.TimeLocked:
        return {
          id,
          type: PredicateType.TimeLocked,
          name: predicateName || `Time-Locked Predicate`,
          description: predicateDescription || `${timeAlkaneId}:${timeAmount} ${constraintType} ${timestamp1}${constraintType === TimeConstraintType.Between ? `-${timestamp2}` : ''}`,
          alkaneId: timeAlkaneId,
          amount: timeAmount,
          constraintType,
          timestamp1,
          timestamp2: constraintType === TimeConstraintType.Between ? timestamp2 : undefined
        } as TimeLockedPredicate;
        
      case PredicateType.MultiSignature:
        return {
          id,
          type: PredicateType.MultiSignature,
          name: predicateName || `Multi-Signature Predicate`,

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
  useDisclosure
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

// Form validation interface
interface FormValidation {
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
}

/**
 * PredicateBuilder component for creating and editing predicates
 */
const PredicateBuilder: React.FC<PredicateBuilderProps> = ({ onSave, initialPredicate }) => {
  const { darkswap } = useSDK();
  const toast = useToast();
  const { isOpen: isPreviewOpen, onOpen: onPreviewOpen, onClose: onPreviewClose } = useDisclosure();
  
  // State for all predicates
  const [predicates, setPredicates] = useState<Record<string, Predicate>>({});
  
  // State for the current predicate being edited
  const [currentPredicateId, setCurrentPredicateId] = useState<string>('');
  const [predicateType, setPredicateType] = useState<PredicateType>(PredicateType.Equality);
  const [predicateName, setPredicateName] = useState<string>('');
  const [predicateDescription, setPredicateDescription] = useState<string>('');
  
  // Equality predicate state
  const [leftAlkaneId, setLeftAlkaneId] = useState<string>('');
  const [leftAmount, setLeftAmount] = useState<number>(0);
  const [rightAlkaneId, setRightAlkaneId] = useState<string>('');
  const [rightAmount, setRightAmount] = useState<number>(0);
  
  // Time-locked predicate state
  const [timeAlkaneId, setTimeAlkaneId] = useState<string>('');
  const [timeAmount, setTimeAmount] = useState<number>(0);
  const [constraintType, setConstraintType] = useState<TimeConstraintType>(TimeConstraintType.Before);
  const [timestamp1, setTimestamp1] = useState<number>(Math.floor(Date.now() / 1000) + 3600); // 1 hour from now
  const [timestamp2, setTimestamp2] = useState<number>(Math.floor(Date.now() / 1000) + 7200); // 2 hours from now
  
  // Multi-signature predicate state
  const [multiSigAlkaneId, setMultiSigAlkaneId] = useState<string>('');
  const [multiSigAmount, setMultiSigAmount] = useState<number>(0);
  const [publicKeys, setPublicKeys] = useState<string[]>(['']);
  const [requiredSignatures, setRequiredSignatures] = useState<number>(1);
  
  // Composite predicate state
  const [logicalOperator, setLogicalOperator] = useState<LogicalOperator>(LogicalOperator.And);
  const [selectedPredicates, setSelectedPredicates] = useState<string[]>([]);
  
  // Validation state
  const [errors, setErrors] = useState<FormValidation>({
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
  
  // Preview state
  const [previewPredicate, setPreviewPredicate] = useState<Predicate | null>(null);
  
  // Initialize with initial predicate if provided
  useEffect(() => {
    if (initialPredicate) {
      setCurrentPredicateId(initialPredicate.id);
      setPredicateType(initialPredicate.type);
      setPredicateName(initialPredicate.name);
      setPredicateDescription(initialPredicate.description);
      
      // Set specific fields based on predicate type
      switch (initialPredicate.type) {
        case PredicateType.Equality:
          const equalityPredicate = initialPredicate as EqualityPredicate;
          setLeftAlkaneId(equalityPredicate.leftAlkaneId);
          setLeftAmount(equalityPredicate.leftAmount);
          setRightAlkaneId(equalityPredicate.rightAlkaneId);
          setRightAmount(equalityPredicate.rightAmount);
          break;
          
        case PredicateType.TimeLocked:
          const timeLockedPredicate = initialPredicate as TimeLockedPredicate;
          setTimeAlkaneId(timeLockedPredicate.alkaneId);
          setTimeAmount(timeLockedPredicate.amount);
          setConstraintType(timeLockedPredicate.constraintType);
          setTimestamp1(timeLockedPredicate.timestamp1);
          if (timeLockedPredicate.timestamp2) {
            setTimestamp2(timeLockedPredicate.timestamp2);
          }
          break;
          
        case PredicateType.MultiSignature:
          const multiSigPredicate = initialPredicate as MultiSignaturePredicate;
          setMultiSigAlkaneId(multiSigPredicate.alkaneId);
          setMultiSigAmount(multiSigPredicate.amount);
          setPublicKeys(multiSigPredicate.publicKeys);
          setRequiredSignatures(multiSigPredicate.requiredSignatures);
          break;
          
        case PredicateType.Composite:
          const compositePredicate = initialPredicate as CompositePredicate;
          setLogicalOperator(compositePredicate.operator);
          setSelectedPredicates(compositePredicate.predicates);
          break;
      }
      
      // Add the initial predicate to the predicates state
      setPredicates(prev => ({
        ...prev,
        [initialPredicate.id]: initialPredicate
      }));
    }
  }, [initialPredicate]);
  
  // Load saved predicates from SDK
  useEffect(() => {
    const loadPredicates = async () => {
      try {
        if (darkswap && darkswap.getPredicates) {
          const savedPredicates = await darkswap.getPredicates();
          setPredicates(savedPredicates);
        }
      } catch (error) {
        console.error('Failed to load predicates:', error);
      }
    };
    
    loadPredicates();
  }, [darkswap]);
  
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
  const addPublicKey = () => {
    setPublicKeys([...publicKeys, '']);
  };
  
  // Remove a public key field
  const removePublicKey = (index: number) => {
    const newPublicKeys = [...publicKeys];
    newPublicKeys.splice(index, 1);
    setPublicKeys(newPublicKeys);
    
    // Update validation
    const newErrors = [...errors.publicKeys];
    newErrors.splice(index, 1);
    setErrors({
      ...errors,
      publicKeys: newErrors
    });
  };
  
  // Update a public key
  const updatePublicKey = (index: number, value: string) => {
    const newPublicKeys = [...publicKeys];
    newPublicKeys[index] = value;
    setPublicKeys(newPublicKeys);
    
    // Validate public key
    const newErrors = [...errors.publicKeys];
    if (!value.trim()) {
      newErrors[index] = 'Public key is required';
    } else if (!/^[0-9a-fA-F]{66}$/.test(value)) {
      newErrors[index] = 'Invalid public key format';
    } else {
      newErrors[index] = '';
    }
    
    setErrors({
      ...errors,
      publicKeys: newErrors
    });
  };
  
  // Toggle a predicate selection for composite predicates
  const togglePredicateSelection = (id: string) => {
    if (selectedPredicates.includes(id)) {
      setSelectedPredicates(selectedPredicates.filter(p => p !== id));
    } else {
      setSelectedPredicates([...selectedPredicates, id]);
    }
    
    // Reset error
    setErrors({
      ...errors,
      selectedPredicates: ''
    });
  };
  
  // Validate the form
  const validateForm = (): boolean => {
    const newErrors: FormValidation = {
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
    };
    
    let isValid = true;
    
    // Validate name
    if (!predicateName.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    }
    
    // Validate based on predicate type
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
          newErrors.publicKeys = publicKeys.map(pk => {
            if (!pk.trim()) {
              isValid = false;
              return 'Public key is required';
            } else if (!/^[0-9a-fA-F]{66}$/.test(pk)) {
              isValid = false;
              return 'Invalid public key format';
            }
            return '';
          });
        }
        
        if (requiredSignatures < 1 || requiredSignatures > validPublicKeys.length) {
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
          description: predicateDescription || `${multiSigAlkaneId}:${multiSigAmount} requires ${requiredSignatures} of ${publicKeys.length} signatures`,
          alkaneId: multiSigAlkaneId,
          amount: multiSigAmount,
          publicKeys: publicKeys.filter(pk => pk.trim() !== ''),
          requiredSignatures
        } as MultiSignaturePredicate;
        
      case PredicateType.Composite:
        return {
          id,
          type: PredicateType.Composite,
          name: predicateName || `Composite Predicate (${logicalOperator})`,
          description: predicateDescription || `${selectedPredicates.length} predicates combined with ${logicalOperator}`,
          operator: logicalOperator,
          predicates: selectedPredicates
        } as CompositePredicate;
        
      default:
        throw new Error(`Unsupported predicate type: ${predicateType}`);
    }
  };
  
  // Create a new predicate
  const createPredicate = async () => {
    // Validate form
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    try {
      const newPredicate = createPredicateObject();
      
      // Save predicate using SDK if available
      if (darkswap && darkswap.createPredicate) {
        await darkswap.createPredicate(newPredicate);
      }
      
      // Add the new predicate to the state
      setPredicates({
        ...predicates,
        [newPredicate.id]: newPredicate
      });
      
      // Reset the form
      resetForm();
      
      // Call the onSave callback if provided
      if (onSave) {
        onSave(newPredicate);
      }
      
      // Show success toast
      toast({
        title: "Predicate created",
        description: `${newPredicate.name} has been created successfully.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error creating predicate:', error);
      toast({
        title: "Error creating predicate",
        description: error instanceof Error ? error.message : 'Unknown error',
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Reset the form
  const resetForm = () => {
    setCurrentPredicateId('');
    setPredicateName('');
    setPredicateDescription('');
    
    // Reset equality predicate fields
    setLeftAlkaneId('');
    setLeftAmount(0);
    setRightAlkaneId('');
    setRightAmount(0);
    
    // Reset time-locked predicate fields
    setTimeAlkaneId('');
    setTimeAmount(0);
    setConstraintType(TimeConstraintType.Before);
    setTimestamp1(Math.floor(Date.now() / 1000) + 3600);
    setTimestamp2(Math.floor(Date.now() / 1000) + 7200);
    
    // Reset multi-signature predicate fields
    setMultiSigAlkaneId('');
    setMultiSigAmount(0);
    setPublicKeys(['']);
    setRequiredSignatures(1);
    
    // Reset composite predicate fields
    setLogicalOperator(LogicalOperator.And);
    setSelectedPredicates([]);
    
    // Reset errors
    setErrors({
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
  };
  
  // Load a predicate for editing
  const loadPredicate = (predicate: Predicate) => {
    setCurrentPredicateId(predicate.id);
    setPredicateType(predicate.type);
    setPredicateName(predicate.name);
    setPredicateDescription(predicate.description);
    
    // Set specific fields based on predicate type
    switch (predicate.type) {
      case PredicateType.Equality:
        const equalityPredicate = predicate as EqualityPredicate;
        setLeftAlkaneId(equalityPredicate.leftAlkaneId);
        setLeftAmount(equalityPredicate.leftAmount);
        setRightAlkaneId(equalityPredicate.rightAlkaneId);
        setRightAmount(equalityPredicate.rightAmount);
        break;
        
      case PredicateType.TimeLocked:
        const timeLockedPredicate = predicate as TimeLockedPredicate;
        setTimeAlkaneId(timeLockedPredicate.alkaneId);
        setTimeAmount(timeLockedPredicate.amount);
        setConstraintType(timeLockedPredicate.constraintType);
        setTimestamp1(timeLockedPredicate.timestamp1);
        if (timeLockedPredicate.timestamp2) {
          setTimestamp2(timeLockedPredicate.timestamp2);
        }
        break;
        
      case PredicateType.MultiSignature:
        const multiSigPredicate = predicate as MultiSignaturePredicate;
        setMultiSigAlkaneId(multiSigPredicate.alkaneId);
        setMultiSigAmount(multiSigPredicate.amount);
        setPublicKeys(multiSigPredicate.publicKeys);
        setRequiredSignatures(multiSigPredicate.requiredSignatures);
        break;
        
      case PredicateType.Composite:
        const compositePredicate = predicate as CompositePredicate;
        setLogicalOperator(compositePredicate.operator);
        setSelectedPredicates(compositePredicate.predicates);
        break;
    }
    
    // Reset errors
    setErrors({
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
    
    // Scroll to top of form
    window.scrollTo(0, 0);
  };
  
  // Delete a predicate
  const deletePredicate = async (id: string) => {
    try {
      // Delete predicate using SDK if available
      if (darkswap && darkswap.deletePredicate) {
        await darkswap.deletePredicate(id);
      }
      
      // Remove from state
      const newPredicates = { ...predicates };
      delete newPredicates[id];
      setPredicates(newPredicates);
      
      // Show success toast
      toast({
        title: "Predicate deleted",
        description: `Predicate has been deleted successfully.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting predicate:', error);
      toast({
        title: "Error deleting predicate",
        description: error instanceof Error ? error.message : 'Unknown error',
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Render the form based on the selected predicate type
  const renderPredicateForm = () => {
    switch (predicateType) {
      case PredicateType.Equality:
        return (
          <Stack spacing={4}>
            <FormControl isRequired isInvalid={!!errors.leftAlkaneId}>
              <FormLabel>Left Alkane ID</FormLabel>
              <Input 
                value={leftAlkaneId} 
                onChange={(e) => {
                  setLeftAlkaneId(e.target.value);
                  if (e.target.value.trim()) {
                    setErrors({ ...errors, leftAlkaneId: '' });
                  }
                }} 
                placeholder="Enter left alkane ID" 
              />
              {errors.leftAlkaneId && <FormErrorMessage>{errors.leftAlkaneId}</FormErrorMessage>}
            </FormControl>
            
            <FormControl isRequired isInvalid={!!errors.leftAmount}>
              <FormLabel>Left Amount</FormLabel>
              <Input 
                type="number" 
                value={leftAmount} 
                onChange={(e) => {
                  setLeftAmount(Number(e.target.value));
                  if (Number(e.target.value) > 0) {
                    setErrors({ ...errors, leftAmount: '' });
                  }
                }} 
                placeholder="Enter left amount" 
              />
              {errors.leftAmount && <FormErrorMessage>{errors.leftAmount}</FormErrorMessage>}
            </FormControl>
            
            <FormControl isRequired isInvalid={!!errors.rightAlkaneId}>
              <FormLabel>Right Alkane ID</FormLabel>
              <Input 
                value={rightAlkaneId} 
                onChange={(e) => {
                  setRightAlkaneId(e.target.value);
                  if (e.target.value.trim()) {
                    setErrors({ ...errors, rightAlkaneId: '' });
                  }
                }} 
                placeholder="Enter right alkane ID" 
              />
              {errors.rightAlkaneId && <FormErrorMessage>{errors.rightAlkaneId}</FormErrorMessage>}
            </FormControl>
            
            <FormControl isRequired isInvalid={!!errors.rightAmount}>
              <FormLabel>Right Amount</FormLabel>
              <Input 
                type="number" 
                value={rightAmount} 
                onChange={(e) => {
                  setRightAmount(Number(e.target.value));
                  if (Number(e.target.value) > 0) {
                    setErrors({ ...errors, rightAmount: '' });
                  }
                }} 
                placeholder="Enter right amount" 
              />
              {errors.rightAmount && <FormErrorMessage>{errors.rightAmount}</FormErrorMessage>}
            </FormControl>
          </Stack>
        );
        
      case PredicateType.TimeLocked:
        return (
          <Stack spacing={4}>
            <FormControl isRequired isInvalid={!!errors.timeAlkaneId}>
              <FormLabel>Alkane ID</FormLabel>
              <Input 
                value={timeAlkaneId} 
                onChange={(e) => {
                  setTimeAlkaneId(e.target.value);
                  if (e.target.value.trim()) {
                    setErrors({ ...errors, timeAlkaneId: '' });
                  }
                }} 
                placeholder="Enter alkane ID" 
              />
              {errors.timeAlkaneId && <FormErrorMessage>{errors.timeAlkaneId}</FormErrorMessage>}
            </FormControl>
            
            <FormControl isRequired isInvalid={!!errors.timeAmount}>
              <FormLabel>Amount</FormLabel>
              <Input 
                type="number" 
                value={timeAmount} 
                onChange={(e) => {
                  setTimeAmount(Number(e.target.value));
                  if (Number(e.target.value) > 0) {
                    setErrors({ ...errors, timeAmount: '' });
                  }
                }} 
                placeholder="Enter amount" 
              />
              {errors.timeAmount && <FormErrorMessage>{errors.timeAmount}</FormErrorMessage>}
            </FormControl>
            
            <FormControl isRequired>
              <FormLabel>Constraint Type</FormLabel>
              <Select value={constraintType} onChange={handleConstraintTypeChange}>
                <option value={TimeConstraintType.Before}>Before</option>
                <option value={TimeConstraintType.After}>After</option>
                <option value={TimeConstraintType.Between}>Between</option>
              </Select>
            </FormControl>
            
            <FormControl isRequired isInvalid={!!errors.timestamp1}>
              <FormLabel>{constraintType === TimeConstraintType.After ? 'After Timestamp' : 'Before Timestamp'}</FormLabel>
              <Input 
                type="datetime-local" 
                value={new Date(timestamp1 * 1000).toISOString().slice(0, 16)} 
                onChange={(e) => {
                  const newTimestamp = Math.floor(new Date(e.target.value).getTime() / 1000);
                  setTimestamp1(newTimestamp);
                  if (newTimestamp > Math.floor(Date.now() / 1000)) {
                    setErrors({ ...errors, timestamp1: '' });
                  }
                }} 
              />
              {errors.timestamp1 && <FormErrorMessage>{errors.timestamp1}</FormErrorMessage>}
            </FormControl>
            
            {constraintType === TimeConstraintType.Between && (

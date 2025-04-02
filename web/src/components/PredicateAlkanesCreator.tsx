import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  FormHelperText,
  Grid,
  Divider,
  Chip,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  Tooltip
} from '@mui/material';
import { useTheme } from '../contexts/ThemeContext';
import { useApi } from '../contexts/ApiContext';
import { useNotification } from '../contexts/NotificationContext';
import InfoIcon from '@mui/icons-material/Info';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

// Predicate types
type PredicateType = 'equality' | 'time-locked' | 'multi-signature' | 'composite';

// Condition types
type ConditionType = 'equals' | 'not-equals' | 'greater-than' | 'less-than' | 'greater-than-or-equals' | 'less-than-or-equals';

// Variable types
type VariableType = 'price' | 'time' | 'block-height' | 'volume' | 'custom';

interface PredicateParameter {
  variable: string;
  condition: ConditionType;
  value: string;
}

interface PredicateInfo {
  name: string;
  type: PredicateType;
  description: string;
  parameters: PredicateParameter[] | Record<string, any>;
}

/**
 * PredicateAlkanesCreator Component
 * 
 * This component allows users to create predicate alkanes for conditional trading.
 */
const PredicateAlkanesCreator: React.FC = () => {
  const { isDarkMode } = useTheme();
  const { client } = useApi();
  const { addNotification } = useNotification();
  
  // State for the stepper
  const [activeStep, setActiveStep] = useState(0);
  const steps = ['Select Predicate Type', 'Configure Parameters', 'Review & Create'];
  
  // State for the predicate
  const [predicateType, setPredicateType] = useState<PredicateType>('equality');
  const [predicateName, setPredicateName] = useState('');
  const [predicateDescription, setPredicateDescription] = useState('');
  const [parameters, setParameters] = useState<PredicateParameter[]>([
    { variable: 'price', condition: 'greater-than', value: '' }
  ]);
  
  // State for multi-signature predicate
  const [requiredSignatures, setRequiredSignatures] = useState(2);
  const [publicKeys, setPublicKeys] = useState<string[]>(['', '']);
  
  // State for time-locked predicate
  const [unlockTime, setUnlockTime] = useState('');
  const [blockHeight, setBlockHeight] = useState('');
  
  // State for composite predicate
  const [operator, setOperator] = useState<'and' | 'or'>('and');
  const [subPredicates, setSubPredicates] = useState<PredicateInfo[]>([]);
  
  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Handle next step
  const handleNext = () => {
    if (activeStep === 0) {
      // Validate predicate type selection
      if (!predicateType) {
        addNotification('error', 'Please select a predicate type');
        return;
      }
    } else if (activeStep === 1) {
      // Validate parameters based on predicate type
      if (predicateType === 'equality') {
        // Validate equality parameters
        if (parameters.some(p => !p.variable || !p.condition || !p.value)) {
          addNotification('error', 'Please fill in all parameter fields');
          return;
        }
      } else if (predicateType === 'time-locked') {
        // Validate time-locked parameters
        if ((!unlockTime && !blockHeight) || !predicateName) {
          addNotification('error', 'Please provide either unlock time or block height, and a name');
          return;
        }
      } else if (predicateType === 'multi-signature') {
        // Validate multi-signature parameters
        if (publicKeys.some(key => !key) || requiredSignatures <= 0 || requiredSignatures > publicKeys.length) {
          addNotification('error', 'Please provide all public keys and a valid number of required signatures');
          return;
        }
      } else if (predicateType === 'composite') {
        // Validate composite parameters
        if (subPredicates.length < 2) {
          addNotification('error', 'Please add at least two sub-predicates');
          return;
        }
      }
      
      // Validate common fields
      if (!predicateName) {
        addNotification('error', 'Please provide a name for the predicate');
        return;
      }
    }
    
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };
  
  // Handle back step
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };
  
  // Handle predicate type change
  const handlePredicateTypeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setPredicateType(event.target.value as PredicateType);
    
    // Reset parameters based on predicate type
    if (event.target.value === 'equality') {
      setParameters([{ variable: 'price', condition: 'greater-than', value: '' }]);
    } else if (event.target.value === 'time-locked') {
      setUnlockTime('');
      setBlockHeight('');
    } else if (event.target.value === 'multi-signature') {
      setRequiredSignatures(2);
      setPublicKeys(['', '']);
    } else if (event.target.value === 'composite') {
      setOperator('and');
      setSubPredicates([]);
    }
  };
  
  // Handle parameter change
  const handleParameterChange = (index: number, field: keyof PredicateParameter, value: string) => {
    const newParameters = [...parameters];
    newParameters[index] = { ...newParameters[index], [field]: value };
    setParameters(newParameters);
  };
  
  // Add parameter
  const handleAddParameter = () => {
    setParameters([...parameters, { variable: 'price', condition: 'equals', value: '' }]);
  };
  
  // Remove parameter
  const handleRemoveParameter = (index: number) => {
    const newParameters = [...parameters];
    newParameters.splice(index, 1);
    setParameters(newParameters);
  };
  
  // Handle public key change
  const handlePublicKeyChange = (index: number, value: string) => {
    const newPublicKeys = [...publicKeys];
    newPublicKeys[index] = value;
    setPublicKeys(newPublicKeys);
  };
  
  // Add public key
  const handleAddPublicKey = () => {
    setPublicKeys([...publicKeys, '']);
  };
  
  // Remove public key
  const handleRemovePublicKey = (index: number) => {
    const newPublicKeys = [...publicKeys];
    newPublicKeys.splice(index, 1);
    setPublicKeys(newPublicKeys);
    
    // Adjust required signatures if needed
    if (requiredSignatures > newPublicKeys.length) {
      setRequiredSignatures(newPublicKeys.length);
    }
  };
  
  // Create predicate
  const handleCreatePredicate = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Build predicate info based on type
      let predicateInfo: PredicateInfo;
      
      if (predicateType === 'equality') {
        predicateInfo = {
          name: predicateName,
          type: predicateType,
          description: predicateDescription,
          parameters: parameters,
        };
      } else if (predicateType === 'time-locked') {
        predicateInfo = {
          name: predicateName,
          type: predicateType,
          description: predicateDescription,
          parameters: {
            unlockTime: unlockTime || undefined,
            blockHeight: blockHeight || undefined,
          },
        };
      } else if (predicateType === 'multi-signature') {
        predicateInfo = {
          name: predicateName,
          type: predicateType,
          description: predicateDescription,
          parameters: {
            requiredSignatures,
            publicKeys,
          },
        };
      } else {
        // Composite predicate
        predicateInfo = {
          name: predicateName,
          type: predicateType,
          description: predicateDescription,
          parameters: {
            operator,
            predicates: subPredicates,
          },
        };
      }
      
      // Call API to create predicate
      const response = await client.createPredicate(
        predicateInfo.name,
        predicateInfo.type,
        predicateInfo.description,
        predicateInfo.parameters
      );
      
      if (response.error) {
        setError(`Failed to create predicate: ${response.error}`);
        addNotification('error', `Failed to create predicate: ${response.error}`);
      } else {
        setSuccess(`Predicate created successfully with ID: ${response.data?.id}`);
        addNotification('success', 'Predicate created successfully');
        
        // Reset form
        setPredicateType('equality');
        setPredicateName('');
        setPredicateDescription('');
        setParameters([{ variable: 'price', condition: 'greater-than', value: '' }]);
        setActiveStep(0);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to create predicate: ${errorMessage}`);
      addNotification('error', `Failed to create predicate: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Render predicate type selection
  const renderPredicateTypeSelection = () => {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Select Predicate Type
        </Typography>
        
        <Typography variant="body2" color="textSecondary" paragraph>
          Predicate alkanes allow you to create conditional orders that execute only when specific conditions are met.
        </Typography>
        
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="predicate-type-label">Predicate Type</InputLabel>
          <Select
            labelId="predicate-type-label"
            id="predicate-type"
            value={predicateType}
            onChange={handlePredicateTypeChange}
            label="Predicate Type"
          >
            <MenuItem value="equality">
              Equality Predicate
              <Typography variant="caption" display="block" color="textSecondary">
                Execute when a condition is met (e.g., price {'>'} $20,000)
              </Typography>
            </MenuItem>
            <MenuItem value="time-locked">
              Time-Locked Predicate
              <Typography variant="caption" display="block" color="textSecondary">
                Execute after a specific time or block height
              </Typography>
            </MenuItem>
            <MenuItem value="multi-signature">
              Multi-Signature Predicate
              <Typography variant="caption" display="block" color="textSecondary">
                Execute when a threshold of signatures is reached
              </Typography>
            </MenuItem>
            <MenuItem value="composite">
              Composite Predicate
              <Typography variant="caption" display="block" color="textSecondary">
                Combine multiple predicates with logical operators
              </Typography>
            </MenuItem>
          </Select>
          <FormHelperText>
            Select the type of predicate you want to create
          </FormHelperText>
        </FormControl>
        
        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Predicate Name"
            value={predicateName}
            onChange={(e) => setPredicateName(e.target.value)}
            margin="normal"
            helperText="A descriptive name for your predicate"
          />
          
          <TextField
            fullWidth
            label="Description (Optional)"
            value={predicateDescription}
            onChange={(e) => setPredicateDescription(e.target.value)}
            margin="normal"
            multiline
            rows={2}
            helperText="Optional description of what this predicate does"
          />
        </Box>
      </Box>
    );
  };
  
  // Render equality predicate configuration
  const renderEqualityPredicateConfig = () => {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Configure Equality Predicate
        </Typography>
        
        <Typography variant="body2" color="textSecondary" paragraph>
          Define conditions that must be met for this predicate to be satisfied.
        </Typography>
        
        {parameters.map((param, index) => (
          <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel id={`variable-label-${index}`}>Variable</InputLabel>
                <Select
                  labelId={`variable-label-${index}`}
                  value={param.variable}
                  onChange={(e) => handleParameterChange(index, 'variable', e.target.value)}
                  label="Variable"
                >
                  <MenuItem value="price">Price</MenuItem>
                  <MenuItem value="time">Time</MenuItem>
                  <MenuItem value="block-height">Block Height</MenuItem>
                  <MenuItem value="volume">Volume</MenuItem>
                  <MenuItem value="custom">Custom</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel id={`condition-label-${index}`}>Condition</InputLabel>
                <Select
                  labelId={`condition-label-${index}`}
                  value={param.condition}
                  onChange={(e) => handleParameterChange(index, 'condition', e.target.value as ConditionType)}
                  label="Condition"
                >
                  <MenuItem value="equals">=</MenuItem>
                  <MenuItem value="not-equals">≠</MenuItem>
                  <MenuItem value="greater-than">&gt;</MenuItem>
                  <MenuItem value="less-than">&lt;</MenuItem>
                  <MenuItem value="greater-than-or-equals">≥</MenuItem>
                  <MenuItem value="less-than-or-equals">≤</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Value"
                value={param.value}
                onChange={(e) => handleParameterChange(index, 'value', e.target.value)}
                helperText={param.variable === 'custom' ? 'Enter custom variable value' : `Value for ${param.variable}`}
              />
            </Grid>
            
            <Grid item xs={12} sm={2} sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton 
                color="error" 
                onClick={() => handleRemoveParameter(index)}
                disabled={parameters.length <= 1}
              >
                <DeleteIcon />
              </IconButton>
            </Grid>
          </Grid>
        ))}
        
        <Button
          startIcon={<AddIcon />}
          onClick={handleAddParameter}
          sx={{ mt: 1 }}
        >
          Add Condition
        </Button>
      </Box>
    );
  };
  
  // Render time-locked predicate configuration
  const renderTimeLockedPredicateConfig = () => {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Configure Time-Locked Predicate
        </Typography>
        
        <Typography variant="body2" color="textSecondary" paragraph>
          Define when this predicate will be unlocked. You can specify either a timestamp or a block height.
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Unlock Time (Unix Timestamp)"
              type="number"
              value={unlockTime}
              onChange={(e) => setUnlockTime(e.target.value)}
              helperText="Unix timestamp when this predicate will unlock"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Block Height"
              type="number"
              value={blockHeight}
              onChange={(e) => setBlockHeight(e.target.value)}
              helperText="Bitcoin block height when this predicate will unlock"
            />
          </Grid>
        </Grid>
        
        <Alert severity="info" sx={{ mt: 3 }}>
          You need to provide either an unlock time or a block height, not both.
        </Alert>
      </Box>
    );
  };
  
  // Render multi-signature predicate configuration
  const renderMultiSignaturePredicateConfig = () => {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Configure Multi-Signature Predicate
        </Typography>
        
        <Typography variant="body2" color="textSecondary" paragraph>
          Define the public keys and the number of required signatures for this predicate.
        </Typography>
        
        <TextField
          fullWidth
          label="Required Signatures"
          type="number"
          value={requiredSignatures}
          onChange={(e) => setRequiredSignatures(Math.max(1, Math.min(publicKeys.length, parseInt(e.target.value))))}
          helperText={`Number of signatures required (1-${publicKeys.length})`}
          sx={{ mb: 3 }}
        />
        
        {publicKeys.map((key, index) => (
          <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
            <Grid item xs={10}>
              <TextField
                fullWidth
                label={`Public Key ${index + 1}`}
                value={key}
                onChange={(e) => handlePublicKeyChange(index, e.target.value)}
                helperText="Bitcoin public key in hex format"
              />
            </Grid>
            
            <Grid item xs={2} sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton 
                color="error" 
                onClick={() => handleRemovePublicKey(index)}
                disabled={publicKeys.length <= 2}
              >
                <DeleteIcon />
              </IconButton>
            </Grid>
          </Grid>
        ))}
        
        <Button
          startIcon={<AddIcon />}
          onClick={handleAddPublicKey}
          sx={{ mt: 1 }}
        >
          Add Public Key
        </Button>
      </Box>
    );
  };
  
  // Render composite predicate configuration
  const renderCompositePredicateConfig = () => {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Configure Composite Predicate
        </Typography>
        
        <Typography variant="body2" color="textSecondary" paragraph>
          Combine multiple predicates with logical operators.
        </Typography>
        
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="operator-label">Logical Operator</InputLabel>
          <Select
            labelId="operator-label"
            value={operator}
            onChange={(e) => setOperator(e.target.value as 'and' | 'or')}
            label="Logical Operator"
          >
            <MenuItem value="and">AND (All predicates must be satisfied)</MenuItem>
            <MenuItem value="or">OR (At least one predicate must be satisfied)</MenuItem>
          </Select>
        </FormControl>
        
        <Alert severity="warning" sx={{ mb: 3 }}>
          Composite predicates are advanced and require existing predicates. This feature is not fully implemented in the current version.
        </Alert>
      </Box>
    );
  };
  
  // Render parameter configuration based on predicate type
  const renderParameterConfiguration = () => {
    switch (predicateType) {
      case 'equality':
        return renderEqualityPredicateConfig();
      case 'time-locked':
        return renderTimeLockedPredicateConfig();
      case 'multi-signature':
        return renderMultiSignaturePredicateConfig();
      case 'composite':
        return renderCompositePredicateConfig();
      default:
        return null;
    }
  };
  
  // Render predicate review
  const renderPredicateReview = () => {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Review Predicate
        </Typography>
        
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <Typography variant="subtitle2">Name:</Typography>
            </Grid>
            <Grid item xs={12} sm={9}>
              <Typography>{predicateName}</Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Divider />
            </Grid>
            
            <Grid item xs={12} sm={3}>
              <Typography variant="subtitle2">Type:</Typography>
            </Grid>
            <Grid item xs={12} sm={9}>
              <Chip 
                label={predicateType.charAt(0).toUpperCase() + predicateType.slice(1)} 
                color="primary" 
                size="small" 
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider />
            </Grid>
            
            <Grid item xs={12} sm={3}>
              <Typography variant="subtitle2">Description:</Typography>
            </Grid>
            <Grid item xs={12} sm={9}>
              <Typography>{predicateDescription || 'No description provided'}</Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Divider />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2">Parameters:</Typography>
            </Grid>
            
            <Grid item xs={12}>
              {predicateType === 'equality' && (
                <Box sx={{ pl: 2 }}>
                  {parameters.map((param, index) => (
                    <Typography key={index} sx={{ mb: 1 }}>
                      {param.variable} {renderConditionSymbol(param.condition)} {param.value}
                    </Typography>
                  ))}
                </Box>
              )}
              
              {predicateType === 'time-locked' && (
                <Box sx={{ pl: 2 }}>
                  {unlockTime && (
                    <Typography>
                      Unlock Time: {unlockTime} ({new Date(parseInt(unlockTime) * 1000).toLocaleString()})
                    </Typography>
                  )}
                  {blockHeight && (
                    <Typography>
                      Block Height: {blockHeight}
                    </Typography>
                  )}
                </Box>
              )}
              
              {predicateType === 'multi-signature' && (
                <Box sx={{ pl: 2 }}>
                  <Typography>
                    Required Signatures: {requiredSignatures} of {publicKeys.length}
                  </Typography>
                  {publicKeys.map((key, index) => (
                    <Typography key={index} sx={{ fontSize: '0.8rem', mt: 1 }}>
                      Key {index + 1}: {key.substring(0, 10)}...{key.substring(key.length - 10)}
                    </Typography>
                  ))}
                </Box>
              )}
              
              {predicateType === 'composite' && (
                <Box sx={{ pl: 2 }}>
                  <Typography>
                    Operator: {operator.toUpperCase()}
                  </Typography>
                  <Typography>
                    Sub-predicates: {subPredicates.length}
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        </Paper>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}
      </Box>
    );
  };
  
  // Helper function to render condition symbol
  const renderConditionSymbol = (condition: ConditionType): string => {
    switch (condition) {
      case 'equals':
        return '=';
      case 'not-equals':
        return '≠';
      case 'greater-than':
        return '>';
      case 'less-than':
        return '<';
      case 'greater-than-or-equals':
        return '≥';
      case 'less-than-or-equals':
        return '≤';
      default:
        return condition;
    }
  };
  
  // Render step content
  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return renderPredicateTypeSelection();
      case 1:
        return renderParameterConfiguration();
      case 2:
        return renderPredicateReview();
      default:
        return 'Unknown step';
    }
  };
  
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 3,
        backgroundColor: isDarkMode ? '#1e1e2f' : '#ffffff',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Create Predicate Alkane</Typography>
        <Tooltip title="Predicate alkanes allow you to create conditional orders that execute only when specific conditions are met.">
          <IconButton>
            <HelpOutlineIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      {getStepContent(activeStep)}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
        >
          Back
        </Button>
        
        <Box>
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreatePredicate}
              disabled={isLoading}
              startIcon={isLoading && <CircularProgress size={20} />}
            >
              {isLoading ? 'Creating...' : 'Create Predicate'}
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={handleNext}
            >
              Next
            </Button>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default PredicateAlkanesCreator;
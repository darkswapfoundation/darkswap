import React from 'react';
import {
  Box,
  SimpleGrid,
  Heading,
  Text,
  Button,
  Flex,
  Icon,
  useColorModeValue,
  Badge,
  Tooltip,
} from '@chakra-ui/react';
import { FaExchangeAlt, FaClock, FaUserFriends, FaPuzzlePiece } from 'react-icons/fa';
import { useSDK, Predicate, PredicateType, TimeConstraintType, LogicalOperator } from '../contexts/SDKContext';

interface PredicateTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ElementType;
  createPredicate: () => Partial<Predicate>;
}

interface PredicateTemplatesProps {
  onSelect: (template: Partial<Predicate>) => void;
}

const PredicateTemplates: React.FC<PredicateTemplatesProps> = ({ onSelect }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBgColor = useColorModeValue('gray.50', 'gray.700');
  
  // Define predicate templates
  const templates: PredicateTemplate[] = [
    {
      id: 'simple-swap',
      name: 'Simple Swap',
      description: 'Exchange one alkane for another at a fixed rate',
      category: 'Equality',
      icon: FaExchangeAlt,
      createPredicate: () => ({
        type: PredicateType.Equality,
        name: 'Simple Swap',
        description: 'Exchange one alkane for another at a fixed rate',
        leftAlkaneId: '',
        leftAmount: 100,
        rightAlkaneId: '',
        rightAmount: 100,
      }),
    },
    {
      id: 'time-limited-offer',
      name: 'Time-Limited Offer',
      description: 'Create an offer that expires after a specific time',
      category: 'Time-Locked',
      icon: FaClock,
      createPredicate: () => {
        const deadline = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now
        return {
          type: PredicateType.TimeLocked,
          name: 'Time-Limited Offer',
          description: 'Offer expires after 24 hours',
          alkaneId: '',
          amount: 100,
          constraintType: TimeConstraintType.Before,
          timestamp1: deadline,
        };
      },
    },
    {
      id: 'future-trade',
      name: 'Future Trade',
      description: 'Schedule a trade to be executed after a specific time',
      category: 'Time-Locked',
      icon: FaClock,
      createPredicate: () => {
        const startTime = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now
        return {
          type: PredicateType.TimeLocked,
          name: 'Future Trade',
          description: 'Trade can be executed after 24 hours',
          alkaneId: '',
          amount: 100,
          constraintType: TimeConstraintType.After,
          timestamp1: startTime,
        };
      },
    },
    {
      id: 'time-window',
      name: 'Time Window',
      description: 'Create a trade that can only be executed within a specific time window',
      category: 'Time-Locked',
      icon: FaClock,
      createPredicate: () => {
        const startTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
        const endTime = startTime + 86400; // 24 hours after start time
        return {
          type: PredicateType.TimeLocked,
          name: 'Time Window',
          description: 'Trade can be executed within a 24-hour window',
          alkaneId: '',
          amount: 100,
          constraintType: TimeConstraintType.Between,
          timestamp1: startTime,
          timestamp2: endTime,
        };
      },
    },
    {
      id: 'escrow-2-of-3',
      name: 'Escrow (2-of-3)',
      description: 'Create an escrow that requires 2 out of 3 signatures to release funds',
      category: 'Multi-Signature',
      icon: FaUserFriends,
      createPredicate: () => ({
        type: PredicateType.MultiSignature,
        name: 'Escrow (2-of-3)',
        description: 'Requires 2 out of 3 signatures to release funds',
        alkaneId: '',
        amount: 100,
        publicKeys: ['', '', ''],
        requiredSignatures: 2,
      }),
    },
    {
      id: 'multi-sig-3-of-5',
      name: 'Multi-Sig (3-of-5)',
      description: 'Create a multi-signature predicate that requires 3 out of 5 signatures',
      category: 'Multi-Signature',
      icon: FaUserFriends,
      createPredicate: () => ({
        type: PredicateType.MultiSignature,
        name: 'Multi-Sig (3-of-5)',
        description: 'Requires 3 out of 5 signatures',
        alkaneId: '',
        amount: 100,
        publicKeys: ['', '', '', '', ''],
        requiredSignatures: 3,
      }),
    },
    {
      id: 'time-locked-escrow',
      name: 'Time-Locked Escrow',
      description: 'Combine time constraints with multi-signature requirements',
      category: 'Composite',
      icon: FaPuzzlePiece,
      createPredicate: () => ({
        type: PredicateType.Composite,
        name: 'Time-Locked Escrow',
        description: 'Requires time constraints and multi-signature approval',
        operator: LogicalOperator.And,
        predicates: [],
      }),
    },
    {
      id: 'conditional-swap',
      name: 'Conditional Swap',
      description: 'Swap assets only if certain conditions are met',
      category: 'Composite',
      icon: FaPuzzlePiece,
      createPredicate: () => ({
        type: PredicateType.Composite,
        name: 'Conditional Swap',
        description: 'Swap assets only if certain conditions are met',
        operator: LogicalOperator.And,
        predicates: [],
      }),
    },
  ];
  
  // Group templates by category
  const templatesByCategory: Record<string, PredicateTemplate[]> = templates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, PredicateTemplate[]>);
  
  // Handle template selection
  const handleSelectTemplate = (template: PredicateTemplate) => {
    onSelect(template.createPredicate());
  };
  
  return (
    <Box>
      <Heading size="md" mb={4}>Predicate Templates</Heading>
      
      {Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
        <Box key={category} mb={6}>
          <Heading size="sm" mb={2}>{category} Templates</Heading>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {categoryTemplates.map(template => (
              <Box
                key={template.id}
                p={4}
                borderWidth="1px"
                borderRadius="md"
                borderColor={borderColor}
                bg={bgColor}
                _hover={{ bg: hoverBgColor, cursor: 'pointer' }}
                onClick={() => handleSelectTemplate(template)}
                transition="all 0.2s"
              >
                <Flex align="center" mb={2}>
                  <Icon as={template.icon} mr={2} boxSize={5} />
                  <Heading size="sm">{template.name}</Heading>
                </Flex>
                <Text fontSize="sm" mb={3}>{template.description}</Text>
                <Tooltip label={`${category} predicate template`}>
                  <Badge colorScheme={getCategoryColor(category)}>{category}</Badge>
                </Tooltip>
              </Box>
            ))}
          </SimpleGrid>
        </Box>
      ))}
    </Box>
  );
};

// Helper function to get color scheme based on category
const getCategoryColor = (category: string): string => {
  switch (category) {
    case 'Equality':
      return 'blue';
    case 'Time-Locked':
      return 'purple';
    case 'Multi-Signature':
      return 'green';
    case 'Composite':
      return 'orange';
    default:
      return 'gray';
  }
};

export default PredicateTemplates;
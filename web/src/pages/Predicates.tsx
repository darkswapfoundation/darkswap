import React, { useState } from 'react';
import { 
  Box, 
  Container, 
  Heading, 
  Text, 
  Tabs, 
  TabList, 
  TabPanels, 
  Tab, 
  TabPanel,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider,
  useToast
} from '@chakra-ui/react';
import PredicateBuilder from '../components/PredicateBuilder';
import PredicateTemplates from '../components/PredicateTemplates';
import { useSDK } from '../contexts/SDKContext';

/**
 * Predicates page component
 * This page allows users to create and manage predicate alkanes
 */
const PredicatesPage: React.FC = () => {
  const { darkswap } = useSDK();
  const toast = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  
  // Handle template selection
  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template);
    
    toast({
      title: "Template selected",
      description: `${template.name} template has been selected. You can now customize it in the builder.`,
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };
  
  // Handle predicate creation
  const handlePredicateCreate = (predicate: any) => {
    // In a real implementation, this would create the predicate using the SDK
    console.log('Created predicate:', predicate);
    
    toast({
      title: "Predicate created",
      description: `${predicate.name} has been created successfully.`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };
  
  return (
    <Container maxW="container.xl" py={8}>
      <Heading as="h1" mb={2}>Predicate Alkanes</Heading>
      <Text mb={6} color="gray.600">
        Create and manage predicate alkanes for complex trade conditions
      </Text>
      
      <Alert status="info" mb={6} borderRadius="md">
        <AlertIcon />
        <Box>
          <AlertTitle>What are Predicate Alkanes?</AlertTitle>
          <AlertDescription>
            Predicate alkanes are special alkanes that include conditions that must be satisfied for a transaction to be valid.
            They enable complex trade scenarios like time-locked trades, multi-signature requirements, and atomic swaps.
          </AlertDescription>
        </Box>
      </Alert>
      
      <Tabs variant="enclosed" colorScheme="blue">
        <TabList>
          <Tab>Templates</Tab>
          <Tab>Builder</Tab>
          <Tab>My Predicates</Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel>
            <PredicateTemplates onSelect={handleTemplateSelect} />
          </TabPanel>
          
          <TabPanel>
            <PredicateBuilder 
              onSave={handlePredicateCreate} 
              initialPredicate={selectedTemplate?.createPredicate?.(darkswap)}
            />
          </TabPanel>
          
          <TabPanel>
            <Box p={4} borderWidth={1} borderRadius="lg">
              <Heading size="md" mb={4}>My Predicates</Heading>
              
              <Text color="gray.500">
                Your created predicates will appear here. You can use them in trades and share them with others.
              </Text>
              
              <Divider my={4} />
              
              <Text fontSize="sm" color="gray.500">
                No predicates created yet. Use the Templates or Builder tab to create predicates.
              </Text>
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Container>
  );
};

export default PredicatesPage;
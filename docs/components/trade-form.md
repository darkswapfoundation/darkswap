# TradeForm Component Documentation

## Overview

The `TradeForm` component is a form for creating trade offers in the DarkSwap platform. It allows users to specify the assets they want to trade and the amounts.

## Props

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `onSuccess` | `(offerId: string) => void` | `undefined` | Callback function called when a trade offer is successfully created. |
| `onError` | `(error: Error) => void` | `undefined` | Callback function called when an error occurs while creating a trade offer. |
| `className` | `string` | `''` | Additional CSS class name for the component. |

## Usage

```tsx
import { TradeForm } from '../components/TradeForm';

const MyComponent = () => {
  const handleSuccess = (offerId: string) => {
    console.log(`Trade offer created: ${offerId}`);
  };

  const handleError = (error: Error) => {
    console.error(`Failed to create trade offer: ${error.message}`);
  };

  return (
    <TradeForm
      onSuccess={handleSuccess}
      onError={handleError}
      className="my-trade-form"
    />
  );
};
```

## Component Structure

The `TradeForm` component consists of the following elements:

1. **Form Container**: A container for the form elements.
2. **Form Title**: A title for the form.
3. **Maker Asset Section**: A section for selecting the asset to send and the amount.
4. **Taker Asset Section**: A section for selecting the asset to receive and the amount.
5. **Expiration Section**: A section for specifying the expiration time of the trade offer.
6. **Submit Button**: A button for submitting the form.

## Form Fields

### Maker Asset Type

A dropdown for selecting the type of asset to send:

- `bitcoin`: Bitcoin
- `rune`: Rune
- `alkane`: Alkane

### Maker Asset ID

A text field for entering the ID of the rune or alkane to send. This field is only visible when the maker asset type is `rune` or `alkane`.

### Maker Amount

A number field for entering the amount of the maker asset to send.

### Taker Asset Type

A dropdown for selecting the type of asset to receive:

- `bitcoin`: Bitcoin
- `rune`: Rune
- `alkane`: Alkane

### Taker Asset ID

A text field for entering the ID of the rune or alkane to receive. This field is only visible when the taker asset type is `rune` or `alkane`.

### Taker Amount

A number field for entering the amount of the taker asset to receive.

### Expiration

A number field for entering the expiration time of the trade offer in seconds.

## Validation

The `TradeForm` component performs the following validations:

1. **Required Fields**: All fields are required.
2. **Positive Amounts**: Maker and taker amounts must be positive.
3. **Asset ID**: Asset ID is required when the asset type is `rune` or `alkane`.
4. **Balance Check**: The maker amount must not exceed the user's balance.

## State Management

The `TradeForm` component uses the following hooks for state management:

1. **useBitcoinBalance**: Gets the user's Bitcoin balance.
2. **useRuneBalance**: Gets the user's rune balance.
3. **useAlkaneBalance**: Gets the user's alkane balance.
4. **useCreateTradeOffer**: Creates a trade offer.

## Error Handling

The `TradeForm` component handles the following error cases:

1. **Validation Errors**: Displays error messages for validation errors.
2. **API Errors**: Calls the `onError` callback with the error.
3. **Network Errors**: Calls the `onError` callback with the error.

## Styling

The `TradeForm` component uses the following CSS classes:

- `.trade-form`: The main container for the form.
- `.trade-form-title`: The title of the form.
- `.form-group`: A container for a form field and its label.
- `.form-label`: A label for a form field.
- `.form-control`: A form field.
- `.form-select`: A dropdown form field.
- `.form-error`: An error message for a form field.
- `.form-button`: A button for submitting the form.
- `.loading`: A class applied to the submit button when the form is submitting.

## Example

```tsx
<TradeForm
  onSuccess={(offerId) => {
    console.log(`Trade offer created: ${offerId}`);
    // Navigate to the trade offers page
    navigate('/trade/offers');
  }}
  onError={(error) => {
    console.error(`Failed to create trade offer: ${error.message}`);
    // Show an error notification
    addNotification('error', `Failed to create trade offer: ${error.message}`);
  }}
  className="my-trade-form"
/>
```

## Implementation Details

### Form State

The form state is managed using the `useState` hook:

```tsx
const [formState, setFormState] = useState<FormState>({
  makerAssetType: 'bitcoin',
  makerAssetId: '',
  makerAmount: '',
  takerAssetType: 'rune',
  takerAssetId: '',
  takerAmount: '',
  expiration: '3600', // 1 hour
});
```

### Form Submission

The form is submitted using the `handleSubmit` function:

```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Validate the form
  const errors = validateForm();
  if (Object.keys(errors).length > 0) {
    setFormErrors(errors);
    return;
  }
  
  try {
    // Create the trade offer
    const offerId = await create(
      { type: formState.makerAssetType, id: formState.makerAssetId },
      parseFloat(formState.makerAmount),
      { type: formState.takerAssetType, id: formState.takerAssetId },
      parseFloat(formState.takerAmount)
    );
    
    // Call the onSuccess callback
    if (onSuccess) {
      onSuccess(offerId);
    }
    
    // Reset the form
    setFormState({
      makerAssetType: 'bitcoin',
      makerAssetId: '',
      makerAmount: '',
      takerAssetType: 'rune',
      takerAssetId: '',
      takerAmount: '',
      expiration: '3600',
    });
    setFormErrors({});
  } catch (error) {
    // Call the onError callback
    if (onError) {
      onError(error instanceof Error ? error : new Error('Failed to create trade offer'));
    }
  }
};
```

### Form Validation

The form is validated using the `validateForm` function:

```tsx
const validateForm = () => {
  const errors: FormErrors = {};
  
  // Validate maker asset type
  if (!formState.makerAssetType) {
    errors.makerAssetType = 'Please select an asset type';
  }
  
  // Validate maker asset ID
  if ((formState.makerAssetType === 'rune' || formState.makerAssetType === 'alkane') && !formState.makerAssetId) {
    errors.makerAssetId = 'Please enter an asset ID';
  }
  
  // Validate maker amount
  if (!formState.makerAmount) {
    errors.makerAmount = 'Please enter an amount';
  } else if (parseFloat(formState.makerAmount) <= 0) {
    errors.makerAmount = 'Amount must be positive';
  }
  
  // Validate taker asset type
  if (!formState.takerAssetType) {
    errors.takerAssetType = 'Please select an asset type';
  }
  
  // Validate taker asset ID
  if ((formState.takerAssetType === 'rune' || formState.takerAssetType === 'alkane') && !formState.takerAssetId) {
    errors.takerAssetId = 'Please enter an asset ID';
  }
  
  // Validate taker amount
  if (!formState.takerAmount) {
    errors.takerAmount = 'Please enter an amount';
  } else if (parseFloat(formState.takerAmount) <= 0) {
    errors.takerAmount = 'Amount must be positive';
  }
  
  // Validate expiration
  if (!formState.expiration) {
    errors.expiration = 'Please enter an expiration time';
  } else if (parseInt(formState.expiration) <= 0) {
    errors.expiration = 'Expiration time must be positive';
  }
  
  // Check balance
  if (formState.makerAssetType === 'bitcoin' && bitcoinBalance && parseFloat(formState.makerAmount) > bitcoinBalance) {
    errors.makerAmount = 'Insufficient balance';
  } else if (formState.makerAssetType === 'rune' && runeBalance && parseFloat(formState.makerAmount) > runeBalance) {
    errors.makerAmount = 'Insufficient balance';
  } else if (formState.makerAssetType === 'alkane' && alkaneBalance && parseFloat(formState.makerAmount) > alkaneBalance) {
    errors.makerAmount = 'Insufficient balance';
  }
  
  return errors;
};
```

## Dependencies

The `TradeForm` component depends on the following hooks:

- `useBitcoinBalance`: Gets the user's Bitcoin balance.
- `useRuneBalance`: Gets the user's rune balance.
- `useAlkaneBalance`: Gets the user's alkane balance.
- `useCreateTradeOffer`: Creates a trade offer.

## Testing

The `TradeForm` component can be tested using the following test cases:

1. **Rendering**: Test that the component renders correctly.
2. **Form Submission**: Test that the form can be submitted.
3. **Validation**: Test that the form validates correctly.
4. **Error Handling**: Test that the component handles errors correctly.
5. **Success Handling**: Test that the component handles success correctly.

Example test:

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TradeForm } from '../components/TradeForm';
import { useBitcoinBalance, useRuneBalance, useAlkaneBalance } from '../hooks/useTradeHooks';
import { useCreateTradeOffer } from '../hooks/useTradeHooks';

// Mock the hooks
jest.mock('../hooks/useTradeHooks', () => ({
  useBitcoinBalance: jest.fn(),
  useRuneBalance: jest.fn(),
  useAlkaneBalance: jest.fn(),
  useCreateTradeOffer: jest.fn(),
}));

describe('TradeForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default mock values
    useBitcoinBalance.mockReturnValue({ balance: 100000000, isLoading: false });
    useRuneBalance.mockReturnValue({ balance: 1000, isLoading: false });
    useAlkaneBalance.mockReturnValue({ balance: 500, isLoading: false });
    useCreateTradeOffer.mockReturnValue({ create: jest.fn().mockResolvedValue('offer-id'), isCreating: false, error: null });
  });
  
  it('should render the form', () => {
    render(<TradeForm />);
    
    expect(screen.getByText('Create Trade Offer')).toBeInTheDocument();
    expect(screen.getByLabelText('You Send:')).toBeInTheDocument();
    expect(screen.getByLabelText('You Receive:')).toBeInTheDocument();
    expect(screen.getByLabelText('Amount:')).toBeInTheDocument();
    expect(screen.getByLabelText('Amount:')).toBeInTheDocument();
    expect(screen.getByLabelText('Expiration (seconds):')).toBeInTheDocument();
    expect(screen.getByText('Create Offer')).toBeInTheDocument();
  });
  
  // Add more tests here...
});
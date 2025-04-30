# ApiClient Component Documentation

## Overview

The `ApiClient` is a core utility class in the DarkSwap platform that handles HTTP requests to the DarkSwap API. It provides methods for making GET, POST, PUT, and DELETE requests, handling authentication, and managing request timeouts.

## Constructor

```typescript
constructor(options: ApiClientOptions)
```

### Parameters

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `options` | `ApiClientOptions` | `undefined` | Configuration options for the API client. |

### ApiClientOptions

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `baseUrl` | `string` | `undefined` | The base URL of the API. |
| `timeout` | `number` | `30000` | The request timeout in milliseconds. |
| `headers` | `Record<string, string>` | `{}` | Default headers to include in all requests. |
| `credentials` | `RequestCredentials` | `'same-origin'` | The credentials mode for requests. |
| `debug` | `boolean` | `false` | Whether to enable debug logging. |

## Properties

| Name | Type | Description |
|------|------|-------------|
| `baseUrl` | `string` | The base URL of the API. |
| `timeout` | `number` | The request timeout in milliseconds. |
| `headers` | `Record<string, string>` | Default headers to include in all requests. |
| `credentials` | `RequestCredentials` | The credentials mode for requests. |
| `debug` | `boolean` | Whether to enable debug logging. |
| `token` | `string \| null` | The authentication token. |

## Methods

### setToken

```typescript
setToken(token: string | null): void
```

Sets the authentication token.

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `token` | `string \| null` | The authentication token, or null to clear the token. |

#### Example

```typescript
// Set the authentication token
client.setToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');

// Clear the authentication token
client.setToken(null);
```

### getToken

```typescript
getToken(): string | null
```

Gets the authentication token.

#### Returns

The authentication token, or null if no token is set.

#### Example

```typescript
const token = client.getToken();
console.log('Authentication token:', token);
```

### setHeader

```typescript
setHeader(name: string, value: string): void
```

Sets a default header for all requests.

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `name` | `string` | The header name. |
| `value` | `string` | The header value. |

#### Example

```typescript
// Set a custom header
client.setHeader('X-Custom-Header', 'custom-value');
```

### removeHeader

```typescript
removeHeader(name: string): void
```

Removes a default header.

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `name` | `string` | The header name. |

#### Example

```typescript
// Remove a custom header
client.removeHeader('X-Custom-Header');
```

### get

```typescript
get<T = any>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>>
```

Makes a GET request to the API.

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `endpoint` | `string` | The API endpoint. |
| `options` | `RequestOptions` | (Optional) Request options. |

#### Returns

A promise that resolves to an `ApiResponse<T>`.

#### Example

```typescript
// Make a GET request
const response = await client.get<User>('/users/123');

if (response.success) {
  console.log('User:', response.data);
} else {
  console.error('Error:', response.error);
}
```

### post

```typescript
post<T = any>(endpoint: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>>
```

Makes a POST request to the API.

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `endpoint` | `string` | The API endpoint. |
| `data` | `any` | (Optional) The request body. |
| `options` | `RequestOptions` | (Optional) Request options. |

#### Returns

A promise that resolves to an `ApiResponse<T>`.

#### Example

```typescript
// Make a POST request
const response = await client.post<User>('/users', {
  name: 'John Doe',
  email: 'john@example.com',
});

if (response.success) {
  console.log('Created user:', response.data);
} else {
  console.error('Error:', response.error);
}
```

### put

```typescript
put<T = any>(endpoint: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>>
```

Makes a PUT request to the API.

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `endpoint` | `string` | The API endpoint. |
| `data` | `any` | (Optional) The request body. |
| `options` | `RequestOptions` | (Optional) Request options. |

#### Returns

A promise that resolves to an `ApiResponse<T>`.

#### Example

```typescript
// Make a PUT request
const response = await client.put<User>('/users/123', {
  name: 'John Doe',
  email: 'john@example.com',
});

if (response.success) {
  console.log('Updated user:', response.data);
} else {
  console.error('Error:', response.error);
}
```

### delete

```typescript
delete<T = any>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>>
```

Makes a DELETE request to the API.

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `endpoint` | `string` | The API endpoint. |
| `options` | `RequestOptions` | (Optional) Request options. |

#### Returns

A promise that resolves to an `ApiResponse<T>`.

#### Example

```typescript
// Make a DELETE request
const response = await client.delete<void>('/users/123');

if (response.success) {
  console.log('User deleted');
} else {
  console.error('Error:', response.error);
}
```

### request

```typescript
request<T = any>(method: string, endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>>
```

Makes a request to the API.

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `method` | `string` | The HTTP method. |
| `endpoint` | `string` | The API endpoint. |
| `options` | `RequestOptions` | (Optional) Request options. |

#### Returns

A promise that resolves to an `ApiResponse<T>`.

#### Example

```typescript
// Make a custom request
const response = await client.request<User>('PATCH', '/users/123', {
  body: {
    name: 'John Doe',
  },
});

if (response.success) {
  console.log('Updated user:', response.data);
} else {
  console.error('Error:', response.error);
}
```

## Types

### ApiResponse

```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}
```

The response from an API request.

| Name | Type | Description |
|------|------|-------------|
| `success` | `boolean` | Whether the request was successful. |
| `data` | `T \| undefined` | The response data, if the request was successful. |
| `error` | `string \| undefined` | The error message, if the request failed. |
| `status` | `number \| undefined` | The HTTP status code. |

### RequestOptions

```typescript
interface RequestOptions {
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string>;
  timeout?: number;
  credentials?: RequestCredentials;
  cache?: RequestCache;
  mode?: RequestMode;
  redirect?: RequestRedirect;
  referrer?: string;
  referrerPolicy?: ReferrerPolicy;
  integrity?: string;
  keepalive?: boolean;
  signal?: AbortSignal;
}
```

Options for an API request.

| Name | Type | Description |
|------|------|-------------|
| `headers` | `Record<string, string>` | (Optional) Headers to include in the request. |
| `body` | `any` | (Optional) The request body. |
| `params` | `Record<string, string>` | (Optional) Query parameters to include in the request URL. |
| `timeout` | `number` | (Optional) The request timeout in milliseconds. |
| `credentials` | `RequestCredentials` | (Optional) The credentials mode for the request. |
| `cache` | `RequestCache` | (Optional) The cache mode for the request. |
| `mode` | `RequestMode` | (Optional) The mode for the request. |
| `redirect` | `RequestRedirect` | (Optional) The redirect mode for the request. |
| `referrer` | `string` | (Optional) The referrer for the request. |
| `referrerPolicy` | `ReferrerPolicy` | (Optional) The referrer policy for the request. |
| `integrity` | `string` | (Optional) The subresource integrity value for the request. |
| `keepalive` | `boolean` | (Optional) Whether to keep the connection alive after the page is unloaded. |
| `signal` | `AbortSignal` | (Optional) An abort signal to abort the request. |

## Usage

### Basic Usage

```typescript
import { ApiClient } from '../utils/ApiClient';

// Create a new ApiClient
const client = new ApiClient({
  baseUrl: 'http://localhost:8000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  debug: true,
});

// Set the authentication token
client.setToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');

// Make a GET request
const getResponse = await client.get<User>('/users/123');

if (getResponse.success) {
  console.log('User:', getResponse.data);
} else {
  console.error('Error:', getResponse.error);
}

// Make a POST request
const postResponse = await client.post<User>('/users', {
  name: 'John Doe',
  email: 'john@example.com',
});

if (postResponse.success) {
  console.log('Created user:', postResponse.data);
} else {
  console.error('Error:', postResponse.error);
}

// Make a PUT request
const putResponse = await client.put<User>('/users/123', {
  name: 'John Doe',
  email: 'john@example.com',
});

if (putResponse.success) {
  console.log('Updated user:', putResponse.data);
} else {
  console.error('Error:', putResponse.error);
}

// Make a DELETE request
const deleteResponse = await client.delete<void>('/users/123');

if (deleteResponse.success) {
  console.log('User deleted');
} else {
  console.error('Error:', deleteResponse.error);
}
```

### With React

```tsx
import React, { useEffect, useState } from 'react';
import { ApiClient } from '../utils/ApiClient';

interface User {
  id: string;
  name: string;
  email: string;
}

const UserComponent: React.FC = () => {
  const [client] = useState<ApiClient>(() => new ApiClient({
    baseUrl: 'http://localhost:8000/api',
  }));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await client.get<User>('/users/123');

        if (response.success) {
          setUser(response.data || null);
        } else {
          setError(response.error || 'Failed to fetch user');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [client]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!user) {
    return <div>No user found</div>;
  }

  return (
    <div>
      <h1>{user.name}</h1>
      <p>Email: {user.email}</p>
    </div>
  );
};

export default UserComponent;
```

## Implementation Details

### Request Building

The `ApiClient` builds requests using the following steps:

1. Combine the base URL and endpoint to create the full URL.
2. Add query parameters to the URL if provided.
3. Combine default headers and request-specific headers.
4. Add the authentication token to the headers if available.
5. Convert the request body to JSON if it's an object.
6. Create a `fetch` request with the appropriate options.
7. Set up a timeout for the request.
8. Send the request and handle the response.

### Response Parsing

The `ApiClient` parses responses using the following steps:

1. Check if the response is OK (status code 200-299).
2. Try to parse the response as JSON.
3. If the response is OK and JSON parsing succeeds, return a success response with the data.
4. If the response is not OK or JSON parsing fails, return an error response with the error message.

### Error Handling

The `ApiClient` includes error handling for various scenarios:

1. **Network Errors**: If the request fails due to a network error, the client will return an error response with the error message.
2. **Timeout Errors**: If the request times out, the client will return an error response with a timeout message.
3. **JSON Parsing Errors**: If the response cannot be parsed as JSON, the client will return an error response with a parsing error message.
4. **HTTP Errors**: If the server returns an error status code, the client will return an error response with the error message from the server.

### Authentication

The `ApiClient` supports authentication using a token. The token is included in the `Authorization` header of each request if available. You can set the token using the `setToken` method and retrieve it using the `getToken` method.

## Testing

The `ApiClient` can be tested using the following test cases:

1. **GET Request**: Test that the client can make a GET request and parse the response.
2. **POST Request**: Test that the client can make a POST request with a body and parse the response.
3. **PUT Request**: Test that the client can make a PUT request with a body and parse the response.
4. **DELETE Request**: Test that the client can make a DELETE request and parse the response.
5. **Authentication**: Test that the client includes the authentication token in requests.
6. **Error Handling**: Test that the client handles various error scenarios correctly.

Example test:

```typescript
import { ApiClient } from '../utils/ApiClient';
import fetchMock from 'jest-fetch-mock';

describe('ApiClient', () => {
  let client: ApiClient;

  beforeEach(() => {
    fetchMock.resetMocks();
    client = new ApiClient({
      baseUrl: 'http://localhost:8000/api',
    });
  });

  it('should make a GET request', async () => {
    const mockResponse = { id: '123', name: 'John Doe', email: 'john@example.com' };
    fetchMock.mockResponseOnce(JSON.stringify({ data: mockResponse }));

    const response = await client.get<typeof mockResponse>('/users/123');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8000/api/users/123',
      expect.objectContaining({
        method: 'GET',
      })
    );
    expect(response.success).toBe(true);
    expect(response.data).toEqual(mockResponse);
  });

  it('should make a POST request with a body', async () => {
    const mockRequest = { name: 'John Doe', email: 'john@example.com' };
    const mockResponse = { id: '123', ...mockRequest };
    fetchMock.mockResponseOnce(JSON.stringify({ data: mockResponse }));

    const response = await client.post<typeof mockResponse>('/users', mockRequest);

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8000/api/users',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(mockRequest),
      })
    );
    expect(response.success).toBe(true);
    expect(response.data).toEqual(mockResponse);
  });

  // Add more tests here...
});
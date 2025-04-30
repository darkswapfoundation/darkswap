import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { ApiProvider, useApi } from '../../contexts/ApiContext';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe.skip('ApiContext', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('provides initial state', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ApiProvider>{children}</ApiProvider>
    );

    const { result } = renderHook(() => useApi(), { wrapper });

    expect(result.current).toEqual(
      expect.objectContaining({
        get: expect.any(Function),
        post: expect.any(Function),
        loading: false,
        error: null,
        clearError: expect.any(Function),
      })
    );
  });

  it('handles successful GET requests', async () => {
    const mockResponse = { success: true, data: { test: 'data' } };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ApiProvider>{children}</ApiProvider>
    );

    const { result, waitForNextUpdate } = renderHook(() => useApi(), { wrapper });

    let response;
    act(() => {
      response = result.current.get('/test');
    });

    expect(result.current.loading).toBe(true);
    
    await waitForNextUpdate();
    
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(await response).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith('https://api.darkswap.io/test', expect.any(Object));
  });

  it('handles failed GET requests', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ApiProvider>{children}</ApiProvider>
    );

    const { result, waitForNextUpdate } = renderHook(() => useApi(), { wrapper });

    let response;
    act(() => {
      response = result.current.get('/test');
    });

    expect(result.current.loading).toBe(true);
    
    await waitForNextUpdate();
    
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Network error');
    await expect(response).rejects.toThrow('Network error');
  });

  it('handles successful POST requests', async () => {
    const mockResponse = { success: true, data: { id: '123' } };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ApiProvider>{children}</ApiProvider>
    );

    const { result, waitForNextUpdate } = renderHook(() => useApi(), { wrapper });

    const postData = { name: 'Test' };
    let response;
    act(() => {
      response = result.current.post('/create', postData);
    });

    expect(result.current.loading).toBe(true);
    
    await waitForNextUpdate();
    
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(await response).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.darkswap.io/create',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(postData),
      })
    );
  });

  it('handles failed POST requests', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Server error'));

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ApiProvider>{children}</ApiProvider>
    );

    const { result, waitForNextUpdate } = renderHook(() => useApi(), { wrapper });

    const postData = { name: 'Test' };
    let response;
    act(() => {
      response = result.current.post('/create', postData);
    });

    expect(result.current.loading).toBe(true);
    
    await waitForNextUpdate();
    
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Server error');
    await expect(response).rejects.toThrow('Server error');
  });

  it('clears error state', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Test error'));

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ApiProvider>{children}</ApiProvider>
    );

    const { result, waitForNextUpdate } = renderHook(() => useApi(), { wrapper });

    act(() => {
      result.current.get('/test').catch(() => {});
    });

    await waitForNextUpdate();
    
    expect(result.current.error).toBe('Test error');
    
    act(() => {
      result.current.clearError();
    });
    
    expect(result.current.error).toBe(null);
  });
});
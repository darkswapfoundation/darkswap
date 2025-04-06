import { WebSocketBatcher, MessagePriority } from '../utils/WebSocketBatcher';

describe('WebSocketBatcher', () => {
  let mockSendCallback: jest.Mock;
  let batcher: WebSocketBatcher;
  
  beforeEach(() => {
    jest.useFakeTimers();
    mockSendCallback = jest.fn();
    batcher = new WebSocketBatcher(mockSendCallback, {
      lowPriorityInterval: 1000,
      mediumPriorityInterval: 500,
      maxBatchSize: 1024,
      debug: false,
    });
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  describe('initialization', () => {
    it('should create a batcher with default options', () => {
      const defaultBatcher = new WebSocketBatcher(mockSendCallback);
      expect(defaultBatcher).toBeDefined();
    });
    
    it('should create a batcher with custom options', () => {
      const customBatcher = new WebSocketBatcher(mockSendCallback, {
        lowPriorityInterval: 2000,
        mediumPriorityInterval: 1000,
        maxBatchSize: 2048,
        debug: true,
      });
      expect(customBatcher).toBeDefined();
    });
  });
  
  describe('message sending', () => {
    it('should send high priority messages immediately', () => {
      batcher.send('test', { data: 'test' }, MessagePriority.HIGH);
      
      expect(mockSendCallback).toHaveBeenCalledTimes(1);
      expect(mockSendCallback).toHaveBeenCalledWith(JSON.stringify({
        type: 'test',
        data: { data: 'test' },
      }));
    });
    
    it('should batch medium priority messages', () => {
      batcher.start();
      batcher.send('test1', { data: 'test1' }, MessagePriority.MEDIUM);
      batcher.send('test2', { data: 'test2' }, MessagePriority.MEDIUM);
      
      // No immediate send
      expect(mockSendCallback).not.toHaveBeenCalled();
      
      // Advance timer to trigger medium priority flush
      jest.advanceTimersByTime(500);
      
      // Should send batched messages
      expect(mockSendCallback).toHaveBeenCalledTimes(1);
      expect(mockSendCallback).toHaveBeenCalledWith(JSON.stringify({
        type: 'batch',
        messages: [
          { type: 'test1', data: { data: 'test1' } },
          { type: 'test2', data: { data: 'test2' } },
        ],
      }));
    });
    
    it('should batch low priority messages', () => {
      batcher.start();
      batcher.send('test1', { data: 'test1' }, MessagePriority.LOW);
      batcher.send('test2', { data: 'test2' }, MessagePriority.LOW);
      
      // No immediate send
      expect(mockSendCallback).not.toHaveBeenCalled();
      
      // Advance timer to trigger low priority flush
      jest.advanceTimersByTime(1000);
      
      // Should send batched messages
      expect(mockSendCallback).toHaveBeenCalledTimes(1);
      expect(mockSendCallback).toHaveBeenCalledWith(JSON.stringify({
        type: 'batch',
        messages: [
          { type: 'test1', data: { data: 'test1' } },
          { type: 'test2', data: { data: 'test2' } },
        ],
      }));
    });
    
    it('should not send empty batches', () => {
      batcher.start();
      
      // Advance timer to trigger flushes
      jest.advanceTimersByTime(1000);
      
      // No messages to send
      expect(mockSendCallback).not.toHaveBeenCalled();
    });
  });
  
  describe('flush', () => {
    it('should flush all queues', () => {
      batcher.start();
      batcher.send('test1', { data: 'test1' }, MessagePriority.MEDIUM);
      batcher.send('test2', { data: 'test2' }, MessagePriority.LOW);
      
      // No immediate send
      expect(mockSendCallback).not.toHaveBeenCalled();
      
      // Flush all queues
      batcher.flush();
      
      // Should send both batches
      expect(mockSendCallback).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('start and stop', () => {
    it('should start timers when start is called', () => {
      batcher.start();
      batcher.send('test', { data: 'test' }, MessagePriority.LOW);
      
      // Advance timer to trigger flush
      jest.advanceTimersByTime(1000);
      
      // Should send batched messages
      expect(mockSendCallback).toHaveBeenCalled();
    });
    
    it('should stop timers when stop is called', () => {
      batcher.start();
      batcher.send('test', { data: 'test' }, MessagePriority.LOW);
      
      // Stop the batcher
      batcher.stop();
      
      // Advance timer to trigger flush
      jest.advanceTimersByTime(1000);
      
      // Should not send batched messages
      expect(mockSendCallback).not.toHaveBeenCalled();
    });
  });
  
  describe('edge cases', () => {
    it('should handle empty messages', () => {
      batcher.send('test', {}, MessagePriority.HIGH);
      
      expect(mockSendCallback).toHaveBeenCalledWith(JSON.stringify({
        type: 'test',
        data: {},
      }));
    });
    
    it('should handle null data', () => {
      batcher.send('test', null, MessagePriority.HIGH);
      
      expect(mockSendCallback).toHaveBeenCalledWith(JSON.stringify({
        type: 'test',
        data: null,
      }));
    });
    
    it('should handle undefined data', () => {
      batcher.send('test', undefined, MessagePriority.HIGH);
      
      expect(mockSendCallback).toHaveBeenCalledWith(JSON.stringify({
        type: 'test',
        data: undefined,
      }));
    });
  });
  
  describe('performance', () => {
    it('should batch large numbers of messages efficiently', () => {
      batcher.start();
      
      // Send 100 low priority messages
      for (let i = 0; i < 100; i++) {
        batcher.send(`test${i}`, { index: i }, MessagePriority.LOW);
      }
      
      // Advance timer to trigger flush
      jest.advanceTimersByTime(1000);
      
      // Should send one batch with all messages
      expect(mockSendCallback).toHaveBeenCalledTimes(1);
      
      const batchArg = JSON.parse(mockSendCallback.mock.calls[0][0]);
      expect(batchArg.type).toBe('batch');
      expect(batchArg.messages.length).toBe(100);
    });
  });
});
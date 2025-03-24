/**
 * @file Error Handling
 * @version 0.1.0
 * 
 * Error handling utilities for LLM integration
 */

/**
 * Error class for API errors that may be retryable
 */
export class RetryableAPIError extends Error {
  /**
   * Whether the error is retryable
   */
  retryable: boolean;

  /**
   * Constructs a new retryable API error
   * @param message The error message
   * @param retryable Whether the error is retryable
   */
  constructor(message: string, retryable: boolean = true) {
    super(message);
    this.name = 'RetryableAPIError';
    this.retryable = retryable;
  }
}

/**
 * Calls a function with retry logic
 * @param fn The function to call
 * @param maxRetries Maximum number of retries
 * @param initialDelay Initial delay in milliseconds
 * @returns The result of the function call
 */
export async function callWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let retries = 0;
  let delay = initialDelay;

  while (true) {
    try {
      return await fn();
    } catch (error) {
      if (
        error instanceof RetryableAPIError &&
        error.retryable &&
        retries < maxRetries
      ) {
        retries++;
        console.warn(`Retry ${retries}/${maxRetries} after error: ${error.message}`);
        
        // Wait before retrying with exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
        continue;
      }
      
      // Not retryable or max retries reached
      throw error;
    }
  }
} 
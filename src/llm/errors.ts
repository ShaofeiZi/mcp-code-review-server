/**
 * @file Error Handling 错误处理
 * @version 0.1.0
 * 
 * Error handling utilities for LLM integration
 * 大语言模型集成的错误处理工具
 */

/**
 * Error class for API errors that may be retryable
 * 可重试的API错误类
 */
export class RetryableAPIError extends Error {
  /**
   * Whether the error is retryable
   * 错误是否可以重试
   */
  retryable: boolean;

  /**
   * Constructs a new retryable API error
   * 构造一个新的可重试API错误
   * 
   * @param message The error message - 错误信息
   * @param retryable Whether the error is retryable - 是否可以重试
   */
  constructor(message: string, retryable: boolean = true) {
    super(message);
    this.name = 'RetryableAPIError';
    this.retryable = retryable;
  }
}

/**
 * Calls a function with retry logic
 * 使用重试逻辑调用函数
 * 
 * @param fn The function to call - 要调用的函数
 * @param maxRetries Maximum number of retries - 最大重试次数
 * @param initialDelay Initial delay in milliseconds - 初始延迟时间(毫秒)
 * @returns The result of the function call - 函数调用结果
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
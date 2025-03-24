/**
 * @file LLM Integration
 * @version 0.1.0
 * 
 * Main entry point for LLM integration
 */

// Export types
export * from './types';

// Export configuration
export * from './config';

// Export services
export * from './service';
export * from './codeReviewService';

// Export utilities
export * from './prompt';
export * from './processor';
export * from './errors';

// Re-export common components
import { loadLLMConfig } from './config';
import { CodeReviewService } from './codeReviewService';
import { CodeReviewOptions, CodeReviewResult } from './types';

/**
 * Creates a code review service with the specified configuration
 * @returns A configured code review service
 */
export function createCodeReviewService(): CodeReviewService {
  const config = loadLLMConfig();
  return new CodeReviewService(config);
} 
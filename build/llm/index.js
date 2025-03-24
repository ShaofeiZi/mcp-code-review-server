/**
 * @file LLM Integration
 * @version 0.1.0
 *
 * Main entry point for LLM integration
 */
// Export types
export * from './types.js';
// Export configuration
export * from './config.js';
// Export services
export * from './service.js';
export * from './codeReviewService.js';
// Export helpers
export * from './prompt.js';
export * from './processor.js';
export * from './errors.js';
// Re-export the code review service creator
import { loadLLMConfig } from './config.js';
import { CodeReviewService } from './codeReviewService.js';
/**
 * Creates a new code review service with the default configuration
 */
export function createCodeReviewService() {
    const config = loadLLMConfig();
    return new CodeReviewService(config);
}

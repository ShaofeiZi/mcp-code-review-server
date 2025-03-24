/**
 * @file LLM Configuration
 * @version 0.1.0
 * 
 * Handles loading and validating LLM configuration from environment variables
 */

import { LLMConfig, LLMProvider } from './types';

/**
 * Loads LLM configuration from environment variables
 * @returns The loaded LLM configuration
 * @throws Error if required environment variables are missing
 */
export function loadLLMConfig(): LLMConfig {
  // Get provider from environment variables
  const provider = process.env.LLM_PROVIDER as LLMProvider;
  
  if (!provider) {
    throw new Error('LLM_PROVIDER environment variable is required. Set it to OPEN_AI, ANTHROPIC, or GEMINI.');
  }
  
  // Validate provider is supported
  if (!['OPEN_AI', 'ANTHROPIC', 'GEMINI'].includes(provider)) {
    throw new Error(`Unsupported LLM provider: ${provider}. Must be one of: OPEN_AI, ANTHROPIC, GEMINI.`);
  }
  
  // Provider-specific API keys
  const apiKeyEnvVars = {
    'OPEN_AI': 'OPENAI_API_KEY',
    'ANTHROPIC': 'ANTHROPIC_API_KEY',
    'GEMINI': 'GEMINI_API_KEY',
  };
  
  const apiKeyEnvVar = apiKeyEnvVars[provider];
  const apiKey = process.env[apiKeyEnvVar];
  
  if (!apiKey) {
    throw new Error(`${apiKeyEnvVar} environment variable is required for provider ${provider}.`);
  }
  
  // Default models for each provider
  const defaultModels = {
    'OPEN_AI': 'gpt-4o',
    'ANTHROPIC': 'claude-3-opus-20240229',
    'GEMINI': 'gemini-1.5-pro',
  };
  
  // Model env vars for each provider
  const modelEnvVars = {
    'OPEN_AI': 'OPENAI_MODEL',
    'ANTHROPIC': 'ANTHROPIC_MODEL',
    'GEMINI': 'GEMINI_MODEL',
  };
  
  // Get model from environment variables or use default
  const modelEnvVar = modelEnvVars[provider];
  const model = process.env[modelEnvVar] || defaultModels[provider];
  
  return {
    provider,
    model,
    apiKey,
  };
} 
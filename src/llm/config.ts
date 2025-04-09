/**
 * @file LLM Configuration 大语言模型配置
 * @version 0.1.0
 * 
 * Configuration for LLM providers
 * 大语言模型提供商的配置管理
 */

import * as dotenv from 'dotenv';
import { LLMConfig, LLMProvider } from './types.js';

// Load environment variables
dotenv.config();

/**
 * API key environment variable names for each provider
 * 各提供商的API密钥环境变量名
 */
const apiKeyEnvVars: Record<LLMProvider, string> = {
  OPEN_AI: 'OPENAI_API_KEY',
  ANTHROPIC: 'ANTHROPIC_API_KEY',
  GEMINI: 'GEMINI_API_KEY'
};

/**
 * Default models for each provider
 * 各提供商的默认模型
 */
const defaultModels: Record<LLMProvider, string> = {
  OPEN_AI: 'gpt-4o',
  ANTHROPIC: 'claude-3-opus-20240307',
  GEMINI: 'gemini-1.5-pro'
};

/**
 * Model environment variable names for each provider
 * 各提供商的模型环境变量名
 */
const modelEnvVars: Record<LLMProvider, string> = {
  OPEN_AI: 'OPENAI_MODEL',
  ANTHROPIC: 'ANTHROPIC_MODEL',
  GEMINI: 'GEMINI_MODEL'
};

/**
 * Loads LLM configuration from environment variables
 * 从环境变量加载LLM配置
 * 
 * @returns LLM configuration - LLM配置信息
 */
export function loadLLMConfig(): LLMConfig {
  // Get the provider
  const provider = process.env.LLM_PROVIDER as LLMProvider;
  if (!provider) {
    throw new Error('LLM_PROVIDER environment variable is not set. Set it to OPEN_AI, ANTHROPIC, or GEMINI');
  }
  
  // Validate the provider
  if (!Object.keys(apiKeyEnvVars).includes(provider)) {
    throw new Error(`Unsupported LLM provider: ${provider}. Must be one of: OPEN_AI, ANTHROPIC, GEMINI`);
  }
  
  // Get the API key
  const apiKeyEnvVar = apiKeyEnvVars[provider as LLMProvider];
  const apiKey = process.env[apiKeyEnvVar];
  if (!apiKey) {
    throw new Error(`${apiKeyEnvVar} environment variable is not set. This is required for the ${provider} provider.`);
  }
  
  // Get the model
  const modelEnvVar = modelEnvVars[provider as LLMProvider];
  const model = process.env[modelEnvVar] || defaultModels[provider as LLMProvider];
  console.log(`Using LLM provider: ${provider}, model: ${model}`);
  
  return {
    provider: provider as LLMProvider,
    model,
    apiKey
  };
}
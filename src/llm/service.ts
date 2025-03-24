/**
 * @file LLM Service
 * @version 0.1.0
 * 
 * Provides LLM integration using Mastra SDK
 */

import { LLMConfig, CodeReviewOptions, CodeReviewResult } from './types';

/**
 * Service for interacting with LLMs through Mastra
 */
export class LLMService {
  private config: LLMConfig;
  private llm: any;

  /**
   * Initializes a new LLM service
   * @param config LLM configuration
   */
  constructor(config: LLMConfig) {
    this.config = config;
    
    try {
      // Dynamically import Mastra to avoid dependency issues
      const { Mastra } = require('@mastra/core');
      const mastra = new Mastra();
      
      // Configure LLM with provider and model
      this.llm = mastra.LLM({
        provider: config.provider,
        name: config.model,
      });
      
      console.log(`LLM service initialized with provider ${config.provider} and model ${config.model}`);
    } catch (error) {
      console.error('Failed to initialize Mastra LLM:', error);
      throw new Error(`Failed to initialize LLM service: ${error.message}`);
    }
  }

  /**
   * Generates a code review using the configured LLM
   * @param code The code content to review
   * @param prompt The review prompt
   * @returns The generated review result
   */
  async generateReview(code: string, prompt: string): Promise<string> {
    try {
      if (!this.llm) {
        throw new Error('LLM not initialized');
      }
      
      console.log('Sending code review request to LLM...');
      
      // Generate response with temperature 0 for more deterministic output
      const completion = await this.llm.generate(prompt, {
        temperature: 0,
        max_tokens: 4000,
        response_format: { type: 'json_object' }
      });
      
      return completion.text;
    } catch (error) {
      console.error('Error generating review:', error);
      throw new Error(`Failed to generate review: ${error.message}`);
    }
  }
  
  /**
   * Parses the raw LLM response into a structured format
   * @param result The raw LLM response
   * @returns The parsed code review result
   */
  parseReviewResult(result: string): CodeReviewResult {
    try {
      const parsedResult = JSON.parse(result) as CodeReviewResult;
      
      // Validate the parsed result has the expected structure
      if (!parsedResult.summary || !Array.isArray(parsedResult.issues) || 
          !Array.isArray(parsedResult.strengths) || !Array.isArray(parsedResult.recommendations)) {
        throw new Error('Invalid response structure from LLM');
      }
      
      return parsedResult;
    } catch (error) {
      console.error('Error parsing review result:', error);
      throw new Error(`Failed to parse LLM response as structured output: ${error.message}`);
    }
  }
} 
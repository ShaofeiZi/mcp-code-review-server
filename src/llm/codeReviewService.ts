/**
 * @file Code Review Service
 * @version 0.1.0
 * 
 * Integrates components to provide code review functionality
 */

import { LLMConfig, CodeReviewOptions, CodeReviewResult } from './types';
import { LLMService } from './service';
import { CodeReviewPromptBuilder } from './prompt';
import { CodeProcessor } from './processor';

/**
 * Provides code review functionality
 */
export class CodeReviewService {
  private llmService: LLMService;
  private promptBuilder: CodeReviewPromptBuilder;
  private codeProcessor: CodeProcessor;

  /**
   * Initializes a new code review service
   * @param config LLM configuration
   */
  constructor(config: LLMConfig) {
    this.llmService = new LLMService(config);
    this.promptBuilder = new CodeReviewPromptBuilder();
    this.codeProcessor = new CodeProcessor();
  }

  /**
   * Reviews code using the configured LLM
   * @param repomixOutputPath Path to the Repomix output file
   * @param options Code review options
   * @returns The code review result
   */
  async reviewCodeFromRepomix(repomixOutputPath: string, options: CodeReviewOptions): Promise<CodeReviewResult> {
    try {
      // Process the Repomix output
      const processedCode = this.codeProcessor.processRepomixOutput(repomixOutputPath);
      
      // Handle large codebases by chunking if necessary
      const codeChunks = this.codeProcessor.chunkLargeCodebase(processedCode);
      
      // For now, we'll just use the first chunk
      // In a more sophisticated implementation, we'd process each chunk and merge results
      if (codeChunks.length > 1) {
        console.warn(`Code was split into ${codeChunks.length} chunks. Only reviewing the first chunk.`);
      }
      
      return await this.reviewCode(codeChunks[0], options);
    } catch (error) {
      console.error('Error in code review process:', error);
      throw error;
    }
  }
  
  /**
   * Reviews code content directly
   * @param code The code content to review
   * @param options Code review options
   * @returns The code review result
   */
  async reviewCode(code: string, options: CodeReviewOptions): Promise<CodeReviewResult> {
    try {
      // Build the prompt
      const prompt = this.promptBuilder.buildPrompt(code, options);
      
      // Generate the review
      const rawResult = await this.llmService.generateReview(code, prompt);
      
      // Parse the result
      return this.llmService.parseReviewResult(rawResult);
    } catch (error) {
      console.error('Error reviewing code:', error);
      throw new Error(`Failed to review code: ${error.message}`);
    }
  }
} 
/**
 * @file Code Review Service 代码审查服务
 * @version 0.1.0
 * 
 * Service for performing code reviews using LLMs
 * 使用大语言模型(LLMs)执行代码审查的服务
 */

import * as fs from 'fs';
import { LLMConfig, CodeReviewOptions, CodeReviewResult } from './types.js';
import { LLMService } from './service.js';
import { CodeReviewPromptBuilder } from './prompt.js';
import { CodeProcessor } from './processor.js';
import { callWithRetry } from './errors.js';

/**
 * Service for performing code reviews
 * 执行代码审查的服务类
 */
export class CodeReviewService {
  private llmService: LLMService;
  private promptBuilder: CodeReviewPromptBuilder;
  private codeProcessor: CodeProcessor;
  
  /**
   * Creates a new CodeReviewService
   * 创建新的代码审查服务实例
   * 
   * @param config LLM configuration - LLM配置信息
   */
  constructor(config: LLMConfig) {
    this.llmService = new LLMService(config);
    this.promptBuilder = new CodeReviewPromptBuilder();
    this.codeProcessor = new CodeProcessor();
  }
  
  /**
   * Reviews code from a file
   * 从文件中审查代码
   * 
   * @param filePath Path to the file to review - 要审查的文件路径
   * @param options Code review options - 代码审查选项
   * @returns Code review result - 代码审查结果
   */
  async reviewCodeFromFile(filePath: string, options: CodeReviewOptions): Promise<CodeReviewResult> {
    console.log(`Reviewing code from file: ${filePath}`);
    const code = fs.readFileSync(filePath, 'utf-8');
    return this.reviewCode(code, options);
  }
  
  /**
   * Reviews code from repomix output
   * 从Repomix输出中审查代码
   * 
   * @param repomixOutput Repomix output or path to Repomix output file - Repomix输出内容或输出文件路径
   * @param options Code review options - 代码审查选项
   * @returns Code review result - 代码审查结果
   */
  async reviewCodeFromRepomix(repomixOutput: string, options: CodeReviewOptions): Promise<CodeReviewResult> {
    console.log('Processing Repomix output...');
    const processedRepo = await this.codeProcessor.processRepomixOutput(repomixOutput);
    console.log(`Processed Repomix output (${processedRepo.length} characters)`);
    return this.reviewCode(processedRepo, options);
  }
  
  /**
   * Reviews code
   * 审查代码
   * 
   * @param code Code to review - 要审查的代码
   * @param options Code review options - 代码审查选项
   * @returns Code review result - 代码审查结果
   */
  private async reviewCode(code: string, options: CodeReviewOptions): Promise<CodeReviewResult> {
    try {
      console.log('Building code review prompt...');
      const prompt = this.promptBuilder.buildCodeReviewPrompt(code, options);
      
      console.log('Sending code to LLM for review...');
      // Use retry logic for robustness
      const result = await callWithRetry(
        () => this.llmService.generateReview(prompt),
        3,  // max retries
        2000 // initial delay
      );
      
      console.log('Review completed successfully');
      return result;
    } catch (error) {
      console.error('Error reviewing code:', error);
      throw new Error(`Failed to review code: ${(error as Error).message}`);
    }
  }
}
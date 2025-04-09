/**
 * @file LLM Type Definitions 大语言模型类型定义
 * @version 0.1.0
 * 
 * Contains type definitions for LLM integration
 * 包含大语言模型集成所需的类型定义
 */

/**
 * Supported LLM providers
 * 支持的大语言模型提供商
 */
export type LLMProvider = 'OPEN_AI' | 'ANTHROPIC' | 'GEMINI';

/**
 * LLM configuration
 * 大语言模型配置
 */
export interface LLMConfig {
  /**
   * The LLM provider to use
   * 要使用的大语言模型提供商
   */
  provider: LLMProvider;
  
  /**
   * The model name to use
   * 要使用的模型名称
   */
  model: string;
  
  /**
   * The API key (if not provided in environment variables)
   * API密钥（如果未在环境变量中提供）
   */
  apiKey?: string;
}

/**
 * Code review options
 * 代码审查选项
 */
export interface CodeReviewOptions {
  /**
   * Level of detail for the code review
   * 代码审查的详细程度
   */
  detailLevel: 'basic' | 'detailed';
  
  /**
   * Areas to focus on during the code review
   * 代码审查中需要关注的领域
   */
  focusAreas: ('security' | 'performance' | 'quality' | 'maintainability')[];
}

/**
 * Code review result issue
 * 代码审查结果中的问题
 */
export interface CodeReviewIssue {
  /**
   * Type of issue
   * 问题类型
   */
  type: 'SECURITY' | 'PERFORMANCE' | 'QUALITY' | 'MAINTAINABILITY';
  
  /**
   * Severity of the issue
   * 问题严重程度
   */
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  
  /**
   * Description of the issue
   * 问题描述
   */
  description: string;
  
  /**
   * Line numbers associated with the issue (if applicable)
   * 与问题相关的代码行号（如果适用）
   */
  line_numbers?: number[];
  
  /**
   * Recommended fix for the issue
   * 问题修复建议
   */
  recommendation: string;
}

/**
 * Structured code review result
 * 结构化的代码审查结果
 */
export interface CodeReviewResult {
  /**
   * Brief summary of the code and its purpose
   * 代码及其用途的简要总结
   */
  summary: string;
  
  /**
   * List of issues found in the code
   * 代码中发现的问题列表
   */
  issues: CodeReviewIssue[];
  
  /**
   * List of code strengths
   * 代码优点列表
   */
  strengths: string[];
  
  /**
   * List of overall recommendations
   * 整体建议列表
   */
  recommendations: string[];
}
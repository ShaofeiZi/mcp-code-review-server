/**
 * @file Code Review Prompt Builder
 * @version 0.1.0
 * 
 * Builds prompts for code review LLM requests
 */

import { CodeReviewOptions } from './types';

/**
 * Builds prompts for code reviews
 */
export class CodeReviewPromptBuilder {
  /**
   * Builds a code review prompt
   * @param code The code to review
   * @param options The review options
   * @returns The formatted prompt
   */
  buildPrompt(code: string, options: CodeReviewOptions): string {
    // Create focus areas string
    const focusAreasText = options.focusAreas
      .map(area => {
        switch (area) {
          case 'security': return 'Security vulnerabilities and best practices';
          case 'performance': return 'Performance issues and optimizations';
          case 'quality': return 'Code quality, readability, and maintainability';
          case 'maintainability': return 'Architectural concerns and long-term maintainability';
          default: return area;
        }
      })
      .join('\n- ');
    
    // Detail level instructions
    const detailLevelText = options.detailLevel === 'detailed'
      ? 'Provide detailed analysis and thorough recommendations.'
      : 'Focus on critical issues and provide concise recommendations.';
    
    // Build the prompt
    return `
You are an expert code reviewer with deep knowledge of software development best practices, design patterns, and security.

Please perform a ${options.detailLevel} code review on the following code and provide structured feedback:

\`\`\`
${code}
\`\`\`

${detailLevelText}

Focus on these areas:
- ${focusAreasText}

Provide your response in the following structured JSON format:
{
  "summary": "Brief summary of the code and its purpose",
  "issues": [
    {
      "type": "SECURITY|PERFORMANCE|QUALITY|MAINTAINABILITY",
      "severity": "HIGH|MEDIUM|LOW",
      "description": "Description of the issue",
      "line_numbers": [12, 15], // Line numbers if applicable
      "recommendation": "Recommended fix"
    }
  ],
  "strengths": ["List of code strengths"],
  "recommendations": ["List of overall recommendations"]
}

Do not include any text outside of the JSON structure. The response must be valid JSON.
`;
  }
} 
/**
 * @file Code Review Prompt Builder
 * @version 0.1.0
 *
 * Builds prompts for code review
 */
/**
 * Builds prompts for code review
 */
export class CodeReviewPromptBuilder {
    /**
     * Creates a code review prompt builder
     */
    constructor() { }
    /**
     * Builds a code review prompt
     * @param code Code to review
     * @param options Code review options
     * @returns Prompt text
     */
    buildCodeReviewPrompt(code, options) {
        const focusAreasText = options.focusAreas
            .map((area) => {
            switch (area) {
                case 'security':
                    return '- Security: Look for vulnerabilities (XSS, CSRF, injection attacks), authentication/authorization issues, sensitive data exposure, insecure dependencies, and unsafe operations';
                case 'performance':
                    return '- Performance: Identify inefficient algorithms, excessive resource usage, memory leaks, unnecessary computations, unoptimized database queries, and scaling concerns';
                case 'quality':
                    return '- Quality: Analyze code clarity, naming conventions, adherence to design patterns, separation of concerns, code duplication, excessive complexity, and testability';
                case 'maintainability':
                    return '- Maintainability: Assess documentation quality, test coverage, modularity, extensibility, configuration management, dependency management, and architectural coherence';
                default:
                    return '';
            }
        })
            .filter(text => text.length > 0)
            .join('\n');
        const detailLevelText = options.detailLevel === 'detailed'
            ? 'Provide a comprehensive, in-depth review with specific line references and detailed explanations'
            : 'Provide a high-level overview of key findings and most critical issues';
        return `
You are an expert code reviewer with deep knowledge of programming best practices, security, and performance optimization.

TASK:
Review the provided code and deliver a structured analysis following these guidelines.

FOCUS AREAS:
${focusAreasText}

DETAIL LEVEL:
${detailLevelText}

ANALYSIS APPROACH:
1. First pass: Get a high-level understanding of the code structure and purpose
2. Second pass: Identify potential issues based on the focus areas
3. Third pass: Evaluate implementation quality and identify strengths
4. Final pass: Formulate specific, actionable recommendations

RESPONSE FORMAT:
Your response must be valid JSON with the following structure:

{
  "summary": "Brief summary of the code purpose and overall assessment",
  "issues": [
    {
      "type": "SECURITY|PERFORMANCE|QUALITY|MAINTAINABILITY",
      "severity": "HIGH|MEDIUM|LOW",
      "description": "Clear description of the specific issue",
      "line_numbers": [12, 15],
      "recommendation": "Detailed, actionable suggestion to fix the issue"
    }
  ],
  "strengths": ["Description of code strengths and good practices identified"],
  "recommendations": ["Overall recommendations for improving the code"]
}

IMPORTANT:
- Be specific in your analysis
- Provide concrete examples when possible
- Include specific line numbers for issues when applicable
- Ensure recommendations are clear and actionable
- Maintain a balanced perspective, highlighting both issues and strengths
- Your response MUST be valid JSON

CODE TO REVIEW:
${code}
`;
    }
}

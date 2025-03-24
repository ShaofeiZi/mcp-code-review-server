# LLM Integration Implementation Plan

## Overview

This document outlines the step-by-step implementation plan for integrating Large Language Model (LLM) capabilities into the code-review-server. The integration will take the output of Repomix (flattened codebase or selected files) and send it to an LLM with a code review prompt to get a comprehensive code review with structured output.

## Goals

1. Implement a flexible LLM integration that supports multiple providers (OpenAI, Anthropic, etc.)
2. Process Repomix output and prepare it for LLM analysis
3. Design structured output format for code reviews
4. Handle authentication via environment variables for API keys
5. Implement error handling and retry mechanisms
6. Create a user-friendly interface for configuring and running code reviews

## Architecture

```
┌───────────┐     ┌───────────┐     ┌───────────┐     ┌────────────┐
│           │     │           │     │           │     │            │
│  Repomix  │────▶│ Formatter │────▶│ LLM Agent │────▶│ Structured │
│           │     │           │     │           │     │   Output   │
└───────────┘     └───────────┘     └───────────┘     └────────────┘
```

## Implementation Steps

### 1. Set Up LLM Provider Abstraction Layer

Create an abstraction layer for LLM providers that allows switching between different providers easily.

- Create a base `LLMProvider` interface
- Implement provider-specific classes (OpenAI, Anthropic, etc.)
- Use Mastra's LLM client for standardized interactions

```typescript
// Example abstraction using Mastra
import { Mastra } from '@mastra/core';

interface LLMConfig {
  provider: 'OPEN_AI' | 'ANTHROPIC' | 'GEMINI';
  model: string;
  apiKey?: string;
}

class LLMService {
  private mastra: Mastra;
  private llm: any;

  constructor(config: LLMConfig) {
    this.mastra = new Mastra();
    this.llm = this.mastra.LLM({
      provider: config.provider,
      name: config.model,
    });
  }

  async generateReview(codeContent: string, reviewPrompt: string) {
    // Implementation details
  }
}
```

### 2. Implement Code Processing Pipeline

Create a pipeline to process the Repomix output and prepare it for LLM analysis.

- Parse Repomix output file
- Implement chunking strategies for large codebases
- Exclude irrelevant files and content
- Format the code for optimal LLM processing

```typescript
interface RepomixOutput {
  path: string;
  content?: string;
}

class CodeProcessor {
  processRepomixOutput(outputPath: string): RepomixOutput[] {
    // Implementation details
  }

  chunkLargeCodebase(outputs: RepomixOutput[]): RepomixOutput[][] {
    // Implementation details
  }
}
```

### 3. Design Code Review Prompt Template

Create a template for the code review prompt with specific instructions for the LLM.

```typescript
class CodeReviewPromptBuilder {
  buildPrompt(code: string, options: CodeReviewOptions): string {
    return `
You are an expert code reviewer with deep knowledge of software development best practices, design patterns, and security.

Please perform a thorough code review on the following code and provide structured feedback:

${code}

Focus on:
1. Code quality
2. Security vulnerabilities
3. Performance issues
4. Readability and maintainability
5. Architectural concerns
6. Testing coverage

Provide your response in the following structured format:
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
`;
  }
}
```

### 4. Implement LLM Integration

Integrate with LLM providers using the Mastra client.

```typescript
interface CodeReviewOptions {
  detailLevel: 'basic' | 'detailed';
  focusAreas: ('security' | 'performance' | 'quality' | 'maintainability')[];
}

interface CodeReviewResult {
  summary: string;
  issues: {
    type: 'SECURITY' | 'PERFORMANCE' | 'QUALITY' | 'MAINTAINABILITY';
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    description: string;
    line_numbers?: number[];
    recommendation: string;
  }[];
  strengths: string[];
  recommendations: string[];
}

class CodeReviewService {
  private llmService: LLMService;
  private promptBuilder: CodeReviewPromptBuilder;

  constructor(llmConfig: LLMConfig) {
    this.llmService = new LLMService(llmConfig);
    this.promptBuilder = new CodeReviewPromptBuilder();
  }

  async reviewCode(code: string, options: CodeReviewOptions): Promise<CodeReviewResult> {
    const prompt = this.promptBuilder.buildPrompt(code, options);
    const result = await this.llmService.generateReview(code, prompt);
    return this.parseReviewResult(result);
  }

  private parseReviewResult(result: string): CodeReviewResult {
    // Parse and validate the LLM response
    try {
      return JSON.parse(result) as CodeReviewResult;
    } catch (error) {
      throw new Error('Failed to parse LLM response as structured output');
    }
  }
}
```

### 5. Implement Environment Variable Configuration

Set up environment variables for API keys and other provider-specific configuration.

```typescript
function loadLLMConfig(): LLMConfig {
  const provider = process.env.LLM_PROVIDER as 'OPEN_AI' | 'ANTHROPIC' | 'GEMINI';
  
  if (!provider) {
    throw new Error('LLM_PROVIDER environment variable is required');
  }
  
  // Provider-specific API keys
  const apiKeyMap = {
    'OPEN_AI': process.env.OPENAI_API_KEY,
    'ANTHROPIC': process.env.ANTHROPIC_API_KEY,
    'GEMINI': process.env.GEMINI_API_KEY,
  };
  
  const apiKey = apiKeyMap[provider];
  
  if (!apiKey) {
    throw new Error(`API key for provider ${provider} is not set in environment variables`);
  }
  
  // Default models for each provider
  const modelMap = {
    'OPEN_AI': process.env.OPENAI_MODEL || 'gpt-4o',
    'ANTHROPIC': process.env.ANTHROPIC_MODEL || 'claude-3-opus-20240229',
    'GEMINI': process.env.GEMINI_MODEL || 'gemini-1.5-pro',
  };
  
  return {
    provider,
    model: modelMap[provider],
    apiKey,
  };
}
```

### 6. Implement the MCP Tool for Code Review

Register a new MCP tool for code review that can be used in the server.

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { executeRepomix } from './repomix.js';

// Load LLM configuration
const llmConfig = loadLLMConfig();
const codeReviewService = new CodeReviewService(llmConfig);

// Create and configure the server
const server = new Server({
  name: 'code-review-server',
  description: 'A custom MCP server to perform code reviews'
});

// Register the code_review tool
server.registerTool({
  name: 'code_review',
  description: 'Performs a code review on a repository using an LLM',
  parameters: {
    repoPath: { 
      type: 'string', 
      description: 'Path to the repository to analyze' 
    },
    specificFiles: { 
      type: 'array', 
      items: { type: 'string' }, 
      optional: true,
      description: 'Specific files to review (if empty, will review the entire codebase)'
    },
    fileTypes: { 
      type: 'array', 
      items: { type: 'string' }, 
      optional: true,
      description: 'File types to include in the review (e.g., [".js", ".ts"])'
    },
    detailLevel: {
      type: 'string',
      enum: ['basic', 'detailed'],
      optional: true,
      description: 'Level of detail for the code review'
    },
    focusAreas: {
      type: 'array',
      items: { 
        type: 'string',
        enum: ['security', 'performance', 'quality', 'maintainability']
      },
      optional: true,
      description: 'Areas to focus on during the code review'
    }
  },
  handler: async (params) => {
    try {
      // Execute Repomix to get the flattened codebase
      const repomixOptions = {
        includePaths: params.specificFiles || [params.repoPath],
        fileTypes: params.fileTypes,
        outputFormat: 'plain',
      };
      
      const repomixOutput = await executeRepomix(repomixOptions);
      
      // Read the Repomix output file
      const codeContent = fs.readFileSync(repomixOutput, 'utf-8');
      
      // Set up review options
      const reviewOptions = {
        detailLevel: params.detailLevel || 'detailed',
        focusAreas: params.focusAreas || ['security', 'performance', 'quality', 'maintainability'],
      };
      
      // Perform the code review
      const reviewResult = await codeReviewService.reviewCode(codeContent, reviewOptions);
      
      // Format the response
      return {
        content: [
          { 
            text: JSON.stringify(reviewResult, null, 2) 
          }
        ]
      };
    } catch (error) {
      console.error('Error in code review:', error);
      return {
        content: [
          { 
            text: `Error performing code review: ${error.message}` 
          }
        ]
      };
    }
  }
});

// Start the server
server.start();
```

### 7. Implement Error Handling and Retries

Add robust error handling and retry mechanisms for LLM API calls.

```typescript
class RetryableAPIError extends Error {
  constructor(message: string, public retryable: boolean = true) {
    super(message);
  }
}

async function callWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let retries = 0;
  let delay = initialDelay;

  while (true) {
    try {
      return await fn();
    } catch (error) {
      if (
        error instanceof RetryableAPIError &&
        error.retryable &&
        retries < maxRetries
      ) {
        retries++;
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
        continue;
      }
      throw error;
    }
  }
}
```

### 8. Implement CLI for Local Testing

Create a CLI for testing the code review functionality locally.

```typescript
#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { CodeReviewService } from './codeReviewService';
import { loadLLMConfig } from './config';

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .option('repo', {
      alias: 'r',
      description: 'Repository path to review',
      type: 'string',
      demandOption: true,
    })
    .option('files', {
      alias: 'f',
      description: 'Specific files to review',
      type: 'array',
    })
    .option('types', {
      alias: 't',
      description: 'File types to review',
      type: 'array',
    })
    .option('detail', {
      alias: 'd',
      description: 'Detail level (basic or detailed)',
      type: 'string',
      choices: ['basic', 'detailed'],
      default: 'detailed',
    })
    .option('focus', {
      description: 'Areas to focus on',
      type: 'array',
      choices: ['security', 'performance', 'quality', 'maintainability'],
      default: ['security', 'performance', 'quality', 'maintainability'],
    })
    .help()
    .alias('help', 'h').argv;

  try {
    // Implementation details
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
```

## Implementation Checklist

### Phase 1: Initial Setup and Core Functionality

- [ ] Set up project structure for LLM integration
- [ ] Create LLM provider abstraction layer
- [ ] Implement environment variable configuration
- [ ] Create basic prompt templates for code review
- [ ] Implement JSON parsing for structured output
- [ ] Add basic error handling and logging

### Phase 2: Code Processing and Integration

- [ ] Implement Repomix output processing
- [ ] Create chunking logic for large codebases
- [ ] Build prompt construction with code content
- [ ] Integrate with LLM providers through Mastra
- [ ] Implement retry logic for API calls
- [ ] Create end-to-end flow from Repomix to LLM review

### Phase 3: MCP Tool Implementation

- [ ] Register the code_review MCP tool
- [ ] Implement the tool handler with proper parameters
- [ ] Add parameter validation and error handling
- [ ] Test tool with simple repositories
- [ ] Update tool to handle large codebases effectively

### Phase 4: Testing and Refinement

- [ ] Create unit tests for components
- [ ] Add integration tests for end-to-end flow
- [ ] Test with various codebases and repositories
- [ ] Optimize prompt for better results
- [ ] Refine structured output format as needed
- [ ] Performance testing and optimization

### Phase 5: Documentation and Polish

- [ ] Document API and configuration options
- [ ] Create examples and usage guides
- [ ] Update README with setup instructions
- [ ] Add security guidelines for API keys
- [ ] Implement additional features based on feedback

## Timeline

- Phase 1: 2 days
- Phase 2: 3 days
- Phase 3: 2 days
- Phase 4: 2 days
- Phase 5: 1 day

Total: 10 working days

## Dependencies

- Mastra SDK for LLM integration
- @modelcontextprotocol/sdk for MCP server
- Repomix for code flattening
- Node.js fs/path modules for file operations
- Environment variable management
- JSON parsing and validation

## Security Considerations

- API keys must be stored securely as environment variables
- Sensitive code content should not be logged
- Rate limiting should be implemented to avoid excessive API costs
- Temporary files should be properly managed and cleaned up
- Input validation to prevent injection attacks

## Conclusion

This implementation plan provides a comprehensive guide for integrating LLM capabilities into the code-review-server. By following this plan, we can create a robust, flexible system that leverages LLMs to provide valuable code reviews with structured outputs. 
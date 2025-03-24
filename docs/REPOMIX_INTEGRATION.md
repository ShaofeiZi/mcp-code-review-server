# Repomix Integration Checklist

This document outlines the implementation plan for integrating Repomix with our code review MCP server to enable comprehensive codebase analysis.

## Overview

[Repomix](https://github.com/nomic-ai/repomix) is a tool that can flatten an entire codebase into a single text document, making it easier for large language models (LLMs) to analyze and understand the complete codebase structure. Our goal is to use Repomix to prepare codebases for review and pipe the output to an LLM for evaluation.

## Implementation Tasks

### 1. Repomix Installation and Setup

- [ ] Install Repomix:
  ```bash
  npm install -g repomix
  ```
  
- [ ] Test basic Repomix functionality with a sample repository

### 2. MCP Server Integration

- [ ] Create a new tool in our MCP server called `analyze_repo`:
  - [ ] Add tool definition in `ListToolsRequestSchema` handler
  - [ ] Implement tool handler in `CallToolRequestSchema` handler
  - [ ] Add appropriate input schema (repository path, output format, etc.)

- [ ] Add functionality to execute Repomix from within the server:
  ```typescript
  function executeRepomix(repoPath: string, options: RepomixOptions): string {
    // Execute repomix command and capture output
    // Format: repomix --style plain ${repoPath} && cat repomix-output.txt
  }
  ```

### 3. Selective Codebase Flattening

- [ ] Implement options for selecting portions of a codebase:
  - [ ] By directory/file pattern (e.g., `src/components/**/*.tsx`)
  - [ ] By file type (e.g., `.js`, `.ts`, `.py`)
  - [ ] By git history (e.g., only recently modified files)
  - [ ] By custom inclusion/exclusion rules

- [ ] Create a configuration schema for these options:
  ```typescript
  interface RepomixOptions {
    includePaths?: string[];
    excludePaths?: string[];
    fileTypes?: string[];
    recentOnly?: boolean;
    outputFormat?: 'plain' | 'markdown' | 'json';
    // Additional options
  }
  ```

### 4. LLM Integration (Placeholder)

- [ ] Design the interface between Repomix output and LLM:
  ```typescript
  async function sendToLLM(repomixOutput: string): Promise<CodeReviewResult> {
    // TODO: Implement LLM API call with the flattened codebase
    // Return structured code review results
  }
  ```

- [ ] Create prompts for different types of code reviews:
  - [ ] Architecture review
  - [ ] Security review
  - [ ] Performance review
  - [ ] Best practices review

### 5. Output Processing

- [ ] Parse and structure the LLM's response:
  ```typescript
  interface CodeReviewResult {
    overview: string;
    issues: Array<{
      file: string;
      line?: number;
      severity: 'critical' | 'major' | 'minor' | 'suggestion';
      description: string;
      recommendation?: string;
    }>;
    recommendations: string[];
    score: number;
  }
  ```

- [ ] Store results in a format accessible through the MCP server

### 6. UI/UX Considerations

- [ ] Design a workflow for initiating repository analysis
- [ ] Create progress indicators for long-running analyses
- [ ] Develop a way to present the results in a structured, navigable format

## Implementation Details

### Repomix Command Format

Basic command structure:
```bash
repomix --style plain ${repoPath} && cat repomix-output.txt | llm -s "${SYSTEM_PROMPT}" "${USER_PROMPT}"
```

Where:
- `--style plain` generates a simple text output
- `repoPath` is the path to the repository to analyze
- The output is piped to an LLM with appropriate system and user prompts

### Example System Prompt

```
You are an expert code reviewer with extensive experience in software architecture, performance optimization, security, and best practices. Analyze the provided codebase and provide a comprehensive review that includes:

1. Overall architecture assessment
2. Identified issues with line numbers and severity ratings
3. Security vulnerabilities
4. Performance bottlenecks
5. Code quality and maintainability concerns
6. Specific recommendations for improvement
7. An overall score from 0-10

Format your response as a detailed report with clear sections and actionable feedback.
```

## Future Enhancements

- Integration with version control systems to track changes over time
- Comparative code reviews between different versions
- Custom review templates for different types of projects (web, mobile, etc.)
- Automatic PR comment generation based on reviews
- Integration with existing code quality tools (ESLint, SonarQube, etc.)

## Resources

- [Repomix GitHub Repository](https://github.com/nomic-ai/repomix)
- [Model Context Protocol Documentation](https://modelcontextprotocol.ai)
- [LLM Code Review Best Practices](https://example.com/llm-code-review) (placeholder link) 
/**
 * @file Code Review MCP Server Entry Point
 * @version 0.1.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2024-03-24
 * 
 * Main entry point for the Code Review MCP Server
 * 
 * IMPORTANT:
 * - All changes must be accompanied by tests
 * - Maintain type safety
 * 
 * Functionality:
 * - Server initialization
 * - Tool registration
 * - Request handling
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { executeRepomix, RepomixOptions } from './repomix.js';
import * as fs from 'fs';
import { createCodeReviewService, CodeReviewOptions } from './llm/index.js';

// Create and configure the server
const server = new Server({
  name: 'code-review-server',
  description: 'A custom MCP server to perform code reviews'
});

// Register the analyze_repo tool
server.registerTool({
  name: 'analyze_repo',
  description: 'Analyzes a repository using Repomix',
  parameters: {
    repoPath: { type: 'string', description: 'Path to the repository to analyze' },
    specificFiles: { type: 'array', items: { type: 'string' }, optional: true },
    fileTypes: { type: 'array', items: { type: 'string' }, optional: true }
  },
  handler: async (params) => {
    const options: RepomixOptions = {
      includePaths: params.specificFiles,
      fileTypes: params.fileTypes,
      outputFormat: 'plain'
    };
    
    const result = await executeRepomix(options);
    return { content: [{ text: `Analyzing repository: ${result}` }] };
  }
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
      const repomixOptions: RepomixOptions = {
        includePaths: params.specificFiles || [params.repoPath],
        fileTypes: params.fileTypes,
        outputFormat: 'plain',
      };
      
      const repomixOutput = await executeRepomix(repomixOptions);
      
      // Set up review options
      const reviewOptions: CodeReviewOptions = {
        detailLevel: (params.detailLevel as 'basic' | 'detailed') || 'detailed',
        focusAreas: (params.focusAreas as ('security' | 'performance' | 'quality' | 'maintainability')[]) || 
          ['security', 'performance', 'quality', 'maintainability'],
      };
      
      // Create the code review service
      try {
        const codeReviewService = createCodeReviewService();
        
        // Perform the code review
        const reviewResult = await codeReviewService.reviewCodeFromRepomix(repomixOutput, reviewOptions);
        
        // Format the response
        return {
          content: [
            { 
              text: JSON.stringify(reviewResult, null, 2) 
            }
          ]
        };
      } catch (error) {
        console.error('Error initializing code review service:', error);
        return {
          content: [
            { 
              text: `Error initializing code review service: ${error.message}. Make sure you have set the necessary environment variables (LLM_PROVIDER and the corresponding API key).`
            }
          ]
        };
      }
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

#!/usr/bin/env node
/**
 * @file CLI Tool for Code Quality Analysis
 * @version 0.1.0
 * 
 * Command-line interface for testing code quality analysis functionality
 */

import * as path from 'path';
import { executeRepomix } from './repomix.js';
import { createCodeReviewService } from './llm/index.js';
import { CodeReviewIssue, CodeReviewResult } from './llm/types.js';

// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
      console.log(`
CodeQualityAdvisor CLI - Test code quality analysis functionality

Usage:
  cli.js <repo_path> [options]

Arguments:
  repo_path                 Path to the repository to analyze

Options:
  --files <file1,file2>     Specific files to review
  --types <.js,.ts>         File types to include in the review
  --detail <basic|detailed> Level of detail (default: detailed)
  --focus <areas>           Areas to focus on (security,performance,quality,maintainability)
  --help, -h                Show this help message
      `);
      process.exit(0);
    }
    
    // Extract the repository path
    const repoPath = args[0];
    
    // Parse options
    let specificFiles: string[] | undefined;
    let fileTypes: string[] | undefined;
    let detailLevel: 'basic' | 'detailed' = 'detailed';
    let focusAreas: ('security' | 'performance' | 'quality' | 'maintainability')[] = 
      ['security', 'performance', 'quality', 'maintainability'];
    
    for (let i = 1; i < args.length; i++) {
      const arg = args[i];
      
      if (arg === '--files' && i + 1 < args.length) {
        specificFiles = args[++i].split(',');
      } else if (arg === '--types' && i + 1 < args.length) {
        fileTypes = args[++i].split(',');
      } else if (arg === '--detail' && i + 1 < args.length) {
        const detail = args[++i];
        if (detail === 'basic' || detail === 'detailed') {
          detailLevel = detail;
        } else {
          console.error(`Invalid detail level: ${detail}. Using 'detailed' instead.`);
        }
      } else if (arg === '--focus' && i + 1 < args.length) {
        const focus = args[++i].split(',') as ('security' | 'performance' | 'quality' | 'maintainability')[];
        if (focus.length > 0) {
          focusAreas = focus;
        }
      }
    }
    
    console.log(`Analyzing repository: ${repoPath}`);
    if (specificFiles) {
      console.log(`Specific files: ${specificFiles.join(', ')}`);
    }
    if (fileTypes) {
      console.log(`File types: ${fileTypes.join(', ')}`);
    }
    console.log(`Detail level: ${detailLevel}`);
    console.log(`Focus areas: ${focusAreas.join(', ')}`);
    
    // Execute Repomix to get the flattened codebase
    console.log('\nFlattening codebase structure...');
    const repomixOutput = await executeRepomix({
      includePaths: specificFiles || [repoPath],
      fileTypes,
      outputFormat: 'plain',
    });
    console.log(`Codebase structure analysis complete. Output size: ${repomixOutput.length} characters`);
    
    // Create the code review service
    console.log('\nInitializing code quality analysis service...');
    const codeReviewService = createCodeReviewService();
    
    // Perform the code review
    console.log('\nPerforming comprehensive quality review...');
    const reviewResult = await codeReviewService.reviewCodeFromRepomix(repomixOutput, {
      detailLevel,
      focusAreas,
    });
    
    // Display the results
    console.log('\nCode Quality Review Results:');
    console.log('=============================\n');
    console.log(`Summary: ${reviewResult.summary}`);
    
    console.log('\nIssues:');
    if (reviewResult.issues.length === 0) {
      console.log('  No issues found');
    } else {
      reviewResult.issues.forEach((issue: CodeReviewIssue, index: number) => {
        console.log(`  ${index + 1}. [${issue.severity}] ${issue.type}: ${issue.description}`);
        if (issue.line_numbers && issue.line_numbers.length > 0) {
          console.log(`     Lines: ${issue.line_numbers.join(', ')}`);
        }
        console.log(`     Recommendation: ${issue.recommendation}`);
        console.log();
      });
    }
    
    console.log('\nStrengths:');
    reviewResult.strengths.forEach((strength: string, index: number) => {
      console.log(`  ${index + 1}. ${strength}`);
    });
    
    console.log('\nRecommendations:');
    reviewResult.recommendations.forEach((recommendation: string, index: number) => {
      console.log(`  ${index + 1}. ${recommendation}`);
    });
    
  } catch (error) {
    console.error('Error:', (error as Error).message);
    process.exit(1);
  }
}

main(); 
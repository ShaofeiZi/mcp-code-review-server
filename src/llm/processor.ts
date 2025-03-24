/**
 * @file Code Processor
 * @version 0.1.0
 * 
 * Processes and formats code for LLM analysis
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Represents a processed file from Repomix output
 */
export interface ProcessedFile {
  /**
   * The path to the file
   */
  path: string;
  
  /**
   * The content of the file
   */
  content: string;
}

/**
 * Processes code for LLM analysis
 */
export class CodeProcessor {
  /**
   * Maximum size in characters for a code chunk
   */
  private maxChunkSize: number;
  
  /**
   * Constructor
   * @param maxChunkSize Maximum size in characters for a code chunk
   */
  constructor(maxChunkSize: number = 50000) {
    this.maxChunkSize = maxChunkSize;
  }

  /**
   * Processes Repomix output file
   * @param outputPath Path to the Repomix output file
   * @returns The processed code content
   */
  processRepomixOutput(outputPath: string): string {
    try {
      // Check if file exists
      if (!fs.existsSync(outputPath)) {
        throw new Error(`Repomix output file not found at path: ${outputPath}`);
      }
      
      // Read the file
      const content = fs.readFileSync(outputPath, 'utf-8');
      
      // Basic validation
      if (!content || content.trim().length === 0) {
        throw new Error('Repomix output file is empty');
      }
      
      console.log(`Successfully processed Repomix output: ${outputPath}`);
      
      return this.formatCodeForLLM(content);
    } catch (error) {
      console.error('Error processing Repomix output:', error);
      throw new Error(`Failed to process Repomix output: ${error.message}`);
    }
  }
  
  /**
   * Formats code for optimal LLM processing
   * @param code The raw code content
   * @returns The formatted code
   */
  private formatCodeForLLM(code: string): string {
    // For now, just return the code as is if it's under the max chunk size
    if (code.length <= this.maxChunkSize) {
      return code;
    }
    
    // Otherwise, truncate with a warning
    console.warn(`Code exceeds maximum chunk size (${this.maxChunkSize} characters). Truncating...`);
    return code.substring(0, this.maxChunkSize) + 
      `\n\n/* NOTE: Code was truncated because it exceeds the ${this.maxChunkSize} character limit */`;
  }
  
  /**
   * Chunks a large codebase into smaller pieces
   * (This is a placeholder for future implementation)
   * @param code The full code content
   * @returns An array of code chunks
   */
  chunkLargeCodebase(code: string): string[] {
    // This is a simple implementation - could be improved with more sophisticated chunking
    const chunks: string[] = [];
    
    // If code is small enough, return as single chunk
    if (code.length <= this.maxChunkSize) {
      return [code];
    }
    
    // Split by file markers (this assumes Repomix format with file headers)
    const fileMarkerRegex = /^\/\/ FILE: .*$/gm;
    let lastIndex = 0;
    let currentChunk = '';
    
    const matches = code.matchAll(fileMarkerRegex);
    for (const match of matches) {
      if (match.index === undefined) continue;
      
      // Add the previous file to the current chunk if it fits
      const previousFile = code.substring(lastIndex, match.index);
      if (currentChunk.length + previousFile.length <= this.maxChunkSize) {
        currentChunk += previousFile;
      } else {
        // If it doesn't fit, start a new chunk
        if (currentChunk.length > 0) {
          chunks.push(currentChunk);
        }
        currentChunk = previousFile;
      }
      
      lastIndex = match.index;
    }
    
    // Add the final chunk
    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }
    
    // Add any remaining text
    if (lastIndex < code.length) {
      const remainingText = code.substring(lastIndex);
      if (chunks.length > 0 && chunks[chunks.length - 1].length + remainingText.length <= this.maxChunkSize) {
        chunks[chunks.length - 1] += remainingText;
      } else {
        chunks.push(remainingText);
      }
    }
    
    return chunks;
  }
} 
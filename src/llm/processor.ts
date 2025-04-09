/**
 * @file Code Processor 代码处理器
 * @version 0.1.0
 * 
 * Processes code for review
 * 处理代码以供审查
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Represents a processed file from Repomix output
 * 表示从Repomix输出处理的文件
 */
export interface ProcessedFile {
  /**
   * The path to the file
   * 文件路径
   */
  path: string;
  
  /**
   * The content of the file
   * 文件内容
   */
  content: string;
}

/**
 * Processes code for LLM review
 * 处理代码以供LLM审查
 */
export class CodeProcessor {
  /**
   * Maximum characters per chunk to send to LLM
   * 发送给LLM的每个代码块的最大字符数
   */
  private readonly MAX_CHARS_PER_CHUNK = 100000;
  
  /**
   * Processes Repomix output for review
   * 处理Repomix输出以供审查
   * 
   * @param repomixOutput Repomix output or path to output file - Repomix输出或输出文件路径
   * @returns Processed code - 处理后的代码
   */
  async processRepomixOutput(repomixOutput: string): Promise<string> {
    try {
      let content = repomixOutput;
      
      // If the output is a file path, read it
      if (repomixOutput.trim().endsWith('.txt') && fs.existsSync(repomixOutput.trim())) {
        console.log(`Reading Repomix output from file: ${repomixOutput}`);
        content = fs.readFileSync(repomixOutput.trim(), 'utf-8');
      } else {
        console.log('Processing Repomix output from string');
      }
      
      // Process the output
      const processedOutput = this.formatRepomixOutput(content);
      
      // Check if we need to chunk the content due to size
      if (processedOutput.length > this.MAX_CHARS_PER_CHUNK) {
        console.warn(`Repomix output exceeds maximum size (${this.MAX_CHARS_PER_CHUNK} chars). Chunking content...`);
        const chunks = this.chunkLargeCodebase(processedOutput);
        console.log(`Split content into ${chunks.length} chunks. Using first chunk.`);
        return chunks[0];
      }
      
      return processedOutput;
    } catch (error) {
      console.error('Error processing Repomix output:', error);
      throw new Error(`Failed to process Repomix output: ${(error as Error).message}`);
    }
  }
  
  /**
   * Splits large codebases into manageable chunks
   * 将大型代码库分割成可管理的块
   * 
   * @param code Code to chunk - 需要分块的代码
   * @returns Array of code chunks - 代码块数组
   */
  chunkLargeCodebase(code: string): string[] {
    if (!code || code.length <= this.MAX_CHARS_PER_CHUNK) {
      return [code];
    }
    
    const chunks: string[] = [];
    let currentIndex = 0;
    
    while (currentIndex < code.length) {
      // Find a good break point (end of a file or section)
      let endIndex = currentIndex + this.MAX_CHARS_PER_CHUNK;
      
      if (endIndex >= code.length) {
        endIndex = code.length;
      } else {
        // Try to find a file boundary to split at
        const nextFileBoundary = code.indexOf('================', endIndex);
        if (nextFileBoundary !== -1 && nextFileBoundary - endIndex < this.MAX_CHARS_PER_CHUNK * 0.2) {
          // If the next file boundary is within 20% of the max chunk size, use it
          endIndex = nextFileBoundary;
        } else {
          // Otherwise, find the last newline before the max size
          const lastNewline = code.lastIndexOf('\n', endIndex);
          if (lastNewline !== -1 && lastNewline > currentIndex) {
            endIndex = lastNewline;
          }
        }
      }
      
      // Add the chunk
      chunks.push(code.substring(currentIndex, endIndex));
      currentIndex = endIndex;
    }
    
    return chunks;
  }
  
  /**
   * Formats Repomix output for LLM consumption
   * 格式化Repomix输出以供LLM使用
   * 
   * @param repomixOutput Repomix output to format - 需要格式化的Repomix输出
   * @returns Formatted output - 格式化后的输出
   */
  private formatRepomixOutput(repomixOutput: string): string {
    // Extract the most relevant parts of the Repomix output
    let formatted = repomixOutput;
    
    // Remove any ASCII art or unnecessarily long headers
    formatted = formatted.replace(/^\s*[-=*]{10,}\s*$/gm, '================');
    
    // Ensure file headers are prominent
    formatted = formatted.replace(/^File: (.+)$/gm, '================\nFile: $1\n================');
    
    // Add line numbers to help with references
    const lines = formatted.split('\n');
    let currentFile = '';
    let lineCounter = 0;
    let result = [];
    
    for (const line of lines) {
      // Check if this is a file header
      if (line.startsWith('File: ')) {
        currentFile = line.replace('File: ', '').trim();
        lineCounter = 0;
        result.push(line);
      } 
      // Check if this is a file boundary
      else if (line === '================') {
        lineCounter = 0;
        result.push(line);
      } 
      // Normal code line
      else {
        if (currentFile && !line.startsWith('================')) {
          lineCounter++;
        }
        result.push(line);
      }
    }
    
    return result.join('\n');
  }
}
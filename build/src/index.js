#!/usr/bin/env node
/**
 * MCP server that implements a code review system.
 * It allows:
 * - Listing code files as resources
 * - Reading individual code files
 * - Performing code reviews via a tool
 * - Providing code review templates via prompts
 * - Analyzing repositories using Repomix
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListResourcesRequestSchema, ListToolsRequestSchema, ReadResourceRequestSchema, ListPromptsRequestSchema, GetPromptRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import * as fs from 'fs';
import * as path from 'path';
import { analyzeRepo } from './repomix.js';
/**
 * In-memory storage for code files and reviews.
 * In a real implementation, this would likely be backed by a database.
 */
const codeFiles = {};
const codeReviews = {};
/**
 * Helper function to get the programming language from a file extension
 */
function getLanguageFromFilePath(filePath) {
    const extension = path.extname(filePath).toLowerCase();
    const extensionMap = {
        '.js': 'javascript',
        '.ts': 'typescript',
        '.jsx': 'javascript',
        '.tsx': 'typescript',
        '.py': 'python',
        '.rb': 'ruby',
        '.java': 'java',
        '.go': 'go',
        '.php': 'php',
        '.c': 'c',
        '.cpp': 'cpp',
        '.cs': 'csharp',
        '.html': 'html',
        '.css': 'css',
        '.rs': 'rust',
        '.swift': 'swift',
        '.kt': 'kotlin',
        '.scala': 'scala',
        '.sh': 'bash',
        '.md': 'markdown',
        '.json': 'json',
        '.yml': 'yaml',
        '.yaml': 'yaml',
        '.xml': 'xml',
        '.sql': 'sql',
    };
    return extensionMap[extension] || 'plaintext';
}
/**
 * Helper function to get the MIME type from a file extension
 */
function getMimeTypeFromFilePath(filePath) {
    const extension = path.extname(filePath).toLowerCase();
    const mimeMap = {
        '.js': 'application/javascript',
        '.ts': 'application/typescript',
        '.jsx': 'application/javascript',
        '.tsx': 'application/typescript',
        '.py': 'text/x-python',
        '.rb': 'text/x-ruby',
        '.java': 'text/x-java',
        '.go': 'text/x-go',
        '.php': 'application/x-php',
        '.c': 'text/x-c',
        '.cpp': 'text/x-c++',
        '.cs': 'text/x-csharp',
        '.html': 'text/html',
        '.css': 'text/css',
        '.rs': 'text/x-rust',
        '.swift': 'text/x-swift',
        '.kt': 'text/x-kotlin',
        '.scala': 'text/x-scala',
        '.sh': 'text/x-shellscript',
        '.md': 'text/markdown',
        '.json': 'application/json',
        '.yml': 'application/x-yaml',
        '.yaml': 'application/x-yaml',
        '.xml': 'application/xml',
        '.sql': 'application/sql',
    };
    return mimeMap[extension] || 'text/plain';
}
/**
 * Helper function to scan a directory for code files
 */
function scanDirectory(dir, baseDir = '') {
    try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const relativePath = path.join(baseDir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                // Skip node_modules and hidden directories
                if (file !== 'node_modules' && !file.startsWith('.')) {
                    scanDirectory(fullPath, relativePath);
                }
            }
            else {
                // Only add files with recognized extensions
                const extension = path.extname(file);
                if (extension && !file.startsWith('.')) {
                    try {
                        const content = fs.readFileSync(fullPath, 'utf-8');
                        const language = getLanguageFromFilePath(fullPath);
                        const id = Buffer.from(relativePath).toString('base64');
                        codeFiles[id] = {
                            path: relativePath,
                            content,
                            language
                        };
                    }
                    catch (error) {
                        console.error(`Error reading file ${fullPath}:`, error);
                    }
                }
            }
        }
    }
    catch (error) {
        console.error(`Error scanning directory ${dir}:`, error);
    }
}
/**
 * Create an MCP server with capabilities for resources (to list/read code files),
 * tools (to create code reviews), and prompts (for review templates).
 */
const server = new Server({
    name: "code review-server",
    version: "0.1.0",
}, {
    capabilities: {
        resources: {},
        tools: {},
        prompts: {},
    },
});
/**
 * Handler for listing available code files as resources.
 * Each file is exposed as a resource with:
 * - A code:// URI scheme
 * - Appropriate MIME type based on file extension
 * - Human readable name and description
 */
server.setRequestHandler(ListResourcesRequestSchema, async () => {
    // Scan the current directory if no files have been loaded yet
    if (Object.keys(codeFiles).length === 0) {
        const workingDir = process.cwd();
        scanDirectory(workingDir);
    }
    return {
        resources: Object.entries(codeFiles).map(([id, file]) => ({
            uri: `code:///${id}`,
            mimeType: getMimeTypeFromFilePath(file.path),
            name: file.path,
            description: `A ${file.language} file: ${file.path}`
        }))
    };
});
/**
 * Handler for reading the contents of a specific code file.
 * Takes a code:// URI and returns the file content with appropriate MIME type.
 */
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const url = new URL(request.params.uri);
    const id = url.pathname.replace(/^\//, '');
    const file = codeFiles[id];
    if (!file) {
        throw new Error(`File ${id} not found`);
    }
    return {
        contents: [{
                uri: request.params.uri,
                mimeType: getMimeTypeFromFilePath(file.path),
                text: file.content
            }]
    };
});
/**
 * Handler that lists available tools.
 * Exposes tools for code review and repository analysis.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "review_code",
                description: "Create a code review for a specific file",
                inputSchema: {
                    type: "object",
                    properties: {
                        filePath: {
                            type: "string",
                            description: "Path to the file to review"
                        },
                        issues: {
                            type: "array",
                            description: "List of issues found in the code",
                            items: {
                                type: "object",
                                properties: {
                                    line: {
                                        type: "number",
                                        description: "Line number where the issue is found"
                                    },
                                    severity: {
                                        type: "string",
                                        enum: ["critical", "major", "minor", "suggestion"],
                                        description: "Severity of the issue"
                                    },
                                    message: {
                                        type: "string",
                                        description: "Description of the issue"
                                    }
                                },
                                required: ["line", "severity", "message"]
                            }
                        },
                        summary: {
                            type: "string",
                            description: "Overall summary of the code review"
                        },
                        score: {
                            type: "number",
                            description: "Score of the code quality (0-10)"
                        }
                    },
                    required: ["filePath", "issues", "summary", "score"]
                }
            },
            {
                name: "scan_repo",
                description: "Scan a repository directory for code files",
                inputSchema: {
                    type: "object",
                    properties: {
                        directory: {
                            type: "string",
                            description: "Directory path to scan (defaults to current directory)"
                        }
                    }
                }
            },
            {
                name: "analyze_repo",
                description: "Analyze a repository using Repomix and provide a comprehensive code review",
                inputSchema: {
                    type: "object",
                    properties: {
                        repoPath: {
                            type: "string",
                            description: "Path to the repository to analyze (defaults to current directory)"
                        },
                        includePaths: {
                            type: "array",
                            items: { type: "string" },
                            description: "List of paths to include in the analysis (e.g., 'src/components/**/*.tsx')"
                        },
                        excludePaths: {
                            type: "array",
                            items: { type: "string" },
                            description: "List of paths to exclude from the analysis (e.g., 'node_modules/**')"
                        },
                        specificFiles: {
                            type: "array",
                            items: { type: "string" },
                            description: "List of specific files to analyze (takes precedence over includePaths and fileTypes)"
                        },
                        fileTypes: {
                            type: "array",
                            items: { type: "string" },
                            description: "List of file types to include (e.g., '.js', '.ts', '.py')"
                        },
                        recentOnly: {
                            type: "boolean",
                            description: "Whether to only analyze recently modified files"
                        },
                        outputFormat: {
                            type: "string",
                            enum: ["plain", "markdown", "xml"],
                            description: "Format of the Repomix output"
                        },
                        maxFiles: {
                            type: "number",
                            description: "Maximum number of files to include in the analysis"
                        },
                        systemPrompt: {
                            type: "string",
                            description: "Custom system prompt for the LLM"
                        },
                        userPrompt: {
                            type: "string",
                            description: "Custom user prompt for the LLM"
                        }
                    },
                    required: ["repoPath"]
                }
            }
        ]
    };
});
/**
 * Handler for the tools.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    switch (request.params.name) {
        case "review_code": {
            const filePath = String(request.params.arguments?.filePath);
            const issues = request.params.arguments?.issues;
            const summary = String(request.params.arguments?.summary);
            const score = Number(request.params.arguments?.score);
            if (!filePath || !issues || !summary || isNaN(score)) {
                throw new Error("All fields are required for a code review");
            }
            const id = Buffer.from(filePath).toString('base64');
            codeReviews[id] = {
                filePath,
                issues: issues.map(issue => ({
                    line: issue.line,
                    severity: issue.severity,
                    message: issue.message
                })),
                summary,
                score
            };
            return {
                content: [{
                        type: "text",
                        text: `Created code review for ${filePath} with score ${score}/10`
                    }]
            };
        }
        case "scan_repo": {
            const directory = String(request.params.arguments?.directory || process.cwd());
            try {
                // Clear existing code files
                Object.keys(codeFiles).forEach(key => delete codeFiles[key]);
                // Scan the directory
                scanDirectory(directory);
                return {
                    content: [{
                            type: "text",
                            text: `Scanned ${directory} and found ${Object.keys(codeFiles).length} code files`
                        }]
                };
            }
            catch (error) {
                throw new Error(`Failed to scan directory: ${error}`);
            }
        }
        case "analyze_repo": {
            const repoPath = String(request.params.arguments?.repoPath || process.cwd());
            // Extract options from the request
            const options = {
                includePaths: request.params.arguments?.includePaths,
                excludePaths: request.params.arguments?.excludePaths,
                specificFiles: request.params.arguments?.specificFiles,
                fileTypes: request.params.arguments?.fileTypes,
                recentOnly: Boolean(request.params.arguments?.recentOnly),
                outputFormat: request.params.arguments?.outputFormat,
                maxFiles: Number(request.params.arguments?.maxFiles) || undefined
            };
            const systemPrompt = request.params.arguments?.systemPrompt;
            const userPrompt = request.params.arguments?.userPrompt;
            try {
                // Display a progress message
                const progressContent = {
                    type: "text",
                    text: `Analyzing repository at ${repoPath}... This may take a moment.`
                };
                // Actually perform the analysis (async)
                analyzeRepo(repoPath, options, systemPrompt, userPrompt)
                    .then(result => {
                    // Store the review result for possible future access
                    const id = Buffer.from(`repo:${repoPath}`).toString('base64');
                    codeReviews[id] = {
                        filePath: repoPath,
                        issues: result.issues.map(issue => ({
                            line: issue.line || 0,
                            severity: issue.severity,
                            message: issue.description
                        })),
                        summary: result.overview,
                        score: result.score
                    };
                })
                    .catch(error => {
                    console.error("Error in background analysis:", error);
                });
                // Return immediately with the progress message
                return {
                    content: [progressContent]
                };
            }
            catch (error) {
                throw new Error(`Failed to analyze repository: ${error}`);
            }
        }
        default:
            throw new Error("Unknown tool");
    }
});
/**
 * Handler that lists available prompts.
 * Exposes prompts for different types of code reviews.
 */
server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
        prompts: [
            {
                name: "security_review",
                description: "Review code for security vulnerabilities",
            },
            {
                name: "performance_review",
                description: "Review code for performance issues",
            },
            {
                name: "best_practices_review",
                description: "Review code for adherence to best practices",
            },
            {
                name: "comprehensive_review",
                description: "Perform a comprehensive code review",
            },
            {
                name: "repository_analysis",
                description: "Analyze an entire repository using Repomix"
            }
        ]
    };
});
/**
 * Handler for the code review prompts.
 * Returns a prompt that requests a specific type of code review for a file or an entire repository.
 */
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    // Scan the directory if not already done
    if (Object.keys(codeFiles).length === 0) {
        const workingDir = process.cwd();
        scanDirectory(workingDir);
    }
    let promptInstructions = "";
    switch (request.params.name) {
        case "security_review":
            promptInstructions = "Please perform a security code review of the following code. Focus on identifying security vulnerabilities such as injection attacks, authentication issues, authorization problems, data exposure, XSS, CSRF, and other security concerns. For each issue, provide the line number, severity (critical, major, minor), and a detailed explanation with a suggested fix.";
            break;
        case "performance_review":
            promptInstructions = "Please perform a performance review of the following code. Focus on identifying performance bottlenecks, inefficient algorithms, unnecessary computations, memory leaks, and other performance issues. For each issue, provide the line number, severity (critical, major, minor), and a detailed explanation with a suggested optimization.";
            break;
        case "best_practices_review":
            promptInstructions = "Please review the following code for adherence to best practices. Focus on code style, naming conventions, documentation, modularity, error handling, and other programming best practices. For each issue, provide the line number, severity (critical, major, minor), and a detailed explanation with a suggested improvement.";
            break;
        case "comprehensive_review":
            promptInstructions = "Please perform a comprehensive code review of the following code. Consider security vulnerabilities, performance issues, adherence to best practices, code style, maintainability, and overall code quality. For each issue, provide the line number, severity (critical, major, minor), and a detailed explanation with a suggested improvement.";
            break;
        case "repository_analysis":
            promptInstructions = "Please analyze the following repository using Repomix. Provide a comprehensive code review including architecture assessment, identified issues, security vulnerabilities, performance bottlenecks, code quality concerns, and specific recommendations for improvement.";
            return {
                messages: [
                    {
                        role: "user",
                        content: {
                            type: "text",
                            text: promptInstructions
                        }
                    },
                    {
                        role: "user",
                        content: {
                            type: "text",
                            text: "To analyze the repository, use the analyze_repo tool with the appropriate options. Provide a detailed review with specific issues, their severity ratings, and an overall code quality score from 0-10 for the repository."
                        }
                    }
                ]
            };
        default:
            throw new Error("Unknown prompt");
    }
    // Get a list of file resources to present to the user
    const fileResources = Object.entries(codeFiles).map(([id, file]) => ({
        type: "resource",
        resource: {
            uri: `code:///${id}`,
            mimeType: getMimeTypeFromFilePath(file.path),
            text: file.content
        }
    }));
    // If there are too many files, limit to the first 10
    const limitedResources = fileResources.length > 10 ? fileResources.slice(0, 10) : fileResources;
    return {
        messages: [
            {
                role: "user",
                content: {
                    type: "text",
                    text: promptInstructions
                }
            },
            ...limitedResources.map(resource => ({
                role: "user",
                content: resource
            })),
            {
                role: "user",
                content: {
                    type: "text",
                    text: "For each file, provide a detailed code review with specific issues, their line numbers, and a severity rating. Summarize your findings and give an overall code quality score from 0-10 for each file. Use the review_code tool to submit your formal review for each file when you're done."
                }
            }
        ]
    };
});
/**
 * Start the server using stdio transport.
 * This allows the server to communicate via standard input/output streams.
 */
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});

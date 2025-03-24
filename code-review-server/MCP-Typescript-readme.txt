## CodeQualityAdvisor MCP Server

The CodeQualityAdvisor is a custom MCP server that provides tools for analyzing code quality and performing comprehensive code reviews. It uses Repomix to flatten codebases and integrates with various LLM providers to generate detailed code analysis.

### Tools

#### analyze_codebase_structure

This tool helps you understand the structure of a codebase without performing a detailed review. It flattens the repository into a textual representation for analysis.

```javascript
await client.callTool({
  name: "analyze_codebase_structure",
  arguments: {
    repoPath: "/path/to/repo",
    specificFiles: ["src/main.ts", "src/util.ts"], // optional
    fileTypes: [".ts", ".js"] // optional
  }
});
```

#### comprehensive_quality_review

This tool performs a detailed code review, providing specific feedback on code quality, security issues, performance problems, and maintainability concerns.

```javascript
await client.callTool({
  name: "comprehensive_quality_review",
  arguments: {
    repoPath: "/path/to/repo",
    specificFiles: ["src/main.ts", "src/util.ts"], // optional
    fileTypes: [".ts", ".js"], // optional
    detailLevel: "detailed", // or "basic", optional
    focusAreas: ["security", "performance", "quality", "maintainability"] // optional
  }
});
```

The review result includes:
- A summary of the code
- A list of issues with severity ratings
- Code strengths
- Actionable recommendations 
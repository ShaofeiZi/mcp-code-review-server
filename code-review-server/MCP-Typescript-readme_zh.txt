## CodeQualityAdvisor MCP 服务器

CodeQualityAdvisor 是一个自定义的 MCP 服务器，提供了代码质量分析和全面代码审查的工具。它使用 Repomix 来扁平化代码库，并集成了各种 LLM 提供商来生成详细的代码分析。

### 工具

#### analyze_codebase_structure（分析代码库结构）

这个工具帮助你了解代码库的结构，无需进行详细审查。它将代码库扁平化为文本表示形式以供分析。

```javascript
await client.callTool({
  name: "analyze_codebase_structure",
  arguments: {
    repoPath: "/path/to/repo",
    specificFiles: ["src/main.ts", "src/util.ts"], // 可选
    fileTypes: [".ts", ".js"] // 可选
  }
});
```

#### comprehensive_quality_review（全面质量审查）

这个工具执行详细的代码审查，提供关于代码质量、安全问题、性能问题和可维护性问题的具体反馈。

```javascript
await client.callTool({
  name: "comprehensive_quality_review",
  arguments: {
    repoPath: "/path/to/repo",
    specificFiles: ["src/main.ts", "src/util.ts"], // 可选
    fileTypes: [".ts", ".js"], // 可选
    detailLevel: "detailed", // 或 "basic"，可选
    focusAreas: ["security", "performance", "quality", "maintainability"] // 可选
  }
});
```

审查结果包括：
- 代码摘要
- 问题列表及其严重程度评级
- 代码优势
- 可执行的建议
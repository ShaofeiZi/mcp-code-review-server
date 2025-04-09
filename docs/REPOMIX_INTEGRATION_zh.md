# Repomix 集成清单

本文档概述了将 Repomix 与我们的代码审查 MCP 服务器集成的实施计划，以实现全面的代码库分析。

## 概述

[Repomix](https://github.com/nomic-ai/repomix) 是一个可以将整个代码库压缩成单个文本文档的工具，使大型语言模型（LLMs）更容易分析和理解完整的代码库结构。我们的目标是使用 Repomix 准备代码库以供审查，并将输出传递给 LLM 进行评估。

## 实施任务

### 1. Repomix 安装和设置

- [ ] 安装 Repomix：
  ```bash
  npm install -g repomix
  ```
  
- [ ] 使用示例仓库测试基本 Repomix 功能

### 2. MCP 服务器集成

- [ ] 在我们的 MCP 服务器中创建名为 `analyze_repo` 的新工具：
  - [ ] 在 `ListToolsRequestSchema` 处理程序中添加工具定义
  - [ ] 在 `CallToolRequestSchema` 处理程序中实现工具处理程序
  - [ ] 添加适当的输入模式（仓库路径、输出格式等）

- [ ] 添加从服务器内部执行 Repomix 的功能：
  ```typescript
  function executeRepomix(repoPath: string, options: RepomixOptions): string {
    // 执行 repomix 命令并捕获输出
    // 格式：repomix --style plain ${repoPath} && cat repomix-output.txt
  }
  ```

### 3. 选择性代码库压缩

- [ ] 实现选择代码库部分的选项：
  - [ ] 按目录/文件模式（例如，`src/components/**/*.tsx`）
  - [ ] 按文件类型（例如，`.js`、`.ts`、`.py`）
  - [ ] 按 git 历史（例如，仅最近修改的文件）
  - [ ] 按自定义包含/排除规则

- [ ] 创建这些选项的配置模式：
  ```typescript
  interface RepomixOptions {
    includePaths?: string[];
    excludePaths?: string[];
    fileTypes?: string[];
    recentOnly?: boolean;
    outputFormat?: 'plain' | 'markdown' | 'json';
    // 其他选项
  }
  ```

### 4. LLM 集成（占位符）

- [ ] 设计 Repomix 输出和 LLM 之间的接口：
  ```typescript
  async function sendToLLM(repomixOutput: string): Promise<CodeReviewResult> {
    // TODO: 使用压缩的代码库实现 LLM API 调用
    // 返回结构化的代码审查结果
  }
  ```

- [ ] 创建不同类型代码审查的提示：
  - [ ] 架构审查
  - [ ] 安全审查
  - [ ] 性能审查
  - [ ] 最佳实践审查

### 5. 输出处理

- [ ] 解析和结构化 LLM 的响应：
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

- [ ] 以可通过 MCP 服务器访问的格式存储结果

### 6. UI/UX 考虑

- [ ] 设计启动仓库分析的工作流程
- [ ] 创建长时间运行分析的进度指示器
- [ ] 开发以结构化、可导航格式呈现结果的方式

## 实施细节

### Repomix 命令格式

基本命令结构：
```bash
repomix --style plain ${repoPath} && cat repomix-output.txt | llm -s "${SYSTEM_PROMPT}" "${USER_PROMPT}"
```

其中：
- `--style plain` 生成简单的文本输出
- `repoPath` 是要分析的仓库路径
- 输出通过管道传递给带有适当系统和用户提示的 LLM

### 示例系统提示

```
您是一位在软件架构、性能优化、安全性和最佳实践方面具有丰富经验的专家代码审查员。分析提供的代码库并提供全面的审查，包括：

1. 整体架构评估
2. 带有行号和严重性评级的已识别问题
3. 安全漏洞
4. 性能瓶颈
5. 代码质量和可维护性问题
6. 具体改进建议
7. 0-10 分的总体评分

将您的响应格式化为具有清晰章节和可操作反馈的详细报告。
```

## 未来增强

- 与版本控制系统集成以跟踪随时间变化的情况
- 不同版本之间的比较代码审查
- 不同类型项目的自定义审查模板（Web、移动等）
- 基于审查自动生成 PR 评论
- 与现有代码质量工具集成（ESLint、SonarQube 等）

## 资源

- [Repomix GitHub 仓库](https://github.com/nomic-ai/repomix)
- [Model Context Protocol 文档](https://modelcontextprotocol.ai)
- [LLM 代码审查最佳实践](https://example.com/llm-code-review)（占位链接）
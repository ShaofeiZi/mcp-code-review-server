MCP TypeScript SDK NPM 版本 MIT 许可证

目录
概述
安装
快速入门
什么是 MCP？
核心概念
服务器
资源
工具
提示
何时使用 MCP 工具
运行服务器
stdio
HTTP 与 SSE
测试和调试
示例
Echo 服务器
SQLite 浏览器
高级用法
底层服务器
编写 MCP 客户端
服务器功能

概述
Model Context Protocol 允许应用程序以标准化的方式为 LLM 提供上下文，将提供上下文的关注点与实际的 LLM 交互分离。这个 TypeScript SDK 实现了完整的 MCP 规范，使以下操作变得简单：

- 构建可以连接到任何 MCP 服务器的 MCP 客户端
- 创建暴露资源、提示和工具的 MCP 服务器
- 使用标准传输方式如 stdio 和 SSE
- 处理所有 MCP 协议消息和生命周期事件

安装
```bash
npm install @modelcontextprotocol/sdk
```

快速入门
让我们创建一个简单的 MCP 服务器，它暴露一个计算器工具和一些数据：

```typescript
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// 创建 MCP 服务器
const server = new McpServer({
  name: "Demo",
  version: "1.0.0"
});

// 添加加法工具
server.tool("add",
  { a: z.number(), b: z.number() },
  async ({ a, b }) => ({
    content: [{ type: "text", text: String(a + b) }]
  })
);

// 添加动态问候资源
server.resource(
  "greeting",
  new ResourceTemplate("greeting://{name}", { list: undefined }),
  async (uri, { name }) => ({
    contents: [{
      uri: uri.href,
      text: `Hello, ${name}!`
    }]
  })
);

// 开始在标准输入上接收消息并在标准输出上发送消息
const transport = new StdioServerTransport();
await server.connect(transport);
```

什么是 MCP？
Model Context Protocol (MCP) 让你能够构建服务器，以安全、标准化的方式向 LLM 应用程序暴露数据和功能。可以将其想象成一个专门为 LLM 交互设计的 Web API。MCP 服务器可以：

- 通过资源暴露数据（类似于 GET 端点；用于将信息加载到 LLM 的上下文中）
- 通过工具提供功能（类似于 POST 端点；用于执行代码或产生副作用）
- 通过提示定义交互模式（用于 LLM 交互的可重用模板）
- 以及更多！

核心概念

服务器
McpServer 是你与 MCP 协议交互的核心接口。它处理连接管理、协议合规性和消息路由：

```typescript
const server = new McpServer({
  name: "My App",
  version: "1.0.0"
});
```

资源
资源是向 LLM 暴露数据的方式。它们类似于 REST API 中的 GET 端点 - 提供数据但不应执行重要计算或产生副作用：

```typescript
// 静态资源
server.resource(
  "config",
  "config://app",
  async (uri) => ({
    contents: [{
      uri: uri.href,
      text: "应用配置在此"
    }]
  })
);

// 带参数的动态资源
server.resource(
  "user-profile",
  new ResourceTemplate("users://{userId}/profile", { list: undefined }),
  async (uri, { userId }) => ({
    contents: [{
      uri: uri.href,
      text: `用户 ${userId} 的个人资料数据`
    }]
  })
);
```

工具
工具让 LLM 可以通过你的服务器执行操作。与资源不同，工具预期会执行计算并产生副作用：

```typescript
// 带参数的简单工具
server.tool(
  "calculate-bmi",
  {
    weightKg: z.number(),
    heightM: z.number()
  },
  async ({ weightKg, heightM }) => ({
    content: [{
      type: "text",
      text: String(weightKg / (heightM * heightM))
    }]
  })
);

// 带外部 API 调用的异步工具
server.tool(
  "fetch-weather",
  { city: z.string() },
  async ({ city }) => {
    const response = await fetch(`https://api.weather.com/${city}`);
    const data = await response.text();
    return {
      content: [{ type: "text", text: data }]
    };
  }
);
```

提示
提示是帮助 LLM 有效与你的服务器交互的可重用模板：

```typescript
server.prompt(
  "review-code",
  { code: z.string() },
  ({ code }) => ({
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `请审查这段代码：\n\n${code}`
      }
    }]
  })
);
```

## 何时使用 MCP 工具

当你需要为 LLM 提供对外部数据、功能或上下文的结构化访问时，应该使用 MCP 工具。以下是适合使用 MCP 工具的具体场景：

### 何时使用 MCP 资源

在以下情况下使用资源：
- 提供来自外部系统的数据（数据库、文件、API）
- 为 LLM 提供结构化信息的访问
- 允许 LLM 浏览层次化数据
- 提供不经常变化的参考信息
- 加载过大而无法放入提示上下文的内容

示例用例：
- 文档查询
- 数据库架构访问
- 配置设置
- 用户配置信息
- 内容检索（文章、代码等）

### 何时使用 MCP 工具

在以下情况下使用工具：
- 使 LLM 能够执行带有副作用的操作
- 允许在运行时进行计算或处理
- 与外部系统交互
- 支持返回结构化结果的复杂操作
- 启用可能失败并需要错误处理的操作

示例用例：
- 数据库查询或更新
- 对外部服务的 API 调用
- 代码执行或评估
- 图像或数据处理
- 搜索功能
- 身份验证操作

### 何时使用 MCP 提示

在以下情况下使用提示：
- 定义可重用的交互模式
- 强制执行特定的对话结构
- 在不同的 LLM 请求中提供一致的指令
- 将复杂工作流打包成简单模板
- 指导 LLM 以特定方式使用资源和工具

## 运行你的服务器

TypeScript 中的 MCP 服务器需要连接到传输层以与客户端通信。如何启动服务器取决于你选择的传输方式：

### stdio

对于命令行工具和直接集成：

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({
  name: "example-server",
  version: "1.0.0"
});

// ... 设置服务器资源、工具和提示 ...

const transport = new StdioServerTransport();
await server.connect(transport);
```

### HTTP 与 SSE

对于远程服务器，启动一个带有服务器发送事件（SSE）端点的 Web 服务器，以及一个供客户端发送消息的单独端点：

```typescript
import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

const server = new McpServer({
  name: "example-server",
  version: "1.0.0"
});

// ... 设置服务器资源、工具和提示 ...

const app = express();

app.get("/sse", async (req, res) => {
  const transport = new SSEServerTransport("/messages", res);
  await server.connect(transport);
});

app.post("/messages", async (req, res) => {
  // 注意：要支持多个同时连接，这些消息需要
  // 路由到特定的匹配传输。（为简单起见，这里没有实现该逻辑。）
  await transport.handlePostMessage(req, res);
});

app.listen(3001);
```

## 测试和调试

要测试你的服务器，可以使用 MCP Inspector。更多信息请参见其 README。

## 示例

### Echo 服务器

一个演示资源、工具和提示的简单服务器：

```typescript
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const server = new McpServer({
  name: "Echo",
  version: "1.0.0"
});

server.resource(
  "echo",
  new ResourceTemplate("echo://{message}", { list: undefined }),
  async (uri, { message }) => ({
    contents: [{
      uri: uri.href,
      text: `资源回显：${message}`
    }]
  })
);

server.tool(
  "echo",
  { message: z.string() },
  async ({ message }) => ({
    content: [{ type: "text", text: `工具回显：${message}` }]
  })
);

server.prompt(
  "echo",
  { message: z.string() },
  ({ message }) => ({
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `请处理这条消息：${message}`
      }
    }]
  })
);
```

### SQLite 浏览器

一个展示数据库集成的更复杂示例：

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import sqlite3 from "sqlite3";
import { promisify } from "util";
import { z } from "zod";

const server = new McpServer({
  name: "SQLite 浏览器",
  version: "1.0.0"
});

// 帮助函数用于创建数据库连接
const getDb = () => {
  const db = new sqlite3.Database("database.db");
  return {
    all: promisify<string, any[]>(db.all.bind(db)),
    close: promisify(db.close.bind(db))
  };
};

server.resource(
  "schema",
  "schema://main",
  async (uri) => {
    const db = getDb();
    try {
      const tables = await db.all(
        "SELECT sql FROM sqlite_master WHERE type='table'"
      );
      return {
        contents: [{
          uri: uri.href,
          text: tables.map((t: {sql: string}) => t.sql).join("\n")
        }]
      };
    } finally {
      await db.close();
    }
  }
);

server.tool(
  "query",
  { sql: z.string() },
  async ({ sql }) => {
    const db = getDb();
    try {
      const results = await db.all(sql);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(results, null, 2)
        }]
      };
    } catch (err: unknown) {
      const error = err as Error;
      return {
        content: [{
          type: "text",
          text: `错误：${error.message}`
        }],
        isError: true
      };
    } finally {
      await db.close();
    }
  }
);
```

## 高级用法

### 底层服务器

要获得更多控制，你可以直接使用底层 Server 类：

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListPromptsRequestSchema,
  GetPromptRequestSchema
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  {
    name: "example-server",
    version: "1.0.0"
  },
  {
    capabilities: {
      prompts: {}
    }
  }
);

server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [{
      name: "example-prompt",
      description: "一个示例提示模板",
      arguments: [{
        name: "arg1",
        description: "示例参数",
        required: true
      }]
    }]
  };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  if (request.params.name !== "example-prompt") {
    throw new Error("未知提示");
  }
  return {
    description: "示例提示",
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: "示例提示文本"
      }
    }]
  };
});

const transport = new StdioServerTransport();
await server.connect(transport);
```

### 编写 MCP 客户端

SDK 提供了一个高级客户端接口：

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "node",
  args: ["server.js"]
});

const client = new Client(
  {
    name: "example-client",
    version: "1.0.0"
  },
  {
    capabilities: {
      prompts: {},
      resources: {},
      tools: {}
    }
  }
);

await client.connect(transport);

// 列出提示
const prompts = await client.listPrompts();

// 获取提示
const prompt = await client.getPrompt("example-prompt", {
  arg1: "值"
});

// 列出资源
const resources = await client.listResources();

// 读取资源
const resource = await client.readResource("file:///example.txt");

// 调用工具
const result = await client.callTool({
  name: "example-tool",
  arguments: {
    arg1: "值"
  }
});
```
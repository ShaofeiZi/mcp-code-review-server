# CodeQualityAdvisor

一个使用Repomix和大语言模型（LLMs）执行全面代码质量评估和审查的自定义MCP服务器。

## 特性

- 使用Repomix进行代码库扁平化处理
- 使用大语言模型分析代码
- 获取结构化的代码审查报告，包含具体问题和建议
- 支持多个LLM提供商（OpenAI、Anthropic、Gemini）
- 支持大型代码库的分块处理

## 安装

```bash
# 克隆仓库
git clone https://github.com/yourusername/code-quality-advisor.git
cd code-quality-advisor

# 安装依赖
npm install

# 构建服务器
npm run build
```

## 配置

基于`.env.example`模板在根目录创建`.env`文件：

```bash
cp .env.example .env
```

编辑`.env`文件以设置您偏好的LLM提供商和API密钥：

```bash
# LLM提供商配置
LLM_PROVIDER=OPEN_AI
OPENAI_API_KEY=your_openai_api_key_here
```

## 使用方法

### 作为MCP服务器

代码审查服务器实现了模型上下文协议（MCP），可以与任何MCP客户端一起使用：

```bash
# 启动服务器
node build/index.js
```

服务器提供两个主要工具：

1. `analyze_codebase_structure`：使用Repomix对代码库进行扁平化处理以理解其结构
2. `comprehensive_quality_review`：使用LLM执行详细的代码审查

## MCP工具使用场景

本服务器为不同的代码分析需求提供两个不同的工具：

### analyze_codebase_structure

**在以下情况下使用此工具：**
- 获取代码库结构和组织的高层概览
- 将代码库扁平化为文本表示形式以进行初步分析
- 在不进行详细审查的情况下理解目录结构和文件内容
- 为更深入的代码审查做准备
- 快速扫描代码库以识别需要进一步分析的相关文件

**示例场景：**
- "我想在审查之前了解这个代码库的结构"
- "展示这个代码库中的文件和目录"
- "给我一个扁平化的代码视图以理解其组织结构"

### comprehensive_quality_review

**在以下情况下使用此工具：**
- 执行全面的代码质量评估
- 识别特定的安全漏洞、性能瓶颈或代码质量问题
- 获取可操作的代码改进建议
- 进行带有问题严重性评级的详细审查
- 根据最佳实践评估代码库

**示例场景：**
- "审查此代码库的安全漏洞"
- "分析这些特定JavaScript文件的性能"
- "给我一个详细的代码质量评估报告"
- "审查我的代码并告诉我如何提高其可维护性"

**参数使用说明：**
- `specificFiles`：当您只想审查特定文件而不是整个代码库时使用
- `fileTypes`：当您想关注特定文件扩展名时使用（例如 .js, .ts）
- `detailLevel`：使用'basic'获取快速概览或'detailed'获取深入分析
- `focusAreas`：当您想优先考虑某些方面时使用（安全性、性能等）

### 使用CLI工具

为了测试目的，您可以使用包含的CLI工具：

```bash
node build/cli.js <repo_path> [options]
```

选项：
- `--files <file1,file2>`：要审查的特定文件
- `--types <.js,.ts>`：要包含在审查中的文件类型
- `--detail <basic|detailed>`：详细程度（默认：detailed）
- `--focus <areas>`：要关注的领域（security,performance,quality,maintainability）

示例：

```bash
node build/cli.js ./my-project --types .js,.ts --detail detailed --focus security,quality
```

## 开发

```bash
# 运行测试
npm test

# 开发模式监视
npm run watch

# 运行MCP检查器工具
npm run inspector
```

## LLM集成

CodeQualityAdvisor直接集成了多个LLM提供商的API：

- **OpenAI**（默认：gpt-4o）
- **Anthropic**（默认：claude-3-opus-20240307）
- **Gemini**（默认：gemini-1.5-pro）

### 提供商配置

在`.env`文件中配置您偏好的LLM提供商：

```bash
# 设置要使用的提供商
LLM_PROVIDER=OPEN_AI  # 选项：OPEN_AI、ANTHROPIC或GEMINI

# 提供商API密钥（为选定的提供商添加密钥）
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
GEMINI_API_KEY=your-gemini-api-key
```

### 模型配置

您可以选择性地为每个提供商指定要使用的模型：

```bash
# 可选：覆盖默认模型
OPENAI_MODEL=gpt-4-turbo
ANTHROPIC_MODEL=claude-3-sonnet-20240229
GEMINI_MODEL=gemini-1.5-flash-preview
```

### LLM集成工作原理

1. `comprehensive_quality_review`工具使用Repomix处理代码以扁平化代码库结构
2. 如有必要，代码会被格式化并分块以适应LLM上下文限制
3. 根据关注领域和详细程度生成详细的提示
4. 提示和代码直接发送到您选择的提供商的LLM API
5. LLM响应被解析为结构化格式
6. 审查结果以JSON对象的形式返回，包含问题、优势和建议

该实现包括重试逻辑以应对API错误，并确保适当的格式化以确保最相关的代码包含在审查中。

## 代码审查输出格式

代码审查以结构化的JSON格式返回：

```json
{
  "summary": "代码及其用途的简要总结",
  "issues": [
    {
      "type": "SECURITY|PERFORMANCE|QUALITY|MAINTAINABILITY",
      "severity": "HIGH|MEDIUM|LOW",
      "description": "问题描述",
      "line_numbers": [12, 15],
      "recommendation": "建议的修复方案"
    }
  ],
  "strengths": ["代码优势列表"],
  "recommendations": ["整体建议列表"]
}
```

## 许可证

MIT
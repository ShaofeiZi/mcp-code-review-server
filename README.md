# Code Review Server

A custom MCP server that performs code reviews using Repomix and LLMs.

## Features

- Flatten codebases using Repomix
- Analyze code with Large Language Models
- Get structured code reviews with specific issues and recommendations
- Support for multiple LLM providers (OpenAI, Anthropic, Gemini)
- Handles chunking for large codebases

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/code-review-server.git
cd code-review-server

# Install dependencies
npm install

# Build the server
npm run build
```

## Configuration

Create a `.env` file in the root directory based on the `.env.example` template:

```bash
cp .env.example .env
```

Edit the `.env` file to set up your preferred LLM provider and API key:

```bash
# LLM Provider Configuration
LLM_PROVIDER=OPEN_AI
OPENAI_API_KEY=your_openai_api_key_here
```

## Usage

### As an MCP Server

The code review server implements the Model Context Protocol (MCP) and can be used with any MCP client:

```bash
# Start the server
node build/index.js
```

The server exposes two main tools:

1. `analyze_repo`: Flattens a codebase using Repomix
2. `code_review`: Performs a code review using an LLM

### Using the CLI Tool

For testing purposes, you can use the included CLI tool:

```bash
node build/cli.js <repo_path> [options]
```

Options:
- `--files <file1,file2>`: Specific files to review
- `--types <.js,.ts>`: File types to include in the review
- `--detail <basic|detailed>`: Level of detail (default: detailed)
- `--focus <areas>`: Areas to focus on (security,performance,quality,maintainability)

Example:

```bash
node build/cli.js ./my-project --types .js,.ts --detail detailed --focus security,quality
```

## Development

```bash
# Run tests
npm test

# Watch mode for development
npm run watch

# Run the MCP inspector tool
npm run inspector
```

## LLM Integration

The code review server integrates directly with multiple LLM provider APIs:

- **OpenAI** (default: gpt-4o)
- **Anthropic** (default: claude-3-opus-20240307)
- **Gemini** (default: gemini-1.5-pro)

### Provider Configuration

Configure your preferred LLM provider in the `.env` file:

```bash
# Set which provider to use
LLM_PROVIDER=OPEN_AI  # Options: OPEN_AI, ANTHROPIC, or GEMINI

# Provider API Keys (add your key for the chosen provider)
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
GEMINI_API_KEY=your-gemini-api-key
```

### Model Configuration

You can optionally specify which model to use for each provider:

```bash
# Optional: Override the default models
OPENAI_MODEL=gpt-4-turbo
ANTHROPIC_MODEL=claude-3-sonnet-20240229
GEMINI_MODEL=gemini-1.5-flash-preview
```

### How the LLM Integration Works

1. The `code_review` tool processes code using Repomix to flatten the repository structure
2. The code is formatted and chunked if necessary to fit within LLM context limits
3. A detailed prompt is generated based on the focus areas and detail level
4. The prompt and code are sent directly to the LLM API of your chosen provider
5. The LLM response is parsed into a structured format
6. The review is returned as a JSON object with issues, strengths, and recommendations

The implementation includes retry logic for resilience against API errors and proper formatting to ensure the most relevant code is included in the review.

## Code Review Output Format

The code review is returned in a structured JSON format:

```json
{
  "summary": "Brief summary of the code and its purpose",
  "issues": [
    {
      "type": "SECURITY|PERFORMANCE|QUALITY|MAINTAINABILITY",
      "severity": "HIGH|MEDIUM|LOW",
      "description": "Description of the issue",
      "line_numbers": [12, 15],
      "recommendation": "Recommended fix"
    }
  ],
  "strengths": ["List of code strengths"],
  "recommendations": ["List of overall recommendations"]
}
```

## License

MIT 
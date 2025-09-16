# Code Review Agent

A powerful AI-powered code review agent that analyzes code changes, provides constructive feedback, generates commit messages, and saves reviews to markdown files.

## Features

- **Code Change Analysis**: Analyzes git diffs to identify changes in your codebase
- **Comprehensive Code Reviews**: Provides detailed feedback on code quality, maintainability, and best practices
- **Commit Message Generation**: Creates conventional commit messages based on code changes
- **Markdown Report Generation**: Saves code reviews to markdown files for documentation

## Installation

To install dependencies:

```bash
bun install
```

## Usage

To run the code review agent:

```bash
bun run index.ts
```

The agent will analyze code changes in the specified directory and provide feedback. It can also generate commit messages and save reviews to markdown files.

## Tools

The agent includes the following tools:

1. **getFileChangesInDirectoryTool**: Gets the code changes made in a given directory
2. **generateCommitMessageTool**: Generates a conventional commit message based on code changes
3. **writeReviewToMarkdownTool**: Saves code reviews to markdown files

## Configuration

You can customize the agent's behavior by modifying the prompt in `index.ts`:

```typescript
await codeReviewAgent(
  "Review the code changes in '../my-directory' directory, make your reviews and suggestions file by file",
);
```

This project was created using `bun init` in bun v1.2.22. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

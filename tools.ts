import { tool } from "ai";
import { simpleGit } from "simple-git";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";

const excludeFiles = ["dist", "bun.lock"];

const fileChange = z.object({
  rootDir: z.string().min(1).describe("The root directory"),
});

type FileChange = z.infer<typeof fileChange>;

async function getFileChangesInDirectory({ rootDir }: FileChange) {
  const git = simpleGit(rootDir);
  const summary = await git.diffSummary();
  const diffs: { file: string; diff: string }[] = [];

  for (const file of summary.files) {
    if (excludeFiles.includes(file.file)) continue;
    const diff = await git.diff(["--", file.file]);
    diffs.push({ file: file.file, diff });
  }

  return diffs;
}

export const getFileChangesInDirectoryTool = tool({
  description: "Gets the code changes made in given directory",
  inputSchema: fileChange,
  execute: getFileChangesInDirectory,
});

const generateCommitMessageSchema = z.object({
  rootDir: z.string().min(1).describe("The root directory"),
  summary: z.string().min(1).describe("A summary of the changes made"),
  type: z.enum(["feat", "fix", "docs", "style", "refactor", "perf", "test", "chore"]).describe("The type of change"),
  scope: z.string().optional().describe("The scope of the change"),
});

type GenerateCommitMessage = z.infer<typeof generateCommitMessageSchema>;

async function generateCommitMessage({ rootDir, summary, type, scope }: GenerateCommitMessage) {
  const scopeText = scope ? `(${scope})` : "";
  const commitMessage = `${type}${scopeText}: ${summary}`;
  return { commitMessage };
}

export const generateCommitMessageTool = tool({
  description: "Generates a conventional commit message based on the code changes",
  inputSchema: generateCommitMessageSchema,
  execute: generateCommitMessage,
});

const writeReviewToMarkdownSchema = z.object({
  rootDir: z.string().min(1).describe("The root directory"),
  review: z.string().min(1).describe("The code review content"),
  filename: z.string().min(1).default("code-review.md").describe("The filename to save the review as"),
});

type WriteReviewToMarkdown = z.infer<typeof writeReviewToMarkdownSchema>;

async function writeReviewToMarkdown({ rootDir, review, filename }: WriteReviewToMarkdown) {
  const filePath = path.join(rootDir, filename);
  const date = new Date().toISOString().split('T')[0];
  
  const content = `# Code Review - ${date}

${review}`;
  
  await fs.writeFile(filePath, content, 'utf-8');
  return { filePath, success: true };
}

export const writeReviewToMarkdownTool = tool({
  description: "Writes the code review to a markdown file",
  inputSchema: writeReviewToMarkdownSchema,
  execute: writeReviewToMarkdown,
});
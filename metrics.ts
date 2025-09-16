import { z } from "zod";
import { simpleGit } from "simple-git";
import path from "path";

/**
 * Interface for security issues found in code
 */
export interface SecurityIssue {
  file: string;
  line?: number;
  severity: "low" | "medium" | "high";
  description: string;
}

/**
 * Interface for code metrics result
 */
export interface CodeMetricsResult {
  linesAdded: number;
  linesRemoved: number;
  filesChanged: number;
  complexityScore: number;
  securityIssues: SecurityIssue[];
}

/**
 * Schema for code metrics input
 */
export const codeMetricsSchema = z.object({
  rootDir: z.string().min(1).describe("The root directory to analyze"),
});

export type CodeMetricsInput = z.infer<typeof codeMetricsSchema>;

/**
 * Calculate complexity score based on diff content
 * @param diff Git diff content
 * @returns Estimated complexity score
 */
function calculateComplexity(diff: string): number {
  // Simple complexity estimation based on keywords and patterns
  const complexityFactors = [
    { pattern: /function\s+\w+\s*\(/g, weight: 1 },
    { pattern: /if\s*\(/g, weight: 0.5 },
    { pattern: /else\s*{/g, weight: 0.3 },
    { pattern: /for\s*\(/g, weight: 1 },
    { pattern: /while\s*\(/g, weight: 1 },
    { pattern: /switch\s*\(/g, weight: 0.8 },
    { pattern: /\?\s*:/g, weight: 0.2 }, // Ternary operators
    { pattern: /try\s*{/g, weight: 0.5 },
    { pattern: /catch\s*\(/g, weight: 0.5 },
  ];

  // Use reduce for more efficient calculation
  const score = complexityFactors.reduce((total, { pattern, weight }) => {
    const matches = diff.match(pattern);
    return total + (matches ? matches.length * weight : 0);
  }, 1); // Start with base score of 1
  
  return parseFloat(score.toFixed(2));
}

/**
 * Detect potential security issues in code
 * @param diff Git diff content
 * @param filePath File path
 * @returns Array of security issues
 */
function detectSecurityIssues(diff: string, filePath: string): SecurityIssue[] {
  // Simple security patterns to check
  const securityPatterns = [
    { 
      pattern: /password|secret|token|key/i, 
      severity: "high", 
      description: "Potential hardcoded credentials" 
    },
    { 
      pattern: /eval\s*\(/i, 
      severity: "high", 
      description: "Unsafe eval() usage" 
    },
    { 
      pattern: /exec\s*\(/i, 
      severity: "medium", 
      description: "Command execution detected" 
    },
    { 
      pattern: /innerHTML|outerHTML/i, 
      severity: "medium", 
      description: "Potential XSS vulnerability" 
    },
    { 
      pattern: /sql\s*=/i, 
      severity: "medium", 
      description: "Potential SQL injection" 
    },
  ];

  const issues: SecurityIssue[] = [];
  const lines = diff.split('\n');
  
  // Process only added lines (starting with '+' but not '+++')
  lines
    .filter(line => line.startsWith('+') && !line.startsWith('+++'))
    .forEach((line, index) => {
      const codeLine = line.substring(1).trim();
      
      securityPatterns.forEach(({ pattern, severity, description }) => {
        if (pattern.test(codeLine)) {
          issues.push({
            file: filePath,
            line: index + 1,
            severity: severity as "low" | "medium" | "high",
            description
          });
        }
      });
    });

  return issues;
}

/**
 * Calculate code metrics for changes in a directory
 * @param param0 Input parameters
 * @returns Code metrics result
 */
export async function calculateCodeMetrics({ rootDir }: CodeMetricsInput): Promise<CodeMetricsResult | undefined> {
  const git = simpleGit(rootDir);
  const summary = await git.diffSummary();
  
  let linesAdded = 0;
  let linesRemoved = 0;
  let complexityScore = 0;
  const securityIssues: SecurityIssue[] = [];
  
  // Process each changed file
  for (const file of summary.files) {
    const diff = await git.diff(["--", file.file]);
    
    // Update lines added/removed
    if ('insertions' in file) {
      linesAdded += file.insertions;
    }
    if ('deletions' in file) {
      linesRemoved += file.deletions;
    
    // Calculate complexity
    const fileComplexity = calculateComplexity(diff);
    complexityScore += fileComplexity;
    
    // Detect security issues
    const fileSecurityIssues = detectSecurityIssues(diff, file.file);
    securityIssues.push(...fileSecurityIssues);
  }
  
  // Normalize complexity score
  if (summary.files.length > 0) {
    complexityScore = parseFloat((complexityScore / summary.files.length).toFixed(2));
  }
  
  return {
    linesAdded,
    linesRemoved,
    filesChanged: summary.files.length,
    complexityScore,
    securityIssues,
  };
  }
}
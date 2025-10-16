import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);

// Get the directory path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../..');

export interface LaTeXCompilationResult {
  success: boolean;
  pdfPath?: string;
  error?: string;
  logs?: string;
  errorLine?: number;
  errorMessage?: string;
}

// Parse LaTeX error logs to extract error line and message
function parseLatexError(logs: string): { line?: number; message?: string } {
  const lines = logs.split('\n');

  // Look for common LaTeX error patterns
  // Pattern 1: ! LaTeX Error: ...
  // Pattern 2: l.123 ... (line number)
  // Pattern 3: ./file.tex:123: ...
  // Pattern 4: ! Undefined control sequence
  // Pattern 5: ! Missing $ inserted

  let errorMessage: string | undefined;
  let errorLine: number | undefined;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for error message starting with !
    if (line.startsWith('! ')) {
      errorMessage = line.substring(2).trim();

      // Look for line number in the next few lines
      for (let j = i + 1; j < Math.min(i + 15, lines.length); j++) {
        const nextLine = lines[j];

        // Pattern: l.123 ...
        const lineMatch = nextLine.match(/^l\.(\d+)\s*(.*)/);
        if (lineMatch) {
          errorLine = parseInt(lineMatch[1], 10);
          // If we have additional context, append it
          if (lineMatch[2] && !errorMessage.includes(lineMatch[2])) {
            errorMessage += ': ' + lineMatch[2].trim();
          }
          break;
        }
      }

      if (errorMessage) break;
    }

    // Pattern: ./file.tex:123: error message
    const fileErrorMatch = line.match(/\.tex:(\d+):\s*(.+)/);
    if (fileErrorMatch) {
      errorLine = parseInt(fileErrorMatch[1], 10);
      errorMessage = fileErrorMatch[2].trim();
      break;
    }

    // Pattern: line 123 (alternative format)
    const altLineMatch = line.match(/line\s+(\d+)/i);
    if (altLineMatch && !errorLine) {
      errorLine = parseInt(altLineMatch[1], 10);
    }
  }

  // If no specific error found, look for generic compilation failure indicators
  if (!errorMessage) {
    if (logs.includes('Emergency stop')) {
      errorMessage = 'LaTeX compilation stopped due to errors';
    } else if (logs.includes('Fatal error')) {
      errorMessage = 'Fatal LaTeX error occurred';
    } else {
      errorMessage = 'LaTeX compilation failed';
    }
  }

  return { line: errorLine, message: errorMessage };
}

// Cleanup old temporary files (older than 1 hour)
async function cleanupOldFiles(directory: string, maxAgeMs: number = 3600000) {
  try {
    const files = await fs.readdir(directory);
    const now = Date.now();

    for (const file of files) {
      const filePath = path.join(directory, file);
      try {
        const stats = await fs.stat(filePath);
        const age = now - stats.mtimeMs;

        if (age > maxAgeMs) {
          await fs.unlink(filePath);
          console.log(`Cleaned up old file: ${file}`);
        }
      } catch (err) {
        // Ignore errors for individual files
      }
    }
  } catch (err) {
    // Directory might not exist yet
  }
}

export async function compileLatex(latexContent: string, resumeId?: string): Promise<LaTeXCompilationResult> {
  const tempDir = path.join(PROJECT_ROOT, 'server', 'public', 'pdfs');

  // Use resumeId if provided, otherwise use UUID (for temporary compilations)
  const jobId = resumeId || `temp-${randomUUID()}`;
  const texFile = path.join(tempDir, `${jobId}.tex`);
  const pdfFile = path.join(tempDir, `${jobId}.pdf`);
  const publicPdfPath = `/pdfs/${jobId}.pdf`; // HTTP accessible path

  try {
    await fs.mkdir(tempDir, { recursive: true });

    // Cleanup old temporary files (async, don't wait)
    cleanupOldFiles(tempDir).catch(() => {});

    await fs.writeFile(texFile, latexContent);

    const isWindows = process.platform === "win32";
    const command = isWindows ? "where pdflatex" : "which pdflatex";
    try {
      await execAsync(command, { timeout: 5000 });

      // pdflatex is available, try to compile
      let stdout = '';
      let stderr = '';

      try {
        const result = await execAsync(
          `pdflatex -interaction=nonstopmode -output-directory=${tempDir} ${texFile}`,
          { timeout: 30000 }
        );
        stdout = result.stdout;
        stderr = result.stderr;
      } catch (execError: any) {
        // pdflatex command failed (syntax errors, etc.)
        stdout = execError.stdout || '';
        stderr = execError.stderr || '';
      }

      // Check if PDF was generated successfully
      try {
        await fs.access(pdfFile);

        // Clean up auxiliary files immediately (keep only .tex and .pdf)
        const auxFiles = ['.aux', '.log', '.out', '.toc', '.lof', '.lot'];
        for (const ext of auxFiles) {
          const auxFile = path.join(tempDir, `${jobId}${ext}`);
          await fs.unlink(auxFile).catch(() => {});
        }

        return {
          success: true,
          pdfPath: publicPdfPath,
          logs: stdout
        };
      } catch {
        // PDF was not generated - parse error from logs
        const errorInfo = parseLatexError(stdout + stderr);

        // Clean up failed compilation files
        await fs.unlink(texFile).catch(() => {});

        return {
          success: false,
          error: errorInfo.message || 'PDF generation failed',
          logs: stdout + stderr,
          errorLine: errorInfo.line,
          errorMessage: errorInfo.message
        };
      }
    } catch {
      console.log('LaTeX not available, creating mock PDF for development');
      const mockPdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(Resume PDF - LaTeX Compilation) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000125 00000 n 
0000000230 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
320
%%EOF`;
      
      await fs.writeFile(pdfFile, mockPdfContent);
      
      return {
        success: true,
        pdfPath: publicPdfPath, // Return HTTP path, not file system path
        logs: 'Mock PDF generated for development (LaTeX not installed)'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: `Compilation error: ${error}`,
      logs: error instanceof Error ? error.message : String(error)
    };
  }
}

export function extractSections(latexContent: string): Array<{ name: string; content: string; startLine: number; endLine: number }> {
  const lines = latexContent.split('\n');
  const sections: Array<{ name: string; content: string; startLine: number; endLine: number }> = [];

  // Regex to match \section{} and \section*{} commands
  const sectionRegex = /\\section\*?\{([^}]+)\}/;

  const sectionLines: Array<{ lineIndex: number; name: string }> = [];

  // Find all section lines
  lines.forEach((line, index) => {
    const match = line.match(sectionRegex);
    if (match) {
      sectionLines.push({
        lineIndex: index,
        name: match[1].trim()
      });
    }
  });

  // Extract content between sections
  for (let i = 0; i < sectionLines.length; i++) {
    const currentSection = sectionLines[i];
    const nextSection = sectionLines[i + 1];

    const startLine = currentSection.lineIndex;
    const endLine = nextSection ? nextSection.lineIndex : lines.length;

    // Get content from the line after the section header to the line before the next section
    const contentStartLine = startLine + 1;
    const contentEndLine = endLine;

    const content = lines.slice(contentStartLine, contentEndLine).join('\n').trim();

    if (content) {
      sections.push({
        name: currentSection.name,
        content,
        startLine: contentStartLine,
        endLine: contentEndLine - 1
      });
    }
  }

  return sections;
}

export function updateSectionInLatex(
  latexContent: string,
  sectionName: string,
  newContent: string
): string {
  const lines = latexContent.split('\n');
  const sections = extractSections(latexContent);
  
  const section = sections.find(s => s.name === sectionName);
  if (!section) return latexContent;

  // Replace the section content
  const newLines = [
    ...lines.slice(0, section.startLine),
    newContent,
    ...lines.slice(section.endLine + 1)
  ];

  return newLines.join('\n');
}


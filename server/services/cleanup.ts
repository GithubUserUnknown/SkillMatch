import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get the directory path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../..');

/**
 * Cleanup service for temporary files
 * Prevents disk space issues on Render by removing old temporary files
 */

export interface CleanupOptions {
  maxAgeMs?: number; // Maximum age of files in milliseconds (default: 1 hour)
  dryRun?: boolean;  // If true, only log what would be deleted
}

/**
 * Clean up old files in a directory
 * @param directory - Directory to clean
 * @param options - Cleanup options
 * @returns Number of files deleted
 */
export async function cleanupDirectory(
  directory: string,
  options: CleanupOptions = {}
): Promise<number> {
  const { maxAgeMs = 3600000, dryRun = false } = options; // Default: 1 hour
  let deletedCount = 0;

  try {
    // Check if directory exists
    try {
      await fs.access(directory);
    } catch {
      // Directory doesn't exist, nothing to clean
      return 0;
    }

    const files = await fs.readdir(directory);
    const now = Date.now();

    for (const file of files) {
      // Skip .gitkeep files
      if (file === '.gitkeep') continue;

      const filePath = path.join(directory, file);

      try {
        const stats = await fs.stat(filePath);

        // Skip directories
        if (stats.isDirectory()) continue;

        const age = now - stats.mtimeMs;

        if (age > maxAgeMs) {
          if (dryRun) {
            console.log(`[DRY RUN] Would delete: ${file} (age: ${Math.round(age / 1000)}s)`);
          } else {
            await fs.unlink(filePath);
            console.log(`Deleted old file: ${file} (age: ${Math.round(age / 1000)}s)`);
          }
          deletedCount++;
        }
      } catch (err) {
        // Ignore errors for individual files (might be deleted by another process)
        console.warn(`Failed to process file ${file}:`, err);
      }
    }

    if (deletedCount > 0) {
      console.log(`Cleanup complete: ${deletedCount} files ${dryRun ? 'would be' : ''} deleted from ${directory}`);
    }

    return deletedCount;
  } catch (err) {
    console.error(`Cleanup failed for ${directory}:`, err);
    return 0;
  }
}

/**
 * Clean up all temporary directories
 * @param options - Cleanup options
 */
export async function cleanupAllTempFiles(options: CleanupOptions = {}): Promise<void> {
  const directories = [
    path.join(PROJECT_ROOT, 'server', 'public', 'pdfs'),
    path.join(PROJECT_ROOT, 'uploads'),
    path.join(PROJECT_ROOT, 'temp'),
  ];

  console.log('Starting cleanup of temporary files...');

  for (const dir of directories) {
    await cleanupDirectory(dir, options);
  }

  console.log('Cleanup complete.');
}

/**
 * Start periodic cleanup task
 * Runs cleanup every interval
 * @param intervalMs - Interval in milliseconds (default: 30 minutes)
 * @param maxAgeMs - Maximum age of files (default: 1 hour)
 */
export function startPeriodicCleanup(
  intervalMs: number = 1800000, // 30 minutes
  maxAgeMs: number = 3600000     // 1 hour
): NodeJS.Timeout {
  console.log(`Starting periodic cleanup task (interval: ${intervalMs / 1000}s, max age: ${maxAgeMs / 1000}s)`);

  // Run cleanup immediately
  cleanupAllTempFiles({ maxAgeMs }).catch(err => {
    console.error('Initial cleanup failed:', err);
  });

  // Schedule periodic cleanup
  const interval = setInterval(() => {
    cleanupAllTempFiles({ maxAgeMs }).catch(err => {
      console.error('Periodic cleanup failed:', err);
    });
  }, intervalMs);

  return interval;
}

/**
 * Clean up files for a specific resume
 * Useful when deleting a resume
 * @param resumeId - Resume ID
 */
export async function cleanupResumeFiles(resumeId: string): Promise<void> {
  const pdfsDir = path.join(PROJECT_ROOT, 'server', 'public', 'pdfs');

  try {
    const files = await fs.readdir(pdfsDir);

    for (const file of files) {
      if (file.startsWith(resumeId)) {
        const filePath = path.join(pdfsDir, file);
        await fs.unlink(filePath);
        console.log(`Deleted resume file: ${file}`);
      }
    }
  } catch (err) {
    console.error(`Failed to cleanup files for resume ${resumeId}:`, err);
  }
}


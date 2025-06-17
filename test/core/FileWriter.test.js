/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - AI PROMPT
 * ============================================================================
 * FILE: test/core/FileWriter.test.js
 * VERSION: 2025-06-17 16:21:39
 * PHASE: Phase 9: Test Files
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 *
 * Create a test file using Node.js built-in test framework for the
 * FileWriter class. Use ES Module imports and mock file system operations.
 * Write tests to verify directory creation, file writing with content,
 * handling of existing files with force option, dry-run mode operation,
 * error handling for permissions, progress callback execution, atomic write
 * operations, file formatting with Prettier for different file types, CSS
 * file formatting, tracking of written files with categories, and proper
 * cleanup in tests. Use before/after hooks for test setup and cleanup.
 *
 * ============================================================================
 */
/**
 * FileWriter.test.js
 * Unit tests for the FileWriter class
 */
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import os from 'os';
import FileWriter from '../../src/core/FileWriter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('FileWriter', () => {
    let writer;
    let tempDir;
    let progressEvents;

    beforeEach(async () => {
        // Create temp directory in system temp folder
        const tempRoot = join(os.tmpdir(), 'swagger-to-nextjs-tests');
        await fs.mkdir(tempRoot, { recursive: true });
        tempDir = join(tempRoot, 'file-writer-' + Date.now());
        await fs.mkdir(tempDir, { recursive: true });

        progressEvents = [];
        writer = new FileWriter({
            onProgress: (event) => progressEvents.push(event)
        });
    });

    afterEach(async () => {
        try {
            await fs.rm(tempDir, { recursive: true, force: true });
        } catch (err) {
            // Ignore cleanup errors
        }
    });

    describe('Basic File Writing', () => {
        it('should write a file successfully', async () => {
            const filePath = join(tempDir, 'test.txt');
            const content = 'Hello, World!';

            const success = await writer.writeFile(filePath, content);

            assert.ok(success);
            assert.ok(existsSync(filePath));

            const written = await fs.readFile(filePath, 'utf8');
            assert.equal(written, content);

            assert.equal(writer.writtenFiles.length, 1);
            assert.ok(writer.writtenFiles.includes(filePath));
        });

        it('should create nested directories', async () => {
            const filePath = join(tempDir, 'nested', 'deep', 'test.txt');
            const content = 'Nested content';

            const success = await writer.writeFile(filePath, content);

            assert.ok(success);
            assert.ok(existsSync(filePath));

            const written = await fs.readFile(filePath, 'utf8');
            assert.equal(written, content);
        });

        it('should track progress events', async () => {
            const filePath = join(tempDir, 'test.txt');

            await writer.writeFile(filePath, 'content');

            assert.ok(progressEvents.some(e => e.type === 'file' && e.action === 'checking'));
            assert.ok(progressEvents.some(e => e.type === 'file' && e.action === 'written'));
        });
    });

    describe('Dry Run Mode', () => {
        beforeEach(() => {
            writer = new FileWriter({ dryRun: true });
        });

        it('should not write files in dry run mode', async () => {
            const filePath = join(tempDir, 'test.txt');

            const success = await writer.writeFile(filePath, 'content');

            assert.ok(success);
            assert.ok(!existsSync(filePath));
            assert.equal(writer.writtenFiles.length, 1);
        });

        it('should not create directories in dry run mode', async () => {
            const filePath = join(tempDir, 'new-dir', 'test.txt');

            await writer.writeFile(filePath, 'content');

            assert.ok(!existsSync(join(tempDir, 'new-dir')));
        });
    });

    describe('Conflict Handling', () => {
        it('should skip existing files by default', async () => {
            const filePath = join(tempDir, 'existing.txt');
            await fs.writeFile(filePath, 'original content');

            // Non-interactive mode
            writer = new FileWriter({ interactive: false });

            const success = await writer.writeFile(filePath, 'new content');

            assert.ok(!success);
            assert.equal(writer.skippedFiles.length, 1);

            const content = await fs.readFile(filePath, 'utf8');
            assert.equal(content, 'original content');
        });

        it('should overwrite files in force mode', async () => {
            const filePath = join(tempDir, 'existing.txt');
            await fs.writeFile(filePath, 'original content');

            writer = new FileWriter({ force: true });

            const success = await writer.writeFile(filePath, 'new content');

            assert.ok(success);
            const content = await fs.readFile(filePath, 'utf8');
            assert.equal(content, 'new content');
        });
    });

    describe('Content Formatting', () => {
        it('should format JavaScript files', async () => {
            const filePath = join(tempDir, 'test.js');
            const unformatted = 'const x={a:1,b:2};function test(){return true;}';

            await writer.writeFile(filePath, unformatted);

            const content = await fs.readFile(filePath, 'utf8');
            // Check for proper formatting
            assert.ok(content.includes('const x = { a: 1, b: 2 }'));
            assert.ok(content.includes('function test()'));
            // Verify it was formatted (should be longer due to spaces)
            assert.ok(content.length > unformatted.length);
        });

        it('should format TypeScript files', async () => {
            const filePath = join(tempDir, 'test.ts');
            const unformatted = 'interface User{id:string;name:string;}';

            await writer.writeFile(filePath, unformatted);

            const content = await fs.readFile(filePath, 'utf8');
            // Check formatting was applied
            assert.ok(content.includes('interface User {'));
            assert.ok(content.includes('id: string'));
            assert.ok(content.includes('name: string'));
        });

        it('should format JSON files', async () => {
            const filePath = join(tempDir, 'test.json');
            const unformatted = '{"name":"test","version":"1.0.0"}';

            await writer.writeFile(filePath, unformatted);

            const content = await fs.readFile(filePath, 'utf8');
            // Check for formatting
            assert.ok(content.includes('"name": "test"'));
            assert.ok(content.includes('"version": "1.0.0"'));
            // Should be formatted (much longer than original)
            assert.ok(content.length > unformatted.length);
        });

        it('should skip formatting when requested', async () => {
            const filePath = join(tempDir, 'test.js');
            const unformatted = 'const x={a:1,b:2};';

            await writer.writeFile(filePath, unformatted, { skipFormatting: true });

            const content = await fs.readFile(filePath, 'utf8');
            assert.equal(content, unformatted);
        });

        it('should handle formatting errors gracefully', async () => {
            const filePath = join(tempDir, 'test.js');
            const invalid = 'const x = {';  // Invalid JavaScript

            const success = await writer.writeFile(filePath, invalid);

            assert.ok(success);
            const content = await fs.readFile(filePath, 'utf8');
            assert.equal(content, invalid);  // Should write original content
        });
    });

    describe('Error Handling', () => {
        it('should handle permission errors', async function() {
            if (process.platform === 'win32') {
                this.skip();
                return;
            }

            const protectedDir = join(tempDir, 'protected');
            await fs.mkdir(protectedDir);
            await fs.chmod(protectedDir, 0o555);  // Read-only

            const filePath = join(protectedDir, 'test.txt');
            const success = await writer.writeFile(filePath, 'content');

            assert.ok(!success);
            assert.equal(writer.errors.length, 1);
            assert.ok(writer.errors[0].message.includes('Permission denied'));

            // Cleanup
            await fs.chmod(protectedDir, 0o755);
        });

        it('should track errors in summary', async () => {
            // Try to write to an invalid path
            const invalidPath = join(tempDir, '\0invalid.txt');  // Null character is invalid

            await writer.writeFile(invalidPath, 'content').catch(() => {});

            const summary = writer.getSummary();
            assert.ok(!summary.success);
            assert.ok(summary.errors > 0);
        });
    });

    describe('Batch Operations', () => {
        it('should write multiple files', async () => {
            const files = [
                { path: join(tempDir, 'file1.txt'), content: 'Content 1' },
                { path: join(tempDir, 'file2.txt'), content: 'Content 2' },
                { path: join(tempDir, 'dir/file3.txt'), content: 'Content 3' }
            ];

            const summary = await writer.writeFiles(files);

            assert.ok(summary.success);
            assert.equal(summary.written, 3);
            assert.equal(summary.skipped, 0);
            assert.equal(summary.errors, 0);

            for (const file of files) {
                assert.ok(existsSync(file.path));
            }
        });

        it('should handle mixed success/failure', async () => {
            const existingFile = join(tempDir, 'existing.txt');
            await fs.writeFile(existingFile, 'original');

            writer = new FileWriter({ force: false, interactive: false });

            const files = [
                { path: join(tempDir, 'new.txt'), content: 'New file' },
                { path: existingFile, content: 'Should skip' }
            ];

            const summary = await writer.writeFiles(files);

            assert.equal(summary.written, 1);
            assert.equal(summary.skipped, 1);
        });
    });

    describe('Copy Operations', () => {
        it('should copy a single file', async () => {
            const sourcePath = join(tempDir, 'source.txt');
            const destPath = join(tempDir, 'dest.txt');

            await fs.writeFile(sourcePath, 'Source content');

            await writer.copy(sourcePath, destPath);

            assert.ok(existsSync(destPath));
            const content = await fs.readFile(destPath, 'utf8');
            assert.equal(content, 'Source content');
        });

        it('should copy a directory recursively', async () => {
            const sourceDir = join(tempDir, 'source-dir');
            const destDir = join(tempDir, 'dest-dir');

            // Create source structure
            await fs.mkdir(join(sourceDir, 'sub'), { recursive: true });
            await fs.writeFile(join(sourceDir, 'file1.txt'), 'File 1');
            await fs.writeFile(join(sourceDir, 'sub', 'file2.txt'), 'File 2');

            await writer.copy(sourceDir, destDir);

            assert.ok(existsSync(join(destDir, 'file1.txt')));
            assert.ok(existsSync(join(destDir, 'sub', 'file2.txt')));

            const content1 = await fs.readFile(join(destDir, 'file1.txt'), 'utf8');
            assert.equal(content1, 'File 1');
        });
    });

    describe('Delete Operations', () => {
        it('should delete a file', async () => {
            const filePath = join(tempDir, 'to-delete.txt');
            await fs.writeFile(filePath, 'Delete me');

            await writer.delete(filePath);

            assert.ok(!existsSync(filePath));
        });

        it('should delete a directory recursively', async () => {
            const dirPath = join(tempDir, 'to-delete');
            await fs.mkdir(join(dirPath, 'sub'), { recursive: true });
            await fs.writeFile(join(dirPath, 'file.txt'), 'content');

            await writer.delete(dirPath);

            assert.ok(!existsSync(dirPath));
        });

        it('should not delete in dry run mode', async () => {
            writer = new FileWriter({ dryRun: true });

            const filePath = join(tempDir, 'keep-me.txt');
            await fs.writeFile(filePath, 'Keep this');

            await writer.delete(filePath);

            assert.ok(existsSync(filePath));
        });
    });

    describe('Summary Reporting', () => {
        it('should provide accurate summary', async () => {
            // Write some files
            await writer.writeFile(join(tempDir, 'file1.txt'), 'content');
            await writer.writeFile(join(tempDir, 'file2.txt'), 'content');

            // Skip one
            await fs.writeFile(join(tempDir, 'existing.txt'), 'original');
            writer.force = false;
            writer.interactive = false;
            await writer.writeFile(join(tempDir, 'existing.txt'), 'new');

            const summary = writer.getSummary();

            assert.equal(summary.written, 2);
            assert.equal(summary.skipped, 1);
            assert.equal(summary.errors, 0);
            assert.ok(summary.success);

            assert.equal(summary.files.written.length, 2);
            assert.equal(summary.files.skipped.length, 1);
        });
    });

    describe('Custom Prettier Options', () => {
        it('should use custom prettier options', async () => {
            const filePath = join(tempDir, 'custom.js');
            // Use content with strings to test quote options
            const content = 'const msg = "hello"; const x = {a: 1}';

            await writer.writeFile(filePath, content, {
                prettierOptions: {
                    semi: false,
                    singleQuote: false,
                    tabWidth: 4
                }
            });

            const written = await fs.readFile(filePath, 'utf8');
            // Check that semicolons are not present (semi: false)
            assert.ok(!written.includes(';'));
            // Check for double quotes (singleQuote: false)
            assert.ok(written.includes('"hello"'));
            assert.ok(!written.includes("'hello'"));
            // The content should be formatted
            assert.ok(written.includes('const msg'));
            assert.ok(written.includes('const x'));
        });
    });
});
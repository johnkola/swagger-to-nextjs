/**
 * FileWriter.test.js
 * Unit tests for the FileWriter class including timestamp functionality
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
            onProgress: (event) => progressEvents.push(event),
            useTimestamp: false // Disable timestamp by default for most tests
        });
    });

    afterEach(async () => {
        try {
            await fs.rm(tempDir, { recursive: true, force: true });
            // Clean up any timestamped directories
            const tempRoot = join(os.tmpdir(), 'swagger-to-nextjs-tests');
            const entries = await fs.readdir(tempRoot);
            for (const entry of entries) {
                if (entry.includes('-20')) { // Likely a timestamped directory
                    await fs.rm(join(tempRoot, entry), { recursive: true, force: true }).catch(() => {});
                }
            }
        } catch (err) {
            // Ignore cleanup errors
        }
    });

    // Here's the corrected test section with better isolation and debugging

    describe('Timestamp Functionality', () => {
        it('should generate valid timestamp', async () => {
            const timestampWriter = new FileWriter({ useTimestamp: true });
            const timestamp = timestampWriter.generateTimestamp();

            // Check format YYYYMMDD-HHmmss
            assert.match(timestamp, /^\d{8}-\d{6}$/);

            // Check it represents a valid date
            const year = parseInt(timestamp.substring(0, 4));
            const month = parseInt(timestamp.substring(4, 6));
            const day = parseInt(timestamp.substring(6, 8));

            assert.ok(year >= 2020 && year <= 2030);
            assert.ok(month >= 1 && month <= 12);
            assert.ok(day >= 1 && day <= 31);
        });

        it('should create timestamped output directory', async () => {
            const timestampWriter = new FileWriter({ useTimestamp: true });
            const baseDir = join(tempDir, 'my-app');

            const outputDir = timestampWriter.initializeOutputDirectory(baseDir);

            // Should have timestamp appended
            assert.ok(outputDir.includes('my-app-'));
            assert.match(outputDir, /my-app-\d{8}-\d{6}$/);
            assert.notEqual(outputDir, baseDir);
        });

        it('should write files to timestamped directory', async () => {
            const timestampWriter = new FileWriter({ useTimestamp: true });
            const baseDir = join(tempDir, 'my-app-ts');
            const outputDir = timestampWriter.initializeOutputDirectory(baseDir);

            // Write a file using the original path
            const filePath = join(baseDir, 'test.txt');
            await timestampWriter.writeFile(filePath, 'content');

            // File should exist in timestamped directory
            const actualPath = join(outputDir, 'test.txt');
            assert.ok(existsSync(actualPath));
            assert.ok(!existsSync(filePath)); // Should not exist at original path

            const content = await fs.readFile(actualPath, 'utf8');
            assert.equal(content, 'content');
        });

        it('should return same directory on multiple calls', async () => {
            const timestampWriter = new FileWriter({ useTimestamp: true });
            const baseDir = join(tempDir, 'my-app-multi');

            const dir1 = timestampWriter.initializeOutputDirectory(baseDir);
            const dir2 = timestampWriter.initializeOutputDirectory(baseDir);

            assert.equal(dir1, dir2);
        });

        it('should work without timestamp when disabled', async () => {
            // Create a completely new writer instance for this test
            const noTimestampWriter = new FileWriter({ useTimestamp: false });
            const baseDir = join(tempDir, 'my-app-no-ts');

            const outputDir = noTimestampWriter.initializeOutputDirectory(baseDir);

            // Debug output
            console.log('Test: without timestamp');
            console.log('baseDir:', baseDir);
            console.log('outputDir:', outputDir);
            console.log('useTimestamp:', noTimestampWriter.options.useTimestamp);

            assert.equal(outputDir, baseDir, 'Output directory should be same as base directory when timestamp is disabled');

            // Write a file and verify it goes to the original location
            const filePath = join(baseDir, 'test.txt');
            await noTimestampWriter.writeFile(filePath, 'content');

            assert.ok(existsSync(filePath));
        });

        it('should include timestamp in summary', async () => {
            const timestampWriter = new FileWriter({ useTimestamp: true });
            const baseDir = join(tempDir, 'my-app-summary');
            timestampWriter.initializeOutputDirectory(baseDir);

            await timestampWriter.writeFile(join(baseDir, 'test.txt'), 'content');

            const summary = timestampWriter.getSummary();
            assert.ok(summary.timestamp);
            assert.ok(summary.outputDirectory.includes(summary.timestamp));
        });
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
            writer = new FileWriter({ dryRun: true, useTimestamp: false });
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
            writer = new FileWriter({ interactive: false, useTimestamp: false });

            const success = await writer.writeFile(filePath, 'new content');

            assert.ok(!success);
            assert.equal(writer.skippedFiles.length, 1);

            const content = await fs.readFile(filePath, 'utf8');
            assert.equal(content, 'original content');
        });

        it('should overwrite files in force mode', async () => {
            const filePath = join(tempDir, 'existing.txt');
            await fs.writeFile(filePath, 'original content');

            writer = new FileWriter({ force: true, useTimestamp: false });

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
            assert.ok(writer.errors[0].error.includes('EACCES') || writer.errors[0].error.includes('Permission denied'));

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

            writer = new FileWriter({ force: false, interactive: false, useTimestamp: false });

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

        it('should copy to timestamped directory', async () => {
            writer = new FileWriter({ useTimestamp: true });
            const baseDir = join(tempDir, 'output');
            const outputDir = writer.initializeOutputDirectory(baseDir);

            const sourcePath = join(tempDir, 'source.txt');
            const destPath = join(baseDir, 'dest.txt');

            await fs.writeFile(sourcePath, 'Source content');
            await writer.copy(sourcePath, destPath);

            // Should exist in timestamped directory
            const actualPath = writer.getOutputPath(destPath);
            assert.ok(existsSync(actualPath));
            assert.ok(actualPath.includes(writer.timestamp));

            const content = await fs.readFile(actualPath, 'utf8');
            assert.equal(content, 'Source content');
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
            writer = new FileWriter({ dryRun: true, useTimestamp: false });

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

        it('should handle different prettier options per file', async () => {
            // File with semicolons
            const file1 = join(tempDir, 'with-semi.js');
            await writer.writeFile(file1, 'const a = 1', {
                prettierOptions: { semi: true }
            });

            // File without semicolons
            const file2 = join(tempDir, 'no-semi.js');
            await writer.writeFile(file2, 'const b = 2', {
                prettierOptions: { semi: false }
            });

            const content1 = await fs.readFile(file1, 'utf8');
            const content2 = await fs.readFile(file2, 'utf8');

            assert.ok(content1.includes(';'));
            assert.ok(!content2.includes(';'));
        });
    });

    describe('Reset Functionality', () => {
        it('should reset all state', async () => {
            writer = new FileWriter({ useTimestamp: true });
            const baseDir = join(tempDir, 'app');
            writer.initializeOutputDirectory(baseDir);

            await writer.writeFile(join(baseDir, 'test.txt'), 'content');

            // Verify state is populated
            assert.ok(writer.writtenFiles.length > 0);
            assert.ok(writer.baseOutputDir);
            assert.ok(writer.timestamp);

            // Reset
            writer.reset();

            // Verify state is cleared
            assert.equal(writer.writtenFiles.length, 0);
            assert.equal(writer.skippedFiles.length, 0);
            assert.equal(writer.errors.length, 0);
            assert.equal(writer.baseOutputDir, null);
            assert.equal(writer.timestamp, null);
        });
    });
});
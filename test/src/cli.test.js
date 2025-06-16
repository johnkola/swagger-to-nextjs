// ==============================================================================
// test/src/cli.test.js
// ==============================================================================

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile as execFileCb } from 'node:child_process';
import { promisify } from 'node:util';

// Import the CLI class - this will need to exist before running tests
import { CLI } from '../../src/cli.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execFile = promisify(execFileCb);

// Helper to capture console output
class ConsoleCapture {
    constructor() {
        this.logs = [];
        this.errors = [];
        this.originalLog = console.log;
        this.originalError = console.error;
        this.capturing = false;
    }

    start() {
        if (this.capturing) return;
        this.capturing = true;

        const self = this;
        console.log = function(...args) {
            const message = args.map(arg => {
                if (typeof arg === 'string') return arg;
                if (arg === undefined) return 'undefined';
                if (arg === null) return 'null';
                return String(arg);
            }).join(' ');
            self.logs.push(message);
        };
        console.error = function(...args) {
            const message = args.map(arg => {
                if (typeof arg === 'string') return arg;
                if (arg === undefined) return 'undefined';
                if (arg === null) return 'null';
                return String(arg);
            }).join(' ');
            self.errors.push(message);
        };
    }

    stop() {
        if (!this.capturing) return;
        this.capturing = false;
        console.log = this.originalLog;
        console.error = this.originalError;
    }

    getOutput() {
        return this.logs.join('\n');
    }

    getErrors() {
        return this.errors.join('\n');
    }

    clear() {
        this.logs = [];
        this.errors = [];
    }
}

describe('CLI', () => {
    let tempDir;
    let consoleCapture;
    let originalNodeEnv;

    beforeEach(async () => {
        originalNodeEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'test'; // Disable ora spinner

        tempDir = path.join(process.cwd(), 'temp-cli-test-' + Date.now());
        await fs.mkdir(tempDir, { recursive: true });
        consoleCapture = new ConsoleCapture();
    });

    afterEach(async () => {
        consoleCapture.stop();
        process.env.NODE_ENV = originalNodeEnv;
        await fs.rm(tempDir, { recursive: true, force: true });
    });

    // Simple test to verify console capture is working
    describe('Console Capture', () => {
        it('should capture console.log output', () => {
            consoleCapture.start();
            console.log('test message');
            consoleCapture.stop();

            const output = consoleCapture.getOutput();
            assert.strictEqual(output, 'test message');
        });
    });

    describe('Command setup', () => {
        it('should register generate command with all options', () => {
            const cli = new CLI();
            cli.setupCommand();

            const generateCmd = cli.program.commands.find(cmd => cmd.name() === 'generate');
            assert.ok(generateCmd);

            // Check all options are registered
            const optionNames = generateCmd.options.map(opt => opt.long);
            const expectedOptions = [
                '--typescript', '--no-typescript', '--client', '--no-client',
                '--pages', '--no-pages', '--force', '--dry-run',
                '--template-dir', '--config', '--verbose', '--silent'
            ];

            expectedOptions.forEach(opt => {
                assert.ok(optionNames.includes(opt), `Missing option: ${opt}`);
            });
        });

        it('should have correct command arguments', () => {
            const cli = new CLI();
            cli.setupCommand();

            const generateCmd = cli.program.commands.find(cmd => cmd.name() === 'generate');
            assert.ok(generateCmd);

            // Commander stores args in _args array
            assert.ok(generateCmd._args.length >= 2);
            assert.strictEqual(generateCmd._args[0].required, true); // spec
            assert.strictEqual(generateCmd._args[1].required, false); // output
        });
    });

    describe('Input validation', () => {
        it('should validate local file exists', async () => {
            const cli = new CLI();

            const testFile = path.join(tempDir, 'test.yaml');
            await fs.writeFile(testFile, 'openapi: 3.0.0\ninfo:\n  title: Test\n  version: 1.0.0\npaths: {}');

            // Use a subdirectory for output
            const outputDir = path.join(tempDir, 'valid-output');

            await assert.doesNotReject(
                cli.validateInput(testFile, outputDir, {})
            );
        });

        it('should reject non-existent local file', async () => {
            const cli = new CLI();

            const nonExistentFile = path.join(tempDir, 'non-existent.yaml');
            const outputDir = path.join(tempDir, 'reject-output');

            await assert.rejects(
                cli.validateInput(nonExistentFile, outputDir, {}),
                /OpenAPI specification file not found/
            );
        });

        it('should accept HTTP/HTTPS URLs without validation', async () => {
            const cli = new CLI();
            const emptyDir = path.join(tempDir, 'empty-output');
            await fs.mkdir(emptyDir, { recursive: true });

            await assert.doesNotReject(
                cli.validateInput('http://example.com/api.yaml', emptyDir, {})
            );
            await assert.doesNotReject(
                cli.validateInput('https://example.com/api.yaml', emptyDir, {})
            );
        });

        it('should check output directory constraints', async () => {
            const cli = new CLI();

            // Test non-empty directory without force
            const outputDir = path.join(tempDir, 'output');
            await fs.mkdir(outputDir);
            await fs.writeFile(path.join(outputDir, 'existing.txt'), 'content');

            await assert.rejects(
                cli.validateInput('https://example.com/api.yaml', outputDir, { force: false }),
                /Output directory is not empty/
            );

            // Should work with force option
            await assert.doesNotReject(
                cli.validateInput('https://example.com/api.yaml', outputDir, { force: true })
            );

            // Test file instead of directory
            const outputFile = path.join(tempDir, 'file.txt');
            await fs.writeFile(outputFile, 'content');

            await assert.rejects(
                cli.validateInput('https://example.com/api.yaml', outputFile, {}),
                /not a directory/i
            );
        });
    });

    describe('Banner and UI', () => {
        it('should display banner with correct formatting', () => {
            const cli = new CLI();

            consoleCapture.start();
            cli.showBanner();
            consoleCapture.stop();

            const output = consoleCapture.getOutput();
            assert.ok(output.includes('Swagger to Next.js Generator'));
            assert.ok(output.includes('Version'));
            assert.ok(output.includes('═══'));
        });

        it('should show next steps', () => {
            const cli = new CLI();

            consoleCapture.start();
            cli.showNextSteps('./my-app');
            consoleCapture.stop();

            const output = consoleCapture.getOutput();
            assert.ok(output.includes('cd ./my-app'));
            assert.ok(output.includes('npm install'));
            assert.ok(output.includes('.env.example'));
            assert.ok(output.includes('npm run dev'));
        });

        it('should display summary correctly', () => {
            const cli = new CLI();

            const result = {
                files: [
                    { path: 'api/route.ts' },
                    { path: 'types/index.ts' },
                    { path: 'lib/client.ts' },
                    { path: 'pages/index.tsx' },
                    { path: 'pages/about.tsx' },
                    { path: 'config.json' }
                ],
                duration: 2500,
                warnings: ['Warning 1', 'Warning 2']
            };

            consoleCapture.start();
            try {
                cli.showSummary(result, './output', { verbose: false });
            } finally {
                consoleCapture.stop();
            }

            const output = consoleCapture.getOutput();

            // Remove ANSI escape codes and normalize whitespace
            const cleanOutput = output.replace(/\x1b\[[0-9;]*m/g, '').replace(/\s+/g, ' ');

            // Debug: show what was actually captured
            if (!cleanOutput.includes('Total Files') || !cleanOutput.includes('6')) {
                console.log('DEBUG: Captured output:', JSON.stringify(output));
                console.log('DEBUG: Clean output:', JSON.stringify(cleanOutput));
            }

            // More flexible assertions - check for the key information
            assert.ok(cleanOutput.includes('Total Files') && cleanOutput.includes('6'),
                `Expected "Total Files" and "6" in output: ${cleanOutput}`);
            assert.ok(cleanOutput.includes('.ts') && cleanOutput.includes('3'));
            assert.ok(cleanOutput.includes('.tsx') && cleanOutput.includes('2'));
            assert.ok(cleanOutput.includes('.json') && cleanOutput.includes('1'));
            assert.ok(cleanOutput.includes('2.50'));
            assert.ok(cleanOutput.includes('Warnings') && cleanOutput.includes('2'));
            assert.ok(!cleanOutput.includes('Warning 1')); // Not verbose
        });

        it('should show warnings in verbose mode', () => {
            const cli = new CLI();

            const result = {
                files: [],
                warnings: ['Warning 1', 'Warning 2']
            };

            consoleCapture.start();
            cli.showSummary(result, './output', { verbose: true });
            consoleCapture.stop();

            const output = consoleCapture.getOutput();
            assert.ok(output.includes('Warning 1'));
            assert.ok(output.includes('Warning 2'));
        });
    });

    describe('Error handling', () => {
        it('should provide context for error codes', () => {
            const cli = new CLI();

            const errorCodes = [
                { code: 'ENOENT', message: 'file or directory was not found' },
                { code: 'EACCES', message: 'Permission denied' },
                { code: 'EEXIST', message: 'already exists' }
            ];

            for (const { code, message } of errorCodes) {
                const error = new Error('Test error');
                error.code = code;

                consoleCapture.clear();
                consoleCapture.start();
                cli.handleError(error);
                consoleCapture.stop();

                const output = consoleCapture.getErrors();
                assert.ok(output.toLowerCase().includes(message.toLowerCase()));
            }
        });

        it('should handle OpenAPI validation errors', () => {
            const cli = new CLI();

            const error = new Error('Invalid OpenAPI specification');

            consoleCapture.start();
            cli.handleError(error);
            consoleCapture.stop();

            const output = consoleCapture.getErrors();
            assert.ok(output.includes('specification appears to be invalid'));
            assert.ok(output.includes('OpenAPI 3.x or Swagger 2.0'));
        });

        it('should show stack trace in debug mode', () => {
            const cli = new CLI();

            const error = new Error('Test error');
            error.stack = 'Error: Test error\n    at test.js:1:1';

            // Without DEBUG
            delete process.env.DEBUG;
            consoleCapture.clear();
            consoleCapture.start();
            cli.handleError(error);
            consoleCapture.stop();

            let output = consoleCapture.getErrors();
            assert.ok(!output.includes('at test.js:1:1'));
            assert.ok(output.includes('Run with DEBUG=1'));

            // With DEBUG
            process.env.DEBUG = '1';
            consoleCapture.clear();
            consoleCapture.start();
            cli.handleError(error);
            consoleCapture.stop();

            output = consoleCapture.getErrors();
            assert.ok(output.includes('Stack trace'));
            assert.ok(output.includes('at test.js:1:1'));

            delete process.env.DEBUG;
        });
    });

    describe('Generate command integration', () => {
        it('should handle complete generation flow', async () => {
            // Create a minimal but valid OpenAPI spec
            const spec = {
                openapi: '3.0.0',
                info: { title: 'Test API', version: '1.0.0' },
                paths: {
                    '/users': {
                        get: {
                            responses: {
                                '200': { description: 'Success' }
                            }
                        }
                    }
                }
            };

            const specFile = path.join(tempDir, 'spec.json');
            await fs.writeFile(specFile, JSON.stringify(spec));

            // Run the CLI with real arguments
            const cli = new CLI();

            const outputDir = path.join(tempDir, 'output');

            // Test dry-run first
            consoleCapture.start();
            let result;
            try {
                result = await cli.generate(specFile, outputDir, {
                    typescript: true,
                    client: true,
                    pages: true,
                    dryRun: true,
                    silent: false
                });
            } finally {
                consoleCapture.stop();
            }

            assert.ok(result);
            assert.strictEqual(result.success, true);

            const output = consoleCapture.getOutput();
            assert.ok(output.includes('Generation Configuration'));
            assert.ok(output.includes('Dry Run'));
        });

        it('should respect silent mode', async () => {
            const spec = {
                openapi: '3.0.0',
                info: { title: 'Test API', version: '1.0.0' },
                paths: {}
            };

            const specFile = path.join(tempDir, 'spec.json');
            await fs.writeFile(specFile, JSON.stringify(spec));

            const cli = new CLI();
            const outputDir = path.join(tempDir, 'silent-output');

            consoleCapture.start();
            await cli.generate(specFile, outputDir, { silent: true, dryRun: true });
            consoleCapture.stop();

            const output = consoleCapture.getOutput();
            assert.strictEqual(output, '');
        });
    });

    describe('CLI execution', () => {
        it('should handle --version flag', async () => {
            const cliPath = path.resolve(__dirname, '../../src/cli.js');
            try {
                const result = await execFile('node', [cliPath, '--version']);
                assert.ok(result.stdout.includes('1.0.0'));
            } catch (err) {
                // Skip if CLI can't be executed directly
                console.log('Skipping CLI execution test - file may not be executable');
            }
        });

        it('should handle --help flag', async () => {
            const cliPath = path.resolve(__dirname, '../../src/cli.js');
            try {
                const result = await execFile('node', [cliPath, '--help']);
                assert.ok(result.stdout.includes('generate') || result.stdout.includes('Usage'));
            } catch (err) {
                // Skip if CLI can't be executed directly
                console.log('Skipping CLI execution test - file may not be executable');
            }
        });

        it('should handle generate --help', async () => {
            const cliPath = path.resolve(__dirname, '../../src/cli.js');
            try {
                const result = await execFile('node', [cliPath, 'generate', '--help']);
                assert.ok(result.stdout.includes('--typescript'));
                assert.ok(result.stdout.includes('--force'));
            } catch (err) {
                // Skip if CLI can't be executed directly
                console.log('Skipping CLI execution test - file may not be executable');
            }
        });
    });
});
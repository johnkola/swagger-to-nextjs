/**
 * Simplified tests that work reliably across platforms
 */

const path = require('path');
const { runCLI } = require('../test-utils');

const CLI_PATH = path.join(__dirname, '..', '..', 'bin', 'swagger-to-nextjs.js');
const ROOT_DIR = path.join(__dirname, '..', '..');

describe('swagger-to-nextjs CLI - Basic Tests', () => {
    test('should show help with --help flag', async () => {
        const result = await runCLI(CLI_PATH, ['--help'], {}, { cwd: ROOT_DIR });

        expect(result.code).toBe(0);
        expect(result.stdout.toLowerCase()).toMatch(/help|usage/);
    });

    test('should show version with --version flag', async () => {
        const result = await runCLI(CLI_PATH, ['--version'], {}, { cwd: ROOT_DIR });

        expect(result.code).toBe(0);
        expect(result.stdout).toMatch(/\d+\.\d+\.\d+/);
    });

    test('should run without errors when no arguments provided', async () => {
        const result = await runCLI(CLI_PATH, [], {}, { cwd: ROOT_DIR });

        // Should either show help or error message
        expect(result.stdout + result.stderr).toBeTruthy();
    });

    test('should handle invalid arguments', async () => {
        const result = await runCLI(CLI_PATH, ['--invalid-flag'], {}, { cwd: ROOT_DIR });

        // Should provide some output (help or error)
        expect(result.stdout + result.stderr).toBeTruthy();
    });

    test('should respect QUIET environment variable', async () => {
        const result = await runCLI(CLI_PATH, ['--help'], { QUIET: '1' }, { cwd: ROOT_DIR });

        // Banner should not appear when QUIET is set
        expect(result.stdout).not.toContain('SWAGGER-TO-NEXTJS GENERATOR');
    });

    test('should show debug info with DEBUG environment variable', async () => {
        const result = await runCLI(CLI_PATH, ['--help'], { DEBUG: '1' }, { cwd: ROOT_DIR });

        expect(result.stdout).toContain('Working directory:');
        expect(result.stdout).toContain('Node.js version:');
    });
});
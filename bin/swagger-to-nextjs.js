#!/usr/bin/env node
/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - AI PROMPT
 * ============================================================================
 * FILE: bin/swagger-to-nextjs.js
 * VERSION: 2025-05-30 11:34:23
 * PHASE: PHASE 1: Foundation Components
 * CATEGORY: ⚙️ Core Configuration
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 *
 * Create a Node.js CLI executable script that:
 * - Uses proper shebang for cross-platform compatibility 
 * - Handles process arguments gracefully 
 * - Sets up proper error handling for uncaught exceptions 
 * - Configures the working directory context 
 * - Imports and launches the main CLI interface 
 * - Handles signals (SIGINT, SIGTERM) for graceful shutdown 
 * - Provides helpful error messages for common issues
 *
 * ============================================================================
 */

'use strict';

// Check Node.js version compatibility
const MIN_NODE_VERSION = '14.0.0';
const currentVersion = process.version.substring(1);

if (!isVersionCompatible(currentVersion, MIN_NODE_VERSION)) {
    console.error(`\n❌ Error: Node.js version ${MIN_NODE_VERSION} or higher is required.`);
    console.error(`   Current version: ${process.version}`);
    console.error(`   Please upgrade Node.js: https://nodejs.org/\n`);
    process.exit(1);
}

// Dependencies
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

// Ensure we're running from the correct context
const packagePath = path.join(__dirname, '..', 'package.json');
if (!fs.existsSync(packagePath)) {
    console.error(chalk.red('\n❌ Error: Unable to find package.json'));
    console.error(chalk.yellow('   This script must be run from the swagger-to-nextjs installation.\n'));
    process.exit(1);
}

// Load package info for version display
let packageInfo;
try {
    packageInfo = require(packagePath);
} catch (error) {
    console.error(chalk.red('\n❌ Error: Unable to load package.json'));
    console.error(chalk.yellow(`   ${error.message}\n`));
    process.exit(1);
}

// Setup process title for better process management
process.title = 'swagger-to-nextjs';

// Global error handlers
process.on('uncaughtException', (error) => {
    console.error(chalk.red('\n❌ Unexpected error occurred:'));
    console.error(chalk.red(`   ${error.message}`));

    if (process.env.DEBUG || process.env.VERBOSE) {
        console.error(chalk.gray('\nStack trace:'));
        console.error(chalk.gray(error.stack));
    } else {
        console.error(chalk.gray('\n   Run with DEBUG=1 for more details.'));
    }

    // Provide helpful suggestions based on error type
    if (error.code === 'MODULE_NOT_FOUND') {
        console.error(chalk.yellow('\n💡 Suggestion: Try running "npm install" to install dependencies.\n'));
    } else if (error.code === 'EACCES' || error.code === 'EPERM') {
        console.error(chalk.yellow('\n💡 Suggestion: Check file permissions or run with appropriate privileges.\n'));
    } else if (error.code === 'ENOENT') {
        console.error(chalk.yellow('\n💡 Suggestion: The specified file or directory was not found.\n'));
    }

    gracefulShutdown(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error(chalk.red('\n❌ Unhandled promise rejection:'));
    console.error(chalk.red(`   ${reason}`));

    if (process.env.DEBUG || process.env.VERBOSE) {
        console.error(chalk.gray('\nPromise:'), promise);
    }

    gracefulShutdown(1);
});

// Signal handlers for graceful shutdown
const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
let isShuttingDown = false;

signals.forEach(signal => {
    process.on(signal, () => {
        if (!isShuttingDown) {
            console.log(chalk.yellow(`\n\n⚠️  Received ${signal}, shutting down gracefully...`));
            gracefulShutdown(0);
        }
    });
});

// Windows-specific signal handling
if (process.platform === 'win32') {
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.on('SIGINT', () => {
        process.emit('SIGINT');
    });
}

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(exitCode = 0) {
    if (isShuttingDown) return;
    isShuttingDown = true;

    try {
        // Give CLI time to cleanup
        const shutdownTimeout = setTimeout(() => {
            console.error(chalk.red('\n❌ Forced shutdown due to timeout'));
            process.exit(exitCode);
        }, 5000); // 5 second timeout

        // Clear the timeout if shutdown completes
        shutdownTimeout.unref();

        // Emit shutdown event for CLI to handle cleanup
        if (global.cliInstance && typeof global.cliInstance.shutdown === 'function') {
            await global.cliInstance.shutdown();
        }

        console.log(chalk.green('✅ Shutdown complete\n'));
        process.exit(exitCode);
    } catch (error) {
        console.error(chalk.red(`\n❌ Error during shutdown: ${error.message}`));
        process.exit(1);
    }
}

/**
 * Check if Node.js version is compatible
 */
function isVersionCompatible(current, required) {
    const currentParts = current.split('.').map(Number);
    const requiredParts = required.split('.').map(Number);

    for (let i = 0; i < requiredParts.length; i++) {
        if (currentParts[i] > requiredParts[i]) return true;
        if (currentParts[i] < requiredParts[i]) return false;
    }
    return true;
}

/**
 * Display startup banner
 */
function displayBanner() {
    if (process.env.QUIET || process.env.CI) return;

    console.log(chalk.cyan('\n┌─────────────────────────────────────────┐'));
    console.log(chalk.cyan('│                                         │'));
    console.log(chalk.cyan('│  ') + chalk.bold.white('SWAGGER-TO-NEXTJS GENERATOR') + chalk.cyan('            │'));
    console.log(chalk.cyan('│  ') + chalk.gray(`v${packageInfo.version.padEnd(35)}`) + chalk.cyan('   │'));
    console.log(chalk.cyan('│                                         │'));
    console.log(chalk.cyan('└─────────────────────────────────────────┘\n'));
}

/**
 * Main CLI entry point
 */
async function main() {
    try {
        // Display banner unless in quiet mode
        displayBanner();

        // Set working directory context
        const workingDir = process.cwd();

        if (process.env.DEBUG) {
            console.log(chalk.gray(`Working directory: ${workingDir}`));
            console.log(chalk.gray(`Node.js version: ${process.version}`));
            console.log(chalk.gray(`Platform: ${process.platform} ${process.arch}\n`));
        }

        // Check if running as global or local installation
        const isGlobal = __dirname.includes('node_modules/.bin') ||
            __dirname.includes('npm/node_modules') ||
            __dirname.includes('yarn/global');

        if (process.env.DEBUG) {
            console.log(chalk.gray(`Installation type: ${isGlobal ? 'global' : 'local'}`));
        }

        // Load the CLI module
        let CLI;
        try {
            // Try to load from the parent directory (standard installation)
            CLI = require('../src/cli');
        } catch (error) {
            if (error.code === 'MODULE_NOT_FOUND') {
                // Try alternative paths for different installation scenarios
                const altPaths = [
                    path.join(__dirname, '..', 'lib', 'cli'),
                    path.join(__dirname, '..', 'dist', 'cli'),
                    path.join(__dirname, '..', 'build', 'cli'),
                    path.join(__dirname, '..', 'cli')
                ];

                let loaded = false;
                for (const altPath of altPaths) {
                    try {
                        CLI = require(altPath);
                        loaded = true;
                        break;
                    } catch (e) {
                        // Continue to next path
                    }
                }

                if (!loaded) {
                    throw new Error(
                        'Unable to load CLI module. Please ensure the package is properly installed.\n' +
                        'Try running: npm install -g swagger-to-nextjs'
                    );
                }
            } else {
                throw error;
            }
        }

        // Create CLI instance
        const cli = new CLI({
            version: packageInfo.version,
            workingDir: workingDir,
            isGlobal: isGlobal
        });

        // Store reference for graceful shutdown
        global.cliInstance = cli;

        // Parse arguments and run
        const args = process.argv.slice(2);

        // Handle special cases
        if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
            await cli.showHelp();
            process.exit(0);
        }

        if (args.includes('--version') || args.includes('-v')) {
            console.log(packageInfo.version);
            process.exit(0);
        }

        // Run the CLI
        const exitCode = await cli.run(args);

        // Exit with appropriate code
        process.exit(exitCode || 0);

    } catch (error) {
        console.error(chalk.red('\n❌ Failed to start CLI:'));
        console.error(chalk.red(`   ${error.message}`));

        if (process.env.DEBUG || process.env.VERBOSE) {
            console.error(chalk.gray('\nStack trace:'));
            console.error(chalk.gray(error.stack));
        }

        // Provide helpful error messages
        if (error.message.includes('Cannot find module')) {
            console.error(chalk.yellow('\n💡 Suggestion: Dependencies may be missing.'));
            console.error(chalk.yellow('   Run: npm install\n'));
        } else if (error.message.includes('Permission denied')) {
            console.error(chalk.yellow('\n💡 Suggestion: Check file permissions.'));
            console.error(chalk.yellow('   You may need to run with elevated privileges.\n'));
        } else if (error.message.includes('ENOENT')) {
            console.error(chalk.yellow('\n💡 Suggestion: Required files are missing.'));
            console.error(chalk.yellow('   Ensure you\'re running from the correct directory.\n'));
        } else {
            console.error(chalk.yellow('\n💡 For more details, run with DEBUG=1\n'));
        }

        gracefulShutdown(1);
    }
}

// Environment variable helpers
if (process.env.SWAGGER_TO_NEXTJS_DEBUG) {
    process.env.DEBUG = process.env.SWAGGER_TO_NEXTJS_DEBUG;
}

// Performance monitoring in debug mode
if (process.env.DEBUG) {
    const startTime = process.hrtime.bigint();

    process.on('exit', () => {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1e6; // Convert to milliseconds
        console.log(chalk.gray(`\nTotal execution time: ${duration.toFixed(2)}ms`));
    });
}

// Memory usage monitoring in debug mode
if (process.env.DEBUG && process.env.MONITOR_MEMORY) {
    setInterval(() => {
        const usage = process.memoryUsage();
        console.log(chalk.gray(`Memory: RSS=${Math.round(usage.rss / 1024 / 1024)}MB, Heap=${Math.round(usage.heapUsed / 1024 / 1024)}MB`));
    }, 5000);
}

// Start the CLI
main().catch(error => {
    console.error(chalk.red('\n❌ Catastrophic error:'));
    console.error(error);
    process.exit(1);
});
#!/usr/bin/env node
/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - AI PROMPT
 * ============================================================================
 * FILE: bin/swagger-to-nextjs.js
 * VERSION: 2025-06-17 21:42:10
 * PHASE: Phase 1: Foundation & Core Infrastructure
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 *
 * Create a Node.js executable file using ES Module syntax that serves as
 * the entry point for a CLI tool. This file should have a shebang for
 * Node.js, import and execute the main CLI module using ES Module import
 * from '../src/cli.js', handle any uncaught errors gracefully with
 * user-friendly messages, and exit with appropriate status codes. It should
 * also handle SIGINT signals for clean interruption when users press
 * Ctrl+C. The file should be minimal, focusing only on launching the CLI
 * and basic error handling. Use top-level await if needed and ensure all
 * imports use ES Module syntax.
 *
 * ============================================================================
 */

import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Store cleanup handlers
let isExiting = false;

/**
 * Handle uncaught errors with user-friendly messages
 */
process.on('uncaughtException', (error) => {
    if (!isExiting) {
        console.error(chalk.red('\n❌ An unexpected error occurred:'));
        console.error(chalk.red(`   ${error.message}`));

        if (process.env.DEBUG) {
            console.error(chalk.gray('\nStack trace:'));
            console.error(chalk.gray(error.stack));
        } else {
            console.error(chalk.gray('\n   Run with DEBUG=1 for detailed error information.'));
        }

        process.exit(1);
    }
});

/**
 * Handle unhandled promise rejections
 */
process.on('unhandledRejection', (reason, promise) => {
    if (!isExiting) {
        console.error(chalk.red('\n❌ Unhandled promise rejection:'));
        console.error(chalk.red(`   ${reason}`));

        if (process.env.DEBUG) {
            console.error(chalk.gray('\nRejected promise:'), promise);
        }

        process.exit(1);
    }
});

/**
 * Handle SIGINT (Ctrl+C) for clean interruption
 */
process.on('SIGINT', () => {
    if (!isExiting) {
        isExiting = true;
        console.log(chalk.yellow('\n\n⚠️  Operation cancelled by user.'));
        process.exit(0);
    }
});

/**
 * Handle SIGTERM for graceful shutdown
 */
process.on('SIGTERM', () => {
    if (!isExiting) {
        isExiting = true;
        console.log(chalk.yellow('\n\n⚠️  Received termination signal, shutting down...'));
        process.exit(0);
    }
});

/**
 * Main execution
 */
async function main() {
    try {
        // Import and run the CLI
        const { default: cli } = await import(join(__dirname, '../src/cli.js'));

        // Execute the CLI function
        await cli();

    } catch (error) {
        // Handle errors that occur during CLI initialization
        console.error(chalk.red('\n❌ Failed to start swagger-to-nextjs:'));
        console.error(chalk.red(`   ${error.message}`));

        // Provide helpful error messages based on error type
        if (error.code === 'MODULE_NOT_FOUND') {
            console.error(chalk.yellow('\n💡 Missing dependencies detected.'));
            console.error(chalk.yellow('   Please run: npm install'));
        } else if (error.code === 'EACCES') {
            console.error(chalk.yellow('\n💡 Permission denied.'));
            console.error(chalk.yellow('   You may need to run with elevated privileges.'));
        } else if (error.code === 'ENOENT') {
            console.error(chalk.yellow('\n💡 Required file not found.'));
            console.error(chalk.yellow('   Please ensure you are running from the correct directory.'));
        } else if (error.message.includes('Not valid JSON or YAML')) {
            console.error(chalk.yellow('\n💡 The specification file could not be parsed.'));
            console.error(chalk.yellow('   Please ensure it is valid JSON or YAML format.'));
        } else if (error.message.includes('Missing version field')) {
            console.error(chalk.yellow('\n💡 The specification is missing required fields.'));
            console.error(chalk.yellow('   Ensure your OpenAPI spec includes version and required fields.'));
        }

        if (process.env.DEBUG) {
            console.error(chalk.gray('\nStack trace:'));
            console.error(chalk.gray(error.stack));
        } else {
            console.error(chalk.gray('\n   Run with DEBUG=1 for detailed error information.'));
        }

        process.exit(1);
    }
}

// Execute main function
main();
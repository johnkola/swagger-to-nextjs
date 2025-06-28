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

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { pathToFileURL } from 'url';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Function to handle errors with user-friendly messages
function handleError(error) {
    const isDebug = process.env.DEBUG === '1' || process.argv.includes('--debug');

    if (isDebug) {
        console.error('❌ Detailed error information:');
        console.error(error);
    } else {
        console.error(`❌ Failed to start swagger-to-nextjs:`);
        console.error(`   ${error.message}`);
        console.error('   Run with DEBUG=1 for detailed error information.');
    }

    process.exit(1);
}

// Handle SIGINT (Ctrl+C) gracefully
process.on('SIGINT', () => {
    console.log('\n👋 Operation cancelled by user');
    process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    handleError(error);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
    handleError(error);
});

// Main execution
try {
    // Construct the path to cli.js and convert to file URL for Windows compatibility
    const cliPath = join(__dirname, '..', 'src', 'cli.js');
    const cliUrl = pathToFileURL(cliPath).href;

    // Dynamically import the CLI module
    const { default: runCli } = await import(cliUrl);

    // Run the CLI
    if (typeof runCli === 'function') {
        await runCli();
    } else {
        // If no default export, try to import and run directly
        await import(cliUrl);
    }
} catch (error) {
    handleError(error);
}
/**
 * ===AI PROMPT ==============================================================
 * FILE: bin/swagger-to-nextjs.js
 * VERSION: 2025-05-25 13:22:11
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 * Create a Node.js CLI executable script that sets up the working directory
 * context and launches the main CLI interface for the Swagger-to-NextJS
 * generator.
 *
 * ---
 *
 * ===PROMPT END ==============================================================
 */
/**
/**
#!/usr/bin/env node

/**

const path = require('path');
const fs = require('fs');

// Get the directory containing this executable
const scriptDir = path.dirname(__filename);
const projectRoot = path.join(scriptDir, '..');

// Check if we're in the right directory structure
const srcDir = path.join(projectRoot, 'src');
const mainFile = path.join(srcDir, 'index.js');

if (!fs.existsSync(mainFile)) {
    console.error('❌ Error: Main script not found at expected location');
    console.error(`   Expected: ${mainFile}`);
    console.error(`   Current directory: ${process.cwd()}`);
    console.error(`   Script directory: ${scriptDir}`);
    console.error('');
    console.error('Make sure you are running this from the correct directory structure:');
    console.error('scripts/swagger-to-nextjs/bin/swagger-to-nextjs');
    process.exit(1);
}

// Change the working directory to the script directory for proper relative imports
process.chdir(projectRoot);

// Check Node.js version (require Node.js 14+)
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 14) {
    console.error('❌ Error: Node.js version 14 or higher is required');
    console.error(`   Current version: ${nodeVersion}`);
    console.error(`   Please upgrade Node.js to version 14 or higher`);
    process.exit(1);
}

// Set up error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error.message);
    if (process.env.DEBUG) {
        console.error(error.stack);
    }
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    if (process.env.DEBUG) {
        console.error(reason);
    }
    process.exit(1);
});

// Try to load and execute the main script
try {
    // Import and run the main CLI orchestrator
    require('../src/index.js');
} catch (error) {
    console.error('❌ Failed to load main script:', error.message);

    // Check for common issues
    if (error.code === 'MODULE_NOT_FOUND') {
        console.error('');
        console.error('This might be due to missing dependencies. Try:');
        console.error('1. cd scripts/swagger-to-nextjs');
        console.error('2. npm install');
        console.error('');

        // Check if package.json exists
        const packageJson = path.join(projectRoot, 'package.json');
        if (!fs.existsSync(packageJson)) {
            console.error('⚠️  package.json not found. You may need to run:');
            console.error('   npm init -y');
            console.error('   npm install js-yaml commander handlebars axios fs-extra chalk');
        }
    }

    if (process.env.DEBUG) {
        console.error('');
        console.error('Full error stack:');
        console.error(error.stack);
    }

    process.exit(1);
}
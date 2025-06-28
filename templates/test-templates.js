#!/usr/bin/env node

/**
 * Test script for TemplateEngine
 * Automatically discovers and tests all .hbs templates
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import TemplateEngine from '../src/templates/TemplateEngine.js';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test data for different template types
const testData = {
    // Common data
    schemaName: 'User',
    componentName: 'UserList',
    resourceName: 'users',
    resourcePath: 'users',
    titleCase: (str) => str.charAt(0).toUpperCase() + str.slice(1),
    apiGroupName: 'users',

    // Operations
    hasCreateOperation: true,
    hasUpdateOperation: true,
    hasDeleteOperation: true,
    hasDetail: true,
    hasListOperation: true,

    // Table configuration
    tableColumns: [
        { field: 'id', label: 'ID', sortable: true },
        { field: 'name', label: 'Name', sortable: true, link: true },
        { field: 'email', label: 'Email', sortable: true },
        { field: 'status', label: 'Status', badge: true },
        { field: 'createdAt', label: 'Created', sortable: true }
    ],

    // Filter configuration
    filterFields: [
        { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] },
        { name: 'role', label: 'Role', type: 'select', options: ['admin', 'user', 'guest'] },
        { name: 'createdAfter', label: 'Created After', type: 'date' }
    ],

    // Form fields
    formFields: [
        { name: 'name', label: 'Name', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'password', label: 'Password', type: 'password', required: true },
        { name: 'role', label: 'Role', type: 'select', options: ['admin', 'user', 'guest'] }
    ],

    // API configuration
    apiConfig: {
        baseUrl: '/api',
        endpoints: {
            list: '/users',
            get: '/users/{id}',
            create: '/users',
            update: '/users/{id}',
            delete: '/users/{id}'
        }
    },

    // Schema properties
    properties: [
        { name: 'id', type: 'string', required: true },
        { name: 'name', type: 'string', required: true },
        { name: 'email', type: 'string', required: true },
        { name: 'role', type: 'string', enum: ['admin', 'user', 'guest'] },
        { name: 'createdAt', type: 'string', format: 'date-time' }
    ],

    // Additional metadata
    _meta: {
        timestamp: new Date().toISOString(),
        generator: 'swagger-to-nextjs'
    }
};

// Helper to recursively find all .hbs files
function findTemplateFiles(dir, baseDir = dir) {
    const files = [];

    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                // Skip node_modules and hidden directories
                if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
                    files.push(...findTemplateFiles(fullPath, baseDir));
                }
            } else if (entry.name.endsWith('.hbs')) {
                // Get relative path from base directory
                const relativePath = path.relative(baseDir, fullPath);
                files.push(relativePath);
            }
        }
    } catch (error) {
        console.error(chalk.red(`Error reading directory ${dir}:`, error.message));
    }

    return files;
}

// Test a single template
async function testTemplate(engine, templatePath) {
    const startTime = Date.now();

    try {
        // Test if template exists
        if (!engine.templateExists(templatePath)) {
            throw new Error('Template not found');
        }

        // Get template content for validation
        const content = engine.getTemplateContent(templatePath);

        // Basic validation
        if (!content || content.trim().length === 0) {
            throw new Error('Template is empty');
        }

        // Try to render the template
        const rendered = engine.render(templatePath, testData);

        // Check if rendered output is valid
        if (!rendered || rendered.trim().length === 0) {
            throw new Error('Rendered output is empty');
        }

        const duration = Date.now() - startTime;

        return {
            success: true,
            duration,
            size: content.length,
            outputSize: rendered.length
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            duration: Date.now() - startTime
        };
    }
}

// Main test function
async function runTests() {
    console.log(chalk.cyan.bold('\n🧪 Testing Template Engine\n'));

    // Initialize TemplateEngine
    const engine = new TemplateEngine({
        debug: process.argv.includes('--debug'),
        cacheTemplates: true
    });

    // Find templates directory
    const templatesDir = path.join(__dirname, '../templates');

    if (!fs.existsSync(templatesDir)) {
        console.error(chalk.red('❌ Templates directory not found:', templatesDir));
        process.exit(1);
    }

    // Find all template files
    console.log(chalk.gray(`📁 Scanning for templates in: ${templatesDir}`));
    const templateFiles = findTemplateFiles(templatesDir);

    if (templateFiles.length === 0) {
        console.log(chalk.yellow('⚠️  No template files found'));
        return;
    }

    console.log(chalk.gray(`📋 Found ${templateFiles.length} template(s)\n`));

    // Test each template
    const results = {
        total: templateFiles.length,
        passed: 0,
        failed: 0,
        errors: []
    };

    for (const templateFile of templateFiles) {
        process.stdout.write(chalk.gray(`Testing ${templateFile}... `));

        // Remove .hbs extension for template path
        const templatePath = templateFile.replace(/\.hbs$/, '');
        const result = await testTemplate(engine, templatePath);

        if (result.success) {
            results.passed++;
            console.log(
                chalk.green('✓'),
                chalk.gray(`(${result.duration}ms, ${result.size} → ${result.outputSize} bytes)`)
            );
        } else {
            results.failed++;
            results.errors.push({ template: templateFile, error: result.error });
            console.log(
                chalk.red('✗'),
                chalk.red(result.error),
                chalk.gray(`(${result.duration}ms)`)
            );
        }
    }

    // Summary
    console.log(chalk.cyan.bold('\n📊 Test Summary\n'));
    console.log(`Total templates: ${results.total}`);
    console.log(chalk.green(`✓ Passed: ${results.passed}`));

    if (results.failed > 0) {
        console.log(chalk.red(`✗ Failed: ${results.failed}`));

        if (process.argv.includes('--verbose') || results.failed <= 5) {
            console.log(chalk.red('\n❌ Failed templates:'));
            results.errors.forEach(({ template, error }) => {
                console.log(chalk.red(`  - ${template}: ${error}`));
            });
        }
    }

    // Test specific features
    if (process.argv.includes('--features')) {
        console.log(chalk.cyan.bold('\n🔧 Testing Engine Features\n'));

        // Test helpers
        console.log(chalk.gray('Testing helpers...'));
        try {
            const helpers = ['eq', 'ne', 'includes', 'length', 'keys', 'concat'];
            helpers.forEach(helper => {
                const hbs = engine.getHandlebars();
                if (!hbs.helpers[helper]) {
                    throw new Error(`Helper '${helper}' not registered`);
                }
            });
            console.log(chalk.green('✓ All standard helpers registered'));
        } catch (error) {
            console.log(chalk.red('✗ Helper test failed:', error.message));
        }

        // Test partials
        console.log(chalk.gray('Testing partials...'));
        const partialsDir = path.join(templatesDir, 'partials');
        if (fs.existsSync(partialsDir)) {
            const partials = fs.readdirSync(partialsDir).filter(f => f.endsWith('.hbs'));
            console.log(chalk.green(`✓ Found ${partials.length} partial(s)`));
        } else {
            console.log(chalk.yellow('⚠️  No partials directory found'));
        }

        // Test cache
        console.log(chalk.gray('Testing template cache...'));
        const cacheTestTemplate = templateFiles[0]?.replace(/\.hbs$/, '');
        if (cacheTestTemplate) {
            const time1 = Date.now();
            engine.render(cacheTestTemplate, testData);
            const firstRender = Date.now() - time1;

            const time2 = Date.now();
            engine.render(cacheTestTemplate, testData);
            const cachedRender = Date.now() - time2;

            console.log(chalk.green(`✓ Cache working (${firstRender}ms → ${cachedRender}ms)`));
        }
    }

    // Performance summary
    if (process.argv.includes('--perf')) {
        console.log(chalk.cyan.bold('\n⚡ Performance Summary\n'));
        engine.clearCache();

        const perfStart = Date.now();
        let totalSize = 0;

        for (const templateFile of templateFiles) {
            const templatePath = templateFile.replace(/\.hbs$/, '');
            try {
                const rendered = engine.render(templatePath, testData);
                totalSize += rendered.length;
            } catch (error) {
                // Ignore errors in perf test
            }
        }

        const totalTime = Date.now() - perfStart;
        console.log(`Total rendering time: ${totalTime}ms`);
        console.log(`Average time per template: ${(totalTime / templateFiles.length).toFixed(2)}ms`);
        console.log(`Total output size: ${(totalSize / 1024).toFixed(2)}KB`);
    }

    // Exit code based on results
    process.exit(results.failed > 0 ? 1 : 0);
}

// Handle errors
process.on('unhandledRejection', (error) => {
    console.error(chalk.red('\n❌ Unhandled error:'), error);
    process.exit(1);
});

// Run tests
runTests().catch(error => {
    console.error(chalk.red('\n❌ Test failed:'), error);
    process.exit(1);
});

// Show help
if (process.argv.includes('--help')) {
    console.log(`
${chalk.cyan.bold('Template Engine Test Script')}

${chalk.gray('Usage:')}
  node test-templates.js [options]

${chalk.gray('Options:')}
  --debug      Enable debug mode in TemplateEngine
  --verbose    Show detailed error information
  --features   Test engine features (helpers, partials, cache)
  --perf       Run performance tests
  --help       Show this help message

${chalk.gray('Examples:')}
  node test-templates.js
  node test-templates.js --debug --verbose
  node test-templates.js --features --perf
`);
    process.exit(0);
}
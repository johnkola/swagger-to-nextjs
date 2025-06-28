/**
 * TemplateTester.js - Module for testing all templates
 * Can be called from index.js or used standalone
 * FILE: src/templates/TemplateTester.js
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import TemplateEngine from './templates/TemplateEngine.js';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default class TemplateTester {
    constructor(options = {}) {
        this.options = {
            verbose: false,
            silent: false,
            debug: false,
            ...options
        };

        this.engine = new TemplateEngine({
            debug: this.options.debug,
            cacheTemplates: true
        });

        // Default test data
        this.testData = {
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

            // Additional metadata
            _meta: {
                timestamp: new Date().toISOString(),
                generator: 'swagger-to-nextjs'
            }
        };
    }

    /**
     * Merge additional test data
     */
    setTestData(additionalData) {
        this.testData = { ...this.testData, ...additionalData };
    }

    /**
     * Find all template files recursively
     */
    async findTemplateFiles(dir, baseDir = dir) {
        const files = [];

        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);

                if (entry.isDirectory()) {
                    // Skip node_modules and hidden directories
                    if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
                        files.push(...await this.findTemplateFiles(fullPath, baseDir));
                    }
                } else if (entry.name.endsWith('.hbs')) {
                    // Get relative path from base directory
                    const relativePath = path.relative(baseDir, fullPath);
                    files.push(relativePath);
                }
            }
        } catch (error) {
            if (this.options.verbose && !this.options.silent) {
                console.error(chalk.red(`Error reading directory ${dir}: ${error.message}`));
            }
        }

        return files;
    }

    /**
     * Test a single template
     */
    async testTemplate(templatePath) {
        const startTime = Date.now();

        try {
            // Test if template exists
            if (!this.engine.templateExists(templatePath)) {
                throw new Error('Template not found');
            }

            // Get template content for validation
            const content = this.engine.getTemplateContent(templatePath);

            // Basic validation
            if (!content || content.trim().length === 0) {
                throw new Error('Template is empty');
            }

            // Try to render the template
            const rendered = this.engine.render(templatePath, this.testData);

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

    /**
     * Test all templates
     */
    async testAll() {
        // Find templates directory
        const templatesDir = path.join(__dirname, '../templates');

        if (this.options.verbose && !this.options.silent) {
            console.log(chalk.gray(`Looking for templates in: ${templatesDir}`));
        }

        // Find all template files
        const templateFiles = await this.findTemplateFiles(templatesDir);

        if (templateFiles.length === 0) {
            return {
                success: true,
                tested: 0,
                passed: 0,
                failed: 0,
                errors: []
            };
        }

        let passed = 0;
        let failed = 0;
        const errors = [];

        for (const templateFile of templateFiles) {
            const templatePath = templateFile.replace(/\.hbs$/, '');
            const result = await this.testTemplate(templatePath);

            if (result.success) {
                passed++;
                if (this.options.verbose && !this.options.silent) {
                    console.log(chalk.green(`  ✓ ${templateFile}`));
                }
            } else {
                failed++;
                errors.push({ template: templateFile, error: result.error });
                if (this.options.verbose && !this.options.silent) {
                    console.log(chalk.red(`  ✗ ${templateFile}: ${result.error}`));
                }
            }
        }

        return {
            success: failed === 0,
            tested: templateFiles.length,
            passed,
            failed,
            errors
        };
    }

    /**
     * List all templates without testing
     */
    async listTemplates() {
        const templatesDir = path.join(__dirname, '../templates');
        const templateFiles = await this.findTemplateFiles(templatesDir);

        // Group by directory
        const grouped = {};
        templateFiles.forEach(file => {
            const dir = path.dirname(file);
            if (!grouped[dir]) grouped[dir] = [];
            grouped[dir].push(path.basename(file));
        });

        return {
            total: templateFiles.length,
            files: templateFiles,
            grouped
        };
    }
}
/**
 * index.js - Main orchestrator for swagger-to-nextjs
 * Includes template testing functionality and service generation
 */
import { EventEmitter } from 'node:events';
import fs from 'node:fs/promises';
import path from 'node:path';
import yaml from 'js-yaml';
import chalk from 'chalk';
import { fileURLToPath } from 'node:url';

// Core components
import SwaggerLoader from './core/SwaggerLoader.js';
import SwaggerValidator from './core/SwaggerValidator.js';
import FileWriter from './core/FileWriter.js';

// Generators
import TypeGenerator from './generators/TypeGenerator.js';
import ApiRouteGenerator from './generators/ApiRouteGenerator.js';
import ClientGenerator from './generators/ClientGenerator.js';
import ServiceGenerator from './generators/ServiceGenerator.js';
import PageGenerator from './generators/PageGenerator.js';
import ProjectGenerator from './generators/ProjectGenerator.js';

// Template System
import TemplateEngine from './templates/TemplateEngine.js';
import TemplateTester from './TemplateTester.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default class SwaggerToNextjs extends EventEmitter {
    constructor(options = {}) {
        super();

        this.options = {
            outputDir: './generated',
            typescript: true,
            generateClient: true,
            generateServices: true, // New option for service generation
            generateRoutes: true,
            generatePages: true,
            useTimestamp: true,
            force: false,
            dryRun: false,
            verbose: false,
            silent: false,
            testTemplates: true,
            serviceName: 'api', // Default service name
            generateSharedUtils: true, // Generate shared utilities like logger
            // DaisyUI options
            daisyui: true,
            theme: 'light',
            themes: ['light', 'dark', 'cupcake', 'corporate'],
            customTheme: null,
            ...options
        };

        this.swaggerSource = null;
        this.spec = null;
        this.validation = null;
        this.generatedFiles = [];
        this.errors = [];
        this.warnings = [];
        this.daisyuiComponents = new Set();
        this.startTime = null;

        // Initialize core components
        this.loader = new SwaggerLoader();
        this.validator = new SwaggerValidator();
        this.fileWriter = new FileWriter({
            force: this.options.force,
            dryRun: this.options.dryRun,
            interactive: this.options.interactive,
            useTimestamp: this.options.useTimestamp,
            onProgress: (progress) => this.emit('file:progress', progress)
        });

        // Generators will be initialized after spec is loaded
        this.generators = {};
    }

    withSwagger(source) {
        this.swaggerSource = source;
        return this;
    }

    toDirectory(dir) {
        this.options.outputDir = dir;
        return this;
    }

    async initialize(config = {}) {
        this.emit('initialize:start', { config });

        try {
            if (typeof config === 'string') {
                // Load config from file
                const configContent = await fs.readFile(config, 'utf-8');
                const ext = path.extname(config);

                if (ext === '.json') {
                    config = JSON.parse(configContent);
                } else if (ext === '.yaml' || ext === '.yml') {
                    config = yaml.load(configContent);
                }
            }

            Object.assign(this.options, config);

            // Load custom theme if provided
            if (this.options.customTheme && typeof this.options.customTheme === 'string') {
                const themeContent = await fs.readFile(this.options.customTheme, 'utf-8');
                this.options.customThemeContent = JSON.parse(themeContent);
            }

            // Update FileWriter options
            this.fileWriter = new FileWriter({
                force: this.options.force,
                dryRun: this.options.dryRun,
                interactive: this.options.interactive,
                useTimestamp: this.options.useTimestamp,
                onProgress: (progress) => this.emit('file:progress', progress)
            });

            this.emit('initialize:complete', { options: this.options });
            return this;
        } catch (error) {
            this.emit('initialize:error', { error });
            throw new Error(`Failed to initialize: ${error.message}`);
        }
    }

    /**
     * Test all templates before generation
     */
    async testTemplates() {
        this.emit('progress', { step: 'test-templates', message: 'Testing all templates...' });

        const tester = new TemplateTester({
            verbose: this.options.verbose,
            silent: this.options.silent,
            debug: this.options.debug
        });

        // If spec is loaded, add it to test data
        if (this.spec) {
            tester.setTestData({
                apiInfo: this.spec.info || {},
                servers: this.spec.servers || [],
                serviceName: this.options.serviceName || 'api',
                resourceName: 'example'
            });
        }

        const result = await tester.testAll();

        if (result.failed > 0) {
            this.emit('progress', {
                step: 'test-templates',
                message: `Template testing completed with ${result.failed} errors`,
                completed: true,
                error: true
            });

            if (!this.options.force) {
                throw new Error(`Template testing failed: ${result.failed} templates have errors. Use --force to continue anyway.`);
            } else {
                this.warnings.push(`Template testing: ${result.failed} templates have errors but continuing due to --force flag`);
            }
        } else {
            this.emit('progress', {
                step: 'test-templates',
                message: `All ${result.passed} templates tested successfully`,
                completed: true
            });
        }

        // Return result with file list
        return result;
    }

    initializeGenerators(actualOutputDir) {
        // Initialize generators with loaded spec and actual output directory
        const generatorOptions = {
            ...this.options,
            output: actualOutputDir,
            outputDir: actualOutputDir,
            dryRun: this.options.dryRun,
            force: this.options.force,
            noDaisyui: !this.options.daisyui,
            fileWriter: this.fileWriter,
            serviceName: this.options.serviceName || 'api',
            generateSharedUtils: this.options.generateSharedUtils
        };

        this.generators = {
            types: this.options.typescript ? new TypeGenerator(this.spec, generatorOptions) : null,
            client: this.options.generateClient ? new ClientGenerator(this.spec, generatorOptions) : null,
            services: this.options.generateServices ? new ServiceGenerator(this.spec, generatorOptions) : null,
            routes: this.options.generateRoutes ? new ApiRouteGenerator(this.spec, generatorOptions) : null,
            pages: this.options.generatePages ? new PageGenerator(this.spec, generatorOptions) : null,
            project: new ProjectGenerator(this.spec, generatorOptions)
        };

        // Set file writer for each generator
        Object.values(this.generators).forEach(generator => {
            if (generator) {
                generator.fileWriter = this.fileWriter;

                // Wire up event listeners
                generator.on('progress', (data) => this.emit('progress', data));
                generator.on('error', (data) => {
                    this.errors.push(data.error || data);
                    this.emit('error', data);
                });
                generator.on('warning', (data) => {
                    this.warnings.push(data.message || data);
                    this.emit('warning', data);
                });
            }
        });
    }

    async generate() {
        this.startTime = Date.now();

        try {
            this.emit('generate:start');

            if (!this.swaggerSource) {
                throw new Error('No OpenAPI specification source provided');
            }

            // Step 1: Load spec
            this.emit('progress', { step: 'load', message: 'Loading OpenAPI specification...' });
            this.spec = await this.loader.load(this.swaggerSource);

            // Extract theme hints from spec if available
            if (this.spec.info?.['x-branding']) {
                this.options.brandingColors = this.spec.info['x-branding'];
            }

            // Step 2: Validate spec
            this.emit('progress', { step: 'validate', message: 'Validating specification...' });
            this.validation = this.validator.validate(this.spec);

            if (!this.validation.valid) {
                const errorMessages = this.validation.errors.map(e => e.message).join('\n  - ');
                throw new Error(`Invalid OpenAPI specification:\n  - ${errorMessages}`);
            }

            // Store warnings from validation
            this.warnings.push(...this.validation.warnings.map(w => w.message));

            // Log validation results if verbose
            if (this.options.verbose && !this.options.silent) {
                console.log('\nValidation Results:');
                console.log(`  Valid: ${this.validation.valid}`);
                console.log(`  Errors: ${this.validation.errors.length}`);
                console.log(`  Warnings: ${this.validation.warnings.length}`);

                if (this.validation.warnings.length > 0) {
                    console.log('\nWarnings:');
                    this.validation.warnings.forEach(w => {
                        console.log(`  - ${w.message}`);
                    });
                }
            }

            // Step 3: Test templates if enabled
            if (this.options.testTemplates) {
                if (!this.options.silent) {
                    console.log('\n🧪 Testing templates before generation...');
                }
                const templateTestResult = await this.testTemplates();

                if (!this.options.silent) {
                    if (templateTestResult.tested === 0) {
                        console.log(chalk.yellow(`⚠️  No templates found to test`));
                        if (templateTestResult.templatesDir) {
                            console.log(chalk.gray(`    Searched in: ${templateTestResult.templatesDir}`));
                        }
                    } else {
                        console.log(`✅ Template testing completed: ${templateTestResult.passed}/${templateTestResult.tested} passed`);

                        // Show template list if verbose
                        if (this.options.verbose && templateTestResult.files) {
                            console.log(chalk.gray('\nTested templates:'));
                            templateTestResult.files.forEach(file => {
                                const passed = !templateTestResult.errors.find(e => e.template === file);
                                const icon = passed ? chalk.green('✓') : chalk.red('✗');
                                console.log(`  ${icon} ${file}`);
                            });
                        }
                    }
                    console.log('');
                }
            } else if (this.options.verbose && !this.options.silent) {
                console.log('\n⏩ Skipping template testing (disabled)');
            }

            // Step 4: Initialize output directory with timestamp support
            this.emit('progress', { step: 'prepare', message: 'Preparing output directory...' });

            // Initialize the actual output directory (with timestamp if enabled)
            const actualOutputDir = this.fileWriter.initializeOutputDirectory(this.options.outputDir);

            // Log the directories for debugging
            if (this.options.verbose) {
                console.log(`\nOutput directories:`);
                console.log(`  Requested: ${this.options.outputDir}`);
                console.log(`  Actual: ${actualOutputDir}`);
                if (this.fileWriter.timestamp) {
                    console.log(`  Timestamp: ${this.fileWriter.timestamp}`);
                }
            }

            // Step 5: Initialize generators with the actual output directory
            this.initializeGenerators(actualOutputDir);

            // Step 6: Create output directory
            if (!this.options.dryRun) {
                await fs.mkdir(actualOutputDir, { recursive: true });
            }

            // Step 7: Run generators in sequence (order matters!)
            const results = {};

            // Generate TypeScript types first
            if (this.generators.types) {
                const typeResult = await this.generators.types.generate();
                results.types = typeResult;
                this.emit('progress', {
                    step: 'types',
                    message: `Generated ${typeResult.types} types, ${typeResult.enums} enums`,
                    completed: true
                });
            }

            // Generate API client (must be before services)
            if (this.generators.client) {
                const clientResult = await this.generators.client.generate();
                results.client = clientResult;
                this.emit('progress', {
                    step: 'client',
                    message: `Generated API client with ${clientResult.operations} operations`,
                    completed: true
                });
            }

            // Generate service wrappers (must be before routes)
            if (this.generators.services) {
                const serviceResult = await this.generators.services.generate();
                results.services = serviceResult;
                this.emit('progress', {
                    step: 'services',
                    message: `Generated ${serviceResult.totalFiles} service files`,
                    completed: true
                });
            }

            // Generate API routes (depends on services)
            if (this.generators.routes) {
                const routeResult = await this.generators.routes.generate();
                results.routes = routeResult;
                this.emit('progress', {
                    step: 'routes',
                    message: `Generated ${routeResult.totalRoutes} API routes`,
                    completed: true
                });
            }

            // Generate UI pages
            if (this.generators.pages) {
                const pageResult = await this.generators.pages.generate();
                results.pages = pageResult;

                // Track DaisyUI component usage
                if (pageResult.usage) {
                    Object.keys(pageResult.usage).forEach(comp => this.daisyuiComponents.add(comp));
                }

                this.emit('progress', {
                    step: 'pages',
                    message: `Generated ${pageResult.files.length} pages with ${pageResult.components} DaisyUI components`,
                    completed: true
                });
            }

            // Generate project files last
            const projectResult = await this.generators.project.generate();
            results.project = projectResult;
            this.emit('progress', {
                step: 'project',
                message: `Generated ${projectResult.totalFiles} project configuration files`,
                completed: true
            });

            // Collect all generated files
            this.collectGeneratedFiles(results);

            // Get the FileWriter summary
            const fileWriterSummary = this.fileWriter.getSummary();

            // Show dry run summary if applicable
            if (this.options.dryRun) {
                console.log('\n[DRY RUN] Would generate the following files:');
                this.generatedFiles.forEach(file => {
                    console.log(`  - ${file.path}`);
                });
            }

            const duration = Date.now() - this.startTime;
            const result = {
                success: true,
                duration,
                outputDirectory: actualOutputDir,
                timestamp: this.fileWriter.timestamp,
                files: this.generatedFiles,
                errors: this.errors,
                warnings: this.warnings,
                daisyuiComponents: Array.from(this.daisyuiComponents),
                themes: this.options.themes,
                stats: {
                    totalFiles: this.generatedFiles.length,
                    writtenFiles: fileWriterSummary.written,
                    skippedFiles: fileWriterSummary.skipped,
                    types: results.types?.types || 0,
                    routes: results.routes?.totalRoutes || 0,
                    services: results.services?.totalFiles || 0,
                    pages: results.pages?.files.length || 0,
                    duration
                }
            };

            this.emit('generate:complete', result);
            return result;

        } catch (error) {
            this.emit('generate:error', { error });
            throw error;
        }
    }

    collectGeneratedFiles(results) {
        // Collect files from each generator result
        Object.values(results).forEach(result => {
            if (result && result.files) {
                result.files.forEach(file => {
                    this.generatedFiles.push({
                        path: file.file || file,
                        type: file.type || 'unknown'
                    });
                });
            } else if (result && result.file) {
                this.generatedFiles.push({
                    path: result.file,
                    type: result.type || 'unknown'
                });
            }
        });

        // Also get files from FileWriter
        const fileWriterSummary = this.fileWriter.getSummary();
        fileWriterSummary.files.written.forEach(path => {
            if (!this.generatedFiles.find(f => f.path === path)) {
                this.generatedFiles.push({
                    path,
                    type: 'written'
                });
            }
        });
    }

    async cleanup() {
        this.emit('cleanup:start');

        // Clear caches
        if (this.loader && this.loader.clearCache) {
            this.loader.clearCache();
        }

        // Clear generator references
        this.generators = {};

        // Reset state
        this.spec = null;
        this.validation = null;
        this.generatedFiles = [];
        this.errors = [];
        this.warnings = [];
        this.daisyuiComponents.clear();

        // Reset FileWriter
        this.fileWriter.reset();

        this.emit('cleanup:complete');
    }

    static create(options) {
        return new SwaggerToNextjs(options);
    }
}

// Named export for the class
export { SwaggerToNextjs };

// Re-export the class as a property for compatibility
SwaggerToNextjs.SwaggerToNextjs = SwaggerToNextjs;
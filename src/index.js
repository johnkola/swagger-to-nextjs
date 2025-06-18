/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - AI PROMPT
 * ============================================================================
 * FILE: src/index.js
 * VERSION: 2025-06-17 21:42:10
 * PHASE: Phase 1: Foundation & Core Infrastructure
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 *
 * Create the main orchestrator class using ES Module syntax for a code
 * generator that coordinates the entire generation process from OpenAPI
 * spec to Next.js application with DaisyUI components. Use ES Module
 * imports for all dependencies. This class should accept configuration
 * options in its constructor including theme preferences, have a main
 * generate() method that sequentially runs all generation steps, coordinate
 * loading the spec, validating it, and running various generators (types,
 * API routes, client, pages with DaisyUI components, project files
 * including Tailwind config). It should emit events for progress tracking
 * using EventEmitter, handle errors gracefully with helpful messages, track
 * DaisyUI theme configuration throughout the process, and return a summary
 * of generated files. Export the class as the default export. The class
 * should support both CLI usage and programmatic usage as a library.
 *
 * ============================================================================
 */
/**
 * index.js - Main orchestrator for swagger-to-nextjs
 * Updated to use actual Phase 6 generators
 */
import { EventEmitter } from 'node:events';
import fs from 'node:fs/promises';
import path from 'node:path';
import yaml from 'js-yaml';

// Core components
import SwaggerLoader from './core/SwaggerLoader.js';
import SwaggerValidator from './core/SwaggerValidator.js';
import FileWriter from './core/FileWriter.js';

// Phase 6 Generators
import TypeGenerator from './generators/TypeGenerator.js';
import ApiRouteGenerator from './generators/ApiRouteGenerator.js';
import ClientGenerator from './generators/ClientGenerator.js';
import PageGenerator from './generators/PageGenerator.js';
import ProjectGenerator from './generators/ProjectGenerator.js';

export default class SwaggerToNextjs extends EventEmitter {
    constructor(options = {}) {
        super();

        this.options = {
            outputDir: './generated',
            typescript: true,
            generateClient: true,
            generatePages: true,
            force: false,
            dryRun: false,
            verbose: false,
            silent: false,
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
        this.fileWriter = new FileWriter(this.options);

        // Generators will be initialized after spec is loaded
        this.generators = {};
    }

    withSwagger(source) {
        this.swaggerSource = source;
        return this;
    }

    toDirectory(dir) {
        this.options.outputDir = dir;
        this.fileWriter.options.outputDir = dir;
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
            this.fileWriter = new FileWriter(this.options);

            this.emit('initialize:complete', { options: this.options });
            return this;
        } catch (error) {
            this.emit('initialize:error', { error });
            throw new Error(`Failed to initialize: ${error.message}`);
        }
    }

    initializeGenerators() {
        // Initialize generators with loaded spec and options
        const generatorOptions = {
            ...this.options,
            output: this.options.outputDir,
            dryRun: this.options.dryRun,
            force: this.options.force,
            noDaisyui: !this.options.daisyui
        };

        this.generators = {
            types: this.options.typescript ? new TypeGenerator(this.spec, generatorOptions) : null,
            routes: new ApiRouteGenerator(this.spec, generatorOptions),
            client: this.options.generateClient ? new ClientGenerator(this.spec, generatorOptions) : null,
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

            // Step 3: Initialize generators with the loaded spec
            this.initializeGenerators();

            // Step 4: Prepare output directory
            if (!this.options.dryRun) {
                this.emit('progress', { step: 'prepare', message: 'Preparing output directory...' });
                await fs.mkdir(this.options.outputDir, { recursive: true });
            }

            // Step 5: Run generators in sequence
            const results = {};

            // Generate TypeScript types
            if (this.generators.types) {
                const typeResult = await this.generators.types.generate();
                results.types = typeResult;
                this.emit('progress', {
                    step: 'types',
                    message: `Generated ${typeResult.types} types, ${typeResult.enums} enums`,
                    completed: true
                });
            }

            // Generate API routes
            const routeResult = await this.generators.routes.generate();
            results.routes = routeResult;
            this.emit('progress', {
                step: 'routes',
                message: `Generated ${routeResult.totalRoutes} API routes`,
                completed: true
            });

            // Generate API client
            if (this.generators.client) {
                const clientResult = await this.generators.client.generate();
                results.client = clientResult;
                this.emit('progress', {
                    step: 'client',
                    message: `Generated API client with ${clientResult.operations} operations`,
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

            // Generate project files
            const projectResult = await this.generators.project.generate();
            results.project = projectResult;
            this.emit('progress', {
                step: 'project',
                message: `Generated ${projectResult.totalFiles} project configuration files`,
                completed: true
            });

            // Collect all generated files
            this.collectGeneratedFiles(results);

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
                files: this.generatedFiles,
                errors: this.errors,
                warnings: this.warnings,
                daisyuiComponents: Array.from(this.daisyuiComponents),
                themes: this.options.themes,
                stats: {
                    totalFiles: this.generatedFiles.length,
                    types: results.types?.types || 0,
                    routes: results.routes?.totalRoutes || 0,
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
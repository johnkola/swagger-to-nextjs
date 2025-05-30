/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - AI PROMPT
 * ============================================================================
 * FILE: src/index.js
 * VERSION: 2025-05-28 15:14:56
 * PHASE: PHASE 1: Foundation Components
 * CATEGORY: 🎯 Main Entry Points
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 *
 * Build a robust main orchestrator class that:
 * - Implements a clean architecture with dependency injection
 * - Coordinates all major components (loader, validator, generators)
 * - Provides a fluent API for programmatic usage
 * - Implements proper lifecycle management (init, generate, cleanup)
 * - Handles concurrent operations safely
 * - Provides hooks for extensions and plugins
 * - Implements comprehensive error recovery
 * - Emits events for monitoring and logging
 * - Supports both CLI and programmatic usage patterns
 *
 * ============================================================================
 */

const { EventEmitter } = require('events');
const path = require('path');
const fs = require('fs').promises;
const { Worker } = require('worker_threads');
const pLimit = require('p-limit');

// Core components
const ConfigLoader = require('./config/ConfigLoader');
const SwaggerLoader = require('./loaders/SwaggerLoader');
const SwaggerValidator = require('./validators/SwaggerValidator');
const SchemaParser = require('./parsers/SchemaParser');
const RouteAnalyzer = require('./parsers/RouteAnalyzer');
const TypeGenerator = require('./generators/TypeGenerator');
const ApiClientGenerator = require('./generators/ApiClientGenerator');
const ComponentGenerator = require('./generators/ComponentGenerator');
const HookGenerator = require('./generators/HookGenerator');
const TestGenerator = require('./generators/TestGenerator');
const TemplateEngine = require('./templates/TemplateEngine');
const FileWriter = require('./utils/FileWriter');
const Logger = require('./utils/Logger');
const { createUsageTracker } = require('./analytics/UsageTracker');
const PluginManager = require('./plugins/PluginManager');
const DependencyContainer = require('./utils/DependencyContainer');

/**
 * Main orchestrator class for Swagger to Next.js generation
 * Implements a fluent API with comprehensive lifecycle management
 */
class SwaggerToNextjs extends EventEmitter {
    constructor(options = {}) {
        super();

        // Initialize dependency container
        this.container = new DependencyContainer();

        // Configuration
        this.options = options;
        this.config = null;

        // Component instances
        this.components = {};

        // State management
        this.state = {
            initialized: false,
            generating: false,
            completed: false,
            errors: [],
            warnings: []
        };

        // Lifecycle hooks
        this.hooks = {
            beforeInit: [],
            afterInit: [],
            beforeGenerate: [],
            afterGenerate: [],
            beforeCleanup: [],
            afterCleanup: [],
            onError: []
        };

        // Concurrency control
        this.concurrencyLimit = options.concurrency || 5;
        this.limiter = pLimit(this.concurrencyLimit);

        // Worker pool for CPU-intensive tasks
        this.workers = [];
        this.maxWorkers = options.maxWorkers || require('os').cpus().length;

        // Plugin manager
        this.pluginManager = new PluginManager();

        // Usage tracking
        this.usageTracker = createUsageTracker({
            enabled: options.telemetry !== false
        });

        // Setup error handlers
        this._setupErrorHandlers();
    }

    /**
     * Initialize the generator with configuration
     * @param {string|object} configPath - Path to config file or config object
     * @returns {SwaggerToNextjs} Self for chaining
     */
    async initialize(configPath) {
        try {
            this.emit('lifecycle:beforeInit');
            await this._runHooks('beforeInit');

            // Load configuration
            const configLoader = this._createComponent('configLoader', ConfigLoader);
            this.config = await configLoader.load(configPath);

            // Validate configuration
            const validation = configLoader.validate(this.config);
            if (!validation.valid) {
                throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
            }

            // Initialize logger
            this._createComponent('logger', Logger, this.config.logging);
            this.logger = this.components.logger;

            // Initialize all components
            await this._initializeComponents();

            // Load plugins
            await this._loadPlugins();

            // Mark as initialized
            this.state.initialized = true;

            this.emit('lifecycle:afterInit');
            await this._runHooks('afterInit');

            this.logger.info('SwaggerToNextjs initialized successfully');

            return this;
        } catch (error) {
            await this._handleError(error, 'initialization');
            throw error;
        }
    }

    /**
     * Set swagger source
     * @param {string} source - Path or URL to swagger file
     * @returns {SwaggerToNextjs} Self for chaining
     */
    withSwagger(source) {
        this.swaggerSource = source;
        return this;
    }

    /**
     * Set output directory
     * @param {string} outputDir - Output directory path
     * @returns {SwaggerToNextjs} Self for chaining
     */
    toDirectory(outputDir) {
        if (this.config) {
            this.config.output.baseDir = outputDir;
        } else {
            this.options.outputDir = outputDir;
        }
        return this;
    }

    /**
     * Add plugin
     * @param {string|object} plugin - Plugin name or instance
     * @param {object} options - Plugin options
     * @returns {SwaggerToNextjs} Self for chaining
     */
    usePlugin(plugin, options = {}) {
        this.pluginManager.register(plugin, options);
        return this;
    }

    /**
     * Add lifecycle hook
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     * @returns {SwaggerToNextjs} Self for chaining
     */
    addHook(event, handler) {
        if (this.hooks[event]) {
            this.hooks[event].push(handler);
        } else {
            this.on(event, handler);
        }
        return this;
    }

    /**
     * Configure specific component
     * @param {string} component - Component name
     * @param {object} config - Component configuration
     * @returns {SwaggerToNextjs} Self for chaining
     */
    configure(component, config) {
        if (!this.config) {
            this.options[component] = config;
        } else {
            this.config[component] = { ...this.config[component], ...config };
        }
        return this;
    }

    /**
     * Generate Next.js code from Swagger
     * @param {object} options - Generation options
     * @returns {Promise<object>} Generation result
     */
    async generate(options = {}) {
        if (!this.state.initialized) {
            throw new Error('Generator not initialized. Call initialize() first.');
        }

        if (this.state.generating) {
            throw new Error('Generation already in progress');
        }

        try {
            this.state.generating = true;
            this.emit('lifecycle:beforeGenerate');
            await this._runHooks('beforeGenerate');

            const startTime = Date.now();

            // Track generation start
            this.usageTracker.trackGeneration('start', {
                source: this.swaggerSource,
                options: options
            });

            // Load Swagger specification
            this.logger.info('Loading Swagger specification...');
            const swagger = await this._loadSwagger();

            // Validate Swagger
            this.logger.info('Validating Swagger specification...');
            await this._validateSwagger(swagger);

            // Parse schemas
            this.logger.info('Parsing schemas...');
            const schemas = await this._parseSchemas(swagger);

            // Analyze routes
            this.logger.info('Analyzing routes...');
            const routes = await this._analyzeRoutes(swagger);

            // Generate code
            this.logger.info('Generating code...');
            const results = await this._generateCode({
                swagger,
                schemas,
                routes,
                options
            });

            // Write files
            this.logger.info('Writing files...');
            await this._writeFiles(results);

            // Run post-generation tasks
            await this._runPostGeneration(results);

            const duration = Date.now() - startTime;

            // Track generation completion
            this.usageTracker.trackGeneration('complete', {
                duration,
                filesGenerated: results.files.length,
                errors: this.state.errors.length,
                warnings: this.state.warnings.length
            });

            this.state.completed = true;
            this.state.generating = false;

            this.emit('lifecycle:afterGenerate', results);
            await this._runHooks('afterGenerate', results);

            this.logger.info(`Generation completed in ${duration}ms`);

            return {
                success: true,
                duration,
                files: results.files,
                errors: this.state.errors,
                warnings: this.state.warnings,
                stats: results.stats
            };
        } catch (error) {
            this.state.generating = false;
            await this._handleError(error, 'generation');
            throw error;
        }
    }

    /**
     * Clean up resources
     * @returns {Promise<void>}
     */
    async cleanup() {
        try {
            this.emit('lifecycle:beforeCleanup');
            await this._runHooks('beforeCleanup');

            // Stop workers
            await this._stopWorkers();

            // Clean up components
            for (const component of Object.values(this.components)) {
                if (component.cleanup) {
                    await component.cleanup();
                }
            }

            // Clear state
            this.state = {
                initialized: false,
                generating: false,
                completed: false,
                errors: [],
                warnings: []
            };

            this.emit('lifecycle:afterCleanup');
            await this._runHooks('afterCleanup');

            this.logger?.info('Cleanup completed');
        } catch (error) {
            await this._handleError(error, 'cleanup');
        }
    }

    /**
     * Get current state
     * @returns {object} Current state
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Get statistics
     * @returns {object} Generation statistics
     */
    getStats() {
        return {
            state: this.getState(),
            components: Object.keys(this.components),
            plugins: this.pluginManager.list(),
            workers: this.workers.length,
            memory: process.memoryUsage()
        };
    }

    // ============================================================================
    // Private Methods
    // ============================================================================

    /**
     * Initialize all components with dependency injection
     */
    async _initializeComponents() {
        // Register core services in container
        this.container.register('config', () => this.config);
        this.container.register('logger', () => this.logger);
        this.container.register('eventBus', () => this);

        // Create components with dependencies
        const components = [
            { name: 'swaggerLoader', class: SwaggerLoader },
            { name: 'swaggerValidator', class: SwaggerValidator },
            { name: 'schemaParser', class: SchemaParser },
            { name: 'routeAnalyzer', class: RouteAnalyzer },
            { name: 'templateEngine', class: TemplateEngine },
            { name: 'typeGenerator', class: TypeGenerator },
            { name: 'apiClientGenerator', class: ApiClientGenerator },
            { name: 'componentGenerator', class: ComponentGenerator },
            { name: 'hookGenerator', class: HookGenerator },
            { name: 'testGenerator', class: TestGenerator },
            { name: 'fileWriter', class: FileWriter }
        ];

        for (const { name, class: ComponentClass } of components) {
            this._createComponent(name, ComponentClass);
        }

        // Initialize all components
        await Promise.all(
            Object.entries(this.components).map(async ([name, component]) => {
                if (component.initialize) {
                    await component.initialize();
                }
                this.logger.debug(`Component ${name} initialized`);
            })
        );
    }

    /**
     * Create component with dependency injection
     */
    _createComponent(name, ComponentClass, options = {}) {
        const dependencies = this._resolveDependencies(ComponentClass);
        const component = new ComponentClass({
            ...this.config?.[name],
            ...options,
            ...dependencies
        });

        this.components[name] = component;
        this.container.register(name, () => component);

        return component;
    }

    /**
     * Resolve component dependencies
     */
    _resolveDependencies(ComponentClass) {
        const deps = {};

        if (ComponentClass.dependencies) {
            for (const dep of ComponentClass.dependencies) {
                deps[dep] = this.container.resolve(dep);
            }
        }

        return deps;
    }

    /**
     * Load plugins
     */
    async _loadPlugins() {
        if (this.config.plugins?.enabled) {
            await this.pluginManager.loadAll(this.config.plugins);

            // Apply plugins to lifecycle
            for (const plugin of this.pluginManager.getActive()) {
                if (plugin.hooks) {
                    for (const [event, handler] of Object.entries(plugin.hooks)) {
                        this.addHook(event, handler.bind(plugin));
                    }
                }
            }
        }
    }

    /**
     * Run lifecycle hooks
     */
    async _runHooks(event, data) {
        const hooks = this.hooks[event] || [];

        for (const hook of hooks) {
            try {
                await hook(data, this);
            } catch (error) {
                this.logger.error(`Hook error in ${event}:`, error);
                this.state.warnings.push(`Hook error in ${event}: ${error.message}`);
            }
        }
    }

    /**
     * Load Swagger specification
     */
    async _loadSwagger() {
        const loader = this.components.swaggerLoader;
        const swagger = await loader.load(this.swaggerSource);

        this.emit('swagger:loaded', swagger);
        return swagger;
    }

    /**
     * Validate Swagger specification
     */
    async _validateSwagger(swagger) {
        const validator = this.components.swaggerValidator;
        const validation = await validator.validate(swagger);

        if (!validation.valid) {
            throw new Error(`Invalid Swagger: ${validation.errors.join(', ')}`);
        }

        if (validation.warnings.length > 0) {
            this.state.warnings.push(...validation.warnings);
        }

        this.emit('swagger:validated', validation);
    }

    /**
     * Parse schemas from Swagger
     */
    async _parseSchemas(swagger) {
        const parser = this.components.schemaParser;
        const schemas = await parser.parse(swagger);

        this.emit('schemas:parsed', schemas);
        return schemas;
    }

    /**
     * Analyze routes from Swagger
     */
    async _analyzeRoutes(swagger) {
        const analyzer = this.components.routeAnalyzer;
        const routes = await analyzer.analyze(swagger);

        this.emit('routes:analyzed', routes);
        return routes;
    }

    /**
     * Generate code with concurrency control
     */
    async _generateCode(context) {
        const generators = [
            { name: 'types', generator: 'typeGenerator' },
            { name: 'apiClient', generator: 'apiClientGenerator' },
            { name: 'components', generator: 'componentGenerator' },
            { name: 'hooks', generator: 'hookGenerator' },
            { name: 'tests', generator: 'testGenerator' }
        ];

        const results = {
            files: [],
            stats: {}
        };

        // Run generators with concurrency limit
        const generatorTasks = generators.map(({ name, generator }) =>
            this.limiter(async () => {
                try {
                    const startTime = Date.now();
                    const component = this.components[generator];

                    if (component && this.config.generation?.[name]?.enabled !== false) {
                        const generatedFiles = await component.generate(context);
                        results.files.push(...generatedFiles);
                        results.stats[name] = {
                            files: generatedFiles.length,
                            duration: Date.now() - startTime
                        };

                        this.emit(`${name}:generated`, generatedFiles);
                    }
                } catch (error) {
                    this.logger.error(`Error in ${name} generator:`, error);
                    this.state.errors.push(`${name} generation failed: ${error.message}`);
                }
            })
        );

        await Promise.all(generatorTasks);

        return results;
    }

    /**
     * Write generated files
     */
    async _writeFiles(results) {
        const writer = this.components.fileWriter;

        // Group files by directory for batch operations
        const filesByDir = results.files.reduce((acc, file) => {
            const dir = path.dirname(file.path);
            if (!acc[dir]) acc[dir] = [];
            acc[dir].push(file);
            return acc;
        }, {});

        // Write files with concurrency control
        const writeTasks = Object.entries(filesByDir).map(([dir, files]) =>
            this.limiter(async () => {
                await fs.mkdir(dir, { recursive: true });

                for (const file of files) {
                    await writer.write(file.path, file.content, file.options);
                    this.emit('file:written', file);
                }
            })
        );

        await Promise.all(writeTasks);
    }

    /**
     * Run post-generation tasks
     */
    async _runPostGeneration(results) {
        const tasks = [];

        // Format files if enabled
        if (this.config.generation?.formatting?.prettier?.enabled) {
            tasks.push(this._formatFiles(results.files));
        }

        // Run linter if enabled
        if (this.config.generation?.formatting?.eslint?.enabled) {
            tasks.push(this._lintFiles(results.files));
        }

        // Generate documentation if enabled
        if (this.config.features?.advanced?.apiDocumentation) {
            tasks.push(this._generateDocumentation(results));
        }

        await Promise.all(tasks);
    }

    /**
     * Format files using Prettier
     */
    async _formatFiles(files) {
        // Implementation would use prettier API
        this.logger.debug('Formatting files...');
    }

    /**
     * Lint files using ESLint
     */
    async _lintFiles(files) {
        // Implementation would use ESLint API
        this.logger.debug('Linting files...');
    }

    /**
     * Generate API documentation
     */
    async _generateDocumentation(results) {
        // Implementation would generate docs
        this.logger.debug('Generating documentation...');
    }

    /**
     * Setup error handlers
     */
    _setupErrorHandlers() {
        process.on('unhandledRejection', (error) => {
            this._handleError(error, 'unhandledRejection');
        });

        process.on('uncaughtException', (error) => {
            this._handleError(error, 'uncaughtException');
            process.exit(1);
        });
    }

    /**
     * Handle errors
     */
    async _handleError(error, context) {
        this.state.errors.push({
            context,
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });

        this.emit('error', error, context);

        // Track error
        this.usageTracker?.trackError(error, { context });

        // Run error hooks
        for (const handler of this.hooks.onError) {
            try {
                await handler(error, context, this);
            } catch (hookError) {
                console.error('Error in error hook:', hookError);
            }
        }

        this.logger?.error(`Error in ${context}:`, error);
    }

    /**
     * Create worker for CPU-intensive task
     */
    async _createWorker(task, data) {
        return new Promise((resolve, reject) => {
            const worker = new Worker(path.join(__dirname, 'workers', `${task}.worker.js`), {
                workerData: data
            });

            worker.on('message', resolve);
            worker.on('error', reject);
            worker.on('exit', (code) => {
                if (code !== 0) {
                    reject(new Error(`Worker stopped with exit code ${code}`));
                }
            });

            this.workers.push(worker);
        });
    }

    /**
     * Stop all workers
     */
    async _stopWorkers() {
        await Promise.all(
            this.workers.map(worker => worker.terminate())
        );
        this.workers = [];
    }
}

// Export main class and factory function
module.exports = SwaggerToNextjs;
module.exports.create = (options) => new SwaggerToNextjs(options);

// Export version
module.exports.version = require('../package.json').version;
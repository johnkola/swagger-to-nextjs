/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - MAIN ORCHESTRATOR
 * ============================================================================
 * FILE: src/index.js
 * VERSION: 2025-05-30 11:34:23
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

// Core components from Phase 2
const SwaggerLoader = require('./core/SwaggerLoader');
const SwaggerValidator = require('./core/SwaggerValidator');
const DirectoryManager = require('./core/DirectoryManager');

// Error handling from Phase 2
const ErrorHandler = require('./errors/ErrorHandler');
const GeneratorError = require('./errors/GeneratorError');

// Logging from Phase 2
const Logger = require('./logging/Logger');
const ProgressReporter = require('./logging/ProgressReporter');

// Generators from Phase 3
const BaseGenerator = require('./generators/BaseGenerator');
const ApiRouteGenerator = require('./generators/ApiRouteGenerator');
const PageComponentGenerator = require('./generators/PageComponentGenerator');
const ConfigFileGenerator = require('./generators/ConfigFileGenerator');

// Template system from Phase 3
const TemplateEngine = require('./templates/TemplateEngine');
const TemplateLoader = require('./templates/TemplateLoader');

// Utilities from Phase 3
const PathUtils = require('./utils/PathUtils');
const SchemaUtils = require('./utils/SchemaUtils');
const ValidationUtils = require('./utils/ValidationUtils');
const StringUtils = require('./utils/StringUtils');

// Note: ConfigValidator, ConfigMerger, EnvironmentConfig are from Phase 5
// Note: PluginManager, HookSystem are from Phase 6
// Note: UsageTracker is from Phase 4
// These will be implemented in later phases

/**
 * The main orchestrator class for Swagger to Next.js generation
 * Implements a fluent API with comprehensive lifecycle management
 */
class SwaggerToNextjs extends EventEmitter {
    constructor(options = {}) {
        super();

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

        // Concurrency control
        this.concurrencyLimit = options.concurrency || 5;
        this.limiter = pLimit(this.concurrencyLimit);

        // Worker pool for CPU-intensive tasks
        this.workers = [];
        this.maxWorkers = options.maxWorkers || require('os').cpus().length;

        // Error handler
        this.errorHandler = new ErrorHandler({
            logger: null, // Will be set after logger initialization
            eventBus: this
        });

        // Progress reporter
        this.progressReporter = null;

        // Increase max listeners to prevent warnings in tests
        if (process.env.NODE_ENV === 'test') {
            process.setMaxListeners(0); // 0 = unlimited
        }

        // Store process handlers for cleanup
        this._processHandlers = {
            unhandledRejection: (error) => {
                this.errorHandler?.handle(error, 'unhandledRejection');
            },
            uncaughtException: (error) => {
                this.errorHandler?.handle(error, 'uncaughtException');
                process.exit(1);
            },
            SIGINT: async () => {
                this.logger?.info('Received SIGINT, shutting down gracefully...');
                await this.cleanup();
                process.exit(0);
            },
            SIGTERM: async () => {
                this.logger?.info('Received SIGTERM, shutting down gracefully...');
                await this.cleanup();
                process.exit(0);
            }
        };

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
            // Load and merge configuration
            this.config = await this._loadConfiguration(configPath);

            // Basic configuration validation
            if (!this.config) {
                throw new GeneratorError('Invalid configuration', {
                    code: 'CONFIG_INVALID'
                });
            }

            // Initialize logger
            this.logger = new Logger(this.config.logging || {});
            this.errorHandler.logger = this.logger;

            // Initialize progress reporter
            this.progressReporter = new ProgressReporter({
                logger: this.logger,
                ...this.config.progress
            });

            // Initialize all components
            await this._initializeComponents();

            // Mark as initialized
            this.state.initialized = true;

            this.logger.info('SwaggerToNextjs initialized successfully');

            return this;
        } catch (error) {
            await this.errorHandler.handle(error, 'initialization');
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
            this.config.output = { ...this.config.output, baseDir: outputDir };
        } else {
            this.options.outputDir = outputDir;
        }
        return this;
    }

    /**
     * Add plugin (placeholder for Phase 6)
     * @param {string|object} plugin - Plugin name or instance
     * @param {object} options - Plugin options
     * @returns {SwaggerToNextjs} Self for chaining
     */
    usePlugin(plugin, options = {}) {
        // Will be implemented in Phase 6
        this.logger?.warn('Plugin system not yet implemented');
        return this;
    }

    /**
     * Add lifecycle hook (placeholder for Phase 6)
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     * @returns {SwaggerToNextjs} Self for chaining
     */
    addHook(event, handler) {
        // Will be implemented in Phase 6
        this.logger?.warn('Hook system not yet implemented');
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
            throw new GeneratorError('Generator not initialized. Call initialize() first.', {
                code: 'NOT_INITIALIZED'
            });
        }

        if (this.state.generating) {
            throw new GeneratorError('Generation already in progress', {
                code: 'GENERATION_IN_PROGRESS'
            });
        }

        try {
            this.state.generating = true;

            const startTime = Date.now();

            // Initialize progress tracking
            const progress = this.progressReporter.createProgress('generation', {
                total: 6,
                description: 'Generating Next.js application from Swagger'
            });

            // Load Swagger specification
            progress.update(1, 'Loading Swagger specification...');
            const swagger = await this._loadSwagger();

            // Validate Swagger
            progress.update(2, 'Validating Swagger specification...');
            await this._validateSwagger(swagger);

            // Prepare generation context
            progress.update(3, 'Preparing generation context...');
            const context = await this._prepareContext(swagger, options);

            // Generate API routes
            progress.update(4, 'Generating API routes...');
            const apiResults = await this._generateApiRoutes(context);

            // Generate page components
            progress.update(5, 'Generating page components...');
            const pageResults = await this._generatePageComponents(context);

            // Generate configuration files
            progress.update(6, 'Generating configuration files...');
            const configResults = await this._generateConfigFiles(context);

            // Combine results
            const results = {
                files: [
                    ...apiResults.files,
                    ...pageResults.files,
                    ...configResults.files
                ],
                stats: {
                    api: apiResults.stats,
                    pages: pageResults.stats,
                    config: configResults.stats
                }
            };

            // Write files
            await this._writeFiles(results);

            const duration = Date.now() - startTime;
            progress.complete(`Generation completed in ${duration}ms`);

            this.state.completed = true;
            this.state.generating = false;

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
            await this.errorHandler.handle(error, 'generation');
            throw error;
        }
    }

    /**
     * Clean up resources
     * @returns {Promise<void>}
     */
    async cleanup() {
        try {
            // Stop workers
            await this._stopWorkers();

            // Clean up components
            for (const [name, component] of Object.entries(this.components)) {
                if (component.cleanup && typeof component.cleanup === 'function') {
                    await component.cleanup();
                    this.logger?.debug(`Component ${name} cleaned up`);
                }
            }

            // Remove process handlers
            process.removeListener('unhandledRejection', this._processHandlers.unhandledRejection);
            process.removeListener('uncaughtException', this._processHandlers.uncaughtException);
            process.removeListener('SIGINT', this._processHandlers.SIGINT);
            process.removeListener('SIGTERM', this._processHandlers.SIGTERM);

            // Clear state
            this.state = {
                initialized: false,
                generating: false,
                completed: false,
                errors: [],
                warnings: []
            };

            this.logger?.info('Cleanup completed');
        } catch (error) {
            await this.errorHandler.handle(error, 'cleanup');
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
            workers: this.workers.length,
            memory: process.memoryUsage()
        };
    }

    // ============================================================================
    // Private Methods
    // ============================================================================

    /**
     * Load and merge configuration
     */
    async _loadConfiguration(configPath) {
        // Basic configuration loading - Phase 5 components will enhance this
        let config = {};

        if (typeof configPath === 'string') {
            const configContent = await fs.readFile(configPath, 'utf8');
            config = configPath.endsWith('.json')
                ? JSON.parse(configContent)
                : require('js-yaml').load(configContent);
        } else if (typeof configPath === 'object') {
            config = configPath;
        }

        // Merge with defaults
        const defaultConfig = require('../config/defaults');
        config = { ...defaultConfig, ...config };

        // Merge with constructor options
        if (this.options.outputDir) {
            config.output = { ...config.output, baseDir: this.options.outputDir };
        }

        return config;
    }

    /**
     * Initialize all components
     */
    async _initializeComponents() {
        this.logger.info('Initializing components...');

        // Ensure we have a valid output directory
        const outputDir = this.config?.output?.baseDir || this.options?.outputDir || process.cwd();

        // Common options for all components
        const componentOptions = {
            logger: this.logger,
            outputDir: outputDir,
            config: this.config,
            eventBus: this,
            ...this.options
        };

        // Initialize utilities first (they don't need outputDir)
        this.components.pathUtils = new PathUtils();
        this.components.schemaUtils = new SchemaUtils();
        this.components.validationUtils = new ValidationUtils();
        this.components.stringUtils = new StringUtils();

        // Initialize core components
        this.components.swaggerLoader = new SwaggerLoader(componentOptions);
        this.components.swaggerValidator = new SwaggerValidator(componentOptions);
        this.components.directoryManager = new DirectoryManager(componentOptions);

        // Initialize template system
        this.components.templateEngine = new TemplateEngine(componentOptions);
        this.components.templateLoader = new TemplateLoader(componentOptions);

        // Initialize generators with all required dependencies
        const generatorOptions = {
            ...componentOptions,
            templateEngine: this.components.templateEngine,
            templateLoader: this.components.templateLoader,
            directoryManager: this.components.directoryManager,
            stringUtils: this.components.stringUtils,
            schemaUtils: this.components.schemaUtils,
            pathUtils: this.components.pathUtils,
            validationUtils: this.components.validationUtils
        };

        this.components.apiRouteGenerator = new ApiRouteGenerator(generatorOptions);
        this.components.pageComponentGenerator = new PageComponentGenerator(generatorOptions);
        this.components.configFileGenerator = new ConfigFileGenerator(generatorOptions);

        // Initialize all components that have an initialize method
        for (const [name, component] of Object.entries(this.components)) {
            if (component && typeof component.initialize === 'function') {
                try {
                    await component.initialize(this.config);
                    this.logger.debug(`Component ${name} initialized`);
                } catch (error) {
                    this.logger.error(`Failed to initialize ${name}:`, error);
                    throw new GeneratorError(`Component initialization failed: ${name}`, {
                        code: 'COMPONENT_INIT_ERROR',
                        component: name,
                        error: error.message
                    });
                }
            }
        }

        this.logger.info('All components initialized successfully');
    }

    /**
     * Load plugins (placeholder for Phase 6)
     */
    async _loadPlugins() {
        // Will be implemented in Phase 6
        this.logger?.debug('Plugin loading will be implemented in Phase 6');
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
            throw new GeneratorError('Invalid Swagger specification', {
                errors: validation.errors,
                code: 'SWAGGER_INVALID'
            });
        }

        if (validation.warnings.length > 0) {
            this.state.warnings.push(...validation.warnings);
            validation.warnings.forEach(warning => {
                this.logger.warn(`Swagger validation warning: ${warning}`);
            });
        }

        this.emit('swagger:validated', validation);
    }

    /**
     * Prepare generation context
     */
    async _prepareContext(swagger, options) {
        const context = {
            swagger,
            options: { ...this.config, ...options },
            paths: this.components.pathUtils.extractPaths(swagger),
            schemas: this.components.schemaUtils.extractSchemas(swagger),
            outputDir: this.config?.output?.baseDir || this.options?.outputDir || process.cwd(),
            metadata: {
                generatedAt: new Date().toISOString(),
                generatorVersion: require('../package.json').version,
                swaggerVersion: swagger.openapi || swagger.swagger
            }
        };

        return context;
    }

    /**
     * Generate API routes
     */
    async _generateApiRoutes(context) {
        const generator = this.components.apiRouteGenerator;
        const startTime = Date.now();

        const files = await generator.generate(context);

        return {
            files,
            stats: {
                count: files.length,
                duration: Date.now() - startTime
            }
        };
    }

    /**
     * Generate page components
     */
    async _generatePageComponents(context) {
        const generator = this.components.pageComponentGenerator;
        const startTime = Date.now();

        const files = await generator.generate(context);

        return {
            files,
            stats: {
                count: files.length,
                duration: Date.now() - startTime
            }
        };
    }

    /**
     * Generate configuration files
     */
    async _generateConfigFiles(context) {
        const generator = this.components.configFileGenerator;
        const startTime = Date.now();

        const files = await generator.generate(context);

        return {
            files,
            stats: {
                count: files.length,
                duration: Date.now() - startTime
            }
        };
    }

    /**
     * Write generated files
     */
    async _writeFiles(results) {
        const directoryManager = this.components.directoryManager;

        // Prepare directories
        const directories = new Set();
        results.files.forEach(file => {
            directories.add(path.dirname(file.path));
        });

        // Create directories
        for (const dir of directories) {
            await directoryManager.ensureDirectory(dir);
        }

        // Write files with concurrency control
        const writeTasks = results.files.map(file =>
            this.limiter(async () => {
                await directoryManager.writeFile(file.path, file.content, {
                    ...file.options,
                    backup: this.config.backup?.enabled
                });
                this.emit('file:written', file);
            })
        );

        await Promise.all(writeTasks);
    }

    /**
     * Setup error handlers
     */
    _setupErrorHandlers() {
        process.on('unhandledRejection', this._processHandlers.unhandledRejection);
        process.on('uncaughtException', this._processHandlers.uncaughtException);
        process.on('SIGINT', this._processHandlers.SIGINT);
        process.on('SIGTERM', this._processHandlers.SIGTERM);
    }

    /**
     * Create worker for CPU-intensive task
     */
    async _createWorker(task, data) {
        if (this.workers.length >= this.maxWorkers) {
            throw new GeneratorError('Worker pool exhausted', {
                code: 'WORKER_POOL_EXHAUSTED',
                maxWorkers: this.maxWorkers
            });
        }

        return new Promise((resolve, reject) => {
            const worker = new Worker(
                path.join(__dirname, 'workers', `${task}.worker.js`),
                { workerData: data }
            );

            worker.on('message', (result) => {
                const index = this.workers.indexOf(worker);
                if (index > -1) {
                    this.workers.splice(index, 1);
                }
                resolve(result);
            });

            worker.on('error', (error) => {
                const index = this.workers.indexOf(worker);
                if (index > -1) {
                    this.workers.splice(index, 1);
                }
                reject(error);
            });

            worker.on('exit', (code) => {
                if (code !== 0) {
                    reject(new GeneratorError(`Worker stopped with exit code ${code}`, {
                        code: 'WORKER_EXIT_ERROR',
                        exitCode: code
                    }));
                }
            });

            this.workers.push(worker);
        });
    }

    /**
     * Stop all workers
     */
    async _stopWorkers() {
        const terminationPromises = this.workers.map(worker =>
            worker.terminate().catch(err =>
                this.logger?.error('Error terminating worker:', err)
            )
        );

        await Promise.all(terminationPromises);
        this.workers = [];
    }
}

// Export main class and factory function
module.exports = SwaggerToNextjs;
module.exports.create = (options) => new SwaggerToNextjs(options);

// Export version
module.exports.version = require('../package.json').version;
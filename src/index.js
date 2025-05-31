/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - AI PROMPT
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

// Configuration from Phase 5
const ConfigValidator = require('./config/ConfigValidator');
const ConfigMerger = require('./config/ConfigMerger');
const EnvironmentConfig = require('./config/EnvironmentConfig');

// Plugin system from Phase 6
const PluginManager = require('./plugins/PluginManager');
const HookSystem = require('./hooks/HookSystem');

// Analytics
const UsageTracker = require('./analytics/UsageTracker');

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

        // Hook system
        this.hookSystem = new HookSystem();

        // Concurrency control
        this.concurrencyLimit = options.concurrency || 5;
        this.limiter = pLimit(this.concurrencyLimit);

        // Worker pool for CPU-intensive tasks
        this.workers = [];
        this.maxWorkers = options.maxWorkers || require('os').cpus().length;

        // Plugin manager
        this.pluginManager = new PluginManager();

        // Usage tracking
        this.usageTracker = new UsageTracker({
            enabled: options.telemetry !== false
        });

        // Error handler
        this.errorHandler = new ErrorHandler({
            logger: null, // Will be set after logger initialization
            eventBus: this
        });

        // Progress reporter
        this.progressReporter = null;

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
            await this.hookSystem.runHooks('beforeInit', { generator: this });

            // Load and merge configuration
            this.config = await this._loadConfiguration(configPath);

            // Validate configuration
            const configValidator = new ConfigValidator();
            const validation = await configValidator.validate(this.config);
            if (!validation.valid) {
                throw new GeneratorError('Invalid configuration', {
                    errors: validation.errors,
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

            // Load plugins
            await this._loadPlugins();

            // Mark as initialized
            this.state.initialized = true;

            await this.hookSystem.runHooks('afterInit', {
                generator: this,
                config: this.config
            });

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
        this.hookSystem.register(event, handler);
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

            await this.hookSystem.runHooks('beforeGenerate', {
                generator: this,
                options
            });

            const startTime = Date.now();

            // Track generation start
            await this.usageTracker.trackGeneration('start', {
                source: this.swaggerSource,
                options: options
            });

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

            // Track generation completion
            await this.usageTracker.trackGeneration('complete', {
                duration,
                filesGenerated: results.files.length,
                errors: this.state.errors.length,
                warnings: this.state.warnings.length
            });

            this.state.completed = true;
            this.state.generating = false;

            await this.hookSystem.runHooks('afterGenerate', {
                generator: this,
                results
            });

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
            await this.hookSystem.runHooks('beforeCleanup', { generator: this });

            // Stop workers
            await this._stopWorkers();

            // Clean up components
            for (const [name, component] of Object.entries(this.components)) {
                if (component.cleanup && typeof component.cleanup === 'function') {
                    await component.cleanup();
                    this.logger?.debug(`Component ${name} cleaned up`);
                }
            }

            // Clean up plugin manager
            await this.pluginManager.cleanup();

            // Clear state
            this.state = {
                initialized: false,
                generating: false,
                completed: false,
                errors: [],
                warnings: []
            };

            await this.hookSystem.runHooks('afterCleanup', { generator: this });

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
            plugins: this.pluginManager.list(),
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
        const configMerger = new ConfigMerger();
        const environmentConfig = new EnvironmentConfig();

        // Load base configuration
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
        config = await configMerger.merge(defaultConfig, config);

        // Apply environment overrides
        config = await environmentConfig.apply(config);

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
        // Create components map
        const componentsToCreate = [
            { name: 'swaggerLoader', class: SwaggerLoader },
            { name: 'swaggerValidator', class: SwaggerValidator },
            { name: 'directoryManager', class: DirectoryManager },
            { name: 'templateEngine', class: TemplateEngine },
            { name: 'templateLoader', class: TemplateLoader },
            { name: 'apiRouteGenerator', class: ApiRouteGenerator },
            { name: 'pageComponentGenerator', class: PageComponentGenerator },
            { name: 'configFileGenerator', class: ConfigFileGenerator },
            { name: 'pathUtils', class: PathUtils },
            { name: 'schemaUtils', class: SchemaUtils },
            { name: 'validationUtils', class: ValidationUtils },
            { name: 'stringUtils', class: StringUtils }
        ];

        // Create components with shared dependencies
        const sharedDeps = {
            config: this.config,
            logger: this.logger,
            eventBus: this,
            hookSystem: this.hookSystem
        };

        for (const { name, class: ComponentClass } of componentsToCreate) {
            this.components[name] = new ComponentClass({
                ...sharedDeps,
                ...this.config[name]
            });
        }

        // Initialize components that need it
        for (const [name, component] of Object.entries(this.components)) {
            if (component.initialize && typeof component.initialize === 'function') {
                await component.initialize();
                this.logger.debug(`Component ${name} initialized`);
            }
        }
    }

    /**
     * Load plugins
     */
    async _loadPlugins() {
        if (this.config.plugins?.enabled) {
            await this.pluginManager.loadAll(this.config.plugins.list || []);

            // Register plugin hooks
            const plugins = this.pluginManager.getActive();
            for (const plugin of plugins) {
                if (plugin.hooks) {
                    for (const [event, handler] of Object.entries(plugin.hooks)) {
                        this.hookSystem.register(event, handler.bind(plugin));
                    }
                }
            }

            this.logger.info(`Loaded ${plugins.length} plugins`);
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
            metadata: {
                generatedAt: new Date().toISOString(),
                generatorVersion: require('../package.json').version,
                swaggerVersion: swagger.openapi || swagger.swagger
            }
        };

        await this.hookSystem.runHooks('contextPrepared', context);

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
        process.on('unhandledRejection', (error) => {
            this.errorHandler?.handle(error, 'unhandledRejection');
        });

        process.on('uncaughtException', (error) => {
            this.errorHandler?.handle(error, 'uncaughtException');
            process.exit(1);
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            this.logger?.info('Received SIGINT, shutting down gracefully...');
            await this.cleanup();
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            this.logger?.info('Received SIGTERM, shutting down gracefully...');
            await this.cleanup();
            process.exit(0);
        });
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
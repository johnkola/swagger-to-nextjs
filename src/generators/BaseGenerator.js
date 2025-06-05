/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - BASE GENERATOR
 * ============================================================================
 * FILE: src/generators/BaseGenerator.js
 * VERSION: 2025-05-30 11:34:23
 * PHASE: PHASE 3: Code Generation Engine
 * CATEGORY: 🏗️ Base Generators
 * ============================================================================
 *
 * PURPOSE:
 * Sophisticated abstract base generator class that:
 * - Implements a template method pattern for generation workflow
 * - Provides lifecycle hooks (before, during, after generation)
 * - Implements dependency injection for services
 * - Provides template variable resolution
 * - Implements file conflict resolution strategies
 * - Supports incremental generation
 * - Provides rollback capabilities
 * - Implements generation metrics
 * - Supports dry-run mode
 * - Provides extension points for customization
 * - Includes all utility classes for child generators
 *
 * ============================================================================
 */
const { EventEmitter } = require('events');
const path = require('path');
const fs = require('fs').promises;
const { performance } = require('perf_hooks');

// Phase 2 components
const Logger = require('../logging/Logger');
const GeneratorError = require('../errors/GeneratorError');
const DirectoryManager = require('../core/DirectoryManager');

// Phase 3 components
const TemplateEngine = require('../templates/TemplateEngine');

// Import all utility classes
const StringUtils = require('../utils/StringUtils');
const SchemaUtils = require('../utils/SchemaUtils');
const PathUtils = require('../utils/PathUtils');
const ValidationUtils = require('../utils/ValidationUtils');

/**
 * Abstract base generator class implementing a template method pattern
 * with integrated utilities for all child generators
 */
class BaseGenerator extends EventEmitter {
    constructor(options = {}) {
        super();

        this.options = {
            dryRun: false,
            incremental: true,
            formatCode: true,
            conflictStrategy: 'prompt', // 'prompt' | 'overwrite' | 'skip' | 'backup'
            metricsEnabled: true,
            rollbackEnabled: true,
            templateDir: 'templates',
            outputSubdir: '',
            ...options
        };

        // Dependencies injection
        this.logger = options.logger || new Logger({ context: this.constructor.name });
        this.templateEngine = options.templateEngine || new TemplateEngine(options);
        this.directoryManager = options.directoryManager || new DirectoryManager(options);
        this.templateLoader = options.templateLoader; // Optional, from Phase 3

        // Initialize utility instances for all child generators
        this.utils = {
            string: options.stringUtils || new StringUtils(),
            schema: options.schemaUtils || new SchemaUtils(),
            path: options.pathUtils || new PathUtils(),
            validation: options.validationUtils || new ValidationUtils()
        };

        // Convenience references (for easier access in child classes)
        this.stringUtils = this.utils.string;
        this.schemaUtils = this.utils.schema;
        this.pathUtils = this.utils.path;
        this.validationUtils = this.utils.validation;

        // Output directory
        this.outputDir = path.join(
            options.outputDir || process.cwd(),
            this.options.outputSubdir
        );

        // Generation state
        this.state = {
            initialized: false,
            generating: false,
            completed: false,
            generatedFiles: [],
            modifiedFiles: [],
            skippedFiles: [],
            conflicts: [],
            metrics: {
                startTime: null,
                endTime: null,
                filesGenerated: 0,
                filesModified: 0,
                filesSkipped: 0,
                totalSize: 0
            }
        };

        // Rollback tracking
        this.rollbackData = {
            originalFiles: new Map(),
            createdFiles: new Set(),
            modifiedFiles: new Map()
        };

        // Extension points map
        this.extensions = new Map();

        // Lifecycle hooks
        this.hooks = {
            beforeInit: [],
            afterInit: [],
            beforeValidate: [],
            afterValidate: [],
            beforeGenerate: [],
            afterGenerate: [],
            beforeWrite: [],
            afterWrite: [],
            onError: [],
            onConflict: []
        };
    }

    /**
     * Template method - main generation workflow
     */
    async generate(context) {
        if (this.state.generating) {
            throw new GeneratorError('Generation already in progress', {
                code: 'GENERATION_IN_PROGRESS'
            });
        }

        try {
            this.state.generating = true;
            this.state.metrics.startTime = performance.now();

            // Lifecycle: Initialize
            await this._runHooks('beforeInit', context);
            await this.initialize(context);
            await this._runHooks('afterInit', context);

            // Lifecycle: Validate
            await this._runHooks('beforeValidate', context);
            await this.validate(context);
            await this._runHooks('afterValidate', context);

            // Lifecycle: Prepare
            const preparedContext = await this.prepare(context);

            // Lifecycle: Generate
            await this._runHooks('beforeGenerate', preparedContext);
            const files = await this.doGenerate(preparedContext);
            await this._runHooks('afterGenerate', files);

            // Lifecycle: Process
            const processedFiles = await this.process(files);

            // Lifecycle: Write
            if (!this.options.dryRun) {
                await this._runHooks('beforeWrite', processedFiles);
                await this.write(processedFiles);
                await this._runHooks('afterWrite', processedFiles);
            }

            // Lifecycle: Finalize
            await this.finalize(processedFiles);

            this.state.completed = true;
            this.state.generating = false;
            this.state.metrics.endTime = performance.now();

            return this.getResults();

        } catch (error) {
            this.state.generating = false;
            await this._handleError(error);

            if (this.options.rollbackEnabled && !this.options.dryRun) {
                await this.rollback();
            }

            throw error;
        }
    }

    /**
     * Initialize generator - override in subclasses
     */
    async initialize(context) {
        this.logger.debug('Initializing generator');

        // Initialize template engine if needed
        if (this.templateEngine.initialize) {
            await this.templateEngine.initialize();
        }

        // Load templates
        await this.loadTemplates();

        // Setup output directory
        if (context.outputDir) {
            this.outputDir = path.join(context.outputDir, this.options.outputSubdir);
        }

        // Ensure output directory exists
        if (!this.options.dryRun) {
            await this.directoryManager.ensureDirectory(this.outputDir);
        }

        this.state.initialized = true;
        this.emit('initialized', { generator: this.constructor.name });
    }

    /**
     * Validate context - override in subclasses
     */
    async validate(context) {
        this.logger.debug('Validating context');

        if (!context) {
            throw new GeneratorError('Context is required', {
                code: 'MISSING_CONTEXT'
            });
        }

        if (!context.swagger && !context.openapi) {
            throw new GeneratorError('Swagger/OpenAPI specification is required', {
                code: 'MISSING_SPEC'
            });
        }

        // Subclasses should implement specific validation
        await this.doValidate(context);

        this.emit('validated', { valid: true });
    }

    /**
     * Prepare context - override in subclasses
     */
    async prepare(context) {
        this.logger.debug('Preparing context');

        // Extract common data using utilities
        const enhancedContext = {
            ...context,
            outputDir: this.outputDir,
            generator: {
                name: this.constructor.name,
                version: this.options.version || '1.0.0',
                timestamp: new Date().toISOString()
            }
        };

        // Use utilities to enhance context if swagger is present
        if (context.swagger || context.openapi) {
            const spec = context.swagger || context.openapi;

            // Extract schemas using SchemaUtils
            if (!enhancedContext.schemas) {
                enhancedContext.schemas = this.schemaUtils.extractSchemas(spec);
            }

            // Extract paths using PathUtils
            if (!enhancedContext.paths) {
                enhancedContext.paths = this.pathUtils.extractPaths(spec);
            }

            // Group paths by resource
            enhancedContext.resourceGroups = this.pathUtils.groupPathsByResource(enhancedContext.paths);
        }

        // Subclass-specific preparation
        const customPrepared = await this.doPrepare(enhancedContext);

        this.emit('prepared', customPrepared);
        return customPrepared;
    }

    /**
     * Process generated files - formatting, optimization
     */
    async process(files) {
        this.logger.debug(`Processing ${files.length} files`);

        const processed = [];

        for (const file of files) {
            try {
                let processedFile = { ...file };

                // Ensure file has required properties
                if (!processedFile.path) {
                    throw new GeneratorError('File path is required', {
                        code: 'MISSING_FILE_PATH'
                    });
                }

                if (!processedFile.content) {
                    processedFile.content = '';
                }

                // Apply extensions
                for (const [name, extension] of this.extensions) {
                    if (extension.process) {
                        processedFile = await extension.process(processedFile);
                    }
                }

                // Calculate metrics
                processedFile.size = Buffer.byteLength(processedFile.content);
                this.state.metrics.totalSize += processedFile.size;

                processed.push(processedFile);

            } catch (error) {
                this.logger.error(`Error processing file ${file.path}:`, error);
                throw new GeneratorError(`Failed to process ${file.path}: ${error.message}`, {
                    code: 'PROCESS_ERROR',
                    file: file.path
                });
            }
        }

        this.emit('processed', processed);
        return processed;
    }

    /**
     * Write files with conflict resolution
     */
    async write(files) {
        this.logger.info(`Writing ${files.length} files`);

        for (const file of files) {
            try {
                const fullPath = path.resolve(file.path);
                const exists = await this._fileExists(fullPath);

                if (exists) {
                    // Handle conflict
                    const resolution = await this._resolveConflict(file);

                    switch (resolution) {
                        case 'overwrite':
                            await this._backupFile(fullPath);
                            await this._writeFile(file);
                            this.state.modifiedFiles.push(file);
                            this.state.metrics.filesModified++;
                            break;

                        case 'skip':
                            this.state.skippedFiles.push(file);
                            this.state.metrics.filesSkipped++;
                            this.logger.info(`Skipped ${file.path}`);
                            break;

                        case 'backup':
                            await this._backupAndWrite(file);
                            this.state.modifiedFiles.push(file);
                            this.state.metrics.filesModified++;
                            break;

                        default:
                            throw new GeneratorError(`Unknown conflict resolution: ${resolution}`, {
                                code: 'UNKNOWN_RESOLUTION'
                            });
                    }
                } else {
                    // New file
                    await this._writeFile(file);
                    this.state.generatedFiles.push(file);
                    this.state.metrics.filesGenerated++;
                    this.rollbackData.createdFiles.add(fullPath);
                }

            } catch (error) {
                this.logger.error(`Error writing file ${file.path}:`, error);
                throw new GeneratorError(`Failed to write ${file.path}: ${error.message}`, {
                    code: 'WRITE_ERROR',
                    file: file.path
                });
            }
        }

        this.emit('written', { count: files.length });
    }

    /**
     * Finalize generation - cleanup, reporting
     */
    async finalize(files) {
        this.logger.debug('Finalizing generation');

        // Generate summary report
        const report = this.generateReport();

        // Save metrics if enabled
        if (this.options.metricsEnabled) {
            await this.saveMetrics(report);
        }

        // Clean up temporary files
        await this.cleanup();

        this.emit('finalized', report);
    }

    /**
     * Get generation results
     */
    getResults() {
        const duration = this.state.metrics.endTime - this.state.metrics.startTime;

        return {
            success: this.state.completed,
            duration: Math.round(duration),
            files: {
                generated: this.state.generatedFiles,
                modified: this.state.modifiedFiles,
                skipped: this.state.skippedFiles
            },
            metrics: this.state.metrics,
            conflicts: this.state.conflicts
        };
    }

    /**
     * Generate summary report
     */
    generateReport() {
        const duration = this.state.metrics.endTime - this.state.metrics.startTime;

        return {
            generator: this.constructor.name,
            timestamp: new Date().toISOString(),
            duration: Math.round(duration),
            summary: {
                filesGenerated: this.state.metrics.filesGenerated,
                filesModified: this.state.metrics.filesModified,
                filesSkipped: this.state.metrics.filesSkipped,
                totalSize: this.state.metrics.totalSize,
                conflicts: this.state.conflicts.length
            },
            files: {
                generated: this.state.generatedFiles.map(f => f.path),
                modified: this.state.modifiedFiles.map(f => f.path),
                skipped: this.state.skippedFiles.map(f => f.path)
            }
        };
    }

    /**
     * Rollback changes
     */
    async rollback() {
        this.logger.warn('Rolling back changes');

        try {
            // Remove created files
            for (const filePath of this.rollbackData.createdFiles) {
                if (await this._fileExists(filePath)) {
                    await fs.unlink(filePath);
                    this.logger.debug(`Removed ${filePath}`);
                }
            }

            // Restore modified files
            for (const [filePath, originalContent] of this.rollbackData.modifiedFiles) {
                await fs.writeFile(filePath, originalContent);
                this.logger.debug(`Restored ${filePath}`);
            }

            this.emit('rolledback', {
                created: this.rollbackData.createdFiles.size,
                restored: this.rollbackData.modifiedFiles.size
            });

        } catch (error) {
            this.logger.error('Rollback failed:', error);
            throw new GeneratorError(`Rollback failed: ${error.message}`, {
                code: 'ROLLBACK_ERROR'
            });
        }
    }

    /**
     * Add lifecycle hook
     */
    addHook(event, handler) {
        if (!this.hooks[event]) {
            throw new GeneratorError(`Unknown hook event: ${event}`, {
                code: 'UNKNOWN_HOOK'
            });
        }

        this.hooks[event].push(handler);
        return this;
    }

    /**
     * Register extension
     */
    registerExtension(name, extension) {
        this.extensions.set(name, extension);
        this.logger.debug(`Registered extension: ${name}`);
        return this;
    }

    // ============================================================================
    // Utility Helper Methods (Available to all child generators)
    // ============================================================================

    /**
     * Generate safe file path
     * @param {string} filePath - Original file path
     * @returns {string} Safe file path
     */
    generateSafeFilePath(filePath) {
        // Use PathUtils to ensure safe path
        const safePath = this.pathUtils.generateSafePath(filePath);
        return path.join(this.outputDir, safePath);
    }

    /**
     * Generate TypeScript type from schema
     * @param {object} schema - OpenAPI schema
     * @param {string} name - Type name
     * @returns {string} TypeScript type definition
     */
    generateTypeFromSchema(schema, name) {
        return this.schemaUtils.schemaToTypeScript(schema, name, {
            export: true,
            readonly: false
        });
    }

    /**
     * Generate validation schema
     * @param {object} schema - OpenAPI schema
     * @param {string} library - Validation library
     * @returns {string} Validation schema code
     */
    generateValidation(schema, library = 'zod') {
        return this.validationUtils.generateValidationSchema(schema, library);
    }

    /**
     * Convert string to various cases
     */
    toCamelCase(str) { return this.stringUtils.toCamelCase(str); }
    toPascalCase(str) { return this.stringUtils.toPascalCase(str); }
    toKebabCase(str) { return this.stringUtils.toKebabCase(str); }
    toSnakeCase(str) { return this.stringUtils.toSnakeCase(str); }
    toConstantCase(str) { return this.stringUtils.toConstantCase(str); }

    /**
     * Generate component name from resource
     * @param {string} resource - Resource name
     * @param {string} suffix - Component suffix
     * @returns {string} Component name
     */
    generateComponentName(resource, suffix = 'Component') {
        return this.stringUtils.toPascalCase(resource) + suffix;
    }

    /**
     * Generate file header comment
     * @param {string} filename - File name
     * @param {string} description - File description
     * @returns {string} File header comment
     */
    generateFileHeader(filename, description) {
        const timestamp = new Date().toISOString();
        const generatorName = this.constructor.name;

        return `/**
 * ${filename}
 * ${description}
 * 
 * Generated by: ${generatorName}
 * Generated at: ${timestamp}
 * Generator version: ${this.options.version || '1.0.0'}
 * 
 * DO NOT EDIT THIS FILE MANUALLY
 * All changes will be overwritten on next generation
 */`;
    }

    // ============================================================================
    // Abstract methods - must be implemented by subclasses
    // ============================================================================

    /**
     * Load templates - must be implemented
     */
    async loadTemplates() {
        // Default implementation - subclasses can override
        this.logger.debug('No templates to load in base generator');
    }

    /**
     * Validate implementation - must be implemented
     */
    async doValidate(context) {
        throw new GeneratorError('doValidate() must be implemented by subclass', {
            code: 'NOT_IMPLEMENTED'
        });
    }

    /**
     * Prepare implementation - must be implemented
     */
    async doPrepare(context) {
        // Default implementation - return context as-is
        return context;
    }

    /**
     * Generate implementation - must be implemented
     */
    async doGenerate(context) {
        throw new GeneratorError('doGenerate() must be implemented by subclass', {
            code: 'NOT_IMPLEMENTED'
        });
    }

    // ============================================================================
    // Protected methods
    // ============================================================================

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
                // Don't throw - hooks shouldn't break generation
            }
        }
    }

    /**
     * Handle errors
     */
    async _handleError(error) {
        this.logger.error('Generation error:', error);

        // Run error hooks
        for (const handler of this.hooks.onError) {
            try {
                await handler(error, this);
            } catch (hookError) {
                this.logger.error('Error hook failed:', hookError);
            }
        }

        this.emit('error', error);
    }

    /**
     * Resolve file conflicts
     */
    async _resolveConflict(file) {
        const conflict = {
            file: file.path,
            strategy: this.options.conflictStrategy,
            timestamp: new Date().toISOString()
        };

        this.state.conflicts.push(conflict);

        // Run conflict hooks
        for (const handler of this.hooks.onConflict) {
            const resolution = await handler(file, this);
            if (resolution) {
                return resolution;
            }
        }

        // Default strategy
        return this.options.conflictStrategy === 'prompt'
            ? 'skip' // In non-interactive mode, default to skip
            : this.options.conflictStrategy;
    }

    /**
     * Check if file exists
     */
    async _fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Write file
     */
    async _writeFile(file) {
        const fullPath = path.resolve(file.path);

        // Use DirectoryManager for safe file writing
        await this.directoryManager.writeFile(fullPath, file.content, {
            encoding: file.encoding || 'utf8',
            ...file.options
        });

        this.logger.debug(`Wrote ${file.path}`);
    }

    /**
     * Backup file
     */
    async _backupFile(filePath) {
        if (this.options.rollbackEnabled) {
            try {
                const content = await fs.readFile(filePath, 'utf8');
                this.rollbackData.modifiedFiles.set(filePath, content);
            } catch (error) {
                this.logger.warn(`Could not backup ${filePath}: ${error.message}`);
            }
        }
    }

    /**
     * Backup and write file
     */
    async _backupAndWrite(file) {
        const fullPath = path.resolve(file.path);
        const backupPath = `${fullPath}.backup.${Date.now()}`;

        // Create backup
        const content = await fs.readFile(fullPath, 'utf8');
        await fs.writeFile(backupPath, content);

        // Write new content
        await this._writeFile(file);

        this.logger.info(`Backed up ${file.path} to ${backupPath}`);
    }

    /**
     * Save metrics
     */
    async saveMetrics(report) {
        // Default implementation - emit metrics
        this.emit('metrics', report);

        // Subclasses can override to save metrics to file/database
        if (this.options.metricsFile) {
            const metricsPath = path.join(this.outputDir, this.options.metricsFile);
            await this.directoryManager.writeFile(
                metricsPath,
                JSON.stringify(report, null, 2)
            );
        }
    }

    /**
     * Clean up temporary files
     */
    async cleanup() {
        // Default implementation - emit cleanup event
        this.emit('cleanup');

        // Subclasses can override for specific cleanup
    }
}

module.exports = BaseGenerator;
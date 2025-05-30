/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - AI PROMPT
 * ============================================================================
 * FILE: src/generators/BaseGenerator.js
 * VERSION: 2025-05-28 15:14:56
 * PHASE: PHASE 3: Code Generation Engine
 * CATEGORY: 🏗️ Base Generators
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 *
 * Create a sophisticated abstract base generator class that:
 * - Implements template method pattern for generation workflow
 * - Provides lifecycle hooks (before, during, after generation)
 * - Implements dependency injection for services
 * - Provides template variable resolution
 * - Implements file conflict resolution strategies
 * - Supports incremental generation
 * - Provides rollback capabilities
 * - Implements generation metrics
 * - Supports dry-run mode
 * - Provides extension points for customization
 *
 * ============================================================================
 */

import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs-extra';
import { Logger } from '../logging/Logger.js';
import { GeneratorError } from '../errors/GeneratorError.js';
import { TemplateEngine } from '../templates/TemplateEngine.js';
import { FileWriter } from '../utils/FileWriter.js';
import { CodeFormatter } from '../utils/CodeFormatter.js';
import { performance } from 'perf_hooks';

/**
 * Abstract base generator class implementing template method pattern
 */
export class BaseGenerator extends EventEmitter {
    constructor(options = {}) {
        super();

        this.options = {
            dryRun: false,
            incremental: true,
            formatCode: true,
            conflictStrategy: 'prompt', // 'prompt' | 'overwrite' | 'skip' | 'backup'
            metricsEnabled: true,
            rollbackEnabled: true,
            ...options
        };

        // Dependencies injection
        this.logger = options.logger || new Logger({ context: this.constructor.name });
        this.templateEngine = options.templateEngine || new TemplateEngine();
        this.fileWriter = options.fileWriter || new FileWriter();
        this.codeFormatter = options.codeFormatter || new CodeFormatter();

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
            throw new GeneratorError('Generation already in progress');
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

            if (this.options.rollbackEnabled) {
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
        this.state.initialized = true;

        // Load templates
        await this.loadTemplates();

        // Setup working directory
        if (context.outputDir) {
            await fs.ensureDir(context.outputDir);
        }

        this.emit('initialized', { generator: this.constructor.name });
    }

    /**
     * Validate context - override in subclasses
     */
    async validate(context) {
        this.logger.debug('Validating context');

        if (!context) {
            throw new GeneratorError('Context is required');
        }

        if (!context.swagger) {
            throw new GeneratorError('Swagger specification is required');
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

        // Default preparation
        const prepared = {
            ...context,
            generator: {
                name: this.constructor.name,
                version: this.options.version || '1.0.0',
                timestamp: new Date().toISOString()
            }
        };

        // Subclass-specific preparation
        const customPrepared = await this.doPrepare(prepared);

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

                // Format code if enabled
                if (this.options.formatCode && this._isFormattable(file)) {
                    processedFile = await this._formatFile(processedFile);
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
                throw new GeneratorError(`Failed to process ${file.path}: ${error.message}`);
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
                const exists = await fs.pathExists(fullPath);

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
                            throw new GeneratorError(`Unknown conflict resolution: ${resolution}`);
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
                throw new GeneratorError(`Failed to write ${file.path}: ${error.message}`);
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
                if (await fs.pathExists(filePath)) {
                    await fs.remove(filePath);
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
            throw new GeneratorError(`Rollback failed: ${error.message}`);
        }
    }

    /**
     * Add lifecycle hook
     */
    addHook(event, handler) {
        if (this.hooks[event]) {
            this.hooks[event].push(handler);
        } else {
            throw new GeneratorError(`Unknown hook event: ${event}`);
        }
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
    // Abstract methods - must be implemented by subclasses
    // ============================================================================

    /**
     * Load templates - must be implemented
     */
    async loadTemplates() {
        throw new GeneratorError('loadTemplates() must be implemented by subclass');
    }

    /**
     * Validate implementation - must be implemented
     */
    async doValidate(context) {
        throw new GeneratorError('doValidate() must be implemented by subclass');
    }

    /**
     * Prepare implementation - must be implemented
     */
    async doPrepare(context) {
        throw new GeneratorError('doPrepare() must be implemented by subclass');
    }

    /**
     * Generate implementation - must be implemented
     */
    async doGenerate(context) {
        throw new GeneratorError('doGenerate() must be implemented by subclass');
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
     * Check if file is formattable
     */
    _isFormattable(file) {
        const formattableExtensions = [
            '.js', '.jsx', '.ts', '.tsx',
            '.json', '.css', '.scss', '.less',
            '.html', '.md', '.yml', '.yaml'
        ];

        return formattableExtensions.some(ext => file.path.endsWith(ext));
    }

    /**
     * Format file content
     */
    async _formatFile(file) {
        try {
            const formatted = await this.codeFormatter.format(file.content, {
                filepath: file.path,
                parser: this._getParser(file.path)
            });

            return {
                ...file,
                content: formatted,
                formatted: true
            };
        } catch (error) {
            this.logger.warn(`Failed to format ${file.path}:`, error.message);
            return file;
        }
    }

    /**
     * Get parser for file type
     */
    _getParser(filepath) {
        const ext = path.extname(filepath);
        const parserMap = {
            '.js': 'babel',
            '.jsx': 'babel',
            '.ts': 'typescript',
            '.tsx': 'typescript',
            '.json': 'json',
            '.css': 'css',
            '.scss': 'scss',
            '.less': 'less',
            '.html': 'html',
            '.md': 'markdown',
            '.yml': 'yaml',
            '.yaml': 'yaml'
        };

        return parserMap[ext] || 'babel';
    }

    /**
     * Write file
     */
    async _writeFile(file) {
        const fullPath = path.resolve(file.path);
        await fs.ensureDir(path.dirname(fullPath));
        await fs.writeFile(fullPath, file.content, file.encoding || 'utf8');
        this.logger.debug(`Wrote ${file.path}`);
    }

    /**
     * Backup file
     */
    async _backupFile(filePath) {
        if (this.options.rollbackEnabled) {
            const content = await fs.readFile(filePath, 'utf8');
            this.rollbackData.modifiedFiles.set(filePath, content);
        }
    }

    /**
     * Backup and write file
     */
    async _backupAndWrite(file) {
        const fullPath = path.resolve(file.path);
        const backupPath = `${fullPath}.backup.${Date.now()}`;

        await fs.copy(fullPath, backupPath);
        await this._writeFile(file);

        this.logger.info(`Backed up ${file.path} to ${backupPath}`);
    }

    /**
     * Save metrics
     */
    async saveMetrics(report) {
        // Subclasses can override to save metrics
        this.emit('metrics', report);
    }

    /**
     * Cleanup temporary files
     */
    async cleanup() {
        // Subclasses can override for cleanup
        this.emit('cleanup');
    }
}

export default BaseGenerator;
/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - AI PROMPT
 * ============================================================================
 * FILE: src/templates/TemplateEngine.js
 * VERSION: 2025-06-16 16:25:36
 * PHASE: Phase 4: Template System
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 *
 * Create a template engine wrapper class around Handlebars that manages
 * template loading and rendering for the code generator. This class should
 * load templates from the templates directory, compile and cache templates
 * for performance, register custom Handlebars helpers for code generation
 * tasks, support template overrides from user-specified directories, render
 * templates with provided data contexts, handle missing templates with
 * clear error messages, support partials for reusable template fragments,
 * and provide debugging information when template rendering fails.
 *
 * ============================================================================
 */
const Handlebars = require('handlebars');
const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const vm = require('vm');
/**
 * Advanced template engine with extended Handlebars functionality
 * @extends EventEmitter
 */
class TemplateEngine extends EventEmitter {
    constructor(options = {}) {
        super();
        this.options = {
            cacheEnabled: true,
            cacheSize: 100,
            precompile: true,
            sandboxTimeout: 5000,
            customDelimiters: null,
            debug: false,
            performanceTracking: true,
            asyncHelpers: true,
            securityLevel: 'strict',
            ...options
        };
        // Initialize engines
        this.engines = new Map();
        this.cache = new Map();
        this.helpers = new Map();
        this.partials = new Map();
        this.asyncHelpers = new Map();
        this.compiledTemplates = new Map();
        this.performanceMetrics = new Map();

        // Template composition support
        this.compositions = new Map();
        this.conditionalBlocks = new Map();

        // Initialize default engine
        this.initializeHandlebars();

        // Security sandbox context
        this.sandboxContext = this.createSandboxContext();
    }

    /**
     * Initialize Handlebars with custom functionality
     */
    initializeHandlebars() {
        // Create custom Handlebars instance
        this.handlebars = Handlebars.create();

        // Register as default engine
        this.engines.set('handlebars', this.handlebars);
        this.engines.set('hbs', this.handlebars);

        // Register built-in helpers
        this.registerBuiltInHelpers();

        // Setup custom delimiters if specified
        if (this.options.customDelimiters) {
            this.setupCustomDelimiters();
        }
    }

    /**
     * Register built-in helper functions
     */
    registerBuiltInHelpers() {
        // Async helper support
        this.registerHelper('async', async (fn, options) => {
            if (this.asyncHelpers.has(fn)) {
                const helper = this.asyncHelpers.get(fn);
                return await helper(options.hash, options);
            }
            throw new Error(`Async helper '${fn}' not found`);
        });

        // Conditional compilation
        this.registerHelper('ifFeature', (feature, options) => {
            const features = this.options.features || {};
            return features[feature] ? options.fn(this) : options.inverse(this);
        });

        // Template composition
        this.registerHelper('compose', (templateName, options) => {
            const composition = this.compositions.get(templateName);
            if (composition) {
                return this.renderComposition(composition, options.hash);
            }
            throw new Error(`Composition '${templateName}' not found`);
        });

        // Performance tracking helper
        this.registerHelper('perfTrack', (name, options) => {
            if (this.options.performanceTracking) {
                const start = process.hrtime.bigint();
                const result = options.fn(this);
                const end = process.hrtime.bigint();
                this.trackPerformance(name, Number(end - start) / 1e6);
                return result;
            }
            return options.fn(this);
        });

        // Security sandbox helper
        this.registerHelper('sandbox', (code, options) => {
            if (this.options.securityLevel === 'strict') {
                return this.runInSandbox(code, options.hash);
            }
            return '';
        });

        // Debug helper
        this.registerHelper('debug', (context, options) => {
            if (this.options.debug) {
                console.log('Debug:', JSON.stringify(context, null, 2));
            }
            return '';
        });

        // Template inheritance helpers
        this.registerHelper('block', (name, options) => {
            const blocks = this.handlebars.blocks = this.handlebars.blocks || {};
            blocks[name] = options.fn;
            return blocks[name](this);
        });

        this.registerHelper('contentFor', (name, options) => {
            const blocks = this.handlebars.blocks = this.handlebars.blocks || {};
            blocks[name] = options.fn;
            return null;
        });
    }

    /**
     * Register a custom helper
     * @param {string} name - Helper name
     * @param {Function} fn - Helper function
     * @param {Object} options - Helper options
     */
    registerHelper(name, fn, options = {}) {
        if (options.async) {
            this.asyncHelpers.set(name, fn);
        } else {
            this.handlebars.registerHelper(name, fn);
        }

        this.helpers.set(name, { fn, options });
        this.emit('helperRegistered', { name, options });
    }

    /**
     * Register a partial template
     * @param {string} name - Partial name
     * @param {string} template - Partial template
     */
    registerPartial(name, template) {
        this.handlebars.registerPartial(name, template);
        this.partials.set(name, template);
        this.emit('partialRegistered', { name });
    }

    /**
     * Compile a template with caching
     * @param {string} template - Template string
     * @param {Object} options - Compilation options
     * @returns {Function} Compiled template function
     */
    compile(template, options = {}) {
        const cacheKey = this.generateCacheKey(template, options);

        // Check cache first
        if (this.options.cacheEnabled && this.cache.has(cacheKey)) {
            this.emit('cacheHit', { cacheKey });
            return this.cache.get(cacheKey);
        }

        const start = process.hrtime.bigint();

        try {
            // Apply custom processing if needed
            let processedTemplate = template;
            if (options.conditionalCompilation) {
                processedTemplate = this.processConditionalBlocks(template, options);
            }

            // Compile template
            const compiled = this.handlebars.compile(processedTemplate, {
                ...options,
                noEscape: options.noEscape || false,
                strict: this.options.securityLevel === 'strict',
                assumeObjects: true,
                preventIndent: options.preventIndent || false,
                data: true
            });

            // Wrap for async support if needed
            const wrappedCompiled = this.options.asyncHelpers ?
                this.wrapAsyncTemplate(compiled) : compiled;

            // Cache if enabled
            if (this.options.cacheEnabled) {
                this.addToCache(cacheKey, wrappedCompiled);
            }

            const end = process.hrtime.bigint();
            this.trackPerformance('compile', Number(end - start) / 1e6);

            this.emit('templateCompiled', { cacheKey, duration: Number(end - start) / 1e6 });
            return wrappedCompiled;

        } catch (error) {
            this.emit('compilationError', { error, template: template.substring(0, 100) });
            throw new Error(`Template compilation failed: ${error.message}`);
        }
    }

    /**
     * Precompile templates for better performance
     * @param {string} template - Template string
     * @param {Object} options - Precompilation options
     * @returns {string} Precompiled template
     */
    precompile(template, options = {}) {
        try {
            const precompiled = this.handlebars.precompile(template, {
                ...options,
                srcName: options.name || 'template'
            });

            this.compiledTemplates.set(options.name || this.generateCacheKey(template), precompiled);
            return precompiled;
        } catch (error) {
            this.emit('precompilationError', { error });
            throw new Error(`Template precompilation failed: ${error.message}`);
        }
    }

    /**
     * Render a template with data
     * @param {string|Function} template - Template string or compiled function
     * @param {Object} data - Template data
     * @param {Object} options - Render options
     * @returns {Promise<string>} Rendered output
     */
    async render(template, data = {}, options = {}) {
        const start = process.hrtime.bigint();

        try {
            // Compile if string
            const compiled = typeof template === 'string' ?
                this.compile(template, options) : template;

            // Prepare context with helpers
            const context = {
                ...data,
                _engine: this,
                _options: options
            };

            // Execute template
            const result = await compiled(context, {
                helpers: this.helpers,
                partials: this.partials,
                data: options.data
            });

            const end = process.hrtime.bigint();
            this.trackPerformance('render', Number(end - start) / 1e6);

            this.emit('templateRendered', { duration: Number(end - start) / 1e6 });
            return result;

        } catch (error) {
            this.emit('renderError', { error, data });
            throw new Error(`Template rendering failed: ${error.message}`);
        }
    }

    /**
     * Process conditional compilation blocks
     * @param {string} template - Template with conditional blocks
     * @param {Object} options - Compilation options
     * @returns {string} Processed template
     */
    processConditionalBlocks(template, options) {
        const conditions = options.conditions || {};
        let processed = template;

        // Process @if blocks
        processed = processed.replace(
            /{{#@if\s+(\w+)}}([\s\S]*?){{#@endif}}/g,
            (match, condition, content) => {
                return conditions[condition] ? content : '';
            }
        );

        // Process @unless blocks
        processed = processed.replace(
            /{{#@unless\s+(\w+)}}([\s\S]*?){{#@endunless}}/g,
            (match, condition, content) => {
                return !conditions[condition] ? content : '';
            }
        );

        return processed;
    }

    /**
     * Create a security sandbox context
     * @returns {Object} Sandbox context
     */
    createSandboxContext() {
        return {
            console: {
                log: (...args) => this.emit('sandboxLog', args),
                error: (...args) => this.emit('sandboxError', args)
            },
            Math,
            Date,
            JSON,
            Object: {
                keys: Object.keys,
                values: Object.values,
                entries: Object.entries
            },
            Array: {
                isArray: Array.isArray,
                from: Array.from
            }
        };
    }

    /**
     * Run code in security sandbox
     * @param {string} code - Code to execute
     * @param {Object} data - Data context
     * @returns {*} Execution result
     */
    runInSandbox(code, data = {}) {
        try {
            const script = new vm.Script(code);
            const context = vm.createContext({
                ...this.sandboxContext,
                data
            });

            return script.runInContext(context, {
                timeout: this.options.sandboxTimeout,
                displayErrors: true
            });
        } catch (error) {
            this.emit('sandboxError', { error, code });
            return `Sandbox error: ${error.message}`;
        }
    }

    /**
     * Wrap template for async support
     * @param {Function} compiled - Compiled template
     * @returns {Function} Async wrapped template
     */
    wrapAsyncTemplate(compiled) {
        return async (context, options) => {
            // Replace sync execution with async
            const originalFn = compiled.toString();
            const asyncFn = originalFn.replace(
                /function\s*\(/,
                'async function('
            );

            // Create new async function
            const AsyncFunction = (async function() {}).constructor;
            const wrappedFn = new AsyncFunction('context', 'options', `
        ${asyncFn}
        return arguments[0].call(this, context, options);
      `);

            return await wrappedFn.call(this, compiled, context, options);
        };
    }

    /**
     * Setup custom delimiters
     */
    setupCustomDelimiters() {
        const { open, close } = this.options.customDelimiters;

        // Override Handlebars lexer
        const originalLexer = this.handlebars.JavaScriptCompiler.prototype.quotedString;
        this.handlebars.JavaScriptCompiler.prototype.quotedString = function(str) {
            return str.replace(new RegExp(open, 'g'), '{{')
                .replace(new RegExp(close, 'g'), '}}');
        };
    }

    /**
     * Register a template composition
     * @param {string} name - Composition name
     * @param {Object} composition - Composition definition
     */
    registerComposition(name, composition) {
        this.compositions.set(name, composition);
        this.emit('compositionRegistered', { name });
    }

    /**
     * Render a template composition
     * @param {Object} composition - Composition definition
     * @param {Object} data - Render data
     * @returns {Promise<string>} Rendered composition
     */
    async renderComposition(composition, data) {
        const parts = await Promise.all(
            composition.parts.map(async part => {
                if (part.condition && !this.evaluateCondition(part.condition, data)) {
                    return '';
                }

                return await this.render(part.template, {
                    ...data,
                    ...part.data
                });
            })
        );

        return parts.join(composition.separator || '');
    }

    /**
     * Evaluate a condition
     * @param {string|Function} condition - Condition to evaluate
     * @param {Object} data - Data context
     * @returns {boolean} Evaluation result
     */
    evaluateCondition(condition, data) {
        if (typeof condition === 'function') {
            return condition(data);
        }

        try {
            const fn = new Function('data', `return ${condition}`);
            return fn(data);
        } catch (error) {
            this.emit('conditionError', { error, condition });
            return false;
        }
    }

    /**
     * Track performance metrics
     * @param {string} operation - Operation name
     * @param {number} duration - Duration in milliseconds
     */
    trackPerformance(operation, duration) {
        if (!this.options.performanceTracking) return;

        if (!this.performanceMetrics.has(operation)) {
            this.performanceMetrics.set(operation, {
                count: 0,
                totalTime: 0,
                minTime: Infinity,
                maxTime: 0
            });
        }

        const metrics = this.performanceMetrics.get(operation);
        metrics.count++;
        metrics.totalTime += duration;
        metrics.minTime = Math.min(metrics.minTime, duration);
        metrics.maxTime = Math.max(metrics.maxTime, duration);
    }

    /**
     * Get performance report
     * @returns {Object} Performance metrics
     */
    getPerformanceReport() {
        const report = {};

        for (const [operation, metrics] of this.performanceMetrics) {
            report[operation] = {
                ...metrics,
                avgTime: metrics.totalTime / metrics.count
            };
        }

        return report;
    }

    /**
     * Generate cache key
     * @param {string} template - Template string
     * @param {Object} options - Options object
     * @returns {string} Cache key
     */
    generateCacheKey(template, options = {}) {
        const hash = crypto.createHash('sha256');
        hash.update(template);
        hash.update(JSON.stringify(options));
        return hash.digest('hex');
    }

    /**
     * Add to cache with size management
     * @param {string} key - Cache key
     * @param {*} value - Value to cache
     */
    addToCache(key, value) {
        if (this.cache.size >= this.options.cacheSize) {
            // Remove oldest entry (FIFO)
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        this.cache.set(key, value);
    }

    /**
     * Clear all caches
     */
    clearCache() {
        this.cache.clear();
        this.compiledTemplates.clear();
        this.emit('cacheCleared');
    }

    /**
     * Get debugging information
     * @returns {Object} Debug info
     */
    getDebugInfo() {
        return {
            cacheSize: this.cache.size,
            helpers: Array.from(this.helpers.keys()),
            partials: Array.from(this.partials.keys()),
            asyncHelpers: Array.from(this.asyncHelpers.keys()),
            compositions: Array.from(this.compositions.keys()),
            performance: this.getPerformanceReport()
        };
    }

    /**
     * Optimize template for production
     * @param {string} template - Template to optimize
     * @returns {string} Optimized template
     */
    optimize(template) {
        let optimized = template;

        // Remove Handlebars comments
        optimized = optimized.replace(/{{!--[\s\S]*?--}}/g, '');

        // Remove HTML comments
        optimized = optimized.replace(/<!--[\s\S]*?-->/g, '');

        // Preserve pre/code blocks and script/style content
        const preservedBlocks = [];
        let blockIndex = 0;

        // Extract and preserve pre/code/script/style blocks
        optimized = optimized.replace(/<(pre|code|script|style)(\s[^>]*)?>([\s\S]*?)<\/\1>/gi, (match) => {
            const placeholder = `__PRESERVED_BLOCK_${blockIndex}__`;
            preservedBlocks[blockIndex] = match;
            blockIndex++;
            return placeholder;
        });

        // Normalize line endings
        optimized = optimized.replace(/\r\n/g, '\n');

        // Remove trailing whitespace from lines
        optimized = optimized.replace(/[ \t]+$/gm, '');

        // Collapse multiple blank lines into single blank line
        optimized = optimized.replace(/\n\s*\n\s*\n/g, '\n\n');

        // Minimize whitespace (but preserve single spaces between words)
        optimized = optimized.replace(/[ \t]+/g, ' ');

        // Remove unnecessary spaces around Handlebars tags
        optimized = optimized.replace(/\s*{{\s*/g, '{{');
        optimized = optimized.replace(/\s*}}\s*/g, '}}');

        // Remove spaces around block helpers while preserving newlines for readability
        optimized = optimized.replace(/\s*{{#\s*/g, '{{#');
        optimized = optimized.replace(/\s*{{\/\s*/g, '{{/');
        optimized = optimized.replace(/\s*{{\^\s*/g, '{{^');
        optimized = optimized.replace(/\s*{{>\s*/g, '{{>');

        // Remove spaces between HTML tags (but not within text content)
        optimized = optimized.replace(/>\s+</g, '><');

        // Restore preserved blocks
        preservedBlocks.forEach((block, index) => {
            optimized = optimized.replace(`__PRESERVED_BLOCK_${index}__`, block);
        });

        // Final trim
        return optimized.trim();
    }
    /**
     * Validate template syntax
     * @param {string} template - Template to validate
     * @returns {Object} Validation result
     */
    validateTemplate(template) {
        try {
            this.handlebars.compile(template);
            return { valid: true };
        } catch (error) {
            return {
                valid: false,
                error: error.message,
                line: error.line,
                column: error.column
            };
        }
    }

    /**
     * Export template engine state
     * @returns {Object} Exported state
     */
    export() {
        return {
            helpers: Array.from(this.helpers.entries()).map(([name, helper]) => ({
                name,
                options: helper.options
            })),
            partials: Array.from(this.partials.entries()),
            compositions: Array.from(this.compositions.entries()),
            options: this.options
        };
    }

    /**
     * Import template engine state
     * @param {Object} state - State to import
     */
    import(state) {
        // Import helpers
        if (state.helpers) {
            state.helpers.forEach(({ name, options }) => {
                if (this.helpers.has(name)) {
                    const helper = this.helpers.get(name);
                    this.registerHelper(name, helper.fn, options);
                }
            });
        }

        // Import partials
        if (state.partials) {
            state.partials.forEach(([name, template]) => {
                this.registerPartial(name, template);
            });
        }

        // Import compositions
        if (state.compositions) {
            state.compositions.forEach(([name, composition]) => {
                this.registerComposition(name, composition);
            });
        }

        this.emit('stateImported', state);
    }
}

module.exports = TemplateEngine;
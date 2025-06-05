// src/errors/GeneratorError.js

const BaseError = require('./BaseError');
const crypto = require('crypto');

/**
 * @class GeneratorError
 * @extends BaseError
 * @description Generator-specific error with additional context
 */
class GeneratorError extends BaseError {
    /**
     * @param {string} message - Error message
     * @param {string} code - Error code
     * @param {Object} options - Additional options
     */
    constructor(message, code = 'GENERATOR_ERROR', options = {}) {
        // Extract category, phase, and component before passing to super
        const { category = 'generator', phase = 'unknown', component = 'unknown', ...restOptions } = options;

        super(message, code, restOptions, options.originalError);

        // Generate unique ID for this error
        this.id = this._generateId();

        // Generator-specific properties
        this.category = category;
        this.phase = phase;
        this.component = component;

        // File/location information
        this.file = options.file || null;
        this.line = options.line || null;
        this.column = options.column || null;

        // Severity and recovery
        this.severity = options.severity || 'error';
        this.recoverable = options.recoverable !== undefined ? options.recoverable : true;

        // Additional metadata
        this.documentation = options.documentation || this.getDocumentationUrl();
        this.suggestion = options.suggestion || null;
        this.affectedFiles = options.affectedFiles || [];

        // Performance metrics
        this.duration = options.duration || null;
        this.memoryUsage = options.memoryUsage || null;

        // Add generator-specific context
        this.addContext({
            category: this.category,
            phase: this.phase,
            component: this.component,
            severity: this.severity,
            recoverable: this.recoverable
        });

        // Add location context if available
        if (this.file) {
            this.addContext({
                file: this.file,
                line: this.line,
                column: this.column
            });
        }
    }

    /**
     * Generate unique ID for error instance
     * @private
     */
    _generateId() {
        const timestamp = Date.now();
        const random = crypto.randomBytes(4).toString('hex');
        return `${this.code}-${timestamp}-${random}`;
    }

    /**
     * Get documentation URL for this error
     */
    getDocumentationUrl() {
        const baseUrl = process.env.DOCS_URL || 'https://docs.swagger-to-nextjs.dev/errors';
        const errorCode = this.code.toLowerCase().replace(/_/g, '-');
        return `${baseUrl}/${errorCode}`;
    }

    /**
     * Get error location as string
     */
    getLocation() {
        if (!this.file) return null;

        let location = this.file;
        if (this.line) {
            location += `:${this.line}`;
            if (this.column) {
                location += `:${this.column}`;
            }
        }
        return location;
    }

    /**
     * Add affected file
     */
    addAffectedFile(filepath, reason) {
        this.affectedFiles.push({ filepath, reason });
        return this;
    }

    /**
     * Set suggestion for fixing the error
     */
    setSuggestion(suggestion) {
        this.suggestion = suggestion;
        return this;
    }

    /**
     * Check if error is recoverable
     */
    isRecoverable() {
        return this.recoverable;
    }

    /**
     * Get error fingerprint for deduplication
     */
    getFingerprint() {
        const parts = [
            this.code,
            this.category,
            this.phase,
            this.component,
            this.file || 'no-file'
        ];

        return parts.join(':');
    }

    /**
     * Serialize error based on format
     */
    serialize(format = 'json') {
        switch (format) {
            case 'cli':
                return this._serializeCLI();
            case 'json':
                return this._serializeJSON();
            case 'log':
                return this._serializeLog();
            case 'html':
                return this._serializeHTML();
            default:
                return this.toString();
        }
    }

    /**
     * CLI serialization with color and formatting
     */
    _serializeCLI() {
        const chalk = require('chalk');
        const parts = [];

        // Error header with severity icon
        const icon = this.severity === 'error' ? '✖' : '⚠';
        const color = this.severity === 'error' ? chalk.red : chalk.yellow;

        parts.push(color(`${icon} ${this.name}: ${this.message}`));

        // Location information
        if (this.file) {
            parts.push(chalk.gray(`  at ${this.getLocation()}`));
        }

        // Phase and component
        if (this.phase !== 'unknown' || this.component !== 'unknown') {
            const info = [];
            if (this.phase !== 'unknown') info.push(`Phase: ${this.phase}`);
            if (this.component !== 'unknown') info.push(`Component: ${this.component}`);
            parts.push(chalk.gray(`  ${info.join(' | ')}`));
        }

        // Error code
        parts.push(chalk.gray(`  Code: ${this.code}`));

        // Suggestion
        if (this.suggestion) {
            parts.push(chalk.green(`  💡 Suggestion: ${this.suggestion}`));
        }

        // Affected files
        if (this.affectedFiles.length > 0) {
            parts.push(chalk.yellow('  📁 Affected files:'));
            this.affectedFiles.forEach(({ filepath, reason }) => {
                parts.push(chalk.gray(`     • ${filepath}${reason ? ` (${reason})` : ''}`));
            });
        }

        // Documentation link
        if (this.documentation) {
            parts.push(chalk.blue(`  📚 Docs: ${this.documentation}`));
        }

        // Stack trace in debug mode
        if (process.env.DEBUG === 'true' && this.stack) {
            parts.push(chalk.gray('\n  Stack trace:'));
            const stackLines = this.stack.split('\n').slice(1, 6);
            stackLines.forEach(line => {
                parts.push(chalk.gray(`  ${line.trim()}`));
            });
            if (this.stack.split('\n').length > 6) {
                parts.push(chalk.gray('  ...'));
            }
        }

        return parts.join('\n');
    }

    /**
     * JSON serialization
     */
    _serializeJSON() {
        return {
            id: this.id,
            name: this.name,
            message: this.message,
            code: this.code,
            category: this.category,
            phase: this.phase,
            component: this.component,
            severity: this.severity,
            recoverable: this.recoverable,
            location: this.file ? {
                file: this.file,
                line: this.line,
                column: this.column
            } : null,
            context: this.context,
            suggestion: this.suggestion,
            documentation: this.documentation,
            affectedFiles: this.affectedFiles,
            timestamp: this.timestamp,
            stack: process.env.INCLUDE_STACK === 'true' ? this.stack : undefined
        };
    }

    /**
     * HTML serialization
     */
    _serializeHTML() {
        const severityClass = `error-${this.severity}`;
        const icon = this.severity === 'error' ? '❌' : '⚠️';

        let html = `<div class="error ${severityClass}">`;
        html += `<h3>${icon} ${this.name}: ${this._escapeHtml(this.message)}</h3>`;

        if (this.file) {
            html += `<p class="location">at ${this._escapeHtml(this.getLocation())}</p>`;
        }

        html += `<dl>`;
        html += `<dt>Code:</dt><dd><code>${this._escapeHtml(this.code)}</code></dd>`;
        html += `<dt>Category:</dt><dd>${this._escapeHtml(this.category)}</dd>`;
        html += `<dt>Phase:</dt><dd>${this._escapeHtml(this.phase)}</dd>`;

        if (this.suggestion) {
            html += `<dt>Suggestion:</dt><dd>${this._escapeHtml(this.suggestion)}</dd>`;
        }

        if (this.affectedFiles.length > 0) {
            html += `<dt>Affected Files:</dt><dd><ul>`;
            this.affectedFiles.forEach(({ filepath, reason }) => {
                html += `<li>${this._escapeHtml(filepath)}`;
                if (reason) html += ` - ${this._escapeHtml(reason)}`;
                html += `</li>`;
            });
            html += `</ul></dd>`;
        }

        if (this.documentation) {
            html += `<dt>Documentation:</dt><dd><a href="${this._escapeHtml(this.documentation)}">${this._escapeHtml(this.documentation)}</a></dd>`;
        }

        html += `</dl>`;

        if (process.env.INCLUDE_STACK === 'true' && this.stack) {
            html += `<details><summary>Stack Trace</summary><pre>${this._escapeHtml(this.stack)}</pre></details>`;
        }

        html += `</div>`;

        return html;
    }

    /**
     * Escape HTML special characters
     * @private
     */
    _escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * Log format serialization
     */
    _serializeLog() {
        const location = this.getLocation();
        const parts = [
            `[${this.timestamp}]`,
            `[${this.severity.toUpperCase()}]`,
            `[${this.code}]`,
            this.message
        ];

        if (location) {
            parts.push(`at ${location}`);
        }

        if (this.phase !== 'unknown') {
            parts.push(`(${this.phase})`);
        }

        return parts.join(' ');
    }

    /**
     * Convert to plain object (includes ID)
     */
    toObject() {
        const base = super.toObject();

        return {
            ...base,
            id: this.id,
            category: this.category,
            phase: this.phase,
            component: this.component,
            severity: this.severity,
            recoverable: this.recoverable,
            file: this.file,
            line: this.line,
            column: this.column,
            suggestion: this.suggestion,
            documentation: this.documentation,
            affectedFiles: this.affectedFiles
        };
    }

    /**
     * Check if a value is a GeneratorError instance
     * @param {*} value - Value to check
     * @returns {boolean}
     */
    static isGeneratorError(value) {
        return value instanceof GeneratorError;
    }

    /**
     * Wrap an error as a GeneratorError
     * @param {*} error - Error to wrap
     * @param {string} [code] - Error code
     * @param {Object} [context] - Additional context
     * @returns {GeneratorError}
     */
    static wrap(error, code = 'WRAPPED_ERROR', context = {}) {
        if (error instanceof GeneratorError) {
            return error;
        }

        // Extract useful information from the original error
        const message = error?.message || String(error) || 'An error occurred';
        const errorCode = error?.code || code;

        return new GeneratorError(message, errorCode, {
            ...context,
            originalError: error,
            originalName: error?.name,
            originalStack: error?.stack,
            recoverable: context.recoverable !== undefined ? context.recoverable : true
        });
    }

    /**
     * Create from unknown thrown value
     * @param {*} thrown - The thrown value
     * @param {string} [defaultMessage] - Default message
     * @param {string} [defaultCode] - Default code
     * @returns {GeneratorError}
     */
    static from(thrown, defaultMessage = 'An error occurred', defaultCode = 'GENERATOR_ERROR') {
        if (thrown instanceof GeneratorError) {
            return thrown;
        }

        return GeneratorError.wrap(thrown, defaultCode, {
            phase: 'unknown',
            component: 'unknown'
        });
    }

    /**
     * Static factory methods for common generator errors
     */
    static validation(message, context = {}) {
        return new GeneratorError(message, 'VALIDATION_ERROR', {
            phase: 'validation',
            category: 'validation',
            severity: 'error',
            ...context
        });
    }

    static configuration(message, context = {}) {
        return new GeneratorError(message, 'CONFIG_ERROR', {
            phase: 'configuration',
            category: 'configuration',
            severity: 'error',
            ...context
        });
    }

    static fileSystem(message, context = {}) {
        return new GeneratorError(message, 'FILE_SYSTEM_ERROR', {
            phase: 'file_operations',
            category: 'filesystem',
            severity: 'error',
            ...context
        });
    }

    static template(message, context = {}) {
        return new GeneratorError(message, 'TEMPLATE_ERROR', {
            phase: 'template_processing',
            category: 'template',
            severity: 'error',
            ...context
        });
    }

    static parsing(message, context = {}) {
        return new GeneratorError(message, 'PARSE_ERROR', {
            phase: 'parsing',
            category: 'parsing',
            severity: 'error',
            ...context
        });
    }

    static network(message, context = {}) {
        return new GeneratorError(message, 'NETWORK_ERROR', {
            phase: 'network_operations',
            category: 'network',
            severity: 'error',
            recoverable: true,
            ...context
        });
    }

    static plugin(message, context = {}) {
        return new GeneratorError(message, 'PLUGIN_ERROR', {
            phase: 'plugin_execution',
            category: 'plugin',
            severity: 'error',
            ...context
        });
    }

    static hook(message, context = {}) {
        return new GeneratorError(message, 'HOOK_ERROR', {
            phase: 'hook_execution',
            category: 'hook',
            severity: 'error',
            ...context
        });
    }

    static worker(message, context = {}) {
        return new GeneratorError(message, 'WORKER_ERROR', {
            phase: 'worker_execution',
            category: 'worker',
            severity: 'error',
            ...context
        });
    }

    static fatal(message, context = {}) {
        return new GeneratorError(message, 'FATAL_ERROR', {
            phase: context.phase || 'unknown',
            category: 'fatal',
            severity: 'fatal',
            recoverable: false,
            ...context
        });
    }

    /**
     * Create a warning (non-fatal error)
     */
    static warning(message, context = {}) {
        return new GeneratorError(message, 'WARNING', {
            severity: 'warning',
            recoverable: true,
            ...context
        });
    }
}

module.exports = GeneratorError;
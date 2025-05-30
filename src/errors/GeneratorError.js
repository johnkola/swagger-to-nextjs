/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - AI PROMPT
 * ============================================================================
 * FILE: src/errors/GeneratorError.js
 * VERSION: 2025-05-28 15:14:56
 * PHASE: PHASE 2: Core System Components
 * CATEGORY: 🚨 Error Handling System
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 *
 * Create a sophisticated GeneratorError base class that:
 * - Extends Error with rich metadata
 * - Implements error codes and categories
 * - Provides structured error context
 * - Supports error chaining and causation
 * - Implements serialization for different outputs
 * - Provides user-friendly messages
 * - Includes recovery suggestions
 * - Supports internationalization
 * - Integrates with logging systems
 * - Implements error fingerprinting for tracking
 *
 * ============================================================================
 */

const crypto = require('crypto');
const os = require('os');
const { format } = require('util');

/**
 * Base error class for all generator-specific errors
 * Provides rich metadata, error chaining, and sophisticated error handling
 */
class GeneratorError extends Error {
    constructor(message, code = 'GENERATOR_ERROR', options = {}) {
        super(message);

        // Essential error properties
        this.name = this.constructor.name;
        this.code = code;
        this.timestamp = new Date();
        this.id = this._generateErrorId();

        // Error categorization
        this.category = options.category || this._inferCategory();
        this.severity = options.severity || 'error'; // error, warning, info
        this.recoverable = options.recoverable !== undefined ? options.recoverable : true;

        // Context and metadata
        this.context = options.context || {};
        this.metadata = {
            ...this._getSystemMetadata(),
            ...options.metadata
        };

        // Error chaining
        this.cause = options.cause || null;
        this.causedBy = [];
        if (this.cause) {
            this._processCause(this.cause);
        }

        // User-facing information
        this.userMessage = options.userMessage || this._generateUserMessage();
        this.suggestion = options.suggestion || this._generateSuggestion();
        this.documentation = options.documentation || this._getDocumentationLink();

        // Technical details
        this.file = options.file || null;
        this.line = options.line || null;
        this.column = options.column || null;
        this.operation = options.operation || null;

        // Internationalization
        this.locale = options.locale || 'en';
        this.translations = options.translations || {};

        // Error fingerprint for tracking
        this.fingerprint = this._generateFingerprint();

        // Capture stack trace
        Error.captureStackTrace(this, this.constructor);

        // Parse stack for additional context
        this._parseStack();
    }

    /**
     * Generate unique error ID
     */
    _generateErrorId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `${this.constructor.name.toLowerCase()}_${timestamp}_${random}`;
    }

    /**
     * Generate error fingerprint for tracking similar errors
     */
    _generateFingerprint() {
        const fingerprintData = [
            this.code,
            this.category,
            this.operation,
            this.file,
            this.line
        ].filter(Boolean).join(':');

        return crypto
            .createHash('md5')
            .update(fingerprintData)
            .digest('hex')
            .substr(0, 16);
    }

    /**
     * Infer error category from error code
     */
    _inferCategory() {
        const codePrefix = this.code.split('_')[0];
        const categoryMap = {
            'VALIDATION': 'validation',
            'NETWORK': 'network',
            'FILE': 'filesystem',
            'TEMPLATE': 'template',
            'CONFIG': 'configuration',
            'AUTH': 'authentication',
            'PARSE': 'parsing',
            'GENERATE': 'generation'
        };

        return categoryMap[codePrefix] || 'general';
    }

    /**
     * Get system metadata
     */
    _getSystemMetadata() {
        return {
            platform: os.platform(),
            nodeVersion: process.version,
            generatorVersion: process.env.GENERATOR_VERSION || 'unknown',
            environment: process.env.NODE_ENV || 'production',
            hostname: os.hostname(),
            pid: process.pid,
            memory: {
                used: process.memoryUsage(),
                available: os.freemem(),
                total: os.totalmem()
            }
        };
    }

    /**
     * Process error cause chain
     */
    _processCause(cause) {
        let currentCause = cause;
        while (currentCause) {
            this.causedBy.push({
                name: currentCause.name || 'Error',
                message: currentCause.message,
                code: currentCause.code,
                stack: currentCause.stack
            });
            currentCause = currentCause.cause;
        }
    }

    /**
     * Generate user-friendly message
     */
    _generateUserMessage() {
        const messages = {
            'validation': 'The provided input is invalid',
            'network': 'A network error occurred',
            'filesystem': 'A file system error occurred',
            'template': 'A template processing error occurred',
            'configuration': 'A configuration error occurred',
            'parsing': 'Failed to parse the input',
            'generation': 'Failed to generate the output'
        };

        return messages[this.category] || 'An error occurred';
    }

    /**
     * Generate recovery suggestion
     */
    _generateSuggestion() {
        // Override in subclasses for specific suggestions
        const suggestions = {
            'validation': 'Please check your input against the schema',
            'network': 'Please check your internet connection and try again',
            'filesystem': 'Please check file permissions and available disk space',
            'template': 'Please verify your template syntax',
            'configuration': 'Please review your configuration settings',
            'parsing': 'Please ensure the input format is correct',
            'generation': 'Please check the logs for more details'
        };

        return suggestions[this.category] || null;
    }

    /**
     * Get documentation link
     */
    _getDocumentationLink() {
        const baseUrl = 'https://docs.swagger-to-nextjs.dev/errors';
        return `${baseUrl}/${this.code.toLowerCase()}`;
    }

    /**
     * Parse stack trace for additional context
     */
    _parseStack() {
        if (!this.stack) return;

        const stackLines = this.stack.split('\n');
        const firstRelevantLine = stackLines.find(line =>
            line.includes('/src/') && !line.includes('node_modules')
        );

        if (firstRelevantLine) {
            const match = firstRelevantLine.match(/\((.+):(\d+):(\d+)\)/);
            if (match) {
                this.file = this.file || match[1];
                this.line = this.line || parseInt(match[2]);
                this.column = this.column || parseInt(match[3]);
            }
        }
    }

    /**
     * Add context to the error
     */
    addContext(key, value) {
        this.context[key] = value;
        return this;
    }

    /**
     * Add metadata
     */
    addMetadata(key, value) {
        this.metadata[key] = value;
        return this;
    }

    /**
     * Set error location
     */
    setLocation(file, line, column) {
        this.file = file;
        this.line = line;
        this.column = column;
        return this;
    }

    /**
     * Get localized message
     */
    getLocalizedMessage(locale = this.locale) {
        if (this.translations[locale]) {
            return this.translations[locale];
        }
        return this.userMessage;
    }

    /**
     * Check if error is of specific type
     */
    is(errorCode) {
        return this.code === errorCode || this.code.startsWith(errorCode);
    }

    /**
     * Check if error has specific category
     */
    hasCategory(category) {
        return this.category === category;
    }

    /**
     * Get error chain as array
     */
    getErrorChain() {
        const chain = [this];
        let current = this.cause;

        while (current) {
            chain.push(current);
            current = current.cause;
        }

        return chain;
    }

    /**
     * Serialize for different output formats
     */
    serialize(format = 'json') {
        switch (format) {
            case 'json':
                return this._serializeJSON();
            case 'cli':
                return this._serializeCLI();
            case 'html':
                return this._serializeHTML();
            case 'log':
                return this._serializeLog();
            default:
                return this._serializeJSON();
        }
    }

    /**
     * JSON serialization
     */
    _serializeJSON() {
        return {
            id: this.id,
            name: this.name,
            code: this.code,
            message: this.message,
            userMessage: this.userMessage,
            category: this.category,
            severity: this.severity,
            recoverable: this.recoverable,
            suggestion: this.suggestion,
            documentation: this.documentation,
            context: this.context,
            metadata: this.metadata,
            location: {
                file: this.file,
                line: this.line,
                column: this.column
            },
            timestamp: this.timestamp.toISOString(),
            fingerprint: this.fingerprint,
            causedBy: this.causedBy,
            stack: process.env.NODE_ENV === 'development' ? this.stack : undefined
        };
    }

    /**
     * CLI-friendly serialization
     */
    _serializeCLI() {
        const parts = [];

        // Error header
        parts.push(`${this._getSeverityEmoji()} ${this.userMessage}`);
        parts.push(`   Error Code: ${this.code}`);

        // Location info
        if (this.file) {
            parts.push(`   Location: ${this.file}:${this.line}:${this.column}`);
        }

        // Suggestion
        if (this.suggestion) {
            parts.push(`   💡 ${this.suggestion}`);
        }

        // Documentation
        if (this.documentation) {
            parts.push(`   📚 More info: ${this.documentation}`);
        }

        // Context (if any)
        if (Object.keys(this.context).length > 0) {
            parts.push('   Context:');
            Object.entries(this.context).forEach(([key, value]) => {
                parts.push(`     ${key}: ${JSON.stringify(value)}`);
            });
        }

        // Stack trace in debug mode
        if (process.env.DEBUG === 'true' && this.stack) {
            parts.push('\n   Stack Trace:');
            this.stack.split('\n').slice(1).forEach(line => {
                parts.push(`   ${line}`);
            });
        }

        return parts.join('\n');
    }

    /**
     * HTML serialization
     */
    _serializeHTML() {
        return `
      <div class="error error-${this.severity}">
        <h3>${this._getSeverityEmoji()} ${this.userMessage}</h3>
        <dl>
          <dt>Error Code:</dt>
          <dd><code>${this.code}</code></dd>
          
          ${this.file ? `
            <dt>Location:</dt>
            <dd><code>${this.file}:${this.line}:${this.column}</code></dd>
          ` : ''}
          
          ${this.suggestion ? `
            <dt>Suggestion:</dt>
            <dd>${this.suggestion}</dd>
          ` : ''}
          
          ${this.documentation ? `
            <dt>Documentation:</dt>
            <dd><a href="${this.documentation}" target="_blank">Learn more</a></dd>
          ` : ''}
        </dl>
        
        ${Object.keys(this.context).length > 0 ? `
          <details>
            <summary>Context</summary>
            <pre>${JSON.stringify(this.context, null, 2)}</pre>
          </details>
        ` : ''}
        
        ${process.env.NODE_ENV === 'development' && this.stack ? `
          <details>
            <summary>Stack Trace</summary>
            <pre>${this.stack}</pre>
          </details>
        ` : ''}
      </div>
    `;
    }

    /**
     * Log format serialization
     */
    _serializeLog() {
        return format('%s [%s] %s - %s %o',
            this.timestamp.toISOString(),
            this.severity.toUpperCase(),
            this.code,
            this.message,
            {
                id: this.id,
                category: this.category,
                context: this.context,
                fingerprint: this.fingerprint
            }
        );
    }

    /**
     * Get severity emoji
     */
    _getSeverityEmoji() {
        const emojis = {
            'error': '❌',
            'warning': '⚠️',
            'info': 'ℹ️'
        };
        return emojis[this.severity] || '❌';
    }

    /**
     * Create a new error with additional context
     */
    wrap(message, context = {}) {
        return new this.constructor(message, this.code, {
            ...this.options,
            context: { ...this.context, ...context },
            cause: this
        });
    }

    /**
     * Convert to JSON (for JSON.stringify)
     */
    toJSON() {
        return this._serializeJSON();
    }

    /**
     * Custom inspect for console.log
     */
    [Symbol.for('nodejs.util.inspect.custom')]() {
        return this._serializeCLI();
    }

    /**
     * Static factory method
     */
    static create(message, code, options) {
        return new this(message, code, options);
    }

    /**
     * Check if value is a GeneratorError
     */
    static isGeneratorError(value) {
        return value instanceof GeneratorError;
    }

    /**
     * Wrap unknown errors
     */
    static wrap(error, code = 'WRAPPED_ERROR', options = {}) {
        if (error instanceof GeneratorError) {
            return error;
        }

        const wrapped = new GeneratorError(
            error.message || 'An unknown error occurred',
            code,
            {
                ...options,
                cause: error,
                context: {
                    originalError: error.name || 'Error',
                    originalStack: error.stack
                }
            }
        );

        return wrapped;
    }
}

module.exports = GeneratorError;
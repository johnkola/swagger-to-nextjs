// src/logging/LogFormatter.js
const winston = require('winston');

/**
 * Winston formatter factory - receives config, doesn't load it
 */
class LogFormatter {
    constructor(options = {}) {
        // LogFormatter should only care about formatting options, not loading configs
        // In test environment, default colorize to false to avoid issues
        // Check if we're running in a test environment
        const isTest = process.env.NODE_ENV === 'test' ||
            process.argv.includes('--test') ||
            process.argv.some(arg => arg.includes('test-runner'));

        const defaultColorize = isTest ? false : true;

        this.options = {
            format: 'json',
            colorize: defaultColorize,
            timestamp: true,
            timestampFormat: 'YYYY-MM-DD HH:mm:ss',
            prettyPrint: false,
            align: false,
            errors: true,
            ...options
        };
    }

    /**
     * Get Winston format based on options
     */
    getFormat() {
        const formats = [];

        // Always add timestamp first if enabled
        if (this.options.timestamp) {
            formats.push(winston.format.timestamp({
                format: this.options.timestampFormat
            }));
        }

        // Errors with stack trace
        if (this.options.errors !== false) {
            formats.push(winston.format.errors({ stack: true }));
        }

        // Add metadata
        if (this.options.metadata) {
            formats.push(winston.format.metadata({
                fillExcept: ['message', 'level', 'timestamp', 'label']
            }));
        }

        // Main format selection (before colorize to ensure proper message formatting)
        const mainFormat = this._getMainFormat();
        if (mainFormat) {
            formats.push(mainFormat);
        }

        // Colorize last (after formatting) to avoid issues
        // Skip colorize entirely in test environment to avoid Winston colorizer errors
        const isTest = process.env.NODE_ENV === 'test' ||
            process.argv.includes('--test') ||
            process.argv.some(arg => arg.includes('test-runner'));

        if (this.options.colorize && this.options.format !== 'json' && !isTest) {
            try {
                formats.push(winston.format.colorize({
                    all: this.options.colorizeAll || false,
                    level: true,
                    message: this.options.colorizeMessage || false,
                    colors: {
                        error: 'red',
                        warn: 'yellow',
                        info: 'green',
                        debug: 'blue',
                        verbose: 'cyan',
                        silly: 'magenta'
                    }
                }));
            } catch (e) {
                // Colorize might fail in some environments, continue without it
                console.warn('Colorize format failed, continuing without colors:', e.message);
            }
        }

        // Align message
        if (this.options.align) {
            formats.push(winston.format.align());
        }

        return formats.length > 0 ? winston.format.combine(...formats) : winston.format.simple();
    }

    /**
     * Get the main format based on format option
     */
    _getMainFormat() {
        switch (this.options.format) {
            case 'json':
                return winston.format.json({
                    space: this.options.jsonSpace || 0,
                    replacer: this.options.jsonReplacer
                });

            case 'simple':
                return winston.format.simple();

            case 'cli':
                return winston.format.cli();

            case 'pretty':
            case 'prettyPrint':
                return winston.format.prettyPrint({
                    colorize: this.options.colorize,
                    depth: this.options.depth || 4
                });

            case 'logstash':
                return winston.format.logstash();

            case 'printf':
            case 'custom':
                return this._createCustomFormat();

            case 'compact':
                return this._createCompactFormat();

            case 'detailed':
                return this._createDetailedFormat();

            default:
                // If format is a function, use it directly
                if (typeof this.options.format === 'function') {
                    return this.options.format;
                }
                // Default to JSON
                return winston.format.json();
        }
    }

    /**
     * Create custom printf format
     */
    _createCustomFormat() {
        const template = this.options.template || this._getDefaultTemplate();

        return winston.format.printf((info) => {
            // Use template if it's a function
            if (typeof template === 'function') {
                return template(info);
            }

            // Otherwise use default formatting
            return this._formatMessage(info);
        });
    }

    /**
     * Default message formatting
     */
    _formatMessage(info) {
        const { timestamp, level, message, label, ...metadata } = info;
        let output = '';

        // Add timestamp
        if (timestamp && this.options.timestamp) {
            output += `[${timestamp}] `;
        }

        // Add label if present
        if (label) {
            output += `[${label}] `;
        }

        // Add level
        output += `${level}: `;

        // Add message
        output += message;

        // Add metadata
        if (Object.keys(metadata).length > 0 && !this.options.hideMetadata) {
            try {
                const metaStr = this.options.prettyMetadata
                    ? JSON.stringify(metadata, null, 2)
                    : JSON.stringify(metadata);
                output += ' ' + metaStr;
            } catch (e) {
                // Handle circular references or other JSON stringify errors
                output += ' [Metadata contains circular reference]';
            }
        }

        return output;
    }

    /**
     * Create compact single-line format
     */
    _createCompactFormat() {
        return winston.format.printf(({ timestamp, level, message, ...meta }) => {
            const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
            return `${timestamp} [${level.toUpperCase()}] ${message}${metaStr}`;
        });
    }

    /**
     * Create detailed multi-line format
     */
    _createDetailedFormat() {
        return winston.format.printf((info) => {
            const { timestamp, level, message, stack, ...meta } = info;
            let output = `\n${timestamp} [${level.toUpperCase()}]\n`;
            output += `Message: ${message}\n`;

            if (stack) {
                output += `Stack: ${stack}\n`;
            }

            if (Object.keys(meta).length > 0) {
                output += `Metadata: ${JSON.stringify(meta, null, 2)}\n`;
            }

            return output;
        });
    }

    /**
     * Get default template
     */
    _getDefaultTemplate() {
        return (info) => this._formatMessage(info);
    }

    /**
     * Create format for specific transport type
     */
    static createFormatForTransport(transportType, options = {}) {
        const isTest = process.env.NODE_ENV === 'test' ||
            process.argv.includes('--test') ||
            process.argv.some(arg => arg.includes('test-runner'));
        const defaultColorize = isTest ? false : true;

        const transportDefaults = {
            console: {
                format: 'custom',
                colorize: defaultColorize,
                timestamp: true,
                prettyMetadata: true
            },
            file: {
                format: 'json',
                colorize: false,
                timestamp: true,
                jsonSpace: 0
            },
            http: {
                format: 'json',
                colorize: false,
                timestamp: true
            },
            stream: {
                format: 'json',
                colorize: false
            }
        };

        const mergedOptions = {
            ...transportDefaults[transportType] || {},
            ...options
        };

        return new LogFormatter(mergedOptions).getFormat();
    }

    /**
     * Format presets
     */
    static presets = {
        // Development console output
        development: () => {
            const isTest = process.env.NODE_ENV === 'test' ||
                process.argv.includes('--test') ||
                process.argv.some(arg => arg.includes('test-runner'));
            return new LogFormatter({
                format: 'custom',
                colorize: !isTest,
                timestamp: true,
                timestampFormat: 'HH:mm:ss.SSS',
                prettyMetadata: true
            }).getFormat();
        },

        // Production JSON logs
        production: () => new LogFormatter({
            format: 'json',
            colorize: false,
            timestamp: true,
            errors: true
        }).getFormat(),

        // Compact single line
        compact: () => new LogFormatter({
            format: 'compact',
            timestamp: true,
            timestampFormat: 'YYYY-MM-DD HH:mm:ss'
        }).getFormat(),

        // Detailed multi-line
        detailed: () => {
            const isTest = process.env.NODE_ENV === 'test' ||
                process.argv.includes('--test') ||
                process.argv.some(arg => arg.includes('test-runner'));
            return new LogFormatter({
                format: 'detailed',
                timestamp: true,
                colorize: !isTest
            }).getFormat();
        },

        // ELK Stack compatible
        elk: () => new LogFormatter({
            format: 'logstash',
            timestamp: true,
            errors: true
        }).getFormat(),

        // Minimal format
        minimal: () => {
            const isTest = process.env.NODE_ENV === 'test' ||
                process.argv.includes('--test') ||
                process.argv.some(arg => arg.includes('test-runner'));
            return new LogFormatter({
                format: 'simple',
                colorize: !isTest,
                timestamp: false
            }).getFormat();
        }
    };

    /**
     * Get default formatter options for a profile
     */
    static getDefaultOptions(profile) {
        const profileDefaults = {
            development: {
                format: 'custom',
                colorize: true,
                timestamp: true,
                timestampFormat: 'HH:mm:ss.SSS',
                prettyMetadata: true
            },
            production: {
                format: 'json',
                colorize: false,
                timestamp: true,
                timestampFormat: 'YYYY-MM-DD HH:mm:ss',
                errors: true
            },
            test: {
                format: 'json',
                colorize: false,
                timestamp: true,
                timestampFormat: 'YYYY-MM-DD HH:mm:ss',
                errors: false
            }
        };

        return profileDefaults[profile] || profileDefaults.development;
    }

    /**
     * Update formatter options
     */
    updateOptions(newOptions) {
        this.options = { ...this.options, ...newOptions };
    }

    /**
     * Get current options
     */
    getOptions() {
        return { ...this.options };
    }

    /**
     * Get configuration info
     */
    getConfigInfo() {
        return {
            format: this.options.format,
            options: this.getOptions()
        };
    }

    /**
     * Validate format options
     */
    static validateOptions(options) {
        const errors = [];

        if (options.format && typeof options.format !== 'string' && typeof options.format !== 'function') {
            errors.push('format must be a string or function');
        }

        if (options.timestampFormat && typeof options.timestampFormat !== 'string') {
            errors.push('timestampFormat must be a string');
        }

        if (options.jsonSpace && (typeof options.jsonSpace !== 'number' || options.jsonSpace < 0)) {
            errors.push('jsonSpace must be a non-negative number');
        }

        return errors;
    }
}

module.exports = LogFormatter;
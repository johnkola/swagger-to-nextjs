// src/errors/BaseError.js

const crypto = require('crypto');

/**
 * @class BaseError
 * @extends Error
 * @description Base error class for all custom errors in the application
 */
class BaseError extends Error {
    /**
     * @param {string} message - Error message
     * @param {string} code - Error code for identification
     * @param {Object} context - Additional context information
     * @param {Error} [originalError] - Original error if wrapping another error
     */
    constructor(message, code = 'UNKNOWN_ERROR', context = {}, originalError = null) {
        super(message);

        // Ensure the name of this error is the same as the class name
        this.name = this.constructor.name;

        // Generate unique ID for this error instance
        this.id = this._generateId();

        // Error code for programmatic identification
        this.code = String(code || 'UNKNOWN_ERROR');

        // Additional context information
        this.context = context || {};

        // Store the original error if this is wrapping another error
        this.originalError = originalError;

        // Timestamp when the error occurred
        this.timestamp = new Date().toISOString();

        // Ensure we have a proper stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }

        // If we have an original error, append its stack trace
        if (originalError && originalError.stack) {
            this.stack += '\n\nCaused by: ' + originalError.stack;
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
     * Check if this error has a specific code
     * @param {string} code - Error code to check
     * @returns {boolean}
     */
    hasCode(code) {
        return this.code === code;
    }

    /**
     * Check if this error is of a specific type
     * @param {string|Function} type - Error type name or constructor
     * @returns {boolean}
     */
    isType(type) {
        if (typeof type === 'string') {
            return this.name === type;
        }
        return this instanceof type;
    }

    /**
     * Add additional context to the error
     * @param {string|Object} key - Context key or object
     * @param {*} [value] - Context value if key is string
     * @returns {BaseError} Returns this for chaining
     */
    addContext(key, value) {
        if (typeof key === 'object') {
            Object.assign(this.context, key);
        } else {
            this.context[key] = value;
        }
        return this;
    }

    /**
     * Get error details as a plain object
     * @returns {Object}
     */
    toObject() {
        return {
            id: this.id,
            name: this.name,
            message: this.message,
            code: this.code,
            context: this.context,
            timestamp: this.timestamp,
            stack: this.stack
        };
    }

    /**
     * Get error details as JSON string
     * @returns {Object}
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            message: this.message,
            code: this.code,
            context: this.context,
            timestamp: this.timestamp
        };
    }

    /**
     * Get a formatted error message
     * @returns {string}
     */
    toString() {
        let str = `${this.name} [${this.code}]: ${this.message}`;

        if (Object.keys(this.context).length > 0) {
            try {
                str += '\nContext: ' + JSON.stringify(this.context, null, 2);
            } catch (e) {
                // Handle circular references or other stringify errors
                str += '\nContext: ' + this._safeStringify(this.context);
            }
        }

        return str;
    }

    /**
     * Safe stringify for objects with circular references
     * @private
     */
    _safeStringify(obj, indent = 0, visited = new WeakSet()) {
        const spaces = ' '.repeat(indent);

        if (obj === null) return 'null';
        if (obj === undefined) return 'undefined';

        if (typeof obj !== 'object') {
            return String(obj);
        }

        // Check for circular reference
        if (visited.has(obj)) {
            return '[Circular]';
        }
        visited.add(obj);

        if (Array.isArray(obj)) {
            if (obj.length === 0) return '[]';
            const items = obj.map(item =>
                spaces + '  ' + this._safeStringify(item, indent + 2, visited)
            );
            return '[\n' + items.join(',\n') + '\n' + spaces + ']';
        }

        const entries = Object.entries(obj);
        if (entries.length === 0) return '{}';

        const items = entries.map(([key, value]) => {
            const valueStr = this._safeStringify(value, indent + 2, visited);
            return `${spaces}  "${key}": ${valueStr}`;
        });

        return '{\n' + items.join(',\n') + '\n' + spaces + '}';
    }

    /**
     * Static factory method to create error from unknown thrown value
     * @param {*} thrown - The thrown value (might not be an Error)
     * @param {string} [defaultMessage] - Default message if thrown is not an Error
     * @param {string} [defaultCode] - Default code
     * @returns {BaseError}
     */
    static from(thrown, defaultMessage = 'An error occurred', defaultCode = 'UNKNOWN_ERROR') {
        if (thrown instanceof BaseError) {
            return thrown;
        }

        if (thrown instanceof Error) {
            return new BaseError(
                thrown.message || defaultMessage,
                thrown.code || defaultCode,
                {
                    originalName: thrown.name,
                    originalStack: thrown.stack
                },
                thrown
            );
        }

        // Handle non-Error thrown values
        let message = defaultMessage;
        if (thrown !== null && thrown !== undefined) {
            message = String(thrown) || defaultMessage;
        }

        return new BaseError(
            message,
            defaultCode,
            {
                thrownValue: thrown,
                thrownType: typeof thrown
            }
        );
    }

    /**
     * Check if a value is a BaseError instance
     * @param {*} value - Value to check
     * @returns {boolean}
     */
    static isBaseError(value) {
        return value instanceof BaseError;
    }

    /**
     * Create a new error class that extends BaseError
     * @param {string} name - Name of the new error class
     * @param {string} [defaultCode] - Default error code
     * @returns {Function} New error class
     */
    static extend(name, defaultCode = null) {
        class ExtendedError extends BaseError {
            constructor(message, code = defaultCode, context = {}, originalError = null) {
                super(message, code || defaultCode || name.toUpperCase().replace(/ERROR$/, ''), context, originalError);
                this.name = name;
            }
        }

        // Set the name property for better debugging
        Object.defineProperty(ExtendedError, 'name', { value: name });

        return ExtendedError;
    }
}

module.exports = BaseError;
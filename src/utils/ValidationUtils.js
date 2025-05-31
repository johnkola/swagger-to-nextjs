/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - AI PROMPT
 * ============================================================================
 * FILE: src/utils/ValidationUtils.js
 * VERSION: 2025-05-30 11:34:23
 * PHASE: PHASE 3: Code Generation Engine
 * CATEGORY: 🛠️ Utility Functions
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 *
 * Create robust validation utilities that:
 * - Implement comprehensive input sanitization 
 * - Generate validation functions from schemas 
 * - Support custom validation rules 
 * - Implement async validation 
 * - Provide detailed error messages 
 * - Support conditional validation 
 * - Implement security validation 
 * - Generate validation documentation 
 * - Support validation composition 
 * - Implement performance optimization
 *
 * ============================================================================
 */

/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - AI PROMPT
 * ============================================================================
 * FILE: src/utils/ValidationUtils.js
 * VERSION: 2025-05-30 11:34:23
 * PHASE: PHASE 3: Code Generation Engine
 * CATEGORY: 🛠️ Utility Functions
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 *
 * Create robust validation utilities that:
 * - Implement comprehensive input sanitization
 * - Generate validation functions from schemas
 * - Support custom validation rules
 * - Implement async validation
 * - Provide detailed error messages
 * - Support conditional validation
 * - Implement security validation
 * - Generate validation documentation
 * - Support validation composition
 * - Implement performance optimization
 *
 * ============================================================================
 */

const { z } = require('zod');
const DOMPurify = require('isomorphic-dompurify');
const validator = require('validator');
const xss = require('xss');

/**
 * Robust validation utilities for comprehensive input validation
 */
class ValidationUtils {
    /**
     * Initialize validation utilities with custom rules
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
        this.options = {
            sanitization: {
                stripTags: true,
                escapeHtml: true,
                normalizeWhitespace: true,
                trimInput: true,
                maxLength: 10000
            },
            security: {
                checkSqlInjection: true,
                checkXss: true,
                checkPathTraversal: true,
                checkCommandInjection: true,
                allowedProtocols: ['http', 'https', 'ftp'],
                blockPatterns: []
            },
            performance: {
                cacheValidators: true,
                maxCacheSize: 100,
                asyncThreshold: 1000
            },
            ...options
        };

        this.customRules = new Map();
        this.validatorCache = new Map();
        this.sanitizers = new Map();
        this.asyncValidators = new Map();
        this.composedValidators = new Map();

        this.initializeBuiltInRules();
        this.initializeBuiltInSanitizers();
        this.initializeSecurityPatterns();
    }

    /**
     * Initialize built-in validation rules
     */
    initializeBuiltInRules() {
        // String validations
        this.addRule('email', (value) => validator.isEmail(value));
        this.addRule('url', (value) => validator.isURL(value));
        this.addRule('uuid', (value) => validator.isUUID(value));
        this.addRule('alphanumeric', (value) => validator.isAlphanumeric(value));
        this.addRule('alpha', (value) => validator.isAlpha(value));
        this.addRule('numeric', (value) => validator.isNumeric(value));
        this.addRule('hexColor', (value) => validator.isHexColor(value));
        this.addRule('ipAddress', (value) => validator.isIP(value));
        this.addRule('json', (value) => validator.isJSON(value));
        this.addRule('jwt', (value) => validator.isJWT(value));
        this.addRule('base64', (value) => validator.isBase64(value));
        this.addRule('dataUri', (value) => validator.isDataURI(value));
        this.addRule('mimeType', (value) => validator.isMimeType(value));
        this.addRule('semVer', (value) => validator.isSemVer(value));
        this.addRule('creditCard', (value) => validator.isCreditCard(value));
        this.addRule('iban', (value) => validator.isIBAN(value));
        this.addRule('bic', (value) => validator.isBIC(value));

        // Number validations
        this.addRule('port', (value) => validator.isPort(String(value)));
        this.addRule('latitude', (value) => validator.isLatLong(`${value},0`));
        this.addRule('longitude', (value) => validator.isLatLong(`0,${value}`));

        // Date validations
        this.addRule('date', (value) => validator.isDate(value));
        this.addRule('iso8601', (value) => validator.isISO8601(value));
        this.addRule('rfc3339', (value) => validator.isRFC3339(value));

        // Security validations
        this.addRule('safeString', (value) => !this.containsMaliciousPatterns(value));
        this.addRule('safePath', (value) => !this.containsPathTraversal(value));
        this.addRule('safeCommand', (value) => !this.containsCommandInjection(value));
        this.addRule('safeSql', (value) => !this.containsSqlInjection(value));

        // Custom format validations
        this.addRule('phone', (value) => /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(value));
        this.addRule('slug', (value) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value));
        this.addRule('username', (value) => /^[a-zA-Z0-9_-]{3,16}$/.test(value));
        this.addRule('password', (value) => this.validatePassword(value));
        this.addRule('strongPassword', (value) => this.validateStrongPassword(value));
    }

    /**
     * Initialize built-in sanitizers
     */
    initializeBuiltInSanitizers() {
        // String sanitizers
        this.addSanitizer('trim', (value) => value.trim());
        this.addSanitizer('lowercase', (value) => value.toLowerCase());
        this.addSanitizer('uppercase', (value) => value.toUpperCase());
        this.addSanitizer('escape', (value) => validator.escape(value));
        this.addSanitizer('unescape', (value) => validator.unescape(value));
        this.addSanitizer('normalizeEmail', (value) => validator.normalizeEmail(value));
        this.addSanitizer('stripLow', (value) => validator.stripLow(value));
        this.addSanitizer('toBoolean', (value) => validator.toBoolean(value));
        this.addSanitizer('toDate', (value) => validator.toDate(value));
        this.addSanitizer('toFloat', (value) => validator.toFloat(value));
        this.addSanitizer('toInt', (value) => validator.toInt(value));

        // HTML sanitizers
        this.addSanitizer('stripHtml', (value) => this.stripHtml(value));
        this.addSanitizer('sanitizeHtml', (value) => this.sanitizeHtml(value));

        // Path sanitizers
        this.addSanitizer('sanitizePath', (value) => this.sanitizePath(value));

        // JSON sanitizers
        this.addSanitizer('sanitizeJson', (value) => this.sanitizeJson(value));

        // SQL sanitizers
        this.addSanitizer('escapeSql', (value) => this.escapeSql(value));
    }

    /**
     * Initialize security patterns
     */
    initializeSecurityPatterns() {
        this.securityPatterns = {
            sqlInjection: [
                /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/gi,
                /('|(--|#|\/\*|\*\/|@@|@))/g,
                /(;|'|"|`|\\|\/\*|\*\/|xp_|sp_)/gi,
                /(\b(and|or)\b\s*\d+\s*=\s*\d+)/gi
            ],
            xss: [
                /<script[^>]*>.*?<\/script>/gi,
                /<iframe[^>]*>.*?<\/iframe>/gi,
                /javascript:/gi,
                /on\w+\s*=/gi,
                /<object[^>]*>.*?<\/object>/gi,
                /<embed[^>]*>.*?<\/embed>/gi
            ],
            pathTraversal: [
                /\.\.\//g,
                /\.\.%2f/gi,
                /\.\.%5c/gi,
                /%2e%2e/gi,
                /\.\.%252f/gi
            ],
            commandInjection: [
                /[;&|`$()]/g,
                /\b(cat|ls|echo|rm|mv|cp|chmod|chown|ping|curl|wget)\b/gi
            ]
        };
    }

    /**
     * Generate validation function from schema
     * @param {Object} schema - Validation schema
     * @returns {Function} Validation function
     */
    generateValidatorFromSchema(schema) {
        const cacheKey = JSON.stringify(schema);

        if (this.options.performance.cacheValidators && this.validatorCache.has(cacheKey)) {
            return this.validatorCache.get(cacheKey);
        }

        const validator = (data, options = {}) => {
            return this.validateWithSchema(data, schema, options);
        };

        if (this.options.performance.cacheValidators) {
            this.validatorCache.set(cacheKey, validator);
        }

        return validator;
    }

    /**
     * Validate data with schema
     * @param {*} data - Data to validate
     * @param {Object} schema - Validation schema
     * @param {Object} options - Validation options
     * @returns {Object} Validation result
     */
    validateWithSchema(data, schema, options = {}) {
        const errors = [];
        const sanitized = {};
        const context = { ...options.context };

        for (const [field, rules] of Object.entries(schema)) {
            const value = this.getNestedValue(data, field);
            const fieldResult = this.validateField(field, value, rules, data, context);

            if (fieldResult.errors.length > 0) {
                errors.push(...fieldResult.errors);
            }

            if (fieldResult.sanitized !== undefined) {
                this.setNestedValue(sanitized, field, fieldResult.sanitized);
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            sanitized: errors.length === 0 ? sanitized : null
        };
    }

    /**
     * Validate single field
     * @param {string} field - Field name
     * @param {*} value - Field value
     * @param {Object} rules - Field rules
     * @param {Object} data - Complete data object
     * @param {Object} context - Validation context
     * @returns {Object} Field validation result
     */
    validateField(field, value, rules, data, context) {
        const errors = [];
        let sanitized = value;

        // Check if field is required
        if (rules.required && this.isEmpty(value)) {
            errors.push({
                field,
                message: rules.message || `${field} is required`,
                code: 'REQUIRED'
            });
            return { errors, sanitized: undefined };
        }

        // Skip validation if optional and empty
        if (!rules.required && this.isEmpty(value)) {
            return { errors: [], sanitized: undefined };
        }

        // Apply conditional validation
        if (rules.when) {
            const condition = this.evaluateCondition(rules.when, data, context);
            if (!condition) {
                return { errors: [], sanitized };
            }
        }

        // Apply sanitizers
        if (rules.sanitize) {
            sanitized = this.applySanitizers(sanitized, rules.sanitize);
        }

        // Type validation
        if (rules.type) {
            const typeValid = this.validateType(sanitized, rules.type);
            if (!typeValid) {
                errors.push({
                    field,
                    message: rules.typeMessage || `${field} must be of type ${rules.type}`,
                    code: 'INVALID_TYPE'
                });
            }
        }

        // Built-in validations
        if (rules.validate) {
            const validations = Array.isArray(rules.validate) ? rules.validate : [rules.validate];

            for (const validation of validations) {
                const result = this.executeValidation(sanitized, validation, field, data, context);
                if (!result.valid) {
                    errors.push(result.error);
                }
            }
        }

        // Custom validation function
        if (rules.custom) {
            const customResult = rules.custom(sanitized, data, context);
            if (customResult !== true) {
                errors.push({
                    field,
                    message: customResult || `${field} failed custom validation`,
                    code: 'CUSTOM_VALIDATION_FAILED'
                });
            }
        }

        // Length validations
        if (rules.minLength && sanitized.length < rules.minLength) {
            errors.push({
                field,
                message: rules.minLengthMessage || `${field} must be at least ${rules.minLength} characters`,
                code: 'MIN_LENGTH'
            });
        }

        if (rules.maxLength && sanitized.length > rules.maxLength) {
            errors.push({
                field,
                message: rules.maxLengthMessage || `${field} must not exceed ${rules.maxLength} characters`,
                code: 'MAX_LENGTH'
            });
        }

        // Numeric validations
        if (rules.min !== undefined && Number(sanitized) < rules.min) {
            errors.push({
                field,
                message: rules.minMessage || `${field} must be at least ${rules.min}`,
                code: 'MIN_VALUE'
            });
        }

        if (rules.max !== undefined && Number(sanitized) > rules.max) {
            errors.push({
                field,
                message: rules.maxMessage || `${field} must not exceed ${rules.max}`,
                code: 'MAX_VALUE'
            });
        }

        // Pattern validation
        if (rules.pattern && !rules.pattern.test(sanitized)) {
            errors.push({
                field,
                message: rules.patternMessage || `${field} format is invalid`,
                code: 'PATTERN_MISMATCH'
            });
        }

        // Enum validation
        if (rules.enum && !rules.enum.includes(sanitized)) {
            errors.push({
                field,
                message: rules.enumMessage || `${field} must be one of: ${rules.enum.join(', ')}`,
                code: 'INVALID_ENUM_VALUE'
            });
        }

        return { errors, sanitized };
    }

    /**
     * Execute validation rule
     * @param {*} value - Value to validate
     * @param {string|Object} validation - Validation rule
     * @param {string} field - Field name
     * @param {Object} data - Complete data
     * @param {Object} context - Validation context
     * @returns {Object} Validation result
     */
    executeValidation(value, validation, field, data, context) {
        if (typeof validation === 'string') {
            // Built-in validation rule
            if (this.customRules.has(validation)) {
                const rule = this.customRules.get(validation);
                const valid = rule(value, data, context);
                return {
                    valid,
                    error: valid ? null : {
                        field,
                        message: `${field} failed ${validation} validation`,
                        code: validation.toUpperCase()
                    }
                };
            }
        } else if (typeof validation === 'object') {
            // Complex validation with options
            const { rule, options, message } = validation;
            if (this.customRules.has(rule)) {
                const validator = this.customRules.get(rule);
                const valid = validator(value, options, data, context);
                return {
                    valid,
                    error: valid ? null : {
                        field,
                        message: message || `${field} failed ${rule} validation`,
                        code: rule.toUpperCase()
                    }
                };
            }
        }

        return { valid: true };
    }

    /**
     * Add custom validation rule
     * @param {string} name - Rule name
     * @param {Function} validator - Validation function
     */
    addRule(name, validator) {
        this.customRules.set(name, validator);
    }

    /**
     * Add custom sanitizer
     * @param {string} name - Sanitizer name
     * @param {Function} sanitizer - Sanitizer function
     */
    addSanitizer(name, sanitizer) {
        this.sanitizers.set(name, sanitizer);
    }

    /**
     * Add async validator
     * @param {string} name - Validator name
     * @param {Function} validator - Async validation function
     */
    addAsyncValidator(name, validator) {
        this.asyncValidators.set(name, validator);
    }

    /**
     * Validate with async validators
     * @param {*} data - Data to validate
     * @param {Object} schema - Validation schema
     * @param {Object} options - Options
     * @returns {Promise<Object>} Validation result
     */
    async validateAsync(data, schema, options = {}) {
        const syncResult = this.validateWithSchema(data, schema, options);

        if (!syncResult.valid) {
            return syncResult;
        }

        const asyncErrors = [];
        const asyncPromises = [];

        for (const [field, rules] of Object.entries(schema)) {
            if (rules.asyncValidate) {
                const value = this.getNestedValue(data, field);
                const validations = Array.isArray(rules.asyncValidate) ? rules.asyncValidate : [rules.asyncValidate];

                for (const validation of validations) {
                    asyncPromises.push(
                        this.executeAsyncValidation(value, validation, field, data, options.context)
                            .then(result => {
                                if (!result.valid) {
                                    asyncErrors.push(result.error);
                                }
                            })
                    );
                }
            }
        }

        await Promise.all(asyncPromises);

        return {
            valid: asyncErrors.length === 0,
            errors: [...syncResult.errors, ...asyncErrors],
            sanitized: asyncErrors.length === 0 ? syncResult.sanitized : null
        };
    }

    /**
     * Execute async validation
     * @param {*} value - Value to validate
     * @param {string|Object} validation - Validation rule
     * @param {string} field - Field name
     * @param {Object} data - Complete data
     * @param {Object} context - Context
     * @returns {Promise<Object>} Validation result
     */
    async executeAsyncValidation(value, validation, field, data, context) {
        try {
            if (typeof validation === 'string') {
                if (this.asyncValidators.has(validation)) {
                    const validator = this.asyncValidators.get(validation);
                    const valid = await validator(value, data, context);
                    return {
                        valid,
                        error: valid ? null : {
                            field,
                            message: `${field} failed ${validation} validation`,
                            code: validation.toUpperCase()
                        }
                    };
                }
            } else if (typeof validation === 'object') {
                const { rule, options, message } = validation;
                if (this.asyncValidators.has(rule)) {
                    const validator = this.asyncValidators.get(rule);
                    const valid = await validator(value, options, data, context);
                    return {
                        valid,
                        error: valid ? null : {
                            field,
                            message: message || `${field} failed ${rule} validation`,
                            code: rule.toUpperCase()
                        }
                    };
                }
            }
        } catch (error) {
            return {
                valid: false,
                error: {
                    field,
                    message: `Async validation error: ${error.message}`,
                    code: 'ASYNC_VALIDATION_ERROR'
                }
            };
        }

        return { valid: true };
    }

    /**
     * Compose multiple validators
     * @param {...Function} validators - Validators to compose
     * @returns {Function} Composed validator
     */
    compose(...validators) {
        return (data, options = {}) => {
            const errors = [];
            let sanitized = data;

            for (const validator of validators) {
                const result = validator(sanitized, options);

                if (!result.valid) {
                    errors.push(...result.errors);
                }

                if (result.sanitized) {
                    sanitized = result.sanitized;
                }
            }

            return {
                valid: errors.length === 0,
                errors,
                sanitized: errors.length === 0 ? sanitized : null
            };
        };
    }

    /**
     * Create conditional validator
     * @param {Function} condition - Condition function
     * @param {Function} validator - Validator to apply if condition is true
     * @param {Function} elseValidator - Optional validator if condition is false
     * @returns {Function} Conditional validator
     */
    conditional(condition, validator, elseValidator = null) {
        return (data, options = {}) => {
            const shouldValidate = condition(data, options.context);

            if (shouldValidate) {
                return validator(data, options);
            } else if (elseValidator) {
                return elseValidator(data, options);
            }

            return { valid: true, errors: [], sanitized: data };
        };
    }

    /**
     * Apply sanitizers to value
     * @param {*} value - Value to sanitize
     * @param {Array|string} sanitizers - Sanitizers to apply
     * @returns {*} Sanitized value
     */
    applySanitizers(value, sanitizers) {
        const sanitizerList = Array.isArray(sanitizers) ? sanitizers : [sanitizers];
        let sanitized = value;

        for (const sanitizer of sanitizerList) {
            if (typeof sanitizer === 'string' && this.sanitizers.has(sanitizer)) {
                sanitized = this.sanitizers.get(sanitizer)(sanitized);
            } else if (typeof sanitizer === 'function') {
                sanitized = sanitizer(sanitized);
            }
        }

        return sanitized;
    }

    /**
     * Implement comprehensive input sanitization
     * @param {*} input - Input to sanitize
     * @param {Object} options - Sanitization options
     * @returns {*} Sanitized input
     */
    sanitize(input, options = {}) {
        const sanitizeOptions = { ...this.options.sanitization, ...options };

        if (input === null || input === undefined) {
            return input;
        }

        // Handle different input types
        if (typeof input === 'string') {
            return this.sanitizeString(input, sanitizeOptions);
        } else if (Array.isArray(input)) {
            return input.map(item => this.sanitize(item, sanitizeOptions));
        } else if (typeof input === 'object') {
            return this.sanitizeObject(input, sanitizeOptions);
        }

        return input;
    }

    /**
     * Sanitize string input
     * @param {string} str - String to sanitize
     * @param {Object} options - Options
     * @returns {string} Sanitized string
     */
    sanitizeString(str, options) {
        let sanitized = str;

        // Trim if enabled
        if (options.trimInput) {
            sanitized = sanitized.trim();
        }

        // Normalize whitespace
        if (options.normalizeWhitespace) {
            sanitized = sanitized.replace(/\s+/g, ' ');
        }

        // Strip tags if enabled
        if (options.stripTags) {
            sanitized = this.stripHtml(sanitized);
        } else if (options.escapeHtml) {
            sanitized = validator.escape(sanitized);
        }

        // Enforce max length
        if (options.maxLength && sanitized.length > options.maxLength) {
            sanitized = sanitized.substring(0, options.maxLength);
        }

        // Check for malicious patterns
        if (this.options.security.checkXss && this.containsXss(sanitized)) {
            sanitized = this.sanitizeHtml(sanitized);
        }

        return sanitized;
    }

    /**
     * Sanitize object recursively
     * @param {Object} obj - Object to sanitize
     * @param {Object} options - Options
     * @returns {Object} Sanitized object
     */
    sanitizeObject(obj, options) {
        const sanitized = {};

        for (const [key, value] of Object.entries(obj)) {
            // Sanitize key
            const sanitizedKey = this.sanitizeString(key, {
                ...options,
                stripTags: true,
                maxLength: 100
            });

            // Sanitize value
            sanitized[sanitizedKey] = this.sanitize(value, options);
        }

        return sanitized;
    }

    /**
     * Strip HTML tags
     * @param {string} str - String to strip
     * @returns {string} Stripped string
     */
    stripHtml(str) {
        return str.replace(/<[^>]*>/g, '');
    }

    /**
     * Sanitize HTML content
     * @param {string} html - HTML to sanitize
     * @returns {string} Sanitized HTML
     */
    sanitizeHtml(html) {
        return DOMPurify.sanitize(html, {
            ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
            ALLOWED_ATTR: ['href', 'title']
        });
    }

    /**
     * Sanitize file path
     * @param {string} path - Path to sanitize
     * @returns {string} Sanitized path
     */
    sanitizePath(path) {
        return path
            .replace(/\.\./g, '')
            .replace(/[<>:"|?*]/g, '')
            .replace(/\/{2,}/g, '/')
            .trim();
    }

    /**
     * Sanitize JSON string
     * @param {string} json - JSON to sanitize
     * @returns {string} Sanitized JSON
     */
    sanitizeJson(json) {
        try {
            const parsed = JSON.parse(json);
            const sanitized = this.sanitize(parsed);
            return JSON.stringify(sanitized);
        } catch (e) {
            return '{}';
        }
    }

    /**
     * Escape SQL special characters
     * @param {string} str - String to escape
     * @returns {string} Escaped string
     */
    escapeSql(str) {
        return str
            .replace(/'/g, "''")
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\x00/g, '\\0')
            .replace(/\x1a/g, '\\Z');
    }

    /**
     * Validate type
     * @param {*} value - Value to check
     * @param {string} type - Expected type
     * @returns {boolean} Valid type
     */
    validateType(value, type) {
        switch (type) {
            case 'string':
                return typeof value === 'string';
            case 'number':
                return typeof value === 'number' && !isNaN(value);
            case 'integer':
                return Number.isInteger(value);
            case 'boolean':
                return typeof value === 'boolean';
            case 'array':
                return Array.isArray(value);
            case 'object':
                return value !== null && typeof value === 'object' && !Array.isArray(value);
            case 'date':
                return value instanceof Date || !isNaN(Date.parse(value));
            case 'email':
                return validator.isEmail(String(value));
            case 'url':
                return validator.isURL(String(value));
            default:
                return true;
        }
    }

    /**
     * Check if value is empty
     * @param {*} value - Value to check
     * @returns {boolean} Is empty
     */
    isEmpty(value) {
        if (value === null || value === undefined) return true;
        if (typeof value === 'string') return value.trim() === '';
        if (Array.isArray(value)) return value.length === 0;
        if (typeof value === 'object') return Object.keys(value).length === 0;
        return false;
    }

    /**
     * Evaluate condition
     * @param {Function|Object} condition - Condition to evaluate
     * @param {Object} data - Data context
     * @param {Object} context - Additional context
     * @returns {boolean} Condition result
     */
    evaluateCondition(condition, data, context) {
        if (typeof condition === 'function') {
            return condition(data, context);
        }

        if (typeof condition === 'object') {
            const { field, operator, value } = condition;
            const fieldValue = this.getNestedValue(data, field);

            switch (operator) {
                case 'eq':
                case '===':
                    return fieldValue === value;
                case 'ne':
                case '!==':
                    return fieldValue !== value;
                case 'gt':
                case '>':
                    return fieldValue > value;
                case 'gte':
                case '>=':
                    return fieldValue >= value;
                case 'lt':
                case '<':
                    return fieldValue < value;
                case 'lte':
                case '<=':
                    return fieldValue <= value;
                case 'in':
                    return Array.isArray(value) && value.includes(fieldValue);
                case 'notIn':
                    return Array.isArray(value) && !value.includes(fieldValue);
                case 'contains':
                    return String(fieldValue).includes(value);
                case 'startsWith':
                    return String(fieldValue).startsWith(value);
                case 'endsWith':
                    return String(fieldValue).endsWith(value);
                case 'matches':
                    return new RegExp(value).test(fieldValue);
                default:
                    return true;
            }
        }

        return Boolean(condition);
    }

    /**
     * Get nested value from object
     * @param {Object} obj - Source object
     * @param {string} path - Property path
     * @returns {*} Value
     */
    getNestedValue(obj, path) {
        const keys = path.split('.');
        let value = obj;

        for (const key of keys) {
            if (value === null || value === undefined) {
                return undefined;
            }
            value = value[key];
        }

        return value;
    }

    /**
     * Set nested value in object
     * @param {Object} obj - Target object
     * @param {string} path - Property path
     * @param {*} value - Value to set
     */
    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let target = obj;

        for (const key of keys) {
            if (!target[key] || typeof target[key] !== 'object') {
                target[key] = {};
            }
            target = target[key];
        }

        target[lastKey] = value;
    }

    /**
     * Validate password strength
     * @param {string} password - Password to validate
     * @returns {boolean} Valid password
     */
    validatePassword(password) {
        // At least 8 characters
        return password && password.length >= 8;
    }

    /**
     * Validate strong password
     * @param {string} password - Password to validate
     * @returns {boolean} Valid strong password
     */
    validateStrongPassword(password) {
        if (!password || password.length < 8) return false;

        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        return hasUppercase && hasLowercase && hasNumber && hasSpecial;
    }

    /**
     * Check for malicious patterns
     * @param {string} str - String to check
     * @returns {boolean} Contains malicious patterns
     */
    containsMaliciousPatterns(str) {
        return this.containsSqlInjection(str) ||
            this.containsXss(str) ||
            this.containsPathTraversal(str) ||
            this.containsCommandInjection(str);
    }

    /**
     * Check for SQL injection patterns
     * @param {string} str - String to check
     * @returns {boolean} Contains SQL injection
     */
    containsSqlInjection(str) {
        if (!this.options.security.checkSqlInjection) return false;

        return this.securityPatterns.sqlInjection.some(pattern => pattern.test(str));
    }

    /**
     * Check for XSS patterns
     * @param {string} str - String to check
     * @returns {boolean} Contains XSS
     */
    containsXss(str) {
        if (!this.options.security.checkXss) return false;

        return this.securityPatterns.xss.some(pattern => pattern.test(str));
    }

    /**
     * Check for path traversal patterns
     * @param {string} str - String to check
     * @returns {boolean} Contains path traversal
     */
    containsPathTraversal(str) {
        if (!this.options.security.checkPathTraversal) return false;

        return this.securityPatterns.pathTraversal.some(pattern => pattern.test(str));
    }

    /**
     * Check for command injection patterns
     * @param {string} str - String to check
     * @returns {boolean} Contains command injection
     */
    containsCommandInjection(str) {
        if (!this.options.security.checkCommandInjection) return false;

        return this.securityPatterns.commandInjection.some(pattern => pattern.test(str));
    }

    /**
     * Generate validation documentation
     * @param {Object} schema - Validation schema
     * @returns {string} Documentation
     */
    generateDocumentation(schema) {
        const docs = [];

        docs.push('# Validation Schema Documentation\n');

        for (const [field, rules] of Object.entries(schema)) {
            docs.push(`## ${field}`);

            if (rules.description) {
                docs.push(`\n${rules.description}\n`);
            }

            docs.push('\n### Rules:\n');

            if (rules.required) {
                docs.push('- **Required**: Yes');
            }

            if (rules.type) {
                docs.push(`- **Type**: ${rules.type}`);
            }

            if (rules.minLength) {
                docs.push(`- **Min Length**: ${rules.minLength}`);
            }

            if (rules.maxLength) {
                docs.push(`- **Max Length**: ${rules.maxLength}`);
            }

            if (rules.min !== undefined) {
                docs.push(`- **Min Value**: ${rules.min}`);
            }

            if (rules.max !== undefined) {
                docs.push(`- **Max Value**: ${rules.max}`);
            }

            if (rules.pattern) {
                docs.push(`- **Pattern**: \`${rules.pattern}\``);
            }

            if (rules.enum) {
                docs.push(`- **Allowed Values**: ${rules.enum.join(', ')}`);
            }

            if (rules.validate) {
                const validations = Array.isArray(rules.validate) ? rules.validate : [rules.validate];
                docs.push(`- **Validations**: ${validations.join(', ')}`);
            }

            if (rules.sanitize) {
                const sanitizers = Array.isArray(rules.sanitize) ? rules.sanitize : [rules.sanitize];
                docs.push(`- **Sanitizers**: ${sanitizers.join(', ')}`);
            }

            docs.push('\n');
        }

        return docs.join('\n');
    }

    /**
     * Create Zod schema from validation schema
     * @param {Object} schema - Validation schema
     * @returns {Object} Zod schema
     */
    toZodSchema(schema) {
        const zodSchema = {};

        for (const [field, rules] of Object.entries(schema)) {
            let fieldSchema;

            // Determine base type
            switch (rules.type) {
                case 'string':
                    fieldSchema = z.string();
                    break;
                case 'number':
                    fieldSchema = z.number();
                    break;
                case 'integer':
                    fieldSchema = z.number().int();
                    break;
                case 'boolean':
                    fieldSchema = z.boolean();
                    break;
                case 'date':
                    fieldSchema = z.date();
                    break;
                case 'array':
                    fieldSchema = z.array(z.any());
                    break;
                case 'object':
                    fieldSchema = z.object({});
                    break;
                default:
                    fieldSchema = z.any();
            }

            // Apply constraints
            if (rules.minLength) {
                fieldSchema = fieldSchema.min(rules.minLength);
            }

            if (rules.maxLength) {
                fieldSchema = fieldSchema.max(rules.maxLength);
            }

            if (rules.min !== undefined) {
                fieldSchema = fieldSchema.min(rules.min);
            }

            if (rules.max !== undefined) {
                fieldSchema = fieldSchema.max(rules.max);
            }

            if (rules.pattern) {
                fieldSchema = fieldSchema.regex(rules.pattern);
            }

            if (rules.enum) {
                fieldSchema = z.enum(rules.enum);
            }

            // Handle optional
            if (!rules.required) {
                fieldSchema = fieldSchema.optional();
            }

            zodSchema[field] = fieldSchema;
        }

        return z.object(zodSchema);
    }

    /**
     * Benchmark validation performance
     * @param {Function} validator - Validator function
     * @param {*} data - Test data
     * @param {number} iterations - Number of iterations
     * @returns {Object} Benchmark results
     */
    benchmark(validator, data, iterations = 1000) {
        const start = process.hrtime.bigint();

        for (let i = 0; i < iterations; i++) {
            validator(data);
        }

        const end = process.hrtime.bigint();
        const totalTime = Number(end - start) / 1e6; // Convert to milliseconds
        const avgTime = totalTime / iterations;

        return {
            totalTime: `${totalTime.toFixed(2)}ms`,
            averageTime: `${avgTime.toFixed(4)}ms`,
            iterations,
            opsPerSecond: Math.round(1000 / avgTime)
        };
    }

    /**
     * Clear validator cache
     */
    clearCache() {
        this.validatorCache.clear();
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache stats
     */
    getCacheStats() {
        return {
            validatorCacheSize: this.validatorCache.size,
            maxCacheSize: this.options.performance.maxCacheSize,
            cacheEnabled: this.options.performance.cacheValidators
        };
    }
}

// Export singleton instance
module.exports = new ValidationUtils();

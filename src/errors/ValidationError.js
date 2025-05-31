/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - AI PROMPT
 * ============================================================================
 * FILE: src/errors/ValidationError.js
 * VERSION: 2025-05-30 11:34:23
 * PHASE: PHASE 2: Core System Components
 * CATEGORY: 🚨 Error Handling System
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 *
 * Build a specialized ValidationError class that:
 * - Captures field-level validation failures 
 * - Provides JSON Pointer references to error locations 
 * - Includes schema snippets for context 
 * - Suggests corrections for common patterns 
 * - Groups related errors intelligently 
 * - Formats errors for CLI and JSON output 
 * - Implements error severity levels 
 * - Provides links to documentation 
 * - Supports custom validation rules 
 * - Integrates with IDE error formats
 *
 * ============================================================================
 */
const GeneratorError = require('./GeneratorError');
const chalk = require('chalk');

/**
 * ValidationError - Specialized error for validation failures
 */
class ValidationError extends GeneratorError {
    constructor(message, validationDetails = {}, options = {}) {
        super(message, validationDetails.code || 'VALIDATION_ERROR', {
            category: 'validation',
            ...options
        });

        // Validation-specific properties
        this.validationErrors = validationDetails.errors || [];
        this.schema = validationDetails.schema || null;
        this.data = validationDetails.data || null;
        this.path = validationDetails.path || null;
        this.value = validationDetails.value || null;
        this.rule = validationDetails.rule || null;
        this.format = validationDetails.format || null;

        // JSON Pointer reference
        this.pointer = this._generateJsonPointer();

        // Group related errors
        this.errorGroups = this._groupErrors();

        // Generate suggestions
        this.suggestions = this._generateSuggestions();

        // IDE integration format
        this.ideFormat = validationDetails.ideFormat || 'vscode';
    }

    /**
     * Generate JSON Pointer reference
     */
    _generateJsonPointer() {
        if (!this.path) return null;

        if (Array.isArray(this.path)) {
            return '/' + this.path.map(segment =>
                String(segment).replace(/~/g, '~0').replace(/\//g, '~1')
            ).join('/');
        }

        return this.path.startsWith('/') ? this.path : '/' + this.path;
    }

    /**
     * Group related validation errors
     */
    _groupErrors() {
        const groups = {};

        this.validationErrors.forEach(error => {
            const groupKey = error.dataPath || error.instancePath || 'root';

            if (!groups[groupKey]) {
                groups[groupKey] = {
                    path: groupKey,
                    errors: [],
                    severity: 'error'
                };
            }

            groups[groupKey].errors.push({
                keyword: error.keyword,
                message: error.message,
                params: error.params,
                schemaPath: error.schemaPath
            });

            // Update severity if needed
            if (error.severity === 'warning' && groups[groupKey].severity === 'error') {
                groups[groupKey].severity = 'warning';
            }
        });

        return groups;
    }

    /**
     * Generate validation suggestions
     */
    _generateSuggestions() {
        const suggestions = [];

        this.validationErrors.forEach(error => {
            const suggestion = this._getSuggestionForError(error);
            if (suggestion && !suggestions.includes(suggestion)) {
                suggestions.push(suggestion);
            }
        });

        return suggestions;
    }

    /**
     * Get suggestion for specific error type
     */
    _getSuggestionForError(error) {
        const suggestionMap = {
            'required': `Add the required field '${error.params?.missingProperty}'`,
            'type': `Change the value to type '${error.params?.type}'`,
            'enum': `Use one of the allowed values: ${error.params?.allowedValues?.join(', ')}`,
            'pattern': `Match the pattern: ${error.params?.pattern}`,
            'minLength': `Ensure the value has at least ${error.params?.limit} characters`,
            'maxLength': `Ensure the value has at most ${error.params?.limit} characters`,
            'minimum': `Use a value >= ${error.params?.limit}`,
            'maximum': `Use a value <= ${error.params?.limit}`,
            'format': `Use the correct format: ${error.params?.format}`,
            'additionalProperties': `Remove the unexpected property '${error.params?.additionalProperty}'`,
            'uniqueItems': 'Ensure all array items are unique',
            'dependencies': `Include required dependencies: ${error.params?.deps?.join(', ')}`,
            'oneOf': 'Ensure the value matches exactly one schema',
            'anyOf': 'Ensure the value matches at least one schema',
            'allOf': 'Ensure the value matches all schemas',
            'not': 'The value should not match the schema'
        };

        return suggestionMap[error.keyword];
    }

    /**
     * Add validation error
     */
    addError(error) {
        this.validationErrors.push(error);
        this.errorGroups = this._groupErrors();
        this.suggestions = this._generateSuggestions();
        return this;
    }

    /**
     * Get errors for specific path
     */
    getErrorsForPath(path) {
        const pointer = path.startsWith('/') ? path : '/' + path;
        return this.validationErrors.filter(error =>
            error.instancePath === pointer || error.dataPath === pointer
        );
    }

    /**
     * Check if has errors at path
     */
    hasErrorsAtPath(path) {
        return this.getErrorsForPath(path).length > 0;
    }

    /**
     * Get schema snippet for context
     */
    getSchemaContext(path) {
        if (!this.schema) return null;

        const pathParts = path.split('/').filter(Boolean);
        let current = this.schema;

        for (const part of pathParts) {
            if (current.properties && current.properties[part]) {
                current = current.properties[part];
            } else if (current.items) {
                current = current.items;
            } else {
                return null;
            }
        }

        return current;
    }

    /**
     * Format for IDE/Editor integration
     */
    toIDEFormat(format = this.ideFormat) {
        switch (format) {
            case 'vscode':
                return this._toVSCodeFormat();
            case 'intellij':
                return this._toIntelliJFormat();
            case 'sublime':
                return this._toSublimeFormat();
            default:
                return this._toGenericIDEFormat();
        }
    }

    /**
     * VSCode problem matcher format
     */
    _toVSCodeFormat() {
        return this.validationErrors.map(error => ({
            resource: this.file || 'openapi.yaml',
            line: error.line || 1,
            column: error.column || 1,
            severity: error.severity || 'error',
            message: error.message,
            code: error.keyword,
            source: 'swagger-to-nextjs'
        }));
    }

    /**
     * IntelliJ format
     */
    _toIntelliJFormat() {
        return this.validationErrors.map(error =>
            `${this.file || 'openapi.yaml'}:${error.line || 1}:${error.column || 1}: ` +
            `${error.severity || 'error'}: ${error.message} [${error.keyword}]`
        ).join('\n');
    }

    /**
     * Sublime Text format
     */
    _toSublimeFormat() {
        return this.validationErrors.map(error => ({
            filename: this.file || 'openapi.yaml',
            line: error.line || 1,
            column: error.column || 1,
            message: `${error.keyword}: ${error.message}`
        }));
    }

    /**
     * Generic IDE format
     */
    _toGenericIDEFormat() {
        return this.validationErrors.map(error => ({
            file: this.file || 'openapi.yaml',
            line: error.line || 1,
            column: error.column || 1,
            severity: error.severity || 'error',
            message: error.message,
            rule: error.keyword
        }));
    }

    /**
     * Override CLI serialization for better formatting
     */
    _serializeCLI() {
        const parts = [];

        // Header
        parts.push(chalk.red(`✖ Validation Error: ${this.message}`));

        if (this.pointer) {
            parts.push(chalk.gray(`  Path: ${this.pointer}`));
        }

        // Group errors by path
        Object.entries(this.errorGroups).forEach(([path, group]) => {
            parts.push('');
            parts.push(chalk.yellow(`  ${path === 'root' ? '/' : path}:`));

            group.errors.forEach(error => {
                const icon = group.severity === 'warning' ? '⚠' : '✖';
                parts.push(chalk.red(`    ${icon} ${error.keyword}: ${error.message}`));

                // Add schema path for context
                if (error.schemaPath) {
                    parts.push(chalk.gray(`      Schema: ${error.schemaPath}`));
                }

                // Add parameters if available
                if (error.params && Object.keys(error.params).length > 0) {
                    parts.push(chalk.gray(`      Details: ${JSON.stringify(error.params)}`));
                }
            });
        });

        // Suggestions
        if (this.suggestions.length > 0) {
            parts.push('');
            parts.push(chalk.green('  💡 Suggestions:'));
            this.suggestions.forEach(suggestion => {
                parts.push(chalk.green(`    • ${suggestion}`));
            });
        }

        // Documentation link
        if (this.documentation) {
            parts.push('');
            parts.push(chalk.blue(`  📚 More info: ${this.documentation}`));
        }

        // Schema context in verbose mode
        if (process.env.VERBOSE === 'true' && this.schema) {
            parts.push('');
            parts.push(chalk.gray('  Schema Context:'));
            parts.push(chalk.gray(JSON.stringify(this.schema, null, 2).split('\n').map(line => '    ' + line).join('\n')));
        }

        return parts.join('\n');
    }

    /**
     * Override JSON serialization
     */
    _serializeJSON() {
        const base = super._serializeJSON();

        return {
            ...base,
            validation: {
                errors: this.validationErrors,
                errorGroups: this.errorGroups,
                pointer: this.pointer,
                path: this.path,
                value: this.value,
                schema: process.env.INCLUDE_SCHEMA === 'true' ? this.schema : undefined,
                suggestions: this.suggestions
            }
        };
    }

    /**
     * Create validation error from schema validation result
     */
    static fromSchemaValidation(result, options = {}) {
        const errors = result.errors || [];
        const message = errors.length === 1
            ? errors[0].message
            : `${errors.length} validation errors found`;

        return new ValidationError(message, {
            errors: errors,
            schema: result.schema,
            data: result.data,
            code: 'SCHEMA_VALIDATION_ERROR'
        }, options);
    }

    /**
     * Create validation error for missing required field
     */
    static missingRequired(field, path, options = {}) {
        return new ValidationError(`Missing required field: ${field}`, {
            errors: [{
                keyword: 'required',
                dataPath: path,
                message: `Missing required field: ${field}`,
                params: { missingProperty: field }
            }],
            code: 'MISSING_REQUIRED_FIELD'
        }, options);
    }

    /**
     * Create validation error for invalid type
     */
    static invalidType(field, expectedType, actualType, path, options = {}) {
        return new ValidationError(`Invalid type for field '${field}'`, {
            errors: [{
                keyword: 'type',
                dataPath: `${path}/${field}`,
                message: `Expected ${expectedType} but got ${actualType}`,
                params: { type: expectedType, actualType }
            }],
            code: 'INVALID_TYPE'
        }, options);
    }

    /**
     * Create validation error for pattern mismatch
     */
    static patternMismatch(field, pattern, value, path, options = {}) {
        return new ValidationError(`Pattern mismatch for field '${field}'`, {
            errors: [{
                keyword: 'pattern',
                dataPath: `${path}/${field}`,
                message: `Value does not match pattern: ${pattern}`,
                params: { pattern, value }
            }],
            code: 'PATTERN_MISMATCH'
        }, options);
    }

    /**
     * Merge multiple validation errors
     */
    static merge(errors, message = 'Multiple validation errors', options = {}) {
        const allErrors = [];

        errors.forEach(error => {
            if (error instanceof ValidationError) {
                allErrors.push(...error.validationErrors);
            }
        });

        return new ValidationError(message, {
            errors: allErrors,
            code: 'MULTIPLE_VALIDATION_ERRORS'
        }, options);
    }
}

module.exports = ValidationError;
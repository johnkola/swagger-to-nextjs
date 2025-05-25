/**
 * ===AI PROMPT ==============================================================
 * FILE: src/templates/TemplateEngine.js
 * VERSION: 2025-05-25 13:22:11
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 * Create a template engine class for processing template files with variable
 * substitution, conditional blocks, and loop constructs. Support custom
 * helpers and filters.
 *
 * ---
 *
 * ===PROMPT END ==============================================================
 */
/**
/**
/**
/**
/**
/**
/**
/**
/**
/**
/**
 * FILE: src/templates/TemplateEngine.js
 *
 * AI PROMPT FOR CODE REVIEW/ENHANCEMENT:
 * =====================================
 *
 * You are reviewing a lightweight template engine designed for code generation.
 * This engine processes template files with variable substitution, conditionals,
 * and loops to generate TypeScript, React, and configuration files.
 *
 * RESPONSIBILITIES:
 * - Process template files with dynamic content substitution
 * - Handle variable interpolation with nested object access
 * - Support conditional blocks for optional content generation
 * - Implement loop constructs for repetitive content
 * - Provide error handling and debugging capabilities
 * - Optimize performance for large template processing
 *
 * TEMPLATE SYNTAX SUPPORTED:
 * - Variables: {{variableName}}, {{object.property}}
 * - Conditionals: {{#if condition}}...{{/if}}
 * - Loops: {{#each array}}...{{/each}} with {{this}} and {{@index}}
 * - Complex expressions: {{array.length}}, {{object.method()}}
 * - Comments: {{!-- comment --}}
 *
 * REVIEW FOCUS:
 * - Template parsing accuracy and edge case handling
 * - Performance optimization for large datasets
 * - Error handling and debugging capabilities
 * - Security considerations for template injection
 * - Extensibility for additional template features
 */

const TemplateLoader = require('./TemplateLoader');

class TemplateEngine {
    constructor() {
        this.loader = new TemplateLoader();
        this.cache = new Map();
        this.helpers = new Map();

        // Register built-in helpers
        this.registerBuiltinHelpers();
    }

    /**
     * Render template with data
     */
    async render(templateName, data = {}) {
        try {
            // Load template content
            const template = await this.loader.load(templateName);

            // Process template with data
            return this.processTemplate(template, data);
        } catch (error) {
            throw new Error(`Template rendering failed for "${templateName}": ${error.message}`);
        }
    }

    /**
     * Process template string with data
     */
    processTemplate(template, data) {
        if (!template || typeof template !== 'string') {
            throw new Error('Template content must be a non-empty string');
        }

        let result = template;

        try {
            // Remove comments first
            result = this.removeComments(result);

            // Process conditional blocks
            result = this.processConditionals(result, data);

            // Process loops
            result = this.processLoops(result, data);

            // Process simple variable substitution
            result = this.processVariables(result, data);

            // Process helpers
            result = this.processHelpers(result, data);

            return result;
        } catch (error) {
            throw new Error(`Template processing error: ${error.message}`);
        }
    }

    /**
     * Remove template comments
     */
    removeComments(template) {
        return template.replace(/\{\{!--[\s\S]*?--\}\}/g, '');
    }

    /**
     * Process conditional blocks: {{#if condition}}...{{/if}}
     */
    processConditionals(template, data) {
        const conditionalRegex = /\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g;

        return template.replace(conditionalRegex, (match, condition, content) => {
            try {
                const conditionValue = this.evaluateExpression(condition.trim(), data);
                return this.isTruthy(conditionValue) ? content : '';
            } catch (error) {
                console.warn(`Warning: Failed to evaluate condition "${condition}": ${error.message}`);
                return ''; // Default to false for failed conditions
            }
        });
    }

    /**
     * Process loop blocks: {{#each array}}...{{/each}}
     */
    processLoops(template, data) {
        const loopRegex = /\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g;

        return template.replace(loopRegex, (match, arrayPath, content) => {
            try {
                const array = this.evaluateExpression(arrayPath.trim(), data);

                if (!Array.isArray(array)) {
                    console.warn(`Warning: "${arrayPath}" is not an array, skipping loop`);
                    return '';
                }

                return array.map((item, index) => {
                    // Create context for loop iteration
                    const loopContext = {
                        ...data,
                        this: item,
                        '@index': index,
                        '@first': index === 0,
                        '@last': index === array.length - 1,
                        '@length': array.length
                    };

                    return this.processTemplate(content, loopContext);
                }).join('');
            } catch (error) {
                console.warn(`Warning: Failed to process loop "${arrayPath}": ${error.message}`);
                return '';
            }
        });
    }

    /**
     * Process variable substitution: {{variable}}
     */
    processVariables(template, data) {
        const variableRegex = /\{\{([^#\/!][^}]*)\}\}/g;

        return template.replace(variableRegex, (match, expression) => {
            try {
                const value = this.evaluateExpression(expression.trim(), data);
                return this.formatValue(value);
            } catch (error) {
                console.warn(`Warning: Failed to evaluate expression "${expression}": ${error.message}`);
                return match; // Return original if evaluation fails
            }
        });
    }

    /**
     * Process helper functions
     */
    processHelpers(template, data) {
        // Process built-in helpers like {{join array ', '}}
        const helperRegex = /\{\{(\w+)\s+([^}]+)\}\}/g;

        return template.replace(helperRegex, (match, helperName, args) => {
            if (this.helpers.has(helperName)) {
                try {
                    const helper = this.helpers.get(helperName);
                    const parsedArgs = this.parseHelperArgs(args, data);
                    return helper.apply(this, parsedArgs);
                } catch (error) {
                    console.warn(`Warning: Helper "${helperName}" failed: ${error.message}`);
                    return match;
                }
            }
            return match;
        });
    }

    /**
     * Evaluate expression in given context
     */
    evaluateExpression(expression, data) {
        // Handle special template variables
        if (expression === 'this') {
            return data.this;
        }

        if (expression.startsWith('@')) {
            return data[expression];
        }

        // Handle nested property access
        if (expression.includes('.')) {
            return this.getNestedValue(data, expression);
        }

        // Handle array/string methods
        if (expression.includes('(') && expression.includes(')')) {
            return this.evaluateMethodCall(expression, data);
        }

        // Simple property access
        return data[expression];
    }

    /**
     * Get nested property value
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            if (current === null || current === undefined) {
                return undefined;
            }
            return current[key];
        }, obj);
    }

    /**
     * Evaluate method calls like array.join(', ')
     */
    evaluateMethodCall(expression, data) {
        const methodMatch = expression.match(/^([^(]+)\(([^)]*)\)$/);
        if (!methodMatch) {
            throw new Error(`Invalid method call: ${expression}`);
        }

        const [, objectPath, argsStr] = methodMatch;
        const obj = this.evaluateExpression(objectPath, data);

        if (obj === null || obj === undefined) {
            return '';
        }

        // Parse arguments
        const args = argsStr ? this.parseMethodArgs(argsStr, data) : [];

        // Handle common array methods
        if (Array.isArray(obj)) {
            if (objectPath.endsWith('.join')) {
                return obj.join(args[0] || '');
            }
            if (objectPath.endsWith('.length')) {
                return obj.length;
            }
        }

        // Handle string methods
        if (typeof obj === 'string') {
            if (objectPath.endsWith('.toUpperCase')) {
                return obj.toUpperCase();
            }
            if (objectPath.endsWith('.toLowerCase')) {
                return obj.toLowerCase();
            }
        }

        return obj;
    }

    /**
     * Parse method arguments
     */
    parseMethodArgs(argsStr, data) {
        const args = [];
        const argParts = argsStr.split(',');

        argParts.forEach(arg => {
            const trimmed = arg.trim();

            // String literal
            if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
                (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
                args.push(trimmed.slice(1, -1));
            }
            // Number literal
            else if (/^\d+(\.\d+)?$/.test(trimmed)) {
                args.push(parseFloat(trimmed));
            }
            // Boolean literal
            else if (trimmed === 'true' || trimmed === 'false') {
                args.push(trimmed === 'true');
            }
            // Variable reference
            else {
                args.push(this.evaluateExpression(trimmed, data));
            }
        });

        return args;
    }

    /**
     * Parse helper arguments
     */
    parseHelperArgs(argsStr, data) {
        return this.parseMethodArgs(argsStr, data);
    }

    /**
     * Check if value is truthy for template conditions
     */
    isTruthy(value) {
        if (value === null || value === undefined) return false;
        if (typeof value === 'boolean') return value;
        if (typeof value === 'number') return value !== 0;
        if (typeof value === 'string') return value.length > 0;
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === 'object') return Object.keys(value).length > 0;
        return Boolean(value);
    }

    /**
     * Format value for output
     */
    formatValue(value) {
        if (value === null || value === undefined) {
            return '';
        }
        if (typeof value === 'object') {
            return JSON.stringify(value);
        }
        return String(value);
    }

    /**
     * Register built-in helper functions
     */
    registerBuiltinHelpers() {
        // Join array helper
        this.helpers.set('join', (array, separator = '') => {
            if (!Array.isArray(array)) return '';
            return array.join(separator);
        });

        // Uppercase helper
        this.helpers.set('upper', (str) => {
            return String(str).toUpperCase();
        });

        // Lowercase helper
        this.helpers.set('lower', (str) => {
            return String(str).toLowerCase();
        });

        // Length helper
        this.helpers.set('length', (value) => {
            if (Array.isArray(value) || typeof value === 'string') {
                return value.length;
            }
            if (typeof value === 'object' && value !== null) {
                return Object.keys(value).length;
            }
            return 0;
        });

        // Default value helper
        this.helpers.set('default', (value, defaultValue) => {
            return (value === null || value === undefined || value === '') ? defaultValue : value;
        });
    }

    /**
     * Register custom helper function
     */
    registerHelper(name, fn) {
        if (typeof fn !== 'function') {
            throw new Error('Helper must be a function');
        }
        this.helpers.set(name, fn);
    }

    /**
     * Clear template cache
     */
    clearCache() {
        this.cache.clear();
        this.loader.clearCache();
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            templateEngine: this.cache.size,
            templateLoader: this.loader.getCacheStats()
        };
    }
}

module.exports = TemplateEngine;
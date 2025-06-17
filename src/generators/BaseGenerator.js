/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - AI PROMPT
 * ============================================================================
 * FILE: src/generators/BaseGenerator.js
 * VERSION: 2025-06-17 16:21:39
 * PHASE: Phase 5: Base Generator
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 *
 * Create an abstract base class using ES Module syntax that all specific
 * generators (types, API routes, pages, etc.) will extend. Import
 * EventEmitter and other dependencies using ES Module imports. This class
 * should accept the OpenAPI specification and generator options in its
 * constructor including DaisyUI theme configuration, define an abstract
 * generate() method that subclasses must implement, provide common utility
 * methods like getOperations() to extract all operations from paths,
 * getSchemas() to get all schema definitions, getThemeConfig() to access
 * DaisyUI theme settings, and renderTemplate() to render Handlebars
 * templates with theme context. Include event emission for progress
 * reporting, error handling with context about what was being generated,
 * support for dry-run mode, helper methods for common tasks like creating
 * operation IDs or extracting path parameters, methods to track DaisyUI
 * component usage for reporting, and utilities for determining appropriate
 * DaisyUI components based on operation types. Export as default.
 *
 * ============================================================================
 */
import { EventEmitter } from 'node:events';
import path from 'node:path';
import TemplateEngine from '../templates/TemplateEngine.js';
/**
 * Abstract base class for all generators with DaisyUI support
 * Provides common functionality for code generation from OpenAPI specs
 */
export default class BaseGenerator extends EventEmitter {
    constructor(spec, options = {}) {
        super();

        if (new.target === BaseGenerator) {
            throw new Error('BaseGenerator is an abstract class and cannot be instantiated directly');
        }

        this.spec = spec;
        this.options = {
            outputDir: './generated',
            typescript: true,
            dryRun: false,
            force: false,
            verbose: false,
            templateDir: null,
            // DaisyUI options
            daisyui: true,
            theme: 'light',
            themes: ['light', 'dark', 'cupcake', 'corporate'],
            customTheme: null,
            customThemeContent: null,
            brandingColors: null,
            ...options
        };

        // Initialize template engine
        this.templateEngine = new TemplateEngine({
            templateDir: this.options.templateDir,
            debug: this.options.verbose
        });

        // Track generated files
        this.generatedFiles = [];
        this.errors = [];
        this.warnings = [];

        // Track DaisyUI component usage
        this.daisyuiComponents = new Set();

        // Cache for processed data
        this.cache = new Map();
    }

    /**
     * Abstract method that must be implemented by subclasses
     */
    async generate() {
        throw new Error('generate() method must be implemented by subclass');
    }

    /**
     * Get all operations from the OpenAPI spec
     */
    getOperations() {
        if (this.cache.has('operations')) {
            return this.cache.get('operations');
        }

        const operations = [];

        if (!this.spec.paths) {
            return operations;
        }

        Object.entries(this.spec.paths).forEach(([path, pathItem]) => {
            // HTTP methods
            const methods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'];

            methods.forEach(method => {
                if (pathItem[method]) {
                    const operation = pathItem[method];

                    // Ensure operation has an ID
                    if (!operation.operationId) {
                        operation.operationId = this.generateOperationId(path, method);
                    }

                    operations.push({
                        path,
                        method: method.toUpperCase(),
                        operation,
                        operationId: operation.operationId,
                        tags: operation.tags || [],
                        summary: operation.summary || '',
                        description: operation.description || '',
                        parameters: this.mergeParameters(pathItem.parameters, operation.parameters),
                        requestBody: operation.requestBody,
                        responses: operation.responses || {},
                        security: operation.security || this.spec.security || [],
                        // UI hints
                        uiHints: this.extractUIHints(operation)
                    });
                }
            });
        });

        this.cache.set('operations', operations);
        return operations;
    }

    /**
     * Get all schema definitions from the spec
     */
    getSchemas() {
        if (this.cache.has('schemas')) {
            return this.cache.get('schemas');
        }

        let schemas = {};

        // OpenAPI 3.x
        if (this.spec.components?.schemas) {
            schemas = this.spec.components.schemas;
        }
        // Swagger 2.0
        else if (this.spec.definitions) {
            schemas = this.spec.definitions;
        }

        this.cache.set('schemas', schemas);
        return schemas;
    }

    /**
     * Get theme configuration
     */
    getThemeConfig() {
        return {
            enabled: this.options.daisyui,
            defaultTheme: this.options.theme,
            availableThemes: this.options.themes,
            customTheme: this.options.customTheme,
            customThemeContent: this.options.customThemeContent,
            brandingColors: this.options.brandingColors || this.spec['x-branding']
        };
    }

    /**
     * Render a template with data
     */
    renderTemplate(templatePath, data) {
        try {
            const context = {
                ...data,
                spec: this.spec,
                options: this.options,
                theme: this.getThemeConfig(),
                // Helper data
                info: this.spec.info || {},
                servers: this.spec.servers || [],
                schemas: this.getSchemas(),
                operations: this.getOperations()
            };

            return this.templateEngine.render(templatePath, context);
        } catch (error) {
            this.handleError(`Failed to render template ${templatePath}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Generate operation ID from path and method
     */
    generateOperationId(path, method) {
        // Convert path to camelCase operation ID
        // /users/{userId}/posts -> getUsersPosts
        const pathParts = path
            .split('/')
            .filter(part => part && !part.startsWith('{'))
            .map((part, index) => {
                // First part stays lowercase, rest are capitalized
                if (index === 0) return part;
                return part.charAt(0).toUpperCase() + part.slice(1);
            });

        const baseName = pathParts.join('');
        return method.toLowerCase() + baseName.charAt(0).toUpperCase() + baseName.slice(1);
    }

    /**
     * Extract path parameters from a path
     */
    extractPathParameters(path) {
        const params = [];
        const matches = path.match(/{([^}]+)}/g);

        if (matches) {
            matches.forEach(match => {
                const name = match.slice(1, -1);
                params.push({
                    name,
                    in: 'path',
                    required: true,
                    schema: { type: 'string' }
                });
            });
        }

        return params;
    }

    /**
     * Merge path-level and operation-level parameters
     */
    mergeParameters(pathParams = [], operationParams = []) {
        const merged = [...(pathParams || [])];
        const pathParamNames = merged.map(p => p.name);

        // Add operation parameters that aren't already in path parameters
        (operationParams || []).forEach(param => {
            if (!pathParamNames.includes(param.name)) {
                merged.push(param);
            }
        });

        return merged;
    }

    /**
     * Extract UI hints from operation
     */
    extractUIHints(operation) {
        const hints = {
            component: operation['x-ui-component'],
            icon: operation['x-ui-icon'],
            color: operation['x-ui-color'],
            variant: operation['x-ui-variant'],
            confirm: operation['x-ui-confirm'],
            successMessage: operation['x-ui-success-message'],
            errorMessage: operation['x-ui-error-message'],
            layout: operation['x-ui-layout']
        };

        // Remove undefined values
        Object.keys(hints).forEach(key => {
            if (hints[key] === undefined) {
                delete hints[key];
            }
        });

        return hints;
    }

    /**
     * Get operations grouped by tag
     */
    getOperationsByTag() {
        const operations = this.getOperations();
        const grouped = {};

        operations.forEach(op => {
            const tags = op.tags.length > 0 ? op.tags : ['default'];

            tags.forEach(tag => {
                if (!grouped[tag]) {
                    grouped[tag] = [];
                }
                grouped[tag].push(op);
            });
        });

        return grouped;
    }

    /**
     * Get operations for a specific path
     */
    getOperationsForPath(path) {
        return this.getOperations().filter(op => op.path === path);
    }

    /**
     * Resolve a $ref to get the actual schema
     */
    resolveRef(ref) {
        if (!ref || !ref.startsWith('#/')) {
            return null;
        }

        const parts = ref.split('/').slice(1);
        let current = this.spec;

        for (const part of parts) {
            current = current[part];
            if (!current) return null;
        }

        return current;
    }

    /**
     * Get schema for a reference or inline schema
     */
    getSchema(schemaOrRef) {
        if (!schemaOrRef) return null;

        if (schemaOrRef.$ref) {
            return this.resolveRef(schemaOrRef.$ref);
        }

        return schemaOrRef;
    }

    /**
     * Check if a schema is a simple type
     */
    isSimpleType(schema) {
        const resolved = this.getSchema(schema);
        if (!resolved) return false;

        const simpleTypes = ['string', 'number', 'integer', 'boolean'];
        return simpleTypes.includes(resolved.type) && !resolved.properties && !resolved.items;
    }

    /**
     * Check if a schema is an array
     */
    isArrayType(schema) {
        const resolved = this.getSchema(schema);
        return resolved?.type === 'array';
    }

    /**
     * Check if a schema is an object
     */
    isObjectType(schema) {
        const resolved = this.getSchema(schema);
        return resolved?.type === 'object' || resolved?.properties !== undefined;
    }

    /**
     * Get the name of a schema from a $ref
     */
    getSchemaName(ref) {
        if (!ref || !ref.$ref) return null;
        return ref.$ref.split('/').pop();
    }

    /**
     * Track DaisyUI component usage
     */
    trackDaisyUIComponent(component) {
        this.daisyuiComponents.add(component);
        this.emit('daisyui:component', component);
    }

    /**
     * Determine appropriate DaisyUI component for operation
     */
    getDaisyUIComponentForOperation(operation) {
        const method = operation.method?.toLowerCase();
        const operationId = operation.operationId?.toLowerCase() || '';

        // List operations -> table
        if (method === 'get' && !operation.path.includes('{')) {
            this.trackDaisyUIComponent('table');
            return 'table';
        }

        // Create/Update operations -> form
        if (method === 'post' || method === 'put' || method === 'patch') {
            this.trackDaisyUIComponent('form');
            this.trackDaisyUIComponent('input');
            this.trackDaisyUIComponent('button');
            return 'form';
        }

        // Detail operations -> card
        if (method === 'get' && operation.path.includes('{')) {
            this.trackDaisyUIComponent('card');
            return 'card';
        }

        // Delete operations -> modal
        if (method === 'delete') {
            this.trackDaisyUIComponent('modal');
            this.trackDaisyUIComponent('button');
            return 'modal';
        }

        return null;
    }

    /**
     * Emit progress event
     */
    emitProgress(message, details = {}) {
        this.emit('progress', {
            generator: this.constructor.name,
            message,
            ...details
        });
    }

    /**
     * Handle error
     */
    handleError(message, error = null) {
        const errorInfo = {
            generator: this.constructor.name,
            message,
            error: error?.message || error
        };

        this.errors.push(errorInfo);
        this.emit('error', errorInfo);

        if (this.options.verbose) {
            console.error(`[${this.constructor.name}] Error: ${message}`);
            if (error?.stack) {
                console.error(error.stack);
            }
        }
    }

    /**
     * Add warning
     */
    addWarning(message) {
        const warningInfo = {
            generator: this.constructor.name,
            message
        };

        this.warnings.push(warningInfo);
        this.emit('warning', warningInfo);

        if (this.options.verbose) {
            console.warn(`[${this.constructor.name}] Warning: ${message}`);
        }
    }

    /**
     * Add generated file to tracking
     */
    addGeneratedFile(filePath, content, type = 'unknown') {
        const fileInfo = {
            path: filePath,
            content,
            type,
            generator: this.constructor.name,
            size: content.length,
            daisyui: this.options.daisyui
        };

        this.generatedFiles.push(fileInfo);
        this.emit('file:generated', fileInfo);

        return fileInfo;
    }

    /**
     * Get generation context for templates
     */
    getContext() {
        return {
            spec: this.spec,
            info: this.spec.info || {},
            servers: this.spec.servers || [],
            operations: this.getOperations(),
            schemas: this.getSchemas(),
            options: this.options,
            typescript: this.options.typescript,
            daisyui: this.options.daisyui,
            theme: this.getThemeConfig(),
            projectName: this.getProjectName(),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Get project name from spec
     */
    getProjectName() {
        const title = this.spec.info?.title || 'generated-api';
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }

    /**
     * Check if spec has authentication
     */
    hasAuthentication() {
        return !!(this.spec.components?.securitySchemes || this.spec.securityDefinitions);
    }

    /**
     * Get security schemes
     */
    getSecuritySchemes() {
        return this.spec.components?.securitySchemes || this.spec.securityDefinitions || {};
    }

    /**
     * Clear internal cache
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Get generation summary
     */
    getSummary() {
        return {
            generator: this.constructor.name,
            files: this.generatedFiles.length,
            errors: this.errors.length,
            warnings: this.warnings.length,
            daisyuiComponents: Array.from(this.daisyuiComponents),
            fileTypes: this.generatedFiles.reduce((acc, file) => {
                acc[file.type] = (acc[file.type] || 0) + 1;
                return acc;
            }, {})
        };
    }

    /**
     * Get DaisyUI components summary
     */
    getDaisyUIComponentsSummary() {
        const components = Array.from(this.daisyuiComponents);
        return {
            count: components.length,
            components: components.sort(),
            usage: {
                forms: components.filter(c => ['input', 'select', 'textarea', 'checkbox', 'radio', 'form-control'].includes(c)).length,
                display: components.filter(c => ['card', 'table', 'badge', 'alert'].includes(c)).length,
                navigation: components.filter(c => ['breadcrumbs', 'tabs', 'steps', 'pagination'].includes(c)).length,
                feedback: components.filter(c => ['modal', 'toast', 'loading', 'skeleton'].includes(c)).length,
                actions: components.filter(c => ['btn', 'dropdown', 'swap'].includes(c)).length
            }
        };
    }
}
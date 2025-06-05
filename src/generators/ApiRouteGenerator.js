/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - AI PROMPT
 * ============================================================================
 * FILE: src/generators/ApiRouteGenerator.js
 * VERSION: 2025-05-30 11:34:23
 * PHASE: PHASE 3: Code Generation Engine
 * CATEGORY: 🏗️ Base Generators
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 *
 * Build an intelligent API route generator that:
 * - Generates Next.js 13+ App Router API routes
 * - Implements proper TypeScript typing from OpenAPI schemas
 * - Generates request/response validation using Zod
 * - Implements error handling middleware
 * - Generates authentication guards
 * - Supports file upload handling
 * - Implements rate limiting
 * - Generates API documentation
 * - Supports WebSocket endpoints
 * - Implements request/response logging
 *
 * ============================================================================
 */
const path = require('path');
const BaseGenerator = require('./BaseGenerator');
const GeneratorError = require('../errors/GeneratorError');
const PathUtils = require('../utils/PathUtils');
const SchemaUtils = require('../utils/SchemaUtils');
const StringUtils = require('../utils/StringUtils');
const ValidationUtils = require('../utils/ValidationUtils');


/**
 * Generates Next.js 13+ App Router API routes from OpenAPI specs
 */
class ApiRouteGenerator extends BaseGenerator {
    constructor(options = {}) {
        super({
            ...options,
            templateDir: 'api',
            outputSubdir: 'app/api'
        });

        // Initialize utilities
        this.pathUtils = new PathUtils();
        this.schemaUtils = new SchemaUtils();
        this.stringUtils = new StringUtils();
        this.validationUtils = new ValidationUtils();

        // Route generation options
        this.routeOptions = {
            generateValidation: true,
            generateAuth: true,
            generateRateLimit: true,
            generateDocs: true,
            generateTests: true,
            generateMiddleware: true,
            errorHandling: 'comprehensive',
            logging: 'detailed',
            typescript: true,
            ...options.routeOptions
        };

        // Template configurations
        this.templates = {
            route: null,
            validation: null,
            auth: null,
            middleware: null,
            error: null,
            types: null
        };
    }

    /**
     * Initialize the generator
     */
    async initialize() {
        await super.initialize();
        await this.loadTemplates();
    }

    /**
     * Load API route templates
     */
    async loadTemplates() {
        await this.logger.debug('Loading API route templates');

        // Check if templateLoader exists and has a load method
        if (this.templateLoader && typeof this.templateLoader.load === 'function') {
            // Use templateLoader if available
            this.templates = await this.templateLoader.load('api', {
                baseDir: this.options.templateDir,
                customTemplatesDir: this.options.customTemplatesDir
            });
        } else {
            // Fall back to loading templates directly
            this.logger.debug('TemplateLoader not available, loading templates directly');

            // Load default templates
            this.templates = {
                route: await this.loadDefaultTemplate('route'),
                handler: await this.loadDefaultTemplate('handler'),
                validation: await this.loadDefaultTemplate('validation'),
                types: await this.loadDefaultTemplate('types')
            };
        }

        await this.logger.debug(`Loaded ${Object.keys(this.templates).length} templates`);
    }

    /**
     * Load a default template
     * @private
     */
    async loadDefaultTemplate(templateName) {
        // Return a basic template as fallback
        const templates = {
            route: `
import { NextRequest, NextResponse } from 'next/server';
{{#if imports}}
{{{imports}}}
{{/if}}

{{#if validation}}
{{{validation}}}
{{/if}}

export async function {{method}}(
  request: NextRequest,
  { params }: { params: { [key: string]: string } }
) {
  try {
    {{#if validationSchema}}
    // Validate request
    const validatedData = await {{validationSchema}}.parseAsync({
      body: await request.json(),
      params,
      query: Object.fromEntries(request.nextUrl.searchParams)
    });
    {{/if}}

    // TODO: Implement {{operationId}} handler
    
    return NextResponse.json({ 
      message: '{{summary}}' 
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status || 500 }
    );
  }
}`,
            handler: `// Handler template`,
            validation: `// Validation template`,
            types: `// Types template`
        };

        return templates[templateName] || `// Default ${templateName} template`;
    }

    /**
     * Validate API route generation context
     */
    async doValidate(context) {
        if (!context.swagger) {
            throw new GeneratorError('Swagger specification is required', {
                code: 'MISSING_SWAGGER'
            });
        }

        if (!context.swagger.paths || Object.keys(context.swagger.paths).length === 0) {
            throw new GeneratorError('No API paths found in specification', {
                code: 'NO_PATHS'
            });
        }

        // Use SchemaUtils to extract schemas if not provided
        if (!context.schemas) {
            context.schemas = this.schemaUtils.extractSchemas(context.swagger);
        }

        // Use PathUtils to extract paths if not provided
        if (!context.paths) {
            context.paths = this.pathUtils.extractPaths(context.swagger);
        }
    }

    /**
     * Prepare API route generation context
     */
    async doPrepare(context) {
        return {
            ...context,
            apiConfig: {
                baseUrl: context.swagger.servers?.[0]?.url || '/api',
                version: this._extractApiVersion(context.swagger),
                security: this._extractSecuritySchemes(context.swagger),
                globalHeaders: this._extractGlobalHeaders(context.swagger)
            },
            routeGroups: this._groupRoutesByPath(context.paths),
            sharedTypes: this._extractSharedTypes(context.schemas),
            middleware: this._prepareMiddleware(context)
        };
    }

    /**
     * Generate API routes
     */
    async doGenerate(context) {
        const files = [];

        // Generate shared files first
        files.push(...await this._generateSharedFiles(context));

        // Generate route files
        for (const [routePath, routeGroup] of Object.entries(context.routeGroups)) {
            files.push(...await this._generateRouteFiles(routePath, routeGroup, context));
        }

        // Generate index and documentation
        files.push(...await this._generateIndexFiles(context));

        return files;
    }

    /**
     * Generate shared files (types, middleware, etc.)
     */
    async _generateSharedFiles(context) {
        const files = [];

        // Generate shared types
        if (this.routeOptions.typescript) {
            files.push({
                path: path.join(this.outputDir, 'types.ts'),
                content: await this._renderTemplate(this.templates.types, {
                    types: context.sharedTypes,
                    imports: this._generateTypeImports(context),
                    apiConfig: context.apiConfig
                }),
                options: { overwrite: true }
            });
        }

        // Generate error handler
        files.push({
            path: path.join(this.outputDir, 'error.ts'),
            content: await this._renderTemplate(this.templates.error, {
                errorHandling: this.routeOptions.errorHandling,
                logging: this.routeOptions.logging
            }),
            options: { overwrite: true }
        });

        // Generate auth middleware
        if (this.routeOptions.generateAuth && context.apiConfig.security) {
            files.push({
                path: path.join(this.outputDir, 'auth.ts'),
                content: await this._renderTemplate(this.templates.auth, {
                    security: context.apiConfig.security,
                    typescript: this.routeOptions.typescript
                }),
                options: { overwrite: true }
            });
        }

        // Generate shared middleware
        if (this.routeOptions.generateMiddleware) {
            files.push({
                path: path.join(this.outputDir, 'middleware.ts'),
                content: await this._renderTemplate(this.templates.middleware, {
                    middleware: context.middleware,
                    rateLimit: this.routeOptions.generateRateLimit,
                    logging: this.routeOptions.logging
                }),
                options: { overwrite: true }
            });
        }

        return files;
    }

    /**
     * Generate files for a route group
     */
    async _generateRouteFiles(routePath, routeGroup, context) {
        const files = [];

        // Convert OpenAPI path to Next.js directory structure
        const nextjsPath = this.pathUtils.openApiToNextJs(routePath);
        const routeDir = path.join(this.outputDir, ...nextjsPath);

        // Generate a main route file
        const routeFile = await this._generateRouteFile(routeGroup, context);
        files.push({
            path: path.join(routeDir, 'route.ts'),
            content: routeFile,
            options: { overwrite: true }
        });

        // Generate validation schemas
        if (this.routeOptions.generateValidation && this._hasValidation(routeGroup)) {
            files.push({
                path: path.join(routeDir, 'validation.ts'),
                content: await this._generateValidationFile(routeGroup, context),
                options: { overwrite: true }
            });
        }

        // Generate route-specific types
        if (this.routeOptions.typescript && this._hasRouteTypes(routeGroup)) {
            files.push({
                path: path.join(routeDir, 'types.ts'),
                content: await this._generateRouteTypes(routeGroup, context),
                options: { overwrite: true }
            });
        }

        // Generate tests
        if (this.routeOptions.generateTests) {
            files.push({
                path: path.join(routeDir, 'route.test.ts'),
                content: await this._generateRouteTests(routeGroup, context),
                options: { overwrite: true }
            });
        }

        // Generate API documentation
        if (this.routeOptions.generateDocs) {
            files.push({
                path: path.join(routeDir, 'README.md'),
                content: await this._generateRouteDocs(routeGroup, context),
                options: { overwrite: true }
            });
        }

        return files;
    }

    /**
     * Generate a main route file
     */
    async _generateRouteFile(routeGroup, context) {
        const methods = Object.keys(routeGroup.operations);
        const imports = this._generateRouteImports(routeGroup, context);
        const handlers = {};

        // Generate handler for each HTTP method
        for (const [method, operation] of Object.entries(routeGroup.operations)) {
            handlers[method] = await this._generateMethodHandler(method, operation, context);
        }

        return await this._renderTemplate(this.templates.route, {
            imports,
            methods,
            handlers,
            routePath: routeGroup.path,
            middleware: this._getRouteMiddleware(routeGroup, context),
            errorHandling: this.routeOptions.errorHandling,
            logging: this.routeOptions.logging,
            typescript: this.routeOptions.typescript
        });
    }

    /**
     * Generate method handler
     */
    async _generateMethodHandler(method, operation, context) {
        const handler = {
            method: method.toUpperCase(),
            operationId: operation.operationId,
            summary: operation.summary,
            description: operation.description,
            tags: operation.tags,
            security: this._getOperationSecurity(operation, context),
            parameters: await this._processParameters(operation.parameters, context),
            requestBody: await this._processRequestBody(operation.requestBody, context),
            responses: await this._processResponses(operation.responses, context),
            middleware: this._getOperationMiddleware(operation, context)
        };

        // Add rate limiting if enabled
        if (this.routeOptions.generateRateLimit) {
            handler.rateLimit = this._getRateLimitConfig(operation);
        }

        // Add logging configuration
        if (this.routeOptions.logging) {
            handler.logging = this._getLoggingConfig(operation);
        }

        return handler;
    }

    /**
     * Generate validation file
     */
    async _generateValidationFile(routeGroup, context) {
        const schemas = {};

        for (const [method, operation] of Object.entries(routeGroup.operations)) {
            const validationSchemas = {};

            // Parameter validation schemas
            if (operation.parameters?.length > 0) {
                validationSchemas.params = await this._generateParamSchema(operation.parameters, context);
                validationSchemas.query = await this._generateQuerySchema(operation.parameters, context);
                validationSchemas.headers = await this._generateHeaderSchema(operation.parameters, context);
            }

            // Request body validation schema
            if (operation.requestBody) {
                validationSchemas.body = await this._generateBodySchema(operation.requestBody, context);
            }

            // Response validation schemas
            validationSchemas.responses = await this._generateResponseSchemas(operation.responses, context);

            schemas[method] = validationSchemas;
        }

        return await this._renderTemplate(this.templates.validation, {
            schemas,
            imports: this._generateValidationImports(context),
            typescript: this.routeOptions.typescript
        });
    }

    /**
     * Generate parameter schema
     */
    async _generateParamSchema(parameters, context) {
        const pathParams = parameters.filter(p => p.in === 'path');
        if (pathParams.length === 0) return null;

        const schema = {
            type: 'object',
            properties: {},
            required: []
        };

        for (const param of pathParams) {
            schema.properties[param.name] = param.schema || { type: 'string' };
            if (param.required) {
                schema.required.push(param.name);
            }
        }

        return this.schemaUtils.generateZodSchema(schema);
    }

    /**
     * Generate query schema
     */
    async _generateQuerySchema(parameters, context) {
        const queryParams = parameters.filter(p => p.in === 'query');
        if (queryParams.length === 0) return null;

        const schema = {
            type: 'object',
            properties: {},
            required: []
        };

        for (const param of queryParams) {
            schema.properties[param.name] = param.schema || { type: 'string' };
            if (param.required) {
                schema.required.push(param.name);
            }
        }

        return this.schemaUtils.generateZodSchema(schema);
    }

    /**
     * Generate header schema
     */
    async _generateHeaderSchema(parameters, context) {
        const headerParams = parameters.filter(p => p.in === 'header');
        if (headerParams.length === 0) return null;

        const schema = {
            type: 'object',
            properties: {},
            required: []
        };

        for (const param of headerParams) {
            // Convert header names to lowercase for consistency
            const headerName = param.name.toLowerCase();
            schema.properties[headerName] = param.schema || { type: 'string' };
            if (param.required) {
                schema.required.push(headerName);
            }
        }

        return this.schemaUtils.generateZodSchema(schema);
    }

    /**
     * Generate body schema
     */
    async _generateBodySchema(requestBody, context) {
        if (!requestBody?.content) return null;

        // Prioritize JSON content
        const jsonContent = requestBody.content['application/json'];
        if (jsonContent?.schema) {
            return this.schemaUtils.generateZodSchema(jsonContent.schema);
        }

        // Handle other content types
        const contentTypes = Object.keys(requestBody.content);
        if (contentTypes.length > 0) {
            const firstContent = requestBody.content[contentTypes[0]];
            if (firstContent?.schema) {
                return this.schemaUtils.generateZodSchema(firstContent.schema);
            }
        }

        return null;
    }

    /**
     * Generate response schemas
     */
    async _generateResponseSchemas(responses, context) {
        const schemas = {};

        for (const [statusCode, response] of Object.entries(responses || {})) {
            if (response.content?.['application/json']?.schema) {
                schemas[statusCode] = this.schemaUtils.generateZodSchema(
                    response.content['application/json'].schema
                );
            }
        }

        return schemas;
    }

    /**
     * Generate route-specific types
     */
    async _generateRouteTypes(routeGroup, context) {
        const types = [];

        for (const [method, operation] of Object.entries(routeGroup.operations)) {
            // Request types
            if (operation.parameters?.length > 0) {
                const paramTypes = await this._generateParamTypes(operation, method);
                if (paramTypes) types.push(paramTypes);
            }

            if (operation.requestBody) {
                const requestType = await this._generateRequestBodyType(operation, method);
                if (requestType) types.push(requestType);
            }

            // Response types
            const responseTypes = await this._generateResponseTypes(operation, method);
            types.push(...responseTypes);
        }

        return this._formatTypeDefinitions(types);
    }

    /**
     * Generate route tests
     */
    async _generateRouteTests(routeGroup, context) {
        const testCases = [];

        for (const [method, operation] of Object.entries(routeGroup.operations)) {
            testCases.push({
                method: method.toUpperCase(),
                operationId: operation.operationId,
                description: operation.summary || `Test ${method.toUpperCase()} ${routeGroup.path}`,
                tests: await this._generateTestCases(operation, context)
            });
        }

        return await this._renderTemplate('route.test.ts.template', {
            routePath: routeGroup.path,
            testCases,
            imports: this._generateTestImports(context)
        });
    }

    /**
     * Generate route documentation
     */
    async _generateRouteDocs(routeGroup, context) {
        const sections = [];

        // Route overview
        sections.push({
            title: 'Route Overview',
            content: this._generateRouteOverview(routeGroup)
        });

        // Endpoint documentation
        for (const [method, operation] of Object.entries(routeGroup.operations)) {
            sections.push({
                title: `${method.toUpperCase()} ${routeGroup.path}`,
                content: await this._generateOperationDocs(operation, context)
            });
        }

        // Examples
        sections.push({
            title: 'Examples',
            content: await this._generateExamples(routeGroup, context)
        });

        return await this._renderTemplate('README.md.template', {
            title: `API Route: ${routeGroup.path}`,
            sections
        });
    }

    /**
     * Generate index files
     */
    async _generateIndexFiles(context) {
        const files = [];

        // API index with route listing
        files.push({
            path: path.join(this.outputDir, 'index.ts'),
            content: await this._generateApiIndex(context),
            options: { overwrite: true }
        });

        // API documentation
        if (this.routeOptions.generateDocs) {
            files.push({
                path: path.join(this.outputDir, 'README.md'),
                content: await this._generateApiDocumentation(context),
                options: { overwrite: true }
            });
        }

        return files;
    }

    // ============================================================================
    // Helper Methods
    // ============================================================================

    /**
     *
     * Render template with error handling
     */
    async _renderTemplate(template, data) {
        if (!template) {
            throw new GeneratorError('Template not loaded', {
                code: 'TEMPLATE_NOT_LOADED'
            });
        }

        try {
            if (typeof template === 'string') {
                // If template is a string path, load and render it
                const loadedTemplate = await this.templateEngine.load(template);
                return await loadedTemplate.render(data);
            } else if (template.render) {
                // If a template has a render method, use it
                return await template.render(data);
            } else {
                // Otherwise, use the template engine to render
                return await this.templateEngine.render(template, data);
            }
        } catch (error) {
            throw new GeneratorError('Template rendering failed', {
                code: 'TEMPLATE_RENDER_ERROR',
                template: template.name || 'unknown',
                error: error.message
            });
        }
    }

    /**
     * Register template helpers
     */
    _registerTemplateHelpers() {
        if (!this.templateEngine) return;

        this.templateEngine.registerHelper('httpMethod', (method) => {
            return method.toUpperCase();
        });

        this.templateEngine.registerHelper('routePath', (path) => {
            return this.pathUtils.openApiToNextJs(path).join('/');
        });

        this.templateEngine.registerHelper('zodSchema', (schema) => {
            return this.schemaUtils.generateZodSchema(schema);
        });

        this.templateEngine.registerHelper('tsType', (schema) => {
            return this.schemaUtils.schemaToTypeScript(schema);
        });

        this.templateEngine.registerHelper('camelCase', (str) => {
            return this.stringUtils.toCamelCase(str);
        });

        this.templateEngine.registerHelper('pascalCase', (str) => {
            return this.stringUtils.toPascalCase(str);
        });
    }

    /**
     * Extract an API version from spec
     */
    _extractApiVersion(swagger) {
        return swagger.info?.version || '1.0.0';
    }

    /**
     * Extract security schemes
     */
    _extractSecuritySchemes(swagger) {
        return swagger.components?.securitySchemes || {};
    }

    /**
     * Extract global headers
     */
    _extractGlobalHeaders(swagger) {
        // Extract from global parameters or x-headers extension
        const headers = {};

        if (swagger.components?.parameters) {
            for (const [name, param] of Object.entries(swagger.components.parameters)) {
                if (param.in === 'header') {
                    headers[name] = param;
                }
            }
        }

        return headers;
    }

    /**
     * Group routes by path
     */
    _groupRoutesByPath(paths) {
        const groups = {};

        for (const pathInfo of paths) {
            const { path: routePath, operations } = pathInfo;

            if (!groups[routePath]) {
                groups[routePath] = {
                    path: routePath,
                    operations: {}
                };
            }

            for (const [method, operation] of Object.entries(operations)) {
                groups[routePath].operations[method] = operation;
            }
        }

        return groups;
    }

    /**
     * Extract shared types
     */
    _extractSharedTypes(schemas) {
        // Extract types that are used across multiple routes
        const sharedTypes = {};
        const usageCount = {};

        // Count usage
        for (const [name, schema] of Object.entries(schemas)) {
            const refs = this.schemaUtils.findReferences(schema);
            for (const ref of refs) {
                usageCount[ref] = (usageCount[ref] || 0) + 1;
            }
        }

        // Extract types used more than once
        for (const [name, schema] of Object.entries(schemas)) {
            if (usageCount[`#/components/schemas/${name}`] > 1) {
                sharedTypes[name] = schema;
            }
        }

        return sharedTypes;
    }

    /**
     * Prepare middleware configuration
     */
    _prepareMiddleware(context) {
        const middleware = [];

        // CORS middleware
        middleware.push({
            name: 'cors',
            config: {
                origin: context.options?.cors?.origin || '*',
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
                allowedHeaders: ['Content-Type', 'Authorization'],
                credentials: true
            }
        });

        // Rate limiting
        if (this.routeOptions.generateRateLimit) {
            middleware.push({
                name: 'rateLimit',
                config: {
                    windowMs: 15 * 60 * 1000, // 15 minutes
                    max: 100 // limit each IP to 100 requests per windowMs
                }
            });
        }

        // Request logging
        if (this.routeOptions.logging) {
            middleware.push({
                name: 'logging',
                config: {
                    level: 'info',
                    excludePaths: ['/health', '/metrics']
                }
            });
        }

        return middleware;
    }

    /**
     * Check if a route group has validation
     */
    _hasValidation(routeGroup) {
        for (const operation of Object.values(routeGroup.operations)) {
            if (operation.parameters?.length > 0 || operation.requestBody) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if a route group has specific types
     */
    _hasRouteTypes(routeGroup) {
        for (const operation of Object.values(routeGroup.operations)) {
            if (operation.requestBody || operation.responses) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get operation security requirements
     */
    _getOperationSecurity(operation, context) {
        return operation.security || context.swagger.security || [];
    }

    /**
     * Get operation-specific middleware
     */
    _getOperationMiddleware(operation, context) {
        const middleware = [];

        // Authentication middleware
        if (operation.security?.length > 0) {
            middleware.push('authenticate');
        }

        // Custom middleware from extensions
        if (operation['x-middleware']) {
            middleware.push(...operation['x-middleware']);
        }

        return middleware;
    }

    /**
     * Get rate limit configuration
     */
    _getRateLimitConfig(operation) {
        // Check for custom rate limit in extensions
        if (operation['x-rate-limit']) {
            return operation['x-rate-limit'];
        }

        // Default based on an operation type
        const operationId = operation.operationId?.toLowerCase() || '';

        if (operationId.includes('create') || operationId.includes('update')) {
            return { windowMs: 60000, max: 10 }; // Stricter for mutations
        }

        return { windowMs: 60000, max: 100 }; // Default
    }

    /**
     * Get logging configuration
     */
    _getLoggingConfig(operation) {
        return {
            logRequest: true,
            logResponse: true,
            logErrors: true,
            sensitiveFields: ['password', 'token', 'secret', 'authorization']
        };
    }

    /**
     * Process parameters
     */
    async _processParameters(parameters = [], context) {
        const processed = {
            path: {},
            query: {},
            header: {},
            cookie: {}
        };

        for (const param of parameters) {
            const paramData = {
                name: param.name,
                description: param.description,
                required: param.required,
                schema: param.schema,
                example: param.example
            };

            if (processed[param.in]) {
                processed[param.in][param.name] = paramData;
            }
        }

        return processed;
    }

    /**
     * Process request body
     */
    async _processRequestBody(requestBody, context) {
        if (!requestBody) return null;

        return {
            description: requestBody.description,
            required: requestBody.required,
            content: requestBody.content,
            examples: this._extractExamples(requestBody)
        };
    }

    /**
     * Process responses
     */
    async _processResponses(responses, context) {
        const processed = {};

        for (const [statusCode, response] of Object.entries(responses || {})) {
            processed[statusCode] = {
                description: response.description,
                content: response.content,
                headers: response.headers,
                examples: this._extractExamples(response)
            };
        }

        return processed;
    }

    /**
     * Extract examples from request/response
     */
    _extractExamples(obj) {
        const examples = [];

        if (obj.content) {
            for (const [contentType, content] of Object.entries(obj.content)) {
                if (content.example) {
                    examples.push({
                        contentType,
                        value: content.example
                    });
                }
                if (content.examples) {
                    for (const [name, example] of Object.entries(content.examples)) {
                        examples.push({
                            contentType,
                            name,
                            value: example.value
                        });
                    }
                }
            }
        }

        return examples;
    }

    /**
     * Generate route imports
     */
    _generateRouteImports(routeGroup, context) {
        const imports = [];

        // Next.js imports
        imports.push({
            from: 'next',
            items: ['NextRequest', 'NextResponse']
        });

        // Validation imports
        if (this._hasValidation(routeGroup)) {
            imports.push({
                from: './validation',
                items: ['schemas']
            });
        }

        // Auth imports
        if (this._hasAuth(routeGroup)) {
            imports.push({
                from: '../auth',
                items: ['authenticate', 'authorize']
            });
        }

        // Middleware imports
        imports.push({
            from: '../middleware',
            items: ['withMiddleware', 'errorHandler']
        });

        // Type imports
        if (this.routeOptions.typescript) {
            imports.push({
                from: './types',
                items: ['*'],
                as: 'Types'
            });
        }

        return imports;
    }

    /**
     * Check if route has authentication
     */
    _hasAuth(routeGroup) {
        for (const operation of Object.values(routeGroup.operations)) {
            if (operation.security?.length > 0) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get route middleware configuration
     */
    _getRouteMiddleware(routeGroup, context) {
        const middleware = [];

        // Error handling middleware
        middleware.push('errorHandler');

        // Logging middleware
        if (this.routeOptions.logging) {
            middleware.push('requestLogger');
        }

        // CORS middleware
        middleware.push('cors');

        // Rate limiting
        if (this.routeOptions.generateRateLimit) {
            middleware.push('rateLimit');
        }

        return middleware;
    }

    /**
     * Generate type imports
     */
    _generateTypeImports(context) {
        const imports = [];

        // Zod for runtime validation
        imports.push({
            from: 'zod',
            items: ['z']
        });

        // Shared types
        if (context.sharedTypes) {
            imports.push({
                from: '../types',
                items: Object.keys(context.sharedTypes)
            });
        }

        return imports;
    }

    /**
     * Generate validation imports
     */
    _generateValidationImports(context) {
        return [
            { from: 'zod', items: ['z'] },
            { from: '../types', items: ['*'], as: 'Types' }
        ];
    }

    /**
     * Generate test imports
     */
    _generateTestImports(context) {
        return [
            { from: '@jest/globals', items: ['describe', 'it', 'expect', 'beforeAll', 'afterAll'] },
            { from: 'supertest', items: ['default'], as: 'request' },
            { from: './route', items: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] }
        ];
    }

    /**
     * Generate parameter types
     */
    async _generateParamTypes(operation, method) {
        const typeName = `${this.stringUtils.toPascalCase(operation.operationId || method)}Params`;
        const properties = {};

        for (const param of operation.parameters || []) {
            if (param.in === 'path' || param.in === 'query') {
                properties[param.name] = this.schemaUtils.schemaToTypeScript(param.schema || { type: 'string' });
            }
        }

        if (Object.keys(properties).length === 0) return null;

        return {
            name: typeName,
            type: 'interface',
            properties
        };
    }

    /**
     * Generate request body type
     */
    async _generateRequestBodyType(operation, method) {
        const typeName = `${this.stringUtils.toPascalCase(operation.operationId || method)}Request`;
        const content = operation.requestBody?.content?.['application/json'];

        if (!content?.schema) {
            return null;
        }

        return {
            name: typeName,
            type: 'type',
            definition: this.schemaUtils.schemaToTypeScript(content.schema)
        };
    }

    /**
     * Generate response types
     */
    async _generateResponseTypes(operation, method) {
        const types = [];
        const baseTypeName = `${this.stringUtils.toPascalCase(operation.operationId || method)}Response`;

        for (const [statusCode, response] of Object.entries(operation.responses || {})) {
            const content = response.content?.['application/json'];
            if (content?.schema) {
                types.push({
                    name: `${baseTypeName}${statusCode}`,
                    type: 'type',
                    definition: this.schemaUtils.schemaToTypeScript(content.schema)
                });
            }
        }

        // Union type for all responses
        if (types.length > 0) {
            types.push({
                name: baseTypeName,
                type: 'type',
                definition: types.map(t => t.name).join(' | ')
            });
        }

        return types;
    }

    /**
     * Format type definitions
     */
    _formatTypeDefinitions(types) {
        const lines = [];

        for (const type of types) {
            if (type.type === 'interface') {
                lines.push(`export interface ${type.name} {`);
                for (const [key, value] of Object.entries(type.properties || {})) {
                    lines.push(`  ${key}: ${value};`);
                }
                lines.push('}');
            } else if (type.type === 'type') {
                lines.push(`export type ${type.name} = ${type.definition};`);
            }
            lines.push('');
        }

        return lines.join('\n');
    }

    /**
     * Generate test cases
     */
    async _generateTestCases(operation, context) {
        const testCases = [];

        // Success case
        testCases.push({
            name: 'should return success response',
            type: 'success',
            request: this._generateTestRequest(operation, 'success'),
            expectedStatus: 200,
            expectedResponse: this._generateTestResponse(operation, '200')
        });

        // Validation error case
        if (operation.parameters?.some(p => p.required) || operation.requestBody?.required) {
            testCases.push({
                name: 'should return validation error for invalid input',
                type: 'validation',
                request: this._generateTestRequest(operation, 'invalid'),
                expectedStatus: 400,
                expectedResponse: { error: 'Validation failed' }
            });
        }

        // Auth error case
        if (operation.security?.length > 0) {
            testCases.push({
                name: 'should return unauthorized without auth',
                type: 'auth',
                request: this._generateTestRequest(operation, 'noauth'),
                expectedStatus: 401,
                expectedResponse: { error: 'Unauthorized' }
            });
        }

        return testCases;
    }

    /**
     * Generate test request
     */
    _generateTestRequest(operation, scenario) {
        const request = {
            headers: {},
            params: {},
            query: {},
            body: null
        };

        // Add test data based on a scenario
        switch (scenario) {
            case 'success':
                // Add valid test data
                for (const param of operation.parameters || []) {
                    const value = this._generateTestValue(param.schema);
                    if (param.in === 'path') {
                        request.params[param.name] = value;
                    } else if (param.in === 'query') {
                        request.query[param.name] = value;
                    } else if (param.in === 'header') {
                        request.headers[param.name] = value;
                    }
                }

                if (operation.requestBody?.content?.['application/json']) {
                    request.body = this._generateTestData(
                        operation.requestBody.content['application/json'].schema
                    );
                }
                break;

            case 'invalid':
                // Add invalid test data
                if (operation.requestBody?.required) {
                    request.body = { invalid: 'data' };
                }
                break;

            case 'noauth':
                // Don't add auth headers
                break;
        }

        return request;
    }

    /**
     * Generate test response
     */
    _generateTestResponse(operation, statusCode) {
        const response = operation.responses?.[statusCode];
        if (!response?.content?.['application/json']?.schema) {
            return {};
        }

        return this._generateTestData(response.content['application/json'].schema);
    }

    /**
     * Generate test value for schema
     */
    _generateTestValue(schema) {
        if (!schema) return 'test';

        switch (schema.type) {
            case 'string':
                return 'test-string';
            case 'number':
            case 'integer':
                return 123;
            case 'boolean':
                return true;
            case 'array':
                return [];
            case 'object':
                return {};
            default:
                return 'test';
        }
    }

    /**
     * Generate test data for schema
     */
    _generateTestData(schema) {
        if (!schema) return {};

        if (schema.example) {
            return schema.example;
        }

        if (schema.type === 'object' && schema.properties) {
            const data = {};
            for (const [key, propSchema] of Object.entries(schema.properties)) {
                data[key] = this._generateTestValue(propSchema);
            }
            return data;
        }

        return this._generateTestValue(schema);
    }

    /**
     * Generate route overview
     */
    _generateRouteOverview(routeGroup) {
        const methods = Object.keys(routeGroup.operations);
        return `This route supports the following HTTP methods: ${methods.join(', ').toUpperCase()}`;
    }

    /**
     * Generate operation documentation
     */
    async _generateOperationDocs(operation, context) {
        const sections = [];

        // Description
        if (operation.description) {
            sections.push(`**Description:** ${operation.description}`);
        }

        // Parameters
        if (operation.parameters?.length > 0) {
            sections.push('**Parameters:**');
            for (const param of operation.parameters) {
                sections.push(`- \`${param.name}\` (${param.in}): ${param.description || 'No description'}`);
            }
        }

        // Request body
        if (operation.requestBody) {
            sections.push('**Request Body:**');
            sections.push(operation.requestBody.description || 'Request body required');
        }

        // Responses
        sections.push('**Responses:**');
        for (const [code, response] of Object.entries(operation.responses || {})) {
            sections.push(`- \`${code}\`: ${response.description}`);
        }

        return sections.join('\n\n');
    }

    /**
     * Generate examples
     */
    async _generateExamples(routeGroup, context) {
        const examples = [];

        for (const [method, operation] of Object.entries(routeGroup.operations)) {
            const example = {
                method: method.toUpperCase(),
                path: routeGroup.path,
                description: operation.summary
            };

            // Request example
            if (operation.requestBody?.content?.['application/json']?.example) {
                example.request = {
                    body: operation.requestBody.content['application/json'].example
                };
            }

            // Response example
            const successResponse = operation.responses?.['200'] || operation.responses?.['201'];
            if (successResponse?.content?.['application/json']?.example) {
                example.response = successResponse.content['application/json'].example;
            }

            examples.push(example);
        }

        return examples.map(ex =>
            `### ${ex.method} ${ex.path}\n\n` +
            (ex.request ? `**Request:**\n\`\`\`json\n${JSON.stringify(ex.request.body, null, 2)}\n\`\`\`\n\n` : '') +
            (ex.response ? `**Response:**\n\`\`\`json\n${JSON.stringify(ex.response, null, 2)}\n\`\`\`\n` : '')
        ).join('\n');
    }

    /**
     * Generate API index
     */
    async _generateApiIndex(context) {
        const routes = [];

        for (const [path, group] of Object.entries(context.routeGroups)) {
            for (const method of Object.keys(group.operations)) {
                routes.push({
                    method: method.toUpperCase(),
                    path: path,
                    nextjsPath: this.pathUtils.openApiToNextJs(path).join('/')
                });
            }
        }

        return await this._renderTemplate('index.ts.template', {
            routes,
            apiConfig: context.apiConfig
        });
    }

    /**
     * Generate API documentation
     */
    async _generateApiDocumentation(context) {
        const sections = [];

        // API overview
        sections.push({
            title: 'API Overview',
            content: this._generateApiOverview(context)
        });

        // Authentication
        if (context.apiConfig.security) {
            sections.push({
                title: 'Authentication',
                content: this._generateAuthDocs(context.apiConfig.security)
            });
        }

        // Endpoints
        sections.push({
            title: 'Endpoints',
            content: this._generateEndpointList(context)
        });

        // Common responses
        sections.push({
            title: 'Common Responses',
            content: this._generateCommonResponseDocs()
        });

        return await this._renderTemplate('README.md.template', {
            title: context.swagger.info?.title || 'API Documentation',
            version: context.apiConfig.version,
            sections
        });
    }

    /**
     * Generate API overview
     */
    _generateApiOverview(context) {
        return context.swagger.info?.description || 'Generated API from OpenAPI specification';
    }

    /**
     * Generate auth documentation
     */
    _generateAuthDocs(security) {
        const docs = [];

        for (const [name, scheme] of Object.entries(security)) {
            docs.push(`### ${name}`);
            docs.push(`- **Type:** ${scheme.type}`);
            if (scheme.scheme) {
                docs.push(`- **Scheme:** ${scheme.scheme}`);
            }
            if (scheme.description) {
                docs.push(`- **Description:** ${scheme.description}`);
            }
        }

        return docs.join('\n');
    }

    /**
     * Generate endpoint list
     */
    _generateEndpointList(context) {
        const endpoints = [];

        for (const [path, group] of Object.entries(context.routeGroups)) {
            for (const [method, operation] of Object.entries(group.operations)) {
                endpoints.push(
                    `- **${method.toUpperCase()} ${path}** - ${operation.summary || 'No description'}`
                );
            }
        }

        return endpoints.join('\n');
    }

    /**
     * Generate common response documentation
     */
    _generateCommonResponseDocs() {
        return `
- \`200 OK\` - Request succeeded
- \`201 Created\` - Resource created successfully
- \`400 Bad Request\` - Invalid request data
- \`401 Unauthorized\` - Authentication required
- \`403 Forbidden\` - Insufficient permissions
- \`404 Not Found\` - Resource not found
- \`422 Unprocessable Entity\` - Validation failed
- \`429 Too Many Requests\` - Rate limit exceeded
- \`500 Internal Server Error\` - Server error
    `.trim();
    }
}

module.exports = ApiRouteGenerator;
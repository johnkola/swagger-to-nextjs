/**
 * ===AI PROMPT ==============================================================
 * FILE: src/generators/ApiRouteGenerator.js
 * VERSION: 2025-05-25 13:22:11
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 * Build a generator class that creates NextJS App Router API routes from
 * OpenAPI paths. Generate route handlers with proper TypeScript types,
 * validation middleware, and error handling.
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
 * FILE: src/generators/ApiRouteGenerator.js
 *
 * AI PROMPT FOR CODE REVIEW/ENHANCEMENT:
 * =====================================
 *
 * You are reviewing the API route generator that creates Next.js 13+ App Router API routes
 * from OpenAPI specifications. This generator produces production-ready TypeScript API handlers
 * with comprehensive error handling, validation, and integration with OpenAPI generated clients.
 *
 * RESPONSIBILITIES:
 * - Generate Next.js API route handlers (route.ts files) for each OpenAPI path
 * - Create method-specific handlers (GET, POST, PUT, DELETE, etc.)
 * - Generate Zod validation schemas from OpenAPI parameter definitions
 * - Integrate with OpenAPI generated TypeScript client and models
 * - Produce comprehensive AI prompts for further code completion
 * - Handle complex parameter extraction (path, query, body)
 * - Generate proper error handling with appropriate HTTP status codes
 *
 * TECHNICAL FEATURES:
 * - Template-based code generation with dynamic content insertion
 * - OpenAPI schema analysis for automatic type discovery
 * - Validation schema generation with Zod integration
 * - API client integration with proper import management
 * - Comprehensive error handling patterns
 * - AI-assisted code completion prompts
 *
 * REVIEW FOCUS:
 * - Code generation accuracy and completeness
 * - TypeScript type safety and integration
 * - Error handling robustness and user experience
 * - Template system efficiency and maintainability
 * - OpenAPI specification compliance and edge case handling
 */

const BaseGenerator = require('./BaseGenerator');
const TemplateEngine = require('../templates/TemplateEngine');

class ApiRouteGenerator extends BaseGenerator {
    constructor() {
        super();
        this.templateEngine = new TemplateEngine();
    }

    /**
     * Generate API routes for all paths in the Swagger document
     */
    async generateRoutes(swaggerDoc, directoryManager) {
        this.resetStats();

        if (!swaggerDoc.paths) {
            console.error('❌ No paths found in Swagger document');
            return this.getStats();
        }

        const paths = swaggerDoc.paths;
        console.log(`🔧 Generating API routes for ${Object.keys(paths).length} paths...`);

        for (const [routePath, pathItem] of Object.entries(paths)) {
            try {
                await this.generateRoute(routePath, pathItem, swaggerDoc, directoryManager);
                this.recordSuccess();
            } catch (error) {
                this.logError(`Failed to generate route for ${routePath}`, error);
                this.recordFailure(`${routePath}: ${error.message}`);
            }
        }

        console.log(`✅ API route generation completed: ${this.stats.generated} generated, ${this.stats.failed} failed\n`);
        return this.getStats();
    }

    /**
     * Generate a single API route
     */
    async generateRoute(routePath, pathItem, swaggerDoc, directoryManager) {
        const methods = this.getHttpMethods(pathItem);

        if (methods.length === 0) {
            this.logWarning(`No HTTP methods found for path: ${routePath}`);
            return;
        }

        // Generate route content
        const content = await this.generateRouteContent(routePath, pathItem, methods, swaggerDoc);

        // Write to file
        const filePath = directoryManager.getApiRouteFilePath(routePath);
        const success = directoryManager.writeFile(filePath, content, `API route ${routePath}`);

        if (!success) {
            throw new Error(`Failed to write API route file: ${filePath}`);
        }
    }

    /**
     * Generate the complete API route file content
     */
    async generateRouteContent(routePath, pathItem, methods, swaggerDoc) {
        // Extract operations for all methods
        const operations = this.extractOperations(pathItem, methods);

        // Find relevant schemas for imports
        const relevantSchemas = this.findRelevantSchemas(operations);

        // Generate validation schemas
        const validationSchemas = this.generateValidationSchemas(operations, methods);

        // Prepare template data
        const templateData = {
            routePath,
            methods,
            operations,
            relevantSchemas,
            validationSchemas,
            apiClassName: this.generateApiClassName(this.getLastPathSegment(routePath)),
            pathParams: this.extractPathParameters(routePath),
            hasRequestBody: methods.some(method => operations[method]?.requestBody),
            hasQueryParams: methods.some(method =>
                operations[method]?.parameters?.some(p => p.in === 'query')
            ),
            hasPathParams: this.extractPathParameters(routePath).length > 0,
            swaggerDoc,
            aiPromptData: this.generateAIPromptData(routePath, methods, operations, swaggerDoc)
        };

        // Use template engine to generate content
        return await this.templateEngine.render('api/route.ts.template', templateData);
    }

    /**
     * Generate validation schemas for operations
     */
    generateValidationSchemas(operations, methods) {
        const schemas = {};

        methods.forEach(method => {
            const operation = operations[method];

            // Generate query parameter schema
            if (operation.parameters?.length > 0) {
                const queryParams = operation.parameters.filter(param => param.in === 'query');
                if (queryParams.length > 0) {
                    schemas[`${method.toLowerCase()}QuerySchema`] = {
                        name: `${method.toLowerCase()}QuerySchema`,
                        type: 'query',
                        fields: queryParams.map(param => ({
                            name: param.name,
                            zodType: this.getZodTypeFromSchema(param.schema),
                            optional: !param.required,
                            description: param.description || 'No description'
                        }))
                    };
                }
            }

            // Generate request body schema
            if (operation.requestBody) {
                schemas[`${method.toLowerCase()}BodySchema`] = {
                    name: `${method.toLowerCase()}BodySchema`,
                    type: 'body',
                    description: operation.requestBody.description || 'Request body schema',
                    contentTypes: Object.keys(operation.requestBody.content || {}),
                    // Simplified for now - could be expanded based on actual schema
                    fields: []
                };
            }
        });

        return schemas;
    }

    /**
     * Generate AI prompt data for code completion
     */
    generateAIPromptData(routePath, methods, operations, swaggerDoc) {
        return {
            routeInfo: {
                path: routePath,
                methods: methods.join(', '),
                framework: 'Next.js 13+ App Router',
                typescript: true
            },
            methodRequirements: this.buildMethodRequirements(operations, methods),
            implementationRequirements: this.getImplementationRequirements(),
            availableSchemas: this.getAvailableSchemas(swaggerDoc),
            examplePatterns: this.getExamplePatterns(),
            databaseServices: this.getDatabaseServicesInfo()
        };
    }

    /**
     * Build method-specific requirements for AI prompt
     */
    buildMethodRequirements(operations, methods) {
        return methods.map(method => {
            const operation = operations[method];
            return {
                method,
                summary: operation.summary || 'Not specified',
                description: operation.description || 'Not specified',
                parameters: operation.parameters?.map(param => ({
                    name: param.name,
                    location: param.in,
                    type: param.schema?.type || 'unknown',
                    required: param.required || false,
                    description: param.description || 'No description',
                    allowedValues: param.schema?.enum || null
                })) || [],
                requestBody: operation.requestBody ? {
                    required: operation.requestBody.required || false,
                    description: operation.requestBody.description || 'Request body required',
                    contentTypes: Object.keys(operation.requestBody.content || {})
                } : null,
                responses: Object.entries(operation.responses || {}).map(([code, response]) => ({
                    code,
                    description: response.description || 'No description',
                    contentTypes: Object.keys(response.content || {})
                }))
            };
        });
    }

    /**
     * Get implementation requirements for AI prompt
     */
    getImplementationRequirements() {
        return [
            'Use Next.js 13+ App Router API route format',
            'Implement proper TypeScript types',
            'Add comprehensive error handling',
            'Validate request parameters and body',
            'Return appropriate HTTP status codes',
            'Follow RESTful conventions',
            'Add proper CORS headers if needed',
            'Implement authentication/authorization if required',
            'Add request logging for debugging',
            'Use environment variables for configuration'
        ];
    }

    /**
     * Get available schemas from Swagger document
     */
    getAvailableSchemas(swaggerDoc) {
        const schemas = swaggerDoc.components?.schemas || swaggerDoc.definitions || {};
        return Object.keys(schemas).slice(0, 10).map(schemaName => ({
            name: schemaName,
            schema: this.sanitizeJsonForComment(schemas[schemaName], 2)
        }));
    }

    /**
     * Get example patterns for AI prompt
     */
    getExamplePatterns() {
        return [
            'Use try-catch blocks for error handling',
            'Validate input using Zod or similar',
            'Return NextResponse.json() for all responses',
            'Extract path/query parameters properly',
            'Handle different content types appropriately'
        ];
    }

    /**
     * Get database/services information for AI prompt
     */
    getDatabaseServicesInfo() {
        return [
            'Assume you have access to a database connection',
            'Use async/await for database operations',
            'Implement proper connection pooling',
            'Handle database errors gracefully'
        ];
    }

    /**
     * Get last path segment for API class name generation
     */
    getLastPathSegment(routePath) {
        const segments = routePath.split('/').filter(segment =>
            segment && !segment.startsWith('{')
        );
        return segments.length > 0 ? segments[segments.length - 1] : 'default';
    }

    /**
     * Generate fallback content when template fails
     */
    generateFallbackContent(routePath, pathItem, methods, swaggerDoc) {
        const operations = this.extractOperations(pathItem, methods);
        const relevantSchemas = this.findRelevantSchemas(operations);

        let content = `/**\n`;
        content += ` * AI PROMPT FOR CODE GENERATION:\n`;
        content += ` * ================================\n`;
        content += ` * \n`;
        content += ` * You are a Next.js API developer. Generate a complete implementation for this API route.\n`;
        content += ` * \n`;
        content += ` * ROUTE INFORMATION:\n`;
        content += ` * - Path: ${routePath}\n`;
        content += ` * - Methods: ${methods.join(', ')}\n`;
        content += ` * - Framework: Next.js 13+ App Router\n`;
        content += ` * - TypeScript: Yes\n`;
        content += ` * \n`;
        content += ` * GENERATE: Complete, production-ready code with all necessary imports, types, and logic.\n`;
        content += ` */\n\n`;

        content += `// API Route: ${routePath}\n`;
        content += `// Generated from Swagger/OpenAPI specification\n`;
        content += `// Methods: ${methods.join(', ')}\n\n`;

        content += `import { NextRequest, NextResponse } from 'next/server';\n`;
        content += `import { z } from 'zod';\n`;

        if (relevantSchemas.length > 0) {
            content += this.generateModelImports(relevantSchemas);
        }

        content += this.generateApiClientImports(routePath);
        content += `\n`;

        // Generate basic handlers
        methods.forEach(method => {
            content += `export async function ${method}(request: NextRequest) {\n`;
            content += `  try {\n`;
            content += `    // TODO: Implement ${method} ${routePath}\n`;
            content += `    return NextResponse.json({ message: '${method} ${routePath} - Implementation needed' });\n`;
            content += `  } catch (error) {\n`;
            content += `    console.error('Error in ${method} ${routePath}:', error);\n`;
            content += `    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });\n`;
            content += `  }\n`;
            content += `}\n\n`;
        });

        return content;
    }
}

module.exports = ApiRouteGenerator;
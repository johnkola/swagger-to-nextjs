/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - AI PROMPT
 * ============================================================================
 * FILE: src/generators/ApiRouteGenerator.js
 * VERSION: 2025-06-17 21:42:10
 * PHASE: Phase 6: Main Code Generators
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 *
 * Create a generator class using ES Module syntax that produces Next.js 14
 * App Router API route handlers by rendering the
 * templates/api/[...route].ts.hbs template for each API path using
 * TemplateEngine. Import BaseGenerator and utilities using ES Module
 * imports. For each path in the OpenAPI spec, convert OpenAPI paths like
 * /pets/{id} to file paths like app/api/pets/[id]/route.ts, prepare
 * template context with all operations, methods, parameters, schemas, and
 * error responses for that path, use TemplateEngine.render() with the
 * [...route].ts.hbs template to generate the route handler code, write each
 * rendered file to the appropriate app/api directory structure using
 * FileWriter, let the template handle all Next.js route handler code
 * generation including TypeScript types, request parsing, and error
 * handling, and never write route handler code in JavaScript. Export as
 * default.
 *
 * ============================================================================
 */
import BaseGenerator from './BaseGenerator.js';
import { pathToRoute, extractPathParams, routeToFilePath } from '../utils/PathUtils.js';
import { toPascalCase, toCamelCase } from '../utils/StringUtils.js';
import path from 'path';
export default class ApiRouteGenerator extends BaseGenerator {
    constructor(spec, options) {
        super(spec, options);
        this.generatedRoutes = new Map();
    }
    async generate() {
        this.emit('progress', { step: 'api-routes', message: 'Generating API route handlers...' });
        const paths = this.spec.paths || {};
        const results = [];

        // Group paths by resource
        const groupedPaths = this.groupPathsByResource(paths);

        for (const [resource, resourcePaths] of groupedPaths.entries()) {
            try {
                const result = await this.generateResourceRoutes(resource, resourcePaths);
                results.push(result);
            } catch (error) {
                this.emit('warning', `Failed to generate routes for ${resource}: ${error.message}`);
            }
        }

        this.emit('progress', {
            step: 'api-routes',
            message: `Generated ${results.length} API route files`,
            completed: true
        });

        return {
            files: results,
            totalRoutes: results.reduce((sum, r) => sum + r.methods.length, 0)
        };
    }

    groupPathsByResource(paths) {
        const grouped = new Map();

        for (const [pathStr, pathObj] of Object.entries(paths)) {
            const resource = this.extractResource(pathStr);
            if (!grouped.has(resource)) {
                grouped.set(resource, new Map());
            }
            grouped.get(resource).set(pathStr, pathObj);
        }

        return grouped;
    }

    extractResource(pathStr) {
        // Extract the base resource from path like /users/{id}/posts -> users
        const segments = pathStr.split('/').filter(Boolean);
        return segments[0] || 'root';
    }

    async generateResourceRoutes(resource, paths) {
        const operations = [];
        const imports = new Set();
        const dynamicSegments = new Set();

        // Analyze all paths for this resource
        for (const [pathStr, pathObj] of paths.entries()) {
            const pathParams = extractPathParams(pathStr);
            pathParams.forEach(param => dynamicSegments.add(param));

            for (const [method, operation] of Object.entries(pathObj)) {
                if (['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
                    const op = this.prepareOperation(method, pathStr, operation);
                    operations.push(op);

                    // Collect type imports
                    if (operation.requestBody) {
                        const schemaRef = this.extractSchemaRef(operation.requestBody);
                        if (schemaRef) imports.add(schemaRef);
                    }
                    if (operation.responses?.['200'] || operation.responses?.['201']) {
                        const response = operation.responses['200'] || operation.responses['201'];
                        const schemaRef = this.extractSchemaRef(response);
                        if (schemaRef) imports.add(schemaRef);
                    }
                }
            }
        }

        // Determine the file path
        const routePath = this.determineRoutePath(resource, paths, dynamicSegments);

        // Render the route file
        const content = await this.renderTemplate('api/[...route].ts', {
            resource,
            operations,
            imports: Array.from(imports),
            dynamicSegments: Array.from(dynamicSegments),
            hasGet: operations.some(op => op.method === 'GET'),
            hasPost: operations.some(op => op.method === 'POST'),
            hasPut: operations.some(op => op.method === 'PUT'),
            hasDelete: operations.some(op => op.method === 'DELETE'),
            hasPatch: operations.some(op => op.method === 'PATCH'),
            spec: this.spec
        });

        const outputPath = path.join(this.options.output, 'app', 'api', routePath, 'route.ts');

        if (!this.options.dryRun) {
            await this.fileWriter.writeFile(outputPath, content);
        }

        return {
            file: outputPath,
            resource,
            methods: operations.map(op => op.method),
            dynamicSegments: Array.from(dynamicSegments)
        };
    }

    prepareOperation(method, pathStr, operation) {
        const operationId = operation.operationId || this.generateOperationId(method, pathStr);
        const successStatus = this.getSuccessStatus(method);
        const parameters = this.extractParameters(operation, pathStr);
        const validation = this.generateValidation(operation, parameters);

        return {
            method: method.toUpperCase(),
            operationId,
            summary: operation.summary || `${method.toUpperCase()} ${pathStr}`,
            description: operation.description,
            path: pathStr,
            parameters,
            hasBody: !!operation.requestBody,
            requestBody: this.processRequestBody(operation.requestBody),
            responses: this.processResponses(operation.responses),
            successStatus,
            validation,
            security: operation.security || this.spec.security,
            deprecated: operation.deprecated || false,
            tags: operation.tags || []
        };
    }

    determineRoutePath(resource, paths, dynamicSegments) {
        // Find the most common path pattern
        const pathPatterns = Array.from(paths.keys());

        // If we have dynamic segments, create appropriate Next.js dynamic routes
        if (dynamicSegments.size > 0) {
            // For paths like /users/{userId}/posts/{postId}
            // Generate: users/[userId]/posts/[postId]
            const firstPath = pathPatterns[0];
            return pathToRoute(firstPath).slice(1); // Remove leading slash
        }

        // For simple resources, just use the resource name
        return resource;
    }

    extractSchemaRef(responseOrBody) {
        if (!responseOrBody) return null;

        const content = responseOrBody.content?.['application/json'];
        if (!content?.schema) return null;

        if (content.schema.$ref) {
            const parts = content.schema.$ref.split('/');
            return toPascalCase(parts[parts.length - 1]);
        }

        if (content.schema.type === 'array' && content.schema.items?.$ref) {
            const parts = content.schema.items.$ref.split('/');
            return toPascalCase(parts[parts.length - 1]);
        }

        return null;
    }

    extractParameters(operation, pathStr) {
        const params = [];

        // Path parameters
        const pathParams = extractPathParams(pathStr);
        pathParams.forEach(param => {
            params.push({
                name: param,
                in: 'path',
                required: true,
                type: 'string',
                description: `ID parameter: ${param}`
            });
        });

        // Query parameters
        if (operation.parameters) {
            operation.parameters.forEach(param => {
                if (param.in === 'query') {
                    params.push({
                        name: param.name,
                        in: 'query',
                        required: param.required || false,
                        type: param.schema?.type || 'string',
                        description: param.description
                    });
                }
            });
        }

        return params;
    }

    processRequestBody(requestBody) {
        if (!requestBody) return null;

        const content = requestBody.content?.['application/json'];
        if (!content) return null;

        return {
            required: requestBody.required || false,
            description: requestBody.description,
            schema: content.schema,
            typeName: this.extractSchemaRef(requestBody)
        };
    }

    processResponses(responses) {
        const processed = {};

        for (const [status, response] of Object.entries(responses || {})) {
            processed[status] = {
                description: response.description,
                typeName: this.extractSchemaRef(response),
                isError: parseInt(status) >= 400
            };
        }

        return processed;
    }

    generateValidation(operation, parameters) {
        const validations = [];

        // Parameter validations
        parameters.forEach(param => {
            if (param.required) {
                validations.push({
                    field: param.name,
                    type: 'required',
                    message: `${param.name} is required`
                });
            }
        });

        // Request body validations
        if (operation.requestBody?.required) {
            validations.push({
                field: 'body',
                type: 'required',
                message: 'Request body is required'
            });
        }

        return validations;
    }

    generateOperationId(method, path) {
        const segments = path.split('/').filter(Boolean);
        const parts = segments.map(seg => {
            if (seg.startsWith('{') && seg.endsWith('}')) {
                return 'By' + toPascalCase(seg.slice(1, -1));
            }
            return toPascalCase(seg);
        });

        return toCamelCase(method + parts.join(''));
    }

    getSuccessStatus(method) {
        const statusMap = {
            GET: 200,
            POST: 201,
            PUT: 200,
            DELETE: 204,
            PATCH: 200
        };
        return statusMap[method.toUpperCase()] || 200;
    }
}
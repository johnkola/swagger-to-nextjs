import BaseGenerator from './BaseGenerator.js';
import { pathToRoute, extractPathParams, routeToFilePath } from '../utils/PathUtils.js';
import { toPascalCase, toCamelCase, toKebabCase } from '../utils/StringUtils.js';
import path from 'path';

export default class ApiRouteGenerator extends BaseGenerator {
    constructor(spec, options) {
        super(spec, options);
        this.serviceName = options.serviceName || 'api';
        this.generatedRoutes = new Map();
    }

    async generate() {
        this.emit('progress', { step: 'api-routes', message: 'Generating API route handlers...' });
        const paths = this.spec.paths || {};
        const results = [];

        // Group paths by their base resource for better organization
        const groupedPaths = this.groupPathsByResource(paths);

        // Generate route files for each resource group
        for (const [resource, resourcePaths] of Object.entries(groupedPaths)) {
            try {
                // For each unique route pattern in this resource
                for (const [routePattern, pathData] of Object.entries(resourcePaths)) {
                    const result = await this.generateRouteFile(routePattern, pathData, resource);
                    if (result) {
                        results.push(result);
                    }
                }
            } catch (error) {
                console.error(`Error generating routes for ${resource}:`, error);
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
            totalRoutes: results.length
        };
    }

    groupPathsByResource(paths) {
        const grouped = {};

        for (const [pathStr, pathObj] of Object.entries(paths)) {
            const resource = this.extractResource(pathStr);
            const routePattern = pathToRoute(pathStr).slice(1); // Remove leading slash

            if (!grouped[resource]) {
                grouped[resource] = {};
            }

            // Group by the actual Next.js route pattern
            if (!grouped[resource][routePattern]) {
                grouped[resource][routePattern] = {
                    paths: [],
                    operations: []
                };
            }

            grouped[resource][routePattern].paths.push({ path: pathStr, pathObj });
        }

        return grouped;
    }

    async generateRouteFile(routePattern, pathData, resourceName) {
        const operations = [];
        const allParameters = new Set();
        const imports = new Set();

        // Process all paths that map to this route pattern
        for (const { path: pathStr, pathObj } of pathData.paths) {
            // Process each HTTP method
            for (const [method, operation] of Object.entries(pathObj)) {
                if (['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
                    const preparedOp = this.prepareOperationForTemplate(method, pathStr, operation);
                    operations.push(preparedOp);

                    // Collect all parameters
                    if (preparedOp.parameters) {
                        preparedOp.parameters.forEach(param => {
                            allParameters.add(JSON.stringify(param));
                        });
                    }

                    // Collect imports
                    if (preparedOp.requestBody?.schemaName) {
                        imports.add(preparedOp.requestBody.schemaName);
                    }
                    Object.values(preparedOp.responses || {}).forEach(resp => {
                        if (resp.schemaName) {
                            imports.add(resp.schemaName);
                        }
                    });
                }
            }
        }

        if (operations.length === 0) {
            return null;
        }

        // Parse collected parameters back to objects
        const parameters = Array.from(allParameters).map(p => JSON.parse(p));

        // Prepare template context matching the expected structure
        const templateContext = {
            serviceName: this.serviceName,
            resourceName,
            path: pathData.paths[0].path, // Primary path for this route
            operations,
            parameters,
            imports: Array.from(imports),
            description: `API routes for ${resourceName}`,
            cors: this.options.cors || false
        };

        // Render the template
        const content = await this.templateEngine.render('api/[...route].ts.hbs', templateContext);

        // Determine output path
        const outputPath = path.join(this.options.output, 'app', 'api', routePattern, 'route.ts');

        if (!this.options.dryRun) {
            await this.fileWriter.writeFile(outputPath, content);
        }

        return {
            file: outputPath,
            resource: resourceName,
            methods: operations.map(op => op.method),
            routePattern
        };
    }

    prepareOperationForTemplate(method, pathStr, operation) {
        const operationId = operation.operationId || this.generateOperationId(method, pathStr);

        // Extract parameters in the format expected by the template
        const parameters = this.extractParametersForTemplate(operation, pathStr);

        // Process request body
        const requestBody = this.processRequestBodyForTemplate(operation.requestBody);

        // Process responses
        const responses = this.processResponsesForTemplate(operation.responses);

        return {
            method: method.toLowerCase(),
            operationId: this.formatOperationId(operationId, method),
            summary: operation.summary || `${method.toUpperCase()} ${pathStr}`,
            description: operation.description,
            parameters,
            requestBody,
            responses,
            // Add these for template helpers
            hasBody: !!requestBody,
            hasPathParams: parameters.some(p => p.in === 'path'),
            hasQueryParams: parameters.some(p => p.in === 'query')
        };
    }

    formatOperationId(operationId, method) {
        // Remove method prefix if it exists to avoid duplication
        const methodLower = method.toLowerCase();
        let formattedId = operationId;

        // If operationId starts with the method, remove it
        if (formattedId.toLowerCase().startsWith(methodLower)) {
            formattedId = formattedId.substring(methodLower.length);
        }

        // Ensure camelCase
        return toCamelCase(formattedId);
    }

    extractParametersForTemplate(operation, pathStr) {
        const parameters = [];
        const seen = new Set();

        // Extract path parameters
        const pathParams = extractPathParams(pathStr);
        pathParams.forEach(param => {
            const key = `path:${param}`;
            if (!seen.has(key)) {
                seen.add(key);
                parameters.push({
                    name: param,
                    in: 'path',
                    required: true,
                    type: 'string',
                    description: `Path parameter: ${param}`
                });
            }
        });

        // Extract query/header parameters from operation
        if (operation.parameters) {
            operation.parameters.forEach(param => {
                const key = `${param.in}:${param.name}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    parameters.push({
                        name: param.name,
                        in: param.in,
                        required: param.required || false,
                        type: param.schema?.type || 'string',
                        default: param.schema?.default,
                        description: param.description || `${param.in} parameter: ${param.name}`
                    });
                }
            });
        }

        return parameters;
    }

    processRequestBodyForTemplate(requestBody) {
        if (!requestBody) return null;

        const content = requestBody.content?.['application/json'];
        if (!content?.schema) return null;

        // Extract schema name for type import
        let schemaName = null;
        if (content.schema.$ref) {
            const parts = content.schema.$ref.split('/');
            schemaName = parts[parts.length - 1];
        } else if (content.schema.type === 'array' && content.schema.items?.$ref) {
            // Handle array of objects
            const parts = content.schema.items.$ref.split('/');
            schemaName = parts[parts.length - 1];
        }

        // If no schema name found, try to generate one from the operation
        if (!schemaName && requestBody.description) {
            // Try to extract from description or generate a generic name
            schemaName = 'RequestBody';
        }

        // Resolve the schema to get required fields and defaults
        const resolvedSchema = content.schema.$ref ?
            this.resolveRef(content.schema.$ref) :
            content.schema;

        // Extract default values for optional fields
        const defaults = {};
        if (resolvedSchema?.properties) {
            Object.entries(resolvedSchema.properties).forEach(([key, prop]) => {
                if (prop.default !== undefined) {
                    defaults[key] = typeof prop.default === 'string' ?
                        `'${prop.default}'` :
                        JSON.stringify(prop.default);
                } else if (prop.type === 'string' && !resolvedSchema.required?.includes(key)) {
                    defaults[key] = "''";
                } else if (prop.type === 'object' && !resolvedSchema.required?.includes(key)) {
                    defaults[key] = "{}";
                } else if (prop.type === 'array' && !resolvedSchema.required?.includes(key)) {
                    defaults[key] = "[]";
                }
            });
        }

        return {
            required: requestBody.required || false,
            description: requestBody.description,
            schema: content.schema,
            schemaName: schemaName ? toPascalCase(schemaName) : null,
            requiredFields: resolvedSchema?.required || [],
            defaults: Object.keys(defaults).length > 0 ? defaults : null
        };
    }

    processResponsesForTemplate(responses) {
        const processed = {};

        for (const [status, response] of Object.entries(responses || {})) {
            const content = response.content?.['application/json'];
            let schemaName = null;

            if (content?.schema?.$ref) {
                const parts = content.schema.$ref.split('/');
                schemaName = parts[parts.length - 1];
            }

            processed[status] = {
                description: response.description,
                schema: content?.schema,
                schemaName,
                isSuccess: parseInt(status) >= 200 && parseInt(status) < 300,
                isError: parseInt(status) >= 400
            };
        }

        return processed;
    }

    resolveRef(ref) {
        if (!ref || !ref.startsWith('#/')) return null;

        const parts = ref.substring(2).split('/');
        let current = this.spec;

        for (const part of parts) {
            current = current?.[part];
            if (!current) return null;
        }

        return current;
    }

    extractResource(pathStr) {
        // Extract the primary resource from the path
        const segments = pathStr.split('/').filter(Boolean);

        // Skip common API prefixes
        const prefixesToSkip = ['api', 'v1', 'v2', 'v3'];
        let startIndex = 0;

        while (startIndex < segments.length && prefixesToSkip.includes(segments[startIndex])) {
            startIndex++;
        }

        // Find the first non-parameter segment
        for (let i = startIndex; i < segments.length; i++) {
            if (!segments[i].startsWith('{') && !segments[i].endsWith('}')) {
                return segments[i];
            }
        }

        return 'root';
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
}
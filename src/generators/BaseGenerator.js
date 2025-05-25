/**
 * ===AI PROMPT ==============================================================
 * FILE: src/generators/BaseGenerator.js
 * VERSION: 2025-05-25 13:22:11
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 * Create an abstract base class for code generators with common
 * functionality: template loading, file writing, variable substitution, and
 * logging utilities.
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
 * FILE: src/generators/BaseGenerator.js
 *
 * AI PROMPT FOR CODE REVIEW/ENHANCEMENT:
 * =====================================
 *
 * You are reviewing the base generator class that provides common functionality
 * for all code generators in the Swagger-to-NextJS toolkit. This class implements
 * shared utilities, helper methods, and common patterns used across different generators.
 *
 * RESPONSIBILITIES:
 * - Provide common utility methods for path manipulation and naming
 * - Handle OpenAPI schema processing and analysis
 * - Implement shared validation and sanitization logic
 * - Manage template data preparation and formatting
 * - Provide error handling patterns for all generators
 * - Abstract common file operations and logging
 *
 * SHARED FUNCTIONALITY:
 * - Path parameter extraction and Next.js route conversion
 * - Component and class name generation with proper casing
 * - OpenAPI schema analysis and type discovery
 * - Content sanitization for safe code generation
 * - HTTP method extraction and validation
 * - Template data structuring and preparation
 *
 * REVIEW FOCUS:
 * - Code reusability and DRY principle adherence
 * - Naming convention consistency and standards
 * - Error handling robustness and clarity
 * - Performance optimization for large schemas
 * - Extensibility for future generator types
 */

const path = require('path');

class BaseGenerator {
    constructor() {
        this.stats = {
            generated: 0,
            failed: 0,
            errors: []
        };
    }

    /**
     * Reset statistics
     */
    resetStats() {
        this.stats = {
            generated: 0,
            failed: 0,
            errors: []
        };
    }

    /**
     * Record successful generation
     */
    recordSuccess() {
        this.stats.generated++;
    }

    /**
     * Record failed generation
     */
    recordFailure(error) {
        this.stats.failed++;
        this.stats.errors.push(error);
    }

    /**
     * Get generation statistics
     */
    getStats() {
        return {...this.stats};
    }

    /**
     * Extract HTTP methods from path item
     */
    getHttpMethods(pathItem) {
        const methods = [];
        const httpMethods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'];

        httpMethods.forEach(method => {
            if (pathItem[method]) {
                methods.push(method.toUpperCase());
            }
        });

        return methods;
    }

    /**
     * Extract path parameters from route
     */
    extractPathParameters(routePath) {
        const matches = routePath.match(/\{([^}]+)\}/g);
        if (!matches) return [];

        return matches.map(match => match.slice(1, -1)); // Remove { and }
    }

    /**
     * Generate API class name from path segment
     */
    generateApiClassName(pathSegment) {
        if (!pathSegment) return 'DefaultApi';

        // Convert path segment to PascalCase and add Api suffix
        const className = pathSegment
            .split(/[-_]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join('') + 'Api';

        return className;
    }

    /**
     * Generate a valid React component name
     */
    generateComponentName(routePath) {
        // Remove path parameters and clean up the path
        let cleanPath = routePath
            .replace(/\{[^}]+\}/g, '') // Remove {param} patterns
            .replace(/[^a-zA-Z0-9/_-]/g, '') // Remove special characters
            .split('/')
            .filter(segment => segment && segment.trim() !== '')
            .map(segment => {
                // Convert kebab-case to PascalCase
                return segment
                    .split(/[-_]/)
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join('');
            })
            .join('');

        // Ensure it starts with a capital letter
        cleanPath = cleanPath.charAt(0).toUpperCase() + cleanPath.slice(1);

        // Validate component name
        if (!cleanPath || cleanPath === 'Page' || !/^[A-Z][a-zA-Z0-9]*$/.test(cleanPath)) {
            cleanPath = 'ApiEndpoint';
        }

        return cleanPath + 'Page';
    }

    /**
     * Generate a meaningful page title
     */
    generatePageTitle(routePath, operation) {
        if (operation && operation.summary) {
            return operation.summary;
        }

        // Generate title from path
        const pathParts = routePath
            .split('/')
            .filter(segment => segment && !segment.startsWith('{'))
            .map(segment =>
                segment.split(/[-_]/)
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')
            );

        return pathParts.length > 0 ? pathParts.join(' - ') : 'API Endpoint';
    }

    /**
     * Sanitize JSON for comments
     */
    sanitizeJsonForComment(obj, indent = 4) {
        if (!obj) return '';

        try {
            let jsonStr = JSON.stringify(obj, null, indent);
            // Replace problematic patterns that could break comment blocks
            jsonStr = jsonStr
                .replace(/\*\//g, '*_/') // Replace */ with *_/
                .replace(/\/\*/g, '/_*'); // Replace /* with /_*
            return jsonStr;
        } catch (error) {
            return '{ /* Error serializing schema */ }';
        }
    }

    /**
     * Sanitize content types and other strings for comments
     */
    sanitizeForComment(str) {
        if (!str) return str;

        // Replace problematic patterns
        return str
            .replace(/\*\/\*/g, 'any') // Replace */* with 'any'
            .replace(/\*\//g, 'any/')   // Replace */ with 'any/'
            .replace(/\/\*/g, '/any')   // Replace /* with '/any'
            .replace(/\*\*/g, 'any')    // Replace ** with 'any'
            .replace(/\*/g, 'any');     // Replace single * with 'any'
    }

    /**
     * Find relevant schemas for operations
     */
    findRelevantSchemas(operations) {
        const schemas = new Set();

        Object.values(operations).forEach(operation => {
            // Check request body schemas
            if (operation.requestBody?.content) {
                Object.values(operation.requestBody.content).forEach(content => {
                    if (content.schema?.$ref) {
                        const schemaName = content.schema.$ref.split('/').pop();
                        schemas.add(schemaName);
                    }
                    // Handle nested schema references
                    this.extractNestedSchemaRefs(content.schema, schemas);
                });
            }

            // Check response schemas
            Object.values(operation.responses || {}).forEach(response => {
                if (response.content) {
                    Object.values(response.content).forEach(content => {
                        if (content.schema?.$ref) {
                            const schemaName = content.schema.$ref.split('/').pop();
                            schemas.add(schemaName);
                        }
                        // Handle nested schema references
                        this.extractNestedSchemaRefs(content.schema, schemas);
                    });
                }
            });

            // Check parameter schemas
            if (operation.parameters) {
                operation.parameters.forEach(param => {
                    if (param.schema?.$ref) {
                        const schemaName = param.schema.$ref.split('/').pop();
                        schemas.add(schemaName);
                    }
                });
            }
        });

        return Array.from(schemas);
    }

    /**
     * Helper to extract nested schema references
     */
    extractNestedSchemaRefs(schema, schemas) {
        if (!schema) return;

        if (schema.$ref) {
            const schemaName = schema.$ref.split('/').pop();
            schemas.add(schemaName);
        }

        if (schema.items && schema.items.$ref) {
            const schemaName = schema.items.$ref.split('/').pop();
            schemas.add(schemaName);
        }

        if (schema.properties) {
            Object.values(schema.properties).forEach(prop => {
                this.extractNestedSchemaRefs(prop, schemas);
            });
        }

        if (schema.allOf || schema.oneOf || schema.anyOf) {
            const schemaList = schema.allOf || schema.oneOf || schema.anyOf;
            schemaList.forEach(subSchema => {
                this.extractNestedSchemaRefs(subSchema, schemas);
            });
        }
    }

    /**
     * Generate imports for OpenAPI generated models
     */
    generateModelImports(relevantSchemas) {
        if (!relevantSchemas || relevantSchemas.length === 0) {
            return '';
        }

        const modelImports = relevantSchemas
            .filter(schema => schema && schema.trim() !== '')
            .map(schema => schema.trim())
            .join(', ');

        // Use @ alias for clean imports
        return `import { ${modelImports} } from '@/lib/api-client/model';\n`;
    }

    /**
     * Generate API client imports
     */
    generateApiClientImports(routePath) {
        // Try to determine which API class to import based on the route path
        const pathParts = routePath.split('/').filter(part => part && !part.startsWith('{'));

        // Common API naming patterns
        const apiClassGuesses = [
            // Try to generate API class name from path
            pathParts.length > 0 ? this.generateApiClassName(pathParts[pathParts.length - 1]) : null,
            pathParts.length > 1 ? this.generateApiClassName(pathParts[pathParts.length - 2]) : null,
            'DefaultApi' // Fallback
        ].filter(name => name);

        const primaryApiClass = apiClassGuesses[0];
        // Use @ alias for clean imports
        return `import { ${primaryApiClass}, Configuration } from '@/lib/api-client/api';\n`;
    }

    /**
     * Convert OpenAPI schema to Zod type
     */
    getZodTypeFromSchema(schema) {
        if (!schema) return 'z.unknown()';

        switch (schema.type) {
            case 'string':
                if (schema.enum) {
                    const enumValues = schema.enum.map(v => `'${v.replace(/'/g, "\\'")}'`).join(', ');
                    return `z.enum([${enumValues}])`;
                }
                if (schema.format === 'email') return 'z.string().email()';
                if (schema.format === 'uuid') return 'z.string().uuid()';
                if (schema.format === 'date-time') return 'z.string().datetime()';
                if (schema.minLength || schema.maxLength) {
                    let validation = 'z.string()';
                    if (schema.minLength) validation += `.min(${schema.minLength})`;
                    if (schema.maxLength) validation += `.max(${schema.maxLength})`;
                    return validation;
                }
                return 'z.string()';
            case 'integer':
                let intValidation = 'z.number().int()';
                if (schema.minimum) intValidation += `.min(${schema.minimum})`;
                if (schema.maximum) intValidation += `.max(${schema.maximum})`;
                return intValidation;
            case 'number':
                let numValidation = 'z.number()';
                if (schema.minimum) numValidation += `.min(${schema.minimum})`;
                if (schema.maximum) numValidation += `.max(${schema.maximum})`;
                return numValidation;
            case 'boolean':
                return 'z.boolean()';
            case 'array':
                const itemType = schema.items ? this.getZodTypeFromSchema(schema.items) : 'z.unknown()';
                return `z.array(${itemType})`;
            case 'object':
                if (schema.properties) {
                    return 'z.object({})'; // Simplified for now
                }
                return 'z.record(z.unknown())';
            default:
                return 'z.unknown()';
        }
    }

    /**
     * Extract operations from path item
     */
    extractOperations(pathItem, methods) {
        const operations = {};

        methods.forEach(method => {
            const operation = pathItem[method.toLowerCase()];
            if (operation) {
                operations[method] = {
                    summary: operation.summary || '',
                    description: operation.description || '',
                    parameters: operation.parameters || [],
                    requestBody: operation.requestBody || null,
                    responses: operation.responses || {}
                };
            }
        });

        return operations;
    }

    /**
     * Determine if a page should be generated for this path
     */
    shouldGeneratePage(swaggerPath) {
        // Generate pages for paths that seem user-facing
        const userFacingPatterns = [
            '/users',
            '/profile',
            '/dashboard',
            '/settings',
            '/orders',
            '/products'
        ];

        return userFacingPatterns.some(pattern =>
            swaggerPath.toLowerCase().includes(pattern)
        );
    }

    /**
     * Log generation progress
     */
    logProgress(message, details = null) {
        console.log(`🔧 ${message}`);
        if (details) {
            console.log(`   ${details}`);
        }
    }

    /**
     * Log error with context
     */
    logError(message, error = null) {
        console.error(`❌ ${message}`);
        if (error) {
            console.error(`   ${error.message}`);
            if (process.env.DEBUG) {
                console.error(`   ${error.stack}`);
            }
        }
    }

    /**
     * Log warning
     */
    logWarning(message) {
        console.warn(`⚠️  ${message}`);
    }
}

module.exports = BaseGenerator;
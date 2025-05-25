/**
 * ===AI PROMPT ==============================================================
 * FILE: src/core/SwaggerValidator.js
 * VERSION: 2025-05-25 13:22:11
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 * Build a validator class for OpenAPI specifications. Validate schema
 * structure, required fields, and generate warnings for missing or deprecated
 * properties.
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
 * FILE: src/core/SwaggerValidator.js
 *
 * AI PROMPT FOR CODE REVIEW/ENHANCEMENT:
 * =====================================
 *
 * You are reviewing an OpenAPI/Swagger document validator that ensures specifications
 * meet the requirements for successful Next.js code generation. This validator performs
 * structural validation, completeness checks, and compatibility verification.
 *
 * RESPONSIBILITIES:
 * - Validate basic OpenAPI document structure and required fields
 * - Check for presence of paths, operations, and schemas needed for generation
 * - Verify OpenAPI/Swagger version compatibility
 * - Validate operation definitions for code generation requirements
 * - Provide detailed validation reports with actionable feedback
 * - Support both OpenAPI 3.x and Swagger 2.x specifications
 *
 * VALIDATION CATEGORIES:
 * - Structural validation (required fields, proper nesting)
 * - Semantic validation (operation completeness, schema references)
 * - Generation readiness (paths suitable for Next.js routing)
 * - Best practices compliance (naming conventions, documentation)
 *
 * REVIEW FOCUS:
 * - Validation completeness and accuracy
 * - Error message clarity and actionability
 * - Performance for large OpenAPI documents
 * - Extensibility for custom validation rules
 * - Support for different OpenAPI specification versions
 */

class SwaggerValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
    }

    /**
     * Main validation method
     */
    validate(swaggerDoc) {
        this.errors = [];
        this.warnings = [];

        try {
            this.validateBasicStructure(swaggerDoc);
            this.validateVersion(swaggerDoc);
            this.validateInfo(swaggerDoc);
            this.validatePaths(swaggerDoc);
            this.validateSchemas(swaggerDoc);

            this.reportResults(swaggerDoc);

            // Throw if there are critical errors
            if (this.errors.length > 0) {
                throw new Error(`Validation failed with ${this.errors.length} errors`);
            }

        } catch (error) {
            throw new Error(`Swagger validation failed: ${error.message}`);
        }
    }

    /**
     * Validate basic document structure
     */
    validateBasicStructure(swaggerDoc) {
        if (!swaggerDoc) {
            this.errors.push('Swagger document is empty or null');
            return;
        }

        if (typeof swaggerDoc !== 'object') {
            this.errors.push('Swagger document must be an object');
            return;
        }

        // Check for required top-level fields
        if (!swaggerDoc.paths) {
            this.errors.push('No paths found in Swagger document - required for API generation');
        }

        if (!swaggerDoc.info) {
            this.warnings.push('No info section found - recommended for proper documentation');
        }
    }

    /**
     * Validate OpenAPI/Swagger version
     */
    validateVersion(swaggerDoc) {
        const hasOpenApi = swaggerDoc.openapi;
        const hasSwagger = swaggerDoc.swagger;

        if (!hasOpenApi && !hasSwagger) {
            this.warnings.push('No OpenAPI/Swagger version specified - may cause compatibility issues');
            return;
        }

        const version = hasOpenApi || hasSwagger;
        console.log(`📋 OpenAPI/Swagger version: ${version}`);

        // Validate version format
        if (hasOpenApi) {
            if (!version.match(/^3\.\d+\.\d+$/)) {
                this.warnings.push(`OpenAPI version "${version}" may not be fully supported. Recommended: 3.0.x or 3.1.x`);
            }
        } else if (hasSwagger) {
            if (!version.match(/^2\.\d+$/)) {
                this.warnings.push(`Swagger version "${version}" may not be fully supported. Recommended: 2.0`);
            }
        }
    }

    /**
     * Validate info section
     */
    validateInfo(swaggerDoc) {
        if (!swaggerDoc.info) return;

        const info = swaggerDoc.info;

        console.log(`📋 API Title: ${info.title || 'Not specified'}`);
        console.log(`📋 API Version: ${info.version || 'Not specified'}`);

        if (!info.title) {
            this.warnings.push('API title not specified - will use default title');
        }

        if (!info.version) {
            this.warnings.push('API version not specified - recommended for versioning');
        }

        if (!info.description) {
            this.warnings.push('API description not specified - recommended for documentation');
        }
    }

    /**
     * Validate paths and operations
     */
    validatePaths(swaggerDoc) {
        if (!swaggerDoc.paths) return;

        const paths = swaggerDoc.paths;
        const pathCount = Object.keys(paths).length;

        console.log(`📋 Found ${pathCount} API paths to process`);

        if (pathCount === 0) {
            this.errors.push('No API paths found - nothing to generate');
            return;
        }

        // Validate individual paths
        let validPaths = 0;
        let pathsWithOperations = 0;

        Object.entries(paths).forEach(([path, pathItem]) => {
            const pathValidation = this.validatePath(path, pathItem);
            if (pathValidation.isValid) {
                validPaths++;
                if (pathValidation.hasOperations) {
                    pathsWithOperations++;
                }
            }
        });

        console.log(`📋 Valid paths: ${validPaths}/${pathCount}`);
        console.log(`📋 Paths with operations: ${pathsWithOperations}/${pathCount}`);

        if (pathsWithOperations === 0) {
            this.errors.push('No paths with valid HTTP operations found');
        }
    }

    /**
     * Validate individual path
     */
    validatePath(path, pathItem) {
        const result = {isValid: true, hasOperations: false};

        if (!pathItem || typeof pathItem !== 'object') {
            this.errors.push(`Path "${path}" has invalid definition`);
            result.isValid = false;
            return result;
        }

        // Check for HTTP methods
        const httpMethods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'];
        const operations = httpMethods.filter(method => pathItem[method]);

        if (operations.length === 0) {
            this.warnings.push(`Path "${path}" has no HTTP operations defined`);
        } else {
            result.hasOperations = true;

            // Validate each operation
            operations.forEach(method => {
                this.validateOperation(path, method, pathItem[method]);
            });
        }

        // Validate path format for Next.js compatibility
        this.validatePathFormat(path);

        return result;
    }

    /**
     * Validate operation definition
     */
    validateOperation(path, method, operation) {
        if (!operation || typeof operation !== 'object') {
            this.errors.push(`Operation ${method.toUpperCase()} ${path} has invalid definition`);
            return;
        }

        // Check for basic operation properties
        if (!operation.responses) {
            this.warnings.push(`Operation ${method.toUpperCase()} ${path} has no response definitions`);
        }

        if (!operation.summary && !operation.description) {
            this.warnings.push(`Operation ${method.toUpperCase()} ${path} has no summary or description`);
        }

        // Validate parameters
        if (operation.parameters) {
            operation.parameters.forEach((param, index) => {
                this.validateParameter(path, method, param, index);
            });
        }

        // Validate request body (OpenAPI 3.x)
        if (operation.requestBody) {
            this.validateRequestBody(path, method, operation.requestBody);
        }

        // Validate responses
        if (operation.responses) {
            this.validateResponses(path, method, operation.responses);
        }
    }

    /**
     * Validate parameter definition
     */
    validateParameter(path, method, param, index) {
        if (!param.name) {
            this.errors.push(`Parameter ${index} in ${method.toUpperCase()} ${path} has no name`);
        }

        if (!param.in) {
            this.errors.push(`Parameter "${param.name}" in ${method.toUpperCase()} ${path} has no location (in)`);
        }

        if (!param.schema && !param.type) {
            this.warnings.push(`Parameter "${param.name}" in ${method.toUpperCase()} ${path} has no schema or type`);
        }
    }

    /**
     * Validate request body
     */
    validateRequestBody(path, method, requestBody) {
        if (!requestBody.content) {
            this.warnings.push(`Request body in ${method.toUpperCase()} ${path} has no content definition`);
        }
    }

    /**
     * Validate responses
     */
    validateResponses(path, method, responses) {
        const responseKeys = Object.keys(responses);

        if (responseKeys.length === 0) {
            this.warnings.push(`No responses defined for ${method.toUpperCase()} ${path}`);
            return;
        }

        // Check for success response
        const hasSuccessResponse = responseKeys.some(code =>
            code.startsWith('2') || code === 'default'
        );

        if (!hasSuccessResponse) {
            this.warnings.push(`No success response (2xx) defined for ${method.toUpperCase()} ${path}`);
        }
    }

    /**
     * Validate path format for Next.js compatibility
     */
    validatePathFormat(path) {
        // Check for unsupported characters
        const invalidChars = /[^a-zA-Z0-9/_\-{}.]/;
        if (invalidChars.test(path)) {
            this.warnings.push(`Path "${path}" contains characters that may cause issues in Next.js routing`);
        }

        // Check for proper parameter format
        const paramRegex = /\{([^}]+)\}/g;
        let match;
        while ((match = paramRegex.exec(path)) !== null) {
            const paramName = match[1];
            if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(paramName)) {
                this.warnings.push(`Path parameter "{${paramName}}" in "${path}" may not be valid in Next.js`);
            }
        }
    }

    /**
     * Validate schemas section
     */
    validateSchemas(swaggerDoc) {
        const schemas = swaggerDoc.components?.schemas || swaggerDoc.definitions;

        if (!schemas) {
            this.warnings.push('No schemas/definitions found - may limit type safety in generated code');
            return;
        }

        const schemaCount = Object.keys(schemas).length;
        console.log(`📋 Found ${schemaCount} schema definitions`);

        // Basic schema validation
        Object.entries(schemas).forEach(([name, schema]) => {
            if (!schema || typeof schema !== 'object') {
                this.errors.push(`Schema "${name}" has invalid definition`);
            }
        });
    }

    /**
     * Report validation results
     */
    reportResults(swaggerDoc) {
        console.log('\n📋 Validation Summary:');

        if (this.errors.length > 0) {
            console.log(`❌ Errors: ${this.errors.length}`);
            this.errors.forEach(error => console.log(`   • ${error}`));
        }

        if (this.warnings.length > 0) {
            console.log(`⚠️  Warnings: ${this.warnings.length}`);
            this.warnings.forEach(warning => console.log(`   • ${warning}`));
        }

        if (this.errors.length === 0 && this.warnings.length === 0) {
            console.log('✅ Validation passed with no issues');
        } else if (this.errors.length === 0) {
            console.log('✅ Validation passed with warnings');
        }

        console.log('');
    }
}

module.exports = SwaggerValidator;
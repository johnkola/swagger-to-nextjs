/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - AI PROMPT
 * ============================================================================
 * FILE: src/core/SwaggerValidator.js
 * VERSION: 2025-06-17 21:42:10
 * PHASE: Phase 2: Core System Components
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 *
 * Build a validator class using ES Module syntax for OpenAPI specifications
 * that ensures the spec is valid and ready for code generation. Import
 * necessary utilities using ES Module imports. It should check for required
 * fields (openapi/swagger version, info, paths), verify each path has at
 * least one operation, generate missing operationIds from path and method,
 * validate that all referenced schemas exist, check for common issues like
 * empty paths or missing response schemas, extract any UI hints or display
 * preferences from spec extensions that could influence DaisyUI component
 * selection, separate validation results into errors (blocking) and
 * warnings (non-blocking), provide detailed error messages with the path to
 * the problem (e.g., "paths./pets.get.responses.200.content is missing"),
 * and return a validation result object with valid boolean, errors array,
 * and warnings array. Export as default.
 *
 * ============================================================================
 */
class SwaggerValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.uiHints = {
            components: {},
            themes: {},
            layouts: {},
            features: {},
            forms: {},
            tables: {},
            validations: {}
        };
    }

    /**
     * Validate an OpenAPI specification
     * @param {Object} spec - The specification to validate
     * @returns {Object} Validation result with valid boolean, errors, warnings, and UI hints
     */
    validate(spec) {
        this.errors = [];
        this.warnings = [];
        this.uiHints = {
            components: {},
            themes: {},
            layouts: {},
            features: {},
            forms: {},
            tables: {},
            validations: {}
        };

        // Check basic structure
        this.validateBasicStructure(spec);

        // Validate info section
        this.validateInfo(spec);

        // Validate paths
        this.validatePaths(spec);

        // Validate components/definitions
        this.validateComponents(spec);

        // Check for common issues
        this.checkCommonIssues(spec);

        // Extract UI hints after validation
        this.extractUIHints(spec);

        return {
            valid: this.errors.length === 0,
            errors: [...this.errors],
            warnings: [...this.warnings],
            uiHints: this.uiHints
        };
    }

    /**
     * Extract UI hints and display preferences from spec extensions
     * @param {Object} spec - The specification
     */
    extractUIHints(spec) {
        // Extract global UI configuration
        if (spec['x-ui-config']) {
            this.processUIConfig(spec['x-ui-config']);
        }

        // Extract from info section
        if (spec.info) {
            this.extractInfoUIHints(spec.info);
        }

        // Extract from paths
        if (spec.paths) {
            this.extractPathsUIHints(spec.paths);
        }

        // Extract from components/schemas
        const schemas = spec.components?.schemas || spec.definitions || {};
        this.extractSchemasUIHints(schemas);

        // Extract from tags
        if (spec.tags) {
            this.extractTagsUIHints(spec.tags);
        }
    }

    /**
     * Process global UI configuration
     * @param {Object} uiConfig - UI configuration object
     */
    processUIConfig(uiConfig) {
        if (uiConfig.theme) {
            this.uiHints.themes.default = uiConfig.theme;
        }

        if (uiConfig.themes) {
            this.uiHints.themes.available = Array.isArray(uiConfig.themes)
                ? uiConfig.themes
                : [uiConfig.themes];
        }

        if (uiConfig.features) {
            Object.assign(this.uiHints.features, uiConfig.features);
        }

        if (uiConfig.components) {
            Object.assign(this.uiHints.components, uiConfig.components);
        }

        if (uiConfig.layouts) {
            Object.assign(this.uiHints.layouts, uiConfig.layouts);
        }
    }

    /**
     * Extract UI hints from info section
     * @param {Object} info - Info object
     */
    extractInfoUIHints(info) {
        // Theme preferences
        if (info['x-ui-theme']) {
            this.uiHints.themes.default = info['x-ui-theme'];
        }

        // Color scheme
        if (info['x-ui-colors']) {
            this.uiHints.themes.colors = info['x-ui-colors'];
        }

        // Layout preferences
        if (info['x-ui-layout']) {
            this.uiHints.layouts.default = info['x-ui-layout'];
        }

        // Feature flags
        if (info['x-ui-features']) {
            Object.assign(this.uiHints.features, info['x-ui-features']);
        }
    }

    /**
     * Extract UI hints from paths
     * @param {Object} paths - Paths object
     */
    extractPathsUIHints(paths) {
        for (const [pathName, pathItem] of Object.entries(paths)) {
            // Path-level UI hints
            if (pathItem['x-ui-component']) {
                this.uiHints.components[pathName] = {
                    type: pathItem['x-ui-component'],
                    options: pathItem['x-ui-options'] || {}
                };
            }

            // Operation-level UI hints
            const operations = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch'];
            operations.forEach(method => {
                if (pathItem[method]) {
                    const operation = pathItem[method];
                    const operationKey = `${pathName}#${method}`;

                    // Component preferences
                    if (operation['x-ui-component']) {
                        this.uiHints.components[operationKey] = {
                            type: operation['x-ui-component'],
                            options: operation['x-ui-options'] || {}
                        };
                    }

                    // Layout hints
                    if (operation['x-ui-layout']) {
                        this.uiHints.layouts[operationKey] = operation['x-ui-layout'];
                    }

                    // Table configuration for list operations
                    if (operation['x-ui-table']) {
                        this.uiHints.tables[operationKey] = operation['x-ui-table'];
                    }

                    // Form configuration for create/update operations
                    if (operation['x-ui-form']) {
                        this.uiHints.forms[operationKey] = operation['x-ui-form'];
                    }

                    // Pagination hints
                    if (operation['x-ui-pagination']) {
                        this.uiHints.components[`${operationKey}#pagination`] = {
                            type: 'pagination',
                            options: operation['x-ui-pagination']
                        };
                    }

                    // Sorting hints
                    if (operation['x-ui-sort']) {
                        this.uiHints.components[`${operationKey}#sort`] = {
                            type: 'sort',
                            options: operation['x-ui-sort']
                        };
                    }

                    // Filter hints
                    if (operation['x-ui-filter']) {
                        this.uiHints.components[`${operationKey}#filter`] = {
                            type: 'filter',
                            options: operation['x-ui-filter']
                        };
                    }

                    // Success/error message hints
                    if (operation['x-ui-success-message']) {
                        this.uiHints.components[`${operationKey}#success`] = {
                            type: 'toast',
                            options: { message: operation['x-ui-success-message'] }
                        };
                    }

                    if (operation['x-ui-error-message']) {
                        this.uiHints.components[`${operationKey}#error`] = {
                            type: 'alert',
                            options: { message: operation['x-ui-error-message'] }
                        };
                    }

                    // Confirmation dialogs
                    if (operation['x-ui-confirm']) {
                        this.uiHints.components[`${operationKey}#confirm`] = {
                            type: 'modal',
                            options: operation['x-ui-confirm'] === true
                                ? { title: 'Confirm Action', message: 'Are you sure?' }
                                : operation['x-ui-confirm']
                        };
                    }
                }
            });
        }
    }

    /**
     * Extract UI hints from schemas
     * @param {Object} schemas - Schemas object
     */
    extractSchemasUIHints(schemas) {
        for (const [schemaName, schema] of Object.entries(schemas)) {
            const schemaKey = `schema#${schemaName}`;

            // Schema-level component hints
            if (schema['x-ui-component']) {
                this.uiHints.components[schemaKey] = {
                    type: schema['x-ui-component'],
                    options: schema['x-ui-options'] || {}
                };
            }

            // Form layout for schemas
            if (schema['x-ui-form-layout']) {
                this.uiHints.forms[schemaKey] = {
                    layout: schema['x-ui-form-layout']
                };
            }

            // Process properties
            if (schema.properties) {
                for (const [propName, prop] of Object.entries(schema.properties)) {
                    const propKey = `${schemaKey}.${propName}`;

                    // Field-level component hints
                    if (prop['x-ui-component']) {
                        this.uiHints.components[propKey] = {
                            type: prop['x-ui-component'],
                            options: prop['x-ui-options'] || {}
                        };
                    }

                    // Field validation hints
                    if (prop['x-ui-validation']) {
                        this.uiHints.validations[propKey] = prop['x-ui-validation'];
                    }

                    // Field display hints
                    if (prop['x-ui-display']) {
                        this.uiHints.components[`${propKey}#display`] = {
                            type: 'display',
                            options: prop['x-ui-display']
                        };
                    }

                    // Placeholder text
                    if (prop['x-ui-placeholder']) {
                        if (!this.uiHints.components[propKey]) {
                            this.uiHints.components[propKey] = { options: {} };
                        }
                        this.uiHints.components[propKey].options.placeholder = prop['x-ui-placeholder'];
                    }

                    // Help text
                    if (prop['x-ui-help']) {
                        if (!this.uiHints.components[propKey]) {
                            this.uiHints.components[propKey] = { options: {} };
                        }
                        this.uiHints.components[propKey].options.help = prop['x-ui-help'];
                    }

                    // DaisyUI-specific hints
                    if (prop['x-daisy-variant']) {
                        if (!this.uiHints.components[propKey]) {
                            this.uiHints.components[propKey] = { options: {} };
                        }
                        this.uiHints.components[propKey].options.variant = prop['x-daisy-variant'];
                    }

                    if (prop['x-daisy-size']) {
                        if (!this.uiHints.components[propKey]) {
                            this.uiHints.components[propKey] = { options: {} };
                        }
                        this.uiHints.components[propKey].options.size = prop['x-daisy-size'];
                    }

                    // Enum display hints
                    if (prop.enum && prop['x-ui-enum-labels']) {
                        if (!this.uiHints.components[propKey]) {
                            this.uiHints.components[propKey] = { options: {} };
                        }
                        this.uiHints.components[propKey].options.enumLabels = prop['x-ui-enum-labels'];
                    }

                    // Badge colors for enum values
                    if (prop.enum && prop['x-ui-enum-colors']) {
                        if (!this.uiHints.components[propKey]) {
                            this.uiHints.components[propKey] = { options: {} };
                        }
                        this.uiHints.components[propKey].options.enumColors = prop['x-ui-enum-colors'];
                    }
                }
            }
        }
    }

    /**
     * Extract UI hints from tags
     * @param {Array} tags - Tags array
     */
    extractTagsUIHints(tags) {
        tags.forEach(tag => {
            if (tag['x-ui-icon']) {
                this.uiHints.components[`tag#${tag.name}#icon`] = {
                    type: 'icon',
                    options: { icon: tag['x-ui-icon'] }
                };
            }

            if (tag['x-ui-color']) {
                this.uiHints.components[`tag#${tag.name}#color`] = {
                    type: 'color',
                    options: { color: tag['x-ui-color'] }
                };
            }

            if (tag['x-ui-order']) {
                this.uiHints.components[`tag#${tag.name}#order`] = {
                    type: 'order',
                    options: { order: tag['x-ui-order'] }
                };
            }
        });
    }

    /**
     * Validate basic specification structure
     * @param {Object} spec - The specification
     */
    validateBasicStructure(spec) {
        // Check for version
        if (!spec.openapi && !spec.swagger) {
            this.addError('Missing version field. Expected "openapi" (3.x) or "swagger" (2.0)');
            return;
        }

        // Check version format
        if (spec.openapi && !spec.openapi.match(/^3\.\d+\.\d+$/)) {
            this.addError(`Invalid OpenAPI version: ${spec.openapi}. Expected format: 3.x.x`);
        }

        if (spec.swagger && !spec.swagger.match(/^2\.\d+$/)) {
            this.addError(`Invalid Swagger version: ${spec.swagger}. Expected format: 2.x`);
        }

        // Check for required top-level fields
        if (!spec.info) {
            this.addError('Missing required field: info');
        }

        if (!spec.paths) {
            this.addError('Missing required field: paths');
        }
    }

    /**
     * Validate info section
     * @param {Object} spec - The specification
     */
    validateInfo(spec) {
        if (!spec.info) return;

        const info = spec.info;
        const infoPath = 'info';

        if (!info.title) {
            this.addError(`${infoPath}.title is required`);
        }

        if (!info.version) {
            this.addError(`${infoPath}.version is required`);
        }

        if (info.title && typeof info.title !== 'string') {
            this.addError(`${infoPath}.title must be a string`);
        }

        if (info.version && typeof info.version !== 'string') {
            this.addError(`${infoPath}.version must be a string`);
        }

        if (info.description && typeof info.description !== 'string') {
            this.addError(`${infoPath}.description must be a string`);
        }
    }

    /**
     * Validate paths section
     * @param {Object} spec - The specification
     */
    validatePaths(spec) {
        if (!spec.paths) return;

        const paths = spec.paths;

        // Check if paths is empty
        if (Object.keys(paths).length === 0) {
            this.addError('paths object is empty. At least one path is required');
            return;
        }

        // Validate each path
        for (const [pathName, pathItem] of Object.entries(paths)) {
            this.validatePath(pathName, pathItem, spec);
        }
    }

    /**
     * Validate a single path
     * @param {string} pathName - The path name
     * @param {Object} pathItem - The path item object
     * @param {Object} spec - The full specification
     */
    validatePath(pathName, pathItem, spec) {
        const pathPrefix = `paths.${pathName}`;

        // Check if path starts with /
        if (!pathName.startsWith('/')) {
            this.addWarning(`${pathPrefix}: Path should start with '/'`);
        }

        // Check for at least one operation
        const operations = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch'];
        const hasOperation = operations.some(op => pathItem[op]);

        if (!hasOperation) {
            this.addError(`${pathPrefix}: Path must have at least one operation (${operations.join(', ')})`);
            return;
        }

        // Validate each operation
        operations.forEach(method => {
            if (pathItem[method]) {
                this.validateOperation(pathName, method, pathItem[method], spec);
            }
        });

        // Check path parameters
        if (pathName.includes('{')) {
            this.validatePathParameters(pathName, pathItem);
        }
    }

    /**
     * Validate a single operation
     * @param {string} pathName - The path name
     * @param {string} method - The HTTP method
     * @param {Object} operation - The operation object
     * @param {Object} spec - The full specification
     */
    validateOperation(pathName, method, operation, spec) {
        const opPath = `paths.${pathName}.${method}`;

        // Check or generate operationId
        if (!operation.operationId) {
            const generatedId = this.generateOperationId(pathName, method);
            operation.operationId = generatedId;
            this.addWarning(`${opPath}: Missing operationId. Generated: ${generatedId}`);
        } else if (!/^[a-zA-Z0-9_]+$/.test(operation.operationId)) {
            this.addWarning(`${opPath}.operationId contains invalid characters. Should only contain alphanumeric and underscore`);
        }

        // Validate responses
        if (!operation.responses) {
            this.addError(`${opPath}: Missing required field 'responses'`);
        } else {
            this.validateResponses(opPath, operation.responses, spec);
        }

        // Validate parameters
        if (operation.parameters) {
            this.validateParameters(`${opPath}.parameters`, operation.parameters, pathName);
        }

        // Validate request body (OpenAPI 3.0)
        if (operation.requestBody) {
            this.validateRequestBody(`${opPath}.requestBody`, operation.requestBody, spec);
        }

        // Check for summary or description
        if (!operation.summary && !operation.description) {
            this.addWarning(`${opPath}: Operation should have a summary or description`);
        }
    }

    /**
     * Generate an operationId from path and method
     * @param {string} path - The path
     * @param {string} method - The HTTP method
     * @returns {string} Generated operationId
     */
    generateOperationId(path, method) {
        // Convert path to camelCase operationId
        const parts = path.split('/').filter(Boolean);
        const processed = parts.map((part, index) => {
            // Handle parameter names
            if (part.includes('{')) {
                // Remove braces and capitalize
                const paramName = part.replace(/[{}]/g, '');
                return 'By' + this.capitalize(paramName);
            }

            // Regular path segments
            if (index === 0) {
                // First segment after method - don't capitalize
                return part;
            } else {
                // Subsequent segments capitalized
                return this.capitalize(part);
            }
        });

        // Combine method with path parts (don't capitalize the first path part)
        const pathPart = processed.join('');
        return method.toLowerCase() + this.capitalize(pathPart.charAt(0)) + pathPart.slice(1);
    }

    /**
     * Capitalize first letter
     * @param {string} str - String to capitalize
     * @returns {string} Capitalized string
     */
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Validate responses object
     * @param {string} path - Path to the responses object
     * @param {Object} responses - The responses object
     * @param {Object} spec - The full specification
     */
    validateResponses(path, responses, spec) {
        if (Object.keys(responses).length === 0) {
            this.addError(`${path}: Responses object is empty`);
            return;
        }

        // Check for at least one success response
        const successCodes = Object.keys(responses).filter(code =>
            code >= '200' && code < '300'
        );

        if (successCodes.length === 0) {
            this.addWarning(`${path}: No success response (2xx) defined`);
        }

        // Validate each response
        for (const [statusCode, response] of Object.entries(responses)) {
            this.validateResponse(`${path}.${statusCode}`, statusCode, response, spec);
        }
    }

    /**
     * Validate a single response
     * @param {string} path - Path to the response
     * @param {string} statusCode - The status code
     * @param {Object} response - The response object
     * @param {Object} spec - The full specification
     */
    validateResponse(path, statusCode, response, spec) {
        // Check description
        if (!response.description) {
            this.addError(`${path}: Response must have a description`);
        }

        // For success responses, check for content/schema
        if (statusCode >= '200' && statusCode < '300' && statusCode !== '204') {
            if (spec.openapi) {
                // OpenAPI 3.0
                if (!response.content) {
                    this.addWarning(`${path}: Success response should define content`);
                }
            } else {
                // Swagger 2.0
                if (!response.schema) {
                    this.addWarning(`${path}: Success response should define a schema`);
                }
            }
        }
    }

    /**
     * Validate parameters array
     * @param {string} path - Path to the parameters
     * @param {Array} parameters - The parameters array
     * @param {string} pathName - The path name for parameter validation
     */
    validateParameters(path, parameters, pathName) {
        if (!Array.isArray(parameters)) {
            this.addError(`${path}: Parameters must be an array`);
            return;
        }

        const seenParams = new Set();

        parameters.forEach((param, index) => {
            const paramPath = `${path}[${index}]`;

            // Check required fields
            if (!param.name) {
                this.addError(`${paramPath}: Parameter must have a name`);
            }

            if (!param.in) {
                this.addError(`${paramPath}: Parameter must have 'in' property`);
            }

            // Check for duplicates
            const key = `${param.in}-${param.name}`;
            if (seenParams.has(key)) {
                this.addError(`${paramPath}: Duplicate parameter '${param.name}' in '${param.in}'`);
            }
            seenParams.add(key);

            // Validate path parameters exist in path
            if (param.in === 'path') {
                if (!pathName.includes(`{${param.name}}`)) {
                    this.addError(`${paramPath}: Path parameter '${param.name}' not found in path '${pathName}'`);
                }

                if (!param.required || param.required !== true) {
                    this.addError(`${paramPath}: Path parameters must be required`);
                }
            }
        });
    }

    /**
     * Validate path parameters
     * @param {string} pathName - The path name
     * @param {Object} pathItem - The path item
     */
    validatePathParameters(pathName, pathItem) {
        const paramMatches = pathName.match(/{([^}]+)}/g) || [];
        const pathParams = paramMatches.map(p => p.slice(1, -1));

        // Check each operation has definitions for path parameters
        const operations = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch'];

        operations.forEach(method => {
            if (pathItem[method]) {
                const operation = pathItem[method];
                const allParams = [
                    ...(pathItem.parameters || []),
                    ...(operation.parameters || [])
                ];

                pathParams.forEach(paramName => {
                    const hasParam = allParams.some(p =>
                        p.name === paramName && p.in === 'path'
                    );

                    if (!hasParam) {
                        this.addError(`paths.${pathName}.${method}: Missing definition for path parameter '${paramName}'`);
                    }
                });
            }
        });
    }

    /**
     * Validate request body (OpenAPI 3.0)
     * @param {string} path - Path to the request body
     * @param {Object} requestBody - The request body object
     * @param {Object} spec - The full specification
     */
    validateRequestBody(path, requestBody, spec) {
        if (!requestBody.content) {
            this.addError(`${path}: Request body must have content`);
            return;
        }

        if (Object.keys(requestBody.content).length === 0) {
            this.addError(`${path}.content: Content object is empty`);
        }

        // Check each content type has a schema
        for (const [mediaType, content] of Object.entries(requestBody.content)) {
            if (!content.schema) {
                this.addWarning(`${path}.content.${mediaType}: Missing schema definition`);
            }
        }
    }

    /**
     * Validate components/definitions section
     * @param {Object} spec - The specification
     */
    validateComponents(spec) {
        // OpenAPI 3.0
        if (spec.components && spec.components.schemas) {
            this.validateSchemas('components.schemas', spec.components.schemas);
        }

        // Swagger 2.0
        if (spec.definitions) {
            this.validateSchemas('definitions', spec.definitions);
        }
    }

    /**
     * Validate schemas
     * @param {string} path - Path to the schemas
     * @param {Object} schemas - The schemas object
     */
    validateSchemas(path, schemas) {
        for (const [schemaName, schema] of Object.entries(schemas)) {
            this.validateSchema(`${path}.${schemaName}`, schema);
        }
    }

    /**
     * Validate a single schema
     * @param {string} path - Path to the schema
     * @param {Object} schema - The schema object
     */
    validateSchema(path, schema) {
        // Basic type validation
        if (!schema.type && !schema.$ref && !schema.allOf && !schema.oneOf && !schema.anyOf) {
            this.addWarning(`${path}: Schema should define a type or composition`);
        }

        // Validate object schemas
        if (schema.type === 'object') {
            if (!schema.properties) {
                this.addWarning(`${path}: Object schema should define properties`);
            }

            // Check required array
            if (schema.required && !Array.isArray(schema.required)) {
                this.addError(`${path}.required: Must be an array`);
            }

            // Validate required properties exist
            if (schema.required && schema.properties) {
                schema.required.forEach(prop => {
                    if (!schema.properties[prop]) {
                        this.addError(`${path}.required: Required property '${prop}' not defined in properties`);
                    }
                });
            }
        }

        // Validate array schemas
        if (schema.type === 'array' && !schema.items) {
            this.addError(`${path}: Array schema must define items`);
        }
    }

    /**
     * Check for common issues
     * @param {Object} spec - The specification
     */
    checkCommonIssues(spec) {
        // Check for empty schemas
        const schemas = spec.components?.schemas || spec.definitions || {};
        for (const [name, schema] of Object.entries(schemas)) {
            if (Object.keys(schema).length === 0) {
                this.addWarning(`Schema '${name}' is empty`);
            }
        }

        // Check for operations without tags
        let untaggedCount = 0;
        if (spec.paths) {
            for (const [path, pathItem] of Object.entries(spec.paths)) {
                const operations = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch'];
                operations.forEach(method => {
                    if (pathItem[method] && !pathItem[method].tags) {
                        untaggedCount++;
                    }
                });
            }
        }

        if (untaggedCount > 0) {
            this.addWarning(`${untaggedCount} operations have no tags. Consider adding tags for better organization`);
        }

        // Check for missing servers/host
        if (spec.openapi && (!spec.servers || spec.servers.length === 0)) {
            this.addWarning('No servers defined. Consider adding server information');
        }

        if (spec.swagger && !spec.host) {
            this.addWarning('No host defined. Consider adding host information');
        }
    }

    /**
     * Add an error
     * @param {string} message - Error message
     */
    addError(message) {
        this.errors.push({
            type: 'error',
            message
        });
    }

    /**
     * Add a warning
     * @param {string} message - Warning message
     */
    addWarning(message) {
        this.warnings.push({
            type: 'warning',
            message
        });
    }
}

export default SwaggerValidator;
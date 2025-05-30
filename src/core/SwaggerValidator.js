/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - AI PROMPT
 * ============================================================================
 * FILE: src/core/SwaggerValidator.js
 * VERSION: 2025-05-28 15:14:56
 * PHASE: PHASE 2: Core System Components
 * CATEGORY: 🔍 Core Infrastructure
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 *
 * Build a comprehensive validator class that:
 * - Validates against official OpenAPI schemas
 * - Provides detailed error messages with line numbers
 * - Suggests fixes for common mistakes
 * - Warns about deprecated features
 * - Checks for security best practices
 * - Validates example data against schemas
 * - Ensures referential integrity
 * - Checks for naming convention compliance
 * - Provides severity levels (error, warning, info)
 * - Generates validation reports in multiple formats
 *
 * ============================================================================
 */

const AjvDraft04 = require('ajv-draft-04');
const Ajv2019 = require('ajv/dist/2019');
const Ajv2020 = require('ajv/dist/2020');
const ajvFormats = require('ajv-formats');
const { EventEmitter } = require('events');
const jsonPointer = require('json-pointer');
const chalk = require('chalk');

// OpenAPI schemas
const openapi30Schema = require('@apidevtools/openapi-schemas/schemas/v3.0/schema.json');
const openapi31Schema = require('@apidevtools/openapi-schemas/schemas/v3.1/schema.json');
const swagger20Schema = require('@apidevtools/swagger-schemas/schemas/v2.0/schema.json');

/**
 * Validation issue severity levels
 */
const Severity = {
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info',
    HINT: 'hint'
};

/**
 * Comprehensive OpenAPI/Swagger specification validator
 */
class SwaggerValidator extends EventEmitter {
    constructor(options = {}) {
        super();

        this.options = {
            // Validation strictness
            strict: options.strict || false,

            // Security checks
            checkSecurity: options.checkSecurity !== false,

            // Best practices
            checkBestPractices: options.checkBestPractices !== false,

            // Naming conventions
            checkNaming: options.checkNaming !== false,
            namingConvention: options.namingConvention || 'camelCase',

            // Example validation
            validateExamples: options.validateExamples !== false,

            // Deprecated features
            checkDeprecated: options.checkDeprecated !== false,

            // Custom rules
            customRules: options.customRules || [],

            // Report format
            reportFormat: options.reportFormat || 'detailed',

            // Max issues to report
            maxIssues: options.maxIssues || 100,

            ...options
        };

        this.issues = [];
        this.stats = {
            errors: 0,
            warnings: 0,
            info: 0,
            hints: 0
        };

        this._initializeValidators();
    }

    /**
     * Initialize JSON Schema validators
     */
    _initializeValidators() {
        // OpenAPI 3.0 validator
        this.ajv30 = new AjvDraft04({
            strict: false,
            validateFormats: true
        });
        ajvFormats(this.ajv30);
        this.validateOpenApi30 = this.ajv30.compile(openapi30Schema);

        // OpenAPI 3.1 validator (uses newer JSON Schema)
        this.ajv31 = new Ajv2020({
            strict: false,
            validateFormats: true
        });
        ajvFormats(this.ajv31);
        this.validateOpenApi31 = this.ajv31.compile(openapi31Schema);

        // Swagger 2.0 validator
        this.ajvSwagger = new AjvDraft04({
            strict: false,
            validateFormats: true
        });
        ajvFormats(this.ajvSwagger);
        this.validateSwagger20 = this.ajvSwagger.compile(swagger20Schema);
    }

    /**
     * Validate OpenAPI/Swagger specification
     * @param {object} spec - The specification to validate
     * @param {object} options - Override options for this validation
     * @returns {object} Validation result
     */
    async validate(spec, options = {}) {
        const validationOptions = { ...this.options, ...options };

        // Reset state
        this.issues = [];
        this.stats = { errors: 0, warnings: 0, info: 0, hints: 0 };

        try {
            this.emit('validation:start');

            // Detect format
            const format = this._detectFormat(spec);

            // Schema validation
            await this._validateSchema(spec, format);

            // Additional validations if not too many errors
            if (this.stats.errors < 10) {
                // Reference integrity
                await this._checkReferenceIntegrity(spec);

                // Security checks
                if (validationOptions.checkSecurity) {
                    await this._checkSecurity(spec);
                }

                // Best practices
                if (validationOptions.checkBestPractices) {
                    await this._checkBestPractices(spec);
                }

                // Naming conventions
                if (validationOptions.checkNaming) {
                    await this._checkNamingConventions(spec, validationOptions.namingConvention);
                }

                // Example validation
                if (validationOptions.validateExamples) {
                    await this._validateExamples(spec);
                }

                // Deprecated features
                if (validationOptions.checkDeprecated) {
                    await this._checkDeprecatedFeatures(spec, format);
                }

                // Custom rules
                await this._runCustomRules(spec, validationOptions.customRules);
            }

            // Generate report
            const report = this._generateReport(validationOptions.reportFormat);

            this.emit('validation:complete', report);

            return report;

        } catch (error) {
            this.emit('validation:error', error);
            throw error;
        }
    }

    /**
     * Validate against JSON Schema
     */
    async _validateSchema(spec, format) {
        let valid;
        let validator;

        switch (format) {
            case 'openapi-3.0':
                valid = this.validateOpenApi30(spec);
                validator = this.validateOpenApi30;
                break;
            case 'openapi-3.1':
                valid = this.validateOpenApi31(spec);
                validator = this.validateOpenApi31;
                break;
            case 'swagger-2.0':
                valid = this.validateSwagger20(spec);
                validator = this.validateSwagger20;
                break;
            default:
                this._addIssue(Severity.ERROR, 'Unknown specification format', '/');
                return;
        }

        if (!valid) {
            // Convert AJV errors to our format
            validator.errors.forEach(error => {
                const path = error.instancePath || '/';
                const message = this._formatAjvError(error);
                const suggestion = this._getSuggestionForError(error);

                this._addIssue(
                    Severity.ERROR,
                    message,
                    path,
                    {
                        keyword: error.keyword,
                        params: error.params,
                        suggestion
                    }
                );
            });
        }
    }

    /**
     * Check reference integrity
     */
    async _checkReferenceIntegrity(spec) {
        const refs = new Set();
        const definitions = new Set();

        // Collect all definitions
        this._collectDefinitions(spec, definitions);

        // Collect all references
        this._collectReferences(spec, refs);

        // Check for broken references
        refs.forEach(ref => {
            const pointer = ref.replace('#', '');
            try {
                jsonPointer.get(spec, pointer);
            } catch (error) {
                this._addIssue(
                    Severity.ERROR,
                    `Broken reference: ${ref}`,
                    pointer,
                    {
                        suggestion: 'Check that the referenced schema exists'
                    }
                );
            }
        });

        // Check for unused definitions
        definitions.forEach(def => {
            if (!refs.has(`#${def}`)) {
                this._addIssue(
                    Severity.WARNING,
                    `Unused definition`,
                    def,
                    {
                        suggestion: 'Remove unused definitions to keep spec clean'
                    }
                );
            }
        });
    }

    /**
     * Security checks
     */
    async _checkSecurity(spec) {
        // Check for security schemes
        const securitySchemes = this._getSecuritySchemes(spec);

        if (Object.keys(securitySchemes).length === 0) {
            this._addIssue(
                Severity.WARNING,
                'No security schemes defined',
                '/components/securitySchemes',
                {
                    suggestion: 'Define security schemes for API authentication'
                }
            );
        }

        // Check operations for security
        this._walkOperations(spec, (operation, path, method) => {
            if (!operation.security && !spec.security) {
                this._addIssue(
                    Severity.WARNING,
                    'Operation has no security requirements',
                    `/paths/${path}/${method}`,
                    {
                        suggestion: 'Add security requirements to protect this endpoint'
                    }
                );
            }

            // Check for sensitive data in URLs
            if (path.includes('{password}') || path.includes('{token}') || path.includes('{apiKey}')) {
                this._addIssue(
                    Severity.ERROR,
                    'Sensitive data in URL path',
                    `/paths/${path}`,
                    {
                        suggestion: 'Move sensitive data to headers or request body'
                    }
                );
            }
        });

        // CORS checks
        this._walkOperations(spec, (operation, path, method) => {
            if (method === 'options' && !operation.responses) {
                this._addIssue(
                    Severity.INFO,
                    'OPTIONS endpoint should define CORS headers',
                    `/paths/${path}/${method}`,
                    {
                        suggestion: 'Add CORS headers to OPTIONS response'
                    }
                );
            }
        });
    }

    /**
     * Best practices checks
     */
    async _checkBestPractices(spec) {
        // Check API info
        if (!spec.info.description) {
            this._addIssue(
                Severity.WARNING,
                'Missing API description',
                '/info',
                {
                    suggestion: 'Add a description to help users understand your API'
                }
            );
        }

        if (!spec.info.contact) {
            this._addIssue(
                Severity.INFO,
                'Missing contact information',
                '/info',
                {
                    suggestion: 'Add contact information for API support'
                }
            );
        }

        // Check operations
        this._walkOperations(spec, (operation, path, method) => {
            const operationPath = `/paths/${path}/${method}`;

            // Operation ID
            if (!operation.operationId) {
                this._addIssue(
                    Severity.WARNING,
                    'Missing operationId',
                    operationPath,
                    {
                        suggestion: 'Add operationId for code generation and documentation'
                    }
                );
            } else if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(operation.operationId)) {
                this._addIssue(
                    Severity.WARNING,
                    'OperationId should be a valid identifier',
                    `${operationPath}/operationId`,
                    {
                        suggestion: 'Use camelCase without special characters'
                    }
                );
            }

            // Summary and description
            if (!operation.summary && !operation.description) {
                this._addIssue(
                    Severity.WARNING,
                    'Operation lacks documentation',
                    operationPath,
                    {
                        suggestion: 'Add summary or description to document the operation'
                    }
                );
            }

            // Response codes
            if (!operation.responses || Object.keys(operation.responses).length === 0) {
                this._addIssue(
                    Severity.ERROR,
                    'No responses defined',
                    operationPath,
                    {
                        suggestion: 'Define at least one response (usually 200 or 201)'
                    }
                );
            } else {
                // Check for error responses
                const hasErrorResponse = Object.keys(operation.responses).some(code =>
                    parseInt(code) >= 400
                );

                if (!hasErrorResponse) {
                    this._addIssue(
                        Severity.WARNING,
                        'No error responses defined',
                        `${operationPath}/responses`,
                        {
                            suggestion: 'Add 4xx and 5xx error responses'
                        }
                    );
                }
            }

            // Request body for POST/PUT/PATCH
            if (['post', 'put', 'patch'].includes(method) && !operation.requestBody && !operation.parameters?.some(p => p.in === 'body')) {
                this._addIssue(
                    Severity.INFO,
                    `${method.toUpperCase()} operation without request body`,
                    operationPath,
                    {
                        suggestion: 'Consider if this operation should accept a request body'
                    }
                );
            }
        });

        // Check for consistent versioning
        if (spec.servers) {
            const versions = new Set();
            spec.servers.forEach((server, index) => {
                const versionMatch = server.url.match(/\/v(\d+)/);
                if (versionMatch) {
                    versions.add(versionMatch[1]);
                }
            });

            if (versions.size > 1) {
                this._addIssue(
                    Severity.WARNING,
                    'Multiple API versions in servers',
                    '/servers',
                    {
                        suggestion: 'Consider using separate specs for different API versions'
                    }
                );
            }
        }
    }

    /**
     * Check naming conventions
     */
    async _checkNamingConventions(spec, convention) {
        const conventions = {
            camelCase: /^[a-z][a-zA-Z0-9]*$/,
            snake_case: /^[a-z][a-z0-9_]*$/,
            'kebab-case': /^[a-z][a-z0-9-]*$/,
            PascalCase: /^[A-Z][a-zA-Z0-9]*$/
        };

        const pattern = conventions[convention];
        if (!pattern) return;

        // Check schema properties
        this._walkSchemas(spec, (schema, path) => {
            if (schema.properties) {
                Object.keys(schema.properties).forEach(prop => {
                    if (!pattern.test(prop)) {
                        this._addIssue(
                            Severity.INFO,
                            `Property name doesn't follow ${convention}`,
                            `${path}/properties/${prop}`,
                            {
                                suggestion: `Rename to follow ${convention} convention`
                            }
                        );
                    }
                });
            }
        });

        // Check parameter names
        this._walkOperations(spec, (operation, path, method) => {
            if (operation.parameters) {
                operation.parameters.forEach((param, index) => {
                    if (param.name && !pattern.test(param.name)) {
                        this._addIssue(
                            Severity.INFO,
                            `Parameter name doesn't follow ${convention}`,
                            `/paths/${path}/${method}/parameters/${index}`,
                            {
                                suggestion: `Rename to follow ${convention} convention`
                            }
                        );
                    }
                });
            }
        });
    }

    /**
     * Validate examples against schemas
     */
    async _validateExamples(spec) {
        // Validate component examples
        if (spec.components?.examples) {
            Object.entries(spec.components.examples).forEach(([name, example]) => {
                // Examples in components are standalone, can't validate without context
                if (!example.value) {
                    this._addIssue(
                        Severity.WARNING,
                        'Example missing value',
                        `/components/examples/${name}`,
                        {
                            suggestion: 'Add a value to the example'
                        }
                    );
                }
            });
        }

        // Validate schema examples
        this._walkSchemas(spec, (schema, path) => {
            if (schema.example !== undefined) {
                const valid = this._validateAgainstSchema(schema.example, schema);
                if (!valid) {
                    this._addIssue(
                        Severity.WARNING,
                        'Example does not match schema',
                        `${path}/example`,
                        {
                            suggestion: 'Update example to match the schema definition'
                        }
                    );
                }
            }
        });

        // Validate response examples
        this._walkOperations(spec, (operation, path, method) => {
            if (operation.responses) {
                Object.entries(operation.responses).forEach(([code, response]) => {
                    if (response.content) {
                        Object.entries(response.content).forEach(([mediaType, content]) => {
                            if (content.example && content.schema) {
                                const valid = this._validateAgainstSchema(content.example, content.schema);
                                if (!valid) {
                                    this._addIssue(
                                        Severity.WARNING,
                                        'Response example does not match schema',
                                        `/paths/${path}/${method}/responses/${code}/content/${mediaType}/example`,
                                        {
                                            suggestion: 'Update example to match the response schema'
                                        }
                                    );
                                }
                            }
                        });
                    }
                });
            }
        });
    }

    /**
     * Check for deprecated features
     */
    async _checkDeprecatedFeatures(spec, format) {
        // Check deprecated operations
        this._walkOperations(spec, (operation, path, method) => {
            if (operation.deprecated) {
                this._addIssue(
                    Severity.INFO,
                    'Deprecated operation',
                    `/paths/${path}/${method}`,
                    {
                        suggestion: 'Consider removing or updating deprecated operations'
                    }
                );
            }
        });

        // Format-specific deprecations
        if (format === 'swagger-2.0') {
            // Check for old security definitions
            if (spec.securityDefinitions) {
                Object.entries(spec.securityDefinitions).forEach(([name, def]) => {
                    if (def.type === 'basic' && !def.description?.includes('deprecated')) {
                        this._addIssue(
                            Severity.INFO,
                            'Basic authentication is often considered less secure',
                            `/securityDefinitions/${name}`,
                            {
                                suggestion: 'Consider using OAuth2 or API keys instead'
                            }
                        );
                    }
                });
            }
        }

        // OpenAPI 3.x deprecations
        if (format.startsWith('openapi-3')) {
            // Check for deprecated nullable usage in 3.1
            if (format === 'openapi-3.1') {
                this._walkSchemas(spec, (schema, path) => {
                    if (schema.nullable) {
                        this._addIssue(
                            Severity.WARNING,
                            'nullable is deprecated in OpenAPI 3.1',
                            `${path}/nullable`,
                            {
                                suggestion: 'Use type: ["string", "null"] instead'
                            }
                        );
                    }
                });
            }
        }
    }

    /**
     * Run custom validation rules
     */
    async _runCustomRules(spec, rules) {
        for (const rule of rules) {
            try {
                const issues = await rule(spec, this);
                if (Array.isArray(issues)) {
                    issues.forEach(issue => {
                        this._addIssue(
                            issue.severity || Severity.INFO,
                            issue.message,
                            issue.path,
                            issue.details
                        );
                    });
                }
            } catch (error) {
                this._addIssue(
                    Severity.ERROR,
                    `Custom rule error: ${error.message}`,
                    '/',
                    {
                        rule: rule.name || 'unknown'
                    }
                );
            }
        }
    }

    /**
     * Helper methods
     */

    _detectFormat(spec) {
        if (spec.openapi) {
            if (spec.openapi.startsWith('3.0')) return 'openapi-3.0';
            if (spec.openapi.startsWith('3.1')) return 'openapi-3.1';
        } else if (spec.swagger === '2.0') {
            return 'swagger-2.0';
        }
        throw new Error('Unknown specification format');
    }

    _addIssue(severity, message, path, details = {}) {
        if (this.issues.length >= this.options.maxIssues) return;

        const issue = {
            severity,
            message,
            path,
            ...details
        };

        this.issues.push(issue);
        this.stats[severity + 's']++;

        this.emit('issue', issue);
    }

    _formatAjvError(error) {
        const { keyword, instancePath, message, params } = error;

        switch (keyword) {
            case 'required':
                return `Missing required field: ${params.missingProperty}`;
            case 'additionalProperties':
                return `Additional property not allowed: ${params.additionalProperty}`;
            case 'type':
                return `Invalid type. Expected ${params.type}`;
            case 'enum':
                return `Value must be one of: ${params.allowedValues.join(', ')}`;
            case 'pattern':
                return `String does not match pattern: ${params.pattern}`;
            case 'minimum':
            case 'maximum':
                return message;
            default:
                return message || `Validation failed: ${keyword}`;
        }
    }

    _getSuggestionForError(error) {
        const { keyword, params } = error;

        switch (keyword) {
            case 'required':
                return `Add the required field '${params.missingProperty}'`;
            case 'additionalProperties':
                return `Remove '${params.additionalProperty}' or add it to the schema`;
            case 'type':
                return `Change the value to type: ${params.type}`;
            case 'enum':
                return `Use one of the allowed values`;
            default:
                return null;
        }
    }

    _getSecuritySchemes(spec) {
        if (spec.components?.securitySchemes) {
            return spec.components.securitySchemes;
        } else if (spec.securityDefinitions) {
            return spec.securityDefinitions;
        }
        return {};
    }

    _walkOperations(spec, callback) {
        if (!spec.paths) return;

        Object.entries(spec.paths).forEach(([path, pathItem]) => {
            if (typeof pathItem !== 'object') return;

            ['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace']
                .forEach(method => {
                    if (pathItem[method]) {
                        callback(pathItem[method], path, method);
                    }
                });
        });
    }

    _walkSchemas(spec, callback, visited = new Set()) {
        const walk = (obj, path) => {
            if (!obj || typeof obj !== 'object' || visited.has(obj)) return;
            visited.add(obj);

            // Direct schema object
            if (obj.type || obj.properties || obj.items || obj.allOf || obj.oneOf || obj.anyOf) {
                callback(obj, path);
            }

            // Recurse into objects
            Object.entries(obj).forEach(([key, value]) => {
                if (typeof value === 'object' && value !== null) {
                    walk(value, `${path}/${key}`);
                }
            });
        };

        // Start from common schema locations
        if (spec.components?.schemas) {
            walk(spec.components.schemas, '/components/schemas');
        }
        if (spec.definitions) {
            walk(spec.definitions, '/definitions');
        }

        // Walk through paths for inline schemas
        this._walkOperations(spec, (operation, path, method) => {
            const basePath = `/paths/${path}/${method}`;

            // Request body schemas
            if (operation.requestBody?.content) {
                Object.entries(operation.requestBody.content).forEach(([mediaType, content]) => {
                    if (content.schema) {
                        walk(content.schema, `${basePath}/requestBody/content/${mediaType}/schema`);
                    }
                });
            }

            // Response schemas
            if (operation.responses) {
                Object.entries(operation.responses).forEach(([code, response]) => {
                    if (response.content) {
                        Object.entries(response.content).forEach(([mediaType, content]) => {
                            if (content.schema) {
                                walk(content.schema, `${basePath}/responses/${code}/content/${mediaType}/schema`);
                            }
                        });
                    }
                });
            }

            // Parameter schemas
            if (operation.parameters) {
                operation.parameters.forEach((param, index) => {
                    if (param.schema) {
                        walk(param.schema, `${basePath}/parameters/${index}/schema`);
                    }
                });
            }
        });
    }

    _collectDefinitions(spec, definitions) {
        if (spec.components?.schemas) {
            Object.keys(spec.components.schemas).forEach(name => {
                definitions.add(`/components/schemas/${name}`);
            });
        }
        if (spec.definitions) {
            Object.keys(spec.definitions).forEach(name => {
                definitions.add(`/definitions/${name}`);
            });
        }
    }

    _collectReferences(obj, refs, visited = new Set()) {
        if (!obj || typeof obj !== 'object' || visited.has(obj)) return;
        visited.add(obj);

        if (obj.$ref) {
            refs.add(obj.$ref);
        }

        Object.values(obj).forEach(value => {
            if (typeof value === 'object' && value !== null) {
                this._collectReferences(value, refs, visited);
            }
        });
    }

    _validateAgainstSchema(data, schema) {
        // Simple validation - in real implementation, use AJV
        try {
            const ajv = new AjvDraft04({ strict: false });
            const validate = ajv.compile(schema);
            return validate(data);
        } catch (error) {
            return false;
        }
    }

    /**
     * Generate validation report
     */
    _generateReport(format) {
        const report = {
            valid: this.stats.errors === 0,
            stats: { ...this.stats },
            issues: [...this.issues]
        };

        switch (format) {
            case 'summary':
                return {
                    valid: report.valid,
                    stats: report.stats
                };

            case 'detailed':
                return report;

            case 'json':
                return JSON.stringify(report, null, 2);

            case 'console':
                return this._formatConsoleReport(report);

            default:
                return report;
        }
    }

    _formatConsoleReport(report) {
        const lines = [];

        lines.push(chalk.bold('\nValidation Report'));
        lines.push('='.repeat(50));

        // Stats
        lines.push(chalk.bold('\nSummary:'));
        lines.push(`  Errors:   ${this._colorBySeverity('error', report.stats.errors)}`);
        lines.push(`  Warnings: ${this._colorBySeverity('warning', report.stats.warnings)}`);
        lines.push(`  Info:     ${this._colorBySeverity('info', report.stats.info)}`);
        lines.push(`  Hints:    ${this._colorBySeverity('hint', report.stats.hints)}`);

        // Issues by severity
        if (report.issues.length > 0) {
            lines.push(chalk.bold('\nIssues:'));

            const grouped = this._groupBySeverity(report.issues);

            Object.entries(grouped).forEach(([severity, issues]) => {
                lines.push(`\n${this._getSeverityLabel(severity)}:`);

                issues.forEach(issue => {
                    lines.push(`  ${issue.path}`);
                    lines.push(`    ${issue.message}`);
                    if (issue.suggestion) {
                        lines.push(chalk.gray(`    → ${issue.suggestion}`));
                    }
                });
            });
        }

        // Result
        lines.push('\n' + '='.repeat(50));
        if (report.valid) {
            lines.push(chalk.green('✓ Specification is valid'));
        } else {
            lines.push(chalk.red('✗ Specification has errors'));
        }

        return lines.join('\n');
    }

    _colorBySeverity(severity, count) {
        if (count === 0) return chalk.gray(count);

        switch (severity) {
            case 'error':
                return chalk.red(count);
            case 'warning':
                return chalk.yellow(count);
            case 'info':
                return chalk.blue(count);
            case 'hint':
                return chalk.gray(count);
            default:
                return count;
        }
    }

    _getSeverityLabel(severity) {
        switch (severity) {
            case 'error':
                return chalk.red('Errors');
            case 'warning':
                return chalk.yellow('Warnings');
            case 'info':
                return chalk.blue('Information');
            case 'hint':
                return chalk.gray('Hints');
            default:
                return severity;
        }
    }

    _groupBySeverity(issues) {
        const grouped = {};

        issues.forEach(issue => {
            if (!grouped[issue.severity]) {
                grouped[issue.severity] = [];
            }
            grouped[issue.severity].push(issue);
        });

        // Order by severity
        const ordered = {};
        ['error', 'warning', 'info', 'hint'].forEach(severity => {
            if (grouped[severity]) {
                ordered[severity] = grouped[severity];
            }
        });

        return ordered;
    }
}

module.exports = SwaggerValidator;
module.exports.Severity = Severity;
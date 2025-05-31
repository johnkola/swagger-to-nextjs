/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - AI PROMPT
 * ============================================================================
 * FILE: src/core/SwaggerValidator.js
 * VERSION: 2025-05-30 11:34:23
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
const { EventEmitter } = require('events');
const chalk = require('chalk');

class SwaggerValidator extends EventEmitter {
    constructor(options = {}) {
        super();
        this.options = options;
        this.errors = [];
        this.warnings = [];
        this.validationResult = null;
    }

    async validate(spec) {
        // Reset state
        this.errors = [];
        this.warnings = [];

        console.log(chalk.gray('  [SwaggerValidator] Validating specification...'));

        try {
            // Basic validation
            this._validateBasicStructure(spec);

            // Version validation
            this._validateVersion(spec);

            // Path validation
            this._validatePaths(spec);

            // Schema validation
            this._validateSchemas(spec);

            // Operation validation
            this._validateOperations(spec);

            const result = {
                valid: this.errors.length === 0,
                errors: this.errors,
                warnings: this.warnings,
                stats: {
                    paths: Object.keys(spec.paths || {}).length,
                    operations: this._countOperations(spec),
                    schemas: Object.keys(spec.components?.schemas || spec.definitions || {}).length
                }
            };

            // Log validation summary
            if (this.errors.length > 0) {
                console.log(chalk.red(`  ✗ Validation failed with ${this.errors.length} errors`));
                this.errors.forEach(err => console.log(chalk.red(`    - ${err}`)));
            } else if (this.warnings.length > 0) {
                console.log(chalk.yellow(`  ⚠ Validation passed with ${this.warnings.length} warnings`));
                this.warnings.forEach(warn => console.log(chalk.yellow(`    - ${warn}`)));
            } else {
                console.log(chalk.green('  ✓ Validation passed'));
            }

            this.validationResult = result;
            return result;

        } catch (error) {
            if (error.message === 'Validation failed') {
                throw error;
            }
            this.errors.push(`Unexpected error: ${error.message}`);
            throw new Error('Validation failed');
        }
    }

    _validateBasicStructure(spec) {
        if (!spec) {
            this.errors.push('Swagger document is empty or null');
            throw new Error('Validation failed');
        }

        if (typeof spec !== 'object') {
            this.errors.push('Swagger document must be an object');
            throw new Error('Validation failed');
        }

        if (!spec.paths) {
            this.errors.push('No paths found in Swagger document - required for API generation');
            throw new Error('Validation failed');
        }

        if (Object.keys(spec.paths).length === 0) {
            this.errors.push('No API paths found - nothing to generate');
            throw new Error('Validation failed');
        }

        if (!spec.info) {
            this.warnings.push('No info section found - recommended for proper documentation');
        }
    }

    _validateVersion(spec) {
        if (!spec.openapi && !spec.swagger) {
            this.warnings.push('No OpenAPI/Swagger version specified - may cause compatibility issues');
            return;
        }

        if (spec.openapi) {
            // Accept any 3.x version
            if (!spec.openapi.match(/^3\.\d+\.\d+$/)) {
                this.warnings.push(`OpenAPI version ${spec.openapi} may not be fully supported`);
            } else {
                console.log(chalk.gray(`  Detected OpenAPI version: ${spec.openapi}`));
            }
        } else if (spec.swagger) {
            if (spec.swagger !== '2.0') {
                this.warnings.push(`Swagger version ${spec.swagger} may not be fully supported`);
            } else {
                console.log(chalk.gray(`  Detected Swagger version: ${spec.swagger}`));
            }
        }
    }

    _validatePaths(spec) {
        if (!spec.paths) return;

        Object.entries(spec.paths).forEach(([path, pathItem]) => {
            if (typeof pathItem !== 'object' || pathItem === null) {
                this.errors.push(`Path '${path}' has invalid definition`);
                return;
            }

            // Check for operations
            const operations = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];
            const hasOperations = operations.some(op => pathItem[op]);

            if (!hasOperations) {
                this.warnings.push(`Path '${path}' has no HTTP operations defined`);
            }

            // Check for special characters that might cause issues with Next.js
            if (path.match(/[@#$%^&*()+=\[\]{}|\\:;"'<>,?]/)) {
                this.warnings.push(`Path '${path}' contains special characters that may cause issues with Next.js routing`);
            }

            // Check parameter names
            const paramMatches = path.match(/{([^}]+)}/g);
            if (paramMatches) {
                paramMatches.forEach(param => {
                    const paramName = param.slice(1, -1);
                    if (!paramName.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
                        this.warnings.push(`Parameter '${param}' in path '${path}' may not be valid in Next.js`);
                    }
                });
            }
        });
    }

    _validateOperations(spec) {
        if (!spec.paths) return;

        Object.entries(spec.paths).forEach(([path, pathItem]) => {
            if (typeof pathItem !== 'object') return;

            ['get', 'post', 'put', 'delete', 'patch'].forEach(method => {
                const operation = pathItem[method];
                if (!operation) return;

                const operationPath = `${path}.${method}`;

                // Check responses
                if (!operation.responses) {
                    this.warnings.push(`Operation ${operationPath} has no response definitions`);
                } else {
                    const responseCodes = Object.keys(operation.responses);
                    const hasSuccessResponse = responseCodes.some(code => {
                        const codeNum = parseInt(code);
                        return (codeNum >= 200 && codeNum < 300) || code === 'default';
                    });

                    if (!hasSuccessResponse) {
                        this.warnings.push(`Operation ${operationPath}: No success response defined`);
                    }
                }

                // Check documentation
                if (!operation.summary && !operation.description) {
                    this.warnings.push(`Operation ${operationPath} has no summary or description`);
                }

                // Check parameters
                if (operation.parameters) {
                    operation.parameters.forEach((param, index) => {
                        if (!param.name) {
                            this.errors.push(`Operation ${operationPath}: Parameter at index ${index} has no name`);
                        }
                        if (!param.in) {
                            this.errors.push(`Operation ${operationPath}: Parameter '${param.name || index}' has no location (in)`);
                        }
                        if (!param.schema && !param.type) {
                            this.warnings.push(`Operation ${operationPath}: Parameter '${param.name || index}' has no schema or type`);
                        }
                    });
                }

                // Check request body for operations that typically have one
                if (['post', 'put', 'patch'].includes(method)) {
                    if (!operation.requestBody && !operation.parameters?.some(p => p.in === 'body')) {
                        this.warnings.push(`Operation ${operationPath}: ${method.toUpperCase()} operation typically has a request body`);
                    }
                }
            });
        });
    }

    _validateSchemas(spec) {
        // Check for schemas in OpenAPI 3.x
        if (spec.components?.schemas) {
            Object.entries(spec.components.schemas).forEach(([name, schema]) => {
                if (typeof schema !== 'object' || schema === null) {
                    this.errors.push(`Schema '${name}' has invalid definition`);
                }
            });
            console.log(chalk.gray(`  Found ${Object.keys(spec.components.schemas).length} schemas in components`));
        }
        // Check for definitions in Swagger 2.0
        else if (spec.definitions) {
            Object.entries(spec.definitions).forEach(([name, schema]) => {
                if (typeof schema !== 'object' || schema === null) {
                    this.errors.push(`Definition '${name}' has invalid definition`);
                }
            });
            console.log(chalk.gray(`  Found ${Object.keys(spec.definitions).length} definitions`));
        }
        // No schemas found
        else {
            this.warnings.push('No schemas or definitions found - may limit type generation capabilities');
        }
    }

    _countOperations(spec) {
        let count = 0;
        if (spec.paths) {
            Object.values(spec.paths).forEach(pathItem => {
                if (typeof pathItem === 'object') {
                    ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].forEach(method => {
                        if (pathItem[method]) count++;
                    });
                }
            });
        }
        return count;
    }

    /**
     * Get validation summary for CLI output
     */
    getSummary() {
        if (!this.validationResult) {
            return 'Validation not yet performed';
        }

        const { valid, stats, errors, warnings } = this.validationResult;

        let summary = `Validation ${valid ? 'passed' : 'failed'}. `;
        summary += `Found ${stats.paths} paths, ${stats.operations} operations`;

        if (stats.schemas > 0) {
            summary += `, ${stats.schemas} schemas`;
        }

        if (errors.length > 0) {
            summary += `. ${errors.length} errors`;
        }

        if (warnings.length > 0) {
            summary += `. ${warnings.length} warnings`;
        }

        return summary;
    }

    /**
     * Check if the spec has minimum required structure for generation
     */
    canGenerate() {
        // If no validation has been performed, return false
        if (!this.validationResult) {
            return false;
        }

        // Check if validation passed and has required content
        return this.validationResult.valid &&
            this.validationResult.stats.paths > 0 &&
            this.validationResult.stats.operations > 0;
    }
}

module.exports = SwaggerValidator;
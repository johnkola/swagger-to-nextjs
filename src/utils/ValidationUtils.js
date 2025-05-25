/**
 * ===AI PROMPT ==============================================================
 * FILE: src/utils/ValidationUtils.js
 * VERSION: 2025-05-25 13:22:11
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 * Create validation utilities for input sanitization, parameter validation,
 * and schema compliance checking with detailed error messages.
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
 * FILE: src/utils/ValidationUtils.js
 *
 * AI PROMPT FOR CODE REVIEW/ENHANCEMENT:
 * =====================================
 *
 * You are reviewing validation utilities that convert OpenAPI schemas to Zod validation
 * schemas for Next.js API route validation. These utilities handle complex schema
 * transformations and generate type-safe validation code.
 *
 * RESPONSIBILITIES:
 * - Convert OpenAPI schema definitions to Zod validation schemas
 * - Handle complex validation patterns (nested objects, arrays, unions)
 * - Generate type-safe validation code for API parameters and request bodies
 * - Support various OpenAPI formats and constraints (email, uuid, date-time, etc.)
 * - Handle schema composition (allOf, oneOf, anyOf) and references
 * - Generate comprehensive validation error messages
 *
 * VALIDATION FEATURES:
 * - Complete OpenAPI to Zod schema transformation
 * - Advanced constraint handling (min/max, patterns, enums)
 * - Nested object and array validation
 * - Custom format validation (email, uuid, date formats)
 * - Optional and required field handling
 * - Union and intersection type support
 *
 * REVIEW FOCUS:
 * - Validation accuracy and completeness
 * - Performance optimization for complex schemas
 * - Error message clarity and debugging
 * - Type safety and TypeScript integration
 * - Edge case handling for malformed schemas
 */

class ValidationUtils {
    /**
     * Convert OpenAPI schema to Zod validation type string
     */
    static getZodTypeFromSchema(schema, options = {}) {
        if (!schema) return 'z.unknown()';

        const {optional = false, nullable = false} = options;

        let zodType = this.generateBaseZodType(schema);

        // Handle nullable types
        if (nullable || schema.nullable) {
            zodType = `${zodType}.nullable()`;
        }

        // Handle optional types
        if (optional) {
            zodType = `${zodType}.optional()`;
        }

        return zodType;
    }

    /**
     * Generate base Zod type without modifiers
     */
    static generateBaseZodType(schema) {
        if (!schema || typeof schema !== 'object') {
            return 'z.unknown()';
        }

        // Handle schema references
        if (schema.$ref) {
            // For now, we'll use unknown for references
            // In a full implementation, this would resolve the reference
            return 'z.unknown()';
        }

        // Handle schema composition
        if (schema.allOf) {
            return this.handleAllOf(schema.allOf);
        }

        if (schema.oneOf) {
            return this.handleOneOf(schema.oneOf);
        }

        if (schema.anyOf) {
            return this.handleAnyOf(schema.anyOf);
        }

        // Handle by type
        switch (schema.type) {
            case 'string':
                return this.generateStringValidation(schema);
            case 'integer':
                return this.generateIntegerValidation(schema);
            case 'number':
                return this.generateNumberValidation(schema);
            case 'boolean':
                return 'z.boolean()';
            case 'array':
                return this.generateArrayValidation(schema);
            case 'object':
                return this.generateObjectValidation(schema);
            case 'null':
                return 'z.null()';
            default:
                return 'z.unknown()';
        }
    }

    /**
     * Generate string validation with format and constraints
     */
    static generateStringValidation(schema) {
        let validation = 'z.string()';

        // Handle enums first
        if (schema.enum && Array.isArray(schema.enum)) {
            const enumValues = schema.enum
                .map(v => `'${String(v).replace(/'/g, "\\'")}'`)
                .join(', ');
            return `z.enum([${enumValues}])`;
        }

        // Handle format validations
        if (schema.format) {
            switch (schema.format) {
                case 'email':
                    validation = 'z.string().email()';
                    break;
                case 'uuid':
                    validation = 'z.string().uuid()';
                    break;
                case 'uri':
                case 'url':
                    validation = 'z.string().url()';
                    break;
                case 'date-time':
                    validation = 'z.string().datetime()';
                    break;
                case 'date':
                    validation = 'z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/)';
                    break;
                case 'time':
                    validation = 'z.string().regex(/^\\d{2}:\\d{2}:\\d{2}$/)';
                    break;
                case 'password':
                    // Basic password validation - can be enhanced
                    validation = 'z.string().min(8)';
                    break;
                case 'byte':
                    validation = 'z.string().regex(/^[A-Za-z0-9+/]*={0,2}$/)';
                    break;
                case 'binary':
                    validation = 'z.string()';
                    break;
                default:
                    validation = 'z.string()';
            }
        }

        // Add length constraints
        if (schema.minLength !== undefined) {
            validation += `.min(${schema.minLength})`;
        }
        if (schema.maxLength !== undefined) {
            validation += `.max(${schema.maxLength})`;
        }

        // Add pattern constraint
        if (schema.pattern) {
            const escapedPattern = schema.pattern.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
            validation += `.regex(/${escapedPattern}/)`;
        }

        return validation;
    }

    /**
     * Generate integer validation with constraints
     */
    static generateIntegerValidation(schema) {
        let validation = 'z.number().int()';

        // Add range constraints
        if (schema.minimum !== undefined) {
            validation += `.min(${schema.minimum})`;
        }
        if (schema.maximum !== undefined) {
            validation += `.max(${schema.maximum})`;
        }
        if (schema.exclusiveMinimum !== undefined) {
            validation += `.gt(${schema.exclusiveMinimum})`;
        }
        if (schema.exclusiveMaximum !== undefined) {
            validation += `.lt(${schema.exclusiveMaximum})`;
        }

        // Add multiple constraint
        if (schema.multipleOf !== undefined) {
            validation += `.multipleOf(${schema.multipleOf})`;
        }

        return validation;
    }

    /**
     * Generate number validation with constraints
     */
    static generateNumberValidation(schema) {
        let validation = 'z.number()';

        // Add range constraints
        if (schema.minimum !== undefined) {
            validation += `.min(${schema.minimum})`;
        }
        if (schema.maximum !== undefined) {
            validation += `.max(${schema.maximum})`;
        }
        if (schema.exclusiveMinimum !== undefined) {
            validation += `.gt(${schema.exclusiveMinimum})`;
        }
        if (schema.exclusiveMaximum !== undefined) {
            validation += `.lt(${schema.exclusiveMaximum})`;
        }

        // Add multiple constraint
        if (schema.multipleOf !== undefined) {
            validation += `.multipleOf(${schema.multipleOf})`;
        }

        return validation;
    }

    /**
     * Generate array validation
     */
    static generateArrayValidation(schema) {
        let itemType = 'z.unknown()';

        if (schema.items) {
            itemType = this.getZodTypeFromSchema(schema.items);
        }

        let validation = `z.array(${itemType})`;

        // Add length constraints
        if (schema.minItems !== undefined) {
            validation += `.min(${schema.minItems})`;
        }
        if (schema.maxItems !== undefined) {
            validation += `.max(${schema.maxItems})`;
        }

        // Add uniqueness constraint
        if (schema.uniqueItems) {
            // Zod doesn't have built-in unique validation, so we'll add a custom refine
            validation += `.refine(arr => new Set(arr).size === arr.length, { message: "Array items must be unique" })`;
        }

        return validation;
    }

    /**
     * Generate object validation
     */
    static generateObjectValidation(schema) {
        if (!schema.properties) {
            // Generic object
            if (schema.additionalProperties === false) {
                return 'z.object({}).strict()';
            } else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
                const additionalType = this.getZodTypeFromSchema(schema.additionalProperties);
                return `z.record(${additionalType})`;
            } else {
                return 'z.record(z.unknown())';
            }
        }

        const properties = [];
        const required = schema.required || [];

        Object.entries(schema.properties).forEach(([propName, propSchema]) => {
            const isOptional = !required.includes(propName);
            const propValidation = this.getZodTypeFromSchema(propSchema, {optional: isOptional});

            // Add description as comment if available
            const comment = propSchema.description ? ` // ${propSchema.description}` : '';
            properties.push(`  ${propName}: ${propValidation}${comment}`);
        });

        let validation = `z.object({\n${properties.join(',\n')}\n})`;

        // Handle additional properties
        if (schema.additionalProperties === false) {
            validation += '.strict()';
        }

        // Add property count constraints
        if (schema.minProperties !== undefined || schema.maxProperties !== undefined) {
            const refinements = [];
            if (schema.minProperties !== undefined) {
                refinements.push(`Object.keys(obj).length >= ${schema.minProperties}`);
            }
            if (schema.maxProperties !== undefined) {
                refinements.push(`Object.keys(obj).length <= ${schema.maxProperties}`);
            }
            validation += `.refine(obj => ${refinements.join(' && ')}, { message: "Object property count constraint violation" })`;
        }

        return validation;
    }

    /**
     * Handle allOf schema composition
     */
    static handleAllOf(schemas) {
        if (!Array.isArray(schemas) || schemas.length === 0) {
            return 'z.unknown()';
        }

        if (schemas.length === 1) {
            return this.getZodTypeFromSchema(schemas[0]);
        }

        // For allOf, we need to intersect all schemas
        const zodTypes = schemas.map(schema => this.getZodTypeFromSchema(schema));
        return zodTypes.join('.and(') + ')'.repeat(zodTypes.length - 1);
    }

    /**
     * Handle oneOf schema composition
     */
    static handleOneOf(schemas) {
        if (!Array.isArray(schemas) || schemas.length === 0) {
            return 'z.unknown()';
        }

        if (schemas.length === 1) {
            return this.getZodTypeFromSchema(schemas[0]);
        }

        // For oneOf, we need to create a union
        const zodTypes = schemas.map(schema => this.getZodTypeFromSchema(schema));
        return `z.union([${zodTypes.join(', ')}])`;
    }

    /**
     * Handle anyOf schema composition
     */
    static handleAnyOf(schemas) {
        // anyOf is similar to oneOf in Zod context
        return this.handleOneOf(schemas);
    }

    /**
     * Generate validation schemas for operation parameters
     */
    static generateParameterValidations(parameters) {
        if (!parameters || !Array.isArray(parameters)) {
            return {};
        }

        const validations = {
            query: {},
            path: {},
            header: {},
            cookie: {}
        };

        parameters.forEach(param => {
            if (!param.name || !param.in) return;

            const location = param.in;
            const zodType = this.getZodTypeFromSchema(param.schema, {
                optional: !param.required
            });

            if (validations[location]) {
                validations[location][param.name] = {
                    validation: zodType,
                    description: param.description || '',
                    required: param.required || false,
                    deprecated: param.deprecated || false
                };
            }
        });

        return validations;
    }

    /**
     * Generate complete validation schema object
     */
    static generateValidationSchemaObject(parameters, location = 'query') {
        if (!parameters || !Array.isArray(parameters)) {
            return null;
        }

        const locationParams = parameters.filter(param => param.in === location);
        if (locationParams.length === 0) {
            return null;
        }

        const properties = [];
        locationParams.forEach(param => {
            const zodType = this.getZodTypeFromSchema(param.schema, {
                optional: !param.required
            });

            const comment = param.description ? ` // ${param.description}` : '';
            properties.push(`  ${param.name}: ${zodType}${comment}`);
        });

        return `z.object({\n${properties.join(',\n')}\n})`;
    }

    /**
     * Generate request body validation schema
     */
    static generateRequestBodyValidation(requestBody) {
        if (!requestBody || !requestBody.content) {
            return null;
        }

        // Handle different content types
        const contentTypes = Object.keys(requestBody.content);
        const schemas = [];

        contentTypes.forEach(contentType => {
            const mediaType = requestBody.content[contentType];
            if (mediaType.schema) {
                const zodType = this.getZodTypeFromSchema(mediaType.schema);
                schemas.push({
                    contentType,
                    validation: zodType,
                    description: requestBody.description || ''
                });
            }
        });

        return schemas.length > 0 ? schemas[0] : null; // Return first schema for now
    }

    /**
     * Generate response validation schemas
     */
    static generateResponseValidations(responses) {
        if (!responses || typeof responses !== 'object') {
            return {};
        }

        const validations = {};

        Object.entries(responses).forEach(([statusCode, response]) => {
            if (response.content) {
                const contentSchemas = {};

                Object.entries(response.content).forEach(([contentType, mediaType]) => {
                    if (mediaType.schema) {
                        contentSchemas[contentType] = {
                            validation: this.getZodTypeFromSchema(mediaType.schema),
                            description: response.description || ''
                        };
                    }
                });

                if (Object.keys(contentSchemas).length > 0) {
                    validations[statusCode] = contentSchemas;
                }
            }
        });

        return validations;
    }

    /**
     * Generate custom validation refinements
     */
    static generateCustomRefinements(schema) {
        const refinements = [];

        // Custom business logic refinements can be added here
        if (schema['x-custom-validation']) {
            // Handle custom validation extensions
            const customValidation = schema['x-custom-validation'];
            if (typeof customValidation === 'string') {
                refinements.push(`refine(${customValidation})`);
            }
        }

        return refinements;
    }

    /**
     * Optimize validation schema for performance
     */
    static optimizeValidationSchema(zodString) {
        // Remove redundant validations and optimize the schema
        return zodString
            .replace(/\.optional\(\)\.optional\(\)/g, '.optional()')
            .replace(/\.nullable\(\)\.nullable\(\)/g, '.nullable()')
            .replace(/z\.unknown\(\)\.optional\(\)/g, 'z.unknown().optional()');
    }

    /**
     * Generate validation schema with error messages
     */
    static generateValidationWithMessages(schema, fieldName = 'field') {
        const baseValidation = this.getZodTypeFromSchema(schema);

        // Add custom error messages based on schema constraints
        const messages = [];

        if (schema.minLength !== undefined) {
            messages.push(`min: "${fieldName} must be at least ${schema.minLength} characters long"`);
        }
        if (schema.maxLength !== undefined) {
            messages.push(`max: "${fieldName} must be at most ${schema.maxLength} characters long"`);
        }
        if (schema.minimum !== undefined) {
            messages.push(`min: "${fieldName} must be at least ${schema.minimum}"`);
        }
        if (schema.maximum !== undefined) {
            messages.push(`max: "${fieldName} must be at most ${schema.maximum}"`);
        }
        if (schema.pattern) {
            messages.push(`regex: "${fieldName} format is invalid"`);
        }

        if (messages.length > 0) {
            return `${baseValidation}.withErrorMap((issue, ctx) => ({ message: getCustomMessage(issue, ctx) }))`;
        }

        return baseValidation;
    }
}

module.exports = ValidationUtils;
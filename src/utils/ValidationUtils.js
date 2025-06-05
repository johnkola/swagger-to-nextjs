/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - VALIDATION UTILITIES
 * ============================================================================
 * FILE: src/utils/ValidationUtils.js
 * VERSION: 2025-05-30 11:34:23
 * PHASE: PHASE 3: Code Generation Engine
 * CATEGORY: 🛠️ Utilities
 * ============================================================================
 *
 * PURPOSE:
 * Comprehensive validation utilities for schema validation, code generation
 * validation, and runtime validation generation.
 *
 * ============================================================================
 */

class ValidationUtils {
    constructor() {
        // Validation rule templates
        this.validationRules = {
            required: 'This field is required',
            minLength: 'Must be at least {min} characters',
            maxLength: 'Must be no more than {max} characters',
            min: 'Must be at least {min}',
            max: 'Must be no more than {max}',
            pattern: 'Invalid format',
            email: 'Invalid email address',
            url: 'Invalid URL',
            unique: 'This value must be unique'
        };

        // Common validation patterns
        this.patterns = {
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
            phone: /^\+?[1-9]\d{1,14}$/,
            uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
            alphanumeric: /^[a-zA-Z0-9]+$/,
            slug: /^[a-z0-9-]+$/,
            hexColor: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
            ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
            ipv6: /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/
        };

        // Validation libraries mapping
        this.validationLibraries = {
            zod: {
                name: 'zod',
                import: "import { z } from 'zod';",
                schemaPrefix: 'z.'
            },
            yup: {
                name: 'yup',
                import: "import * as yup from 'yup';",
                schemaPrefix: 'yup.'
            },
            joi: {
                name: 'joi',
                import: "import Joi from 'joi';",
                schemaPrefix: 'Joi.'
            }
        };
    }

    /**
     * Generate validation schema from OpenAPI schema
     * @param {object} schema - OpenAPI schema
     * @param {string} library - Validation library ('zod' | 'yup' | 'joi')
     * @param {object} options - Generation options
     * @returns {string} Validation schema code
     */
    generateValidationSchema(schema, library = 'zod', options = {}) {
        const lib = this.validationLibraries[library];
        if (!lib) {
            throw new Error(`Unsupported validation library: ${library}`);
        }

        switch (library) {
            case 'zod':
                return this._generateZodSchema(schema, options);
            case 'yup':
                return this._generateYupSchema(schema, options);
            case 'joi':
                return this._generateJoiSchema(schema, options);
            default:
                throw new Error(`Unsupported validation library: ${library}`);
        }
    }

    /**
     * Generate React Hook Form validation rules
     * @param {object} schema - OpenAPI schema
     * @returns {object} React Hook Form rules
     */
    generateReactHookFormRules(schema) {
        const rules = {};

        if (!schema) return rules;

        // Required validation
        if (schema.required === true) {
            rules.required = this.validationRules.required;
        }

        // String validations
        if (schema.type === 'string') {
            if (schema.minLength !== undefined) {
                rules.minLength = {
                    value: schema.minLength,
                    message: this.validationRules.minLength.replace('{min}', schema.minLength)
                };
            }

            if (schema.maxLength !== undefined) {
                rules.maxLength = {
                    value: schema.maxLength,
                    message: this.validationRules.maxLength.replace('{max}', schema.maxLength)
                };
            }

            if (schema.pattern) {
                rules.pattern = {
                    value: new RegExp(schema.pattern),
                    message: schema['x-patternMessage'] || this.validationRules.pattern
                };
            }

            if (schema.format) {
                rules.pattern = this._getFormatValidation(schema.format);
            }
        }

        // Number validations
        if (schema.type === 'number' || schema.type === 'integer') {
            if (schema.minimum !== undefined) {
                rules.min = {
                    value: schema.minimum,
                    message: this.validationRules.min.replace('{min}', schema.minimum)
                };
            }

            if (schema.maximum !== undefined) {
                rules.max = {
                    value: schema.maximum,
                    message: this.validationRules.max.replace('{max}', schema.maximum)
                };
            }
        }

        // Custom validation function
        if (schema['x-validation']) {
            rules.validate = this._generateCustomValidation(schema['x-validation']);
        }

        return rules;
    }

    /**
     * Generate Formik validation schema
     * @param {object} schema - OpenAPI schema
     * @returns {string} Formik validation code
     */
    generateFormikValidation(schema) {
        return this.generateValidationSchema(schema, 'yup', {
            export: false,
            name: 'validationSchema'
        });
    }

    /**
     * Validate OpenAPI specification
     * @param {object} spec - OpenAPI specification
     * @returns {object} Validation result
     */
    validateOpenApiSpec(spec) {
        const errors = [];
        const warnings = [];

        // Check required fields
        if (!spec) {
            errors.push('Specification is null or undefined');
            return { valid: false, errors, warnings };
        }

        // OpenAPI 3.0 validation
        if (spec.openapi) {
            if (!spec.openapi.startsWith('3.')) {
                errors.push(`Unsupported OpenAPI version: ${spec.openapi}`);
            }

            if (!spec.info) {
                errors.push('Missing required field: info');
            } else {
                if (!spec.info.title) errors.push('Missing required field: info.title');
                if (!spec.info.version) errors.push('Missing required field: info.version');
            }

            if (!spec.paths) {
                warnings.push('No paths defined');
            }
        }
        // Swagger 2.0 validation
        else if (spec.swagger) {
            if (spec.swagger !== '2.0') {
                errors.push(`Unsupported Swagger version: ${spec.swagger}`);
            }

            if (!spec.info) {
                errors.push('Missing required field: info');
            }
        } else {
            errors.push('Missing OpenAPI or Swagger version');
        }

        // Validate paths
        if (spec.paths) {
            this._validatePaths(spec.paths, errors, warnings);
        }

        // Validate components/definitions
        if (spec.components?.schemas) {
            this._validateSchemas(spec.components.schemas, errors, warnings);
        } else if (spec.definitions) {
            this._validateSchemas(spec.definitions, errors, warnings);
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Generate validation middleware for Express/Next.js
     * @param {object} schema - Request schema
     * @param {string} library - Validation library
     * @returns {string} Middleware code
     */
    generateValidationMiddleware(schema, library = 'zod') {
        const validationSchema = this.generateValidationSchema(schema, library);

        if (library === 'zod') {
            return `
export const validate = (schema) => {
  return async (req, res, next) => {
    try {
      const validated = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      });
      
      req.validated = validated;
      next();
    } catch (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }
  };
};

export const ${schema.operationId || 'request'}Schema = ${validationSchema};
`;
        }

        // Add other library implementations as needed
        return '';
    }

    /**
     * Generate client-side validation functions
     * @param {object} schema - Field schema
     * @returns {string} Validation function code
     */
    generateClientValidation(schema) {
        const validations = [];

        if (!schema) return 'value => true';

        // Required validation
        if (schema.required) {
            validations.push(`
    if (!value && value !== 0) {
      return '${this.validationRules.required}';
    }`);
        }

        // Type validations
        switch (schema.type) {
            case 'string':
                if (schema.minLength) {
                    validations.push(`
    if (value && value.length < ${schema.minLength}) {
      return '${this.validationRules.minLength.replace('{min}', schema.minLength)}';
    }`);
                }

                if (schema.maxLength) {
                    validations.push(`
    if (value && value.length > ${schema.maxLength}) {
      return '${this.validationRules.maxLength.replace('{max}', schema.maxLength)}';
    }`);
                }

                if (schema.pattern) {
                    validations.push(`
    if (value && !/${schema.pattern}/.test(value)) {
      return '${schema['x-patternMessage'] || this.validationRules.pattern}';
    }`);
                }

                if (schema.format) {
                    const formatValidation = this._getFormatValidationFunction(schema.format);
                    if (formatValidation) {
                        validations.push(formatValidation);
                    }
                }
                break;

            case 'number':
            case 'integer':
                if (schema.minimum !== undefined) {
                    validations.push(`
    if (value < ${schema.minimum}) {
      return '${this.validationRules.min.replace('{min}', schema.minimum)}';
    }`);
                }

                if (schema.maximum !== undefined) {
                    validations.push(`
    if (value > ${schema.maximum}) {
      return '${this.validationRules.max.replace('{max}', schema.maximum)}';
    }`);
                }
                break;
        }

        if (validations.length === 0) {
            return 'value => true';
        }

        return `value => {${validations.join('')}
    return true;
  }`;
    }

    /**
     * Extract validation constraints from schema
     * @param {object} schema - OpenAPI schema
     * @returns {object} Validation constraints
     */
    extractValidationConstraints(schema) {
        const constraints = {};

        if (!schema) return constraints;

        // Basic constraints
        if (schema.type) constraints.type = schema.type;
        if (schema.format) constraints.format = schema.format;
        if (schema.required !== undefined) constraints.required = schema.required;

        // String constraints
        if (schema.minLength !== undefined) constraints.minLength = schema.minLength;
        if (schema.maxLength !== undefined) constraints.maxLength = schema.maxLength;
        if (schema.pattern) constraints.pattern = schema.pattern;

        // Number constraints
        if (schema.minimum !== undefined) constraints.minimum = schema.minimum;
        if (schema.maximum !== undefined) constraints.maximum = schema.maximum;
        if (schema.exclusiveMinimum !== undefined) constraints.exclusiveMinimum = schema.exclusiveMinimum;
        if (schema.exclusiveMaximum !== undefined) constraints.exclusiveMaximum = schema.exclusiveMaximum;
        if (schema.multipleOf !== undefined) constraints.multipleOf = schema.multipleOf;

        // Array constraints
        if (schema.minItems !== undefined) constraints.minItems = schema.minItems;
        if (schema.maxItems !== undefined) constraints.maxItems = schema.maxItems;
        if (schema.uniqueItems !== undefined) constraints.uniqueItems = schema.uniqueItems;

        // Object constraints
        if (schema.minProperties !== undefined) constraints.minProperties = schema.minProperties;
        if (schema.maxProperties !== undefined) constraints.maxProperties = schema.maxProperties;

        // Enum constraint
        if (schema.enum) constraints.enum = schema.enum;

        // Custom constraints from extensions
        if (schema['x-constraints']) {
            Object.assign(constraints, schema['x-constraints']);
        }

        return constraints;
    }

    /**
     * Generate HTML5 input attributes from schema
     * @param {object} schema - Field schema
     * @returns {object} HTML attributes
     */
    generateHtmlAttributes(schema) {
        const attributes = {};

        if (!schema) return attributes;

        // Type mapping
        if (schema.type === 'string') {
            if (schema.format === 'email') attributes.type = 'email';
            else if (schema.format === 'uri') attributes.type = 'url';
            else if (schema.format === 'date') attributes.type = 'date';
            else if (schema.format === 'date-time') attributes.type = 'datetime-local';
            else if (schema.format === 'time') attributes.type = 'time';
            else if (schema.format === 'password') attributes.type = 'password';
            else attributes.type = 'text';
        } else if (schema.type === 'number' || schema.type === 'integer') {
            attributes.type = 'number';
        }

        // Validation attributes
        if (schema.required) attributes.required = true;
        if (schema.minLength) attributes.minLength = schema.minLength;
        if (schema.maxLength) attributes.maxLength = schema.maxLength;
        if (schema.minimum !== undefined) attributes.min = schema.minimum;
        if (schema.maximum !== undefined) attributes.max = schema.maximum;
        if (schema.pattern) attributes.pattern = schema.pattern;
        if (schema.multipleOf) attributes.step = schema.multipleOf;

        // Placeholder and description
        if (schema.example) attributes.placeholder = String(schema.example);
        if (schema.description) attributes.title = schema.description;

        // Readonly and disabled
        if (schema.readOnly) attributes.readOnly = true;
        if (schema['x-disabled']) attributes.disabled = true;

        return attributes;
    }

    /**
     * Generate error messages for schema
     * @param {object} schema - OpenAPI schema
     * @param {string} fieldName - Field name
     * @returns {object} Error messages
     */
    generateErrorMessages(schema, fieldName) {
        const messages = {};

        if (!schema) return messages;

        const label = fieldName || 'This field';

        // Required
        if (schema.required) {
            messages.required = schema['x-requiredMessage'] || `${label} is required`;
        }

        // Type-specific messages
        switch (schema.type) {
            case 'string':
                if (schema.minLength) {
                    messages.minLength = schema['x-minLengthMessage'] ||
                        `${label} must be at least ${schema.minLength} characters`;
                }
                if (schema.maxLength) {
                    messages.maxLength = schema['x-maxLengthMessage'] ||
                        `${label} must be no more than ${schema.maxLength} characters`;
                }
                if (schema.pattern) {
                    messages.pattern = schema['x-patternMessage'] ||
                        `${label} has an invalid format`;
                }
                if (schema.format === 'email') {
                    messages.format = `${label} must be a valid email address`;
                }
                if (schema.format === 'uri') {
                    messages.format = `${label} must be a valid URL`;
                }
                break;

            case 'number':
            case 'integer':
                if (schema.minimum !== undefined) {
                    messages.minimum = schema['x-minimumMessage'] ||
                        `${label} must be at least ${schema.minimum}`;
                }
                if (schema.maximum !== undefined) {
                    messages.maximum = schema['x-maximumMessage'] ||
                        `${label} must be no more than ${schema.maximum}`;
                }
                if (schema.type === 'integer') {
                    messages.type = `${label} must be a whole number`;
                }
                break;

            case 'array':
                if (schema.minItems) {
                    messages.minItems = `${label} must have at least ${schema.minItems} items`;
                }
                if (schema.maxItems) {
                    messages.maxItems = `${label} must have no more than ${schema.maxItems} items`;
                }
                break;
        }

        // Enum
        if (schema.enum) {
            messages.enum = `${label} must be one of: ${schema.enum.join(', ')}`;
        }

        return messages;
    }

    /**
     * Validate value against schema
     * @param {any} value - Value to validate
     * @param {object} schema - OpenAPI schema
     * @returns {object} Validation result
     */
    validateValue(value, schema) {
        const errors = [];

        if (!schema) {
            return { valid: true, errors };
        }

        // Required validation
        if (schema.required && (value === null || value === undefined || value === '')) {
            errors.push('Value is required');
        }

        // Type validation
        if (value !== null && value !== undefined) {
            const actualType = this._getValueType(value);

            if (schema.type && actualType !== schema.type) {
                // Special handling for numbers
                if (schema.type === 'number' && actualType === 'integer') {
                    // Integers are valid numbers
                } else {
                    errors.push(`Expected type ${schema.type}, got ${actualType}`);
                }
            }

            // Type-specific validations
            switch (schema.type) {
                case 'string':
                    this._validateString(value, schema, errors);
                    break;
                case 'number':
                case 'integer':
                    this._validateNumber(value, schema, errors);
                    break;
                case 'array':
                    this._validateArray(value, schema, errors);
                    break;
                case 'object':
                    this._validateObject(value, schema, errors);
                    break;
                case 'boolean':
                    // Boolean has no additional validations
                    break;
            }
        }

        // Enum validation
        if (schema.enum && !schema.enum.includes(value)) {
            errors.push(`Value must be one of: ${schema.enum.join(', ')}`);
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    // ============================================================================
    // Private Helper Methods
    // ============================================================================

    /**
     * Generate Zod schema
     * @private
     */
    _generateZodSchema(schema, options = {}) {
        if (!schema) return 'z.any()';

        let zodSchema = '';

        switch (schema.type) {
            case 'string':
                zodSchema = this._generateZodString(schema);
                break;
            case 'number':
            case 'integer':
                zodSchema = this._generateZodNumber(schema);
                break;
            case 'boolean':
                zodSchema = 'z.boolean()';
                break;
            case 'array':
                zodSchema = this._generateZodArray(schema, options);
                break;
            case 'object':
                zodSchema = this._generateZodObject(schema, options);
                break;
            case 'null':
                zodSchema = 'z.null()';
                break;
            default:
                zodSchema = 'z.any()';
        }

        // Add optional if not required
        if (!schema.required && schema.type !== 'object') {
            zodSchema += '.optional()';
        }

        // Add description
        if (schema.description) {
            zodSchema += `.describe('${schema.description.replace(/'/g, "\\'")}')`
        }

        return zodSchema;
    }

    /**
     * Generate Zod string schema
     * @private
     */
    _generateZodString(schema) {
        let zodSchema = 'z.string()';

        if (schema.format) {
            switch (schema.format) {
                case 'email':
                    zodSchema += '.email()';
                    break;
                case 'uri':
                    zodSchema += '.url()';
                    break;
                case 'uuid':
                    zodSchema += '.uuid()';
                    break;
                case 'date':
                case 'date-time':
                    zodSchema += '.datetime()';
                    break;
                default:
                    // Handle other formats as needed
                    break;
            }
        }

        if (schema.minLength !== undefined) {
            zodSchema += `.min(${schema.minLength})`;
        }

        if (schema.maxLength !== undefined) {
            zodSchema += `.max(${schema.maxLength})`;
        }

        if (schema.pattern) {
            zodSchema += `.regex(/${schema.pattern}/)`;
        }

        return zodSchema;
    }

    /**
     * Generate Zod number schema
     * @private
     */
    _generateZodNumber(schema) {
        let zodSchema = schema.type === 'integer' ? 'z.number().int()' : 'z.number()';

        if (schema.minimum !== undefined) {
            zodSchema += `.min(${schema.minimum})`;
        }

        if (schema.maximum !== undefined) {
            zodSchema += `.max(${schema.maximum})`;
        }

        if (schema.multipleOf !== undefined) {
            zodSchema += `.multipleOf(${schema.multipleOf})`;
        }

        return zodSchema;
    }

    /**
     * Generate Zod array schema
     * @private
     */
    _generateZodArray(schema, options) {
        const itemSchema = schema.items
            ? this._generateZodSchema(schema.items, options)
            : 'z.any()';

        let zodSchema = `z.array(${itemSchema})`;

        if (schema.minItems !== undefined) {
            zodSchema += `.min(${schema.minItems})`;
        }

        if (schema.maxItems !== undefined) {
            zodSchema += `.max(${schema.maxItems})`;
        }

        return zodSchema;
    }

    /**
     * Generate Zod object schema
     * @private
     */
    _generateZodObject(schema, options) {
        if (!schema.properties) {
            return 'z.object({})';
        }

        const properties = [];

        for (const [key, propSchema] of Object.entries(schema.properties)) {
            const isRequired = schema.required?.includes(key);
            const propZod = this._generateZodSchema({ ...propSchema, required: isRequired }, options);
            properties.push(`  ${key}: ${propZod}`);
        }

        let zodSchema = `z.object({\n${properties.join(',\n')}\n})`;

        if (schema.additionalProperties === false) {
            zodSchema += '.strict()';
        }

        return zodSchema;
    }

    /**
     * Generate Yup schema
     * @private
     */
    _generateYupSchema(schema, options = {}) {
        if (!schema) return 'yup.mixed()';

        let yupSchema = '';

        switch (schema.type) {
            case 'string':
                yupSchema = this._generateYupString(schema);
                break;
            case 'number':
            case 'integer':
                yupSchema = this._generateYupNumber(schema);
                break;
            case 'boolean':
                yupSchema = 'yup.boolean()';
                break;
            case 'array':
                yupSchema = this._generateYupArray(schema, options);
                break;
            case 'object':
                yupSchema = this._generateYupObject(schema, options);
                break;
            default:
                yupSchema = 'yup.mixed()';
        }

        // Add required/optional
        if (schema.required) {
            yupSchema += '.required()';
        } else if (schema.type !== 'object') {
            yupSchema += '.optional()';
        }

        return yupSchema;
    }

    /**
     * Generate Yup string schema
     * @private
     */
    _generateYupString(schema) {
        let yupSchema = 'yup.string()';

        if (schema.format === 'email') {
            yupSchema += '.email()';
        } else if (schema.format === 'uri') {
            yupSchema += '.url()';
        }

        if (schema.minLength !== undefined) {
            yupSchema += `.min(${schema.minLength})`;
        }

        if (schema.maxLength !== undefined) {
            yupSchema += `.max(${schema.maxLength})`;
        }

        if (schema.pattern) {
            yupSchema += `.matches(/${schema.pattern}/)`;
        }

        return yupSchema;
    }

    /**
     * Generate Yup number schema
     * @private
     */
    _generateYupNumber(schema) {
        let yupSchema = schema.type === 'integer' ? 'yup.number().integer()' : 'yup.number()';

        if (schema.minimum !== undefined) {
            yupSchema += `.min(${schema.minimum})`;
        }

        if (schema.maximum !== undefined) {
            yupSchema += `.max(${schema.maximum})`;
        }

        return yupSchema;
    }

    /**
     * Generate Yup array schema
     * @private
     */
    _generateYupArray(schema, options) {
        const itemSchema = schema.items
            ? this._generateYupSchema(schema.items, options)
            : 'yup.mixed()';

        let yupSchema = `yup.array().of(${itemSchema})`;

        if (schema.minItems !== undefined) {
            yupSchema += `.min(${schema.minItems})`;
        }

        if (schema.maxItems !== undefined) {
            yupSchema += `.max(${schema.maxItems})`;
        }

        return yupSchema;
    }

    /**
     * Generate Yup object schema
     * @private
     */
    _generateYupObject(schema, options) {
        if (!schema.properties) {
            return 'yup.object()';
        }

        const properties = [];

        for (const [key, propSchema] of Object.entries(schema.properties)) {
            const isRequired = schema.required?.includes(key);
            const propYup = this._generateYupSchema({ ...propSchema, required: isRequired }, options);
            properties.push(`  ${key}: ${propYup}`);
        }

        return `yup.object({\n${properties.join(',\n')}\n})`;
    }

    /**
     * Generate Joi schema
     * @private
     */
    _generateJoiSchema(schema, options = {}) {
        if (!schema) return 'Joi.any()';

        let joiSchema = '';

        switch (schema.type) {
            case 'string':
                joiSchema = this._generateJoiString(schema);
                break;
            case 'number':
            case 'integer':
                joiSchema = this._generateJoiNumber(schema);
                break;
            case 'boolean':
                joiSchema = 'Joi.boolean()';
                break;
            case 'array':
                joiSchema = this._generateJoiArray(schema, options);
                break;
            case 'object':
                joiSchema = this._generateJoiObject(schema, options);
                break;
            default:
                joiSchema = 'Joi.any()';
        }

        // Add required/optional
        if (schema.required) {
            joiSchema += '.required()';
        } else {
            joiSchema += '.optional()';
        }

        return joiSchema;
    }

    /**
     * Generate Joi string schema
     * @private
     */
    _generateJoiString(schema) {
        let joiSchema = 'Joi.string()';

        if (schema.format === 'email') {
            joiSchema += '.email()';
        } else if (schema.format === 'uri') {
            joiSchema += '.uri()';
        }

        if (schema.minLength !== undefined) {
            joiSchema += `.min(${schema.minLength})`;
        }

        if (schema.maxLength !== undefined) {
            joiSchema += `.max(${schema.maxLength})`;
        }

        if (schema.pattern) {
            joiSchema += `.pattern(/${schema.pattern}/)`;
        }

        return joiSchema;
    }

    /**
     * Generate Joi number schema
     * @private
     */
    _generateJoiNumber(schema) {
        let joiSchema = schema.type === 'integer' ? 'Joi.number().integer()' : 'Joi.number()';

        if (schema.minimum !== undefined) {
            joiSchema += `.min(${schema.minimum})`;
        }

        if (schema.maximum !== undefined) {
            joiSchema += `.max(${schema.maximum})`;
        }

        return joiSchema;
    }

    /**
     * Generate Joi array schema
     * @private
     */
    _generateJoiArray(schema, options) {
        const itemSchema = schema.items
            ? this._generateJoiSchema(schema.items, options)
            : 'Joi.any()';

        let joiSchema = `Joi.array().items(${itemSchema})`;

        if (schema.minItems !== undefined) {
            joiSchema += `.min(${schema.minItems})`;
        }

        if (schema.maxItems !== undefined) {
            joiSchema += `.max(${schema.maxItems})`;
        }

        return joiSchema;
    }

    /**
     * Generate Joi object schema
     * @private
     */
    _generateJoiObject(schema, options) {
        if (!schema.properties) {
            return 'Joi.object()';
        }

        const properties = [];

        for (const [key, propSchema] of Object.entries(schema.properties)) {
            const isRequired = schema.required?.includes(key);
            const propJoi = this._generateJoiSchema({ ...propSchema, required: isRequired }, options);
            properties.push(`  ${key}: ${propJoi}`);
        }

        return `Joi.object({\n${properties.join(',\n')}\n})`;
    }

    /**
     * Get format validation for React Hook Form
     * @private
     */
    _getFormatValidation(format) {
        switch (format) {
            case 'email':
                return {
                    value: this.patterns.email,
                    message: this.validationRules.email
                };
            case 'uri':
                return {
                    value: this.patterns.url,
                    message: this.validationRules.url
                };
            case 'uuid':
                return {
                    value: this.patterns.uuid,
                    message: 'Invalid UUID format'
                };
            default:
                return null;
        }
    }

    /**
     * Get format validation function
     * @private
     */
    _getFormatValidationFunction(format) {
        switch (format) {
            case 'email':
                return `
    if (value && !${this.patterns.email.toString()}.test(value)) {
      return '${this.validationRules.email}';
    }`;
            case 'uri':
                return `
    if (value && !${this.patterns.url.toString()}.test(value)) {
      return '${this.validationRules.url}';
    }`;
            default:
                return null;
        }
    }

    /**
     * Generate custom validation function
     * @private
     */
    _generateCustomValidation(validation) {
        if (typeof validation === 'string') {
            return new Function('value', validation);
        }
        return validation;
    }

    /**
     * Validate paths
     * @private
     */
    _validatePaths(paths, errors, warnings) {
        for (const [path, pathItem] of Object.entries(paths)) {
            // Check path format
            if (!path.startsWith('/')) {
                errors.push(`Path must start with /: ${path}`);
            }

            // Check for valid operations
            const validOperations = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];
            for (const operation of Object.keys(pathItem)) {
                if (!validOperations.includes(operation) && !operation.startsWith('x-')) {
                    warnings.push(`Unknown operation in path ${path}: ${operation}`);
                }
            }
        }
    }

    /**
     * Validate schemas
     * @private
     */
    _validateSchemas(schemas, errors, warnings) {
        for (const [name, schema] of Object.entries(schemas)) {
            if (!schema.type && !schema.$ref && !schema.oneOf && !schema.anyOf && !schema.allOf) {
                warnings.push(`Schema ${name} has no type specified`);
            }
        }
    }

    /**
     * Get value type
     * @private
     */
    _getValueType(value) {
        if (Array.isArray(value)) return 'array';
        if (value === null) return 'null';
        if (Number.isInteger(value)) return 'integer';
        return typeof value;
    }

    /**
     * Validate string value
     * @private
     */
    _validateString(value, schema, errors) {
        if (typeof value !== 'string') {
            errors.push('Value must be a string');
            return;
        }

        if (schema.minLength !== undefined && value.length < schema.minLength) {
            errors.push(`String length must be at least ${schema.minLength}`);
        }

        if (schema.maxLength !== undefined && value.length > schema.maxLength) {
            errors.push(`String length must be no more than ${schema.maxLength}`);
        }

        if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
            errors.push('String does not match required pattern');
        }

        if (schema.format) {
            this._validateFormat(value, schema.format, errors);
        }
    }

    /**
     * Validate number value
     * @private
     */
    _validateNumber(value, schema, errors) {
        if (typeof value !== 'number') {
            errors.push('Value must be a number');
            return;
        }

        if (schema.type === 'integer' && !Number.isInteger(value)) {
            errors.push('Value must be an integer');
        }

        if (schema.minimum !== undefined && value < schema.minimum) {
            errors.push(`Value must be at least ${schema.minimum}`);
        }

        if (schema.maximum !== undefined && value > schema.maximum) {
            errors.push(`Value must be no more than ${schema.maximum}`);
        }

        if (schema.multipleOf !== undefined && value % schema.multipleOf !== 0) {
            errors.push(`Value must be a multiple of ${schema.multipleOf}`);
        }
    }

    /**
     * Validate array value
     * @private
     */
    _validateArray(value, schema, errors) {
        if (!Array.isArray(value)) {
            errors.push('Value must be an array');
            return;
        }

        if (schema.minItems !== undefined && value.length < schema.minItems) {
            errors.push(`Array must have at least ${schema.minItems} items`);
        }

        if (schema.maxItems !== undefined && value.length > schema.maxItems) {
            errors.push(`Array must have no more than ${schema.maxItems} items`);
        }

        if (schema.uniqueItems && new Set(value).size !== value.length) {
            errors.push('Array items must be unique');
        }

        // Validate items
        if (schema.items) {
            value.forEach((item, index) => {
                const itemResult = this.validateValue(item, schema.items);
                itemResult.errors.forEach(error => {
                    errors.push(`Item ${index}: ${error}`);
                });
            });
        }
    }

    /**
     * Validate object value
     * @private
     */
    _validateObject(value, schema, errors) {
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
            errors.push('Value must be an object');
            return;
        }

        // Validate required properties
        if (schema.required) {
            for (const prop of schema.required) {
                if (!(prop in value)) {
                    errors.push(`Missing required property: ${prop}`);
                }
            }
        }

        // Validate properties
        if (schema.properties) {
            for (const [prop, propValue] of Object.entries(value)) {
                if (schema.properties[prop]) {
                    const propResult = this.validateValue(propValue, schema.properties[prop]);
                    propResult.errors.forEach(error => {
                        errors.push(`Property ${prop}: ${error}`);
                    });
                } else if (schema.additionalProperties === false) {
                    errors.push(`Unexpected property: ${prop}`);
                }
            }
        }

        // Validate property count
        const propCount = Object.keys(value).length;
        if (schema.minProperties !== undefined && propCount < schema.minProperties) {
            errors.push(`Object must have at least ${schema.minProperties} properties`);
        }

        if (schema.maxProperties !== undefined && propCount > schema.maxProperties) {
            errors.push(`Object must have no more than ${schema.maxProperties} properties`);
        }
    }

    /**
     * Validate format
     * @private
     */
    _validateFormat(value, format, errors) {
        switch (format) {
            case 'email':
                if (!this.patterns.email.test(value)) {
                    errors.push('Invalid email format');
                }
                break;
            case 'uri':
                if (!this.patterns.url.test(value)) {
                    errors.push('Invalid URL format');
                }
                break;
            case 'uuid':
                if (!this.patterns.uuid.test(value)) {
                    errors.push('Invalid UUID format');
                }
                break;
            // Add more format validations as needed
        }
    }
}

module.exports = ValidationUtils;
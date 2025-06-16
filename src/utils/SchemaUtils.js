/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - AI PROMPT
 * ============================================================================
 * FILE: src/utils/SchemaUtils.js
 * VERSION: 2025-06-16 16:25:36
 * PHASE: Phase 3: Utility Modules
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 *
 * Build a utility module for converting OpenAPI schemas to TypeScript types
 * and handling schema-related operations. Create functions to convert
 * OpenAPI schema objects to TypeScript type strings, map OpenAPI types
 * (string, integer, number, boolean) to TypeScript types, handle array
 * types with proper TypeScript array syntax, process nested object schemas
 * recursively, resolve $ref references to get actual schema definitions,
 * generate valid TypeScript interface names from schema names, handle
 * nullable types using TypeScript union types, process enum schemas to
 * TypeScript enums or union types, manage schema composition (allOf, oneOf,
 * anyOf), detect and handle circular references, and extract descriptions
 * for JSDoc comments.
 *
 * ============================================================================
 */
class SchemaUtils {
    constructor() {
        // OpenAPI data types mapping
        this.openApiTypes = {
            string: 'string',
            number: 'number',
            integer: 'number',
            boolean: 'boolean',
            array: 'array',
            object: 'object',
            null: 'null'
        };
        // TypeScript type mappings
        this.typeScriptTypes = {
            string: 'string',
            number: 'number',
            integer: 'number',
            boolean: 'boolean',
            array: 'any[]',
            object: 'Record<string, any>',
            null: 'null',
            any: 'any'
        };
        // Zod schema mappings
        this.zodTypes = {
            string: 'z.string()',
            number: 'z.number()',
            integer: 'z.number().int()',
            boolean: 'z.boolean()',
            null: 'z.null()',
            any: 'z.any()'
        };

        // Format mappings
        this.formatMappings = {
            // String formats
            'date': { ts: 'string', zod: 'z.string().datetime()' },
            'date-time': { ts: 'string', zod: 'z.string().datetime()' },
            'time': { ts: 'string', zod: 'z.string().regex(/^([01]\\d|2[0-3]):([0-5]\\d):([0-5]\\d)$/)' },
            'duration': { ts: 'string', zod: 'z.string()' },
            'email': { ts: 'string', zod: 'z.string().email()' },
            'hostname': { ts: 'string', zod: 'z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/)' },
            'ipv4': { ts: 'string', zod: 'z.string().ip({ version: "v4" })' },
            'ipv6': { ts: 'string', zod: 'z.string().ip({ version: "v6" })' },
            'uri': { ts: 'string', zod: 'z.string().url()' },
            'uri-reference': { ts: 'string', zod: 'z.string()' },
            'uuid': { ts: 'string', zod: 'z.string().uuid()' },
            'password': { ts: 'string', zod: 'z.string().min(8)' },
            // Number formats
            'float': { ts: 'number', zod: 'z.number()' },
            'double': { ts: 'number', zod: 'z.number()' },
            'int32': { ts: 'number', zod: 'z.number().int().min(-2147483648).max(2147483647)' },
            'int64': { ts: 'bigint', zod: 'z.bigint()' },
            // Binary formats
            'binary': { ts: 'Blob | Buffer', zod: 'z.instanceof(Blob)' },
            'byte': { ts: 'string', zod: 'z.string().base64()' }
        };

        // Common schema patterns
        this.commonPatterns = {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            url: { type: 'string', format: 'uri' },
            timestamp: { type: 'string', format: 'date-time' },
            date: { type: 'string', format: 'date' },
            phone: { type: 'string', pattern: '^\\+?[1-9]\\d{1,14}$' }
        };
    }

    /**
     * Extract schemas from OpenAPI specification
     * @param {object} spec - OpenAPI/Swagger specification
     * @returns {object} Extracted schemas
     */
    extractSchemas(spec) {
        const schemas = {};

        // OpenAPI 3.0
        if (spec.components?.schemas) {
            Object.assign(schemas, spec.components.schemas);
        }

        // Swagger 2.0
        if (spec.definitions) {
            Object.assign(schemas, spec.definitions);
        }

        // Extract inline schemas from paths
        if (spec.paths) {
            this._extractInlineSchemas(spec.paths, schemas);
        }

        return schemas;
    }

    /**
     * Convert OpenAPI schema to TypeScript interface
     * @param {object} schema - OpenAPI schema
     * @param {string} name - Interface name
     * @param {object} options - Conversion options
     * @returns {string} TypeScript interface
     */
    schemaToTypeScript(schema, name = 'Schema', options = {}) {
        const {
            export: shouldExport = true,
            readonly = false,
            partial = false,
            required = true
        } = options;

        if (!schema) return 'any';

        // Handle references
        if (schema.$ref) {
            return this._extractRefName(schema.$ref);
        }

        // Handle basic types
        if (!schema.type && !schema.oneOf && !schema.anyOf && !schema.allOf) {
            return 'any';
        }

        // Generate interface for objects
        if (schema.type === 'object' || schema.properties) {
            return this._generateTypeScriptInterface(schema, name, {
                export: shouldExport,
                readonly,
                partial,
                required
            });
        }

        // Handle other types
        return this._getTypeScriptType(schema);
    }

    /**
     * Generate Zod validation schema
     * @param {object} schema - OpenAPI schema
     * @param {object} options - Generation options
     * @returns {string} Zod schema code
     */
    generateZodSchema(schema, options = {}) {
        const {
            name = 'schema',
            export: shouldExport = true,
            strict = true
        } = options;

        if (!schema) return 'z.any()';

        const zodSchema = this._schemaToZod(schema, { strict });

        if (shouldExport) {
            return `export const ${name} = ${zodSchema};`;
        }

        return zodSchema;
    }

    /**
     * Find all $ref references in a schema
     * @param {object} schema - Schema to search
     * @returns {string[]} Array of references
     */
    findReferences(schema) {
        const refs = new Set();

        const traverse = (obj) => {
            if (!obj || typeof obj !== 'object') return;

            if (obj.$ref) {
                refs.add(obj.$ref);
            }

            for (const value of Object.values(obj)) {
                if (Array.isArray(value)) {
                    value.forEach(traverse);
                } else if (typeof value === 'object') {
                    traverse(value);
                }
            }
        };

        traverse(schema);
        return Array.from(refs);
    }

    /**
     * Resolve schema references
     * @param {object} schema - Schema with references
     * @param {object} definitions - Schema definitions
     * @returns {object} Resolved schema
     */
    resolveReferences(schema, definitions) {
        if (!schema) return schema;

        // Deep clone to avoid mutations
        const resolved = JSON.parse(JSON.stringify(schema));

        const resolve = (obj) => {
            if (!obj || typeof obj !== 'object') return obj;

            if (obj.$ref) {
                const refName = this._extractRefName(obj.$ref);
                const definition = definitions[refName];

                if (definition) {
                    // Replace reference with resolved definition
                    return resolve(definition);
                }
            }

            for (const [key, value] of Object.entries(obj)) {
                if (Array.isArray(value)) {
                    obj[key] = value.map(resolve);
                } else if (typeof value === 'object') {
                    obj[key] = resolve(value);
                }
            }

            return obj;
        };

        return resolve(resolved);
    }

    /**
     * Merge multiple schemas
     * @param {object[]} schemas - Schemas to merge
     * @returns {object} Merged schema
     */
    mergeSchemas(...schemas) {
        const merged = {
            type: 'object',
            properties: {},
            required: []
        };

        for (const schema of schemas) {
            if (!schema) continue;

            // Merge properties
            if (schema.properties) {
                Object.assign(merged.properties, schema.properties);
            }

            // Merge required fields
            if (schema.required) {
                merged.required = [...new Set([...merged.required, ...schema.required])];
            }

            // Merge other properties
            for (const [key, value] of Object.entries(schema)) {
                if (!['properties', 'required', 'type'].includes(key)) {
                    merged[key] = value;
                }
            }
        }

        return merged;
    }

    /**
     * Generate mock data from schema
     * @param {object} schema - OpenAPI schema
     * @param {object} options - Generation options
     * @returns {any} Mock data
     */
    generateMockData(schema, options = {}) {
        const {
            useExamples = true,
            seed = null
        } = options;

        if (!schema) return null;

        // Use example if available
        if (useExamples && schema.example !== undefined) {
            return schema.example;
        }

        // Handle references
        if (schema.$ref) {
            return `{{${this._extractRefName(schema.$ref)}}}`;
        }

        // Generate based on type
        switch (schema.type) {
            case 'string':
                return this._generateMockString(schema);
            case 'number':
            case 'integer':
                return this._generateMockNumber(schema);
            case 'boolean':
                return Math.random() > 0.5;
            case 'array':
                return this._generateMockArray(schema, options);
            case 'object':
                return this._generateMockObject(schema, options);
            case 'null':
                return null;
            default:
                return null;
        }
    }

    /**
     * Validate schema structure
     * @param {object} schema - Schema to validate
     * @returns {object} Validation result
     */
    validateSchema(schema) {
        const errors = [];
        const warnings = [];

        if (!schema) {
            errors.push('Schema is null or undefined');
            return { valid: false, errors, warnings };
        }

        // Check for type
        if (!schema.type && !schema.$ref && !schema.oneOf && !schema.anyOf && !schema.allOf) {
            warnings.push('Schema has no type specified');
        }

        // Validate object schemas
        if (schema.type === 'object') {
            if (!schema.properties && !schema.additionalProperties) {
                warnings.push('Object schema has no properties defined');
            }

            if (schema.required && !Array.isArray(schema.required)) {
                errors.push('Required field must be an array');
            }

            if (schema.required && schema.properties) {
                for (const field of schema.required) {
                    if (!schema.properties[field]) {
                        errors.push(`Required field "${field}" is not defined in properties`);
                    }
                }
            }
        }

        // Validate array schemas
        if (schema.type === 'array' && !schema.items) {
            errors.push('Array schema must have items defined');
        }

        // Validate string patterns
        if (schema.pattern) {
            try {
                new RegExp(schema.pattern);
            } catch (e) {
                errors.push(`Invalid regex pattern: ${schema.pattern}`);
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Extract form fields from schema
     * @param {object} schema - OpenAPI schema
     * @returns {object[]} Form field definitions
     */
    extractFormFields(schema) {
        const fields = [];

        if (!schema || schema.type !== 'object' || !schema.properties) {
            return fields;
        }

        for (const [name, fieldSchema] of Object.entries(schema.properties)) {
            const field = {
                name,
                type: this._getFormFieldType(fieldSchema),
                label: this._generateLabel(name),
                required: schema.required?.includes(name) || false,
                ...this._extractFieldMetadata(fieldSchema)
            };

            fields.push(field);
        }

        return fields;
    }

    /**
     * Convert schema to JSON Schema
     * @param {object} schema - OpenAPI schema
     * @returns {object} JSON Schema
     */
    toJsonSchema(schema) {
        if (!schema) return {};

        const jsonSchema = {
            $schema: 'http://json-schema.org/draft-07/schema#',
            ...JSON.parse(JSON.stringify(schema))
        };

        // Remove OpenAPI specific properties
        delete jsonSchema.discriminator;
        delete jsonSchema.xml;
        delete jsonSchema.externalDocs;
        delete jsonSchema.example;

        return jsonSchema;
    }

    /**
     * Compare two schemas for compatibility
     * @param {object} schema1 - First schema
     * @param {object} schema2 - Second schema
     * @returns {object} Comparison result
     */
    compareSchemas(schema1, schema2) {
        const differences = {
            compatible: true,
            addedFields: [],
            removedFields: [],
            changedFields: [],
            typeChanges: []
        };

        if (schema1.type !== schema2.type) {
            differences.compatible = false;
            differences.typeChanges.push({
                from: schema1.type,
                to: schema2.type
            });
        }

        if (schema1.type === 'object' && schema2.type === 'object') {
            const props1 = schema1.properties || {};
            const props2 = schema2.properties || {};

            // Check for added fields
            for (const key of Object.keys(props2)) {
                if (!props1[key]) {
                    differences.addedFields.push(key);
                }
            }

            // Check for removed fields
            for (const key of Object.keys(props1)) {
                if (!props2[key]) {
                    differences.removedFields.push(key);
                    if (schema1.required?.includes(key)) {
                        differences.compatible = false;
                    }
                }
            }

            // Check for changed fields
            for (const key of Object.keys(props1)) {
                if (props2[key] && !this._schemasEqual(props1[key], props2[key])) {
                    differences.changedFields.push(key);
                }
            }
        }

        return differences;
    }

    // ============================================================================
    // Private Helper Methods
    // ============================================================================

    /**
     * Extract inline schemas from paths
     * @private
     */
    _extractInlineSchemas(paths, schemas) {
        const schemaIndex = { request: 0, response: 0 };

        for (const [path, pathItem] of Object.entries(paths)) {
            for (const [method, operation] of Object.entries(pathItem)) {
                if (typeof operation !== 'object') continue;

                // Extract request body schemas
                if (operation.requestBody?.content) {
                    for (const [contentType, content] of Object.entries(operation.requestBody.content)) {
                        if (content.schema && !content.schema.$ref) {
                            const schemaName = `${this._pathToName(path)}${this._capitalize(method)}Request`;
                            schemas[schemaName] = content.schema;
                        }
                    }
                }

                // Extract response schemas
                if (operation.responses) {
                    for (const [statusCode, response] of Object.entries(operation.responses)) {
                        if (response.content) {
                            for (const [contentType, content] of Object.entries(response.content)) {
                                if (content.schema && !content.schema.$ref) {
                                    const schemaName = `${this._pathToName(path)}${this._capitalize(method)}Response${statusCode}`;
                                    schemas[schemaName] = content.schema;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * Generate TypeScript interface
     * @private
     */
    _generateTypeScriptInterface(schema, name, options) {
        const lines = [];
        const { export: shouldExport, readonly, partial, required } = options;

        // Interface declaration
        lines.push(`${shouldExport ? 'export ' : ''}interface ${name} {`);

        // Properties
        if (schema.properties) {
            for (const [propName, propSchema] of Object.entries(schema.properties)) {
                const isRequired = required && schema.required?.includes(propName);
                const optional = partial || !isRequired ? '?' : '';
                const readonlyMod = readonly ? 'readonly ' : '';
                const propType = this._getTypeScriptType(propSchema);
                const comment = propSchema.description ? `  /** ${propSchema.description} */\n` : '';

                lines.push(`${comment}  ${readonlyMod}${propName}${optional}: ${propType};`);
            }
        }

        // Additional properties
        if (schema.additionalProperties) {
            const valueType = typeof schema.additionalProperties === 'object'
                ? this._getTypeScriptType(schema.additionalProperties)
                : 'any';
            lines.push(`  [key: string]: ${valueType};`);
        }

        lines.push('}');

        return lines.join('\n');
    }

    /**
     * Get TypeScript type for schema
     * @private
     */
    _getTypeScriptType(schema) {
        if (!schema) return 'any';

        // Handle references
        if (schema.$ref) {
            return this._extractRefName(schema.$ref);
        }

        // Handle combined schemas
        if (schema.oneOf) {
            return schema.oneOf.map(s => this._getTypeScriptType(s)).join(' | ');
        }

        if (schema.anyOf) {
            return schema.anyOf.map(s => this._getTypeScriptType(s)).join(' | ');
        }

        if (schema.allOf) {
            return schema.allOf.map(s => this._getTypeScriptType(s)).join(' & ');
        }

        // Handle enums
        if (schema.enum) {
            return schema.enum.map(v => typeof v === 'string' ? `'${v}'` : v).join(' | ');
        }

        // Handle arrays
        if (schema.type === 'array') {
            const itemType = schema.items ? this._getTypeScriptType(schema.items) : 'any';
            return `${itemType}[]`;
        }

        // Handle objects
        if (schema.type === 'object') {
            if (!schema.properties) {
                return 'Record<string, any>';
            }
            // Generate inline interface
            return this._generateInlineInterface(schema);
        }

        // Handle formatted types
        if (schema.format && this.formatMappings[schema.format]) {
            return this.formatMappings[schema.format].ts;
        }

        // Handle basic types
        return this.typeScriptTypes[schema.type] || 'any';
    }

    /**
     * Convert schema to Zod
     * @private
     */
    _schemaToZod(schema, options = {}) {
        if (!schema) return 'z.any()';

        // Handle references
        if (schema.$ref) {
            return this._extractRefName(schema.$ref) + 'Schema';
        }

        // Handle combined schemas
        if (schema.oneOf) {
            const schemas = schema.oneOf.map(s => this._schemaToZod(s, options));
            return `z.union([${schemas.join(', ')}])`;
        }

        if (schema.anyOf) {
            const schemas = schema.anyOf.map(s => this._schemaToZod(s, options));
            return `z.union([${schemas.join(', ')}])`;
        }

        if (schema.allOf) {
            const schemas = schema.allOf.map(s => this._schemaToZod(s, options));
            return schemas.length > 1
                ? `z.intersection(${schemas.join(', ')})`
                : schemas[0];
        }

        // Handle enums
        if (schema.enum) {
            const values = schema.enum.map(v => typeof v === 'string' ? `'${v}'` : v);
            return `z.enum([${values.join(', ')}])`;
        }

        // Handle arrays
        if (schema.type === 'array') {
            const itemSchema = schema.items ? this._schemaToZod(schema.items, options) : 'z.any()';
            let arraySchema = `z.array(${itemSchema})`;

            if (schema.minItems !== undefined) {
                arraySchema += `.min(${schema.minItems})`;
            }
            if (schema.maxItems !== undefined) {
                arraySchema += `.max(${schema.maxItems})`;
            }

            return arraySchema;
        }

        // Handle objects
        if (schema.type === 'object') {
            return this._generateZodObject(schema, options);
        }

        // Handle strings
        if (schema.type === 'string') {
            return this._generateZodString(schema);
        }

        // Handle numbers
        if (schema.type === 'number' || schema.type === 'integer') {
            return this._generateZodNumber(schema);
        }

        // Handle formatted types
        if (schema.format && this.formatMappings[schema.format]) {
            return this.formatMappings[schema.format].zod;
        }

        // Handle basic types
        return this.zodTypes[schema.type] || 'z.any()';
    }

    /**
     * Generate Zod object schema
     * @private
     */
    _generateZodObject(schema, options) {
        if (!schema.properties) {
            return schema.additionalProperties === false
                ? 'z.object({}).strict()'
                : 'z.record(z.any())';
        }

        const properties = [];

        for (const [propName, propSchema] of Object.entries(schema.properties)) {
            const propZod = this._schemaToZod(propSchema, options);
            const isRequired = schema.required?.includes(propName);

            properties.push(`  ${propName}: ${propZod}${isRequired ? '' : '.optional()'}`);
        }

        let objectSchema = `z.object({\n${properties.join(',\n')}\n})`;

        if (options.strict && schema.additionalProperties === false) {
            objectSchema += '.strict()';
        }

        return objectSchema;
    }

    /**
     * Generate Zod string schema
     * @private
     */
    _generateZodString(schema) {
        let zodSchema = 'z.string()';

        if (schema.format && this.formatMappings[schema.format]) {
            return this.formatMappings[schema.format].zod;
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
     * Extract reference name
     * @private
     */
    _extractRefName(ref) {
        const parts = ref.split('/');
        return parts[parts.length - 1];
    }

    /**
     * Convert path to name
     * @private
     */
    _pathToName(path) {
        return path
            .split('/')
            .filter(Boolean)
            .map(part => part.replace(/[{}]/g, ''))
            .map(part => this._capitalize(part))
            .join('');
    }

    /**
     * Capitalize string
     * @private
     */
    _capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Generate inline interface
     * @private
     */
    _generateInlineInterface(schema) {
        if (!schema.properties) return 'Record<string, any>';

        const props = Object.entries(schema.properties).map(([key, value]) => {
            const required = schema.required?.includes(key) ? '' : '?';
            const type = this._getTypeScriptType(value);
            return `${key}${required}: ${type}`;
        });

        return `{ ${props.join('; ')} }`;
    }

    /**
     * Generate mock string
     * @private
     */
    _generateMockString(schema) {
        if (schema.enum) {
            return schema.enum[0];
        }

        if (schema.format) {
            switch (schema.format) {
                case 'email': return 'user@example.com';
                case 'uri': return 'https://example.com';
                case 'uuid': return '123e4567-e89b-12d3-a456-426614174000';
                case 'date': return '2024-01-01';
                case 'date-time': return '2024-01-01T00:00:00Z';
                default: return 'string';
            }
        }

        if (schema.pattern) {
            return 'pattern-string';
        }

        return schema.default || 'string';
    }

    /**
     * Generate mock number
     * @private
     */
    _generateMockNumber(schema) {
        if (schema.enum) {
            return schema.enum[0];
        }

        const min = schema.minimum || 0;
        const max = schema.maximum || 100;

        if (schema.type === 'integer') {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }

        return Math.random() * (max - min) + min;
    }

    /**
     * Generate mock array
     * @private
     */
    _generateMockArray(schema, options) {
        const length = schema.minItems || 1;
        const items = [];

        for (let i = 0; i < length; i++) {
            items.push(this.generateMockData(schema.items, options));
        }

        return items;
    }

    /**
     * Generate mock object
     * @private
     */
    _generateMockObject(schema, options) {
        const obj = {};

        if (schema.properties) {
            for (const [key, propSchema] of Object.entries(schema.properties)) {
                obj[key] = this.generateMockData(propSchema, options);
            }
        }

        return obj;
    }

    /**
     * Get form field type
     * @private
     */
    _getFormFieldType(schema) {
        if (schema.enum) return 'select';

        switch (schema.type) {
            case 'string':
                if (schema.format === 'email') return 'email';
                if (schema.format === 'uri') return 'url';
                if (schema.format === 'date') return 'date';
                if (schema.format === 'date-time') return 'datetime';
                if (schema.format === 'password') return 'password';
                if (schema.maxLength && schema.maxLength > 255) return 'textarea';
                return 'text';

            case 'number':
            case 'integer':
                return 'number';

            case 'boolean':
                return 'checkbox';

            case 'array':
                return 'multiselect';

            case 'object':
                return 'fieldset';

            default:
                return 'text';
        }
    }

    /**
     * Generate label from property name
     * @private
     */
    _generateLabel(name) {
        return name
            .replace(/([A-Z])/g, ' $1')
            .replace(/[_-]/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
            .trim();
    }

    /**
     * Extract field metadata
     * @private
     */
    _extractFieldMetadata(schema) {
        const metadata = {};

        if (schema.description) metadata.description = schema.description;
        if (schema.default !== undefined) metadata.defaultValue = schema.default;
        if (schema.example !== undefined) metadata.placeholder = schema.example;
        if (schema.enum) metadata.options = schema.enum;
        if (schema.minimum !== undefined) metadata.min = schema.minimum;
        if (schema.maximum !== undefined) metadata.max = schema.maximum;
        if (schema.minLength !== undefined) metadata.minLength = schema.minLength;
        if (schema.maxLength !== undefined) metadata.maxLength = schema.maxLength;
        if (schema.pattern) metadata.pattern = schema.pattern;
        if (schema.multipleOf !== undefined) metadata.step = schema.multipleOf;

        return metadata;
    }

    /**
     * Check if schemas are equal
     * @private
     */
    _schemasEqual(schema1, schema2) {
        // Simple comparison - could be enhanced
        return JSON.stringify(schema1) === JSON.stringify(schema2);
    }
}

module.exports = SchemaUtils;
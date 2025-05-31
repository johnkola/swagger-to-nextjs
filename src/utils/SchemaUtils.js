/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - AI PROMPT
 * ============================================================================
 * FILE: src/utils/SchemaUtils.js
 * VERSION: 2025-05-30 11:34:23
 * PHASE: PHASE 3: Code Generation Engine
 * CATEGORY: 🛠️ Utility Functions
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 *
 * Build advanced schema utilities that:
 * - Convert OpenAPI schemas to TypeScript interfaces 
 * - Handle complex schema compositions (allOf, oneOf, anyOf) 
 * - Implement circular reference resolution 
 * - Generate Zod validation schemas 
 * - Support for custom format handlers 
 * - Implement schema simplification 
 * - Generate mock data from schemas 
 * - Support schema extensions 
 * - Handle discriminated unions 
 * - Implement schema documentation extraction
 *
 * ============================================================================
 */
const { compile } = require('json-schema-to-typescript');
const { z } = require('zod');
const RefParser = require('@apidevtools/json-schema-ref-parser');

/**
 * Advanced schema utilities for OpenAPI to TypeScript/Zod conversion
 */
class SchemaUtils {
    /**
     * Convert OpenAPI schema to TypeScript interface
     * @param {Object} schema - OpenAPI schema object
     * @param {string} name - Interface name
     * @param {Object} options - Conversion options
     * @returns {Promise<string>} TypeScript interface definition
     */
    static async convertToTypeScript(schema, name, options = {}) {
        const {
            bannerComment = '',
            style = {
                bracketSpacing: true,
                printWidth: 120,
                semi: true,
                singleQuote: true,
                tabWidth: 2,
                useTabs: false
            },
            strictIndexSignatures = false,
            enableConstEnums = true,
            declarationKeyword = 'interface',
            unknownAny = false,
            unreachableDefinitions = false,
            additionalProperties = false,
            ignoreMinAndMaxItems = false,
            format = true
        } = options;

        try {
            // Dereference schema if needed
            const dereferencedSchema = await this.dereferenceSchema(schema, options);

            // Handle OpenAPI specific properties
            const processedSchema = this.processOpenApiSchema(dereferencedSchema);

            // Handle complex schema compositions
            const resolvedSchema = this.resolveSchemaComposition(processedSchema);

            // Convert to TypeScript
            const typescript = await compile(resolvedSchema, name, {
                bannerComment,
                style,
                strictIndexSignatures,
                enableConstEnums,
                declareExternallyReferenced: declarationKeyword === 'declare',
                unknownAny,
                unreachableDefinitions,
                additionalProperties,
                ignoreMinAndMaxItems,
                format
            });

            // Post-process TypeScript
            return this.postProcessTypeScript(typescript, options);
        } catch (error) {
            throw new Error(`Failed to convert schema to TypeScript: ${error.message}`);
        }
    }

    /**
     * Generate Zod validation schema from OpenAPI schema
     * @param {Object} schema - OpenAPI schema
     * @param {string} name - Schema name
     * @param {Object} options - Generation options
     * @returns {string} Zod schema code
     */
    static generateZodSchema(schema, name, options = {}) {
        const {
            strict = true,
            coerce = false,
            stripUnknown = true,
            customValidators = {},
            importPath = 'zod'
        } = options;

        const zodSchemaLines = [];
        const imports = new Set([`import { z } from '${importPath}';`]);
        const schemas = new Map();

        // Generate schema
        const schemaCode = this.schemaToZod(schema, {
            name,
            strict,
            coerce,
            customValidators,
            schemas,
            imports
        });

        // Build output
        zodSchemaLines.push(...Array.from(imports));
        zodSchemaLines.push('');

        // Add referenced schemas first
        schemas.forEach((code, schemaName) => {
            if (schemaName !== name) {
                zodSchemaLines.push(`export const ${schemaName}Schema = ${code};`);
                zodSchemaLines.push(`export type ${schemaName} = z.infer<typeof ${schemaName}Schema>;`);
                zodSchemaLines.push('');
            }
        });

        // Add main schema
        zodSchemaLines.push(`export const ${name}Schema = ${schemaCode};`);
        zodSchemaLines.push(`export type ${name} = z.infer<typeof ${name}Schema>;`);

        return zodSchemaLines.join('\n');
    }

    /**
     * Convert schema to Zod code
     * @param {Object} schema - Schema object
     * @param {Object} context - Conversion context
     * @returns {string} Zod schema code
     */
    static schemaToZod(schema, context) {
        if (!schema) {
            return 'z.unknown()';
        }

        // Handle references
        if (schema.$ref) {
            const refName = this.extractRefName(schema.$ref);
            const schemaName = this.toPascalCase(refName) + 'Schema';

            // Check if we've already generated this schema
            if (!context.schemas.has(schemaName)) {
                // Mark as in-progress to prevent infinite recursion
                context.schemas.set(schemaName, 'z.lazy(() => ' + schemaName + ')');
            }

            return schemaName;
        }

        // Handle compositions
        if (schema.allOf) {
            return this.allOfToZod(schema.allOf, context);
        }

        if (schema.oneOf) {
            return this.oneOfToZod(schema.oneOf, context);
        }

        if (schema.anyOf) {
            return this.anyOfToZod(schema.anyOf, context);
        }

        // Handle discriminated unions
        if (schema.discriminator) {
            return this.discriminatorToZod(schema, context);
        }

        // Handle basic types
        const type = schema.type || this.inferType(schema);

        switch (type) {
            case 'string':
                return this.stringToZod(schema, context);
            case 'number':
            case 'integer':
                return this.numberToZod(schema, context);
            case 'boolean':
                return this.booleanToZod(schema, context);
            case 'array':
                return this.arrayToZod(schema, context);
            case 'object':
                return this.objectToZod(schema, context);
            case 'null':
                return 'z.null()';
            default:
                return 'z.unknown()';
        }
    }

    /**
     * Convert string schema to Zod
     * @param {Object} schema - String schema
     * @param {Object} context - Context
     * @returns {string} Zod string code
     */
    static stringToZod(schema, context) {
        let zod = context.coerce ? 'z.coerce.string()' : 'z.string()';

        // Handle enums
        if (schema.enum) {
            const enumValues = schema.enum.map(v => JSON.stringify(v)).join(', ');
            return `z.enum([${enumValues}])`;
        }

        // Apply constraints
        if (schema.minLength !== undefined) {
            zod += `.min(${schema.minLength})`;
        }

        if (schema.maxLength !== undefined) {
            zod += `.max(${schema.maxLength})`;
        }

        if (schema.pattern) {
            zod += `.regex(/${schema.pattern}/)`;
        }

        // Handle formats
        if (schema.format) {
            switch (schema.format) {
                case 'email':
                    zod += '.email()';
                    break;
                case 'uri':
                case 'url':
                    zod += '.url()';
                    break;
                case 'uuid':
                    zod += '.uuid()';
                    break;
                case 'date':
                case 'date-time':
                    zod += '.datetime()';
                    break;
                case 'ipv4':
                    zod += '.ip({ version: "v4" })';
                    break;
                case 'ipv6':
                    zod += '.ip({ version: "v6" })';
                    break;
                default:
                    // Custom format handler
                    if (context.customValidators[schema.format]) {
                        zod += `.refine(${context.customValidators[schema.format]})`;
                    }
            }
        }

        // Add description as comment
        if (schema.description) {
            zod += `.describe(${JSON.stringify(schema.description)})`;
        }

        // Handle nullable
        if (schema.nullable) {
            zod = `${zod}.nullable()`;
        }

        return zod;
    }

    /**
     * Convert number schema to Zod
     * @param {Object} schema - Number schema
     * @param {Object} context - Context
     * @returns {string} Zod number code
     */
    static numberToZod(schema, context) {
        const baseType = schema.type === 'integer' ? 'int' : 'number';
        let zod = context.coerce ? `z.coerce.${baseType}()` : `z.${baseType}()`;

        // Apply constraints
        if (schema.minimum !== undefined) {
            zod += `.min(${schema.minimum})`;
        } else if (schema.exclusiveMinimum !== undefined) {
            zod += `.gt(${schema.exclusiveMinimum})`;
        }

        if (schema.maximum !== undefined) {
            zod += `.max(${schema.maximum})`;
        } else if (schema.exclusiveMaximum !== undefined) {
            zod += `.lt(${schema.exclusiveMaximum})`;
        }

        if (schema.multipleOf !== undefined) {
            zod += `.multipleOf(${schema.multipleOf})`;
        }

        // Add description
        if (schema.description) {
            zod += `.describe(${JSON.stringify(schema.description)})`;
        }

        // Handle nullable
        if (schema.nullable) {
            zod = `${zod}.nullable()`;
        }

        return zod;
    }

    /**
     * Convert boolean schema to Zod
     * @param {Object} schema - Boolean schema
     * @param {Object} context - Context
     * @returns {string} Zod boolean code
     */
    static booleanToZod(schema, context) {
        let zod = context.coerce ? 'z.coerce.boolean()' : 'z.boolean()';

        if (schema.description) {
            zod += `.describe(${JSON.stringify(schema.description)})`;
        }

        if (schema.nullable) {
            zod = `${zod}.nullable()`;
        }

        return zod;
    }

    /**
     * Convert array schema to Zod
     * @param {Object} schema - Array schema
     * @param {Object} context - Context
     * @returns {string} Zod array code
     */
    static arrayToZod(schema, context) {
        const items = schema.items || { type: 'unknown' };
        const itemSchema = this.schemaToZod(items, context);

        let zod = `z.array(${itemSchema})`;

        // Apply constraints
        if (schema.minItems !== undefined) {
            zod += `.min(${schema.minItems})`;
        }

        if (schema.maxItems !== undefined) {
            zod += `.max(${schema.maxItems})`;
        }

        if (schema.uniqueItems) {
            // Note: Zod doesn't have built-in unique validation
            zod += `.refine((items) => new Set(items).size === items.length, { message: "Array must contain unique items" })`;
        }

        if (schema.description) {
            zod += `.describe(${JSON.stringify(schema.description)})`;
        }

        if (schema.nullable) {
            zod = `${zod}.nullable()`;
        }

        return zod;
    }

    /**
     * Convert object schema to Zod
     * @param {Object} schema - Object schema
     * @param {Object} context - Context
     * @returns {string} Zod object code
     */
    static objectToZod(schema, context) {
        const properties = schema.properties || {};
        const required = schema.required || [];

        // Build property schemas
        const propertySchemas = [];

        for (const [propName, propSchema] of Object.entries(properties)) {
            const propZod = this.schemaToZod(propSchema, context);
            const isRequired = required.includes(propName);
            const safePropName = this.safePropName(propName);

            if (isRequired) {
                propertySchemas.push(`${safePropName}: ${propZod}`);
            } else {
                propertySchemas.push(`${safePropName}: ${propZod}.optional()`);
            }
        }

        let zod = `z.object({\n  ${propertySchemas.join(',\n  ')}\n})`;

        // Handle additional properties
        if (schema.additionalProperties === false) {
            zod += '.strict()';
        } else if (schema.additionalProperties === true) {
            zod += '.passthrough()';
        } else if (typeof schema.additionalProperties === 'object') {
            const additionalSchema = this.schemaToZod(schema.additionalProperties, context);
            zod += `.catchall(${additionalSchema})`;
        }

        if (schema.description) {
            zod += `.describe(${JSON.stringify(schema.description)})`;
        }

        if (schema.nullable) {
            zod = `${zod}.nullable()`;
        }

        return zod;
    }

    /**
     * Convert allOf composition to Zod
     * @param {Array} schemas - Array of schemas
     * @param {Object} context - Context
     * @returns {string} Zod intersection code
     */
    static allOfToZod(schemas, context) {
        const zodSchemas = schemas.map(s => this.schemaToZod(s, context));

        if (zodSchemas.length === 1) {
            return zodSchemas[0];
        }

        return `z.intersection(\n  ${zodSchemas.join(',\n  ')}\n)`;
    }

    /**
     * Convert oneOf composition to Zod
     * @param {Array} schemas - Array of schemas
     * @param {Object} context - Context
     * @returns {string} Zod union code
     */
    static oneOfToZod(schemas, context) {
        const zodSchemas = schemas.map(s => this.schemaToZod(s, context));

        if (zodSchemas.length === 1) {
            return zodSchemas[0];
        }

        return `z.union([\n  ${zodSchemas.join(',\n  ')}\n])`;
    }

    /**
     * Convert anyOf composition to Zod
     * @param {Array} schemas - Array of schemas
     * @param {Object} context - Context
     * @returns {string} Zod union code
     */
    static anyOfToZod(schemas, context) {
        // anyOf is treated like oneOf in Zod
        return this.oneOfToZod(schemas, context);
    }

    /**
     * Convert discriminated union to Zod
     * @param {Object} schema - Schema with discriminator
     * @param {Object} context - Context
     * @returns {string} Zod discriminated union code
     */
    static discriminatorToZod(schema, context) {
        const discriminatorField = schema.discriminator.propertyName;
        const mapping = schema.discriminator.mapping || {};

        const unionSchemas = [];

        for (const [value, ref] of Object.entries(mapping)) {
            const refSchema = { $ref: ref };
            const baseSchema = this.schemaToZod(refSchema, context);

            // Add discriminator value
            unionSchemas.push(`${baseSchema}.extend({ ${discriminatorField}: z.literal(${JSON.stringify(value)}) })`);
        }

        return `z.discriminatedUnion(${JSON.stringify(discriminatorField)}, [\n  ${unionSchemas.join(',\n  ')}\n])`;
    }

    /**
     * Handle circular reference resolution
     * @param {Object} schema - Schema object
     * @param {Set} visited - Visited references
     * @returns {Object} Resolved schema
     */
    static resolveCircularReferences(schema, visited = new Set()) {
        if (!schema || typeof schema !== 'object') {
            return schema;
        }

        // Check for circular reference
        if (schema.$ref) {
            if (visited.has(schema.$ref)) {
                // Return a lazy schema placeholder
                return {
                    type: 'circular',
                    ref: schema.$ref
                };
            }
            visited.add(schema.$ref);
        }

        // Deep clone and resolve
        const resolved = {};

        for (const [key, value] of Object.entries(schema)) {
            if (Array.isArray(value)) {
                resolved[key] = value.map(item => this.resolveCircularReferences(item, new Set(visited)));
            } else if (typeof value === 'object' && value !== null) {
                resolved[key] = this.resolveCircularReferences(value, new Set(visited));
            } else {
                resolved[key] = value;
            }
        }

        return resolved;
    }

    /**
     * Simplify complex schema
     * @param {Object} schema - Complex schema
     * @returns {Object} Simplified schema
     */
    static simplifySchema(schema) {
        // Remove unnecessary properties
        const simplified = { ...schema };
        const unnecessaryProps = ['examples', 'example', 'xml', 'externalDocs'];

        unnecessaryProps.forEach(prop => {
            delete simplified[prop];
        });

        // Simplify nested structures
        if (simplified.properties) {
            simplified.properties = Object.fromEntries(
                Object.entries(simplified.properties).map(([key, value]) => [
                    key,
                    this.simplifySchema(value)
                ])
            );
        }

        if (simplified.items) {
            simplified.items = this.simplifySchema(simplified.items);
        }

        // Simplify compositions
        if (simplified.allOf) {
            simplified.allOf = simplified.allOf.map(s => this.simplifySchema(s));
        }

        if (simplified.oneOf) {
            simplified.oneOf = simplified.oneOf.map(s => this.simplifySchema(s));
        }

        if (simplified.anyOf) {
            simplified.anyOf = simplified.anyOf.map(s => this.simplifySchema(s));
        }

        return simplified;
    }

    /**
     * Generate mock data from schema
     * @param {Object} schema - Schema object
     * @param {Object} options - Generation options
     * @returns {*} Mock data
     */
    static generateMockData(schema, options = {}) {
        const {
            useExamples = true,
            seed = null,
            locale = 'en',
            maxDepth = 10,
            currentDepth = 0
        } = options;

        if (currentDepth >= maxDepth) {
            return null;
        }

        // Use example if available
        if (useExamples && schema.example !== undefined) {
            return schema.example;
        }

        // Handle different types
        const type = schema.type || this.inferType(schema);

        switch (type) {
            case 'string':
                return this.generateMockString(schema, options);
            case 'number':
            case 'integer':
                return this.generateMockNumber(schema, options);
            case 'boolean':
                return this.generateMockBoolean(schema, options);
            case 'array':
                return this.generateMockArray(schema, { ...options, currentDepth: currentDepth + 1 });
            case 'object':
                return this.generateMockObject(schema, { ...options, currentDepth: currentDepth + 1 });
            case 'null':
                return null;
            default:
                return null;
        }
    }

    /**
     * Generate mock string
     * @param {Object} schema - String schema
     * @param {Object} options - Options
     * @returns {string} Mock string
     */
    static generateMockString(schema, options) {
        if (schema.enum) {
            const index = options.seed ? options.seed % schema.enum.length : Math.floor(Math.random() * schema.enum.length);
            return schema.enum[index];
        }

        // Handle formats
        if (schema.format) {
            switch (schema.format) {
                case 'email':
                    return 'user@example.com';
                case 'uri':
                case 'url':
                    return 'https://example.com';
                case 'uuid':
                    return '550e8400-e29b-41d4-a716-446655440000';
                case 'date':
                    return '2024-01-01';
                case 'date-time':
                    return '2024-01-01T00:00:00Z';
                case 'ipv4':
                    return '192.168.1.1';
                case 'ipv6':
                    return '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
                default:
                // Fallback to pattern or default
            }
        }

        // Handle pattern
        if (schema.pattern) {
            // Simple pattern generation (not full regex support)
            return 'pattern-match';
        }

        // Generate based on constraints
        const minLength = schema.minLength || 1;
        const maxLength = schema.maxLength || 20;
        const length = minLength + (options.seed || Math.floor(Math.random() * (maxLength - minLength)));

        return 'mock-string'.substring(0, length);
    }

    /**
     * Generate mock number
     * @param {Object} schema - Number schema
     * @param {Object} options - Options
     * @returns {number} Mock number
     */
    static generateMockNumber(schema, options) {
        const min = schema.minimum || 0;
        const max = schema.maximum || 100;
        const multipleOf = schema.multipleOf || 1;

        let value = min + (options.seed || Math.random()) * (max - min);

        // Round to multipleOf
        value = Math.round(value / multipleOf) * multipleOf;

        // Ensure integer if needed
        if (schema.type === 'integer') {
            value = Math.floor(value);
        }

        return value;
    }

    /**
     * Generate mock boolean
     * @param {Object} schema - Boolean schema
     * @param {Object} options - Options
     * @returns {boolean} Mock boolean
     */
    static generateMockBoolean(schema, options) {
        return options.seed ? options.seed % 2 === 0 : Math.random() < 0.5;
    }

    /**
     * Generate mock array
     * @param {Object} schema - Array schema
     * @param {Object} options - Options
     * @returns {Array} Mock array
     */
    static generateMockArray(schema, options) {
        const minItems = schema.minItems || 1;
        const maxItems = schema.maxItems || 5;
        const length = minItems + Math.floor((options.seed || Math.random()) * (maxItems - minItems));

        const array = [];
        for (let i = 0; i < length; i++) {
            array.push(this.generateMockData(schema.items || {}, options));
        }

        return array;
    }

    /**
     * Generate mock object
     * @param {Object} schema - Object schema
     * @param {Object} options - Options
     * @returns {Object} Mock object
     */
    static generateMockObject(schema, options) {
        const obj = {};

        if (schema.properties) {
            for (const [key, propSchema] of Object.entries(schema.properties)) {
                // Check if required
                const isRequired = schema.required && schema.required.includes(key);

                // Generate value if required or randomly
                if (isRequired || (options.seed ? options.seed % 2 === 0 : Math.random() < 0.7)) {
                    obj[key] = this.generateMockData(propSchema, options);
                }
            }
        }

        return obj;
    }

    /**
     * Extract schema documentation
     * @param {Object} schema - Schema object
     * @returns {Object} Documentation object
     */
    static extractDocumentation(schema) {
        const docs = {
            description: schema.description || '',
            title: schema.title || '',
            examples: schema.examples || [],
            example: schema.example,
            deprecated: schema.deprecated || false,
            readOnly: schema.readOnly || false,
            writeOnly: schema.writeOnly || false,
            constraints: {},
            format: schema.format,
            default: schema.default
        };

        // Extract constraints
        if (schema.type === 'string') {
            if (schema.minLength) docs.constraints.minLength = schema.minLength;
            if (schema.maxLength) docs.constraints.maxLength = schema.maxLength;
            if (schema.pattern) docs.constraints.pattern = schema.pattern;
            if (schema.enum) docs.constraints.enum = schema.enum;
        } else if (schema.type === 'number' || schema.type === 'integer') {
            if (schema.minimum !== undefined) docs.constraints.minimum = schema.minimum;
            if (schema.maximum !== undefined) docs.constraints.maximum = schema.maximum;
            if (schema.exclusiveMinimum !== undefined) docs.constraints.exclusiveMinimum = schema.exclusiveMinimum;
            if (schema.exclusiveMaximum !== undefined) docs.constraints.exclusiveMaximum = schema.exclusiveMaximum;
            if (schema.multipleOf) docs.constraints.multipleOf = schema.multipleOf;
        } else if (schema.type === 'array') {
            if (schema.minItems !== undefined) docs.constraints.minItems = schema.minItems;
            if (schema.maxItems !== undefined) docs.constraints.maxItems = schema.maxItems;
            if (schema.uniqueItems) docs.constraints.uniqueItems = schema.uniqueItems;
        }

        return docs;
    }

    /**
     * Process OpenAPI specific schema properties
     * @param {Object} schema - OpenAPI schema
     * @returns {Object} Processed schema
     */
    static processOpenApiSchema(schema) {
        const processed = { ...schema };

        // Convert OpenAPI specific properties to JSON Schema
        if (processed.nullable) {
            processed.type = [processed.type, 'null'].filter(Boolean);
            delete processed.nullable;
        }

        // Handle discriminator
        if (processed.discriminator && typeof processed.discriminator === 'string') {
            processed.discriminator = {
                propertyName: processed.discriminator
            };
        }

        // Process nested schemas
        if (processed.properties) {
            processed.properties = Object.fromEntries(
                Object.entries(processed.properties).map(([key, value]) => [
                    key,
                    this.processOpenApiSchema(value)
                ])
            );
        }

        if (processed.items) {
            processed.items = this.processOpenApiSchema(processed.items);
        }

        // Process compositions
        ['allOf', 'oneOf', 'anyOf'].forEach(key => {
            if (processed[key]) {
                processed[key] = processed[key].map(s => this.processOpenApiSchema(s));
            }
        });

        return processed;
    }

    /**
     * Resolve schema composition (allOf, oneOf, anyOf)
     * @param {Object} schema - Schema with composition
     * @returns {Object} Resolved schema
     */
    static resolveSchemaComposition(schema) {
        if (!schema) return schema;

        // Handle allOf by merging
        if (schema.allOf) {
            const merged = schema.allOf.reduce((acc, subSchema) => {
                const resolved = this.resolveSchemaComposition(subSchema);
                return this.mergeSchemas(acc, resolved);
            }, {});

            // Keep other properties
            const { allOf, ...rest } = schema;
            return { ...merged, ...rest };
        }

        // Handle oneOf/anyOf by keeping as-is but resolving each option
        if (schema.oneOf) {
            return {
                ...schema,
                oneOf: schema.oneOf.map(s => this.resolveSchemaComposition(s))
            };
        }

        if (schema.anyOf) {
            return {
                ...schema,
                anyOf: schema.anyOf.map(s => this.resolveSchemaComposition(s))
            };
        }

        // Recursively resolve nested schemas
        const resolved = { ...schema };

        if (resolved.properties) {
            resolved.properties = Object.fromEntries(
                Object.entries(resolved.properties).map(([key, value]) => [
                    key,
                    this.resolveSchemaComposition(value)
                ])
            );
        }

        if (resolved.items) {
            resolved.items = this.resolveSchemaComposition(resolved.items);
        }

        return resolved;
    }

    /**
     * Merge two schemas
     * @param {Object} schema1 - First schema
     * @param {Object} schema2 - Second schema
     * @returns {Object} Merged schema
     */
    static mergeSchemas(schema1, schema2) {
        const merged = { ...schema1 };

        for (const [key, value] of Object.entries(schema2)) {
            if (key === 'properties' && merged.properties) {
                // Merge properties
                merged.properties = { ...merged.properties, ...value };
            } else if (key === 'required' && merged.required) {
                // Merge required arrays
                merged.required = [...new Set([...merged.required, ...value])];
            } else if (!merged.hasOwnProperty(key)) {
                // Add new properties
                merged[key] = value;
            }
        }

        return merged;
    }

    /**
     * Dereference schema
     * @param {Object} schema - Schema with references
     * @param {Object} options - Dereference options
     * @returns {Promise<Object>} Dereferenced schema
     */
    static async dereferenceSchema(schema, options = {}) {
        try {
            const dereferenced = await RefParser.dereference(schema, {
                continueOnError: false,
                dereference: {
                    circular: options.allowCircular || 'ignore'
                }
            });

            return dereferenced;
        } catch (error) {
            // Fallback to simple dereferencing
            return this.simpleDereference(schema, schema);
        }
    }

    /**
     * Simple dereference implementation
     * @param {Object} schema - Current schema
     * @param {Object} root - Root schema
     * @returns {Object} Dereferenced schema
     */
    static simpleDereference(schema, root) {
        if (!schema || typeof schema !== 'object') {
            return schema;
        }

        if (schema.$ref) {
            const resolved = this.resolveRef(schema.$ref, root);
            return this.simpleDereference(resolved, root);
        }

        // Recursively dereference
        const dereferenced = {};

        for (const [key, value] of Object.entries(schema)) {
            if (Array.isArray(value)) {
                dereferenced[key] = value.map(item => this.simpleDereference(item, root));
            } else if (typeof value === 'object' && value !== null) {
                dereferenced[key] = this.simpleDereference(value, root);
            } else {
                dereferenced[key] = value;
            }
        }

        return dereferenced;
    }

    /**
     * Resolve a $ref
     * @param {string} ref - Reference string
     * @param {Object} root - Root schema
     * @returns {Object} Resolved schema
     */
    static resolveRef(ref, root) {
        if (ref.startsWith('#/')) {
            const path = ref.substring(2).split('/');
            let current = root;

            for (const segment of path) {
                current = current[segment];
                if (!current) {
                    throw new Error(`Unable to resolve reference: ${ref}`);
                }
            }

            return current;
        }

        throw new Error(`External references not supported: ${ref}`);
    }

    /**
     * Infer type from schema
     * @param {Object} schema - Schema object
     * @returns {string|null} Inferred type
     */
    static inferType(schema) {
        if (schema.properties || schema.additionalProperties) {
            return 'object';
        }

        if (schema.items) {
            return 'array';
        }

        if (schema.enum) {
            // Infer from enum values
            const firstValue = schema.enum[0];
            return typeof firstValue;
        }

        return null;
    }

    /**
     * Post-process TypeScript output
     * @param {string} typescript - TypeScript code
     * @param {Object} options - Processing options
     * @returns {string} Processed TypeScript
     */
    static postProcessTypeScript(typescript, options = {}) {
        let processed = typescript;

        // Add utility types if requested
        if (options.addUtilityTypes) {
            const utilityTypes = `
// Utility types
export type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>;
} : T;

export type DeepRequired<T> = T extends object ? {
  [P in keyof T]-?: DeepRequired<T[P]>;
} : T;

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
`;
            processed = utilityTypes + '\n' + processed;
        }

        // Fix any formatting issues
        processed = processed
            .replace(/\n{3,}/g, '\n\n')  // Remove excessive newlines
            .replace(/;\s*;/g, ';')       // Remove duplicate semicolons
            .trim();

        return processed;
    }

    /**
     * Extract reference name
     * @param {string} ref - Reference string
     * @returns {string} Reference name
     */
    static extractRefName(ref) {
        const parts = ref.split('/');
        return parts[parts.length - 1];
    }

    /**
     * Convert to PascalCase
     * @param {string} str - String to convert
     * @returns {string} PascalCase string
     */
    static toPascalCase(str) {
        return str
            .replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '')
            .replace(/^(.)/, (_, char) => char.toUpperCase());
    }

    /**
     * Make property name safe for JavaScript
     * @param {string} propName - Property name
     * @returns {string} Safe property name
     */
    static safePropName(propName) {
        // If it's a valid JS identifier, return as-is
        if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(propName)) {
            return propName;
        }

        // Otherwise, quote it
        return JSON.stringify(propName);
    }

    /**
     * Support schema extensions
     * @param {Object} schema - Schema with extensions
     * @param {Object} handlers - Extension handlers
     * @returns {Object} Processed schema
     */
    static processExtensions(schema, handlers = {}) {
        const processed = { ...schema };

        // Process x- extensions
        for (const [key, value] of Object.entries(schema)) {
            if (key.startsWith('x-')) {
                const extensionName = key.substring(2);

                if (handlers[extensionName]) {
                    const result = handlers[extensionName](value, schema);

                    // Merge result back into schema
                    if (typeof result === 'object') {
                        Object.assign(processed, result);
                    }
                }
            }
        }

        // Recursively process nested schemas
        if (processed.properties) {
            processed.properties = Object.fromEntries(
                Object.entries(processed.properties).map(([key, value]) => [
                    key,
                    this.processExtensions(value, handlers)
                ])
            );
        }

        if (processed.items) {
            processed.items = this.processExtensions(processed.items, handlers);
        }

        return processed;
    }

    /**
     * Generate schema documentation in markdown
     * @param {Object} schema - Schema object
     * @param {string} name - Schema name
     * @returns {string} Markdown documentation
     */
    static generateSchemaDocumentation(schema, name) {
        const lines = [];

        lines.push(`## ${name}`);
        lines.push('');

        if (schema.description) {
            lines.push(schema.description);
            lines.push('');
        }

        lines.push('### Properties');
        lines.push('');
        lines.push('| Property | Type | Required | Description |');
        lines.push('|----------|------|----------|-------------|');

        if (schema.properties) {
            const required = schema.required || [];

            for (const [propName, propSchema] of Object.entries(schema.properties)) {
                const type = this.getSchemaType(propSchema);
                const isRequired = required.includes(propName) ? 'Yes' : 'No';
                const description = propSchema.description || '';

                lines.push(`| ${propName} | ${type} | ${isRequired} | ${description} |`);
            }
        }

        return lines.join('\n');
    }

    /**
     * Get human-readable schema type
     * @param {Object} schema - Schema object
     * @returns {string} Type description
     */
    static getSchemaType(schema) {
        if (schema.$ref) {
            return this.extractRefName(schema.$ref);
        }

        if (schema.type === 'array' && schema.items) {
            return `${this.getSchemaType(schema.items)}[]`;
        }

        if (schema.enum) {
            return `enum(${schema.enum.join(', ')})`;
        }

        if (schema.oneOf) {
            return `oneOf(${schema.oneOf.length} types)`;
        }

        if (schema.allOf) {
            return `allOf(${schema.allOf.length} types)`;
        }

        return schema.type || 'unknown';
    }
}

module.exports = SchemaUtils;
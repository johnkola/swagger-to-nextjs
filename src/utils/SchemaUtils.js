/**
 * ===AI PROMPT ==============================================================
 * FILE: src/utils/SchemaUtils.js
 * VERSION: 2025-05-25 13:22:11
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 * Build utilities for OpenAPI schema processing: converting schemas to
 * TypeScript types, handling references, and generating validation rules.
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
 * FILE: src/utils/SchemaUtils.js
 *
 * AI PROMPT FOR CODE REVIEW/ENHANCEMENT:
 * =====================================
 *
 * You are reviewing OpenAPI schema analysis utilities that handle complex schema processing,
 * reference resolution, and type discovery for code generation. These utilities provide
 * deep analysis of OpenAPI specifications to extract meaningful type information.
 *
 * RESPONSIBILITIES:
 * - Analyze OpenAPI schemas and extract relevant type information
 * - Resolve schema references ($ref) and handle circular dependencies
 * - Discover nested schema relationships and dependencies
 * - Generate schema summaries and type mappings for code generation
 * - Handle different OpenAPI specification versions (2.x, 3.x)
 * - Process complex schema patterns (allOf, oneOf, anyOf, discriminators)
 *
 * SCHEMA ANALYSIS FEATURES:
 * - Deep schema traversal with cycle detection
 * - Reference resolution and dependency mapping
 * - Type inference and validation schema generation
 * - Schema flattening and normalization
 * - Property analysis and requirement detection
 * - Format validation and constraint extraction
 *
 * REVIEW FOCUS:
 * - Circular reference handling and performance
 * - Schema version compatibility and edge cases
 * - Memory efficiency for large schema processing
 * - Type inference accuracy and completeness
 * - Error handling for malformed schemas
 */

class SchemaUtils {
    /**
     * Extract all schema references from operations
     */
    static findRelevantSchemas(operations) {
        const schemas = new Set();
        const visited = new Set(); // Prevent infinite recursion

        Object.values(operations).forEach(operation => {
            this.extractSchemasFromOperation(operation, schemas, visited);
        });

        return Array.from(schemas).filter(schema => schema && schema.trim() !== '');
    }

    /**
     * Extract schemas from a single operation
     */
    static extractSchemasFromOperation(operation, schemas, visited) {
        if (!operation || typeof operation !== 'object') return;

        // Check request body schemas
        if (operation.requestBody?.content) {
            Object.values(operation.requestBody.content).forEach(content => {
                this.extractSchemaReferences(content.schema, schemas, visited);
            });
        }

        // Check response schemas
        Object.values(operation.responses || {}).forEach(response => {
            if (response.content) {
                Object.values(response.content).forEach(content => {
                    this.extractSchemaReferences(content.schema, schemas, visited);
                });
            }
        });

        // Check parameter schemas
        if (operation.parameters) {
            operation.parameters.forEach(param => {
                this.extractSchemaReferences(param.schema, schemas, visited);
            });
        }

        // Check callbacks (OpenAPI 3.x)
        if (operation.callbacks) {
            Object.values(operation.callbacks).forEach(callback => {
                Object.values(callback).forEach(pathItem => {
                    Object.values(pathItem).forEach(callbackOp => {
                        this.extractSchemasFromOperation(callbackOp, schemas, visited);
                    });
                });
            });
        }
    }

    /**
     * Recursively extract schema references
     */
    static extractSchemaReferences(schema, schemas, visited) {
        if (!schema || typeof schema !== 'object') return;

        // Create a unique key for this schema to detect cycles
        const schemaKey = JSON.stringify(schema);
        if (visited.has(schemaKey)) return;
        visited.add(schemaKey);

        // Direct reference
        if (schema.$ref) {
            const schemaName = this.extractSchemaNameFromRef(schema.$ref);
            if (schemaName) {
                schemas.add(schemaName);
            }
        }

        // Array items
        if (schema.items) {
            this.extractSchemaReferences(schema.items, schemas, visited);
        }

        // Object properties
        if (schema.properties) {
            Object.values(schema.properties).forEach(prop => {
                this.extractSchemaReferences(prop, schemas, visited);
            });
        }

        // Additional properties
        if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
            this.extractSchemaReferences(schema.additionalProperties, schemas, visited);
        }

        // Composition schemas (allOf, oneOf, anyOf)
        ['allOf', 'oneOf', 'anyOf'].forEach(compositionType => {
            if (schema[compositionType] && Array.isArray(schema[compositionType])) {
                schema[compositionType].forEach(subSchema => {
                    this.extractSchemaReferences(subSchema, schemas, visited);
                });
            }
        });

        // Not schema
        if (schema.not) {
            this.extractSchemaReferences(schema.not, schemas, visited);
        }

        // Discriminator mapping (OpenAPI 3.x)
        if (schema.discriminator?.mapping) {
            Object.values(schema.discriminator.mapping).forEach(ref => {
                const schemaName = this.extractSchemaNameFromRef(ref);
                if (schemaName) {
                    schemas.add(schemaName);
                }
            });
        }
    }

    /**
     * Extract schema name from $ref string
     */
    static extractSchemaNameFromRef(ref) {
        if (!ref || typeof ref !== 'string') return null;

        // Handle different reference formats
        const patterns = [
            /^#\/components\/schemas\/(.+)$/, // OpenAPI 3.x
            /^#\/definitions\/(.+)$/, // Swagger 2.0
            /^(.+)\.json$/, // External JSON schema
            /^(.+)\.yaml$/, // External YAML schema
            /.*\/([^\/]+)$/ // Generic last segment
        ];

        for (const pattern of patterns) {
            const match = ref.match(pattern);
            if (match) {
                return match[1];
            }
        }

        return null;
    }

    /**
     * Analyze schema structure and return metadata
     */
    static analyzeSchema(schema, schemaName = 'Unknown') {
        if (!schema || typeof schema !== 'object') {
            return {
                name: schemaName,
                type: 'unknown',
                complexity: 0,
                hasNestedObjects: false,
                hasArrays: false,
                hasReferences: false,
                requiredFields: [],
                optionalFields: [],
                formats: [],
                constraints: {}
            };
        }

        const analysis = {
            name: schemaName,
            type: schema.type || 'object',
            complexity: 0,
            hasNestedObjects: false,
            hasArrays: false,
            hasReferences: !!schema.$ref,
            requiredFields: schema.required || [],
            optionalFields: [],
            formats: [],
            constraints: this.extractConstraints(schema),
            properties: {}
        };

        // Analyze properties
        if (schema.properties) {
            Object.entries(schema.properties).forEach(([propName, propSchema]) => {
                const isRequired = analysis.requiredFields.includes(propName);
                if (!isRequired) {
                    analysis.optionalFields.push(propName);
                }

                analysis.properties[propName] = this.analyzeProperty(propSchema);
                analysis.complexity += analysis.properties[propName].complexity;

                if (analysis.properties[propName].type === 'object') {
                    analysis.hasNestedObjects = true;
                }
                if (analysis.properties[propName].type === 'array') {
                    analysis.hasArrays = true;
                }
                if (analysis.properties[propName].hasReference) {
                    analysis.hasReferences = true;
                }
                if (analysis.properties[propName].format) {
                    analysis.formats.push(analysis.properties[propName].format);
                }
            });
        }

        // Analyze composition schemas
        if (schema.allOf || schema.oneOf || schema.anyOf) {
            analysis.hasComposition = true;
            analysis.complexity += 2;
        }

        return analysis;
    }

    /**
     * Analyze individual property
     */
    static analyzeProperty(propSchema) {
        if (!propSchema || typeof propSchema !== 'object') {
            return {type: 'unknown', complexity: 0};
        }

        const property = {
            type: propSchema.type || 'unknown',
            format: propSchema.format,
            hasReference: !!propSchema.$ref,
            complexity: 1,
            constraints: this.extractConstraints(propSchema)
        };

        // Handle arrays
        if (property.type === 'array' && propSchema.items) {
            property.itemType = propSchema.items.type || 'unknown';
            property.hasReference = property.hasReference || !!propSchema.items.$ref;
            property.complexity += 1;
        }

        // Handle nested objects
        if (property.type === 'object' && propSchema.properties) {
            property.complexity += Object.keys(propSchema.properties).length;
        }

        // Handle composition
        if (propSchema.allOf || propSchema.oneOf || propSchema.anyOf) {
            property.complexity += 2;
        }

        return property;
    }

    /**
     * Extract validation constraints from schema
     */
    static extractConstraints(schema) {
        const constraints = {};

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

        // Enum values
        if (schema.enum) constraints.enum = schema.enum;

        // Format validations
        if (schema.format) constraints.format = schema.format;

        return constraints;
    }

    /**
     * Generate schema dependency graph
     */
    static buildDependencyGraph(schemas) {
        const graph = new Map();
        const visited = new Set();

        Object.entries(schemas).forEach(([schemaName, schema]) => {
            if (!visited.has(schemaName)) {
                this.buildSchemaDependencies(schemaName, schema, schemas, graph, visited);
            }
        });

        return graph;
    }

    /**
     * Build dependencies for a single schema
     */
    static buildSchemaDependencies(schemaName, schema, allSchemas, graph, visited) {
        if (visited.has(schemaName)) return;
        visited.add(schemaName);

        const dependencies = new Set();
        const schemaRefs = new Set();

        this.extractSchemaReferences(schema, schemaRefs, new Set());

        schemaRefs.forEach(refName => {
            if (refName !== schemaName && allSchemas[refName]) {
                dependencies.add(refName);
                // Recursively build dependencies
                this.buildSchemaDependencies(refName, allSchemas[refName], allSchemas, graph, visited);
            }
        });

        graph.set(schemaName, {
            dependencies: Array.from(dependencies),
            dependents: [], // Will be filled in a second pass
            complexity: this.calculateSchemaComplexity(schema)
        });
    }

    /**
     * Calculate schema complexity score
     */
    static calculateSchemaComplexity(schema) {
        if (!schema || typeof schema !== 'object') return 0;

        let complexity = 1;

        // Properties add complexity
        if (schema.properties) {
            complexity += Object.keys(schema.properties).length;
            Object.values(schema.properties).forEach(prop => {
                complexity += this.calculateSchemaComplexity(prop);
            });
        }

        // Arrays add complexity
        if (schema.items) {
            complexity += this.calculateSchemaComplexity(schema.items);
        }

        // Composition adds complexity
        if (schema.allOf || schema.oneOf || schema.anyOf) {
            const compositions = schema.allOf || schema.oneOf || schema.anyOf || [];
            complexity += compositions.length * 2;
            compositions.forEach(comp => {
                complexity += this.calculateSchemaComplexity(comp);
            });
        }

        // References add minimal complexity
        if (schema.$ref) {
            complexity += 1;
        }

        return Math.min(complexity, 100); // Cap complexity at 100
    }

    /**
     * Sort schemas by dependency order
     */
    static sortSchemasByDependency(dependencyGraph) {
        const sorted = [];
        const visiting = new Set();
        const visited = new Set();

        const visit = (schemaName) => {
            if (visiting.has(schemaName)) {
                // Circular dependency detected
                return;
            }
            if (visited.has(schemaName)) {
                return;
            }

            visiting.add(schemaName);

            const node = dependencyGraph.get(schemaName);
            if (node) {
                node.dependencies.forEach(dep => {
                    visit(dep);
                });
            }

            visiting.delete(schemaName);
            visited.add(schemaName);
            sorted.push(schemaName);
        };

        dependencyGraph.forEach((_, schemaName) => {
            if (!visited.has(schemaName)) {
                visit(schemaName);
            }
        });

        return sorted;
    }

    /**
     * Find circular dependencies in schemas
     */
    static findCircularDependencies(dependencyGraph) {
        const circles = [];
        const visiting = new Set();
        const visited = new Set();

        const visit = (schemaName, path = []) => {
            if (visiting.has(schemaName)) {
                // Found a cycle
                const cycleStart = path.indexOf(schemaName);
                if (cycleStart !== -1) {
                    circles.push(path.slice(cycleStart).concat(schemaName));
                }
                return;
            }
            if (visited.has(schemaName)) {
                return;
            }

            visiting.add(schemaName);
            path.push(schemaName);

            const node = dependencyGraph.get(schemaName);
            if (node) {
                node.dependencies.forEach(dep => {
                    visit(dep, [...path]);
                });
            }

            visiting.delete(schemaName);
            visited.add(schemaName);
            path.pop();
        };

        dependencyGraph.forEach((_, schemaName) => {
            if (!visited.has(schemaName)) {
                visit(schemaName);
            }
        });

        return circles;
    }

    /**
     * Get schema statistics
     */
    static getSchemaStatistics(schemas) {
        const stats = {
            totalSchemas: Object.keys(schemas).length,
            schemaTypes: {},
            complexityDistribution: {},
            hasCircularDependencies: false,
            averageComplexity: 0,
            mostComplexSchema: null,
            maxComplexity: 0
        };

        let totalComplexity = 0;

        Object.entries(schemas).forEach(([schemaName, schema]) => {
            const analysis = this.analyzeSchema(schema, schemaName);

            // Track schema types
            const type = analysis.type;
            stats.schemaTypes[type] = (stats.schemaTypes[type] || 0) + 1;

            // Track complexity
            const complexity = analysis.complexity;
            totalComplexity += complexity;

            const complexityBucket = this.getComplexityBucket(complexity);
            stats.complexityDistribution[complexityBucket] =
                (stats.complexityDistribution[complexityBucket] || 0) + 1;

            // Track most complex schema
            if (complexity > stats.maxComplexity) {
                stats.maxComplexity = complexity;
                stats.mostComplexSchema = schemaName;
            }
        });

        stats.averageComplexity = stats.totalSchemas > 0 ?
            Math.round(totalComplexity / stats.totalSchemas * 100) / 100 : 0;

        // Check for circular dependencies
        const dependencyGraph = this.buildDependencyGraph(schemas);
        const circles = this.findCircularDependencies(dependencyGraph);
        stats.hasCircularDependencies = circles.length > 0;
        stats.circularDependencies = circles;

        return stats;
    }

    /**
     * Get complexity bucket for statistics
     */
    static getComplexityBucket(complexity) {
        if (complexity <= 5) return 'simple';
        if (complexity <= 15) return 'moderate';
        if (complexity <= 30) return 'complex';
        return 'very-complex';
    }

    /**
     * Flatten nested schemas into a flat structure
     */
    static flattenSchemas(schemas) {
        const flattened = {};
        const processed = new Set();

        const flatten = (schemaName, schema, prefix = '') => {
            if (processed.has(schemaName)) return;
            processed.add(schemaName);

            const fullName = prefix ? `${prefix}.${schemaName}` : schemaName;
            flattened[fullName] = schema;

            // Flatten nested schemas
            if (schema.properties) {
                Object.entries(schema.properties).forEach(([propName, propSchema]) => {
                    if (propSchema.type === 'object' && propSchema.properties) {
                        flatten(propName, propSchema, fullName);
                    }
                });
            }
        };

        Object.entries(schemas).forEach(([schemaName, schema]) => {
            flatten(schemaName, schema);
        });

        return flattened;
    }

    /**
     * Generate schema summary for documentation
     */
    static generateSchemaSummary(schemas) {
        const summary = {
            overview: this.getSchemaStatistics(schemas),
            schemas: {}
        };

        Object.entries(schemas).forEach(([schemaName, schema]) => {
            const analysis = this.analyzeSchema(schema, schemaName);

            summary.schemas[schemaName] = {
                type: analysis.type,
                complexity: analysis.complexity,
                properties: Object.keys(analysis.properties).length,
                requiredFields: analysis.requiredFields.length,
                optionalFields: analysis.optionalFields.length,
                hasNestedObjects: analysis.hasNestedObjects,
                hasArrays: analysis.hasArrays,
                hasReferences: analysis.hasReferences,
                formats: [...new Set(analysis.formats)],
                description: schema.description || '',
                example: schema.example || null
            };
        });

        return summary;
    }

    /**
     * Validate schema structure
     */
    static validateSchema(schema, schemaName = 'Unknown') {
        const issues = [];

        if (!schema || typeof schema !== 'object') {
            issues.push(`Schema "${schemaName}" is not a valid object`);
            return {isValid: false, issues};
        }

        // Check for required fields in object schemas
        if (schema.type === 'object' && schema.properties) {
            if (schema.required && Array.isArray(schema.required)) {
                schema.required.forEach(requiredField => {
                    if (!schema.properties[requiredField]) {
                        issues.push(`Required field "${requiredField}" not found in properties`);
                    }
                });
            }

            // Check for circular references in properties
            const visited = new Set();
            this.checkCircularReferences(schema, visited, [schemaName], issues);
        }

        // Validate array schemas
        if (schema.type === 'array' && !schema.items) {
            issues.push(`Array schema "${schemaName}" missing items definition`);
        }

        // Validate enum values
        if (schema.enum && (!Array.isArray(schema.enum) || schema.enum.length === 0)) {
            issues.push(`Enum schema "${schemaName}" must have non-empty array of values`);
        }

        // Validate constraints
        if (schema.minimum !== undefined && schema.maximum !== undefined) {
            if (schema.minimum > schema.maximum) {
                issues.push(`Schema "${schemaName}" minimum (${schema.minimum}) is greater than maximum (${schema.maximum})`);
            }
        }

        return {
            isValid: issues.length === 0,
            issues
        };
    }

    /**
     * Check for circular references in schema definitions
     */
    static checkCircularReferences(schema, visited, path, issues) {
        if (!schema || typeof schema !== 'object') return;

        const schemaId = schema.$ref || JSON.stringify(schema);

        if (visited.has(schemaId)) {
            issues.push(`Circular reference detected in path: ${path.join(' -> ')}`);
            return;
        }

        visited.add(schemaId);

        // Check properties
        if (schema.properties) {
            Object.entries(schema.properties).forEach(([propName, propSchema]) => {
                this.checkCircularReferences(
                    propSchema,
                    new Set(visited),
                    [...path, propName],
                    issues
                );
            });
        }

        // Check array items
        if (schema.items) {
            this.checkCircularReferences(
                schema.items,
                new Set(visited),
                [...path, 'items'],
                issues
            );
        }

        // Check composition schemas
        ['allOf', 'oneOf', 'anyOf'].forEach(compositionType => {
            if (schema[compositionType] && Array.isArray(schema[compositionType])) {
                schema[compositionType].forEach((subSchema, index) => {
                    this.checkCircularReferences(
                        subSchema,
                        new Set(visited),
                        [...path, `${compositionType}[${index}]`],
                        issues
                    );
                });
            }
        });
    }

    /**
     * Convert schema to JSON Schema format
     */
    static toJsonSchema(openApiSchema) {
        if (!openApiSchema || typeof openApiSchema !== 'object') {
            return {};
        }

        const jsonSchema = {...openApiSchema};

        // Convert OpenAPI-specific properties to JSON Schema equivalents
        if (jsonSchema.nullable) {
            if (jsonSchema.type) {
                jsonSchema.type = [jsonSchema.type, 'null'];
            }
            delete jsonSchema.nullable;
        }

        // Handle discriminator (OpenAPI 3.x specific)
        if (jsonSchema.discriminator) {
            // Convert to JSON Schema equivalent or remove if not supported
            delete jsonSchema.discriminator;
        }

        // Recursively convert nested schemas
        if (jsonSchema.properties) {
            Object.keys(jsonSchema.properties).forEach(prop => {
                jsonSchema.properties[prop] = this.toJsonSchema(jsonSchema.properties[prop]);
            });
        }

        if (jsonSchema.items) {
            jsonSchema.items = this.toJsonSchema(jsonSchema.items);
        }

        ['allOf', 'oneOf', 'anyOf'].forEach(compositionType => {
            if (jsonSchema[compositionType] && Array.isArray(jsonSchema[compositionType])) {
                jsonSchema[compositionType] = jsonSchema[compositionType].map(schema =>
                    this.toJsonSchema(schema)
                );
            }
        });

        return jsonSchema;
    }

    /**
     * Merge multiple schemas into one
     */
    static mergeSchemas(schemas) {
        if (!schemas || !Array.isArray(schemas) || schemas.length === 0) {
            return {};
        }

        if (schemas.length === 1) {
            return schemas[0];
        }

        const merged = {
            type: 'object',
            properties: {},
            required: []
        };

        schemas.forEach(schema => {
            if (schema.properties) {
                Object.assign(merged.properties, schema.properties);
            }
            if (schema.required && Array.isArray(schema.required)) {
                merged.required.push(...schema.required);
            }
        });

        // Remove duplicate required fields
        merged.required = [...new Set(merged.required)];

        return merged;
    }
}

module.exports = SchemaUtils;
/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - AI PROMPT
 * ============================================================================
 * FILE: test/utils/SchemaUtils.test.js
 * VERSION: 2025-06-17 16:21:39
 * PHASE: Phase 9: Test Files
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 *
 * Create a test file using Node.js built-in test framework for SchemaUtils
 * functions. Use ES Module imports for all utilities. Write tests for
 * OpenAPI to TypeScript type conversion, primitive type mapping, array type
 * handling, nested object processing, $ref resolution, interface name
 * generation, nullable type handling, enum processing, schema composition
 * handling, circular reference detection, UI component hint extraction,
 * form field type determination, and DaisyUI component selection logic.
 * Include various schema examples as test cases.
 *
 * ============================================================================
 */
/**
 * SchemaUtils.test.js - Unit tests for SchemaUtils using Node.js test runner
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import SchemaUtils from '../../src/utils/SchemaUtils.js';

describe('SchemaUtils', () => {
    describe('toTypeScript', () => {
        it('should convert primitive types', () => {
            assert.equal(SchemaUtils.toTypeScript({ type: 'string' }), 'string');
            assert.equal(SchemaUtils.toTypeScript({ type: 'number' }), 'number');
            assert.equal(SchemaUtils.toTypeScript({ type: 'integer' }), 'number');
            assert.equal(SchemaUtils.toTypeScript({ type: 'boolean' }), 'boolean');
        });

        it('should handle nullable types', () => {
            assert.equal(SchemaUtils.toTypeScript({ type: 'string', nullable: true }), 'string | null');
            assert.equal(SchemaUtils.toTypeScript({ type: 'number', nullable: true }), 'number | null');
        });

        it('should handle arrays', () => {
            assert.equal(SchemaUtils.toTypeScript({ type: 'array', items: { type: 'string' } }), 'string[]');
            assert.equal(SchemaUtils.toTypeScript({ type: 'array', items: { type: 'number' } }), 'number[]');
            assert.equal(SchemaUtils.toTypeScript({ type: 'array' }), 'any[]');
        });

        it('should handle nested arrays', () => {
            const schema = {
                type: 'array',
                items: {
                    type: 'array',
                    items: { type: 'string' }
                }
            };
            assert.equal(SchemaUtils.toTypeScript(schema), 'string[][]');
        });

        it('should handle empty schemas', () => {
            assert.equal(SchemaUtils.toTypeScript(null), 'any');
            assert.equal(SchemaUtils.toTypeScript(undefined), 'any');
            assert.equal(SchemaUtils.toTypeScript({}), 'any');
        });

        it('should handle $ref', () => {
            assert.equal(SchemaUtils.toTypeScript({ $ref: '#/components/schemas/User' }), 'User');
            assert.equal(SchemaUtils.toTypeScript({ $ref: '#/components/schemas/UserProfile' }), 'UserProfile');
        });

        it('should handle enums', () => {
            assert.equal(SchemaUtils.toTypeScript({ enum: ['active', 'inactive'] }), "'active' | 'inactive'");
            assert.equal(SchemaUtils.toTypeScript({ enum: [1, 2, 3] }), '1 | 2 | 3');
        });

        it('should escape quotes in enum values', () => {
            assert.equal(SchemaUtils.toTypeScript({ enum: ["it's", 'test'] }), "'it\\'s' | 'test'");
        });
    });

    describe('primitiveToTypeScript', () => {
        it('should map OpenAPI types to TypeScript', () => {
            assert.equal(SchemaUtils.primitiveToTypeScript('string'), 'string');
            assert.equal(SchemaUtils.primitiveToTypeScript('number'), 'number');
            assert.equal(SchemaUtils.primitiveToTypeScript('integer'), 'number');
            assert.equal(SchemaUtils.primitiveToTypeScript('boolean'), 'boolean');
            assert.equal(SchemaUtils.primitiveToTypeScript('null'), 'null');
        });

        it('should handle string formats', () => {
            assert.equal(SchemaUtils.primitiveToTypeScript('string', 'date'), 'string');
            assert.equal(SchemaUtils.primitiveToTypeScript('string', 'date-time'), 'string');
            assert.equal(SchemaUtils.primitiveToTypeScript('string', 'binary'), 'string');
            assert.equal(SchemaUtils.primitiveToTypeScript('string', 'byte'), 'string');
        });

        it('should return any for unknown types', () => {
            assert.equal(SchemaUtils.primitiveToTypeScript('unknown'), 'any');
            assert.equal(SchemaUtils.primitiveToTypeScript(null), 'any');
        });
    });

    describe('objectToInterface', () => {
        it('should convert simple object to interface', () => {
            const schema = {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    name: { type: 'string' }
                },
                required: ['id']
            };

            const result = SchemaUtils.toTypeScript(schema);
            assert.match(result, /id: string;/);
            assert.match(result, /name\?: string;/);
        });

        it('should handle descriptions as JSDoc', () => {
            const schema = {
                type: 'object',
                properties: {
                    id: { type: 'string', description: 'Unique identifier' }
                }
            };

            const result = SchemaUtils.toTypeScript(schema);
            assert.match(result, /\/\*\* Unique identifier \*\//);
        });

        it('should handle additional properties', () => {
            const schema = {
                type: 'object',
                properties: {
                    id: { type: 'string' }
                },
                additionalProperties: { type: 'number' }
            };

            const result = SchemaUtils.toTypeScript(schema);
            assert.match(result, /\[key: string\]: number;/);
        });

        it('should handle objects without properties', () => {
            assert.equal(SchemaUtils.toTypeScript({ type: 'object' }), 'Record<string, any>');
        });

        it('should handle property names that need quotes', () => {
            const schema = {
                type: 'object',
                properties: {
                    'content-type': { type: 'string' },
                    '123prop': { type: 'number' }
                }
            };

            const result = SchemaUtils.toTypeScript(schema);
            assert.match(result, /'content-type'\?: string;/);
            assert.match(result, /'123prop'\?: number;/);
        });
    });

    describe('enumToUnion', () => {
        it('should convert string enums', () => {
            assert.equal(SchemaUtils.enumToUnion(['active', 'inactive', 'pending']),
                "'active' | 'inactive' | 'pending'");
        });

        it('should convert number enums', () => {
            assert.equal(SchemaUtils.enumToUnion([1, 2, 3]), '1 | 2 | 3');
        });

        it('should handle mixed enums', () => {
            assert.equal(SchemaUtils.enumToUnion(['active', 1, true]), "'active' | 1 | true");
        });

        it('should handle empty enums', () => {
            assert.equal(SchemaUtils.enumToUnion([]), 'any');
            assert.equal(SchemaUtils.enumToUnion(null), 'any');
        });
    });

    describe('schema composition', () => {
        it('should handle allOf', () => {
            const schema = {
                allOf: [
                    { properties: { id: { type: 'string' } } },
                    { properties: { name: { type: 'string' } } }
                ]
            };

            const result = SchemaUtils.toTypeScript(schema);
            assert.match(result, /&/);
        });

        it('should handle oneOf', () => {
            const schema = {
                oneOf: [
                    { type: 'string' },
                    { type: 'number' }
                ]
            };

            assert.equal(SchemaUtils.toTypeScript(schema), '(string | number)');
        });

        it('should handle anyOf', () => {
            const schema = {
                anyOf: [
                    { type: 'string' },
                    { type: 'boolean' }
                ]
            };

            assert.equal(SchemaUtils.toTypeScript(schema), '(string | boolean)');
        });
    });

    describe('resolveRefType', () => {
        it('should extract schema name from $ref', () => {
            assert.equal(SchemaUtils.resolveRefType('#/components/schemas/User'), 'User');
            assert.equal(SchemaUtils.resolveRefType('#/components/schemas/UserProfile'), 'UserProfile');
            assert.equal(SchemaUtils.resolveRefType('#/components/schemas/API_Response'), 'APIResponse');
        });

        it('should handle circular references', () => {
            const visitedRefs = new Set(['User']);
            assert.equal(SchemaUtils.resolveRefType('#/components/schemas/User', { visitedRefs }), 'User');
        });

        it('should return any for invalid refs', () => {
            assert.equal(SchemaUtils.resolveRefType('invalid-ref'), 'any');
            assert.equal(SchemaUtils.resolveRefType(null), 'any');
        });
    });

    describe('extractSchemaName', () => {
        it('should extract schema names from refs', () => {
            assert.equal(SchemaUtils.extractSchemaName('#/components/schemas/User'), 'User');
            assert.equal(SchemaUtils.extractSchemaName('#/components/schemas/UserProfile'), 'UserProfile');
        });

        it('should handle invalid refs', () => {
            assert.equal(SchemaUtils.extractSchemaName('invalid'), null);
            assert.equal(SchemaUtils.extractSchemaName('#/definitions/User'), null);
            assert.equal(SchemaUtils.extractSchemaName(null), null);
        });
    });

    describe('resolveRef', () => {
        it('should resolve references in spec', () => {
            const spec = {
                components: {
                    schemas: {
                        User: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' }
                            }
                        }
                    }
                }
            };

            const resolved = SchemaUtils.resolveRef('#/components/schemas/User', spec);
            assert.deepEqual(resolved, spec.components.schemas.User);
        });

        it('should handle nested paths', () => {
            const spec = {
                paths: {
                    '/users': {
                        get: {
                            responses: {
                                '200': {
                                    description: 'Success'
                                }
                            }
                        }
                    }
                }
            };

            const resolved = SchemaUtils.resolveRef('#/paths/~1users/get/responses/200', spec);
            assert.equal(resolved.description, 'Success');
        });

        it('should return null for invalid refs', () => {
            const spec = { components: { schemas: {} } };
            assert.equal(SchemaUtils.resolveRef('#/components/schemas/NonExistent', spec), null);
            assert.equal(SchemaUtils.resolveRef(null, spec), null);
            assert.equal(SchemaUtils.resolveRef('#/invalid/path', spec), null);
        });
    });

    describe('schemaToInterface', () => {
        it('should generate interface for object schema', () => {
            const schema = {
                type: 'object',
                description: 'User model',
                properties: {
                    id: { type: 'string' },
                    name: { type: 'string' }
                }
            };

            const result = SchemaUtils.schemaToInterface('User', schema);
            assert.match(result, /export interface User/);
            assert.match(result, /\/\*\*\n \* User model\n \*\//);
        });

        it('should generate type alias for simple types', () => {
            const schema = { type: 'string' };
            const result = SchemaUtils.schemaToInterface('UserId', schema);
            assert.match(result, /export type UserId = string;/);
        });

        it('should generate type alias for enums', () => {
            const schema = { enum: ['active', 'inactive'] };
            const result = SchemaUtils.schemaToInterface('Status', schema);
            assert.match(result, /export type Status = 'active' \| 'inactive';/);
        });

        it('should handle complex types', () => {
            const schema = {
                oneOf: [
                    { type: 'string' },
                    { type: 'number' }
                ]
            };

            const result = SchemaUtils.schemaToInterface('StringOrNumber', schema);
            assert.match(result, /export type StringOrNumber = \(string \| number\);/);
        });
    });

    describe('toSafePropertyName', () => {
        it('should keep valid identifiers as-is', () => {
            assert.equal(SchemaUtils.toSafePropertyName('validName'), 'validName');
            assert.equal(SchemaUtils.toSafePropertyName('_private'), '_private');
            assert.equal(SchemaUtils.toSafePropertyName('$special'), '$special');
        });

        it('should quote invalid identifiers', () => {
            assert.equal(SchemaUtils.toSafePropertyName('content-type'), "'content-type'");
            assert.equal(SchemaUtils.toSafePropertyName('123prop'), "'123prop'");
            assert.equal(SchemaUtils.toSafePropertyName('prop with spaces'), "'prop with spaces'");
        });

        it('should escape quotes in property names', () => {
            assert.equal(SchemaUtils.toSafePropertyName("prop'with'quotes"), "'prop\\'with\\'quotes'");
        });
    });

    describe('extractSchemas', () => {
        it('should extract schemas from OpenAPI 3.0', () => {
            const spec = {
                components: {
                    schemas: {
                        User: { type: 'object' },
                        Post: { type: 'object' }
                    }
                }
            };

            const schemas = SchemaUtils.extractSchemas(spec);
            assert.equal(Object.keys(schemas).length, 2);
            assert.ok(schemas.User);
            assert.ok(schemas.Post);
        });

        it('should extract schemas from Swagger 2.0', () => {
            const spec = {
                definitions: {
                    User: { type: 'object' },
                    Post: { type: 'object' }
                }
            };

            const schemas = SchemaUtils.extractSchemas(spec);
            assert.equal(Object.keys(schemas).length, 2);
            assert.ok(schemas.User);
            assert.ok(schemas.Post);
        });

        it('should handle specs without schemas', () => {
            assert.deepEqual(SchemaUtils.extractSchemas({}), {});
            assert.deepEqual(SchemaUtils.extractSchemas({ components: {} }), {});
        });
    });

    describe('responseToType', () => {
        it('should extract type from OpenAPI 3.0 response', () => {
            const response = {
                content: {
                    'application/json': {
                        schema: { type: 'string' }
                    }
                }
            };

            assert.equal(SchemaUtils.responseToType(response), 'string');
        });

        it('should extract type from Swagger 2.0 response', () => {
            const response = {
                schema: { type: 'number' }
            };

            assert.equal(SchemaUtils.responseToType(response), 'number');
        });

        it('should return void for empty responses', () => {
            assert.equal(SchemaUtils.responseToType(null), 'void');
            assert.equal(SchemaUtils.responseToType({}), 'void');
            assert.equal(SchemaUtils.responseToType({ content: {} }), 'void');
        });
    });

    describe('requestBodyToType', () => {
        it('should extract type from OpenAPI 3.0 request body', () => {
            const requestBody = {
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                name: { type: 'string' }
                            }
                        }
                    }
                }
            };

            const result = SchemaUtils.requestBodyToType(requestBody);
            assert.match(result, /name\?: string;/);
        });

        it('should handle direct schema', () => {
            const requestBody = {
                schema: { type: 'boolean' }
            };

            assert.equal(SchemaUtils.requestBodyToType(requestBody), 'boolean');
        });

        it('should return void for empty request body', () => {
            assert.equal(SchemaUtils.requestBodyToType(null), 'void');
            assert.equal(SchemaUtils.requestBodyToType({}), 'any');
        });
    });

    describe('detectCircularRefs', () => {
        it('should detect direct circular references', () => {
            const schemas = {
                User: {
                    type: 'object',
                    properties: {
                        self: { $ref: '#/components/schemas/User' }
                    }
                }
            };

            const circular = SchemaUtils.detectCircularRefs(schemas);
            assert.ok(circular.has('User'));
        });

        it('should detect indirect circular references', () => {
            const schemas = {
                User: {
                    type: 'object',
                    properties: {
                        posts: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Post' }
                        }
                    }
                },
                Post: {
                    type: 'object',
                    properties: {
                        author: { $ref: '#/components/schemas/User' }
                    }
                }
            };

            const circular = SchemaUtils.detectCircularRefs(schemas);
            assert.ok(circular.has('User'));
            assert.ok(circular.has('Post'));
        });

        it('should handle schemas without circular refs', () => {
            const schemas = {
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' }
                    }
                },
                Post: {
                    type: 'object',
                    properties: {
                        title: { type: 'string' }
                    }
                }
            };

            const circular = SchemaUtils.detectCircularRefs(schemas);
            assert.equal(circular.size, 0);
        });
    });
});
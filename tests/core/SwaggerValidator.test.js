/**
 * Unit Tests for SwaggerValidator
 */

const SwaggerValidator = require('../../src/core/SwaggerValidator');

describe('SwaggerValidator', () => {
    let validator;

    beforeEach(() => {
        validator = new SwaggerValidator();
    });

    const validOpenAPIDoc = {
        openapi: '3.0.0',
        info: {
            title: 'Test API',
            version: '1.0.0',
            description: 'A test API'
        },
        paths: {
            '/users': {
                get: {
                    summary: 'Get users',
                    responses: {
                        '200': {
                            description: 'Success'
                        }
                    }
                }
            }
        }
    };

    const validSwaggerDoc = {
        swagger: '2.0',
        info: {
            title: 'Test API',
            version: '1.0.0'
        },
        paths: {
            '/users': {
                get: {
                    summary: 'Get users',
                    responses: {
                        '200': {
                            description: 'Success'
                        }
                    }
                }
            }
        }
    };

    describe('Basic Structure Validation', () => {
        test('should validate correct OpenAPI document', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            expect(() => validator.validate(validOpenAPIDoc)).not.toThrow();
            expect(validator.errors).toHaveLength(0);

            consoleSpy.mockRestore();
        });

        test('should validate correct Swagger document', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            expect(() => validator.validate(validSwaggerDoc)).not.toThrow();
            expect(validator.errors).toHaveLength(0);

            consoleSpy.mockRestore();
        });

        test('should reject null documents', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            expect(() => validator.validate(null)).toThrow('Validation failed');
            expect(validator.errors).toContain('Swagger document is empty or null');

            consoleSpy.mockRestore();
        });

        test('should reject non-object documents', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            expect(() => validator.validate('not an object')).toThrow('Validation failed');
            expect(validator.errors).toContain('Swagger document must be an object');

            consoleSpy.mockRestore();
        });

        test('should require paths section', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const docWithoutPaths = { openapi: '3.0.0', info: { title: 'Test' } };

            expect(() => validator.validate(docWithoutPaths)).toThrow('Validation failed');
            expect(validator.errors).toContain('No paths found in Swagger document - required for API generation');

            consoleSpy.mockRestore();
        });

        test('should warn about missing info section', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const docWithoutInfo = { openapi: '3.0.0', paths: {} };

            validator.validate(docWithoutInfo);
            expect(validator.warnings).toContain('No info section found - recommended for proper documentation');

            consoleSpy.mockRestore();
        });
    });

    describe('Version Validation', () => {
        test('should accept valid OpenAPI versions', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const docs = [
                { ...validOpenAPIDoc, openapi: '3.0.0' },
                { ...validOpenAPIDoc, openapi: '3.0.1' },
                { ...validOpenAPIDoc, openapi: '3.1.0' }
            ];

            docs.forEach(doc => {
                validator = new SwaggerValidator();
                validator.validate(doc);
                expect(validator.warnings.filter(w => w.includes('version')).length).toBe(0);
            });

            consoleSpy.mockRestore();
        });

        test('should accept valid Swagger versions', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const doc = { ...validSwaggerDoc, swagger: '2.0' };

            validator.validate(doc);
            expect(validator.warnings.filter(w => w.includes('version')).length).toBe(0);

            consoleSpy.mockRestore();
        });

        test('should warn about unsupported versions', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const doc = { ...validOpenAPIDoc, openapi: '4.0.0' };

            validator.validate(doc);
            expect(validator.warnings.some(w => w.includes('may not be fully supported'))).toBe(true);

            consoleSpy.mockRestore();
        });

        test('should warn about missing version', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const docWithoutVersion = { info: { title: 'Test' }, paths: {} };

            validator.validate(docWithoutVersion);
            expect(validator.warnings).toContain('No OpenAPI/Swagger version specified - may cause compatibility issues');

            consoleSpy.mockRestore();
        });
    });

    describe('Path Validation', () => {
        test('should validate paths with operations', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            validator.validate(validOpenAPIDoc);
            expect(validator.errors.filter(e => e.includes('path')).length).toBe(0);

            consoleSpy.mockRestore();
        });

        test('should warn about paths without operations', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const docWithEmptyPath = {
                ...validOpenAPIDoc,
                paths: {
                    '/empty': {}
                }
            };

            validator.validate(docWithEmptyPath);
            expect(validator.warnings.some(w => w.includes('no HTTP operations'))).toBe(true);

            consoleSpy.mockRestore();
        });

        test('should error on invalid path definitions', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const docWithInvalidPath = {
                ...validOpenAPIDoc,
                paths: {
                    '/invalid': 'not an object'
                }
            };

            expect(() => validator.validate(docWithInvalidPath)).toThrow('Validation failed');
            expect(validator.errors.some(e => e.includes('invalid definition'))).toBe(true);

            consoleSpy.mockRestore();
        });

        test('should validate Next.js path compatibility', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const docWithSpecialChars = {
                ...validOpenAPIDoc,
                paths: {
                    '/users/{id}/posts@special': {
                        get: {
                            responses: { '200': { description: 'OK' } }
                        }
                    }
                }
            };

            validator.validate(docWithSpecialChars);
            expect(validator.warnings.some(w => w.includes('characters that may cause issues'))).toBe(true);

            consoleSpy.mockRestore();
        });

        test('should validate parameter names in paths', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const docWithInvalidParam = {
                ...validOpenAPIDoc,
                paths: {
                    '/users/{invalid-param}': {
                        get: {
                            responses: { '200': { description: 'OK' } }
                        }
                    }
                }
            };

            validator.validate(docWithInvalidParam);
            expect(validator.warnings.some(w => w.includes('may not be valid in Next.js'))).toBe(true);

            consoleSpy.mockRestore();
        });
    });

    describe('Operation Validation', () => {
        test('should warn about missing responses', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const docWithoutResponses = {
                ...validOpenAPIDoc,
                paths: {
                    '/users': {
                        get: {
                            summary: 'Get users'
                            // Missing responses
                        }
                    }
                }
            };

            validator.validate(docWithoutResponses);
            expect(validator.warnings.some(w => w.includes('no response definitions'))).toBe(true);

            consoleSpy.mockRestore();
        });

        test('should warn about missing documentation', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const docWithoutDocs = {
                ...validOpenAPIDoc,
                paths: {
                    '/users': {
                        get: {
                            responses: { '200': { description: 'OK' } }
                            // Missing summary and description
                        }
                    }
                }
            };

            validator.validate(docWithoutDocs);
            expect(validator.warnings.some(w => w.includes('no summary or description'))).toBe(true);

            consoleSpy.mockRestore();
        });

        test('should warn about missing success responses', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const docWithoutSuccessResponse = {
                ...validOpenAPIDoc,
                paths: {
                    '/users': {
                        get: {
                            responses: { '400': { description: 'Bad Request' } }
                        }
                    }
                }
            };

            validator.validate(docWithoutSuccessResponse);
            expect(validator.warnings.some(w => w.includes('No success response'))).toBe(true);

            consoleSpy.mockRestore();
        });
    });

    describe('Schema Validation', () => {
        test('should handle documents with schemas', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const docWithSchemas = {
                ...validOpenAPIDoc,
                components: {
                    schemas: {
                        User: {
                            type: 'object',
                            properties: {
                                id: { type: 'integer' },
                                name: { type: 'string' }
                            }
                        }
                    }
                }
            };

            validator.validate(docWithSchemas);
            expect(validator.errors.filter(e => e.includes('schema')).length).toBe(0);

            consoleSpy.mockRestore();
        });

        test('should warn about missing schemas', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            validator.validate(validOpenAPIDoc);
            expect(validator.warnings.some(w => w.includes('No schemas'))).toBe(true);

            consoleSpy.mockRestore();
        });

        test('should error on invalid schema definitions', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const docWithInvalidSchema = {
                ...validOpenAPIDoc,
                components: {
                    schemas: {
                        InvalidSchema: 'not an object'
                    }
                }
            };

            expect(() => validator.validate(docWithInvalidSchema)).toThrow('Validation failed');
            expect(validator.errors.some(e => e.includes('invalid definition'))).toBe(true);

            consoleSpy.mockRestore();
        });
    });

    describe('Parameter Validation', () => {
        test('should validate parameter definitions', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const docWithParams = {
                ...validOpenAPIDoc,
                paths: {
                    '/users/{id}': {
                        get: {
                            parameters: [
                                {
                                    name: 'id',
                                    in: 'path',
                                    required: true,
                                    schema: { type: 'integer' }
                                }
                            ],
                            responses: { '200': { description: 'OK' } }
                        }
                    }
                }
            };

            validator.validate(docWithParams);
            expect(validator.errors.filter(e => e.includes('parameter')).length).toBe(0);

            consoleSpy.mockRestore();
        });

        test('should error on parameters without names', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const docWithUnnamedParam = {
                ...validOpenAPIDoc,
                paths: {
                    '/users': {
                        get: {
                            parameters: [
                                {
                                    in: 'query',
                                    schema: { type: 'string' }
                                    // Missing name
                                }
                            ],
                            responses: { '200': { description: 'OK' } }
                        }
                    }
                }
            };

            expect(() => validator.validate(docWithUnnamedParam)).toThrow('Validation failed');
            expect(validator.errors.some(e => e.includes('has no name'))).toBe(true);

            consoleSpy.mockRestore();
        });

        test('should error on parameters without location', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const docWithoutLocation = {
                ...validOpenAPIDoc,
                paths: {
                    '/users': {
                        get: {
                            parameters: [
                                {
                                    name: 'filter',
                                    schema: { type: 'string' }
                                    // Missing 'in' property
                                }
                            ],
                            responses: { '200': { description: 'OK' } }
                        }
                    }
                }
            };

            expect(() => validator.validate(docWithoutLocation)).toThrow('Validation failed');
            expect(validator.errors.some(e => e.includes('has no location'))).toBe(true);

            consoleSpy.mockRestore();
        });

        test('should warn about parameters without schema', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const docWithoutSchema = {
                ...validOpenAPIDoc,
                paths: {
                    '/users': {
                        get: {
                            parameters: [
                                {
                                    name: 'filter',
                                    in: 'query'
                                    // Missing schema and type
                                }
                            ],
                            responses: { '200': { description: 'OK' } }
                        }
                    }
                }
            };

            validator.validate(docWithoutSchema);
            expect(validator.warnings.some(w => w.includes('has no schema or type'))).toBe(true);

            consoleSpy.mockRestore();
        });
    });

    describe('Edge Cases', () => {
        test('should handle empty paths object', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const docWithEmptyPaths = {
                ...validOpenAPIDoc,
                paths: {}
            };

            expect(() => validator.validate(docWithEmptyPaths)).toThrow('Validation failed');
            expect(validator.errors).toContain('No API paths found - nothing to generate');

            consoleSpy.mockRestore();
        });

        test('should handle very large documents', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            // Create a large document with many paths
            const largePaths = {};
            for (let i = 0; i < 100; i++) {
                largePaths[`/endpoint${i}`] = {
                    get: {
                        responses: { '200': { description: 'OK' } }
                    }
                };
            }

            const largeDoc = {
                ...validOpenAPIDoc,
                paths: largePaths
            };

            // This should not throw or timeout
            validator.validate(largeDoc);
            expect(validator.errors.length).toBe(0);

            consoleSpy.mockRestore();
        });

        test('should handle documents with circular references', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            const circularDoc = {
                ...validOpenAPIDoc
            };

            // Create circular reference in object
            circularDoc.selfRef = circularDoc;

            // Should not crash the validator
            expect(() => validator.validate(circularDoc)).not.toThrow();

            consoleSpy.mockRestore();
        });

        test('should handle malformed objects', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            const malformedDoc = {
                openapi: '3.0.0',
                info: { title: 'Test' },
                paths: {
                    '/test': {
                        get: {
                            responses: undefined // Undefined response
                        }
                    }
                }
            };

            validator.validate(malformedDoc);
            expect(validator.warnings.some(w => w.includes('no response definitions'))).toBe(true);

            consoleSpy.mockRestore();
        });
    });
});
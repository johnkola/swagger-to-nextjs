/**
 * Unit Tests for SwaggerValidator
 */

const SwaggerValidator = require('../../src/core/SwaggerValidator');

describe('SwaggerValidator', () => {
    let validator;
    let consoleSpy;

    beforeEach(() => {
        validator = new SwaggerValidator();
        // Mock console methods to prevent output during tests
        consoleSpy = {
            log: jest.spyOn(console, 'log').mockImplementation(),
            error: jest.spyOn(console, 'error').mockImplementation(),
            warn: jest.spyOn(console, 'warn').mockImplementation()
        };
    });

    afterEach(() => {
        // Restore console methods
        consoleSpy.log.mockRestore();
        consoleSpy.error.mockRestore();
        consoleSpy.warn.mockRestore();
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
        test('should validate correct OpenAPI document', async () => {
            const result = await validator.validate(validOpenAPIDoc);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        test('should validate correct Swagger document', async () => {
            const result = await validator.validate(validSwaggerDoc);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        test('should reject null documents', async () => {
            await expect(validator.validate(null)).rejects.toThrow('Validation failed');
            expect(validator.errors).toContain('Swagger document is empty or null');
        });

        test('should reject non-object documents', async () => {
            await expect(validator.validate('not an object')).rejects.toThrow('Validation failed');
            expect(validator.errors).toContain('Swagger document must be an object');
        });

        test('should require paths section', async () => {
            const docWithoutPaths = { openapi: '3.0.0', info: { title: 'Test', version: '1.0.0' } };
            await expect(validator.validate(docWithoutPaths)).rejects.toThrow('Validation failed');
            expect(validator.errors).toContain('No paths found in Swagger document - required for API generation');
        });

        test('should warn about missing info section', async () => {
            const docWithoutInfo = { openapi: '3.0.0', paths: { '/test': { get: { responses: { '200': { description: 'OK' } } } } } };
            const result = await validator.validate(docWithoutInfo);
            expect(result.warnings).toContain('No info section found - recommended for proper documentation');
        });
    });

    describe('Version Validation', () => {
        test('should accept valid OpenAPI versions', async () => {
            const versions = ['3.0.0', '3.0.1', '3.0.2', '3.0.3', '3.1.0', '3.2.0'];

            for (const version of versions) {
                const doc = { ...validOpenAPIDoc, openapi: version };
                validator = new SwaggerValidator();
                const result = await validator.validate(doc);
                expect(result.warnings.filter(w => w.includes('may not be fully supported'))).toHaveLength(0);
            }
        });

        test('should accept valid Swagger versions', async () => {
            const doc = { ...validSwaggerDoc, swagger: '2.0' };
            const result = await validator.validate(doc);
            expect(result.warnings.filter(w => w.includes('may not be fully supported'))).toHaveLength(0);
        });

        test('should warn about unsupported versions', async () => {
            const doc = { ...validOpenAPIDoc, openapi: '4.0.0' };
            const result = await validator.validate(doc);
            expect(result.warnings.some(w => w.includes('may not be fully supported'))).toBe(true);
        });

        test('should warn about missing version', async () => {
            const docWithoutVersion = {
                info: { title: 'Test', version: '1.0.0' },
                paths: { '/test': { get: { responses: { '200': { description: 'OK' } } } } }
            };
            const result = await validator.validate(docWithoutVersion);
            expect(result.warnings).toContain('No OpenAPI/Swagger version specified - may cause compatibility issues');
        });
    });

    describe('Path Validation', () => {
        test('should validate paths with operations', async () => {
            const result = await validator.validate(validOpenAPIDoc);
            expect(result.errors.filter(e => e.includes('path'))).toHaveLength(0);
        });

        test('should warn about paths without operations', async () => {
            const docWithEmptyPath = {
                ...validOpenAPIDoc,
                paths: {
                    ...validOpenAPIDoc.paths,
                    '/empty': {}
                }
            };
            const result = await validator.validate(docWithEmptyPath);
            expect(result.warnings.some(w => w.includes('no HTTP operations'))).toBe(true);
        });

        test('should error on invalid path definitions', async () => {
            const docWithInvalidPath = {
                ...validOpenAPIDoc,
                paths: {
                    '/invalid': 'not an object'
                }
            };
            const result = await validator.validate(docWithInvalidPath);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('invalid definition'))).toBe(true);
        });

        test('should validate Next.js path compatibility', async () => {
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
            const result = await validator.validate(docWithSpecialChars);
            expect(result.warnings.some(w => w.includes('characters that may cause issues'))).toBe(true);
        });

        test('should validate parameter names in paths', async () => {
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
            const result = await validator.validate(docWithInvalidParam);
            expect(result.warnings.some(w => w.includes('may not be valid in Next.js'))).toBe(true);
        });
    });

    describe('Operation Validation', () => {
        test('should warn about missing responses', async () => {
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
            const result = await validator.validate(docWithoutResponses);
            expect(result.warnings.some(w => w.includes('no response definitions'))).toBe(true);
        });

        test('should warn about missing documentation', async () => {
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
            const result = await validator.validate(docWithoutDocs);
            expect(result.warnings.some(w => w.includes('no summary or description'))).toBe(true);
        });

        test('should warn about missing success responses', async () => {
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
            const result = await validator.validate(docWithoutSuccessResponse);
            expect(result.warnings.some(w => w.includes('No success response'))).toBe(true);
        });

        test('should warn about POST without request body', async () => {
            const docWithPostNoBody = {
                ...validOpenAPIDoc,
                paths: {
                    '/users': {
                        post: {
                            summary: 'Create user',
                            responses: { '201': { description: 'Created' } }
                        }
                    }
                }
            };
            const result = await validator.validate(docWithPostNoBody);
            expect(result.warnings.some(w => w.includes('POST operation typically has a request body'))).toBe(true);
        });
    });

    describe('Schema Validation', () => {
        test('should handle documents with schemas', async () => {
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
            const result = await validator.validate(docWithSchemas);
            expect(result.errors.filter(e => e.includes('schema'))).toHaveLength(0);
            expect(result.stats.schemas).toBe(1);
        });

        test('should warn about missing schemas', async () => {
            const result = await validator.validate(validOpenAPIDoc);
            expect(result.warnings.some(w => w.includes('No schemas'))).toBe(true);
        });

        test('should error on invalid schema definitions', async () => {
            const docWithInvalidSchema = {
                ...validOpenAPIDoc,
                components: {
                    schemas: {
                        InvalidSchema: 'not an object'
                    }
                }
            };
            const result = await validator.validate(docWithInvalidSchema);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('invalid definition'))).toBe(true);
        });
    });

    describe('Parameter Validation', () => {
        test('should validate parameter definitions', async () => {
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
            const result = await validator.validate(docWithParams);
            expect(result.errors.filter(e => e.includes('parameter'))).toHaveLength(0);
        });

        test('should error on parameters without names', async () => {
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
            const result = await validator.validate(docWithUnnamedParam);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('has no name'))).toBe(true);
        });

        test('should error on parameters without location', async () => {
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
            const result = await validator.validate(docWithoutLocation);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('has no location'))).toBe(true);
        });

        test('should warn about parameters without schema', async () => {
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
            const result = await validator.validate(docWithoutSchema);
            expect(result.warnings.some(w => w.includes('has no schema or type'))).toBe(true);
        });
    });

    describe('Edge Cases', () => {
        test('should handle empty paths object', async () => {
            const docWithEmptyPaths = {
                ...validOpenAPIDoc,
                paths: {}
            };
            await expect(validator.validate(docWithEmptyPaths)).rejects.toThrow('Validation failed');
            expect(validator.errors).toContain('No API paths found - nothing to generate');
        });

        test('should handle very large documents', async () => {
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
            const result = await validator.validate(largeDoc);
            expect(result.errors).toHaveLength(0);
            expect(result.stats.paths).toBe(100);
            expect(result.stats.operations).toBe(100);
        });

        test('should handle documents with circular references', async () => {
            const circularDoc = {
                ...validOpenAPIDoc
            };

            // Create circular reference in object
            circularDoc.selfRef = circularDoc;

            // Should not crash the validator
            const result = await validator.validate(circularDoc);
            expect(result.valid).toBe(true);
        });

        test('should handle malformed objects', async () => {
            const malformedDoc = {
                openapi: '3.0.0',
                info: { title: 'Test', version: '1.0.0' },
                paths: {
                    '/test': {
                        get: {
                            responses: undefined // Undefined response
                        }
                    }
                }
            };
            const result = await validator.validate(malformedDoc);
            expect(result.warnings.some(w => w.includes('no response definitions'))).toBe(true);
        });
    });

    describe('Utility Methods', () => {
        test('should provide validation summary', async () => {
            await validator.validate(validOpenAPIDoc);
            const summary = validator.getSummary();
            expect(summary).toContain('Validation passed');
            expect(summary).toContain('1 paths');
            expect(summary).toContain('1 operations');
        });

        test('should check if generation is possible', async () => {
            await validator.validate(validOpenAPIDoc);
            expect(validator.canGenerate()).toBe(true);

            // Test with invalid doc
            validator = new SwaggerValidator();
            const emptyPathsDoc = {
                openapi: '3.0.0',
                info: { title: 'Test', version: '1.0.0' },
                paths: {}
            };

            try {
                await validator.validate(emptyPathsDoc);
            } catch (e) {
                // Expected to fail
            }

            // Check that canGenerate returns false when validationResult is null or invalid
            expect(validator.canGenerate()).toBe(false);
        });
    });
});
/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - AI PROMPT
 * ============================================================================
 * FILE: test/core/SwaggerValidator.test.js
 * VERSION: 2025-06-17 16:21:39
 * PHASE: Phase 9: Test Files
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 *
 * Create a test file using Node.js built-in test framework for the
 * SwaggerValidator class. Use ES Module imports for test, assert, and the
 * SwaggerValidator class. Write tests to verify validation of complete
 * valid specs, detection of missing required fields, generation of
 * operationIds when missing, validation of path operations, detection of
 * invalid $ref references, separation of errors and warnings, detailed
 * error message formatting, handling of empty paths object, validation of
 * response schemas, extraction of UI hints from x-ui extensions, and edge
 * cases in OpenAPI specifications. Use describe and it blocks with async
 * functions where needed.
 *
 * ============================================================================
 */
/**
 * SwaggerValidator.test.js
 * Unit tests for the SwaggerValidator class
 */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import SwaggerValidator from '../../src/core/SwaggerValidator.js';

describe('SwaggerValidator', () => {
    let validator;

    beforeEach(() => {
        validator = new SwaggerValidator();
    });

    describe('Basic Structure Validation', () => {
        it('should validate a minimal valid OpenAPI 3.0 spec', () => {
            const spec = {
                openapi: '3.0.0',
                info: {
                    title: 'Test API',
                    version: '1.0.0'
                },
                paths: {
                    '/test': {
                        get: {
                            responses: {
                                '200': { description: 'Success' }
                            }
                        }
                    }
                }
            };

            const result = validator.validate(spec);
            assert.ok(result.valid);
            assert.equal(result.errors.length, 0);
        });

        it('should validate a minimal valid Swagger 2.0 spec', () => {
            const spec = {
                swagger: '2.0',
                info: {
                    title: 'Test API',
                    version: '1.0.0'
                },
                paths: {
                    '/test': {
                        get: {
                            responses: {
                                '200': { description: 'Success' }
                            }
                        }
                    }
                }
            };

            const result = validator.validate(spec);
            assert.ok(result.valid);
            assert.equal(result.errors.length, 0);
        });

        it('should error on missing version field', () => {
            const spec = {
                info: {
                    title: 'Test API',
                    version: '1.0.0'
                },
                paths: {}
            };

            const result = validator.validate(spec);
            assert.ok(!result.valid);
            assert.ok(result.errors.some(e => e.message.includes('Missing version field')));
        });

        it('should error on invalid OpenAPI version format', () => {
            const spec = {
                openapi: '3.0',
                info: {
                    title: 'Test API',
                    version: '1.0.0'
                },
                paths: {}
            };

            const result = validator.validate(spec);
            assert.ok(!result.valid);
            assert.ok(result.errors.some(e => e.message.includes('Invalid OpenAPI version')));
        });

        it('should error on missing required fields', () => {
            const spec = {
                openapi: '3.0.0'
            };

            const result = validator.validate(spec);
            assert.ok(!result.valid);
            assert.ok(result.errors.some(e => e.message.includes('Missing required field: info')));
            assert.ok(result.errors.some(e => e.message.includes('Missing required field: paths')));
        });
    });

    describe('Info Section Validation', () => {
        it('should error on missing title', () => {
            const spec = {
                openapi: '3.0.0',
                info: {
                    version: '1.0.0'
                },
                paths: {}
            };

            const result = validator.validate(spec);
            assert.ok(!result.valid);
            assert.ok(result.errors.some(e => e.message === 'info.title is required'));
        });

        it('should error on missing version', () => {
            const spec = {
                openapi: '3.0.0',
                info: {
                    title: 'Test API'
                },
                paths: {}
            };

            const result = validator.validate(spec);
            assert.ok(!result.valid);
            assert.ok(result.errors.some(e => e.message === 'info.version is required'));
        });

        it('should error on non-string title', () => {
            const spec = {
                openapi: '3.0.0',
                info: {
                    title: 123,
                    version: '1.0.0'
                },
                paths: {}
            };

            const result = validator.validate(spec);
            assert.ok(!result.valid);
            assert.ok(result.errors.some(e => e.message === 'info.title must be a string'));
        });
    });

    describe('Paths Validation', () => {
        it('should error on empty paths object', () => {
            const spec = {
                openapi: '3.0.0',
                info: {
                    title: 'Test API',
                    version: '1.0.0'
                },
                paths: {}
            };

            const result = validator.validate(spec);
            assert.ok(!result.valid);
            assert.ok(result.errors.some(e => e.message.includes('paths object is empty')));
        });

        it('should warn on paths not starting with /', () => {
            const spec = {
                openapi: '3.0.0',
                info: {
                    title: 'Test API',
                    version: '1.0.0'
                },
                paths: {
                    'test': {
                        get: {
                            responses: { '200': { description: 'Success' } }
                        }
                    }
                }
            };

            const result = validator.validate(spec);
            assert.ok(result.warnings.some(w => w.message.includes("Path should start with '/'")));
        });

        it('should error on paths without operations', () => {
            const spec = {
                openapi: '3.0.0',
                info: {
                    title: 'Test API',
                    version: '1.0.0'
                },
                paths: {
                    '/test': {}
                }
            };

            const result = validator.validate(spec);
            assert.ok(!result.valid);
            assert.ok(result.errors.some(e => e.message.includes('must have at least one operation')));
        });
    });

    describe('Operation Validation', () => {
        it('should generate operationId if missing', () => {
            const spec = {
                openapi: '3.0.0',
                info: {
                    title: 'Test API',
                    version: '1.0.0'
                },
                paths: {
                    '/users/{userId}/posts': {
                        get: {
                            responses: { '200': { description: 'Success' } }
                        }
                    }
                }
            };

            const result = validator.validate(spec);
            assert.ok(result.warnings.some(w => w.message.includes('Generated: getUsersByUserIdPosts')));
            assert.equal(spec.paths['/users/{userId}/posts'].get.operationId, 'getUsersByUserIdPosts');
        });

        it('should warn on invalid operationId characters', () => {
            const spec = {
                openapi: '3.0.0',
                info: {
                    title: 'Test API',
                    version: '1.0.0'
                },
                paths: {
                    '/test': {
                        get: {
                            operationId: 'get-test-operation',
                            responses: { '200': { description: 'Success' } }
                        }
                    }
                }
            };

            const result = validator.validate(spec);
            assert.ok(result.warnings.some(w => w.message.includes('operationId contains invalid characters')));
        });

        it('should error on missing responses', () => {
            const spec = {
                openapi: '3.0.0',
                info: {
                    title: 'Test API',
                    version: '1.0.0'
                },
                paths: {
                    '/test': {
                        get: {}
                    }
                }
            };

            const result = validator.validate(spec);
            assert.ok(!result.valid);
            assert.ok(result.errors.some(e => e.message.includes("Missing required field 'responses'")));
        });

        it('should warn on missing summary/description', () => {
            const spec = {
                openapi: '3.0.0',
                info: {
                    title: 'Test API',
                    version: '1.0.0'
                },
                paths: {
                    '/test': {
                        get: {
                            responses: { '200': { description: 'Success' } }
                        }
                    }
                }
            };

            const result = validator.validate(spec);
            assert.ok(result.warnings.some(w => w.message.includes('should have a summary or description')));
        });
    });

    describe('Response Validation', () => {
        it('should error on empty responses object', () => {
            const spec = {
                openapi: '3.0.0',
                info: {
                    title: 'Test API',
                    version: '1.0.0'
                },
                paths: {
                    '/test': {
                        get: {
                            responses: {}
                        }
                    }
                }
            };

            const result = validator.validate(spec);
            assert.ok(!result.valid);
            assert.ok(result.errors.some(e => e.message.includes('Responses object is empty')));
        });

        it('should warn on missing success response', () => {
            const spec = {
                openapi: '3.0.0',
                info: {
                    title: 'Test API',
                    version: '1.0.0'
                },
                paths: {
                    '/test': {
                        get: {
                            responses: {
                                '400': { description: 'Bad Request' },
                                '500': { description: 'Server Error' }
                            }
                        }
                    }
                }
            };

            const result = validator.validate(spec);
            assert.ok(result.warnings.some(w => w.message.includes('No success response (2xx) defined')));
        });

        it('should error on missing response description', () => {
            const spec = {
                openapi: '3.0.0',
                info: {
                    title: 'Test API',
                    version: '1.0.0'
                },
                paths: {
                    '/test': {
                        get: {
                            responses: {
                                '200': {}
                            }
                        }
                    }
                }
            };

            const result = validator.validate(spec);
            assert.ok(!result.valid);
            assert.ok(result.errors.some(e => e.message.includes('Response must have a description')));
        });

        it('should warn on success response without content (OpenAPI 3.0)', () => {
            const spec = {
                openapi: '3.0.0',
                info: {
                    title: 'Test API',
                    version: '1.0.0'
                },
                paths: {
                    '/test': {
                        get: {
                            responses: {
                                '200': { description: 'Success' }
                            }
                        }
                    }
                }
            };

            const result = validator.validate(spec);
            assert.ok(result.warnings.some(w => w.message.includes('Success response should define content')));
        });

        it('should not warn on 204 response without content', () => {
            const spec = {
                openapi: '3.0.0',
                info: {
                    title: 'Test API',
                    version: '1.0.0'
                },
                paths: {
                    '/test': {
                        delete: {
                            responses: {
                                '204': { description: 'No Content' }
                            }
                        }
                    }
                }
            };

            const result = validator.validate(spec);
            assert.ok(!result.warnings.some(w => w.message.includes('204') && w.message.includes('content')));
        });
    });

    describe('Parameter Validation', () => {
        it('should error on missing parameter name', () => {
            const spec = {
                openapi: '3.0.0',
                info: {
                    title: 'Test API',
                    version: '1.0.0'
                },
                paths: {
                    '/test': {
                        get: {
                            parameters: [
                                { in: 'query' }
                            ],
                            responses: { '200': { description: 'Success' } }
                        }
                    }
                }
            };

            const result = validator.validate(spec);
            assert.ok(!result.valid);
            assert.ok(result.errors.some(e => e.message.includes('Parameter must have a name')));
        });

        it('should error on duplicate parameters', () => {
            const spec = {
                openapi: '3.0.0',
                info: {
                    title: 'Test API',
                    version: '1.0.0'
                },
                paths: {
                    '/test': {
                        get: {
                            parameters: [
                                { name: 'limit', in: 'query' },
                                { name: 'limit', in: 'query' }
                            ],
                            responses: { '200': { description: 'Success' } }
                        }
                    }
                }
            };

            const result = validator.validate(spec);
            assert.ok(!result.valid);
            assert.ok(result.errors.some(e => e.message.includes("Duplicate parameter 'limit'")));
        });

        it('should error on path parameter not in path', () => {
            const spec = {
                openapi: '3.0.0',
                info: {
                    title: 'Test API',
                    version: '1.0.0'
                },
                paths: {
                    '/users': {
                        get: {
                            parameters: [
                                { name: 'userId', in: 'path', required: true }
                            ],
                            responses: { '200': { description: 'Success' } }
                        }
                    }
                }
            };

            const result = validator.validate(spec);
            assert.ok(!result.valid);
            assert.ok(result.errors.some(e => e.message.includes("Path parameter 'userId' not found in path")));
        });

        it('should error on non-required path parameter', () => {
            const spec = {
                openapi: '3.0.0',
                info: {
                    title: 'Test API',
                    version: '1.0.0'
                },
                paths: {
                    '/users/{userId}': {
                        get: {
                            parameters: [
                                { name: 'userId', in: 'path', required: false }
                            ],
                            responses: { '200': { description: 'Success' } }
                        }
                    }
                }
            };

            const result = validator.validate(spec);
            assert.ok(!result.valid);
            assert.ok(result.errors.some(e => e.message.includes('Path parameters must be required')));
        });

        it('should error on missing path parameter definition', () => {
            const spec = {
                openapi: '3.0.0',
                info: {
                    title: 'Test API',
                    version: '1.0.0'
                },
                paths: {
                    '/users/{userId}': {
                        get: {
                            responses: { '200': { description: 'Success' } }
                        }
                    }
                }
            };

            const result = validator.validate(spec);
            assert.ok(!result.valid);
            assert.ok(result.errors.some(e => e.message.includes("Missing definition for path parameter 'userId'")));
        });
    });

    describe('Schema Validation', () => {
        it('should warn on schema without type', () => {
            const spec = {
                openapi: '3.0.0',
                info: {
                    title: 'Test API',
                    version: '1.0.0'
                },
                paths: {
                    '/test': {
                        get: {
                            responses: { '200': { description: 'Success' } }
                        }
                    }
                },
                components: {
                    schemas: {
                        User: {
                            properties: {
                                id: { type: 'string' }
                            }
                        }
                    }
                }
            };

            const result = validator.validate(spec);
            assert.ok(result.warnings.some(w => w.message.includes('Schema should define a type')));
        });

        it('should warn on object schema without properties', () => {
            const spec = {
                openapi: '3.0.0',
                info: {
                    title: 'Test API',
                    version: '1.0.0'
                },
                paths: {
                    '/test': {
                        get: {
                            responses: { '200': { description: 'Success' } }
                        }
                    }
                },
                components: {
                    schemas: {
                        User: {
                            type: 'object'
                        }
                    }
                }
            };

            const result = validator.validate(spec);
            assert.ok(result.warnings.some(w => w.message.includes('Object schema should define properties')));
        });

        it('should error on array schema without items', () => {
            const spec = {
                openapi: '3.0.0',
                info: {
                    title: 'Test API',
                    version: '1.0.0'
                },
                paths: {
                    '/test': {
                        get: {
                            responses: { '200': { description: 'Success' } }
                        }
                    }
                },
                components: {
                    schemas: {
                        UserList: {
                            type: 'array'
                        }
                    }
                }
            };

            const result = validator.validate(spec);
            assert.ok(!result.valid);
            assert.ok(result.errors.some(e => e.message.includes('Array schema must define items')));
        });

        it('should error on required property not in properties', () => {
            const spec = {
                openapi: '3.0.0',
                info: {
                    title: 'Test API',
                    version: '1.0.0'
                },
                paths: {
                    '/test': {
                        get: {
                            responses: { '200': { description: 'Success' } }
                        }
                    }
                },
                components: {
                    schemas: {
                        User: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' }
                            },
                            required: ['id', 'name']
                        }
                    }
                }
            };

            const result = validator.validate(spec);
            assert.ok(!result.valid);
            assert.ok(result.errors.some(e => e.message.includes("Required property 'name' not defined")));
        });
    });

    describe('Common Issues', () => {
        it('should warn on empty schemas', () => {
            const spec = {
                openapi: '3.0.0',
                info: {
                    title: 'Test API',
                    version: '1.0.0'
                },
                paths: {
                    '/test': {
                        get: {
                            responses: { '200': { description: 'Success' } }
                        }
                    }
                },
                components: {
                    schemas: {
                        EmptySchema: {}
                    }
                }
            };

            const result = validator.validate(spec);
            assert.ok(result.warnings.some(w => w.message.includes("Schema 'EmptySchema' is empty")));
        });

        it('should warn on operations without tags', () => {
            const spec = {
                openapi: '3.0.0',
                info: {
                    title: 'Test API',
                    version: '1.0.0'
                },
                paths: {
                    '/test': {
                        get: {
                            responses: { '200': { description: 'Success' } }
                        },
                        post: {
                            responses: { '201': { description: 'Created' } }
                        }
                    }
                }
            };

            const result = validator.validate(spec);
            assert.ok(result.warnings.some(w => w.message.includes('operations have no tags')));
        });

        it('should warn on missing servers', () => {
            const spec = {
                openapi: '3.0.0',
                info: {
                    title: 'Test API',
                    version: '1.0.0'
                },
                paths: {
                    '/test': {
                        get: {
                            responses: { '200': { description: 'Success' } }
                        }
                    }
                }
            };

            const result = validator.validate(spec);
            assert.ok(result.warnings.some(w => w.message.includes('No servers defined')));
        });
    });

    describe('Request Body Validation', () => {
        it('should error on request body without content', () => {
            const spec = {
                openapi: '3.0.0',
                info: {
                    title: 'Test API',
                    version: '1.0.0'
                },
                paths: {
                    '/test': {
                        post: {
                            requestBody: {},
                            responses: { '201': { description: 'Created' } }
                        }
                    }
                }
            };

            const result = validator.validate(spec);
            assert.ok(!result.valid);
            assert.ok(result.errors.some(e => e.message.includes('Request body must have content')));
        });

        it('should warn on content without schema', () => {
            const spec = {
                openapi: '3.0.0',
                info: {
                    title: 'Test API',
                    version: '1.0.0'
                },
                paths: {
                    '/test': {
                        post: {
                            requestBody: {
                                content: {
                                    'application/json': {}
                                }
                            },
                            responses: { '201': { description: 'Created' } }
                        }
                    }
                }
            };

            const result = validator.validate(spec);
            assert.ok(result.warnings.some(w => w.message.includes('Missing schema definition')));
        });
    });
});
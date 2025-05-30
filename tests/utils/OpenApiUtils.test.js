/**
 * Unit tests for OpenApiUtils.js
 * Testing advanced OpenAPI specification manipulation utilities
 */

const { OpenApiUtils, createOpenApiUtils, OpenApiHelpers } = require('../../src/utils/OpenApiUtils.js');

describe('OpenApiUtils', () => {
    let mockSpec;
    let utils;

    beforeEach(() => {
        mockSpec = {
            openapi: '3.0.3',
            info: {
                title: 'Test API',
                version: '1.0.0'
            },
            paths: {
                '/users': {
                    get: {
                        operationId: 'getUsers',
                        tags: ['users'],
                        summary: 'Get all users',
                        responses: {
                            '200': {
                                description: 'Success',
                                content: {
                                    'application/json': {
                                        schema: {
                                            $ref: '#/components/schemas/UserList'
                                        }
                                    }
                                }
                            }
                        }
                    },
                    post: {
                        tags: ['users'],
                        summary: 'Create user',
                        requestBody: {
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/CreateUserRequest'
                                    }
                                }
                            }
                        },
                        responses: {
                            '201': {
                                description: 'Created',
                                content: {
                                    'application/json': {
                                        schema: {
                                            $ref: '#/components/schemas/User'
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                '/users/{id}': {
                    get: {
                        operationId: 'getUserById',
                        tags: ['users'],
                        parameters: [
                            {
                                name: 'id',
                                in: 'path',
                                required: true,
                                schema: { type: 'string' }
                            }
                        ],
                        responses: {
                            '200': {
                                description: 'Success',
                                content: {
                                    'application/json': {
                                        schema: {
                                            $ref: '#/components/schemas/User'
                                        }
                                    }
                                }
                            },
                            '404': {
                                description: 'Not found'
                            }
                        }
                    },
                    delete: {
                        tags: ['users'],
                        parameters: [
                            {
                                name: 'id',
                                in: 'path',
                                required: true,
                                schema: { type: 'string' }
                            }
                        ],
                        responses: {
                            '204': {
                                description: 'Deleted'
                            }
                        }
                    }
                },
                '/posts': {
                    get: {
                        tags: ['posts'],
                        responses: {
                            '200': {
                                description: 'Success'
                            }
                        }
                    }
                }
            },
            components: {
                schemas: {
                    User: {
                        type: 'object',
                        required: ['id', 'email'],
                        properties: {
                            id: {
                                type: 'string',
                                description: 'User ID'
                            },
                            email: {
                                type: 'string',
                                format: 'email'
                            },
                            name: {
                                type: 'string'
                            },
                            profile: {
                                $ref: '#/components/schemas/UserProfile'
                            },
                            tags: {
                                type: 'array',
                                items: {
                                    type: 'string'
                                }
                            }
                        }
                    },
                    UserProfile: {
                        type: 'object',
                        properties: {
                            bio: {
                                type: 'string'
                            },
                            avatar: {
                                type: 'string',
                                format: 'url'
                            },
                            settings: {
                                type: 'object',
                                properties: {
                                    theme: {
                                        type: 'string',
                                        enum: ['light', 'dark']
                                    },
                                    notifications: {
                                        type: 'boolean'
                                    }
                                }
                            }
                        }
                    },
                    UserList: {
                        type: 'object',
                        properties: {
                            users: {
                                type: 'array',
                                items: {
                                    $ref: '#/components/schemas/User'
                                }
                            },
                            total: {
                                type: 'integer'
                            }
                        }
                    },
                    CreateUserRequest: {
                        type: 'object',
                        required: ['email'],
                        properties: {
                            email: {
                                type: 'string',
                                format: 'email'
                            },
                            name: {
                                type: 'string'
                            }
                        }
                    }
                }
            }
        };

        utils = new OpenApiUtils(mockSpec);
    });

    describe('Constructor', () => {
        test('should create instance with cloned spec', () => {
            expect(utils.spec).toEqual(mockSpec);
            expect(utils.spec).not.toBe(mockSpec); // Should be a clone
        });

        test('should initialize empty maps and sets', () => {
            expect(utils.resolvedRefs).toBeInstanceOf(Map);
            expect(utils.circularRefs).toBeInstanceOf(Set);
            expect(utils.resolvedRefs.size).toBe(0);
            expect(utils.circularRefs.size).toBe(0);
        });
    });

    describe('resolveReferences', () => {
        test('should resolve simple $ref', () => {
            const obj = { $ref: '#/components/schemas/User' };
            const resolved = utils.resolveReferences(obj);

            // Should resolve to the actual User schema with nested refs also resolved
            expect(resolved.type).toBe('object');
            expect(resolved.properties.id.type).toBe('string');
            expect(resolved.properties.email.type).toBe('string');
            expect(resolved.$ref).toBeUndefined();
            // The profile property should also be resolved (not a $ref anymore)
            expect(resolved.properties.profile.$ref).toBeUndefined();
            expect(resolved.properties.profile.type).toBe('object');
        });

        test('should resolve nested $refs', () => {
            const resolved = utils.resolveReferences();
            const userListSchema = resolved.paths['/users'].get.responses['200'].content['application/json'].schema;

            // Should be resolved, not a $ref
            expect(userListSchema.$ref).toBeUndefined();
            expect(userListSchema.type).toBe('object');
            expect(userListSchema.properties.users.items.type).toBe('object');
            expect(userListSchema.properties.users.items.properties.id.type).toBe('string');
        });

        test('should handle arrays', () => {
            const obj = [{ $ref: '#/components/schemas/User' }, { name: 'test' }];
            const resolved = utils.resolveReferences(obj);

            // First item should be resolved User schema
            expect(resolved[0].type).toBe('object');
            expect(resolved[0].properties.id.type).toBe('string');
            expect(resolved[0].$ref).toBeUndefined();
            // Second item should remain unchanged
            expect(resolved[1]).toEqual({ name: 'test' });
        });

        test('should handle primitive values', () => {
            expect(utils.resolveReferences('string')).toBe('string');
            expect(utils.resolveReferences(123)).toBe(123);
            expect(utils.resolveReferences(null)).toBe(null);
        });

        test('should detect circular references', () => {
            const circularSpec = {
                components: {
                    schemas: {
                        A: {
                            type: 'object',
                            properties: {
                                b: { $ref: '#/components/schemas/B' }
                            }
                        },
                        B: {
                            type: 'object',
                            properties: {
                                a: { $ref: '#/components/schemas/A' }
                            }
                        }
                    }
                }
            };

            const circularUtils = new OpenApiUtils(circularSpec);
            const resolved = circularUtils.resolveReferences();

            expect(circularUtils.circularRefs.size).toBeGreaterThan(0);
        });
    });

    describe('_resolveReference', () => {
        test('should resolve valid reference path', () => {
            const resolved = utils._resolveReference('#/components/schemas/User');
            expect(resolved).toEqual(mockSpec.components.schemas.User);
        });

        test('should return null for invalid reference', () => {
            const resolved = utils._resolveReference('#/components/schemas/NonExistent');
            expect(resolved).toBe(null);
        });

        test('should warn about external references', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            const resolved = utils._resolveReference('external.yaml#/User');

            expect(resolved).toBe(null);
            expect(consoleSpy).toHaveBeenCalledWith('External references not supported: external.yaml#/User');

            consoleSpy.mockRestore();
        });
    });

    describe('flattenSchema', () => {
        test('should handle simple object schema', () => {
            const schema = {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    age: { type: 'integer' }
                },
                required: ['name']
            };

            const flattened = utils.flattenSchema(schema);

            expect(flattened.name).toBeDefined();
            expect(flattened.age).toBeDefined();
            expect(flattened.name._required).toBe(true);
            expect(flattened.age._required).toBe(false);
            expect(flattened.name.type).toBe('string');
            expect(flattened.age.type).toBe('integer');
        });

        test('should flatten nested object schema', () => {
            const schema = {
                type: 'object',
                properties: {
                    user: {
                        type: 'object',
                        properties: {
                            profile: {
                                type: 'object',
                                properties: {
                                    bio: { type: 'string' }
                                }
                            }
                        }
                    }
                }
            };

            const flattened = utils.flattenSchema(schema);

            expect(flattened['user.profile.bio']).toBeDefined();
            expect(flattened['user.profile.bio'].type).toBe('string');
            expect(flattened['user.profile.bio']._originalPath).toEqual(['user', 'profile', 'bio']);
        });

        test('should handle array schemas', () => {
            const schema = {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' }
                    }
                }
            };

            const flattened = utils.flattenSchema(schema, 'items');
            expect(flattened['items[].name']).toBeDefined();
            expect(flattened['items[].name'].type).toBe('string');
            expect(flattened['items[].name']._originalPath).toEqual(['items[]', 'name']);
        });

        test('should handle non-object schemas', () => {
            const schema = { type: 'string' };
            const flattened = utils.flattenSchema(schema, 'value');

            expect(flattened.value).toBeDefined();
            expect(flattened.value.type).toBe('string');
            expect(flattened.value._originalPath).toEqual(['value']);
        });
    });

    describe('groupOperations', () => {
        test('should group operations by tags', () => {
            const grouped = utils.groupOperations('tags');

            expect(grouped).toHaveProperty('users');
            expect(grouped).toHaveProperty('posts');
            expect(grouped.users).toHaveLength(4); // get, post, get by id, delete
            expect(grouped.posts).toHaveLength(1);
        });

        test('should group operations by paths', () => {
            const grouped = utils.groupOperations('paths');

            expect(grouped).toHaveProperty('users');
            expect(grouped).toHaveProperty('posts');
        });

        test('should group operations by methods', () => {
            const grouped = utils.groupOperations('methods');

            expect(grouped).toHaveProperty('GET');
            expect(grouped).toHaveProperty('POST');
            expect(grouped).toHaveProperty('DELETE');
        });

        test('should group operations with custom function', () => {
            const customGroupFn = (op) => op.path.includes('{id}') ? 'parameterized' : 'simple';
            const grouped = utils.groupOperations(customGroupFn);

            expect(grouped).toHaveProperty('parameterized');
            expect(grouped).toHaveProperty('simple');
            expect(grouped.parameterized).toHaveLength(2); // get and delete by id
        });
    });

    describe('extractOperations', () => {
        test('should extract all operations with metadata', () => {
            const operations = utils.extractOperations();

            expect(operations).toHaveLength(5);

            const getUsersOp = operations.find(op => op.operationId === 'getUsers');
            expect(getUsersOp).toBeDefined();
            expect(getUsersOp.path).toBe('/users');
            expect(getUsersOp.method).toBe('get');
            expect(getUsersOp.tags).toEqual(['users']);
            expect(getUsersOp._hasRequestBody).toBe(false);
            expect(getUsersOp._responseTypes).toEqual(['200']);
        });

        test('should generate operation IDs for missing ones', () => {
            const operations = utils.extractOperations();
            const postUsersOp = operations.find(op => op.method === 'post' && op.path === '/users');

            expect(postUsersOp.operationId).toBe('postUsers');
        });

        test('should extract path parameters', () => {
            const operations = utils.extractOperations();
            const getUserByIdOp = operations.find(op => op.operationId === 'getUserById');

            expect(getUserByIdOp._pathParams).toEqual(['id']);
        });

        test('should calculate operation complexity', () => {
            const operations = utils.extractOperations();
            const postUsersOp = operations.find(op => op.method === 'post' && op.path === '/users');

            expect(postUsersOp._complexity).toBeGreaterThan(1); // Has request body and responses
        });
    });

    describe('optimizeSpec', () => {
        test('should optimize with default options', () => {
            const optimized = utils.optimizeSpec();

            expect(optimized).toBeDefined();
            expect(optimized.openapi).toBe('3.0.3');
        });

        test('should resolve references when option enabled', () => {
            const optimized = utils.optimizeSpec({ resolveAllRefs: true });
            const userSchema = optimized.paths['/users'].get.responses['200'].content['application/json'].schema;

            expect(userSchema.$ref).toBeUndefined();
            expect(userSchema.properties).toBeDefined();
        });

        test('should normalize operation IDs', () => {
            // Remove operationId from one operation
            const specCopy = JSON.parse(JSON.stringify(mockSpec));
            delete specCopy.paths['/users'].post.operationId;

            const utilsCopy = new OpenApiUtils(specCopy);
            const optimized = utilsCopy.optimizeSpec({ normalizeOperationIds: true });

            expect(optimized.paths['/users'].post.operationId).toBe('postUsers');
        });
    });

    describe('generateTypeScriptInterfaces', () => {
        test('should generate TypeScript interfaces from schemas', () => {
            const interfaces = utils.generateTypeScriptInterfaces();

            expect(interfaces).toContain('export interface User {');
            expect(interfaces).toContain('id: string;');
            expect(interfaces).toContain('email: string;');
            expect(interfaces).toContain('name?: string;');
        });

        test('should handle array types', () => {
            const interfaces = utils.generateTypeScriptInterfaces();

            expect(interfaces).toContain('tags?: string[];');
        });

        test('should handle enum types', () => {
            const interfaces = utils.generateTypeScriptInterfaces();

            expect(interfaces).toContain("theme?: 'light' | 'dark';");
        });
    });

    describe('validateSpec', () => {
        test('should validate correct spec', () => {
            const validation = utils.validateSpec();

            expect(validation.isValid).toBe(true);
            expect(validation.errors).toHaveLength(0);
        });

        test('should detect missing required fields', () => {
            const invalidSpec = { paths: {} };
            const invalidUtils = new OpenApiUtils(invalidSpec);
            const validation = invalidUtils.validateSpec();

            expect(validation.isValid).toBe(false);
            expect(validation.errors).toContain('Missing required field: openapi');
            expect(validation.errors).toContain('Missing required field: info');
        });

        test('should detect duplicate operation IDs', () => {
            const specWithDuplicates = JSON.parse(JSON.stringify(mockSpec));
            specWithDuplicates.paths['/posts'].get.operationId = 'getUsers'; // Duplicate

            const duplicateUtils = new OpenApiUtils(specWithDuplicates);
            const validation = duplicateUtils.validateSpec();

            expect(validation.isValid).toBe(false);
            expect(validation.errors.some(e => e.includes('Duplicate operationId'))).toBe(true);
        });
    });

    describe('Private helper methods', () => {
        test('_pathToOperationId should convert path to operation ID', () => {
            expect(utils._pathToOperationId('/users/{id}/posts')).toBe('UsersIdPosts');
            expect(utils._pathToOperationId('/simple')).toBe('Simple');
        });

        test('_extractPathParameters should extract path parameters', () => {
            expect(utils._extractPathParameters('/users/{id}')).toEqual(['id']);
            expect(utils._extractPathParameters('/users/{id}/posts/{postId}')).toEqual(['id', 'postId']);
            expect(utils._extractPathParameters('/users')).toEqual([]);
        });

        test('_calculateOperationComplexity should calculate complexity score', () => {
            const simpleOp = { responses: { '200': {} } };
            const complexOp = {
                parameters: [{ name: 'id' }, { name: 'filter' }],
                requestBody: {},
                responses: { '200': {}, '400': {}, '500': {} },
                security: [{ apiKey: [] }]
            };

            expect(utils._calculateOperationComplexity(simpleOp)).toBe(2); // 1 base + 1 response
            expect(utils._calculateOperationComplexity(complexOp)).toBe(9); // 1 + 2 params + 2 body + 3 responses + 1 security
        });
    });
});

describe('Factory function', () => {
    test('createOpenApiUtils should create new instance', () => {
        const spec = { openapi: '3.0.0' };
        const utils = createOpenApiUtils(spec);

        expect(utils).toBeInstanceOf(OpenApiUtils);
        expect(utils.spec).toEqual(spec);
    });
});

describe('OpenApiHelpers', () => {
    let mockSpec;

    beforeEach(() => {
        mockSpec = {
            paths: {
                '/users': {
                    get: {
                        tags: ['users', 'admin'],
                        responses: { '200': {} }
                    },
                    post: {
                        tags: ['users'],
                        responses: { '201': {} }
                    }
                },
                '/posts': {
                    get: {
                        tags: ['posts'],
                        responses: { '200': {} }
                    },
                    delete: {
                        responses: { '204': {} }
                    }
                }
            },
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer'
                    }
                }
            }
        };
    });

    describe('extractTags', () => {
        test('should extract unique tags sorted', () => {
            const tags = OpenApiHelpers.extractTags(mockSpec);

            expect(tags).toEqual(['admin', 'posts', 'users']);
        });

        test('should return empty array for spec without paths', () => {
            const tags = OpenApiHelpers.extractTags({});
            expect(tags).toEqual([]);
        });
    });

    describe('extractMethods', () => {
        test('should extract HTTP methods', () => {
            const methods = OpenApiHelpers.extractMethods(mockSpec);

            expect(methods).toEqual(['DELETE', 'GET', 'POST']);
        });
    });

    describe('hasSecurity', () => {
        test('should detect security schemes', () => {
            expect(OpenApiHelpers.hasSecurity(mockSpec)).toBe(true);
        });

        test('should detect legacy security definitions', () => {
            const legacySpec = {
                securityDefinitions: {
                    apiKey: { type: 'apiKey' }
                }
            };
            expect(OpenApiHelpers.hasSecurity(legacySpec)).toBe(true);
        });

        test('should return false for spec without security', () => {
            expect(OpenApiHelpers.hasSecurity({})).toBe(false);
        });
    });

    describe('getVersion', () => {
        test('should return OpenAPI version', () => {
            expect(OpenApiHelpers.getVersion({ openapi: '3.0.3' })).toBe('3.0.3');
        });

        test('should return Swagger version', () => {
            expect(OpenApiHelpers.getVersion({ swagger: '2.0' })).toBe('2.0');
        });

        test('should return unknown for missing version', () => {
            expect(OpenApiHelpers.getVersion({})).toBe('unknown');
        });
    });
});

// Integration tests
describe('Integration Tests', () => {
    test('should handle complete workflow', () => {
        const spec = {
            openapi: '3.0.3',
            info: { title: 'Test', version: '1.0.0' },
            paths: {
                '/api/users': {
                    get: {
                        tags: ['users'],
                        responses: {
                            '200': {
                                content: {
                                    'application/json': {
                                        schema: { $ref: '#/components/schemas/User' }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            components: {
                schemas: {
                    User: {
                        type: 'object',
                        required: ['id'],
                        properties: {
                            id: { type: 'string' },
                            profile: { $ref: '#/components/schemas/Profile' }
                        }
                    },
                    Profile: {
                        type: 'object',
                        properties: {
                            name: { type: 'string' }
                        }
                    }
                }
            }
        };

        const utils = new OpenApiUtils(spec);

        // Test the complete workflow
        const operations = utils.extractOperations();
        const grouped = utils.groupOperations('tags');
        const flattened = utils.flattenSchema(spec.components.schemas.User);
        const optimized = utils.optimizeSpec();
        const validation = utils.validateSpec();
        const typescript = utils.generateTypeScriptInterfaces();

        expect(operations).toHaveLength(1);
        expect(grouped.users).toHaveLength(1);
        expect(flattened).toHaveProperty('profile.name');
        expect(optimized).toBeDefined();
        expect(validation.isValid).toBe(true);
        expect(typescript).toContain('export interface User');
    });
});
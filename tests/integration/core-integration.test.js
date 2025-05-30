/**
 * Integration Tests for Core Components
 * Tests the interaction between DirectoryManager, SwaggerLoader, and SwaggerValidator
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const DirectoryManager = require('../../src/core/DirectoryManager');
const SwaggerLoader = require('../../src/core/SwaggerLoader');
const SwaggerValidator = require('../../src/core/SwaggerValidator');

describe('Core Integration Tests', () => {
    let tempDir;

    beforeEach(() => {
        tempDir = path.join(os.tmpdir(), 'swagger-integration-test-' + Date.now());
    });

    afterEach(() => {
        // Cleanup
        try {
            if (fs.existsSync(tempDir)) {
                fs.rmSync(tempDir, { recursive: true, force: true });
            }
        } catch (error) {
            // Ignore cleanup errors
        }
    });

    test('should work together: load, validate, and create directories', async () => {
        // Create a temporary OpenAPI file
        const openApiContent = {
            openapi: '3.0.0',
            info: {
                title: 'Integration Test API',
                version: '1.0.0',
                description: 'API for integration testing'
            },
            paths: {
                '/users/{id}': {
                    get: {
                        summary: 'Get user by ID',
                        parameters: [
                            {
                                name: 'id',
                                in: 'path',
                                required: true,
                                schema: { type: 'string' }
                            }
                        ],
                        responses: {
                            '200': { description: 'User found' },
                            '404': { description: 'User not found' }
                        }
                    }
                },
                '/products': {
                    get: {
                        summary: 'List products',
                        responses: { '200': { description: 'Product list' } }
                    },
                    post: {
                        summary: 'Create product',
                        responses: { '201': { description: 'Product created' } }
                    }
                }
            },
            components: {
                schemas: {
                    User: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            name: { type: 'string' }
                        }
                    }
                }
            }
        };

        const tempFile = path.join(tempDir, 'openapi.json');
        fs.mkdirSync(tempDir, { recursive: true });
        fs.writeFileSync(tempFile, JSON.stringify(openApiContent, null, 2));

        // Test the integration
        const loader = new SwaggerLoader(tempFile);
        const validator = new SwaggerValidator();
        const dirManager = new DirectoryManager(
            path.join(tempDir, 'output'),
            path.join(tempDir, 'output', 'api-client')
        );

        // Load the document
        const doc = await loader.load();
        expect(doc.openapi).toBe('3.0.0');
        expect(doc.paths).toBeDefined();

        // Validate the document
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        expect(() => validator.validate(doc)).not.toThrow();
        expect(validator.errors).toHaveLength(0);
        consoleSpy.mockRestore();

        // Create directories
        expect(() => dirManager.createDirectories()).not.toThrow();

        // Verify directories were created
        expect(fs.existsSync(dirManager.getDirectory('app'))).toBe(true);
        expect(fs.existsSync(dirManager.getDirectory('api'))).toBe(true);
        expect(fs.existsSync(dirManager.getDirectory('lib'))).toBe(true);

        // Test path conversion
        const nextJsPath = dirManager.convertToNextJSPath('/users/{id}');
        expect(nextJsPath).toBe('/users/[id]');

        // Test file path generation
        const routeFilePath = dirManager.getApiRouteFilePath('/users/{id}');
        expect(routeFilePath).toContain('/api/users/[id]/route.ts');

        const pageFilePath = dirManager.getPageFilePath('/products');
        expect(pageFilePath).toContain('/app/products/page.tsx');
    });

    test('should handle YAML files correctly', async () => {
        const yamlContent = `
openapi: 3.0.0
info:
  title: YAML Test API
  version: 1.0.0
  description: Testing YAML parsing
paths:
  /health:
    get:
      summary: Health check
      responses:
        '200':
          description: Service is healthy
  /users/{userId}:
    get:
      summary: Get user
      parameters:
        - name: userId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: User details
        '404':
          description: User not found
components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
`;

        const yamlFile = path.join(tempDir, 'api-spec.yaml');
        fs.mkdirSync(tempDir, { recursive: true });
        fs.writeFileSync(yamlFile, yamlContent);

        const loader = new SwaggerLoader(yamlFile);
        const validator = new SwaggerValidator();
        const dirManager = new DirectoryManager(
            path.join(tempDir, 'yaml-output'),
            path.join(tempDir, 'yaml-output', 'api-client')
        );

        // Load and validate
        const doc = await loader.load();
        expect(doc.openapi).toBe('3.0.0');
        expect(doc.info.title).toBe('YAML Test API');

        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        validator.validate(doc);
        expect(validator.errors).toHaveLength(0);
        consoleSpy.mockRestore();

        // Test path conversions for YAML-loaded paths
        expect(dirManager.convertToNextJSPath('/users/{userId}')).toBe('/users/[userId]');
        expect(dirManager.convertToNextJSPath('/health')).toBe('/health');
    });

    test('should handle OpenAPI config files', async () => {
        // Create OpenAPI spec file
        const apiSpec = {
            openapi: '3.0.0',
            info: { title: 'Config Test API', version: '1.0.0' },
            paths: {
                '/api/test': {
                    get: {
                        responses: { '200': { description: 'Success' } }
                    }
                }
            }
        };

        const specFile = path.join(tempDir, 'api-spec.json');
        fs.mkdirSync(tempDir, { recursive: true });
        fs.writeFileSync(specFile, JSON.stringify(apiSpec, null, 2));

        // Create config file
        const configContent = `
inputSpec: ${specFile}
outputDir: ./generated/api-client
generatorName: typescript-axios
skipValidateSpec: false
additionalProperties:
  supportsES6: true
  withInterfaces: true
`;

        const configFile = path.join(tempDir, 'openapi-config.yaml');
        fs.writeFileSync(configFile, configContent);

        // Test loading through config
        const loader = new SwaggerLoader(configFile);
        const doc = await loader.load();

        expect(doc.openapi).toBe('3.0.0');
        expect(doc.info.title).toBe('Config Test API');
        expect(doc.paths['/api/test']).toBeDefined();
    });

    test('should handle complex real-world API specification', async () => {
        // Create comprehensive e-commerce API spec
        const complexSpec = {
            openapi: '3.0.0',
            info: {
                title: 'E-commerce API',
                version: '2.1.0',
                description: 'A comprehensive e-commerce API'
            },
            servers: [
                { url: 'https://api.example.com/v2' }
            ],
            paths: {
                '/products': {
                    get: {
                        summary: 'List products',
                        parameters: [
                            {
                                name: 'category',
                                in: 'query',
                                schema: { type: 'string' }
                            },
                            {
                                name: 'limit',
                                in: 'query',
                                schema: { type: 'integer', minimum: 1, maximum: 100 }
                            }
                        ],
                        responses: {
                            '200': { description: 'Product list' },
                            '400': { description: 'Bad request' }
                        }
                    },
                    post: {
                        summary: 'Create product',
                        requestBody: {
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/Product' }
                                }
                            }
                        },
                        responses: {
                            '201': { description: 'Product created' },
                            '400': { description: 'Invalid input' }
                        }
                    }
                },
                '/products/{productId}': {
                    get: {
                        summary: 'Get product by ID',
                        parameters: [
                            {
                                name: 'productId',
                                in: 'path',
                                required: true,
                                schema: { type: 'string' }
                            }
                        ],
                        responses: {
                            '200': { description: 'Product details' },
                            '404': { description: 'Product not found' }
                        }
                    },
                    put: {
                        summary: 'Update product',
                        parameters: [
                            {
                                name: 'productId',
                                in: 'path',
                                required: true,
                                schema: { type: 'string' }
                            }
                        ],
                        requestBody: {
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/Product' }
                                }
                            }
                        },
                        responses: {
                            '200': { description: 'Product updated' },
                            '404': { description: 'Product not found' }
                        }
                    },
                    delete: {
                        summary: 'Delete product',
                        parameters: [
                            {
                                name: 'productId',
                                in: 'path',
                                required: true,
                                schema: { type: 'string' }
                            }
                        ],
                        responses: {
                            '204': { description: 'Product deleted' },
                            '404': { description: 'Product not found' }
                        }
                    }
                },
                '/orders/{orderId}/items': {
                    get: {
                        summary: 'Get order items',
                        parameters: [
                            {
                                name: 'orderId',
                                in: 'path',
                                required: true,
                                schema: { type: 'string' }
                            }
                        ],
                        responses: {
                            '200': { description: 'Order items' },
                            '404': { description: 'Order not found' }
                        }
                    }
                },
                '/users/{userId}/orders': {
                    get: {
                        summary: 'Get user orders',
                        parameters: [
                            {
                                name: 'userId',
                                in: 'path',
                                required: true,
                                schema: { type: 'string' }
                            },
                            {
                                name: 'status',
                                in: 'query',
                                schema: {
                                    type: 'string',
                                    enum: ['pending', 'completed', 'cancelled']
                                }
                            }
                        ],
                        responses: {
                            '200': { description: 'User orders' }
                        }
                    }
                }
            },
            components: {
                schemas: {
                    Product: {
                        type: 'object',
                        required: ['name', 'price'],
                        properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
                            description: { type: 'string' },
                            price: { type: 'number', minimum: 0 },
                            category: { type: 'string' },
                            inStock: { type: 'boolean' }
                        }
                    },
                    Order: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            userId: { type: 'string' },
                            items: {
                                type: 'array',
                                items: { $ref: '#/components/schemas/OrderItem' }
                            },
                            total: { type: 'number' },
                            status: {
                                type: 'string',
                                enum: ['pending', 'completed', 'cancelled']
                            }
                        }
                    },
                    OrderItem: {
                        type: 'object',
                        properties: {
                            productId: { type: 'string' },
                            quantity: { type: 'integer', minimum: 1 },
                            price: { type: 'number' }
                        }
                    }
                }
            }
        };

        const complexFile = path.join(tempDir, 'complex-api.json');
        fs.mkdirSync(tempDir, { recursive: true });
        fs.writeFileSync(complexFile, JSON.stringify(complexSpec, null, 2));

        // Test loading and validation
        const loader = new SwaggerLoader(complexFile);
        const validator = new SwaggerValidator();

        const doc = await loader.load();

        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        expect(() => validator.validate(doc)).not.toThrow();
        consoleSpy.mockRestore();

        // Should have no critical errors
        expect(validator.errors).toHaveLength(0);

        // Test directory structure for complex paths
        const dirManager = new DirectoryManager(
            path.join(tempDir, 'complex-output'),
            path.join(tempDir, 'complex-output', 'api-client')
        );

        // Test complex path conversions
        expect(dirManager.convertToNextJSPath('/products')).toBe('/products');
        expect(dirManager.convertToNextJSPath('/products/{productId}')).toBe('/products/[productId]');
        expect(dirManager.convertToNextJSPath('/orders/{orderId}/items')).toBe('/orders/[orderId]/items');
        expect(dirManager.convertToNextJSPath('/users/{userId}/orders')).toBe('/users/[userId]/orders');

        // Create directories and verify structure
        dirManager.createDirectories();
        expect(fs.existsSync(dirManager.getDirectory('app'))).toBe(true);
        expect(fs.existsSync(dirManager.getDirectory('api'))).toBe(true);

        // Validate the directory structure
        const validation = dirManager.validateStructure();
        expect(validation.isValid).toBe(true);

        // Test file path generation for complex routes
        const productRouteFile = dirManager.getApiRouteFilePath('/products/{productId}');
        expect(productRouteFile).toContain('/api/products/[productId]/route.ts');

        const orderItemsPageFile = dirManager.getPageFilePath('/orders/{orderId}/items');
        expect(orderItemsPageFile).toContain('/app/orders/[orderId]/items/page.tsx');
    });

    test('should handle error scenarios gracefully', async () => {
        // Test with non-existent file
        const loader = new SwaggerLoader(path.join(tempDir, 'nonexistent.json'));

        await expect(loader.load()).rejects.toThrow('Failed to load Swagger specification');

        // Test with invalid JSON
        const invalidFile = path.join(tempDir, 'invalid.json');
        fs.mkdirSync(tempDir, { recursive: true });
        fs.writeFileSync(invalidFile, '{ invalid json }');

        const invalidLoader = new SwaggerLoader(invalidFile);
        await expect(invalidLoader.load()).rejects.toThrow();

        // Test validator with invalid document
        const validator = new SwaggerValidator();
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        expect(() => validator.validate(null)).toThrow('Validation failed');
        consoleSpy.mockRestore();

        // Test directory manager with invalid paths
        const dirManager = new DirectoryManager('/invalid/path', '/invalid/client/path');

        // Mock fs to simulate permission errors
        const originalMkdirSync = fs.mkdirSync;
        fs.mkdirSync = jest.fn(() => {
            throw new Error('Permission denied');
        });

        expect(() => dirManager.createDirectories()).toThrow('Failed to create directories');

        // Restore original function
        fs.mkdirSync = originalMkdirSync;
    });
});
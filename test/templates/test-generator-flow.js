// test-generator-flow.js
// Test the complete flow from spec to generated files

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Mock implementations to isolate the issue
class MockTemplateEngine {
    async render(templateName, context) {
        console.log(`    [TemplateEngine] Rendering: ${templateName}`);
        console.log(`    [TemplateEngine] Context keys:`, Object.keys(context));
        return `// Mock rendered content for ${templateName}\n// Resource: ${context.resource || 'unknown'}`;
    }
}

class MockFileWriter {
    constructor(options) {
        this.options = options;
        this.writtenFiles = [];
    }

    async writeFile(filePath, content) {
        console.log(`    [FileWriter] Writing: ${filePath}`);
        console.log(`    [FileWriter] Content length: ${content.length} bytes`);
        this.writtenFiles.push({ path: filePath, content });

        // Actually write to debug output
        const fullPath = path.join(this.options.output, filePath);
        await fs.ensureDir(path.dirname(fullPath));
        await fs.writeFile(fullPath, content, 'utf-8');
    }
}

async function testGeneratorFlow() {
    console.log('=== Testing Generator Flow ===\n');

    // Create test output directory
    const testOutput = path.join(__dirname, 'test-generator-output');
    await fs.ensureDir(testOutput);

    // Sample spec focusing on the issue
    const spec = {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {
            '/api/v1/users': {
                get: {
                    operationId: 'getUsers',
                    summary: 'Get all users',
                    responses: {
                        '200': {
                            description: 'Success',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/User' }
                                    }
                                }
                            }
                        }
                    }
                },
                post: {
                    operationId: 'createUser',
                    summary: 'Create a user',
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/CreateUserInput' }
                            }
                        }
                    },
                    responses: {
                        '201': { description: 'Created' }
                    }
                }
            },
            '/api/v1/users/{id}': {
                get: {
                    operationId: 'getUser',
                    parameters: [
                        { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
                    ],
                    responses: {
                        '200': { description: 'Success' }
                    }
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
                },
                CreateUserInput: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' }
                    }
                }
            }
        }
    };

    const options = {
        output: testOutput,
        dryRun: false,
        theme: 'corporate',
        themes: ['light', 'dark', 'corporate']
    };

    // Test 1: Direct BaseGenerator functionality
    console.log('1. Testing BaseGenerator:');
    try {
        const { default: BaseGenerator } = await import('../../src/generators/BaseGenerator.js');

        // Create a test generator
        class TestGenerator extends BaseGenerator {
            async generate() {
                console.log('    TestGenerator.generate() called');
                console.log('    Has spec:', !!this.spec);
                console.log('    Has options:', !!this.options);
                console.log('    Has templateEngine:', !!this.templateEngine);
                console.log('    Has fileWriter:', !!this.fileWriter);
                return { test: true };
            }
        }

        const mockTemplateEngine = new MockTemplateEngine();
        const mockFileWriter = new MockFileWriter(options);

        const testGen = new TestGenerator(spec, {
            ...options,
            templateEngine: mockTemplateEngine,
            fileWriter: mockFileWriter
        });

        await testGen.generate();
        console.log('  ✓ BaseGenerator test passed\n');
    } catch (error) {
        console.error('  ✗ BaseGenerator error:', error.message);
        console.error('    Stack:', error.stack);
    }

    // Test 2: ApiRouteGenerator
    console.log('2. Testing ApiRouteGenerator:');
    try {
        const { default: ApiRouteGenerator } = await import('../../src/generators/ApiRouteGenerator.js');

        const mockTemplateEngine = new MockTemplateEngine();
        const mockFileWriter = new MockFileWriter(options);

        const apiGen = new ApiRouteGenerator(spec, {
            ...options,
            templateEngine: mockTemplateEngine,
            fileWriter: mockFileWriter
        });

        console.log('  ApiRouteGenerator created');
        console.log('  Calling generate()...');

        const result = await apiGen.generate();
        console.log('  Result:', result);
        console.log('  Files written:', mockFileWriter.writtenFiles.length);

        if (mockFileWriter.writtenFiles.length === 0) {
            console.log('  ⚠️  No files were written!');

            // Try to debug why
            console.log('\n  Debugging ApiRouteGenerator:');
            console.log('  - spec.paths exists:', !!spec.paths);
            console.log('  - Number of paths:', Object.keys(spec.paths).length);
            console.log('  - First path:', Object.keys(spec.paths)[0]);

            // Check if generate method exists
            console.log('  - generate method exists:', typeof apiGen.generate === 'function');

            // Check prototype chain
            const proto = Object.getPrototypeOf(apiGen);
            console.log('  - Prototype:', proto.constructor.name);
            console.log('  - Prototype methods:', Object.getOwnPropertyNames(proto));
        } else {
            console.log('  ✓ Files generated:');
            mockFileWriter.writtenFiles.forEach(f => {
                console.log(`    - ${f.path}`);
            });
        }
    } catch (error) {
        console.error('  ✗ ApiRouteGenerator error:', error.message);
        console.error('    Stack:', error.stack);
    }

    // Test 3: PageGenerator
    console.log('\n3. Testing PageGenerator:');
    try {
        const { default: PageGenerator } = await import('../../src/generators/PageGenerator.js');

        const mockTemplateEngine = new MockTemplateEngine();
        const mockFileWriter = new MockFileWriter(options);

        const pageGen = new PageGenerator(spec, {
            ...options,
            templateEngine: mockTemplateEngine,
            fileWriter: mockFileWriter
        });

        console.log('  PageGenerator created');
        console.log('  Calling generate()...');

        const result = await pageGen.generate();
        console.log('  Result:', result);
        console.log('  Files written:', mockFileWriter.writtenFiles.length);

        if (mockFileWriter.writtenFiles.length === 0) {
            console.log('  ⚠️  No files were written!');
        } else {
            console.log('  ✓ Files generated:');
            mockFileWriter.writtenFiles.forEach(f => {
                console.log(`    - ${f.path}`);
            });
        }
    } catch (error) {
        console.error('  ✗ PageGenerator error:', error.message);
        console.error('    Stack:', error.stack);
    }

    // Test 4: Check the main index.js
    console.log('\n4. Testing main orchestrator:');
    try {
        const { default: SwaggerToNextJS } = await import('../../src/index.js');

        console.log('  SwaggerToNextJS imported');
        console.log('  Class name:', SwaggerToNextJS.name);

        // Check if it has generate method
        const instance = new SwaggerToNextJS(options);
        console.log('  - Has generate method:', typeof instance.generate === 'function');

    } catch (error) {
        console.error('  ✗ Main orchestrator error:', error.message);
    }

    console.log('\n=== Flow Test Complete ===');
    console.log(`\nCheck ${testOutput} for any generated files.`);
}

// Run the test
testGeneratorFlow().catch(console.error);
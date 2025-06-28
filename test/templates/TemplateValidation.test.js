// test/integration/TemplateIntegration.test.js
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import TemplateEngine from '../../src/templates/TemplateEngine.js';
import ApiRouteGenerator from '../../src/generators/ApiRouteGenerator.js';
import PageGenerator from '../../src/generators/PageGenerator.js';
import TypeGenerator from '../../src/generators/TypeGenerator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('Template Integration Tests', () => {
    let templateEngine;
    let testOutputDir;

    beforeEach(async () => {
        // Create a real template engine instance
        templateEngine = new TemplateEngine();

        // Create a temporary output directory for tests
        testOutputDir = path.join(__dirname, 'temp-output');
        await fs.ensureDir(testOutputDir);
    });

    afterEach(async () => {
        // Clean up temporary directory
        await fs.remove(testOutputDir);
    });

    describe('API Route Template', () => {
        it('should render [...route].ts.hbs template correctly', async () => {
            const context = {
                resource: 'users',
                filePath: 'app/api/users/route.ts',
                imports: ['User', 'CreateUserInput'],
                operations: [
                    {
                        method: 'GET',
                        operationId: 'getUsers',
                        summary: 'Get all users',
                        parameters: [
                            { name: 'page', in: 'query', schema: { type: 'integer' } },
                            { name: 'limit', in: 'query', schema: { type: 'integer' } }
                        ],
                        responses: {
                            '200': { description: 'Success' },
                            '500': { description: 'Server Error' }
                        },
                        hasBody: false,
                        isPaginated: true
                    },
                    {
                        method: 'POST',
                        operationId: 'createUser',
                        summary: 'Create a new user',
                        requestBody: {
                            required: true,
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/CreateUserInput' }
                                }
                            }
                        },
                        responses: {
                            '201': { description: 'Created' },
                            '400': { description: 'Bad Request' }
                        },
                        hasBody: true,
                        isPaginated: false
                    }
                ],
                theme: {
                    theme: 'corporate',
                    themes: ['light', 'dark', 'corporate']
                }
            };

            try {
                const content = await templateEngine.render('api/[...route].ts.hbs', context);

                // Check that content was generated
                assert.ok(content, 'Template should generate content');
                assert.ok(content.length > 0, 'Content should not be empty');

                // Check for expected imports
                assert.ok(content.includes('import { NextRequest, NextResponse }'), 'Should import Next.js types');
                assert.ok(content.includes('import type { User, CreateUserInput }'), 'Should import custom types');

                // Check for GET handler
                assert.ok(content.includes('export async function GET'), 'Should have GET handler');
                assert.ok(content.includes('page'), 'Should handle pagination parameters');
                assert.ok(content.includes('limit'), 'Should handle limit parameter');

                // Check for POST handler
                assert.ok(content.includes('export async function POST'), 'Should have POST handler');
                assert.ok(content.includes('await request.json()'), 'Should parse request body');

                // Check for error handling
                assert.ok(content.includes('try {'), 'Should have try-catch blocks');
                assert.ok(content.includes('catch'), 'Should catch errors');

                console.log('✓ API Route template renders correctly');
            } catch (error) {
                console.error('API Route template error:', error);
                throw error;
            }
        });
    });

    describe('Page Templates', () => {
        it('should render list.tsx.hbs template correctly', async () => {
            const context = {
                resourceName: 'users',
                resourceNameSingular: 'user',
                listOperation: {
                    operationId: 'getUsers',
                    summary: 'Get all users',
                    parameters: [
                        { name: 'search', in: 'query', schema: { type: 'string' } }
                    ]
                },
                createOperation: {
                    operationId: 'createUser',
                    summary: 'Create a new user'
                },
                schema: {
                    properties: [
                        { name: 'id', type: 'string', required: true },
                        { name: 'name', type: 'string', required: true },
                        { name: 'email', type: 'string', required: true },
                        { name: 'status', type: 'string', enum: ['active', 'inactive'] }
                    ]
                },
                theme: {
                    theme: 'corporate',
                    themes: ['light', 'dark', 'corporate']
                }
            };

            try {
                const content = await templateEngine.render('pages/list.tsx.hbs', context);

                assert.ok(content, 'List template should generate content');
                assert.ok(content.includes("'use client'"), 'Should be a client component');
                assert.ok(content.includes('useState'), 'Should use React hooks');
                assert.ok(content.includes('useEffect'), 'Should fetch data on mount');
                assert.ok(content.includes('table'), 'Should include table component');
                assert.ok(content.includes('loading'), 'Should handle loading state');
                assert.ok(content.includes('error'), 'Should handle error state');
                assert.ok(content.includes('btn'), 'Should include DaisyUI button classes');

                console.log('✓ List page template renders correctly');
            } catch (error) {
                console.error('List page template error:', error);
                throw error;
            }
        });

        it('should render detail.tsx.hbs template correctly', async () => {
            const context = {
                resourceName: 'user',
                resourceNamePlural: 'users',
                detailOperation: {
                    operationId: 'getUser',
                    parameters: [
                        { name: 'id', in: 'path', required: true }
                    ]
                },
                updateOperation: {
                    operationId: 'updateUser'
                },
                deleteOperation: {
                    operationId: 'deleteUser'
                },
                schema: {
                    properties: [
                        { name: 'id', type: 'string' },
                        { name: 'name', type: 'string' },
                        { name: 'email', type: 'string' },
                        { name: 'status', type: 'string', enum: ['active', 'inactive'], uiHints: { component: 'badge' } },
                        { name: 'createdAt', type: 'string', format: 'date-time' }
                    ]
                },
                theme: {
                    theme: 'corporate'
                }
            };

            try {
                const content = await templateEngine.render('pages/detail.tsx.hbs', context);

                assert.ok(content, 'Detail template should generate content');
                assert.ok(content.includes("'use client'"), 'Should be a client component');
                assert.ok(content.includes('useParams'), 'Should use route params');
                assert.ok(content.includes('card'), 'Should use card component');
                assert.ok(content.includes('badge'), 'Should use badge for status');
                assert.ok(content.includes('modal'), 'Should include delete confirmation modal');

                console.log('✓ Detail page template renders correctly');
            } catch (error) {
                console.error('Detail page template error:', error);
                throw error;
            }
        });

        it('should render form.tsx.hbs template correctly', async () => {
            const context = {
                resourceName: 'user',
                resourceNamePlural: 'users',
                isEdit: false,
                formOperation: {
                    operationId: 'createUser',
                    method: 'POST',
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/CreateUserInput' }
                            }
                        }
                    }
                },
                schema: {
                    properties: [
                        { name: 'name', type: 'string', required: true, description: 'User full name' },
                        { name: 'email', type: 'string', required: true, format: 'email' },
                        { name: 'bio', type: 'string', required: false, uiHints: { component: 'textarea' } },
                        { name: 'newsletter', type: 'boolean', required: false, uiHints: { component: 'checkbox' } }
                    ],
                    required: ['name', 'email']
                },
                theme: {
                    theme: 'corporate'
                }
            };

            try {
                const content = await templateEngine.render('pages/form.tsx.hbs', context);

                assert.ok(content, 'Form template should generate content');
                assert.ok(content.includes('form'), 'Should include form element');
                assert.ok(content.includes('input'), 'Should include input fields');
                assert.ok(content.includes('textarea'), 'Should include textarea for bio');
                assert.ok(content.includes('checkbox'), 'Should include checkbox');
                assert.ok(content.includes('form-control'), 'Should use DaisyUI form controls');
                assert.ok(content.includes('btn-primary'), 'Should have submit button');
                assert.ok(content.includes('validation'), 'Should include validation');

                console.log('✓ Form page template renders correctly');
            } catch (error) {
                console.error('Form page template error:', error);
                throw error;
            }
        });
    });

    describe('Type Template', () => {
        it('should render api.ts.hbs template correctly', async () => {
            const context = {
                generatedAt: new Date().toISOString(),
                apiTitle: 'Test API',
                schemas: [
                    {
                        name: 'User',
                        description: 'User model',
                        properties: [
                            { name: 'id', type: 'string', required: true },
                            { name: 'name', type: 'string', required: true },
                            { name: 'email', type: 'string', required: false, nullable: true }
                        ],
                        required: ['id', 'name']
                    }
                ],
                enums: [
                    {
                        name: 'UserStatus',
                        values: ['active', 'inactive', 'pending'],
                        uiHints: { component: 'badge' }
                    }
                ],
                formTypes: [
                    { name: 'CreateUserForm', baseType: 'User' }
                ],
                utilityTypes: [
                    { name: 'PaginationTypes', generated: true }
                ]
            };

            try {
                const content = await templateEngine.render('types/api.ts.hbs', context);

                assert.ok(content, 'Type template should generate content');
                assert.ok(content.includes('// Auto-generated'), 'Should include generation comment');
                assert.ok(content.includes('export interface User'), 'Should export User interface');
                assert.ok(content.includes('id: string;'), 'Should have required properties');
                assert.ok(content.includes('email?: string | null;'), 'Should handle optional nullable');
                assert.ok(content.includes('export enum UserStatus'), 'Should export enums');
                assert.ok(content.includes('export interface CreateUserFormState'), 'Should generate form types');

                console.log('✓ Type template renders correctly');
            } catch (error) {
                console.error('Type template error:', error);
                throw error;
            }
        });
    });

    describe('Generator with Real Templates', () => {
        it('should generate files using real templates', async () => {
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
                            summary: 'Create user',
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
                                '200': {
                                    description: 'Success',
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
                            properties: {
                                id: { type: 'string' },
                                name: { type: 'string' },
                                email: { type: 'string' }
                            },
                            required: ['id', 'name']
                        },
                        CreateUserInput: {
                            type: 'object',
                            properties: {
                                name: { type: 'string' },
                                email: { type: 'string' }
                            },
                            required: ['name', 'email']
                        }
                    }
                }
            };

            const mockFileWriter = {
                writeFile: async (filePath, content) => {
                    const fullPath = path.join(testOutputDir, filePath);
                    await fs.ensureDir(path.dirname(fullPath));
                    await fs.writeFile(fullPath, content, 'utf-8');
                    console.log(`✓ Generated: ${filePath}`);
                }
            };

            const options = {
                output: testOutputDir,
                dryRun: false,
                theme: 'corporate',
                themes: ['light', 'dark', 'corporate'],
                fileWriter: mockFileWriter
            };

            // Test TypeGenerator
            console.log('\nTesting TypeGenerator with real templates:');
            const typeGen = new TypeGenerator(spec, options);
            typeGen.templateEngine = templateEngine;
            await typeGen.generate();

            // Verify type file was created
            const typeFile = path.join(testOutputDir, 'types', 'api.ts');
            assert.ok(await fs.pathExists(typeFile), 'Type file should be created');
            const typeContent = await fs.readFile(typeFile, 'utf-8');
            assert.ok(typeContent.includes('export interface User'), 'Should contain User interface');

            // Test ApiRouteGenerator
            console.log('\nTesting ApiRouteGenerator with real templates:');
            const apiGen = new ApiRouteGenerator(spec, options);
            apiGen.templateEngine = templateEngine;
            await apiGen.generate();

            // Verify route files were created
            const routeFile1 = path.join(testOutputDir, 'app', 'api', 'v1', 'users', 'route.ts');
            const routeFile2 = path.join(testOutputDir, 'app', 'api', 'v1', 'users', '[id]', 'route.ts');
            assert.ok(await fs.pathExists(routeFile1), 'Users route file should be created');
            assert.ok(await fs.pathExists(routeFile2), 'User by ID route file should be created');

            // Test PageGenerator
            console.log('\nTesting PageGenerator with real templates:');
            const pageGen = new PageGenerator(spec, options);
            pageGen.templateEngine = templateEngine;
            await pageGen.generate();

            // Check what files were generated
            const appDir = path.join(testOutputDir, 'app');
            if (await fs.pathExists(appDir)) {
                const files = await fs.readdir(appDir, { recursive: true });
                console.log('Generated files in app directory:', files);
            }
        });
    });
});
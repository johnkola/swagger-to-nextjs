const fs = require('fs').promises;
const path = require('path');

// Mock dependencies
jest.mock('fs', () => ({
    promises: {
        writeFile: jest.fn(),
        readFile: jest.fn(),
        mkdir: jest.fn(),
        access: jest.fn()
    },
    existsSync: jest.fn()
}));

jest.mock('inquirer', () => ({
    prompt: jest.fn()
}));

const ConfigGenerator = require('../../src/cli/ConfigGenerator');

describe('ConfigGenerator - Real Functionality Tests', () => {
    let configGen;
    let mockInquirer;

    beforeEach(() => {
        jest.clearAllMocks();
        mockInquirer = require('inquirer');

        configGen = new ConfigGenerator({
            outputDir: './test-output',
            debug: false
        });
    });

    // Test config analysis from OpenAPI spec
    describe('OpenAPI Spec Analysis', () => {
        test('analyzes spec and extracts configuration recommendations', async () => {
            const mockSpec = {
                openapi: '3.0.0',
                info: {
                    title: 'Pet Store API',
                    version: '1.0.0'
                },
                servers: [
                    { url: 'https://api.petstore.com/v1' }
                ],
                paths: {
                    '/pets': {
                        get: { operationId: 'listPets' },
                        post: { operationId: 'createPet' }
                    },
                    '/pets/{id}': {
                        get: { operationId: 'getPet' }
                    }
                },
                components: {
                    schemas: {
                        Pet: { type: 'object' },
                        Error: { type: 'object' }
                    }
                }
            };

            const analysis = await configGen.analyzeSpec(mockSpec);

            expect(analysis).toHaveProperty('apiInfo');
            expect(analysis.apiInfo.title).toBe('Pet Store API');
            expect(analysis.apiInfo.version).toBe('1.0.0');

            expect(analysis).toHaveProperty('endpoints');
            expect(analysis.endpoints.length).toBe(3); // 3 operations

            expect(analysis).toHaveProperty('schemas');
            expect(analysis.schemas.length).toBe(2); // Pet, Error

            expect(analysis).toHaveProperty('recommendations');
            expect(Array.isArray(analysis.recommendations)).toBe(true);
        });

        test('handles spec with authentication', async () => {
            const specWithAuth = {
                openapi: '3.0.0',
                info: { title: 'Secure API', version: '1.0.0' },
                components: {
                    securitySchemes: {
                        bearerAuth: {
                            type: 'http',
                            scheme: 'bearer'
                        },
                        apiKey: {
                            type: 'apiKey',
                            in: 'header',
                            name: 'X-API-Key'
                        }
                    }
                },
                security: [
                    { bearerAuth: [] }
                ]
            };

            const analysis = await configGen.analyzeSpec(specWithAuth);

            expect(analysis).toHaveProperty('security');
            expect(analysis.security.hasAuth).toBe(true);
            expect(analysis.security.schemes).toContain('bearerAuth');
            expect(analysis.security.schemes).toContain('apiKey');
        });

        test('extracts server configuration', async () => {
            const specWithServers = {
                openapi: '3.0.0',
                info: { title: 'Multi-Server API', version: '1.0.0' },
                servers: [
                    {
                        url: 'https://api.prod.com',
                        description: 'Production server'
                    },
                    {
                        url: 'https://api.staging.com',
                        description: 'Staging server'
                    }
                ]
            };

            const analysis = await configGen.analyzeSpec(specWithServers);

            expect(analysis.servers).toHaveLength(2);
            expect(analysis.servers[0].url).toBe('https://api.prod.com');
            expect(analysis.servers[1].url).toBe('https://api.staging.com');
        });
    });

    // Test configuration generation
    describe('Configuration Generation', () => {
        test('generates Next.js configuration', async () => {
            const options = {
                framework: 'nextjs',
                typescript: true,
                outputDir: './generated',
                apiUrl: 'https://api.example.com'
            };

            const config = await configGen.generateConfig('nextjs', options);

            expect(config).toHaveProperty('framework', 'nextjs');
            expect(config).toHaveProperty('typescript', true);
            expect(config).toHaveProperty('outputDir', './generated');
            expect(config).toHaveProperty('apiClient');
            expect(config.apiClient).toHaveProperty('baseURL', 'https://api.example.com');
        });

        test('generates React configuration with custom options', async () => {
            const options = {
                framework: 'react',
                typescript: false,
                stateManagement: 'zustand',
                styling: 'tailwind'
            };

            const config = await configGen.generateConfig('react', options);

            expect(config.framework).toBe('react');
            expect(config.typescript).toBe(false);
            expect(config.stateManagement).toBe('zustand');
            expect(config.styling).toBe('tailwind');
        });

        test('applies best practice recommendations', async () => {
            const mockSpec = {
                openapi: '3.0.0',
                info: { title: 'API', version: '1.0.0' },
                paths: {
                    '/users': { get: {}, post: {} },
                    '/posts': { get: {}, post: {} }
                }
            };

            const analysis = await configGen.analyzeSpec(mockSpec);
            const config = await configGen.generateConfig('nextjs', {}, analysis);

            expect(config).toHaveProperty('recommendations');
            expect(config.errorHandling).toBeDefined();
            expect(config.caching).toBeDefined();
            expect(config.validation).toBeDefined();
        });
    });

    // Test interactive configuration
    describe('Interactive Configuration', () => {
        test('prompts for framework selection', async () => {
            mockInquirer.prompt.mockResolvedValue({
                framework: 'nextjs',
                typescript: true
            });

            const result = await configGen.promptFrameworkOptions();

            expect(mockInquirer.prompt).toHaveBeenCalled();
            expect(result.framework).toBe('nextjs');
            expect(result.typescript).toBe(true);
        });

        test('prompts for API configuration', async () => {
            mockInquirer.prompt.mockResolvedValue({
                apiUrl: 'https://api.example.com',
                authentication: 'bearer',
                timeout: 5000
            });

            const result = await configGen.promptApiOptions();

            expect(result.apiUrl).toBe('https://api.example.com');
            expect(result.authentication).toBe('bearer');
            expect(result.timeout).toBe(5000);
        });

        test('handles user cancellation gracefully', async () => {
            mockInquirer.prompt.mockRejectedValue(new Error('User cancelled'));

            const result = await configGen.promptFrameworkOptions();

            expect(result).toBeNull();
        });
    });

    // Test file operations
    describe('Configuration File Creation', () => {
        test('writes configuration to file', async () => {
            const config = {
                framework: 'nextjs',
                typescript: true,
                outputDir: './generated'
            };

            fs.writeFile.mockResolvedValue();

            await configGen.writeConfigFile(config, './swagger-nextjs.config.js');

            expect(fs.writeFile).toHaveBeenCalled();
            const [filePath, content] = fs.writeFile.mock.calls[0];
            expect(filePath).toBe('./swagger-nextjs.config.js');
            expect(content).toContain('framework: \'nextjs\'');
            expect(content).toContain('typescript: true');
        });

        test('creates package.json scripts', async () => {
            const config = {
                framework: 'nextjs',
                outputDir: './generated'
            };

            const scripts = await configGen.generatePackageScripts(config);

            expect(scripts).toHaveProperty('generate');
            expect(scripts).toHaveProperty('generate:watch');
            expect(scripts.generate).toContain('swagger-to-nextjs');
        });

        test('generates TypeScript configuration when enabled', async () => {
            const config = {
                framework: 'nextjs',
                typescript: true
            };

            const tsConfig = await configGen.generateTypeScriptConfig(config);

            expect(tsConfig).toHaveProperty('compilerOptions');
            expect(tsConfig.compilerOptions.strict).toBe(true);
            expect(tsConfig.include).toContain('./generated/**/*');
        });
    });

    // Test template customization
    describe('Template Customization', () => {
        test('generates custom template configuration', async () => {
            const options = {
                customTemplates: true,
                templateDir: './custom-templates'
            };

            const templateConfig = await configGen.generateTemplateConfig(options);

            expect(templateConfig).toHaveProperty('templateDir', './custom-templates');
            expect(templateConfig).toHaveProperty('customTemplates', true);
            expect(templateConfig).toHaveProperty('templates');
        });

        test('provides template override examples', async () => {
            const examples = await configGen.getTemplateExamples();

            expect(Array.isArray(examples)).toBe(true);
            expect(examples.length).toBeGreaterThan(0);
            expect(examples[0]).toHaveProperty('name');
            expect(examples[0]).toHaveProperty('description');
            expect(examples[0]).toHaveProperty('template');
        });
    });

    // Test validation
    describe('Configuration Validation', () => {
        test('validates required configuration fields', async () => {
            const invalidConfig = {
                // Missing framework
                typescript: true
            };

            const validation = await configGen.validateConfig(invalidConfig);

            expect(validation.isValid).toBe(false);
            expect(validation.errors).toContain('framework is required');
        });

        test('validates framework-specific options', async () => {
            const config = {
                framework: 'nextjs',
                outputDir: './invalid/path/with/spaces and special chars!'
            };

            const validation = await configGen.validateConfig(config);

            expect(validation.isValid).toBe(false);
            expect(validation.warnings).toBeDefined();
        });

        test('passes valid configuration', async () => {
            const validConfig = {
                framework: 'nextjs',
                typescript: true,
                outputDir: './generated',
                apiClient: {
                    baseURL: 'https://api.example.com'
                }
            };

            const validation = await configGen.validateConfig(validConfig);

            expect(validation.isValid).toBe(true);
            expect(validation.errors).toHaveLength(0);
        });
    });

    // Test recommendations engine
    describe('Best Practice Recommendations', () => {
        test('recommends TypeScript for complex APIs', async () => {
            const complexSpec = {
                openapi: '3.0.0',
                info: { title: 'Complex API', version: '1.0.0' },
                paths: {},
                components: {
                    schemas: {}
                }
            };

            // Add many schemas to make it complex
            for (let i = 0; i < 20; i++) {
                complexSpec.components.schemas[`Model${i}`] = { type: 'object' };
            }

            const recommendations = await configGen.getRecommendations(complexSpec);

            expect(recommendations).toContainEqual(
                expect.objectContaining({
                    type: 'typescript',
                    reason: expect.stringContaining('complex')
                })
            );
        });

        test('recommends caching for high-traffic APIs', async () => {
            const spec = {
                openapi: '3.0.0',
                info: {
                    title: 'High Traffic API',
                    'x-ratelimit': '1000/hour'
                },
                paths: {
                    '/data': { get: {} }
                }
            };

            const recommendations = await configGen.getRecommendations(spec);

            expect(recommendations.some(r => r.type === 'caching')).toBe(true);
        });

        test('recommends error handling for APIs with many endpoints', async () => {
            const spec = {
                openapi: '3.0.0',
                info: { title: 'Large API', version: '1.0.0' },
                paths: {}
            };

            // Add many endpoints
            for (let i = 0; i < 15; i++) {
                spec.paths[`/endpoint${i}`] = { get: {}, post: {} };
            }

            const recommendations = await configGen.getRecommendations(spec);

            expect(recommendations.some(r => r.type === 'errorHandling')).toBe(true);
        });
    });

    // Test error handling
    describe('Error Handling', () => {
        test('handles invalid OpenAPI spec gracefully', async () => {
            const invalidSpec = {
                // Missing required fields
                info: { title: 'Incomplete API' }
            };

            const analysis = await configGen.analyzeSpec(invalidSpec);

            expect(analysis).toHaveProperty('errors');
            expect(analysis.errors.length).toBeGreaterThan(0);
            expect(analysis.isValid).toBe(false);
        });

        test('handles file write errors', async () => {
            const config = { framework: 'nextjs' };

            fs.writeFile.mockRejectedValue(new Error('Permission denied'));

            await expect(configGen.writeConfigFile(config, '/readonly/config.js'))
                .rejects
                .toThrow('Permission denied');
        });

        test('handles missing template directory', async () => {
            require('fs').existsSync.mockReturnValue(false);

            const result = await configGen.validateTemplateDir('./missing-templates');

            expect(result.exists).toBe(false);
            expect(result.error).toContain('Template directory not found');
        });
    });

    // Integration test
    describe('Complete Configuration Generation', () => {
        test('full workflow: analyze → configure → generate → write', async () => {
            const mockSpec = {
                openapi: '3.0.0',
                info: { title: 'Test API', version: '1.0.0' },
                paths: {
                    '/users': { get: { operationId: 'getUsers' } }
                }
            };

            const options = {
                framework: 'nextjs',
                typescript: true,
                interactive: false
            };

            fs.writeFile.mockResolvedValue();

            // Run complete workflow
            const result = await configGen.generateComplete(mockSpec, options);

            expect(result).toHaveProperty('config');
            expect(result).toHaveProperty('analysis');
            expect(result).toHaveProperty('recommendations');
            expect(result.success).toBe(true);

            // Verify files were written
            expect(fs.writeFile).toHaveBeenCalled();
        });
    });
});
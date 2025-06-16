// ==============================================================================
// test/src/index.test.js
// ==============================================================================

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EventEmitter } from 'node:events';

// Import the actual SwaggerToNextjs class
import SwaggerToNextjs from '../../src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper class to track events
class EventTracker {
    constructor(emitter) {
        this.events = [];
        this.emitter = emitter;
        this.originalEmit = emitter.emit.bind(emitter);

        // Override emit to track events
        emitter.emit = (event, ...args) => {
            this.events.push({ event, args, timestamp: Date.now() });
            return this.originalEmit(event, ...args);
        };
    }

    getEvents(eventName) {
        return eventName
            ? this.events.filter(e => e.event === eventName)
            : this.events;
    }

    hasEvent(eventName) {
        return this.events.some(e => e.event === eventName);
    }

    clear() {
        this.events = [];
    }

    restore() {
        this.emitter.emit = this.originalEmit;
    }
}

describe('SwaggerToNextjs', () => {
    let generator;
    let tempDir;
    let eventTracker;
    let specPath;

    beforeEach(async () => {
        tempDir = path.join(process.cwd(), 'temp-index-test-' + Date.now());
        await fs.mkdir(tempDir, { recursive: true });

        generator = new SwaggerToNextjs({
            outputDir: tempDir,
            silent: true
        });

        // Initialize the generator to set up components
        await generator.initialize();

        eventTracker = new EventTracker(generator);

        // Create a default spec for tests that need it
        const defaultSpec = {
            openapi: '3.0.0',
            info: {
                title: 'Test API',
                version: '1.0.0',
                description: 'Test API Description'
            },
            servers: [
                { url: 'https://api.example.com' }
            ],
            paths: {
                '/users': {
                    get: {
                        summary: 'Get users',
                        operationId: 'getUsers',
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
                        }
                    }
                }
            }
        };

        specPath = path.join(tempDir, 'spec.json');
        await fs.writeFile(specPath, JSON.stringify(defaultSpec));
    });

    afterEach(async () => {
        eventTracker.restore();
        if (generator) {
            await generator.cleanup();
        }
        await fs.rm(tempDir, { recursive: true, force: true });
    });

    describe('Constructor and options', () => {
        it('should set default options', () => {
            const gen = new SwaggerToNextjs();
            assert.strictEqual(gen.options.outputDir, './generated');
            assert.strictEqual(gen.options.typescript, true);
            assert.strictEqual(gen.options.generateClient, true);
            assert.strictEqual(gen.options.generatePages, true);
            assert.strictEqual(gen.options.force, false);
            assert.strictEqual(gen.options.dryRun, false);
            assert.strictEqual(gen.options.verbose, false);
            assert.strictEqual(gen.options.silent, false);
        });

        it('should override defaults with provided options', () => {
            const gen = new SwaggerToNextjs({
                outputDir: '/custom/path',
                typescript: false,
                generateClient: false,
                generatePages: false,
                force: true,
                dryRun: true,
                templateDir: '/templates',
                verbose: true,
                silent: true,
                customOption: 'test'
            });

            assert.strictEqual(gen.options.outputDir, '/custom/path');
            assert.strictEqual(gen.options.typescript, false);
            assert.strictEqual(gen.options.generateClient, false);
            assert.strictEqual(gen.options.generatePages, false);
            assert.strictEqual(gen.options.force, true);
            assert.strictEqual(gen.options.dryRun, true);
            assert.strictEqual(gen.options.templateDir, '/templates');
            assert.strictEqual(gen.options.verbose, true);
            assert.strictEqual(gen.options.silent, true);
            assert.strictEqual(gen.options.customOption, 'test');
        });

        it('should be an EventEmitter', () => {
            assert.ok(generator instanceof EventEmitter);

            let eventFired = false;
            generator.on('test', () => { eventFired = true; });
            generator.emit('test');
            assert.ok(eventFired);
        });
    });

    describe('Fluent API', () => {
        it('should support method chaining', () => {
            const result = generator
                .withSwagger('/path/to/spec.yaml')
                .toDirectory('/output/dir');

            assert.strictEqual(result, generator);
            assert.strictEqual(generator.swaggerSource, '/path/to/spec.yaml');
            assert.strictEqual(generator.options.outputDir, '/output/dir');
        });

        it('should allow multiple calls to chain methods', () => {
            generator
                .withSwagger('spec1.yaml')
                .toDirectory('dir1')
                .withSwagger('spec2.yaml')
                .toDirectory('dir2');

            assert.strictEqual(generator.swaggerSource, 'spec2.yaml');
            assert.strictEqual(generator.options.outputDir, 'dir2');
        });
    });

    describe('Initialize method', () => {
        it('should initialize with config object', async () => {
            const config = {
                typescript: false,
                generateClient: false,
                customConfig: true
            };

            const result = await generator.initialize(config);

            assert.strictEqual(result, generator);
            assert.strictEqual(generator.options.typescript, false);
            assert.strictEqual(generator.options.generateClient, false);
            assert.strictEqual(generator.options.customConfig, true);

            assert.ok(eventTracker.hasEvent('initialize:start'));
            assert.ok(eventTracker.hasEvent('initialize:complete'));
        });

        it('should initialize with config file path', async () => {
            const configPath = path.join(tempDir, 'config.json');
            const config = {
                typescript: false,
                force: true,
                outputDir: '/from/config'
            };
            await fs.writeFile(configPath, JSON.stringify(config));

            await generator.initialize(configPath);

            assert.strictEqual(generator.options.typescript, false);
            assert.strictEqual(generator.options.force, true);
            assert.strictEqual(generator.options.outputDir, '/from/config');
        });

        it('should handle YAML config files', async () => {
            const configPath = path.join(tempDir, 'config.yaml');
            const config = `typescript: false
force: true
generatePages: false`;
            await fs.writeFile(configPath, config);

            await generator.initialize(configPath);

            assert.strictEqual(generator.options.typescript, false);
            assert.strictEqual(generator.options.force, true);
            assert.strictEqual(generator.options.generatePages, false);
        });

        it('should emit error event on initialization failure', async () => {
            await assert.rejects(
                generator.initialize('/non/existent/config.json'),
                /Failed to initialize/
            );

            assert.ok(eventTracker.hasEvent('initialize:error'));
        });

        it('should re-initialize components after config change', async () => {
            await generator.initialize({ typescript: true });
            eventTracker.clear();

            await generator.initialize({ typescript: false });

            assert.strictEqual(generator.options.typescript, false);
            assert.ok(eventTracker.hasEvent('initialize:complete'));
        });
    });

    describe('Generate method', () => {
        it('should require swagger source', async () => {
            const gen = new SwaggerToNextjs({ silent: true });
            await gen.initialize();

            await assert.rejects(
                gen.generate(),
                /No OpenAPI specification source provided/
            );
        });

        it('should complete full generation cycle', async () => {
            generator.withSwagger(specPath);

            const result = await generator.generate();

            assert.strictEqual(result.success, true);
            assert.ok(typeof result.duration === 'number');
            assert.ok(Array.isArray(result.files));
            assert.ok(result.files.length > 0);
            assert.ok(Array.isArray(result.errors));
            assert.ok(Array.isArray(result.warnings));
            assert.ok(result.stats);
            assert.ok(result.stats.totalFiles > 0);
        });

        it('should emit all progress events', async () => {
            generator.withSwagger(specPath);

            await generator.generate();

            const progressEvents = eventTracker.getEvents('progress');
            const steps = progressEvents.map(e => e.args[0].step);

            assert.ok(steps.includes('load'));
            assert.ok(steps.includes('validate'));
            assert.ok(steps.includes('prepare'));
            assert.ok(steps.includes('types'));
            assert.ok(steps.includes('routes'));
            assert.ok(steps.includes('client'));
            assert.ok(steps.includes('pages'));
            assert.ok(steps.includes('project'));
            assert.ok(steps.includes('write'));
        });

        it('should skip TypeScript generation when disabled', async () => {
            // Create a new generator with TypeScript disabled
            const gen = new SwaggerToNextjs({
                outputDir: tempDir,
                typescript: false,
                silent: true
            });

            // Initialize to ensure components are set up
            await gen.initialize();

            gen.withSwagger(specPath);
            const result = await gen.generate();

            const typeFiles = result.files.filter(f => f.type === 'types');
            assert.strictEqual(typeFiles.length, 0);

            // Track events on the new generator
            const genEventTracker = new EventTracker(gen);
            await gen.generate();

            const progressEvents = genEventTracker.getEvents('progress');
            const typeStep = progressEvents.find(e => e.args[0].step === 'types');
            assert.ok(!typeStep);

            genEventTracker.restore();
        });

        it('should skip client generation when disabled', async () => {
            // Create a new generator with client generation disabled
            const gen = new SwaggerToNextjs({
                outputDir: tempDir,
                generateClient: false,
                silent: true
            });

            // Initialize to ensure components are set up
            await gen.initialize();

            gen.withSwagger(specPath);
            const result = await gen.generate();

            const clientFiles = result.files.filter(f => f.type === 'client');
            assert.strictEqual(clientFiles.length, 0);
        });

        it('should skip pages generation when disabled', async () => {
            // Create a new generator with pages generation disabled
            const gen = new SwaggerToNextjs({
                outputDir: tempDir,
                generatePages: false,
                silent: true
            });

            // Initialize to ensure components are set up
            await gen.initialize();

            gen.withSwagger(specPath);
            const result = await gen.generate();

            const pageFiles = result.files.filter(f => f.type === 'page');
            assert.strictEqual(pageFiles.length, 0);
        });

        it('should work in dry-run mode', async () => {
            generator.withSwagger(specPath);
            generator.options.dryRun = true;

            const result = await generator.generate();

            assert.strictEqual(result.success, true);
            assert.ok(result.files.length > 0);

            // Check no files were actually written
            const files = await fs.readdir(tempDir);
            assert.strictEqual(files.length, 1); // Only spec.json
        });

        it('should handle invalid OpenAPI spec', async () => {
            const invalidSpec = path.join(tempDir, 'invalid.json');
            await fs.writeFile(invalidSpec, JSON.stringify({ invalid: true }));

            generator.withSwagger(invalidSpec);

            await assert.rejects(
                generator.generate(),
                /Invalid OpenAPI specification/
            );

            assert.ok(eventTracker.hasEvent('generate:error'));
        });

        it('should handle file read errors', async () => {
            generator.withSwagger('/non/existent/spec.yaml');

            await assert.rejects(
                generator.generate(),
                /ENOENT|no such file/i
            );
        });

        it('should handle JSON parse errors', async () => {
            const badJson = path.join(tempDir, 'bad.json');
            await fs.writeFile(badJson, '{ invalid json');

            generator.withSwagger(badJson);

            await assert.rejects(
                generator.generate(),
                /JSON|parse/i
            );
        });

        it('should handle YAML files', async () => {
            const yamlSpec = path.join(tempDir, 'spec.yaml');
            await fs.writeFile(yamlSpec, 'openapi: 3.0.0\ninfo:\n  title: Test\n  version: 1.0.0\npaths: {}');

            generator.withSwagger(yamlSpec);

            const result = await generator.generate();
            assert.strictEqual(result.success, true);
        });

        it('should create output directory if not exists', async () => {
            const newOutput = path.join(tempDir, 'new', 'nested', 'output');
            generator.withSwagger(specPath).toDirectory(newOutput);

            await generator.generate();

            const exists = await fs.access(newOutput).then(() => true).catch(() => false);
            assert.ok(exists);
        });

        it('should emit file:written events', async () => {
            generator.withSwagger(specPath);

            await generator.generate();

            const fileEvents = eventTracker.getEvents('file:written');
            assert.ok(fileEvents.length > 0);

            fileEvents.forEach(event => {
                assert.ok(event.args[0].path);
            });
        });

        it('should handle warnings from validation', async () => {
            const specWithWarnings = {
                openapi: '3.0.0',
                info: { title: 'Test', version: '1.0.0' },
                paths: {}  // Empty paths will generate warning
            };

            const warnPath = path.join(tempDir, 'warn-spec.json');
            await fs.writeFile(warnPath, JSON.stringify(specWithWarnings));

            generator.withSwagger(warnPath);
            const result = await generator.generate();

            assert.strictEqual(result.success, true);
            assert.ok(result.warnings.length > 0);
        });

        it('should generate project files', async () => {
            generator.withSwagger(specPath);

            const result = await generator.generate();

            const projectFiles = result.files.filter(f => f.type === 'config' || f.type === 'docs');
            assert.ok(projectFiles.length > 0);

            const fileNames = projectFiles.map(f => path.basename(f.path));
            assert.ok(fileNames.includes('package.json'));
            assert.ok(fileNames.includes('tsconfig.json'));
            assert.ok(fileNames.includes('.gitignore'));
            assert.ok(fileNames.includes('README.md'));
        });

        it('should use spec info in generated files', async () => {
            generator.withSwagger(specPath);

            const result = await generator.generate();

            const readme = result.files.find(f => f.path.endsWith('README.md'));
            assert.ok(readme);
            assert.ok(readme.content.includes('Test API'));
            assert.ok(readme.content.includes('Test API Description'));
        });
    });

    describe('Cleanup', () => {
        it('should reset all state', async () => {
            generator.spec = { test: true };
            generator.validation = { valid: true };
            generator.generatedFiles = ['file1', 'file2'];
            generator.errors = ['error1'];
            generator.warnings = ['warning1'];

            await generator.cleanup();

            assert.strictEqual(generator.spec, null);
            assert.strictEqual(generator.validation, null);
            assert.deepStrictEqual(generator.generatedFiles, []);
            assert.deepStrictEqual(generator.errors, []);
            assert.deepStrictEqual(generator.warnings, []);
        });

        it('should emit cleanup events', async () => {
            await generator.cleanup();

            assert.ok(eventTracker.hasEvent('cleanup:start'));
            assert.ok(eventTracker.hasEvent('cleanup:complete'));
        });

        it('should be safe to call multiple times', async () => {
            await generator.cleanup();
            await generator.cleanup();
            await generator.cleanup();

            const cleanupStarts = eventTracker.getEvents('cleanup:start');
            assert.strictEqual(cleanupStarts.length, 3);
        });
    });

    describe('Error recovery', () => {
        it('should handle errors during file writing', async () => {
            generator.withSwagger(specPath);

            // Create a file where directory should be
            const blockingFile = path.join(tempDir, 'blocking');
            await fs.writeFile(blockingFile, 'content');

            generator.toDirectory(path.join(blockingFile, 'output'));

            await assert.rejects(
                generator.generate(),
                /ENOTDIR|EEXIST|not a directory/i
            );
        });

        it('should continue after non-critical errors', async () => {
            // Force a warning by having empty paths
            const warnSpec = {
                openapi: '3.0.0',
                info: { title: 'Test', version: '1.0.0' },
                paths: {}
            };
            const warnPath = path.join(tempDir, 'warn.json');
            await fs.writeFile(warnPath, JSON.stringify(warnSpec));

            generator.withSwagger(warnPath);
            const result = await generator.generate();

            assert.strictEqual(result.success, true);
            assert.ok(result.warnings.length > 0);
        });
    });

    describe('Factory and exports', () => {
        it('should create instance using factory function', () => {
            const instance = SwaggerToNextjs.create({ test: true });

            assert.ok(instance instanceof SwaggerToNextjs);
            assert.strictEqual(instance.options.test, true);
        });

        it('should export SwaggerToNextjs as named export', () => {
            // Check if the class has the SwaggerToNextjs property set
            assert.strictEqual(SwaggerToNextjs.SwaggerToNextjs, SwaggerToNextjs);
        });

        it('should have proper ES module exports', () => {
            // The module should export SwaggerToNextjs as default
            assert.ok(SwaggerToNextjs);
            assert.strictEqual(typeof SwaggerToNextjs, 'function');
            assert.strictEqual(typeof SwaggerToNextjs.create, 'function');
        });
    });
});
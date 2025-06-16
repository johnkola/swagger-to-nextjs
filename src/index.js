/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - AI PROMPT
 * ============================================================================
 * FILE: src/index.js
 * VERSION: 2025-06-16 16:25:36
 * PHASE: Phase 1: Foundation & Core Infrastructure
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 *
 * Create the main orchestrator class for a code generator that coordinates
 * the entire generation process from OpenAPI spec to Next.js application.
 * This class should accept configuration options in its constructor, have a
 * main generate() method that sequentially runs all generation steps,
 * coordinate loading the spec, validating it, and running various
 * generators (types, API routes, client, pages, project files). It should
 * emit events for progress tracking, handle errors gracefully with helpful
 * messages, and return a summary of generated files. The class should
 * support both CLI usage and programmatic usage as a library.
 *
 * ============================================================================
 */
import { EventEmitter } from 'node:events';
import fs from 'node:fs/promises';
import path from 'node:path';
import SwaggerLoader from './core/SwaggerLoader.js';
import SwaggerValidator from './core/SwaggerValidator.js';

export default class SwaggerToNextjs extends EventEmitter {
    constructor(options = {}) {
        super();
        this.options = {
            outputDir: './generated',
            typescript: true,
            generateClient: true,
            generatePages: true,
            force: false,
            dryRun: false,
            verbose: false,
            silent: false,
            ...options
        };

        this.swaggerSource = null;
        this.spec = null;
        this.validation = null;
        this.generatedFiles = [];
        this.errors = [];
        this.warnings = [];

        // Initialize Phase 2 components
        this.loader = new SwaggerLoader();
        this.validator = new SwaggerValidator();

        // Initialize placeholder generators
        this.generators = {};
        this.initializeComponents();
    }

    withSwagger(source) {
        this.swaggerSource = source;
        return this;
    }

    toDirectory(dir) {
        this.options.outputDir = dir;
        return this;
    }

    async initialize(config = {}) {
        this.emit('initialize:start', { config });

        try {
            if (typeof config === 'string') {
                // Load config from file
                const configContent = await fs.readFile(config, 'utf-8');
                const ext = path.extname(config);

                if (ext === '.json') {
                    config = JSON.parse(configContent);
                } else if (ext === '.yaml' || ext === '.yml') {
                    // For now, simple YAML parsing
                    config = {};
                    configContent.split('\n').forEach(line => {
                        const match = line.match(/^(\w+):\s*(.+)$/);
                        if (match) {
                            const [, key, value] = match;
                            config[key] = value === 'true' ? true : value === 'false' ? false : value;
                        }
                    });
                }
            }

            Object.assign(this.options, config);
            this.initializeComponents();

            this.emit('initialize:complete', { options: this.options });
            return this;
        } catch (error) {
            this.emit('initialize:error', { error });
            throw new Error(`Failed to initialize: ${error.message}`);
        }
    }

    initializeComponents() {
        // Initialize generator components (placeholders for now)
        this.generators = {
            types: this.options.typescript ? new TypeGenerator() : null,
            routes: new RouteGenerator(),
            client: this.options.generateClient ? new ClientGenerator() : null,
            pages: this.options.generatePages ? new PageGenerator() : null,
            project: new ProjectGenerator()
        };
    }

    async generate() {
        const startTime = Date.now();

        try {
            this.emit('generate:start');

            if (!this.swaggerSource) {
                throw new Error('No OpenAPI specification source provided');
            }

            // Load spec using SwaggerLoader from Phase 2
            this.emit('progress', { step: 'load', message: 'Loading OpenAPI specification' });
            this.spec = await this.loader.load(this.swaggerSource);

            // Validate using SwaggerValidator from Phase 2
            this.emit('progress', { step: 'validate', message: 'Validating specification' });
            this.validation = this.validator.validate(this.spec);

            if (!this.validation.valid) {
                const errorMessages = this.validation.errors.map(e => e.message).join('\n  - ');
                throw new Error(`Invalid OpenAPI specification:\n  - ${errorMessages}`);
            }

            // Store warnings
            this.warnings = this.validation.warnings.map(w => w.message);

            // Log validation results if verbose
            if (this.options.verbose && !this.options.silent) {
                console.log('\nValidation Results:');
                console.log(`  Valid: ${this.validation.valid}`);
                console.log(`  Errors: ${this.validation.errors.length}`);
                console.log(`  Warnings: ${this.validation.warnings.length}`);

                if (this.validation.warnings.length > 0) {
                    console.log('\nWarnings:');
                    this.validation.warnings.forEach(w => {
                        console.log(`  - ${w.message}`);
                    });
                }
            }

            // Prepare output
            this.emit('progress', { step: 'prepare', message: 'Preparing output directory' });
            if (!this.options.dryRun) {
                await fs.mkdir(this.options.outputDir, { recursive: true });
            }

            // Generate files (placeholder implementation)
            const files = [];

            // Generate types
            if (this.options.typescript && this.generators.types) {
                this.emit('progress', { step: 'types', message: 'Generating TypeScript types' });
                const typeFiles = await this.generators.types.generate(this.spec);
                files.push(...typeFiles);
            }

            // Generate routes
            this.emit('progress', { step: 'routes', message: 'Generating API routes' });
            const routeFiles = await this.generators.routes.generate(this.spec);
            files.push(...routeFiles);

            // Generate client
            if (this.options.generateClient && this.generators.client) {
                this.emit('progress', { step: 'client', message: 'Generating API client' });
                const clientFiles = await this.generators.client.generate(this.spec);
                files.push(...clientFiles);
            }

            // Generate pages
            if (this.options.generatePages && this.generators.pages) {
                this.emit('progress', { step: 'pages', message: 'Generating UI pages' });
                const pageFiles = await this.generators.pages.generate(this.spec);
                files.push(...pageFiles);
            }

            // Generate project files
            this.emit('progress', { step: 'project', message: 'Generating project files' });
            const projectFiles = await this.generators.project.generate(this.spec, this.options);
            files.push(...projectFiles);

            // Write files
            if (!this.options.dryRun) {
                this.emit('progress', { step: 'write', message: 'Writing files' });
                for (const file of files) {
                    const filePath = path.join(this.options.outputDir, file.path);
                    await fs.mkdir(path.dirname(filePath), { recursive: true });
                    await fs.writeFile(filePath, file.content);
                    this.emit('file:written', { path: file.path });
                }
            } else {
                console.log('\n[DRY RUN] Would generate the following files:');
                files.forEach(file => {
                    console.log(`  - ${file.path}`);
                });
            }

            this.generatedFiles = files;

            const duration = Date.now() - startTime;
            const result = {
                success: true,
                duration,
                files,
                errors: this.errors,
                warnings: this.warnings,
                stats: {
                    totalFiles: files.length,
                    duration
                }
            };

            this.emit('generate:complete', result);
            return result;

        } catch (error) {
            this.emit('generate:error', { error });
            throw error;
        }
    }

    async cleanup() {
        this.emit('cleanup:start');

        // Clear caches
        this.loader.clearCache();

        // Reset state
        this.spec = null;
        this.validation = null;
        this.generatedFiles = [];
        this.errors = [];
        this.warnings = [];

        this.emit('cleanup:complete');
    }

    static create(options) {
        return new SwaggerToNextjs(options);
    }
}

// Placeholder generators for testing - will be replaced in later phases
class TypeGenerator {
    async generate(spec) {
        return [
            {
                path: 'types/api.ts',
                content: `// Generated TypeScript types from ${spec.info?.title || 'API'}\n// TODO: Implement in Phase 6`,
                type: 'types'
            }
        ];
    }
}

class RouteGenerator {
    async generate(spec) {
        const routes = [];
        if (spec.paths) {
            Object.keys(spec.paths).forEach(path => {
                routes.push({
                    path: `api${path.replace(/{([^}]+)}/g, '[$1]')}/route.ts`,
                    content: `// Generated route for ${path}\n// TODO: Implement in Phase 6`,
                    type: 'route'
                });
            });
        }
        return routes;
    }
}

class ClientGenerator {
    async generate(spec) {
        return [
            {
                path: 'lib/api-client.ts',
                content: `// Generated API client for ${spec.info?.title || 'API'}\n// TODO: Implement in Phase 6`,
                type: 'client'
            }
        ];
    }
}

class PageGenerator {
    async generate(spec) {
        return [
            {
                path: 'pages/index.tsx',
                content: `// Generated pages for ${spec.info?.title || 'API'}\n// TODO: Implement in Phase 6`,
                type: 'page'
            }
        ];
    }
}

class ProjectGenerator {
    async generate(spec, options) {
        const files = [
            {
                path: 'package.json',
                content: JSON.stringify({
                    name: spec.info?.title?.toLowerCase().replace(/\s+/g, '-') || 'generated-app',
                    version: '1.0.0',
                    scripts: {
                        dev: 'next dev',
                        build: 'next build',
                        start: 'next start',
                        lint: 'next lint'
                    },
                    dependencies: {
                        next: '^14.0.0',
                        react: '^18.2.0',
                        'react-dom': '^18.2.0'
                    },
                    devDependencies: options.typescript ? {
                        '@types/node': '^20.0.0',
                        '@types/react': '^18.2.0',
                        '@types/react-dom': '^18.2.0',
                        typescript: '^5.0.0'
                    } : {}
                }, null, 2),
                type: 'config'
            },
            {
                path: 'README.md',
                content: `# ${spec.info?.title || 'Generated API'}\n\n${spec.info?.description || 'Generated by swagger-to-nextjs'}\n\n## Getting Started\n\n1. Install dependencies: \`npm install\`\n2. Run development server: \`npm run dev\``,
                type: 'docs'
            },
            {
                path: '.gitignore',
                content: `# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts`,
                type: 'config'
            }
        ];

        if (options.typescript) {
            files.push({
                path: 'tsconfig.json',
                content: JSON.stringify({
                    compilerOptions: {
                        target: 'es5',
                        lib: ['dom', 'dom.iterable', 'esnext'],
                        allowJs: true,
                        skipLibCheck: true,
                        strict: true,
                        noEmit: true,
                        esModuleInterop: true,
                        module: 'esnext',
                        moduleResolution: 'bundler',
                        resolveJsonModule: true,
                        isolatedModules: true,
                        jsx: 'preserve',
                        incremental: true,
                        paths: {
                            '@/*': ['./*']
                        }
                    },
                    include: ['next-env.d.ts', '**/*.ts', '**/*.tsx'],
                    exclude: ['node_modules']
                }, null, 2),
                type: 'config'
            });
        }

        return files;
    }
}

// Named export for the class
export { SwaggerToNextjs };

// Re-export the class as a property for compatibility
SwaggerToNextjs.SwaggerToNextjs = SwaggerToNextjs;
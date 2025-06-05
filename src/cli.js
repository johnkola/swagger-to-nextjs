/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - MAIN ORCHESTRATOR
 * ============================================================================
 * FILE: src/cli.js
 * VERSION: 2025-05-30 11:34:23
 * PHASE: PHASE 1: Foundation Components
 * CATEGORY: 🎯 Main Entry Points
 * ============================================================================
 */

const { program } = require('commander');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');

// Handle ora import (ESM module issue)
let ora;
try {
    ora = require('ora');
    if (ora.default) ora = ora.default;
} catch (e) {
    ora = () => ({
        start: (text) => { console.log(`⏳ ${text}`); return { succeed: (t) => console.log(`✅ ${t}`), fail: (t) => console.log(`❌ ${t}`) }; }
    });
}

// Direct imports of all components

// Phase 1 Components
const SwaggerToNextJSGenerator = require('./index');
const defaultConfig = require('../config/defaults');

// Phase 2 Components - Core Infrastructure
const SwaggerLoader = require('./core/SwaggerLoader');
const SwaggerValidator = require('./core/SwaggerValidator');
const DirectoryManager = require('./core/DirectoryManager');

// Phase 2 - Error Classes
const ErrorHandler = require('./errors/ErrorHandler');

// Phase 2 - Logging
const Logger = require('./logging/Logger');
const ProgressReporter = require('./logging/ProgressReporter');

// Phase 3 - Generators
const ApiRouteGenerator = require('./generators/ApiRouteGenerator');
const PageComponentGenerator = require('./generators/PageComponentGenerator');
const ConfigFileGenerator = require('./generators/ConfigFileGenerator');

// Phase 3 - Template System
const TemplateEngine = require('./templates/TemplateEngine');

// Phase 3 - Utilities
const StringUtils = require('./utils/StringUtils');
const ValidationUtils = require('./utils/ValidationUtils');

/**
 * Enhanced CLI Class
 */
class CLI {
    constructor(options = {}) {
        this.version = options.version || '1.0.0';
        this.workingDir = options.workingDir || process.cwd();
        this.isGlobal = options.isGlobal || false;

        // Initialize services
        this.logger = new Logger({ level: options.logLevel });
        this.errorHandler = new ErrorHandler();
        this.generator = new SwaggerToNextJSGenerator({
            logger: this.logger
        });

        // Core services
        this.loader = new SwaggerLoader();
        this.validator = new SwaggerValidator();
        this.dirManager = new DirectoryManager();

        // Utilities
        this.stringUtils = StringUtils;
        this.validationUtils = ValidationUtils;
    }

    /**
     * Run the CLI with arguments
     */
    async run(args) {
        try {
            this.setupCommands();
            await program.parseAsync(['node', 'swagger-to-nextjs', ...args]);
            return 0;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Setup CLI commands
     */
    setupCommands() {
        program
            .name('swagger-to-nextjs')
            .version(this.version)
            .description('Generate Next.js API client and components from Swagger/OpenAPI specification')
            .argument('<source>', 'Swagger specification URL or file path')
            .argument('[output]', 'Output directory', './generated')
            .option('-c, --config <path>', 'Path to configuration file')
            .option('-t, --typescript', 'Generate TypeScript code (default: true)', true)
            .option('--no-typescript', 'Generate JavaScript code')
            .option('-w, --watch', 'Watch for changes and regenerate')
            .option('--api-client <type>', 'API client type (fetch, axios)', 'fetch')
            .option('--no-components', 'Skip component generation')
            .option('--no-hooks', 'Skip hooks generation')
            .option('--no-tests', 'Skip test generation')
            .option('--dry-run', 'Show what would be generated without writing files')
            .option('--clean', 'Clean output directory before generation')
            .option('--verbose', 'Enable verbose logging')
            .option('--debug', 'Enable debug logging')
            .option('--silent', 'Disable all output except errors')
            .option('--concurrency <number>', 'Number of concurrent operations', '5')
            .option('--no-telemetry', 'Disable anonymous usage statistics')
            .option('--use-phases', 'Use Phase 1-3 components if available')
            .action(async (source, output, options) => {
                if (options.usePhases) {
                    await this.generateWithPhases(source, output, options);
                } else {
                    await this.generate(source, output, options);
                }
            });
    }

    /**
     * Generate using Phase 1-3 architecture
     */
    async generateWithPhases(source, output, options) {
        const startTime = Date.now();

        try {
            this.showBanner();

            console.log(chalk.cyan('\n📋 Generation Configuration (Phase Architecture):'));
            console.log(chalk.gray('─'.repeat(50)));
            console.log(`  Source: ${chalk.yellow(source)}`);
            console.log(`  Output: ${chalk.yellow(output)}`);
            console.log(`  Mode: ${chalk.yellow('Phase 1-3 Architecture')}`);

            // Load configuration (Phase 1)
            const config = await this.loadConfig(options);

            // Create a progress tracker
            const progress = new ProgressReporter({
                total: 100,
                format: 'default',
                showPercentage: true,
                showETA: false,
                showSpeed: false,
                logger: this.logger
            });

            // Phase 2: Load specification
            progress.start('Loading OpenAPI specification');
            const spec = await this.loader.load(source);
            progress.setMessage('Specification loaded');
            progress.update(20);

            // Phase 2: Validate specification
            progress.setMessage('Validating specification');
            progress.update(30);
            const validation = await this.validator.validate(spec);

            if (!validation.valid) {
                progress.stop();
                throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
            }

            if (validation.warnings.length > 0) {
                this.logger.warn('Validation warnings:', validation.warnings);
            }

            progress.setMessage(`Validated: ${validation.stats.paths} paths, ${validation.stats.operations} operations`);
            progress.update(40);

            // Phase 2: Prepare directory
            if (!options.dryRun) {
                progress.setMessage('Preparing output directory');
                progress.update(50);

                if (options.clean) {
                    await this.dirManager.clean(output);
                }

                await this.dirManager.prepare(output);
                progress.setMessage('Output directory ready');
                progress.update(60);
            }

            // Phase 3: Initialize generators
            progress.setMessage('Initializing generators');
            progress.update(70);
            const generators = this.getGenerators(config, options);
            progress.setMessage(`Initialized ${generators.length} generators`);
            progress.update(80);

            // Phase 1: Main orchestration
            progress.setMessage('Generating code');
            progress.update(90);
            const result = await this.generator.generate({
                spec,
                output,
                config,
                generators,
                dryRun: options.dryRun
            });
            progress.setMessage('Code generation completed');
            progress.update(100);

            // Show summary
            const duration = Date.now() - startTime;
            console.log(chalk.green('\n✨ Generation Summary:'));
            console.log(chalk.gray('─'.repeat(50)));
            console.log(`  Total files: ${result.totalFiles}`);
            console.log(`  Duration: ${(duration / 1000).toFixed(2)}s`);
            console.log(`  Output: ${result.outputDir}`);

            console.log(chalk.cyan('\n📁 Files by type:'));
            Object.entries(result.filesByType).forEach(([type, count]) => {
                console.log(`  ${type}: ${count}`);
            });

            console.log(chalk.green('\n✅ Generation completed successfully!\n'));

        } catch (error) {
            this.logger.error('Generation failed:', error.message);
            throw error;
        }
    }

    /**
     * Original generate method (backward compatibility)
     */
    async generate(source, output, options) {
        try {
            // Show banner unless silent
            if (!options.silent) {
                this.showBanner();
            }

            console.log(chalk.cyan('\n📋 Generation Configuration:'));
            console.log(chalk.gray('─'.repeat(40)));
            console.log(`  Source: ${chalk.yellow(source)}`);
            console.log(`  Output: ${chalk.yellow(output)}`);
            console.log(`  TypeScript: ${chalk.yellow(options.typescript ? 'Yes' : 'No')}`);
            console.log(`  API Client: ${chalk.yellow(options.apiClient)}`);

            // Check if source exists or is a URL
            if (!source.startsWith('http://') && !source.startsWith('https://')) {
                if (!fs.existsSync(source)) {
                    throw new Error(`Source file not found: ${source}`);
                }
            }

            // Create output directory
            if (!options.dryRun) {
                fs.mkdirSync(output, { recursive: true });
            }

            const spinner = ora();
            spinner.start('Loading Swagger specification...');

            // Load the swagger spec
            let spec;
            if (source.startsWith('http://') || source.startsWith('https://')) {
                // Fetch from URL
                let fetchFn;

                // Try to use built-in fetch (Node.js 18+) or fall back to node-fetch
                if (typeof fetch !== 'undefined') {
                    fetchFn = fetch;
                } else {
                    try {
                        fetchFn = require('node-fetch');
                    } catch (e) {
                        // Try using https module as fallback
                        spec = await this.fetchWithHttps(source);
                        if (!spec) {
                            throw new Error('Unable to fetch URL. Please install node-fetch: npm install node-fetch');
                        }
                    }
                }

                if (fetchFn) {
                    const response = await fetchFn(source);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch: ${response.statusText}`);
                    }
                    spec = await response.json();
                }
            } else {
                // Read from file
                const content = fs.readFileSync(source, 'utf8');
                if (source.endsWith('.yaml') || source.endsWith('.yml')) {
                    spec = yaml.load(content);
                } else {
                    spec = JSON.parse(content);
                }
            }

            spinner.succeed('Swagger specification loaded');

            // Continue with existing generation logic...
            if (!options.dryRun) {
                // Create README
                const readmePath = path.join(output, 'README.md');
                const readmeContent = this.generateReadme(spec, source, options);
                fs.writeFileSync(readmePath, readmeContent);
                spinner.succeed('Generated README.md');

                // Create types file
                if (options.typescript) {
                    const typesPath = path.join(output, 'types.ts');
                    const typesContent = this.generateTypes(spec);
                    fs.writeFileSync(typesPath, typesContent);
                    spinner.succeed('Generated types.ts');
                }

                // Create API client
                const clientExt = options.typescript ? 'ts' : 'js';
                const clientPath = path.join(output, `client.${clientExt}`);
                const clientContent = this.generateClient(spec, options);
                fs.writeFileSync(clientPath, clientContent);
                spinner.succeed(`Generated client.${clientExt}`);

                // Generate endpoint files
                if (spec.paths && Object.keys(spec.paths).length > 0) {
                    const apisDir = path.join(output, 'apis');
                    fs.mkdirSync(apisDir, { recursive: true });

                    const endpointFiles = this.generateEndpointFiles(spec, options);
                    for (const [filename, content] of Object.entries(endpointFiles)) {
                        const filePath = path.join(apisDir, filename);
                        fs.writeFileSync(filePath, content);
                        spinner.succeed(`Generated ${filename}`);
                    }
                }
            }

            console.log(chalk.green('\n✨ Generation complete!'));
            console.log(chalk.gray(`Output directory: ${output}`));

        } catch (error) {
            throw error;
        }
    }

    /**
     * Load configuration
     */
    async loadConfig(options) {
        let config = { ...defaultConfig };

        // Try to load config file
        if (options.config) {
            const configPath = path.resolve(options.config);
            if (fs.existsSync(configPath)) {
                const content = fs.readFileSync(configPath, 'utf8');
                let fileConfig;

                if (configPath.endsWith('.yaml') || configPath.endsWith('.yml')) {
                    fileConfig = yaml.load(content);
                } else if (configPath.endsWith('.json')) {
                    fileConfig = JSON.parse(content);
                } else if (configPath.endsWith('.js')) {
                    fileConfig = require(configPath);
                }

                config = { ...config, ...fileConfig };
                this.logger.info(`Loaded config from ${configPath}`);
            }
        }

        // Apply CLI options
        if (options.typescript !== undefined) config.typescript = options.typescript;
        if (options.apiClient) config.apiClient = options.apiClient;

        config.features = {
            ...config.features,
            components: options.components !== false,
            hooks: options.hooks !== false,
            tests: options.tests !== false
        };

        return config;
    }

    /**
     * Get generators based on configuration
     */
    getGenerators(config, options) {
        const generators = [];

        if (config.features.apiRoutes) {
            generators.push(new ApiRouteGenerator(config));
        }

        if (config.features.pages) {
            generators.push(new PageComponentGenerator(config));
        }

        if (config.features.config) {
            generators.push(new ConfigFileGenerator(config));
        }

        return generators;
    }

    /**
     * Generate README content
     */
    generateReadme(spec, source, options) {
        return `# Generated Next.js API Client

This code was generated from: ${source}

## Configuration
- TypeScript: ${options.typescript}
- API Client: ${options.apiClient}
- Generated on: ${new Date().toISOString()}

## API Information
- Title: ${spec.info?.title || 'Unknown'}
- Version: ${spec.info?.version || 'Unknown'}
- Base URL: ${spec.servers?.[0]?.url || 'Unknown'}

## Endpoints
${this.generateEndpointsList(spec)}

## Next Steps
1. Install dependencies: \`npm install\`
2. Configure your API base URL
3. Start using the generated client

---
*Generated by swagger-to-nextjs v${this.version}*
`;
    }

    /**
     * Generate TypeScript types
     */
    generateTypes(spec) {
        let content = `// Generated TypeScript types from OpenAPI specification\n\n`;

        // Add base response type
        content += `export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}\n\n`;

        // Generate interfaces from schemas
        if (spec.components?.schemas) {
            Object.entries(spec.components.schemas).forEach(([name, schema]) => {
                content += this.generateInterface(name, schema);
                content += '\n\n';
            });
        }

        return content;
    }

    /**
     * Generate TypeScript interface
     */
    generateInterface(name, schema) {
        let content = '';

        if (schema.description) {
            content += `/**\n * ${schema.description}\n */\n`;
        }

        content += `export interface ${name} {\n`;

        if (schema.properties) {
            Object.entries(schema.properties).forEach(([propName, propSchema]) => {
                const required = schema.required?.includes(propName);
                const tsType = this.schemaToTsType(propSchema);

                if (propSchema.description) {
                    content += `  /** ${propSchema.description} */\n`;
                }

                content += `  ${propName}${required ? '' : '?'}: ${tsType};\n`;
            });
        }

        content += `}`;
        return content;
    }

    /**
     * Convert OpenAPI schema to TypeScript type
     */
    schemaToTsType(schema) {
        if (schema.$ref) {
            return schema.$ref.split('/').pop();
        }

        const typeMap = {
            'string': 'string',
            'integer': 'number',
            'number': 'number',
            'boolean': 'boolean',
            'array': schema.items ? `${this.schemaToTsType(schema.items)}[]` : 'any[]',
            'object': 'Record<string, any>'
        };

        return typeMap[schema.type] || 'any';
    }

    /**
     * Generate client code
     */
    generateClient(spec, options) {
        const isTs = options.typescript;
        const baseUrl = spec.servers?.[0]?.url || 'http://localhost:3000';

        return `// Generated API Client
${isTs ? "import type { ApiResponse } from './types';\n\n" : ''}
class ApiClient {
  constructor(baseUrl${isTs ? ': string' : ''} = '${baseUrl}') {
    this.baseUrl = baseUrl;
  }

  async request${isTs ? '<T = any>' : ''}(
    path${isTs ? ': string' : ''}, 
    options${isTs ? ': RequestInit = {}' : ' = {}'} 
  )${isTs ? ': Promise<ApiResponse<T>>' : ''} {
    try {
      const response = await fetch(\`\${this.baseUrl}\${path}\`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      return {
        data,
        status: response.status,
      };
    } catch (error) {
      return {
        error: error${isTs ? ' instanceof Error ? error' : ''}.message${isTs ? " : 'Unknown error'" : ''},
        status: 0,
      };
    }
  }
}

export default ApiClient;
`;
    }

    /**
     * Generate endpoints list
     */
    generateEndpointsList(spec) {
        const endpoints = [];
        if (spec.paths) {
            for (const [path, methods] of Object.entries(spec.paths)) {
                for (const [method, operation] of Object.entries(methods)) {
                    if (['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
                        endpoints.push(`- ${method.toUpperCase()} ${path} - ${operation.summary || 'No description'}`);
                    }
                }
            }
        }
        return endpoints.length > 0 ? endpoints.join('\n') : '- No endpoints found';
    }

    /**
     * Generate endpoint files
     */
    generateEndpointFiles(spec, options) {
        const files = {};
        const isTs = options.typescript;
        const ext = isTs ? 'ts' : 'js';

        // Group endpoints by tag
        const endpointsByTag = {};

        if (spec.paths) {
            for (const [path, methods] of Object.entries(spec.paths)) {
                for (const [method, operation] of Object.entries(methods)) {
                    if (['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
                        const tags = operation.tags || ['default'];
                        const tag = tags[0];

                        if (!endpointsByTag[tag]) {
                            endpointsByTag[tag] = [];
                        }

                        endpointsByTag[tag].push({
                            path,
                            method,
                            operation,
                            operationId: operation.operationId || this.generateOperationId(method, path)
                        });
                    }
                }
            }
        }

        // Generate file for each tag
        for (const [tag, endpoints] of Object.entries(endpointsByTag)) {
            const fileName = `${this.toKebabCase(tag)}.${ext}`;
            const className = this.toPascalCase(tag) + 'Api';

            let content = `// ${className} - Auto-generated from OpenAPI spec\n`;
            content += isTs ? `import type { ApiResponse } from '../types';\n` : '';
            content += `import ApiClient from '../client';\n\n`;

            content += `export class ${className} {\n`;
            content += `  constructor(private client${isTs ? ': ApiClient' : ''}) {}\n\n`;

            // Generate methods
            for (const { path, method, operation, operationId } of endpoints) {
                const methodName = this.toCamelCase(operationId);
                const params = this.extractParameters(operation);
                const hasBody = ['post', 'put', 'patch'].includes(method);

                content += `  /**\n`;
                content += `   * ${operation.summary || operation.description || 'No description'}\n`;
                content += `   * ${method.toUpperCase()} ${path}\n`;
                content += `   */\n`;
                content += `  async ${methodName}(`;

                // Add parameters
                const paramList = [];
                if (params.path.length > 0) {
                    paramList.push(...params.path.map(p => `${p.name}${isTs ? `: ${this.getParamType(p)}` : ''}`));
                }
                if (hasBody) {
                    paramList.push(`data${isTs ? ': any' : ''}`);
                }
                if (params.query.length > 0) {
                    paramList.push(`params${isTs ? '?: { ' + params.query.map(p => `${p.name}?: ${this.getParamType(p)}`).join(', ') + ' }' : ' = {}'}`);
                }

                content += paramList.join(', ');
                content += `)${isTs ? ': Promise<ApiResponse>' : ''} {\n`;

                // Build path with parameters
                let pathStr = '`' + path.replace(/{([^}]+)}/g, '${$1}') + '`';

                // Build query string
                if (params.query.length > 0) {
                    content += `    const queryString = new URLSearchParams(params).toString();\n`;
                    content += `    const url = ${pathStr} + (queryString ? '?' + queryString : '');\n`;
                } else {
                    content += `    const url = ${pathStr};\n`;
                }

                // Make request
                content += `    return this.client.request(url, {\n`;
                content += `      method: '${method.toUpperCase()}',\n`;
                if (hasBody) {
                    content += `      body: JSON.stringify(data),\n`;
                }
                content += `    });\n`;
                content += `  }\n\n`;
            }

            content += `}\n`;

            files[fileName] = content;
        }

        // Generate index file
        const indexContent = this.generateApiIndex(endpointsByTag, isTs);
        files[`index.${ext}`] = indexContent;

        return files;
    }

    /**
     * Generate API index file
     */
    generateApiIndex(endpointsByTag, isTs) {
        let content = `// API Index - Auto-generated\n`;
        content += `import ApiClient from '../client';\n`;

        // Import all API classes
        for (const tag of Object.keys(endpointsByTag)) {
            const className = this.toPascalCase(tag) + 'Api';
            const fileName = this.toKebabCase(tag);
            content += `import { ${className} } from './${fileName}';\n`;
        }

        content += `\nexport class Api {\n`;

        // Add properties
        for (const tag of Object.keys(endpointsByTag)) {
            const propName = this.toCamelCase(tag);
            const className = this.toPascalCase(tag) + 'Api';
            content += `  public readonly ${propName}${isTs ? `: ${className}` : ''};\n`;
        }

        content += `\n  constructor(baseUrl${isTs ? '?: string' : ''}) {\n`;
        content += `    const client = new ApiClient(baseUrl);\n`;

        // Initialize all APIs
        for (const tag of Object.keys(endpointsByTag)) {
            const propName = this.toCamelCase(tag);
            const className = this.toPascalCase(tag) + 'Api';
            content += `    this.${propName} = new ${className}(client);\n`;
        }

        content += `  }\n}\n\n`;
        content += `export default Api;\n`;

        return content;
    }

    /**
     * Extract parameters from operation
     */
    extractParameters(operation) {
        const params = {
            path: [],
            query: [],
            header: []
        };

        if (operation.parameters) {
            for (const param of operation.parameters) {
                if (params[param.in]) {
                    params[param.in].push(param);
                }
            }
        }

        return params;
    }

    /**
     * Get TypeScript type for parameter
     */
    getParamType(param) {
        const schemaType = param.schema?.type || 'any';
        const typeMap = {
            'string': 'string',
            'integer': 'number',
            'number': 'number',
            'boolean': 'boolean',
            'array': 'any[]',
            'object': 'any'
        };
        return typeMap[schemaType] || 'any';
    }

    /**
     * Generate operation ID from method and path
     */
    generateOperationId(method, path) {
        const parts = path.split('/').filter(p => p && !p.startsWith('{'));
        return method + parts.map(p => this.toPascalCase(p)).join('');
    }

    /**
     * Fetch with https module as fallback
     */
    async fetchWithHttps(url) {
        return new Promise((resolve, reject) => {
            const https = require('https');
            const http = require('http');
            const urlModule = require('url');

            const parsedUrl = urlModule.parse(url);
            const module = parsedUrl.protocol === 'https:' ? https : http;

            module.get(url, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(new Error('Failed to parse JSON response'));
                    }
                });
            }).on('error', (err) => {
                reject(err);
            });
        });
    }

    /**
     * Convert string to camelCase
     */
    toCamelCase(str) {
        return this.stringUtils.toCamelCase(str);
    }

    /**
     * Convert string to PascalCase
     */
    toPascalCase(str) {
        return this.stringUtils.toPascalCase(str);
    }

    /**
     * Convert string to kebab-case
     */
    toKebabCase(str) {
        return this.stringUtils.toKebabCase(str);
    }

    /**
     * Show banner
     */
    showBanner() {
        console.log(chalk.cyan(`
╔═══════════════════════════════════════════════╗
║      Swagger to Next.js Generator v${this.version}      ║
╚═══════════════════════════════════════════════╝
        `));
    }

    /**
     * Handle errors
     */
    handleError(error) {
        if (this.errorHandler) {
            const result = this.errorHandler.handle(error);
            // Ensure we return a number exit code
            return typeof result === 'number' ? result : 1;
        }

        console.error(chalk.red('\n❌ Error:'), error.message);

        if (error.stack && (process.env.DEBUG || process.env.VERBOSE)) {
            console.error(chalk.gray('\nStack trace:'));
            console.error(chalk.gray(error.stack));
        }

        if (error.message.includes('ENOENT')) {
            console.error(chalk.yellow('\n💡 The specified file was not found.'));
        } else if (error.message.includes('EACCES')) {
            console.error(chalk.yellow('\n💡 Permission denied. Check file permissions.'));
        } else if (error.message.includes('Cannot find module')) {
            console.error(chalk.yellow('\n💡 Dependencies may be missing. Run: npm install'));
        }

        return 1;
    }

    /**
     * Show help
     */
    async showHelp() {
        program.outputHelp();
    }

    /**
     * Shutdown CLI
     */
    async shutdown() {
        console.log('CLI shutdown complete');
    }
}

module.exports = CLI;
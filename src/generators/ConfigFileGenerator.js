/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - CONFIGURATION FILE GENERATOR
 * ============================================================================
 * FILE: src/generators/ConfigFileGenerator.js
 * VERSION: 2025-05-30 11:34:23
 * PHASE: PHASE 3: Code Generation Engine
 * CATEGORY: 📄 Configuration Generators
 * ============================================================================
 */

const path = require('path');
const BaseGenerator = require('./BaseGenerator');
const GeneratorError = require('../errors/GeneratorError');

// Constants
const MAX_PROJECT_NAME_LENGTH = 64;
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico', '.bmp', '.avif'];
const CRITICAL_GENERATORS = ['package', 'typescript', 'next'];
const DEFAULT_NODE_VERSION = '20.x';
const COMMON_CDNS = ['cloudinary.com', 'imgix.net', 'fastly.net', 'unsplash.com'];

/**
 * ConfigFileGenerator - Main orchestrator for configuration generation
 * Properly extends BaseGenerator to use its lifecycle and features
 */
class ConfigFileGenerator extends BaseGenerator {
    constructor(options = {}) {
        super({
            ...options,
            templateDir: 'config',
            outputSubdir: '' // Root level configs
        });

        // Initialize configuration
        this.config = {
            projectName: options.projectName || 'nextjs-app',
            description: options.description || 'Next.js application generated from OpenAPI',
            outputPath: options.outputPath || process.cwd(),
            apiSpec: options.apiSpec || null,
            features: options.features || {},
            deployment: options.deployment || {},
            testing: options.testing || {},
            ...options
        };

        // Initialize sub-generators
        this.subGenerators = new Map();

        // Track generation phases
        this.phases = {
            core: [],
            development: [],
            deployment: [],
            documentation: []
        };

        // Initialize state
        this.state = {
            ...this.state,
            generatedConfigs: [],
            failedGenerators: [],
            warnings: []
        };

        // Store event listener cleanup functions
        this._cleanupFunctions = [];
    }

    /**
     * Initialize the generator and sub-generators
     */
    async initialize(context) {
        await super.initialize(context);

        this.logger.info('Initializing configuration generators...');

        // Initialize sub-generators
        await this.initializeSubGenerators();

        this.emit('initialized', {
            subGenerators: this.subGenerators.size,
            phases: Object.keys(this.phases)
        });
    }

    /**
     * Initialize all sub-generators
     */
    async initializeSubGenerators() {
        // Import generators with consistent pattern
        const generators = [
            {
                name: 'package',
                loader: () => require('./config/PackageConfigGenerator').PackageConfigGenerator,
                phase: 'core'
            },
            {
                name: 'typescript',
                loader: () => require('./config/TypeScriptConfigGenerator'),
                phase: 'core'
            },
            {
                name: 'next',
                loader: () => require('./config/NextConfigGenerator'),
                phase: 'core'
            },
            {
                name: 'environment',
                loader: () => require('./config/EnvironmentConfigGenerator'),
                phase: 'core'
            },
            {
                name: 'linting',
                loader: () => require('./config/LintingConfigGenerator'),
                phase: 'development'
            },
            {
                name: 'editor',
                loader: () => require('./config/EditorConfigGenerator'),
                phase: 'development'
            },
            {
                name: 'docker',
                loader: () => {
                    const module = require('./config/DockerConfigGenerator');
                    return module.default || module.DockerConfigGenerator || module;
                },
                phase: 'deployment',
                optional: true
            },
            {
                name: 'deployment',
                loader: () => {
                    const module = require('./config/DeploymentConfigGenerator');
                    return module.default || module.DeploymentConfigGenerator || module;
                },
                phase: 'deployment'
            },
            {
                name: 'cicd',
                loader: () => {
                    const module = require('./config/CICDConfigGenerator');
                    return module.default || module.CICDConfigGenerator || module;
                },
                phase: 'deployment'
            },
            {
                name: 'documentation',
                loader: () => require('./config/DocumentationGenerator'),
                phase: 'documentation'
            }
        ];

        for (const { name, loader, phase, optional } of generators) {
            try {
                const Generator = loader();

                if (!Generator) {
                    throw new Error(`Failed to load generator: ${name}`);
                }

                const instance = new Generator({
                    ...this.config,
                    logger: this.logger,
                    templateEngine: this.templateEngine,
                    directoryManager: this.directoryManager,
                    // Pass utilities to sub-generators
                    stringUtils: this.stringUtils,
                    schemaUtils: this.schemaUtils,
                    pathUtils: this.pathUtils,
                    validationUtils: this.validationUtils
                });

                this.subGenerators.set(name, instance);
                this.phases[phase].push(name);

                // Register sub-generator events with cleanup
                if (instance.on && typeof instance.on === 'function') {
                    const errorHandler = (error) => {
                        this.logger.warn(`Sub-generator ${name} error:`, error);
                        if (!optional) {
                            this.state.failedGenerators.push({ name, error });
                        }
                    };

                    instance.on('error', errorHandler);

                    // Store cleanup function
                    this._cleanupFunctions.push(() => {
                        if (instance.removeListener) {
                            instance.removeListener('error', errorHandler);
                        }
                    });
                }
            } catch (error) {
                this.logger.warn(`Failed to initialize ${name} generator:`, error);
                if (!optional) {
                    throw new GeneratorError(`Failed to initialize ${name} generator`, {
                        code: 'INIT_ERROR',
                        generator: name,
                        error: error.message
                    });
                }
            }
        }
    }

    /**
     * Validate configuration context
     */
    async doValidate(context) {
        this.logger.debug('Validating configuration context...');

        // Validate project name
        if (!context.projectName || !/^[a-z0-9-]+$/.test(context.projectName)) {
            throw new GeneratorError('Project name must be lowercase alphanumeric with hyphens', {
                code: 'INVALID_PROJECT_NAME',
                projectName: context.projectName
            });
        }

        // Validate output path
        if (!context.outputPath) {
            throw new GeneratorError('Output path is required', {
                code: 'MISSING_OUTPUT_PATH'
            });
        }

        // Validate API spec if provided
        if (context.apiSpec && !context.apiSpec.openapi && !context.apiSpec.swagger) {
            throw new GeneratorError('Invalid OpenAPI/Swagger specification', {
                code: 'INVALID_API_SPEC'
            });
        }

        // Validate sub-generator specific requirements
        for (const [name, generator] of this.subGenerators) {
            if (generator.validate && typeof generator.validate === 'function') {
                try {
                    await generator.validate(context);
                } catch (error) {
                    throw new GeneratorError(`Validation failed for ${name} generator`, {
                        code: 'SUB_GENERATOR_VALIDATION_ERROR',
                        generator: name,
                        error: error.message
                    });
                }
            }
        }
    }

    /**
     * Prepare generation context
     */
    async doPrepare(context) {
        this.logger.debug('Preparing configuration context...');

        // Build enhanced context using BaseGenerator utilities
        const preparedContext = {
            ...context,
            projectName: this.extractProjectName(context),
            features: this.analyzeFeatures(context),
            envVariables: this.extractEnvVariables(context),
            buildConfig: this.prepareBuildConfig(context),
            securityConfig: this.prepareSecurityConfig(context),
            imageDomains: this.extractImageDomains(context),
            nodeVersion: this.getNodeVersion(context),
            packageJson: context.packageJson || {},
            // Maintain references to original config
            originalConfig: this.config,
            swagger: context.apiSpec || context.swagger
        };

        return preparedContext;
    }

    /**
     * Extract and sanitize project name
     */
    extractProjectName(context) {
        let projectName = context.projectName;

        if (!projectName && context.swagger?.info?.title) {
            projectName = context.swagger.info.title;
        }

        if (!projectName) {
            projectName = 'nextjs-app';
        }

        // Sanitize the project name using string utils
        return this.toKebabCase(projectName)
            .replace(/[^a-z0-9-]/g, '')
            .replace(/^-+|-+$/g, '')
            .substring(0, MAX_PROJECT_NAME_LENGTH);
    }

    /**
     * Analyze API features from OpenAPI spec
     */
    analyzeFeatures(context) {
        const features = {
            authentication: false,
            fileUpload: false,
            websocket: false,
            pagination: false,
            filtering: false,
            sorting: false,
            validation: true,
            rateLimit: false,
            cors: true,
            compression: true,
            caching: false,
            i18n: false,
            graphql: false,
            realtime: false,
            search: false,
            analytics: false,
            monitoring: false,
            logging: true,
            testing: true,
            documentation: true
        };

        if (!context.swagger) return features;

        // Check for authentication
        if (context.swagger.securityDefinitions || context.swagger.components?.securitySchemes) {
            features.authentication = true;
        }

        // Check paths for various features
        Object.entries(context.swagger.paths || {}).forEach(([path, methods]) => {
            Object.entries(methods).forEach(([method, operation]) => {
                if (typeof operation !== 'object') return;

                // Check for file upload
                if (operation.consumes?.includes('multipart/form-data')) {
                    features.fileUpload = true;
                }

                // Check for pagination
                if (operation.parameters?.some(p => ['page', 'limit', 'offset'].includes(p.name))) {
                    features.pagination = true;
                }

                // Check for filtering
                if (operation.parameters?.some(p => p.name.includes('filter') || p.name.includes('search'))) {
                    features.filtering = true;
                    features.search = true;
                }

                // Check for sorting
                if (operation.parameters?.some(p => ['sort', 'orderBy'].includes(p.name))) {
                    features.sorting = true;
                }

                // Check for websocket
                if (path.includes('ws') || path.includes('socket')) {
                    features.websocket = true;
                    features.realtime = true;
                }

                // Check for rate limiting headers
                if (operation.responses?.['429']) {
                    features.rateLimit = true;
                }

                // Check for caching headers
                if (operation.responses?.['304']) {
                    features.caching = true;
                }
            });
        });

        // Check for i18n
        if (context.swagger.info?.['x-i18n'] || context.swagger['x-i18n']) {
            features.i18n = true;
        }

        // Check for GraphQL
        if (context.swagger.paths?.['/graphql'] || context.swagger.info?.title?.toLowerCase().includes('graphql')) {
            features.graphql = true;
        }

        return features;
    }

    /**
     * Extract environment variables from OpenAPI spec
     */
    extractEnvVariables(context) {
        const envVars = {
            // Default Next.js variables
            NEXT_PUBLIC_API_URL: {
                description: 'Base URL for API requests',
                required: true,
                public: true,
                default: 'http://localhost:3000/api',
                example: 'https://api.example.com'
            },
            NODE_ENV: {
                description: 'Node environment',
                required: true,
                public: false,
                default: 'development',
                example: 'production'
            }
        };

        if (!context.swagger) return envVars;

        // Extract from servers
        if (context.swagger.servers) {
            context.swagger.servers.forEach((server, index) => {
                const varName = index === 0 ? 'NEXT_PUBLIC_API_URL' : `NEXT_PUBLIC_API_URL_${index + 1}`;
                envVars[varName] = {
                    description: server.description || `API Server ${index + 1}`,
                    required: true,
                    public: true,
                    default: server.url,
                    example: server.url
                };

                // Extract server variables
                if (server.variables) {
                    Object.entries(server.variables).forEach(([name, variable]) => {
                        const envName = `NEXT_PUBLIC_${this.toSnakeCase(name).toUpperCase()}`;
                        envVars[envName] = {
                            description: variable.description || `Server variable: ${name}`,
                            required: true,
                            public: true,
                            default: variable.default,
                            example: variable.enum ? variable.enum[0] : variable.default
                        };
                    });
                }
            });
        }

        // Extract from security schemes
        const securitySchemes = context.swagger.components?.securitySchemes || context.swagger.securityDefinitions;
        if (securitySchemes) {
            Object.entries(securitySchemes).forEach(([name, scheme]) => {
                if (scheme.type === 'apiKey') {
                    const envName = `${this.toSnakeCase(name).toUpperCase()}_API_KEY`;
                    envVars[envName] = {
                        description: scheme.description || `API Key for ${name}`,
                        required: true,
                        public: false,
                        generate: true,
                        example: 'your-api-key-here'
                    };
                } else if (scheme.type === 'oauth2') {
                    envVars[`${this.toSnakeCase(name).toUpperCase()}_CLIENT_ID`] = {
                        description: `OAuth2 Client ID for ${name}`,
                        required: true,
                        public: true,
                        example: 'your-client-id'
                    };
                    envVars[`${this.toSnakeCase(name).toUpperCase()}_CLIENT_SECRET`] = {
                        description: `OAuth2 Client Secret for ${name}`,
                        required: true,
                        public: false,
                        generate: true,
                        example: 'your-client-secret'
                    };
                }
            });
        }

        // Add authentication-related variables if auth is detected
        if (context.features?.authentication) {
            envVars.NEXTAUTH_URL = {
                description: 'Canonical URL of your site',
                required: true,
                public: false,
                default: 'http://localhost:3000',
                example: 'https://example.com'
            };
            envVars.NEXTAUTH_SECRET = {
                description: 'Secret used to encrypt JWT tokens',
                required: true,
                public: false,
                generate: true,
                example: 'your-secret-key-here'
            };
            envVars.JWT_SECRET = {
                description: 'JWT signing secret',
                required: true,
                public: false,
                generate: true,
                example: 'your-jwt-secret'
            };
        }

        // Add database URL if database is configured
        if (context.options?.database && context.options.database !== 'none') {
            envVars.DATABASE_URL = {
                description: 'Database connection string',
                required: true,
                public: false,
                default: this.getDefaultDatabaseUrl(context.options.database),
                example: this.getDatabaseUrlExample(context.options.database)
            };
        }

        // Add feature-specific variables
        if (context.features?.fileUpload) {
            envVars.NEXT_PUBLIC_MAX_FILE_SIZE = {
                description: 'Maximum file upload size in bytes',
                required: false,
                public: true,
                default: '5242880', // 5MB
                example: '10485760' // 10MB
            };
            envVars.UPLOAD_DIR = {
                description: 'Directory for file uploads',
                required: false,
                public: false,
                default: './uploads',
                example: '/var/uploads'
            };
        }

        if (context.features?.rateLimit) {
            envVars.RATE_LIMIT_MAX = {
                description: 'Maximum requests per window',
                required: false,
                public: false,
                default: '100',
                example: '100'
            };
            envVars.RATE_LIMIT_WINDOW = {
                description: 'Rate limit window in milliseconds',
                required: false,
                public: false,
                default: '900000', // 15 minutes
                example: '900000'
            };
        }

        if (context.features?.analytics) {
            envVars.NEXT_PUBLIC_GA_ID = {
                description: 'Google Analytics ID',
                required: false,
                public: true,
                example: 'G-XXXXXXXXXX'
            };
        }

        return envVars;
    }

    /**
     * Prepare build configuration
     */
    prepareBuildConfig(context) {
        return {
            swcMinify: true,
            productionBrowserSourceMaps: false,
            poweredByHeader: false,
            compress: true,
            reactStrictMode: true,
            experimental: {
                appDir: true,
                serverActions: true,
                optimizeFonts: true,
                optimizeImages: true,
                scrollRestoration: true
            },
            compiler: {
                removeConsole: context.options?.removeConsole || {
                    exclude: ['error', 'warn']
                }
            },
            images: {
                formats: ['image/avif', 'image/webp'],
                minimumCacheTTL: 60,
                dangerouslyAllowSVG: false,
                contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
            }
        };
    }

    /**
     * Prepare security configuration
     */
    prepareSecurityConfig(context) {
        const headers = [
            {
                key: 'X-DNS-Prefetch-Control',
                value: 'on'
            },
            {
                key: 'Strict-Transport-Security',
                value: 'max-age=63072000; includeSubDomains; preload'
            },
            {
                key: 'X-XSS-Protection',
                value: '1; mode=block'
            },
            {
                key: 'X-Frame-Options',
                value: 'SAMEORIGIN'
            },
            {
                key: 'X-Content-Type-Options',
                value: 'nosniff'
            },
            {
                key: 'Referrer-Policy',
                value: 'origin-when-cross-origin'
            },
            {
                key: 'Permissions-Policy',
                value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
            }
        ];

        // Content Security Policy
        const csp = {
            'default-src': ["'self'"],
            'script-src': ["'self'", "'unsafe-eval'", "'unsafe-inline'"],
            'style-src': ["'self'", "'unsafe-inline'"],
            'img-src': ["'self'", 'data:', 'https:'],
            'font-src': ["'self'"],
            'connect-src': ["'self'"],
            'media-src': ["'self'"],
            'object-src': ["'none'"],
            'frame-src': ["'self'"],
            'worker-src': ["'self'"],
            'form-action': ["'self'"],
            'base-uri': ["'self'"],
            'manifest-src': ["'self'"],
            'upgrade-insecure-requests': []
        };

        // Add API URLs to connect-src
        if (context.swagger?.servers) {
            context.swagger.servers.forEach(server => {
                const domain = this.extractDomain(server.url);
                if (domain) {
                    csp['connect-src'].push(domain);
                }
            });
        }

        // Convert CSP object to string
        const cspString = Object.entries(csp)
            .map(([key, values]) => `${key} ${values.join(' ')}`)
            .join('; ');

        headers.push({
            key: 'Content-Security-Policy',
            value: cspString
        });

        return {
            headers,
            csp,
            cors: {
                origin: context.features?.cors ? '*' : false,
                credentials: true,
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
                allowedHeaders: ['Content-Type', 'Authorization'],
                exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
                maxAge: 86400
            },
            rateLimit: context.features?.rateLimit ? {
                windowMs: 15 * 60 * 1000, // 15 minutes
                max: 100,
                message: 'Too many requests from this IP, please try again later.',
                standardHeaders: true,
                legacyHeaders: false
            } : null
        };
    }

    /**
     * Extract image domains from OpenAPI spec
     */
    extractImageDomains(context) {
        const domains = new Set();

        // Add default domains
        domains.add('localhost');

        // Extract from servers
        if (context.swagger?.servers) {
            context.swagger.servers.forEach(server => {
                const domain = this.extractDomain(server.url);
                if (domain) {
                    domains.add(domain);
                }
            });
        }

        // Extract from example responses or schemas
        const extractFromSchema = (schema) => {
            if (!schema || typeof schema !== 'object') return;

            if (schema.example) {
                const urls = this.extractUrls(JSON.stringify(schema.example));
                urls.forEach(url => {
                    const domain = this.extractDomain(url);
                    if (domain && this.isImageUrl(url)) {
                        domains.add(domain);
                    }
                });
            }

            if (schema.properties) {
                Object.values(schema.properties).forEach(prop => extractFromSchema(prop));
            }

            if (schema.items) {
                extractFromSchema(schema.items);
            }
        };

        // Scan all schemas
        if (context.swagger?.components?.schemas) {
            Object.values(context.swagger.components.schemas).forEach(extractFromSchema);
        }

        // Add common CDN domains if detected
        COMMON_CDNS.forEach(cdn => {
            if (Array.from(domains).some(d => d.includes(cdn))) {
                domains.add(cdn);
            }
        });

        return Array.from(domains);
    }

    /**
     * Get Node.js version
     */
    getNodeVersion(context) {
        // Check .nvmrc
        if (context.nvmrc) {
            return context.nvmrc.trim();
        }

        // Check package.json engines
        if (context.packageJson?.engines?.node) {
            const nodeVersion = context.packageJson.engines.node;
            // Extract major version
            const match = nodeVersion.match(/(\d+)/);
            return match ? `${match[1]}.x` : DEFAULT_NODE_VERSION;
        }

        // Default to LTS
        return DEFAULT_NODE_VERSION;
    }

    /**
     * Get default database URL
     */
    getDefaultDatabaseUrl(dbType) {
        const urls = {
            prisma: 'postgresql://localhost:5432/myapp',
            mongodb: 'mongodb://localhost:27017/myapp',
            mysql: 'mysql://root:password@localhost:3306/myapp',
            sqlite: 'file:./dev.db'
        };
        return urls[dbType] || urls.prisma;
    }

    /**
     * Get database URL example
     */
    getDatabaseUrlExample(dbType) {
        const examples = {
            prisma: 'postgresql://user:password@host:5432/database',
            mongodb: 'mongodb+srv://user:password@cluster.mongodb.net/database',
            mysql: 'mysql://user:password@host:3306/database',
            sqlite: 'file:./prod.db'
        };
        return examples[dbType] || examples.prisma;
    }

    /**
     * Extract domain from URL
     */
    extractDomain(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname;
        } catch {
            return null;
        }
    }

    /**
     * Extract URLs from text
     */
    extractUrls(text) {
        const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
        return text.match(urlRegex) || [];
    }

    /**
     * Check if URL is an image
     */
    isImageUrl(url) {
        return IMAGE_EXTENSIONS.some(ext => url.toLowerCase().includes(ext));
    }

    /**
     * Generate configuration files using sub-generators
     */
    async doGenerate(context) {
        const files = [];

        this.emit('generation:start', {
            phases: Object.keys(this.phases),
            totalGenerators: this.subGenerators.size
        });

        // Execute generation phases in order
        for (const [phaseName, generatorNames] of Object.entries(this.phases)) {
            this.logger.info(`\n📦 Phase: ${phaseName}`);
            this.emit('phase:start', { phase: phaseName });

            const phaseFiles = await this.executePhase(phaseName, generatorNames, context);
            files.push(...phaseFiles);

            this.emit('phase:complete', {
                phase: phaseName,
                filesGenerated: phaseFiles.length
            });
        }

        // Generate summary file
        const summaryFile = await this.generateSummaryFile(context, files);
        if (summaryFile) {
            files.push(summaryFile);
        }

        return files;
    }

    /**
     * Execute a generation phase
     */
    async executePhase(phaseName, generatorNames, context) {
        const phaseFiles = [];

        for (const generatorName of generatorNames) {
            const generator = this.subGenerators.get(generatorName);
            if (!generator) {
                this.logger.warn(`Generator ${generatorName} not found, skipping...`);
                continue;
            }

            try {
                this.logger.info(`  • Running ${generatorName} generator...`);

                let configs = [];

                // Call the generator's generate method
                if (typeof generator.generate === 'function') {
                    configs = await generator.generate(context);
                } else {
                    this.logger.warn(`Generator ${generatorName} has no generate method`);
                    continue;
                }

                // Normalize the response to file format
                const normalizedFiles = this.normalizeGeneratorOutput(configs, generatorName);

                phaseFiles.push(...normalizedFiles);

                this.state.generatedConfigs.push({
                    generator: generatorName,
                    files: normalizedFiles.length,
                    phase: phaseName
                });

                this.emit('generator:complete', {
                    generator: generatorName,
                    filesGenerated: normalizedFiles.length
                });

            } catch (error) {
                this.logger.error(`Failed to run ${generatorName} generator:`, error);
                this.state.failedGenerators.push({
                    name: generatorName,
                    phase: phaseName,
                    error: error.message
                });

                // Continue with other generators unless it's critical
                if (this.isCriticalGenerator(generatorName)) {
                    throw new GeneratorError(`Critical generator ${generatorName} failed`, {
                        code: 'CRITICAL_GENERATOR_FAILURE',
                        generator: generatorName,
                        error: error.message
                    });
                }
            }
        }

        return phaseFiles;
    }

    /**
     * Normalize generator output to consistent file format
     */
    normalizeGeneratorOutput(output, generatorName) {
        const files = [];

        if (!output) return files;

        // Handle different output formats
        if (Array.isArray(output)) {
            for (const item of output) {
                if (item && item.path && (item.content !== undefined || item.generated)) {
                    files.push({
                        path: item.path,
                        content: item.content || '',
                        options: item.options || {},
                        generator: generatorName,
                        generated: item.generated || false
                    });
                }
            }
        } else if (output && typeof output === 'object') {
            // Handle single file output
            if (output.path && output.content !== undefined) {
                files.push({
                    path: output.path,
                    content: output.content,
                    options: output.options || {},
                    generator: generatorName
                });
            }
            // Handle object with files property
            else if (output.files && Array.isArray(output.files)) {
                files.push(...this.normalizeGeneratorOutput(output.files, generatorName));
            }
            // Handle PackageConfigGenerator style output
            else if (output.name && output.version) {
                files.push({
                    path: 'package.json',
                    content: JSON.stringify(output, null, 2),
                    options: {},
                    generator: generatorName
                });
            }
        }

        return files;
    }

    /**
     * Check if a generator is critical
     */
    isCriticalGenerator(generatorName) {
        return CRITICAL_GENERATORS.includes(generatorName);
    }

    /**
     * Generate a summary file
     */
    async generateSummaryFile(context, files) {
        const summary = {
            project: {
                name: context.projectName,
                description: context.description,
                generatedAt: new Date().toISOString()
            },
            generation: {
                totalFiles: files.length,
                successfulGenerators: this.state.generatedConfigs.length,
                failedGenerators: this.state.failedGenerators.length,
                warnings: this.state.warnings.length
            },
            filesByGenerator: this.state.generatedConfigs.reduce((acc, config) => {
                acc[config.generator] = config.files;
                return acc;
            }, {}),
            filesByType: this.categorizeFilesByType(files),
            features: context.features,
            deployment: {
                platform: context.deployment?.platform || 'vercel',
                docker: context.deployment?.docker !== false,
                cicd: 'github-actions'
            },
            nextSteps: this.generateNextSteps(context)
        };

        return {
            path: '.generation-summary.json',
            content: JSON.stringify(summary, null, 2),
            options: { overwrite: true }
        };
    }

    /**
     * Categorize files by type
     */
    categorizeFilesByType(files) {
        const categories = {};

        for (const file of files) {
            const type = this.getFileType(file.path);
            categories[type] = (categories[type] || 0) + 1;
        }

        return categories;
    }

    /**
     * Get file type from path
     */
    getFileType(filePath) {
        if (filePath.includes('.github')) return 'ci/cd';
        if (filePath.includes('docker') || filePath.includes('Dockerfile')) return 'docker';
        if (filePath.includes('docs/') || filePath.endsWith('.md')) return 'documentation';
        if (filePath.includes('.env')) return 'environment';
        if (filePath.endsWith('rc') || filePath.endsWith('.json')) return 'configuration';
        if (filePath.includes('scripts/')) return 'scripts';
        if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) return 'typescript';
        if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) return 'javascript';
        return 'other';
    }

    /**
     * Generate next steps for the user
     */
    generateNextSteps(context) {
        const steps = [];

        steps.push('1. Install dependencies: npm install');
        steps.push('2. Copy .env.example to .env.local and update values');

        if (context.features?.database) {
            steps.push('3. Set up your database and run migrations');
        }

        steps.push(`${steps.length + 1}. Start development server: npm run dev`);
        steps.push(`${steps.length + 1}. Open http://localhost:3000`);

        return steps;
    }

    /**
     * Override finalize to add summary reporting
     */
    async finalize(files) {
        await super.finalize(files);

        // Generate and display summary
        const summary = this.generateReport();

        this.logger.info('\n✅ Configuration generation completed successfully!\n');
        this.printSummary(summary);

        // Emit completion event with detailed results
        this.emit('generation:complete', {
            success: true,
            summary,
            files: files.length,
            errors: this.state.failedGenerators,
            warnings: this.state.warnings
        });
    }

    /**
     * Override error handling
     */
    async _handleError(error) {
        await super._handleError(error);

        // Add specific error handling for configuration generation
        if (error.code === 'CRITICAL_GENERATOR_FAILURE') {
            this.logger.error('\n❌ Critical configuration generation failed!');
            this.logger.error('The project may not be properly configured.');
        }
    }

    /**
     * Print generation summary
     */
    printSummary(summary) {
        console.log('📊 Generation Summary:');
        console.log('────────────────────');
        console.log(`Total files generated: ${summary.summary.filesGenerated}`);
        console.log(`Total files modified: ${summary.summary.filesModified}`);
        console.log(`Total files skipped: ${summary.summary.filesSkipped}`);

        if (this.state.failedGenerators.length > 0) {
            console.log(`\n⚠️  Failed generators: ${this.state.failedGenerators.length}`);
            for (const failure of this.state.failedGenerators) {
                console.log(`  • ${failure.name}: ${failure.error}`);
            }
        }

        console.log('\n✨ Configured features:');
        for (const config of this.state.generatedConfigs) {
            console.log(`  • ${config.generator}`);
        }

        console.log('\n🚀 Next steps:');
        const nextSteps = this.generateNextSteps(this.state);
        nextSteps.forEach(step => console.log(`  ${step}`));
    }

    /**
     * Get generation results with enhanced details
     */
    getResults() {
        const baseResults = super.getResults();

        return {
            ...baseResults,
            configurations: {
                generated: this.state.generatedConfigs,
                failed: this.state.failedGenerators,
                warnings: this.state.warnings
            },
            features: this.config.features,
            deployment: this.config.deployment
        };
    }

    /**
     * Clean up resources
     */
    async cleanup() {
        await super.cleanup();

        // Clean up event listeners
        for (const cleanupFn of this._cleanupFunctions) {
            try {
                cleanupFn();
            } catch (error) {
                this.logger.warn('Error during cleanup:', error);
            }
        }

        this._cleanupFunctions = [];
    }
}

module.exports = ConfigFileGenerator;
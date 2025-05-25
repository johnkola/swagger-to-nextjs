/**
 * ===AI PROMPT ==============================================================
 * FILE: config/defaults.js
 * VERSION: 2025-05-25 13:22:11
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 * Create a default configuration module that exports default settings for the
 * Swagger-to-NextJS generator. Include default output paths, template
 * preferences, code generation options, file naming conventions, and
 * generator behavior settings that can be overridden by user configuration.
 *
 * ---
 *
 * ===PROMPT END ==============================================================
 */
/**
/**


const path = require('path');

// Base paths configuration
const PATHS = {
    // Output directories (relative to app root)
    defaultOutputDir: './generated',
    defaultApiDir: './generated/app/api',
    defaultPagesDir: './generated/app',
    defaultComponentsDir: './generated/components',
    defaultTypesDir: './generated/types',
    defaultLibDir: './generated/lib',

    // Template directories (relative to script root)
    defaultTemplatesDir: './src/templates/files',
    partialsDir: './src/templates/files/partials',

    // API client configuration
    defaultApiClientPath: './generated/lib/api-client',
    defaultFetchLogicPath: './generated/lib/fetch-logic',

    // Configuration files
    configFileName: 'openapi-config.yaml',
    packageJsonPath: './package.json',
    tsConfigPath: './tsconfig.json',
    nextConfigPath: './next.config.js',
};

// File generation settings
const GENERATION = {
    // What to generate
    generateApiRoutes: true,
    generatePageComponents: true,
    generateTypeDefinitions: true,
    generateClientLibrary: true,
    generateValidationSchemas: true,
    generateTestFiles: false,
    generateDocumentation: true,
    generateMockData: false,

    // Generation modes
    overwriteExisting: false,
    preserveCustomCode: true,
    createBackups: true,

    // File naming conventions
    fileNaming: {
        apiRoutes: 'kebab-case',     // user-profile/route.ts
        pageComponents: 'kebab-case', // user-profile/page.tsx
        typeFiles: 'pascal-case',    // UserProfile.types.ts
        hookFiles: 'camel-case',     // useUserProfile.ts
    },

    // Code style preferences
    codeStyle: {
        indentation: 2,
        quotes: 'single',
        semicolons: true,
        trailingCommas: true,
        bracketSpacing: true,
        arrowParens: 'avoid',
    },
};

// Template engine configuration
const TEMPLATE_ENGINE = {
    // Handlebars syntax
    variableSyntax: '{{}}',
    conditionalSyntax: '{{#if}}...{{/if}}',
    loopSyntax: '{{#each}}...{{/each}}',
    partialSyntax: '{{> partial}}',

    // Helper functions
    enableBuiltInHelpers: true,
    customHelpersDir: './src/templates/helpers',

    // Template caching
    enableTemplateCache: true,
    cacheDirectory: './tmp/template-cache',

    // Partial inclusion
    enablePartials: true,
    partialsDir: './src/templates/files/partials',
};

// API specification settings
const API_SPEC = {
    // Supported formats
    supportedFormats: ['json', 'yaml', 'yml'],

    // OpenAPI version support
    supportedVersions: ['3.0.0', '3.0.1', '3.0.2', '3.0.3', '3.1.0'],

    // Validation settings
    validateSpec: true,
    strictValidation: false,
    allowInvalidRefs: false,

    // URL/file handling
    fetchTimeout: 30000,
    maxRetries: 3,
    retryDelay: 1000,

    // Schema processing
    dereferenceSchemas: true,
    resolveExternalRefs: true,
    preserveOriginalRefs: false,
};

// Next.js specific settings
const NEXTJS = {
    // App Router vs Pages Router
    useAppRouter: true,

    // TypeScript configuration
    useTypeScript: true,
    strictMode: true,

    // API Routes configuration
    apiRoutes: {
        directory: 'app/api',
        fileExtension: '.ts',
        exportFormat: 'named', // 'named' or 'default'
        includeOptionsHandler: true,
        enableCORS: false,
    },

    // Page generation
    pages: {
        directory: 'app',
        fileExtension: '.tsx',
        generateLayout: true,
        generateLoading: true,
        generateError: true,
        generateNotFound: false,
    },

    // Component generation
    components: {
        directory: 'components',
        useClientDirective: true,
        generateStories: false,
        generateTests: false,
    },

    // Styling preferences
    styling: {
        framework: 'tailwind', // 'tailwind', 'styled-components', 'emotion', 'css-modules'
        uiLibrary: 'shadcn', // 'shadcn', 'chakra', 'mantine', 'mui', 'none'
        generateTheme: false,
    },
};

// Feature enablement
const FEATURES = {
    // Authentication
    authentication: {
        enabled: false,
        type: 'jwt', // 'jwt', 'session', 'oauth', 'api-key'
        provider: 'custom', // 'nextauth', 'auth0', 'clerk', 'custom'
        generateAuthHooks: true,
        generateAuthPages: false,
    },

    // Validation
    validation: {
        enabled: true,
        library: 'zod', // 'zod', 'yup', 'joi'
        generateSchemas: true,
        clientSideValidation: true,
        serverSideValidation: true,
    },

    // Database integration
    database: {
        enabled: false,
        type: 'prisma', // 'prisma', 'drizzle', 'mongoose', 'knex'
        generateModels: false,
        generateMigrations: false,
        generateSeeders: false,
    },

    // Caching
    caching: {
        enabled: false,
        provider: 'memory', // 'memory', 'redis', 'memcached'
        defaultTTL: 300, // 5 minutes
        generateCacheHooks: true,
    },

    // Error handling
    errorHandling: {
        enabled: true,
        generateErrorBoundaries: true,
        generateErrorPages: true,
        logErrors: true,
        sentry: false,
    },

    // Rate limiting
    rateLimiting: {
        enabled: false,
        provider: 'memory', // 'memory', 'redis', 'upstash'
        defaultLimit: 100,
        windowMs: 900000, // 15 minutes
    },

    // File uploads
    fileUpload: {
        enabled: false,
        provider: 'local', // 'local', 's3', 'cloudinary', 'uploadthing'
        maxFileSize: '10mb',
        allowedTypes: ['image/*', 'application/pdf'],
    },

    // Real-time features
    realtime: {
        enabled: false,
        provider: 'socket.io', // 'socket.io', 'pusher', 'supabase'
        generateHooks: true,
    },

    // Internationalization
    i18n: {
        enabled: false,
        defaultLocale: 'en',
        locales: ['en'],
        generateTranslations: false,
    },

    // Testing
    testing: {
        enabled: false,
        framework: 'jest', // 'jest', 'vitest'
        generateUnitTests: false,
        generateIntegrationTests: false,
        generateE2ETests: false,
    },

    // Documentation
    documentation: {
        enabled: true,
        generateReadme: true,
        generateApiDocs: true,
        generateTypeDocs: false,
        includeExamples: true,
    },

    // Development tools
    development: {
        generateMockData: false,
        generateStorybook: false,
        hotReload: true,
        sourceMap: true,
    },
};

// External integrations
const INTEGRATIONS = {
    // Package manager
    packageManager: 'npm', // 'npm', 'yarn', 'pnpm'

    // Code formatting
    prettier: {
        enabled: true,
        configFile: '.prettierrc',
        generateConfig: false,
    },

    // Linting
    eslint: {
        enabled: true,
        configFile: '.eslintrc.json',
        generateConfig: false,
    },

    // Git integration
    git: {
        enabled: true,
        generateGitignore: false,
        commitGenerated: false,
    },

    // CI/CD
    cicd: {
        enabled: false,
        provider: 'github-actions', // 'github-actions', 'gitlab-ci', 'circleci'
        generateWorkflows: false,
    },

    // Deployment
    deployment: {
        provider: 'vercel', // 'vercel', 'netlify', 'railway', 'docker'
        generateConfig: false,
    },
};

// Advanced configuration
const ADVANCED = {
    // Performance optimization
    performance: {
        enableTreeShaking: true,
        enableCodeSplitting: true,
        generateWebWorkers: false,
        optimizeImages: false,
    },

    // Security
    security: {
        enableCSRF: false,
        enableXSS: true,
        enableContentSecurityPolicy: false,
        sanitizeInputs: true,
    },

    // Monitoring
    monitoring: {
        enabled: false,
        provider: 'none', // 'sentry', 'datadog', 'newrelic'
        generateHealthChecks: false,
        generateMetrics: false,
    },

    // Logging
    logging: {
        enabled: true,
        level: 'info', // 'debug', 'info', 'warn', 'error'
        provider: 'console', // 'console', 'winston', 'pino'
        logToFile: false,
    },

    // Custom transformations
    transformations: {
        operationIdTransform: 'camelCase', // 'camelCase', 'pascalCase', 'kebabCase'
        propertyNameTransform: 'camelCase',
        fileNameTransform: 'kebabCase',
        componentNameTransform: 'pascalCase',
    },

    // Plugin system
    plugins: {
        enabled: false,
        directory: './plugins',
        autoLoad: true,
    },
};

// Default dependencies to add to generated projects
const DEPENDENCIES = {
    // Core Next.js dependencies
    required: [
        'next',
        'react',
        'react-dom',
    ],

    // TypeScript dependencies
    typescript: [
        'typescript',
        '@types/react',
        '@types/react-dom',
        '@types/node',
    ],

    // Validation dependencies
    validation: {
        zod: ['zod'],
        yup: ['yup'],
        joi: ['joi'],
    },

    // Authentication dependencies
    auth: {
        nextauth: ['next-auth'],
        clerk: ['@clerk/nextjs'],
        auth0: ['@auth0/nextjs-auth0'],
    },

    // Database dependencies
    database: {
        prisma: ['prisma', '@prisma/client'],
        drizzle: ['drizzle-orm', 'drizzle-kit'],
        mongoose: ['mongoose'],
    },

    // UI framework dependencies
    ui: {
        tailwind: ['tailwindcss', 'autoprefixer', 'postcss'],
        shadcn: ['@radix-ui/react-slot', 'class-variance-authority', 'clsx', 'tailwind-merge'],
        chakra: ['@chakra-ui/react', '@emotion/react', '@emotion/styled'],
        mantine: ['@mantine/core', '@mantine/hooks'],
    },

    // Development dependencies
    development: [
        'eslint',
        'eslint-config-next',
        'prettier',
    ],
};

// Environment-specific overrides
const ENVIRONMENT_OVERRIDES = {
    development: {
        generation: {
            generateMockData: true,
            createBackups: false,
        },
        features: {
            errorHandling: {
                logErrors: true,
            },
        },
        advanced: {
            logging: {
                level: 'debug',
            },
        },
    },

    production: {
        generation: {
            generateMockData: false,
            createBackups: true,
        },
        advanced: {
            logging: {
                level: 'warn',
            },
            performance: {
                enableTreeShaking: true,
                enableCodeSplitting: true,
            },
        },
    },

    testing: {
        features: {
            testing: {
                enabled: true,
                generateUnitTests: true,
            },
        },
    },
};

// Export the complete configuration
module.exports = {
    PATHS,
    GENERATION,
    TEMPLATE_ENGINE,
    API_SPEC,
    NEXTJS,
    FEATURES,
    INTEGRATIONS,
    ADVANCED,
    DEPENDENCIES,
    ENVIRONMENT_OVERRIDES,

    // Helper function to get merged configuration
    getConfig: function (environment = 'development', customConfig = {}) {
        const baseConfig = {
            paths: {...PATHS},
            generation: {...GENERATION},
            templateEngine: {...TEMPLATE_ENGINE},
            apiSpec: {...API_SPEC},
            nextjs: {...NEXTJS},
            features: {...FEATURES},
            integrations: {...INTEGRATIONS},
            advanced: {...ADVANCED},
            dependencies: {...DEPENDENCIES},
        };

        // Apply environment-specific overrides
        if (ENVIRONMENT_OVERRIDES[environment]) {
            const envOverrides = ENVIRONMENT_OVERRIDES[environment];
            Object.keys(envOverrides).forEach(section => {
                if (baseConfig[section]) {
                    // Deep merge for nested objects
                    baseConfig[section] = this.deepMerge(baseConfig[section], envOverrides[section]);
                }
            });
        }

        // Apply custom configuration
        Object.keys(customConfig).forEach(section => {
            if (baseConfig[section]) {
                // Deep merge for nested objects
                baseConfig[section] = this.deepMerge(baseConfig[section], customConfig[section]);
            }
        });

        return baseConfig;
    },

    // Helper for deep merging objects
    deepMerge: function (target, source) {
        const result = {...target};

        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }

        return result;
    },

    // Helper to validate configuration
    validateConfig: function (config) {
        const errors = [];
        const warnings = [];

        // Validate required paths
        if (!config.paths?.defaultOutputDir) {
            errors.push('paths.defaultOutputDir is required');
        }

        // Validate Next.js settings consistency
        if (config.nextjs?.useAppRouter && config.nextjs?.apiRoutes?.directory === 'pages/api') {
            errors.push('App Router cannot use pages/api directory - use app/api instead');
        }

        // Validate TypeScript consistency
        if (config.nextjs?.useTypeScript && !config.generation?.generateTypeDefinitions) {
            warnings.push('TypeScript is enabled but type generation is disabled');
        }

        // Validate feature dependencies
        if (config.features?.authentication?.enabled && !config.features?.validation?.enabled) {
            warnings.push('Authentication is enabled but validation is disabled - this may cause security issues');
        }

        // Validate styling framework consistency
        if (config.nextjs?.styling?.uiLibrary === 'shadcn' && config.nextjs?.styling?.framework !== 'tailwind') {
            errors.push('shadcn/ui requires Tailwind CSS framework');
        }

        // Log warnings
        if (warnings.length > 0) {
            console.warn('⚠️  Configuration warnings:');
            warnings.forEach(warning => console.warn(`   ${warning}`));
        }

        // Throw errors
        if (errors.length > 0) {
            throw new Error(`❌ Configuration validation failed:\n${errors.map(err => `   ${err}`).join('\n')}`);
        }

        return true;
    },

    // Helper to get default file paths
    getDefaultPaths: function (outputDir = PATHS.defaultOutputDir) {
        return {
            output: path.resolve(outputDir),
            api: path.resolve(outputDir, 'app/api'),
            pages: path.resolve(outputDir, 'app'),
            components: path.resolve(outputDir, 'components'),
            types: path.resolve(outputDir, 'types'),
            lib: path.resolve(outputDir, 'lib'),
            utils: path.resolve(outputDir, 'utils'),
            hooks: path.resolve(outputDir, 'hooks'),
            schemas: path.resolve(outputDir, 'schemas'),
            mocks: path.resolve(outputDir, 'mocks'),
            tests: path.resolve(outputDir, '__tests__'),
        };
    },

    // Helper to determine what should be generated
    getGenerationPlan: function (config) {
        const plan = {
            apiRoutes: [],
            pages: [],
            components: [],
            types: [],
            hooks: [],
            schemas: [],
            tests: [],
            docs: [],
        };

        if (config.generation?.generateApiRoutes) {
            plan.apiRoutes.push('route handlers');
        }

        if (config.generation?.generatePageComponents) {
            plan.pages.push('page components');
        }

        if (config.generation?.generateTypeDefinitions) {
            plan.types.push('TypeScript definitions');
        }

        if (config.generation?.generateClientLibrary) {
            plan.hooks.push('API hooks');
        }

        if (config.generation?.generateValidationSchemas) {
            plan.schemas.push('validation schemas');
        }

        if (config.features?.testing?.enabled) {
            plan.tests.push('test files');
        }

        if (config.features?.documentation?.enabled) {
            plan.docs.push('documentation');
        }

        return plan;
    },
};
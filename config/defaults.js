/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - AI PROMPT
 * ============================================================================
 * FILE: config/defaults.js
 * VERSION: 2025-05-28 15:14:56
 * PHASE: PHASE 1: Foundation Components
 * CATEGORY: 🎯 Main Entry Points
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 *
 * Create a comprehensive default configuration module that exports:
 * - Output directory settings with intelligent defaults
 * - Template engine preferences and options
 * - Code generation settings (TypeScript strictness, formatting rules)
 * - File naming conventions (kebab-case, camelCase options)
 * - API client configuration (fetch, axios preferences)
 * - Authentication handling defaults
 * - Component generation preferences (UI library, styling approach)
 * - Build tool configuration (webpack, vite compatibility)
 * - Environment-specific overrides
 * - Feature flags for experimental functionality
 *
 * ============================================================================
 */

const path = require('path');
const os = require('os');

/**
 * Default configuration for Swagger to Next.js generator
 */
const defaults = {
    // ============================================================================
    // Output Directory Settings
    // ============================================================================
    output: {
        baseDir: './generated',
        structure: {
            api: 'api',
            components: 'components',
            hooks: 'hooks',
            types: 'types',
            utils: 'utils',
            services: 'services',
            schemas: 'schemas',
            tests: '__tests__'
        },
        // Clean output directory before generation
        clean: false,
        // Create backup of existing files
        backup: true,
        backupDir: '.backup',
        // Overwrite existing files
        overwrite: true,
        // File permissions
        fileMode: '644',
        directoryMode: '755'
    },

    // ============================================================================
    // Template Engine Configuration
    // ============================================================================
    templates: {
        engine: 'handlebars', // handlebars, ejs, pug, nunjucks
        customTemplatesDir: null,
        helpers: {
            // Built-in helpers
            enabled: true,
            // Custom helpers directory
            customHelpersDir: null
        },
        partials: {
            enabled: true,
            customPartialsDir: null
        },
        // Template file extensions
        extensions: {
            handlebars: '.hbs',
            ejs: '.ejs',
            pug: '.pug',
            nunjucks: '.njk'
        },
        // Template caching
        cache: {
            enabled: true,
            ttl: 3600000 // 1 hour
        }
    },

    // ============================================================================
    // Code Generation Settings
    // ============================================================================
    generation: {
        // TypeScript configuration
        typescript: {
            enabled: true,
            strict: true,
            strictNullChecks: true,
            noImplicitAny: true,
            esModuleInterop: true,
            skipLibCheck: true,
            // Target ES version
            target: 'ES2020',
            // Module system
            module: 'ESNext',
            // Generate .d.ts files
            declaration: true,
            // Use type imports
            useTypeImports: true
        },

        // Formatting rules
        formatting: {
            // Prettier configuration
            prettier: {
                enabled: true,
                semi: true,
                singleQuote: true,
                tabWidth: 2,
                trailingComma: 'es5',
                bracketSpacing: true,
                arrowParens: 'always',
                printWidth: 100,
                endOfLine: 'lf'
            },
            // ESLint configuration
            eslint: {
                enabled: true,
                extends: ['next/core-web-vitals', 'plugin:@typescript-eslint/recommended'],
                autoFix: true
            },
            // Indentation
            indentStyle: 'space',
            indentSize: 2,
            // Line endings
            lineEndings: 'lf',
            // Insert final newline
            insertFinalNewline: true,
            // Trim trailing whitespace
            trimTrailingWhitespace: true
        },

        // Code style preferences
        style: {
            // Use async/await over promises
            preferAsync: true,
            // Use const over let when possible
            preferConst: true,
            // Use template literals
            preferTemplateLiterals: true,
            // Use object shorthand
            preferObjectShorthand: true,
            // Use arrow functions
            preferArrowFunctions: true,
            // Use optional chaining
            useOptionalChaining: true,
            // Use nullish coalescing
            useNullishCoalescing: true
        }
    },

    // ============================================================================
    // File Naming Conventions
    // ============================================================================
    naming: {
        // File naming style
        fileNaming: 'kebab-case', // kebab-case, camelCase, PascalCase, snake_case
        // Component naming style
        componentNaming: 'PascalCase',
        // Hook naming style
        hookNaming: 'camelCase',
        // Type/Interface naming style
        typeNaming: 'PascalCase',
        // Constant naming style
        constantNaming: 'SCREAMING_SNAKE_CASE',
        // Function naming style
        functionNaming: 'camelCase',
        // Variable naming style
        variableNaming: 'camelCase',
        // Add file type suffix (e.g., .component.tsx, .service.ts)
        addTypeSuffix: true,
        // Custom suffixes
        suffixes: {
            component: '.component',
            service: '.service',
            hook: '.hook',
            util: '.util',
            type: '.type',
            schema: '.schema',
            test: '.test',
            spec: '.spec'
        }
    },

    // ============================================================================
    // API Client Configuration
    // ============================================================================
    apiClient: {
        // HTTP client library
        type: 'fetch', // fetch, axios, ky, got
        // Base configuration
        baseURL: process.env.NEXT_PUBLIC_API_URL || '',
        timeout: 30000, // 30 seconds

        // Fetch-specific options
        fetch: {
            // Use native fetch or polyfill
            useNative: true,
            // Default fetch options
            defaultOptions: {
                mode: 'cors',
                credentials: 'same-origin',
                cache: 'no-cache',
                redirect: 'follow'
            }
        },

        // Axios-specific options
        axios: {
            // Axios instance configuration
            withCredentials: false,
            responseType: 'json',
            maxRedirects: 5,
            // Retry configuration
            retry: {
                enabled: true,
                retries: 3,
                retryDelay: 1000,
                retryCondition: null
            }
        },

        // Request interceptors
        interceptors: {
            request: {
                enabled: true,
                // Add auth token
                addAuthToken: true,
                // Add request ID
                addRequestId: true,
                // Add timestamp
                addTimestamp: true
            },
            response: {
                enabled: true,
                // Handle errors globally
                handleErrors: true,
                // Transform response data
                transformData: true,
                // Log responses
                logging: false
            }
        },

        // Error handling
        errorHandling: {
            // Throw on HTTP errors
            throwHttpErrors: true,
            // Custom error class
            useCustomErrorClass: true,
            // Include request info in errors
            includeRequestInfo: true,
            // Include response info in errors
            includeResponseInfo: true
        }
    },

    // ============================================================================
    // Authentication Configuration
    // ============================================================================
    authentication: {
        // Authentication type
        type: 'bearer', // bearer, basic, apiKey, oauth2, custom
        // Storage mechanism
        storage: 'localStorage', // localStorage, sessionStorage, cookie, memory
        // Token configuration
        token: {
            // Token key name
            key: 'authToken',
            // Token prefix
            prefix: 'Bearer',
            // Auto refresh
            autoRefresh: true,
            // Refresh threshold (ms before expiry)
            refreshThreshold: 300000 // 5 minutes
        },
        // API key configuration
        apiKey: {
            // Header name
            headerName: 'X-API-Key',
            // Query parameter name
            queryParamName: 'apiKey',
            // Location
            location: 'header' // header, query
        },
        // OAuth2 configuration
        oauth2: {
            // Grant type
            grantType: 'authorization_code',
            // Client ID key
            clientIdKey: 'NEXT_PUBLIC_OAUTH_CLIENT_ID',
            // Client secret key
            clientSecretKey: 'OAUTH_CLIENT_SECRET',
            // Redirect URI
            redirectUri: '/api/auth/callback',
            // Scopes
            defaultScopes: ['read', 'write']
        },
        // Session configuration
        session: {
            // Session duration (ms)
            duration: 86400000, // 24 hours
            // Sliding session
            sliding: true,
            // Session storage
            storage: 'cookie'
        }
    },

    // ============================================================================
    // Component Generation Preferences
    // ============================================================================
    components: {
        // UI library
        uiLibrary: 'none', // none, mui, antd, chakra, tailwind, bootstrap
        // Styling approach
        styling: 'css-modules', // css-modules, styled-components, emotion, sass, tailwind, css-in-js
        // Component structure
        structure: 'flat', // flat, nested, atomic
        // Generate tests
        generateTests: true,
        // Test framework
        testFramework: 'jest', // jest, vitest, testing-library
        // Generate stories
        generateStories: false,
        // Storybook version
        storybookVersion: 7,
        // Props validation
        propsValidation: 'typescript', // typescript, prop-types, both, none
        // Default exports
        useDefaultExports: false,
        // Memo by default
        useMemo: true,
        // Forward refs
        useForwardRef: false,
        // Error boundaries
        generateErrorBoundaries: true,
        // Loading states
        generateLoadingStates: true,
        // Empty states
        generateEmptyStates: true
    },

    // ============================================================================
    // Build Tool Configuration
    // ============================================================================
    build: {
        // Build tool
        tool: 'next', // next, vite, webpack, turbopack
        // Next.js specific
        next: {
            // App directory
            appDirectory: true,
            // Server components
            serverComponents: true,
            // Static export
            staticExport: false,
            // Image optimization
            imageOptimization: true,
            // Font optimization
            fontOptimization: true
        },
        // Vite specific
        vite: {
            // Use SWC
            useSWC: true,
            // Legacy browser support
            legacySupport: false,
            // Build target
            target: 'es2020'
        },
        // Bundle optimization
        optimization: {
            // Minify
            minify: true,
            // Tree shaking
            treeShaking: true,
            // Code splitting
            codeSplitting: true,
            // Lazy loading
            lazyLoading: true,
            // Preloading
            preloading: true,
            // Source maps
            sourceMaps: true
        },
        // Asset handling
        assets: {
            // Public path
            publicPath: '/',
            // Asset limit (bytes)
            inlineLimit: 4096,
            // Image formats
            imageFormats: ['webp', 'avif', 'jpeg', 'png'],
            // Font formats
            fontFormats: ['woff2', 'woff']
        }
    },

    // ============================================================================
    // Environment-Specific Overrides
    // ============================================================================
    environments: {
        development: {
            output: {
                clean: false
            },
            build: {
                optimization: {
                    minify: false,
                    sourceMaps: true
                }
            },
            apiClient: {
                interceptors: {
                    response: {
                        logging: true
                    }
                }
            }
        },
        production: {
            output: {
                clean: true
            },
            build: {
                optimization: {
                    minify: true,
                    sourceMaps: false
                }
            },
            apiClient: {
                interceptors: {
                    response: {
                        logging: false
                    }
                }
            }
        },
        test: {
            output: {
                baseDir: './test-generated'
            },
            apiClient: {
                baseURL: 'http://localhost:3000'
            }
        }
    },

    // ============================================================================
    // Feature Flags
    // ============================================================================
    features: {
        // Experimental features
        experimental: {
            // Use React Server Components
            serverComponents: false,
            // Use streaming SSR
            streamingSSR: false,
            // Use concurrent features
            concurrentFeatures: false,
            // Use new transform
            newTransform: false,
            // Turbopack
            turbopack: false
        },

        // Advanced features
        advanced: {
            // Generate GraphQL client
            graphqlClient: false,
            // Generate WebSocket client
            websocketClient: false,
            // Generate mock server
            mockServer: true,
            // Generate API documentation
            apiDocumentation: true,
            // Generate postman collection
            postmanCollection: false,
            // Generate insomnia collection
            insomniaCollection: false
        },

        // Security features
        security: {
            // Content Security Policy
            csp: true,
            // CORS handling
            cors: true,
            // Rate limiting
            rateLimiting: true,
            // Request validation
            requestValidation: true,
            // Response validation
            responseValidation: true
        },

        // Performance features
        performance: {
            // Request caching
            caching: true,
            // Request deduplication
            deduplication: true,
            // Batch requests
            batching: false,
            // Prefetching
            prefetching: true,
            // Background sync
            backgroundSync: false
        },

        // Developer experience
        dx: {
            // Hot reload
            hotReload: true,
            // Fast refresh
            fastRefresh: true,
            // Type checking
            typeChecking: true,
            // Linting
            linting: true,
            // Auto-completion
            autoCompletion: true,
            // Inline documentation
            inlineDocumentation: true
        }
    },

    // ============================================================================
    // Metadata
    // ============================================================================
    metadata: {
        // Generator version
        version: '1.0.0',
        // Generation timestamp
        timestamp: new Date().toISOString(),
        // Generator name
        generator: 'swagger-to-nextjs',
        // Source tracking
        trackSource: true,
        // Include metadata in generated files
        includeInFiles: true,
        // Metadata format
        format: 'jsdoc' // jsdoc, json, yaml
    },

    // ============================================================================
    // Logging Configuration
    // ============================================================================
    logging: {
        // Log level
        level: 'info', // error, warn, info, debug, trace
        // Console output
        console: true,
        // File output
        file: false,
        // Log file path
        filePath: path.join(os.tmpdir(), 'swagger-to-nextjs.log'),
        // Pretty print
        prettyPrint: true,
        // Include timestamp
        timestamp: true,
        // Include level
        includeLevel: true,
        // Max file size (bytes)
        maxFileSize: 10485760, // 10MB
        // Max files
        maxFiles: 5
    },

    // ============================================================================
    // Cache Configuration
    // ============================================================================
    cache: {
        // Enable caching
        enabled: true,
        // Cache directory
        directory: path.join(os.tmpdir(), '.swagger-to-nextjs-cache'),
        // TTL for cached items (ms)
        ttl: 86400000, // 24 hours
        // Max cache size (bytes)
        maxSize: 52428800, // 50MB
        // Compression
        compression: true,
        // Cache strategy
        strategy: 'lru' // lru, lfu, fifo
    },

    // ============================================================================
    // Plugin System
    // ============================================================================
    plugins: {
        // Enable plugin system
        enabled: true,
        // Plugin directories
        directories: ['./plugins', './node_modules'],
        // Auto-load plugins
        autoLoad: true,
        // Plugin prefix
        prefix: 'swagger-to-nextjs-plugin-',
        // Disabled plugins
        disabled: [],
        // Plugin configuration
        config: {}
    }
};

/**
 * Get default configuration with environment overrides
 * @param {string} environment - Environment name
 * @returns {object} Configuration object
 */
function getDefaults(environment = process.env.NODE_ENV || 'development') {
    const envConfig = defaults.environments[environment] || {};
    return mergeDeep(defaults, envConfig);
}

/**
 * Deep merge utility
 * @param {object} target - Target object
 * @param {object} source - Source object
 * @returns {object} Merged object
 */
function mergeDeep(target, source) {
    const output = { ...target };

    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target)) {
                    Object.assign(output, { [key]: source[key] });
                } else {
                    output[key] = mergeDeep(target[key], source[key]);
                }
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    }

    return output;
}

/**
 * Check if value is an object
 * @param {*} item - Value to check
 * @returns {boolean} True if object
 */
function isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Validate configuration
 * @param {object} config - Configuration to validate
 * @returns {object} Validation result
 */
function validateConfig(config) {
    const errors = [];
    const warnings = [];

    // Validate output directory
    if (!config.output?.baseDir) {
        errors.push('output.baseDir is required');
    }

    // Validate template engine
    const validEngines = ['handlebars', 'ejs', 'pug', 'nunjucks'];
    if (!validEngines.includes(config.templates?.engine)) {
        errors.push(`templates.engine must be one of: ${validEngines.join(', ')}`);
    }

    // Validate file naming
    const validNaming = ['kebab-case', 'camelCase', 'PascalCase', 'snake_case'];
    if (!validNaming.includes(config.naming?.fileNaming)) {
        warnings.push(`naming.fileNaming should be one of: ${validNaming.join(', ')}`);
    }

    // Validate API client type
    const validClients = ['fetch', 'axios', 'ky', 'got'];
    if (!validClients.includes(config.apiClient?.type)) {
        errors.push(`apiClient.type must be one of: ${validClients.join(', ')}`);
    }

    // Validate build tool
    const validTools = ['next', 'vite', 'webpack', 'turbopack'];
    if (!validTools.includes(config.build?.tool)) {
        warnings.push(`build.tool should be one of: ${validTools.join(', ')}`);
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

// Export configuration
module.exports = {
    defaults,
    getDefaults,
    mergeDeep,
    validateConfig
};
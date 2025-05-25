/**
 * ===AI PROMPT ==============================================================
 * FILE: src/index.js
 * VERSION: 2025-05-25 13:22:11
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 * Build the main orchestrator class for Swagger-to-NextJS generator. Should
 * coordinate SwaggerLoader, DirectoryManager, and various code generators
 * (API routes, pages, configs). Include proper error handling and progress
 * logging.
 *
 * ---
 *
 * ===PROMPT END ==============================================================
 */
/**
/**
/**

/**
 * FILE: src/index.js
 *
 * AI PROMPT FOR CODE REVIEW/ENHANCEMENT:
 * =====================================
 *
 * You are reviewing the main orchestrator class for a Swagger-to-NextJS code generator.
 * This file coordinates the entire generation process from OpenAPI specification to a complete Next.js application.
 *
 * RESPONSIBILITIES:
 * - Load and validate Swagger/OpenAPI specifications from files or URLs
 * - Coordinate directory structure creation
 * - Orchestrate API route generation from OpenAPI paths
 * - Manage React page component generation for endpoints
 * - Generate configuration files (layout, CSS, TypeScript config, etc.)
 * - Provide comprehensive error handling and user feedback
 * - Generate detailed summary reports of the generation process
 *
 * ARCHITECTURE PATTERNS:
 * - Uses composition over inheritance with specialized generator classes
 * - Implements dependency injection for testability
 * - Follows single responsibility principle with clear separation of concerns
 * - Provides comprehensive logging and progress feedback
 *
 * REVIEW FOCUS:
 * - Error handling completeness and user-friendly messaging
 * - Path resolution accuracy for different deployment scenarios
 * - Memory management for large OpenAPI specifications
 * - Performance optimization opportunities
 * - Code maintainability and extensibility
 */

const path = require('path');
const SwaggerLoader = require('./core/SwaggerLoader');
const SwaggerValidator = require('./core/SwaggerValidator');
const DirectoryManager = require('./core/DirectoryManager');
const ApiRouteGenerator = require('./generators/ApiRouteGenerator');
const PageComponentGenerator = require('./generators/PageComponentGenerator');
const ConfigFileGenerator = require('./generators/ConfigFileGenerator');

class SwaggerToNextJSGenerator {
    constructor(swaggerSource, outputDir = './generated', apiClientPath = null) {
        // Resolve paths relative to current working directory
        this.swaggerSource = swaggerSource;
        this.outputDir = path.resolve(process.cwd(), outputDir);
        this.apiClientPath = apiClientPath || path.join(this.outputDir, 'lib/api-client');

        // Initialize components
        this.loader = new SwaggerLoader(swaggerSource);
        this.validator = new SwaggerValidator();
        this.dirManager = new DirectoryManager(this.outputDir, this.apiClientPath);
        this.apiGenerator = new ApiRouteGenerator();
        this.pageGenerator = new PageComponentGenerator();
        this.configGenerator = new ConfigFileGenerator();

        // State
        this.swaggerDoc = null;
    }

    /**
     * Main execution method - orchestrates the entire generation process
     */
    async run() {
        console.log('🚀 Starting Swagger to Next.js generation...\n');

        try {
            // Step 1: Load and validate Swagger document
            console.log('📋 Loading Swagger specification...');
            this.swaggerDoc = await this.loader.load();
            this.validator.validate(this.swaggerDoc);

            // Step 2: Create directory structure
            console.log('📁 Creating directory structure...');
            this.dirManager.createDirectories();

            // Step 3: Generate API routes
            console.log('🔧 Generating API routes...');
            const apiStats = await this.apiGenerator.generateRoutes(this.swaggerDoc, this.dirManager);

            // Step 4: Generate page components
            console.log('⚛️  Generating page components...');
            const pageStats = await this.pageGenerator.generatePages(this.swaggerDoc, this.dirManager);

            // Step 5: Generate configuration files
            console.log('📝 Generating configuration files...');
            const configStats = await this.configGenerator.generateConfigs(this.swaggerDoc, this.dirManager);

            // Step 6: Summary
            this.printSummary(apiStats, pageStats, configStats);

        } catch (error) {
            console.error('❌ Generation failed:', error.message);
            if (process.env.DEBUG) {
                console.error(error.stack);
            }
            throw error; // Re-throw for CLI handling
        }
    }

    /**
     * Print generation summary
     */
    printSummary(apiStats, pageStats, configStats) {
        console.log('\n🎉 Generation completed successfully!\n');

        console.log('📊 Generation Summary:');
        console.log(`├── API Routes: ${apiStats.generated} generated, ${apiStats.failed} failed`);
        console.log(`├── Page Components: ${pageStats.generated} generated, ${pageStats.failed} failed`);
        console.log(`└── Config Files: ${configStats.generated} generated`);

        console.log(`\n📂 Output Directory: ${this.outputDir}`);
        console.log(`🔗 API Client Path: ${this.apiClientPath}`);

        console.log('\n📋 Next steps:');
        console.log('1. Install dependencies (see DEPENDENCIES.md)');
        console.log('2. Generate API client (if not done): npx @openapitools/openapi-generator-cli generate -c openapi-config.yaml');
        console.log('3. Review and customize the generated route files');
        console.log('4. Update the API client method calls in the route handlers');
        console.log('5. Configure environment variables (API_BASE_URL, etc.)');
        console.log('6. Test your API routes!');
        console.log('\n💡 Tip: The generated routes are ready to use your OpenAPI-generated types and client!');
    }

    /**
     * Get generation statistics
     */
    getStats() {
        return {
            swaggerDoc: this.swaggerDoc,
            outputDir: this.outputDir,
            apiClientPath: this.apiClientPath,
            hasSwaggerDoc: !!this.swaggerDoc
        };
    }

    /**
     * Validate configuration before generation
     */
    validateConfiguration() {
        const issues = [];

        if (!this.swaggerSource) {
            issues.push('Swagger source is required');
        }

        if (!this.outputDir) {
            issues.push('Output directory is required');
        }

        return {
            isValid: issues.length === 0,
            issues
        };
    }

    /**
     * Clean up generated files (for testing/debugging)
     */
    async cleanup() {
        try {
            if (this.dirManager && typeof this.dirManager.cleanup === 'function') {
                await this.dirManager.cleanup();
                console.log('🧹 Cleaned up generated files');
            }
        } catch (error) {
            console.warn('⚠️  Failed to cleanup:', error.message);
        }
    }

    /**
     * Get version information
     */
    static getVersion() {
        try {
            const packageJson = require('../package.json');
            return packageJson.version || '1.0.0';
        } catch (error) {
            return '1.0.0';
        }
    }

    /**
     * Get help information
     */
    static getHelp() {
        return [
            'Swagger to Next.js Generator v' + this.getVersion(),
            '',
            'Usage:',
            '  node src/index.js <swagger-source> [options]',
            '',
            'Examples:',
            '  node src/index.js ./api-spec.yaml',
            '  node src/index.js http://localhost:8090/v3/api-docs',
            '  node src/index.js openapi-config.yaml --output ./my-app',
            '',
            'Options:',
            '  --output <dir>     Output directory (default: ./generated)',
            '  --client <path>    API client path',
            '  --debug           Enable debug logging',
            '',
            'For more information, visit: https://github.com/yourusername/swagger-to-nextjs'
        ].join('\n');
    }
}

// If this file is run directly, start the CLI
if (require.main === module) {
    require('./cli');
}

module.exports = SwaggerToNextJSGenerator;
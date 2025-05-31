/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - CONFIGURATION FILE GENERATOR
 * ============================================================================
 * FILE: src/generators/ConfigFileGenerator.js
 * VERSION: 2025-05-30 11:34:23
 * PHASE: PHASE 3: Code Generation Engine
 * CATEGORY: 📄 Configuration Generators
 * ============================================================================
 *
 * PURPOSE:
 * Central orchestrator for all configuration file generations.
 * Properly extends
 * BaseGenerator to use the template method pattern and lifecycle hooks.
 *
 * ============================================================================
 */

const path = require('path');
const BaseGenerator = require('./BaseGenerator');
const GeneratorError = require('../errors/GeneratorError');

// Import all configuration generators
const NextConfigGenerator = require('./config/NextConfigGenerator');
const TypeScriptConfigGenerator = require('./config/TypeScriptConfigGenerator');
const PackageConfigGenerator = require('./config/PackageConfigGenerator').PackageConfigGenerator;
const LintingConfigGenerator = require('./config/LintingConfigGenerator');
const EnvironmentConfigGenerator = require('./config/EnvironmentConfigGenerator');
const DockerConfigGenerator = require('./config/DockerConfigGenerator').default;
const DeploymentConfigGenerator = require('./config/DeploymentConfigGenerator').default;
const CICDConfigGenerator = require('./config/CICDConfigGenerator').default;
const EditorConfigGenerator = require('./config/EditorConfigGenerator');
const DocumentationGenerator = require('./config/DocumentationGenerator');
const ConfigHelpers = require('./config/ConfigHelpers').default;

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

        // Initialize helpers
        this.helpers = new ConfigHelpers();

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
    }

    /**
     * Initialize the generator and sub-generators
     */
    async initialize(context) {
        await super.initialize(context);

        this.logger.info('Initializing configuration generators...');

        // Register template helpers
        this.helpers.registerTemplateHelpers();

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
        const generators = [
            { name: 'package', Generator: PackageConfigGenerator, phase: 'core' },
            { name: 'typescript', Generator: TypeScriptConfigGenerator, phase: 'core' },
            { name: 'next', Generator: NextConfigGenerator, phase: 'core' },
            { name: 'environment', Generator: EnvironmentConfigGenerator, phase: 'core' },
            { name: 'linting', Generator: LintingConfigGenerator, phase: 'development' },
            { name: 'editor', Generator: EditorConfigGenerator, phase: 'development' },
            { name: 'docker', Generator: DockerConfigGenerator, phase: 'deployment', optional: true },
            { name: 'deployment', Generator: DeploymentConfigGenerator, phase: 'deployment' },
            { name: 'cicd', Generator: CICDConfigGenerator, phase: 'deployment' },
            { name: 'documentation', Generator: DocumentationGenerator, phase: 'documentation' }
        ];

        for (const { name, Generator, phase, optional } of generators) {
            try {
                const instance = new Generator({
                    ...this.config,
                    logger: this.logger,
                    templateEngine: this.templateEngine,
                    directoryManager: this.directoryManager
                });

                this.subGenerators.set(name, instance);
                this.phases[phase].push(name);

                // Register sub-generator events
                if (instance.on) {
                    instance.on('error', (error) => {
                        this.logger.warn(`Sub-generator ${name} error:`, error);
                        if (!optional) {
                            this.state.failedGenerators.push({ name, error });
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

        // Build enhanced context
        const preparedContext = {
            ...context,
            projectName: this.helpers.extractProjectName(context),
            features: this.helpers.analyzeFeatures(context),
            envVariables: this.helpers.extractEnvVariables(context),
            buildConfig: this.helpers.prepareBuildConfig(context),
            securityConfig: this.helpers.prepareSecurityConfig(context),
            imageDomains: this.helpers.extractImageDomains(context),
            nodeVersion: this.helpers.getNodeVersion(context),
            packageJson: context.packageJson || {},
            // Maintain references to original config
            originalConfig: this.config,
            swagger: context.apiSpec || context.swagger
        };

        return preparedContext;
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

        // Handle different output formats
        if (Array.isArray(output)) {
            for (const item of output) {
                if (item.path && (item.content !== undefined || item.generated)) {
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
            if (output.path && output.content) {
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
        const criticalGenerators = ['package', 'typescript', 'next'];
        return criticalGenerators.includes(generatorName);
    }

    /**
     * Generate summary file
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

        if (context.features.database) {
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
        for (const [feature, enabled] of Object.entries(this.state.generatedConfigs)) {
            console.log(`  • ${feature}`);
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
}

module.exports = ConfigFileGenerator;
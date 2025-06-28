/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - AI PROMPT
 * ============================================================================
 * FILE: src/cli.js
 * VERSION: 2025-06-17 21:42:10
 * PHASE: Phase 1: Foundation & Core Infrastructure
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 *
 * Build a Commander.js CLI interface using ES Module syntax for a Next.js
 * code generator from OpenAPI specs with DaisyUI styling options. Import
 * Commander using ES Module syntax. The main command should be "generate
 * <spec> [output]" where spec is a path to an OpenAPI file and output is
 * the target directory. Include options for --typescript (default true),
 * --client (generate API client, default true), --pages (generate UI
 * components, default true), --force (overwrite without asking), --dry-run
 * (preview without writing), --theme <theme> (DaisyUI theme selection,
 * default "light"), --themes <themes...> (list of DaisyUI themes to
 * include, default ["light", "dark", "cupcake", "corporate"]), --no-daisyui
 * (generate without DaisyUI, use plain CSS), and --custom-theme <path>
 * (path to custom DaisyUI theme file). Import and use ora for progress
 * spinner and chalk for colored messages using ES Module imports. Display
 * colored success/error messages and provide helpful next steps after
 *  generation, including how to switch themes. Include proper version
 * handling by reading package.json using fs.readFileSync and JSON.parse,
 * and comprehensive help text. Export the CLI setup as the default export.
 *
 * ============================================================================
 */
/**
 * cli.js - Commander.js CLI interface for swagger-to-nextjs
 * Updated to include all DaisyUI theme options as specified in the prompt
 */
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'node:path';
import fs from 'node:fs/promises';
import yaml from 'js-yaml';
import { fileURLToPath } from 'node:url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default version if package.json is not found
let version = '1.0.0';
try {
    const packageJson = JSON.parse(
        await fs.readFile(new URL('../package.json', import.meta.url), 'utf-8')
    );
    version = packageJson.version;
} catch (err) {
    // Use default version
}

// Import the main generator
import SwaggerToNextjs from './index.js';

/**
 * CLI for swagger-to-nextjs
 */
export async function cli() {
    const program = new Command();

    program
        .name('swagger-to-nextjs')
        .description('Generate Next.js applications from OpenAPI/Swagger specifications with DaisyUI components')
        .version(version, '-v, --version', 'output the current version')
        .usage('<command> [options]')
        .helpOption('-h, --help', 'display help for command');

    program
        .command('generate <spec> [output]')
        .description('Generate Next.js application from OpenAPI specification')
        .option('--typescript', 'generate TypeScript code (default: true)')
        .option('--no-typescript', 'generate JavaScript code')
        .option('--client', 'generate API client (default: true)')
        .option('--no-client', 'skip API client generation')
        .option('--pages', 'generate UI components (default: true)')
        .option('--no-pages', 'skip UI components generation')
        .option('-f, --force', 'overwrite existing files without asking', false)
        .option('-d, --dry-run', 'preview what would be generated without writing files', false)
        .option('--theme <theme>', 'DaisyUI theme selection (default: "light")', 'light')
        .option('--themes <themes...>', 'list of DaisyUI themes to include (default: ["light", "dark", "cupcake", "corporate"])')
        .option('--no-daisyui', 'generate without DaisyUI, use plain CSS')
        .option('--custom-theme <path>', 'path to custom DaisyUI theme file')
        .option('--template-dir <path>', 'use custom templates from directory')
        .option('--config <path>', 'path to configuration file')
        .option('--verbose', 'show detailed output', false)
        .option('--silent', 'suppress all output except errors', false)
        .option('--docker', 'generate Docker configuration files', false)
        .option('--cicd', 'generate CI/CD configuration files', false)
        .option('--test-templates', 'test all templates before generation (default: true)')
        .option('--no-test-templates', 'skip template testing')
        .action(async (spec, output = './generated', options) => {
            const spinner = options.silent ? null : ora();

            try {
                // Show banner unless silent
                if (!options.silent) {
                    console.log('');
                    console.log(chalk.cyan('═══════════════════════════════════════════════════════════════'));
                    console.log(chalk.cyan.bold('  🚀 Swagger to Next.js Generator with DaisyUI'));
                    console.log(chalk.cyan(`  Version: ${version}`));
                    console.log(chalk.cyan('═══════════════════════════════════════════════════════════════'));
                    console.log('');
                }

                // Set default themes if not provided
                if (!options.themes) {
                    options.themes = ['light', 'dark', 'cupcake', 'corporate'];
                }

                // Log configuration
                if (!options.silent) {
                    console.log(chalk.cyan('📋 Generation Configuration:'));
                    console.log(chalk.gray('─'.repeat(50)));
                    console.log(`  ${chalk.bold('Source:')} ${chalk.yellow(spec)}`);
                    console.log(`  ${chalk.bold('Output:')} ${chalk.yellow(path.resolve(output))}`);
                    console.log(`  ${chalk.bold('TypeScript:')} ${chalk.yellow(options.typescript !== false ? 'Yes' : 'No')}`);
                    console.log(`  ${chalk.bold('API Client:')} ${chalk.yellow(options.client !== false ? 'Yes' : 'No')}`);
                    console.log(`  ${chalk.bold('UI Pages:')} ${chalk.yellow(options.pages !== false ? 'Yes' : 'No')}`);
                    console.log(`  ${chalk.bold('DaisyUI:')} ${chalk.yellow(options.daisyui !== false ? 'Yes' : 'No')}`);
                    if (options.daisyui !== false) {
                        console.log(`  ${chalk.bold('Theme:')} ${chalk.yellow(options.theme)}`);
                        console.log(`  ${chalk.bold('Themes:')} ${chalk.yellow(options.themes.join(', '))}`);
                    }
                    console.log(`  ${chalk.bold('Test Templates:')} ${chalk.yellow(options.testTemplates !== false ? 'Yes' : 'No')}`);
                    console.log(`  ${chalk.bold('Mode:')} ${chalk.yellow(options.dryRun ? 'Dry Run' : 'Normal')}`);
                    console.log(chalk.gray('─'.repeat(50)));
                    console.log('');
                }

                // Validate input
                await validateInput(spec, output, options);

                // Create generator instance
                if (spinner) spinner.start('Initializing generator...');

                const generator = new SwaggerToNextjs({
                    outputDir: output,
                    typescript: options.typescript !== false,
                    generateClient: options.client !== false,
                    generatePages: options.pages !== false,
                    force: options.force,
                    dryRun: options.dryRun,
                    daisyui: options.daisyui !== false,
                    theme: options.theme,
                    themes: options.themes,
                    customTheme: options.customTheme,
                    templateDir: options.templateDir,
                    verbose: options.verbose,
                    silent: options.silent,
                    docker: options.docker,
                    cicd: options.cicd,
                    testTemplates: options.testTemplates !== false,
                    configFile: options.config
                });

                // Initialize with config if provided
                if (options.config) {
                    if (spinner) spinner.text = 'Loading configuration...';
                    await generator.initialize(options.config);
                } else {
                    await generator.initialize();
                }

                if (spinner) spinner.succeed('Generator initialized');

                // Generate the application
                if (spinner) spinner.start('Generating Next.js application...');

                // Update spinner text based on progress
                if (spinner) {
                    generator.on('progress', (event) => {
                        if (event.message) {
                            spinner.text = event.message;
                        }
                    });
                }

                const result = await generator
                    .withSwagger(spec)
                    .toDirectory(output)
                    .generate();

                if (spinner) spinner.succeed('Generation completed successfully!');

                // Show summary
                if (!options.silent) {
                    showSummary(result, output, options);
                }

                // Show next steps
                if (!options.silent && !options.dryRun) {
                    showNextSteps(output, options);
                }

                // Cleanup
                await generator.cleanup();

            } catch (error) {
                if (spinner) spinner.fail('Generation failed');
                handleError(error);
                process.exit(1);
            }
        });

    // Add generate-from-config command
    program
        .command('generate-from-config <config-file> [output]')
        .description('Generate Next.js application using OpenAPI Generator config file')
        .option('--typescript', 'generate TypeScript code (default: true)')
        .option('--no-typescript', 'generate JavaScript code')
        .option('--pages', 'generate UI components (default: true)')
        .option('--no-pages', 'skip UI components generation')
        .option('-f, --force', 'overwrite existing files without asking', false)
        .option('-d, --dry-run', 'preview what would be generated without writing files', false)
        .option('--theme <theme>', 'DaisyUI theme selection (default: "light")', 'light')
        .option('--themes <themes...>', 'list of DaisyUI themes to include (default: ["light", "dark", "cupcake", "corporate"])')
        .option('--no-daisyui', 'generate without DaisyUI, use plain CSS')
        .option('--verbose', 'show detailed output', false)
        .option('--silent', 'suppress all output except errors', false)
        .option('--docker', 'generate Docker configuration files', false)
        .option('--cicd', 'generate CI/CD configuration files', false)
        .action(async (configFile, output, options) => {
            const spinner = options.silent ? null : ora();

            try {
                // Show banner unless silent
                if (!options.silent) {
                    console.log('');
                    console.log(chalk.cyan('═══════════════════════════════════════════════════════════════'));
                    console.log(chalk.cyan.bold('  🚀 Swagger to Next.js Generator with DaisyUI'));
                    console.log(chalk.cyan(`  Version: ${version}`));
                    console.log(chalk.cyan('═══════════════════════════════════════════════════════════════'));
                    console.log('');
                }

                // Load the config file
                if (spinner) spinner.start('Loading configuration file...');

                let config;
                try {
                    const configContent = await fs.readFile(configFile, 'utf-8');
                    config = yaml.load(configContent);

                    if (!config.inputSpec) {
                        throw new Error('Config file must contain "inputSpec" field');
                    }

                    if (spinner) spinner.succeed('Configuration loaded');
                } catch (error) {
                    if (spinner) spinner.fail('Failed to load configuration');
                    throw new Error(`Failed to load config file: ${error.message}`);
                }

                // Extract spec URL from config
                const spec = config.inputSpec;

                // Use outputDir from config if not specified
                if (!output && config.outputDir) {
                    output = config.outputDir;
                } else if (!output) {
                    output = './generated';
                }

                // Set default themes if not provided
                if (!options.themes) {
                    options.themes = ['light', 'dark', 'cupcake', 'corporate'];
                }

                // Log configuration
                if (!options.silent) {
                    console.log(chalk.cyan('📋 Generation Configuration:'));
                    console.log(chalk.gray('─'.repeat(50)));
                    console.log(`  ${chalk.bold('Config File:')} ${chalk.yellow(configFile)}`);
                    console.log(`  ${chalk.bold('Source:')} ${chalk.yellow(spec)}`);
                    console.log(`  ${chalk.bold('Output:')} ${chalk.yellow(path.resolve(output))}`);
                    console.log(`  ${chalk.bold('Generator:')} ${chalk.yellow(config.generatorName || 'typescript-axios')}`);
                    console.log(`  ${chalk.bold('TypeScript:')} ${chalk.yellow(options.typescript !== false ? 'Yes' : 'No')}`);
                    console.log(`  ${chalk.bold('API Client:')} ${chalk.yellow('Yes (using OpenAPI Generator)')}`);
                    console.log(`  ${chalk.bold('UI Pages:')} ${chalk.yellow(options.pages !== false ? 'Yes' : 'No')}`);
                    console.log(`  ${chalk.bold('DaisyUI:')} ${chalk.yellow(options.daisyui !== false ? 'Yes' : 'No')}`);
                    if (options.daisyui !== false) {
                        console.log(`  ${chalk.bold('Theme:')} ${chalk.yellow(options.theme)}`);
                        console.log(`  ${chalk.bold('Themes:')} ${chalk.yellow(options.themes.join(', '))}`);
                    }
                    console.log(`  ${chalk.bold('Mode:')} ${chalk.yellow(options.dryRun ? 'Dry Run' : 'Normal')}`);
                    console.log(chalk.gray('─'.repeat(50)));
                    console.log('');
                }

                // Create generator instance
                if (spinner) spinner.start('Initializing generator...');

                const generator = new SwaggerToNextjs({
                    outputDir: output,
                    typescript: options.typescript !== false,
                    generateClient: true, // Always true when using config
                    generatePages: options.pages !== false,
                    force: options.force,
                    dryRun: options.dryRun,
                    daisyui: options.daisyui !== false,
                    theme: options.theme,
                    themes: options.themes,
                    verbose: options.verbose,
                    silent: options.silent,
                    docker: options.docker,
                    cicd: options.cicd,
                    // Pass the config file path
                    configFile: configFile,
                    useOpenApiGenerator: true
                });

                await generator.initialize();

                if (spinner) spinner.succeed('Generator initialized');

                // Generate the application
                if (spinner) spinner.start('Generating Next.js application...');

                // Update spinner text based on progress
                if (spinner) {
                    generator.on('progress', (event) => {
                        if (event.message) {
                            spinner.text = event.message;
                        }
                    });
                }

                const result = await generator
                    .withSwagger(spec)
                    .toDirectory(output)
                    .generate();

                if (spinner) spinner.succeed('Generation completed successfully!');

                // Show summary
                if (!options.silent) {
                    showSummary(result, output, options);
                }

                // Show next steps
                if (!options.silent && !options.dryRun) {
                    showNextSteps(output, options);
                }

                // Cleanup
                await generator.cleanup();

            } catch (error) {
                if (spinner) spinner.fail('Generation failed');
                handleError(error);
                process.exit(1);
            }
        });

    // Add test-templates command
    program
        .command('test-templates')
        .description('Test all template files for errors')
        .option('--verbose', 'show detailed output', false)
        .option('--list', 'list templates without testing', false)
        .action(async (options) => {
            const spinner = ora();

            try {
                const { default: TemplateTester } = await import('./TemplateTester.js');

                const tester = new TemplateTester({
                    verbose: options.verbose,
                    silent: false
                });

                if (options.list) {
                    // Just list templates
                    spinner.start('Finding templates...');
                    const result = await tester.listTemplates();
                    spinner.succeed(`Found ${result.total} templates`);

                    console.log('\n📋 Template Files:\n');
                    Object.keys(result.grouped).sort().forEach(dir => {
                        console.log(chalk.blue(`${dir}/`));
                        result.grouped[dir].forEach(file => {
                            console.log(`  → ${file}`);
                        });
                    });
                } else {
                    // Test templates
                    spinner.start('Testing templates...');
                    const result = await tester.testAll();

                    if (result.failed > 0) {
                        spinner.fail(`Template testing failed: ${result.failed}/${result.tested} templates have errors`);

                        if (!options.verbose) {
                            console.log('\nRun with --verbose to see detailed errors');
                        }

                        process.exit(1);
                    } else {
                        spinner.succeed(`All ${result.tested} templates passed!`);
                    }
                }
            } catch (error) {
                spinner.fail('Template testing failed');
                console.error(chalk.red('Error:'), error.message);
                process.exit(1);
            }
        });

    // Add help text
    program.addHelpText('after', `
Examples:
  $ swagger-to-nextjs generate ./api.yaml ./my-app
  $ swagger-to-nextjs generate https://api.example.com/swagger.json
  $ swagger-to-nextjs generate spec.yaml --no-typescript --force
  $ swagger-to-nextjs generate api.json output --dry-run
  $ swagger-to-nextjs generate api.yaml my-app --theme dark --themes light dark synthwave
  $ swagger-to-nextjs generate spec.json --no-daisyui
  
  # Using OpenAPI Generator config file:
  $ swagger-to-nextjs generate-from-config openapi-config.yaml
  $ swagger-to-nextjs generate-from-config openapi-config-typelist-service.yaml ./my-app
  $ swagger-to-nextjs generate-from-config config.yaml --theme dark --no-pages
  
  $ swagger-to-nextjs test-templates
  $ swagger-to-nextjs test-templates --verbose
  $ swagger-to-nextjs test-templates --list

Theme Options:
  Available DaisyUI themes include: light, dark, cupcake, bumblebee, emerald, corporate,
  synthwave, retro, cyberpunk, valentine, halloween, garden, forest, aqua, lofi, pastel,
  fantasy, wireframe, black, luxury, dracula, cmyk, autumn, business, acid, lemonade,
  night, coffee, winter, dim, nord, sunset

Config File Format:
  When using generate-from-config, your YAML file should include:
    inputSpec: <URL or path to OpenAPI spec>
    outputDir: <optional output directory>
    generatorName: <OpenAPI generator to use>
    additionalProperties: <generator-specific options>

For more information, visit: https://github.com/yourusername/swagger-to-nextjs`);

    await program.parseAsync(process.argv);
}

/**
 * Validate input parameters
 */
async function validateInput(spec, output, options) {
    // Check if spec exists (for local files)
    if (!spec.startsWith('http://') && !spec.startsWith('https://')) {
        try {
            await fs.access(spec);
        } catch (error) {
            throw new Error(`OpenAPI specification file not found: ${spec}`);
        }
    }

    // Check output directory
    if (!options.dryRun) {
        const outputPath = path.resolve(output);

        try {
            const stats = await fs.stat(outputPath);

            if (stats.isDirectory()) {
                const files = await fs.readdir(outputPath);

                if (files.length > 0 && !options.force) {
                    throw new Error(
                        `Output directory is not empty: ${outputPath}\n` +
                        '  Use --force to overwrite existing files.'
                    );
                }
            } else {
                throw new Error('Output path is not a directory');
            }
        } catch (error) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
            // The directory doesn't exist, which is fine
        }
    }

    // Validate custom theme file if provided
    if (options.customTheme) {
        try {
            await fs.access(options.customTheme);
        } catch (error) {
            throw new Error(`Custom theme file not found: ${options.customTheme}`);
        }
    }
}

/**
 * Show generation summary
 */
function showSummary(result, output, options) {
    console.log('');
    console.log(chalk.green('✨ Generation Summary:'));
    console.log(chalk.gray('─'.repeat(50)));

    if (result.files) {
        console.log(`  ${chalk.bold('Total Files:')} ${chalk.yellow(result.files.length)}`);

        // Group files by type
        const fileTypes = {};
        result.files.forEach(file => {
            const type = file.type || 'other';
            fileTypes[type] = (fileTypes[type] || 0) + 1;
        });

        Object.entries(fileTypes).forEach(([type, count]) => {
            console.log(`    ${type}: ${count}`);
        });
    }

    if (result.stats) {
        console.log(`  ${chalk.bold('TypeScript Types:')} ${chalk.yellow(result.stats.types || 0)}`);
        console.log(`  ${chalk.bold('API Routes:')} ${chalk.yellow(result.stats.routes || 0)}`);
        console.log(`  ${chalk.bold('UI Pages:')} ${chalk.yellow(result.stats.pages || 0)}`);
    }

    if (options.daisyui !== false && result.daisyuiComponents?.length > 0) {
        console.log(`  ${chalk.bold('DaisyUI Components:')} ${chalk.yellow(result.daisyuiComponents.join(', '))}`);
    }

    if (result.duration) {
        console.log(`  ${chalk.bold('Duration:')} ${chalk.yellow((result.duration / 1000).toFixed(2) + 's')}`);
    }

    if (result.warnings && result.warnings.length > 0) {
        console.log(`  ${chalk.bold('Warnings:')} ${chalk.yellow(result.warnings.length)}`);
        if (options.verbose) {
            result.warnings.forEach(warning => {
                console.log(chalk.yellow(`    ⚠️  ${warning}`));
            });
        }
    }

    console.log(chalk.gray('─'.repeat(50)));
}

/**
 * Show next steps
 */
function showNextSteps(output, options) {
    console.log('');
    console.log(chalk.green('🎯 Next Steps:'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log('');
    console.log('  1. Navigate to your project:');
    console.log(chalk.cyan(`     cd ${output}`));
    console.log('');
    console.log('  2. Install dependencies:');
    console.log(chalk.cyan('     npm install'));
    console.log('');
    console.log('  3. Set up environment variables:');
    console.log(chalk.cyan('     cp .env.example .env.local'));
    console.log('');
    console.log('  4. Start the development server:');
    console.log(chalk.cyan('     npm run dev'));
    console.log('');

    if (options.daisyui !== false) {
        console.log('  5. Switch themes:');
        console.log(chalk.cyan('     Use the theme switcher in the navbar or update NEXT_PUBLIC_DEFAULT_THEME'));
        console.log('');
    }

    console.log(chalk.gray('─'.repeat(50)));
    console.log('');
    console.log(chalk.bold('📚 For more information, check the generated README.md'));
    console.log('');
}

/**
 * Handle errors with user-friendly messages
 */
function handleError(error) {
    console.error('');
    console.error(chalk.red('❌ Error:'), error.message);

    // Provide helpful suggestions based on error type
    if (error.code === 'ENOENT') {
        console.error(chalk.yellow('\n💡 The specified file or directory was not found.'));
        console.error(chalk.yellow('   Please check the path and try again.'));
    } else if (error.code === 'EACCES') {
        console.error(chalk.yellow('\n💡 Permission denied.'));
        console.error(chalk.yellow('   You may need appropriate permissions to write to this directory.'));
    } else if (error.code === 'EEXIST') {
        console.error(chalk.yellow('\n💡 File or directory already exists.'));
        console.error(chalk.yellow('   Use --force to overwrite existing files.'));
    } else if (error.message.includes('Invalid OpenAPI')) {
        console.error(chalk.yellow('\n💡 The specification appears to be invalid.'));
        console.error(chalk.yellow('   Please ensure it follows OpenAPI 3.x or Swagger 2.0 format.'));
    } else if (error.message.includes('Not valid JSON or YAML')) {
        console.error(chalk.yellow('\n💡 The specification file could not be parsed.'));
        console.error(chalk.yellow('   Please ensure it is valid JSON or YAML format.'));
    } else if (error.message.includes('Missing version field')) {
        console.error(chalk.yellow('\n💡 The specification is missing required version field.'));
        console.error(chalk.yellow('   Add "openapi: 3.0.0" or "swagger: 2.0" to your spec.'));
    }

    if (process.env.DEBUG) {
        console.error(chalk.gray('\nStack trace:'));
        console.error(chalk.gray(error.stack));
    } else {
        console.error(chalk.gray('\nRun with DEBUG=1 for detailed error information.'));
    }
}

// Export the cli function as default
export default cli;

// Export CLI class for testing if needed
export class CLI {
    constructor() {
        this.program = new Command();
    }

    async run(args = process.argv) {
        await cli();
    }
}

// Run CLI if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    cli().catch(error => {
        handleError(error);
        process.exit(1);
    });
}
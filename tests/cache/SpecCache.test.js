const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Define all files from Phases 1, 2, 3, and 4
const PHASE_FILES = {
    // PHASE 1: Foundation Components
    phase1: {
        name: 'Phase 1: Foundation Components',
        files: [
            // Root Configuration Files
            'package.json',
            'README.md',

            // CLI Executable
            'bin/swagger-to-nextjs.js',

            // Core Configuration
            'config/defaults.js',

            // Main Entry Points
            'src/index.js',
            'src/cli.js'
        ]
    },

    // PHASE 2: Core System Components
    phase2: {
        name: 'Phase 2: Core System Components',
        files: [
            // Core Infrastructure
            'src/core/SwaggerLoader.js',
            'src/core/SwaggerValidator.js',
            'src/core/DirectoryManager.js',

            // Error Handling System
            'src/errors/GeneratorError.js',
            'src/errors/ValidationError.js',
            'src/errors/NetworkError.js',
            'src/errors/FileSystemError.js',
            'src/errors/TemplateError.js',
            'src/errors/ErrorHandler.js',

            // Logging System
            'src/logging/Logger.js',
            'src/logging/ProgressReporter.js',
            'src/logging/LogFormatter.js'
        ]
    },

    // PHASE 3: Code Generation Engine
    phase3: {
        name: 'Phase 3: Code Generation Engine',
        files: [
            // Base Generators
            'src/generators/BaseGenerator.js',
            'src/generators/ApiRouteGenerator.js',
            'src/generators/PageComponentGenerator.js',
            'src/generators/ConfigFileGenerator.js',

            // Configuration Generators (Submodules)
            'src/generators/config/NextConfigGenerator.js',
            'src/generators/config/TypeScriptConfigGenerator.js',
            'src/generators/config/LintingConfigGenerator.js',
            'src/generators/config/DockerConfigGenerator.js',
            'src/generators/config/CICDConfigGenerator.js',
            'src/generators/config/EnvironmentConfigGenerator.js',
            'src/generators/config/PackageConfigGenerator.js',
            'src/generators/config/DocumentationGenerator.js',
            'src/generators/config/EditorConfigGenerator.js',
            'src/generators/config/DeploymentConfigGenerator.js',
            'src/generators/config/ConfigHelpers.js',

            // Template System
            'src/templates/TemplateEngine.js',
            'src/templates/TemplateLoader.js',

            // Utility Functions
            'src/utils/PathUtils.js',
            'src/utils/SchemaUtils.js',
            'src/utils/ValidationUtils.js',
            'src/utils/StringUtils.js'
        ]
    },

    // PHASE 4: Template Files
    phase4: {
        name: 'Phase 4: Template Files',
        files: [
            // API Template Files
            'src/templates/files/api/route.ts.template',
            'src/templates/files/api/validation.ts.template',

            // Page Template Files
            'src/templates/files/pages/page.tsx.template',
            'src/templates/files/pages/components.tsx.template',

            // Configuration Template Files
            'src/templates/files/config/layout.tsx.template',
            'src/templates/files/config/globals.css.template',
            'src/templates/files/config/tsconfig.json.template',
            'src/templates/files/config/next.config.js.template',
            'src/templates/files/config/dependencies.md.template'
        ]
    }
};

// Minimum size in bytes to consider a file as "implemented" (not just a shell)
const MIN_FILE_SIZE = 50;

// Check if a file exists and is not empty
function checkFile(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            return { exists: false, size: 0 };
        }
        const stats = fs.statSync(filePath);
        return {
            exists: true,
            size: stats.size,
            isImplemented: stats.size >= MIN_FILE_SIZE
        };
    } catch (error) {
        return { exists: false, size: 0 };
    }
}

// Get test file path for a source file
function getTestFilePath(srcFile) {
    // Convert src path to test path
    const testFile = srcFile
        .replace(/^src\//, 'tests/')
        .replace(/\.js$/, '.test.js')
        .replace(/\.ts$/, '.test.ts')
        .replace(/\.template$/, '.template.test.js');

    return testFile;
}

// Create empty test file with basic structure
function createTestFile(testPath, originalFile) {
    const dir = path.dirname(testPath);

    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    // Skip if test file already exists
    if (fs.existsSync(testPath)) {
        return false;
    }

    // Generate test content based on file type
    const className = path.basename(originalFile, path.extname(originalFile));
    const testContent = `// Unit tests for ${originalFile}

describe('${className}', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  describe('constructor', () => {
    test('should initialize correctly', () => {
      // TODO: Implement test
      expect(true).toBe(true);
    });
  });

  // TODO: Add more tests
});
`;

    fs.writeFileSync(testPath, testContent);
    return true;
}

// Format file path for display
function formatPath(filePath) {
    return filePath.replace(/\\/g, '/');
}

// Format file size
function formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Check all files and generate report
function checkImplementation(baseDir = '.', options = {}) {
    const { createTests = false, verbose = false } = options;

    console.log(chalk.bold.blue('\n📊 Swagger-to-NextJS Implementation Status Check\n'));
    console.log(chalk.gray(`Base directory: ${path.resolve(baseDir)}`));
    console.log(chalk.gray(`Minimum file size: ${MIN_FILE_SIZE} bytes`));
    console.log(chalk.gray(`Create test files: ${createTests}\n`));

    let totalFiles = 0;
    let implementedFiles = 0;
    let emptyFiles = 0;
    let createdTests = 0;
    const missingFiles = [];
    const shellFiles = [];

    // Check each phase
    Object.values(PHASE_FILES).forEach(phase => {
        console.log(chalk.bold.yellow(`\n${phase.name}`));
        console.log(chalk.gray('─'.repeat(60)));

        let phaseImplemented = 0;
        let phaseEmpty = 0;
        let phaseMissing = [];
        let phaseShells = [];

        phase.files.forEach(file => {
            const filePath = path.join(baseDir, file);
            const fileInfo = checkFile(filePath);
            totalFiles++;

            let status, color, icon;

            if (!fileInfo.exists) {
                icon = '✗';
                color = 'red';
                status = 'MISSING';
                missingFiles.push(file);
                phaseMissing.push(file);
            } else if (!fileInfo.isImplemented) {
                icon = '○';
                color = 'yellow';
                status = `EMPTY (${formatSize(fileInfo.size)})`;
                emptyFiles++;
                phaseEmpty++;
                shellFiles.push(file);
                phaseShells.push(file);
            } else {
                icon = '✓';
                color = 'green';
                status = verbose ? `OK (${formatSize(fileInfo.size)})` : 'OK';
                implementedFiles++;
                phaseImplemented++;
            }

            console.log(
                chalk[color](icon),
                formatPath(file).padEnd(50),
                chalk[color](status)
            );

            // Create test file if requested and source exists
            if (createTests && fileInfo.exists && file.startsWith('src/')) {
                const testPath = getTestFilePath(file);
                const fullTestPath = path.join(baseDir, testPath);

                if (createTestFile(fullTestPath, file)) {
                    createdTests++;
                    console.log(
                        chalk.cyan('  └─ Created test:'),
                        chalk.gray(formatPath(testPath))
                    );
                }
            }
        });

        // Phase summary
        const phasePercentage = ((phaseImplemented / phase.files.length) * 100).toFixed(1);
        console.log(chalk.gray('\n' + '─'.repeat(60)));
        console.log(
            `Phase Progress: ${chalk.bold.green(phaseImplemented)}/${phase.files.length} implemented, ` +
            `${chalk.bold.yellow(phaseEmpty)} empty, ` +
            `${chalk.bold.red(phaseMissing.length)} missing ` +
            `(${phasePercentage}% complete)`
        );
    });

    // Overall summary
    console.log(chalk.bold.blue('\n\n📈 Overall Summary'));
    console.log(chalk.gray('═'.repeat(60)));

    const overallPercentage = ((implementedFiles / totalFiles) * 100).toFixed(1);
    console.log(`Total Files: ${chalk.bold(totalFiles)}`);
    console.log(`Implemented: ${chalk.bold.green(implementedFiles)} (non-empty files ≥ ${MIN_FILE_SIZE} bytes)`);
    console.log(`Empty Shells: ${chalk.bold.yellow(emptyFiles)}`);
    console.log(`Missing: ${chalk.bold.red(missingFiles.length)}`);
    console.log(`Implementation Progress: ${chalk.bold(overallPercentage + '%')}`);

    if (createdTests > 0) {
        console.log(`Test Files Created: ${chalk.bold.cyan(createdTests)}`);
    }

    // Progress bar
    const progressBarLength = 40;
    const implementedLength = Math.round((implementedFiles / totalFiles) * progressBarLength);
    const emptyLength = Math.round((emptyFiles / totalFiles) * progressBarLength);
    const progressBar =
        chalk.green('█'.repeat(implementedLength)) +
        chalk.yellow('▒'.repeat(emptyLength)) +
        chalk.gray('░'.repeat(progressBarLength - implementedLength - emptyLength));

    console.log(`\n[${progressBar}] ${overallPercentage}%`);
    console.log(chalk.gray(`Green: Implemented | Yellow: Empty | Gray: Missing`));

    // List problematic files
    if (shellFiles.length > 0) {
        console.log(chalk.bold.yellow('\n\n⚠️  Empty Shell Files'));
        console.log(chalk.gray('═'.repeat(60)));

        const groupedShells = groupByDirectory(shellFiles);
        printGroupedFiles(groupedShells, chalk.yellow);
    }

    if (missingFiles.length > 0) {
        console.log(chalk.bold.red('\n\n📋 Missing Files'));
        console.log(chalk.gray('═'.repeat(60)));

        const groupedMissing = groupByDirectory(missingFiles);
        printGroupedFiles(groupedMissing, chalk.red);
    }

    // Quick setup commands
    if (missingFiles.length > 0 || shellFiles.length > 0) {
        console.log(chalk.bold.blue('\n\n🛠️  Quick Setup Commands'));
        console.log(chalk.gray('═'.repeat(60)));

        if (missingFiles.length > 0) {
            const missingDirs = [...new Set(missingFiles.map(f => path.dirname(f)))];
            console.log(chalk.cyan('\nCreate missing directories:'));
            console.log(chalk.gray(`mkdir -p ${missingDirs.join(' ')}`));

            console.log(chalk.cyan('\nCreate missing files:'));
            missingFiles.slice(0, 5).forEach(file => {
                console.log(chalk.gray(`touch ${file}`));
            });
            if (missingFiles.length > 5) {
                console.log(chalk.gray(`... and ${missingFiles.length - 5} more`));
            }
        }

        if (!createTests) {
            console.log(chalk.cyan('\nTo create test files automatically:'));
            console.log(chalk.gray(`node check-implementation.js --create-tests`));
        }
    }

    // Return results for programmatic use
    return {
        totalFiles,
        implementedFiles,
        emptyFiles,
        missingFiles,
        shellFiles,
        createdTests,
        percentage: overallPercentage,
        phases: Object.entries(PHASE_FILES).map(([key, phase]) => ({
            name: phase.name,
            total: phase.files.length,
            implemented: phase.files.filter(f => {
                const info = checkFile(path.join(baseDir, f));
                return info.exists && info.isImplemented;
            }).length,
            empty: phase.files.filter(f => {
                const info = checkFile(path.join(baseDir, f));
                return info.exists && !info.isImplemented;
            }).length,
            missing: phase.files.filter(f => !checkFile(path.join(baseDir, f)).exists)
        }))
    };
}

// Group files by directory
function groupByDirectory(files) {
    const grouped = {};
    files.forEach(file => {
        const dir = path.dirname(file);
        if (!grouped[dir]) {
            grouped[dir] = [];
        }
        grouped[dir].push(path.basename(file));
    });
    return grouped;
}

// Print grouped files
function printGroupedFiles(grouped, colorFn) {
    Object.entries(grouped).forEach(([dir, files]) => {
        console.log(colorFn(`\n${dir}/`));
        files.forEach(file => {
            console.log(`  - ${file}`);
        });
    });
}

// Generate implementation status report
function generateReport(results) {
    const reportPath = 'implementation-status.json';
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            totalFiles: results.totalFiles,
            implementedFiles: results.implementedFiles,
            emptyFiles: results.emptyFiles,
            missingFiles: results.missingFiles.length,
            completionPercentage: results.percentage,
            testFilesCreated: results.createdTests
        },
        phases: results.phases,
        missingFiles: results.missingFiles,
        emptyShellFiles: results.shellFiles,
        minimumFileSize: MIN_FILE_SIZE
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(chalk.green(`\n\n✅ Report saved to: ${reportPath}`));
}

// CLI usage
if (require.main === module) {
    const args = process.argv.slice(2);
    const baseDir = args.find(arg => !arg.startsWith('-')) || '.';
    const generateReportFlag = args.includes('--report') || args.includes('-r');
    const createTestsFlag = args.includes('--create-tests') || args.includes('-t');
    const verboseFlag = args.includes('--verbose') || args.includes('-v');
    const helpFlag = args.includes('--help') || args.includes('-h');

    if (helpFlag) {
        console.log(chalk.bold('\n🔍 Swagger-to-NextJS Implementation Checker\n'));
        console.log('Usage: node check-implementation.js [directory] [options]\n');
        console.log('Options:');
        console.log('  -r, --report        Generate JSON report');
        console.log('  -t, --create-tests  Create empty test files for existing source files');
        console.log('  -v, --verbose       Show file sizes');
        console.log('  -h, --help          Show this help message\n');
        console.log('Examples:');
        console.log('  node check-implementation.js');
        console.log('  node check-implementation.js . --create-tests --report');
        console.log('  node check-implementation.js /path/to/project -v');
        process.exit(0);
    }

    console.log(chalk.bold('🔍 Checking implementation status...'));

    const results = checkImplementation(baseDir, {
        createTests: createTestsFlag,
        verbose: verboseFlag
    });

    if (generateReportFlag) {
        generateReport(results);
    }

    // Exit with error code if files are missing or empty
    if (results.missingFiles.length > 0 || results.emptyFiles > 0) {
        console.log(chalk.yellow('\n⚠️  Implementation incomplete. Use --help for options.'));
        process.exit(1);
    } else {
        console.log(chalk.green('\n✅ All Phase 1-4 files are fully implemented!'));
        process.exit(0);
    }
}

module.exports = { checkImplementation, PHASE_FILES };
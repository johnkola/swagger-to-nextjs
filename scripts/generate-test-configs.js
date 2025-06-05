// scripts/generate-test-configs.js
const fs = require('fs');
const path = require('path');

/**
 * Generate test configuration files for all environments and locations
 */

// Configuration templates for each environment
const configs = {
    // Development configuration
    development: {
        level: 'debug',
        format: 'pretty',
        colorize: true,
        timestamp: true,
        timestampFormat: 'HH:mm:ss.SSS',
        handleExceptions: true,
        handleRejections: true,
        exitOnError: false,
        watchConfig: true,
        formatter: {
            format: 'custom',
            colorize: true,
            timestampFormat: 'HH:mm:ss.SSS',
            prettyPrint: true,
            align: false,
            errors: true
        },
        transports: [
            {
                type: 'console',
                level: 'debug',
                format: 'pretty'
            },
            {
                type: 'file',
                filename: 'logs/dev-debug.log',
                level: 'debug',
                maxsize: 5242880,
                maxFiles: 3
            }
        ],
        defaultMeta: {
            env: 'development',
            version: '1.0.0'
        }
    },

    // Production configuration
    production: {
        level: 'info',
        format: 'json',
        colorize: false,
        timestamp: true,
        timestampFormat: 'YYYY-MM-DD HH:mm:ss',
        handleExceptions: true,
        handleRejections: true,
        exitOnError: false,
        watchConfig: false,
        formatter: {
            format: 'json',
            colorize: false,
            errors: true,
            timestamp: true
        },
        transports: [
            {
                type: 'console',
                level: 'error',
                format: 'json'
            },
            {
                type: 'file',
                filename: 'logs/app.log',
                level: 'info',
                maxsize: 10485760, // 10MB
                maxFiles: 10,
                format: 'json'
            },
            {
                type: 'file',
                filename: 'logs/error.log',
                level: 'error',
                maxsize: 10485760,
                maxFiles: 5,
                format: 'json'
            }
        ],
        defaultMeta: {
            env: 'production',
            version: '1.0.0',
            service: 'api'
        }
    },

    // Test configuration
    test: {
        level: 'error',
        format: 'simple',
        colorize: false,
        timestamp: true,
        timestampFormat: 'HH:mm:ss',
        silent: process.env.SILENT_LOGS === 'true',
        handleExceptions: true,
        handleRejections: false,
        exitOnError: false,
        watchConfig: false,
        formatter: {
            format: 'simple',
            colorize: false,
            timestamp: true,
            errors: true
        },
        transports: [
            {
                type: 'console',
                level: 'error',
                format: 'simple',
                silent: process.env.SILENT_LOGS === 'true'
            }
        ],
        defaultMeta: {
            env: 'test'
        }
    },

    // Staging configuration
    staging: {
        level: 'debug',
        format: 'json',
        colorize: false,
        timestamp: true,
        timestampFormat: 'YYYY-MM-DD HH:mm:ss',
        handleExceptions: true,
        handleRejections: true,
        exitOnError: false,
        watchConfig: true,
        formatter: {
            format: 'json',
            colorize: false,
            timestamp: true,
            prettyPrint: false
        },
        transports: [
            {
                type: 'console',
                level: 'info',
                format: 'simple'
            },
            {
                type: 'file',
                filename: 'logs/staging.log',
                level: 'debug',
                maxsize: 5242880,
                maxFiles: 5
            }
        ],
        defaultMeta: {
            env: 'staging',
            version: '1.0.0'
        }
    }
};

// Multi-profile configuration (all environments in one file)
const multiProfileConfig = {
    development: configs.development,
    production: configs.production,
    test: configs.test,
    staging: configs.staging
};

// Minimal configs for testing
const minimalConfigs = {
    development: {
        level: 'debug',
        formatter: { colorize: true }
    },
    production: {
        level: 'info',
        formatter: { format: 'json' }
    },
    test: {
        level: 'error',
        silent: true
    }
};

// Config file locations and names
const configLocations = [
    {
        path: '.',
        description: 'Project root directory',
        files: [
            'logger.config.json',
            '.loggerrc.json',
            'logging.json',
            'log.config.json'
        ]
    },
    {
        path: 'config',
        description: 'Config subdirectory',
        files: [
            'logger.config.json',
            '.loggerrc.json',
            'logging.json'
        ]
    },
    {
        path: 'src',
        description: 'Source directory',
        files: [
            'logger.config.json',
            '.loggerrc.json',
            'logging.json'
        ]
    },
    {
        path: 'src/config',
        description: 'Source config subdirectory',
        files: [
            'logger.config.json',
            'logging.json'
        ]
    },
    {
        path: 'src/logging',
        description: 'Logging module directory',
        files: [
            'logger.config.json',
            '.loggerrc.json'
        ]
    }
];

// Generate configs
function generateConfigs() {
    console.log('🔧 Logger Test Configuration Generator\n');
    console.log('This script generates test configuration files for the Logger system.\n');

    // Create output directory
    const outputDir = path.join(process.cwd(), 'test-configs');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`📁 Output directory: ${outputDir}\n`);

    // Generate profile-specific files
    console.log('1️⃣  PROFILE-SPECIFIC CONFIG FILES\n');
    Object.entries(configs).forEach(([profile, config]) => {
        const filename = `logger.config.${profile}.json`;
        const filepath = path.join(outputDir, filename);
        fs.writeFileSync(filepath, JSON.stringify(config, null, 2));
        console.log(`   ✅ ${filename} - Full ${profile} configuration`);
    });

    // Generate standard config files
    console.log('\n2️⃣  STANDARD CONFIG FILES\n');

    // Multi-profile config
    const multiProfilePath = path.join(outputDir, 'logger.config.json');
    fs.writeFileSync(multiProfilePath, JSON.stringify(multiProfileConfig, null, 2));
    console.log('   ✅ logger.config.json - Multi-profile configuration');

    // Alternative naming
    fs.writeFileSync(
        path.join(outputDir, '.loggerrc.json'),
        JSON.stringify(multiProfileConfig, null, 2)
    );
    console.log('   ✅ .loggerrc.json - Alternative name (same content)');

    fs.writeFileSync(
        path.join(outputDir, 'logging.json'),
        JSON.stringify(multiProfileConfig, null, 2)
    );
    console.log('   ✅ logging.json - Alternative name (same content)');

    // Minimal configs
    console.log('\n3️⃣  MINIMAL CONFIG FILES\n');
    Object.entries(minimalConfigs).forEach(([profile, config]) => {
        const filename = `minimal.${profile}.json`;
        const filepath = path.join(outputDir, filename);
        fs.writeFileSync(filepath, JSON.stringify(config, null, 2));
        console.log(`   ✅ ${filename} - Minimal ${profile} configuration`);
    });

    // Special test configs
    console.log('\n4️⃣  SPECIAL TEST CONFIGS\n');

    // Config with only formatter settings
    const formatterOnlyConfig = {
        formatter: {
            format: 'custom',
            colorize: true,
            timestampFormat: 'HH:mm:ss',
            prettyPrint: true
        }
    };
    fs.writeFileSync(
        path.join(outputDir, 'formatter-only.json'),
        JSON.stringify(formatterOnlyConfig, null, 2)
    );
    console.log('   ✅ formatter-only.json - Only formatter configuration');

    // Config with custom transports
    const customTransportsConfig = {
        level: 'info',
        transports: [
            {
                type: 'console',
                level: 'warn',
                format: 'cli'
            },
            {
                type: 'file',
                filename: 'logs/custom.log',
                level: 'info',
                format: 'logstash'
            },
            {
                type: 'http',
                host: 'localhost',
                port: 3000,
                path: '/logs',
                level: 'error'
            }
        ]
    };
    fs.writeFileSync(
        path.join(outputDir, 'custom-transports.json'),
        JSON.stringify(customTransportsConfig, null, 2)
    );
    console.log('   ✅ custom-transports.json - Custom transport configuration');

    // Invalid config for error testing
    fs.writeFileSync(
        path.join(outputDir, 'invalid.json'),
        '{ invalid json content }'
    );
    console.log('   ✅ invalid.json - Invalid JSON for error testing');

    // Generate location guide
    console.log('\n📍 WHERE TO PLACE CONFIG FILES:\n');
    console.log('ConfigManager searches for config files in these locations (in order):\n');

    configLocations.forEach((location, index) => {
        console.log(`${index + 1}. ${location.description} (${location.path}/)`);
        location.files.forEach(file => {
            console.log(`   - ${file}`);
        });
        console.log('');
    });

    console.log('📝 SEARCH PRIORITY:\n');
    console.log('1. Profile-specific files are checked first:');
    console.log('   - logger.config.{profile}.json');
    console.log('   - .loggerrc.{profile}.json');
    console.log('   - logging.{profile}.json\n');
    console.log('2. Then standard files are checked:');
    console.log('   - logger.config.json');
    console.log('   - .loggerrc.json');
    console.log('   - logging.json\n');

    console.log('🔍 USAGE EXAMPLES:\n');
    console.log('1. Copy to project root for automatic detection:');
    console.log('   cp test-configs/logger.config.json .\n');

    console.log('2. Copy to config directory:');
    console.log('   mkdir -p config');
    console.log('   cp test-configs/logger.config.json config/\n');

    console.log('3. Use profile-specific config:');
    console.log('   cp test-configs/logger.config.development.json .\n');

    console.log('4. Use explicit path in code:');
    console.log('   const logger = new Logger({');
    console.log('     configFile: "./test-configs/custom-transports.json"');
    console.log('   });\n');

    console.log('5. Test with different profiles:');
    console.log('   NODE_ENV=production node your-app.js');
    console.log('   NODE_ENV=development node your-app.js');
    console.log('   NODE_ENV=test npm test\n');

    // Create a README in the output directory
    const readmeContent = `# Logger Test Configurations

This directory contains test configuration files for the Logger system.

## Files

### Profile-Specific Configs
- \`logger.config.development.json\` - Development environment config
- \`logger.config.production.json\` - Production environment config
- \`logger.config.test.json\` - Test environment config
- \`logger.config.staging.json\` - Staging environment config

### Multi-Profile Configs
- \`logger.config.json\` - All profiles in one file
- \`.loggerrc.json\` - Alternative name (same content)
- \`logging.json\` - Alternative name (same content)

### Minimal Configs
- \`minimal.development.json\` - Minimal dev config
- \`minimal.production.json\` - Minimal prod config
- \`minimal.test.json\` - Minimal test config

### Special Test Configs
- \`formatter-only.json\` - Only formatter settings
- \`custom-transports.json\` - Custom transport setup
- \`invalid.json\` - Invalid JSON for error testing

## Usage

1. Copy the desired config file to one of these locations:
   - Project root directory
   - \`config/\` directory
   - \`src/\` directory
   - \`src/config/\` directory
   - \`src/logging/\` directory

2. The ConfigManager will automatically find and load the config.

3. Or specify explicitly:
   \`\`\`javascript
   const logger = new Logger({
     configFile: './test-configs/logger.config.json'
   });
   \`\`\`
`;

    fs.writeFileSync(path.join(outputDir, 'README.md'), readmeContent);
    console.log('📄 Created README.md in test-configs directory\n');

    console.log('✅ Configuration files generated successfully!\n');
    console.log(`👉 Check the "${outputDir}" directory for all generated files.`);
}

// Run the generator
if (require.main === module) {
    generateConfigs();
}

module.exports = { configs, multiProfileConfig, minimalConfigs };
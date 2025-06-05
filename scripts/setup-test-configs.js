// scripts/setup-test-configs.js
const fs = require('fs');
const path = require('path');

/**
 * Script to create test configuration files for different profiles
 * Run with: node scripts/setup-test-configs.js [profile]
 */

const profiles = {
    development: {
        application: {
            name: 'my-app-dev',
            env: 'development',
            debug: true,
            port: 3000,
            host: 'localhost',
            database: {
                host: 'localhost',
                port: 5432,
                name: 'dev_db',
                user: 'dev_user',
                password: 'dev_password',
                logging: true
            },
            cache: {
                enabled: false
            },
            api: {
                version: 'v1',
                prefix: '/api',
                timeout: 30000
            }
        },
        logger: {
            level: 'debug',
            format: 'pretty',
            transports: ['console'],
            colorize: true,
            timestamp: true,
            timestampFormat: 'HH:mm:ss.SSS',
            prettyPrint: true,
            handleExceptions: true,
            handleRejections: true
        }
    },
    dev: {
        application: {
            name: 'my-app-dev',
            env: 'dev',
            debug: true,
            port: 3000,
            host: 'localhost',
            database: {
                host: 'localhost',
                port: 5432,
                name: 'dev_db',
                user: 'dev_user',
                password: 'dev_password',
                logging: true
            },
            cache: {
                enabled: false
            },
            api: {
                version: 'v1',
                prefix: '/api',
                timeout: 30000
            }
        },
        logger: {
            level: 'debug',
            format: 'pretty',
            transports: ['console'],
            colorize: true,
            timestamp: true,
            timestampFormat: 'HH:mm:ss.SSS',
            prettyPrint: true,
            handleExceptions: true,
            handleRejections: true
        }
    },
    test: {
        application: {
            name: 'my-app-test',
            env: 'test',
            debug: false,
            port: 4000,
            host: 'localhost',
            database: {
                host: 'localhost',
                port: 5432,
                name: 'test_db',
                user: 'test_user',
                password: 'test_password',
                logging: false
            },
            cache: {
                enabled: false
            },
            api: {
                version: 'v1',
                prefix: '/api',
                timeout: 5000
            }
        },
        logger: {
            level: 'error',
            format: 'json',
            transports: ['console'],
            colorize: false,
            timestamp: true,
            timestampFormat: 'YYYY-MM-DD HH:mm:ss',
            silent: process.env.SILENT_LOGS === 'true',
            handleExceptions: false,
            handleRejections: false
        }
    },
    staging: {
        application: {
            name: 'my-app-staging',
            env: 'staging',
            debug: false,
            port: 3001,
            host: '0.0.0.0',
            database: {
                host: process.env.DB_HOST || 'staging-db.example.com',
                port: 5432,
                name: 'staging_db',
                user: process.env.DB_USER || 'staging_user',
                password: process.env.DB_PASSWORD || 'staging_password',
                logging: false,
                ssl: true
            },
            cache: {
                enabled: true,
                ttl: 3600
            },
            api: {
                version: 'v1',
                prefix: '/api',
                timeout: 15000,
                rateLimit: {
                    windowMs: 900000,
                    max: 100
                }
            }
        },
        logger: {
            level: 'info',
            format: 'json',
            transports: ['console', 'file'],
            colorize: false,
            timestamp: true,
            timestampFormat: 'YYYY-MM-DD HH:mm:ss',
            filename: 'logs/staging.log',
            maxsize: 5242880,
            maxFiles: 5,
            handleExceptions: true,
            handleRejections: true
        }
    },
    production: {
        application: {
            name: 'my-app-prod',
            env: 'production',
            debug: false,
            port: process.env.PORT || 8080,
            host: '0.0.0.0',
            database: {
                host: process.env.DB_HOST || 'prod-db.example.com',
                port: 5432,
                name: 'prod_db',
                user: process.env.DB_USER || 'prod_user',
                password: process.env.DB_PASSWORD || 'prod_password',
                logging: false,
                ssl: true,
                pool: {
                    min: 2,
                    max: 10
                }
            },
            cache: {
                enabled: true,
                ttl: 7200,
                redis: {
                    host: process.env.REDIS_HOST || 'redis.example.com',
                    port: 6379
                }
            },
            api: {
                version: 'v1',
                prefix: '/api',
                timeout: 10000,
                rateLimit: {
                    windowMs: 900000,
                    max: 50
                }
            }
        },
        logger: {
            level: 'info',
            format: 'json',
            transports: ['file'],
            colorize: false,
            timestamp: true,
            timestampFormat: 'YYYY-MM-DD HH:mm:ss',
            filename: 'logs/production.log',
            maxsize: 5242880,
            maxFiles: 10,
            handleExceptions: true,
            handleRejections: true,
            exitOnError: false
        }
    },
    prod: {
        application: {
            name: 'my-app-prod',
            env: 'prod',
            debug: false,
            port: process.env.PORT || 8080,
            host: '0.0.0.0',
            database: {
                host: process.env.DB_HOST || 'prod-db.example.com',
                port: 5432,
                name: 'prod_db',
                user: process.env.DB_USER || 'prod_user',
                password: process.env.DB_PASSWORD || 'prod_password',
                logging: false,
                ssl: true,
                pool: {
                    min: 2,
                    max: 10
                }
            },
            cache: {
                enabled: true,
                ttl: 7200,
                redis: {
                    host: process.env.REDIS_HOST || 'redis.example.com',
                    port: 6379
                }
            },
            api: {
                version: 'v1',
                prefix: '/api',
                timeout: 10000,
                rateLimit: {
                    windowMs: 900000,
                    max: 50
                }
            }
        },
        logger: {
            level: 'info',
            format: 'json',
            transports: ['file'],
            colorize: false,
            timestamp: true,
            timestampFormat: 'YYYY-MM-DD HH:mm:ss',
            filename: 'logs/production.log',
            maxsize: 5242880,
            maxFiles: 10,
            handleExceptions: true,
            handleRejections: true,
            exitOnError: false
        }
    },
    qa: {
        application: {
            name: 'my-app-qa',
            env: 'qa',
            debug: true,
            port: 3002,
            host: 'localhost',
            database: {
                host: process.env.DB_HOST || 'qa-db.example.com',
                port: 5432,
                name: 'qa_db',
                user: process.env.DB_USER || 'qa_user',
                password: process.env.DB_PASSWORD || 'qa_password',
                logging: true
            },
            cache: {
                enabled: true,
                ttl: 1800
            },
            api: {
                version: 'v1',
                prefix: '/api',
                timeout: 20000,
                enableSwagger: true
            }
        },
        logger: {
            level: 'debug',
            format: 'json',
            transports: ['console', 'file'],
            colorize: false,
            timestamp: true,
            timestampFormat: 'YYYY-MM-DD HH:mm:ss.SSS',
            filename: 'logs/qa.log',
            maxsize: 10485760,
            maxFiles: 3,
            handleExceptions: true,
            handleRejections: true
        }
    }
};

// Get profile from command line or environment
const targetProfile = process.argv[2] || process.env.TEST_PROFILE || 'all';

// Get root directory (assuming this script is in scripts/ folder)
const rootDir = path.resolve(__dirname, '..');

console.log(`Setting up configuration files in: ${rootDir}`);
console.log(`Target profile: ${targetProfile}`);

function createConfigFile(profile, configType, config) {
    const filename = `${configType}.${profile}.json`;
    const filepath = path.join(rootDir, filename);

    // Check if file already exists
    if (fs.existsSync(filepath)) {
        console.log(`⚠️  ${filename} already exists. Skipping...`);
        return false;
    }

    // Write config file
    fs.writeFileSync(filepath, JSON.stringify(config, null, 2));
    console.log(`✅ Created ${filename}`);
    return true;
}

function setupProfile(profile) {
    if (!profiles[profile]) {
        console.error(`❌ Unknown profile: ${profile}`);
        console.log(`Available profiles: ${Object.keys(profiles).join(', ')}`);
        return;
    }

    console.log(`\nSetting up ${profile} configuration files...`);

    const config = profiles[profile];
    createConfigFile(profile, 'application', config.application);
    createConfigFile(profile, 'logger', config.logger);
}

// Main execution
if (targetProfile === 'all') {
    console.log('Creating configuration files for all profiles...');
    Object.keys(profiles).forEach(profile => {
        setupProfile(profile);
    });
} else {
    setupProfile(targetProfile);
}

console.log('\n✅ Configuration setup complete!');
console.log('\nTo run tests with a specific profile:');
console.log('  TEST_PROFILE=development npm test');
console.log('  TEST_PROFILE=production npm test');
console.log('  TEST_PROFILE=test npm test');
console.log('\nTo clean up test configs:');
console.log('  node scripts/setup-test-configs.js clean');
// tests/config/ConfigManager.test.js
const { describe, it, before, after, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const ConfigManager = require('../../src/config/ConfigManager');
const fs = require('fs');
const path = require('path');

const TEST_PROFILE = process.env.TEST_PROFILE || 'test';

describe('ConfigManager Tests', () => {
    let rootDir;
    let originalConfigs = {};
    let testConfigsCreated = false;

    before(() => {
        console.log('\n=== ConfigManager Test Setup ===');
        console.log(`Test Profile: ${TEST_PROFILE}`);

        rootDir = ConfigManager.getRootDirectory();
        console.log(`Root Directory: ${rootDir}`);

        // Backup existing configs if they exist
        const appConfigPath = path.join(rootDir, `application.${TEST_PROFILE}.json`);
        const loggerConfigPath = path.join(rootDir, `logger.${TEST_PROFILE}.json`);

        if (fs.existsSync(appConfigPath)) {
            originalConfigs.application = fs.readFileSync(appConfigPath, 'utf8');
            console.log('Backed up existing application config');
        }

        if (fs.existsSync(loggerConfigPath)) {
            originalConfigs.logger = fs.readFileSync(loggerConfigPath, 'utf8');
            console.log('Backed up existing logger config');
        }

        // Create test configs if they don't exist
        if (!fs.existsSync(appConfigPath)) {
            const appConfig = {
                name: 'test-app',
                env: TEST_PROFILE,
                port: 3000,
                debug: TEST_PROFILE === 'development'
            };
            fs.writeFileSync(appConfigPath, JSON.stringify(appConfig, null, 2));
            testConfigsCreated = true;
            console.log('Created test application config');
        }

        if (!fs.existsSync(loggerConfigPath)) {
            const loggerConfig = {
                level: TEST_PROFILE === 'production' ? 'info' : 'debug',
                format: 'json',
                transports: ['console']
            };
            fs.writeFileSync(loggerConfigPath, JSON.stringify(loggerConfig, null, 2));
            testConfigsCreated = true;
            console.log('Created test logger config');
        }

        console.log('=== Setup Complete ===\n');
    });

    after(() => {
        console.log('\n=== ConfigManager Test Cleanup ===');

        // Restore original configs or clean up test configs
        const appConfigPath = path.join(rootDir, `application.${TEST_PROFILE}.json`);
        const loggerConfigPath = path.join(rootDir, `logger.${TEST_PROFILE}.json`);

        if (originalConfigs.application) {
            fs.writeFileSync(appConfigPath, originalConfigs.application);
            console.log('Restored original application config');
        } else if (testConfigsCreated && fs.existsSync(appConfigPath)) {
            fs.unlinkSync(appConfigPath);
            console.log('Removed test application config');
        }

        if (originalConfigs.logger) {
            fs.writeFileSync(loggerConfigPath, originalConfigs.logger);
            console.log('Restored original logger config');
        } else if (testConfigsCreated && fs.existsSync(loggerConfigPath)) {
            fs.unlinkSync(loggerConfigPath);
            console.log('Removed test logger config');
        }

        ConfigManager.cleanup();
        console.log('=== Cleanup Complete ===\n');
    });

    beforeEach(() => {
        // Clear cache before each test
        ConfigManager._configCache.clear();
        console.log('\n--- Test Started ---');
    });

    afterEach(() => {
        console.log('--- Test Completed ---\n');
    });

    describe('Loading Configurations', () => {
        it('should load application config', () => {
            console.log('\nTEST: Loading application config');

            const result = ConfigManager.loadApplicationConfig(TEST_PROFILE);

            assert(result);
            assert.strictEqual(result.profile, TEST_PROFILE);
            assert.strictEqual(result.configType, 'application');
            assert(result.config);
            assert(result.configFile);

            console.log('✅ Application config loaded successfully');
        });

        it('should load logger config', () => {
            console.log('\nTEST: Loading logger config');

            const result = ConfigManager.loadLoggerConfig(TEST_PROFILE);

            assert(result);
            assert.strictEqual(result.profile, TEST_PROFILE);
            assert.strictEqual(result.configType, 'logger');
            assert(result.config);
            assert(result.config.level);

            console.log('✅ Logger config loaded successfully');
        });

        it('should load config from cache on second call', () => {
            console.log('\nTEST: Cache functionality');

            // First load
            console.log('First load (should read from file):');
            const result1 = ConfigManager.loadApplicationConfig(TEST_PROFILE);

            // Second load
            console.log('\nSecond load (should use cache):');
            const result2 = ConfigManager.loadApplicationConfig(TEST_PROFILE);

            assert.strictEqual(result1, result2);
            console.log('✅ Cache working correctly');
        });

        it('should bypass cache with noCache option', () => {
            console.log('\nTEST: Bypass cache with noCache');

            // Load and cache
            const result1 = ConfigManager.loadApplicationConfig(TEST_PROFILE);

            // Load with noCache
            console.log('\nLoading with noCache option:');
            const result2 = ConfigManager.loadApplicationConfig(TEST_PROFILE, { noCache: true });

            assert.notStrictEqual(result1, result2);
            assert.deepStrictEqual(result1.config, result2.config);
            console.log('✅ Cache bypassed successfully');
        });

        it('should load all configs', () => {
            console.log('\nTEST: Load all configs');

            const result = ConfigManager.loadAllConfigs(TEST_PROFILE);

            assert(result.application);
            assert(result.logger);
            assert.strictEqual(result.application.profile, TEST_PROFILE);
            assert.strictEqual(result.logger.profile, TEST_PROFILE);

            console.log('✅ All configs loaded successfully');
        });

        it('should apply runtime overrides', () => {
            console.log('\nTEST: Runtime overrides');

            const overrides = {
                port: 9999,
                customField: 'test-value'
            };

            const result = ConfigManager.loadApplicationConfig(TEST_PROFILE, overrides);

            assert.strictEqual(result.config.port, 9999);
            assert.strictEqual(result.config.customField, 'test-value');

            console.log('✅ Overrides applied successfully');
        });
    });

    describe('Error Handling', () => {
        it('should throw error for invalid config type', () => {
            console.log('\nTEST: Invalid config type');

            assert.throws(() => {
                ConfigManager.loadConfig('invalid', TEST_PROFILE);
            }, /Invalid config type/);

            console.log('✅ Correctly threw error for invalid config type');
        });

        it('should throw error for non-existent config file', () => {
            console.log('\nTEST: Non-existent config file');

            assert.throws(() => {
                ConfigManager.loadApplicationConfig('nonexistent-profile');
            }, /Configuration file not found/);

            console.log('✅ Correctly threw error for missing config');
        });

        it('should throw error for invalid JSON', () => {
            console.log('\nTEST: Invalid JSON handling');

            const badConfigPath = path.join(rootDir, `application.badjson.json`);
            fs.writeFileSync(badConfigPath, '{ invalid json }');

            try {
                assert.throws(() => {
                    ConfigManager.loadApplicationConfig('badjson');
                }, /Invalid JSON/);

                console.log('✅ Correctly threw error for invalid JSON');
            } finally {
                fs.unlinkSync(badConfigPath);
            }
        });
    });

    describe('File Watching', () => {
        it('should setup file watcher', async () => {
            console.log('\nTEST: File watcher setup');

            const watchPromise = new Promise((resolve, reject) => {
                try {
                    const watcher = ConfigManager.watchConfig('logger', TEST_PROFILE, (err, config) => {
                        if (err) {
                            console.log('[Watcher] Error:', err.message);
                            reject(err);
                        } else {
                            console.log('[Watcher] Config changed detected');
                            resolve(config);
                        }
                    });

                    assert(watcher);
                    console.log('✅ Watcher created successfully');

                    // Don't wait for file changes in test
                    ConfigManager.unwatchConfig('logger', TEST_PROFILE);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });

            await watchPromise;
        });

        it('should not create duplicate watchers', () => {
            console.log('\nTEST: Duplicate watcher prevention');

            const watcher1 = ConfigManager.watchConfig('application', TEST_PROFILE, () => {});
            const watcher2 = ConfigManager.watchConfig('application', TEST_PROFILE, () => {});

            assert.strictEqual(watcher1, watcher2);
            assert.strictEqual(ConfigManager._watchers.size, 1);

            ConfigManager.unwatchConfig('application', TEST_PROFILE);
            console.log('✅ Duplicate watcher prevention working');
        });
    });

    describe('Utility Methods', () => {
        it('should get config info', () => {
            console.log('\nTEST: Get config info');

            const info = ConfigManager.getConfigInfo('application', TEST_PROFILE);

            assert(info);
            assert.strictEqual(info.success, true);
            assert.strictEqual(info.profile, TEST_PROFILE);
            assert.strictEqual(info.configType, 'application');
            assert(info.configFile);

            console.log('✅ Config info retrieved successfully');
        });

        it('should validate config files', () => {
            console.log('\nTEST: Validate config files');

            const validation = ConfigManager.validateConfigFiles(TEST_PROFILE);

            assert(validation);
            assert.strictEqual(validation.valid, true);
            assert.strictEqual(validation.profile, TEST_PROFILE);
            assert(validation.files.application.exists);
            assert(validation.files.logger.exists);

            console.log('✅ Config validation successful');
        });

        it('should merge configs correctly', () => {
            console.log('\nTEST: Config merging');

            const base = {
                a: 1,
                b: { c: 2, d: 3 },
                e: [1, 2, 3]
            };

            const override = {
                a: 10,
                b: { c: 20, f: 4 },
                e: [4, 5]
            };

            const result = ConfigManager.mergeConfig(base, override);

            assert.strictEqual(result.a, 10);
            assert.strictEqual(result.b.c, 20);
            assert.strictEqual(result.b.d, 3);
            assert.strictEqual(result.b.f, 4);
            assert.deepStrictEqual(result.e, [4, 5]);

            console.log('✅ Config merging working correctly');
        });
    });

    describe('Cleanup', () => {
        it('should cleanup resources', () => {
            console.log('\nTEST: Cleanup functionality');

            // Add some data to clean
            ConfigManager.loadApplicationConfig(TEST_PROFILE);
            ConfigManager.loadLoggerConfig(TEST_PROFILE);
            ConfigManager.watchConfig('application', TEST_PROFILE, () => {});

            assert(ConfigManager._configCache.size > 0);
            assert(ConfigManager._watchers.size > 0);

            ConfigManager.cleanup();

            assert.strictEqual(ConfigManager._configCache.size, 0);
            assert.strictEqual(ConfigManager._watchers.size, 0);

            console.log('✅ Cleanup completed successfully');
        });
    });
});
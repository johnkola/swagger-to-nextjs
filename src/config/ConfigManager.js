// src/config/ConfigManager.js
const fs = require('fs');
const path = require('path');

/**
 * Centralized configuration management for application and logger configs
 */
class ConfigManager {
    static CONFIG_TYPES = {
        APPLICATION: 'application',
        LOGGER: 'logger'
    };

    static _configCache = new Map();
    static _watchers = new Map();

    /**
     * Check if logging should be enabled
     */
    static _shouldLog(options = {}) {
        // Don't log if explicitly silenced
        if (options.silent) return false;

        // Don't log in test environment unless verbose logging is enabled
        if (process.env.NODE_ENV === 'test' && process.env.VERBOSE_TEST_LOGS !== 'true') {
            return false;
        }

        // Don't log if global quiet mode is enabled
        if (process.env.QUIET_CONFIG_LOGS === 'true') {
            return false;
        }

        return true;
    }

    /**
     * Get the root directory (../../ from current file location)
     */
    static getRootDirectory() {
        // Assuming this file is in src/config/, go up two levels to reach root
        return path.resolve(__dirname, '..', '..');
    }

    /**
     * Load configuration for a specific type and profile
     * @param {string} configType - Type of config ('application' or 'logger')
     * @param {string} profile - Environment profile (development, production, test, etc.)
     * @param {Object} options - Override options
     * @returns {Object} Configuration object
     */
    static loadConfig(configType, profile = process.env.NODE_ENV || 'development', options = {}) {
        const shouldLog = this._shouldLog(options);

        if (shouldLog) {
            console.log('\n========================================');
            console.log('[ConfigManager] LOADING CONFIGURATION');
            console.log('========================================');
            console.log(`Type: ${configType}`);
            console.log(`Profile: ${profile}`);
            console.log(`Options:`, options);
        }

        if (!this.CONFIG_TYPES[configType.toUpperCase()]) {
            const error = `Invalid config type: ${configType}. Must be 'application' or 'logger'`;
            if (shouldLog) console.error(`[ConfigManager] ❌ ${error}`);
            throw new Error(error);
        }

        const cacheKey = `${configType}-${profile}-${JSON.stringify(options)}`;

        // Return cached config if available and not explicitly disabled
        if (this._configCache.has(cacheKey) && !options.noCache) {
            if (shouldLog) {
                console.log(`[ConfigManager] ✅ Returning CACHED config for: ${configType}.${profile}`);
                console.log(`[ConfigManager] Cache key: ${cacheKey}`);
                console.log('========================================\n');
            }
            return this._configCache.get(cacheKey);
        }

        // Build the expected filename
        const rootDir = this.getRootDirectory();
        const filename = `${configType}.${profile}.json`;
        const configPath = path.join(rootDir, filename);

        if (shouldLog) {
            console.log(`[ConfigManager] 📂 Root directory: ${rootDir}`);
            console.log(`[ConfigManager] 📄 Looking for file: ${filename}`);
            console.log(`[ConfigManager] 📍 Full path: ${configPath}`);
        }

        // Check if file exists
        if (!fs.existsSync(configPath)) {
            if (shouldLog) {
                console.error(`[ConfigManager] ❌ FILE NOT FOUND: ${configPath}`);
                console.log('========================================\n');
            }
            throw new Error(
                `Configuration file not found: ${filename}\n` +
                `Expected location: ${configPath}\n` +
                `Profile: ${profile}, Type: ${configType}`
            );
        }

        if (shouldLog) console.log(`[ConfigManager] ✅ File exists, reading...`);

        try {
            const fileContent = fs.readFileSync(configPath, 'utf8');
            if (shouldLog) console.log(`[ConfigManager] 📖 File read successfully, size: ${fileContent.length} bytes`);

            let config = JSON.parse(fileContent);
            if (shouldLog) {
                console.log(`[ConfigManager] ✅ JSON parsed successfully`);
                console.log(`[ConfigManager] Config keys:`, Object.keys(config));
            }

            // Apply runtime overrides if provided
            if (options && Object.keys(options).length > 0) {
                const { noCache, silent, ...overrides } = options;
                if (Object.keys(overrides).length > 0) {
                    if (shouldLog) console.log(`[ConfigManager] 🔧 Applying runtime overrides:`, overrides);
                    config = this.mergeConfig(config, overrides);
                }
            }

            // Log successful load
            if (shouldLog) {
                console.log(`[ConfigManager] ✅ Successfully loaded ${configType} config`);
                console.log(`[ConfigManager] Profile: ${profile}`);
                console.log(`[ConfigManager] Path: ${configPath}`);

                // Show config preview (first level only)
                console.log(`[ConfigManager] Config preview:`, {
                    ...Object.keys(config).reduce((acc, key) => {
                        acc[key] = typeof config[key] === 'object' ?
                            `[${typeof config[key]}]` :
                            config[key];
                        return acc;
                    }, {})
                });
            }

            // Cache the result
            const result = {
                profile,
                configType,
                configFile: configPath,
                config
            };
            this._configCache.set(cacheKey, result);

            if (shouldLog) {
                console.log(`[ConfigManager] 💾 Config cached with key: ${cacheKey}`);
                console.log('========================================\n');
            }

            return result;
        } catch (error) {
            if (shouldLog) {
                console.error(`[ConfigManager] ❌ ERROR loading config: ${error.message}`);
                console.log('========================================\n');
            }

            if (error.code === 'ENOENT') {
                throw new Error(
                    `Configuration file not found: ${filename}\n` +
                    `Expected location: ${configPath}\n` +
                    `Profile: ${profile}, Type: ${configType}`
                );
            } else if (error instanceof SyntaxError) {
                throw new Error(
                    `Invalid JSON in configuration file: ${filename}\n` +
                    `Location: ${configPath}\n` +
                    `Error: ${error.message}`
                );
            } else {
                throw new Error(
                    `Failed to load configuration file: ${filename}\n` +
                    `Location: ${configPath}\n` +
                    `Error: ${error.message}`
                );
            }
        }
    }

    /**
     * Load application configuration
     * @param {string} profile - Environment profile
     * @param {Object} options - Override options
     * @returns {Object} Application configuration
     */
    static loadApplicationConfig(profile = process.env.NODE_ENV || 'development', options = {}) {
        if (this._shouldLog(options)) {
            console.log(`\n[ConfigManager] 🔷 Loading APPLICATION config...`);
        }
        return this.loadConfig(this.CONFIG_TYPES.APPLICATION, profile, options);
    }

    /**
     * Load logger configuration
     * @param {string} profile - Environment profile
     * @param {Object} options - Override options
     * @returns {Object} Logger configuration
     */
    static loadLoggerConfig(profile = process.env.NODE_ENV || 'development', options = {}) {
        if (this._shouldLog(options)) {
            console.log(`\n[ConfigManager] 🔶 Loading LOGGER config...`);
        }
        return this.loadConfig(this.CONFIG_TYPES.LOGGER, profile, options);
    }

    /**
     * Load both application and logger configurations
     * @param {string} profile - Environment profile
     * @param {Object} options - Override options
     * @returns {Object} Both configurations
     */
    static loadAllConfigs(profile = process.env.NODE_ENV || 'development', options = {}) {
        if (this._shouldLog(options)) {
            console.log(`\n[ConfigManager] 🔄 Loading ALL configs for profile: ${profile}`);
        }
        return {
            application: this.loadApplicationConfig(profile, options.application || {}),
            logger: this.loadLoggerConfig(profile, options.logger || {})
        };
    }

    /**
     * Deep merge configurations
     */
    static mergeConfig(base, override) {
        const result = { ...base };

        for (const key in override) {
            if (override[key] === null || override[key] === undefined) {
                continue;
            }

            if (Array.isArray(override[key])) {
                result[key] = [...override[key]];
            } else if (typeof override[key] === 'object' && !Array.isArray(override[key])) {
                result[key] = this.mergeConfig(result[key] || {}, override[key]);
            } else {
                result[key] = override[key];
            }
        }

        return result;
    }

    /**
     * Watch a configuration file for changes
     * @param {string} configType - Type of config ('application' or 'logger')
     * @param {string} profile - Environment profile
     * @param {Function} callback - Callback function when config changes
     */
    static watchConfig(configType, profile, callback) {
        const rootDir = this.getRootDirectory();
        const filename = `${configType}.${profile}.json`;
        const configPath = path.join(rootDir, filename);
        const shouldLog = this._shouldLog();

        if (shouldLog) {
            console.log(`\n[ConfigManager] 👁️  Setting up file watcher...`);
            console.log(`[ConfigManager] Watching: ${filename}`);
            console.log(`[ConfigManager] Path: ${configPath}`);
        }

        if (!fs.existsSync(configPath)) {
            const error = `Cannot watch non-existent config file: ${configPath}`;
            if (shouldLog) console.error(`[ConfigManager] ❌ ${error}`);
            throw new Error(error);
        }

        const watchKey = `${configType}-${profile}`;

        // Don't create duplicate watchers
        if (this._watchers.has(watchKey)) {
            if (shouldLog) console.log(`[ConfigManager] ⚠️  Watcher already exists for: ${watchKey}`);
            return this._watchers.get(watchKey).watcher;
        }

        let debounceTimer;

        const watcher = fs.watch(configPath, (eventType) => {
            if (eventType === 'change') {
                if (shouldLog) console.log(`[ConfigManager] 🔄 Change detected in: ${filename}`);

                // Debounce rapid changes
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    try {
                        if (shouldLog) console.log(`[ConfigManager] 📖 Reloading config: ${filename}`);

                        // Clear cache for this specific config
                        const cacheKeys = Array.from(this._configCache.keys());
                        cacheKeys.forEach(key => {
                            if (key.startsWith(`${configType}-${profile}`)) {
                                if (shouldLog) console.log(`[ConfigManager] 🗑️  Clearing cache: ${key}`);
                                this._configCache.delete(key);
                            }
                        });

                        const content = fs.readFileSync(configPath, 'utf8');
                        const config = JSON.parse(content);
                        if (shouldLog) console.log(`[ConfigManager] ✅ Config reloaded successfully`);
                        callback(null, config, configPath);
                    } catch (error) {
                        if (shouldLog) console.error(`[ConfigManager] ❌ Error reloading config: ${error.message}`);
                        callback(error, null, configPath);
                    }
                }, 500);
            }
        });

        this._watchers.set(watchKey, { watcher, configPath });
        if (shouldLog) console.log(`[ConfigManager] ✅ Watcher created for: ${watchKey}\n`);
        return watcher;
    }

    /**
     * Stop watching a config file
     * @param {string} configType - Type of config ('application' or 'logger')
     * @param {string} profile - Environment profile
     */
    static unwatchConfig(configType, profile) {
        const watchKey = `${configType}-${profile}`;
        const watcherInfo = this._watchers.get(watchKey);
        if (watcherInfo) {
            watcherInfo.watcher.close();
            this._watchers.delete(watchKey);
        }
    }

    /**
     * Clear all caches and watchers
     */
    static cleanup() {
        const shouldLog = this._shouldLog();

        if (shouldLog) {
            console.log('\n[ConfigManager] 🧹 Cleaning up...');
            console.log(`[ConfigManager] Clearing ${this._configCache.size} cached configs`);
            console.log(`[ConfigManager] Closing ${this._watchers.size} file watchers`);
        }

        this._configCache.clear();
        this._watchers.forEach(({ watcher, configPath }, key) => {
            if (shouldLog) console.log(`[ConfigManager] Closing watcher for: ${key}`);
            watcher.close();
        });
        this._watchers.clear();

        if (shouldLog) console.log('[ConfigManager] ✅ Cleanup complete\n');
    }

    /**
     * Get configuration info for debugging
     * @param {string} configType - Type of config ('application' or 'logger')
     * @param {string} profile - Environment profile
     */
    static getConfigInfo(configType, profile) {
        try {
            const result = this.loadConfig(configType, profile, { silent: true });
            return {
                success: true,
                profile: result.profile,
                configType: result.configType,
                configFile: result.configFile,
                exists: true
            };
        } catch (error) {
            const rootDir = this.getRootDirectory();
            const filename = `${configType}.${profile}.json`;
            const configPath = path.join(rootDir, filename);

            return {
                success: false,
                profile,
                configType,
                expectedFile: filename,
                expectedPath: configPath,
                exists: false,
                error: error.message
            };
        }
    }

    /**
     * Validate that all required config files exist for a profile
     * @param {string} profile - Environment profile
     * @returns {Object} Validation result
     */
    static validateConfigFiles(profile) {
        const rootDir = this.getRootDirectory();
        const results = {
            valid: true,
            profile,
            rootDirectory: rootDir,
            files: {}
        };

        const configTypes = ['application', 'logger'];

        for (const configType of configTypes) {
            const filename = `${configType}.${profile}.json`;
            const configPath = path.join(rootDir, filename);
            const exists = fs.existsSync(configPath);

            results.files[configType] = {
                filename,
                path: configPath,
                exists
            };

            if (!exists) {
                results.valid = false;
            }
        }

        return results;
    }

    /**
     * Clear all cached configurations
     */
    static clearCache() {
        const shouldLog = this._shouldLog();

        if (shouldLog) {
            console.log(`\n[ConfigManager] 🗑️  Clearing all cached configurations...`);
        }

        const cacheSize = this._configCache.size;
        this._configCache.clear();

        if (shouldLog) {
            console.log(`[ConfigManager] ✅ Cleared ${cacheSize} cached entries\n`);
        }
    }

    /**
     * Clear cache for specific config type and profile
     */
    static clearSpecificCache(configType, profile) {
        const shouldLog = this._shouldLog();

        if (shouldLog) {
            console.log(`\n[ConfigManager] 🗑️  Clearing cache for ${configType}.${profile}...`);
        }

        let cleared = 0;

        const cacheKeys = Array.from(this._configCache.keys());
        cacheKeys.forEach(key => {
            if (key.startsWith(`${configType}-${profile}`)) {
                this._configCache.delete(key);
                if (shouldLog) console.log(`[ConfigManager] Deleted cache key: ${key}`);
                cleared++;
            }
        });

        if (shouldLog) {
            console.log(`[ConfigManager] ✅ Cleared ${cleared} cache entries\n`);
        }

        return cleared;
    }

    /**
     * Get cache statistics
     */
    static getCacheStats() {
        const stats = {
            totalEntries: this._configCache.size,
            entries: [],
            sizeEstimate: 0
        };

        this._configCache.forEach((value, key) => {
            const size = JSON.stringify(value).length;
            stats.entries.push({
                key,
                type: value.configType,
                profile: value.profile,
                sizeBytes: size
            });
            stats.sizeEstimate += size;
        });

        return stats;
    }
}

module.exports = ConfigManager;
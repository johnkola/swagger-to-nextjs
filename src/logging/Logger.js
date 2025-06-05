// src/logging/Logger.js
const winston = require('winston');
const path = require('path');
const fs = require('fs');
const { EventEmitter } = require('events');
const ConfigManager = require('../config/ConfigManager');
const LogFormatter = require('./LogFormatter');

/**
 * Winston-based logger with ConfigManager integration
 */
class Logger extends EventEmitter {
    constructor(options = {}) {
        super();

        // Determine profile
        this.profile = options.profile || process.env.NODE_ENV || 'development';

        try {
            // Load logger configuration via ConfigManager
            const configResult = ConfigManager.loadLoggerConfig(this.profile, options);

            this.config = configResult.config;
            this.configFile = configResult.configFile;
            this.configType = configResult.configType;
            this.configSource = 'file';

            // Create Winston logger
            this._winston = this._createWinstonLogger();

            // Setup config watching if enabled
            if (this.config.watchConfig && this.configFile) {
                this._setupConfigWatcher();
            }

            // Bind logging methods
            this._bindMethods();

            // Log initialization info
            if (!options.silent && this.profile !== 'test') {
                console.log(`[Logger] Initialized with logger config for profile: ${this.profile}`);
                console.log(`[Logger] Config file: ${this.configFile}`);
            }

            // Emit ready event
            this.emit('ready', {
                profile: this.profile,
                configFile: this.configFile,
                configType: this.configType,
                level: this.config.level
            });

        } catch (error) {
            // If a config file not found, throw error (as per new requirements)
            console.error(`[Logger] Failed to initialize:`, error.message);
            throw error;
        }
    }

    /**
     * Create Winston logger instance
     */
    _createWinstonLogger() {
        const format = this._createFormat();
        const transports = this._createTransports();

        const logger = winston.createLogger({
            level: this.config.level || 'info',
            format,
            transports,
            exitOnError: this.config.exitOnError !== false,
            silent: this.config.silent || false,
            defaultMeta: this.config.defaultMeta || {}
        });

        // Handle exceptions/rejections
        if (this.config.handleExceptions) {
            logger.exceptions.handle(
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.timestamp(),
                        winston.format.errors({ stack: true }),
                        winston.format.simple()
                    )
                })
            );
        }

        if (this.config.handleRejections) {
            logger.rejections.handle(
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.timestamp(),
                        winston.format.errors({ stack: true }),
                        winston.format.simple()
                    )
                })
            );
        }

        return logger;
    }

    /**
     * Create log format using LogFormatter
     */
    _createFormat() {
        // Get formatter configuration from already-loaded config
        const formatConfig = this.config.formatter || {};

        // If using a preset, use it directly
        if (typeof formatConfig === 'string' && LogFormatter.presets[formatConfig]) {
            return LogFormatter.presets[formatConfig]();
        }

        // Create formatter with config options (no config loading!)
        const formatter = new LogFormatter(formatConfig);
        return formatter.getFormat();
    }

    /**
     * Create transports from configuration
     */
    _createTransports() {
        const transports = [];

        if (!this.config.transports || this.config.transports.length === 0) {
            // Default transport if none specified
            transports.push(new winston.transports.Console({
                format: LogFormatter.createFormatForTransport('console', this.config.formatter || {})
            }));
            return transports;
        }

        this.config.transports.forEach((transportConfig, index) => {
            try {
                const transport = this._createTransport(transportConfig);
                if (transport) {
                    transports.push(transport);
                }
            } catch (error) {
                console.error(`[Logger] Failed to create transport #${index}:`, error.message);
            }
        });

        // Ensure at least one transport
        if (transports.length === 0) {
            console.warn('[Logger] No transports created, adding default console transport');
            transports.push(new winston.transports.Console());
        }

        return transports;
    }

    /**
     * Create individual transport
     */
    _createTransport(config) {
        if (!config || !config.type) {
            throw new Error('Transport configuration must include type');
        }

        const { type, format: transportFormat, ...options } = config;

        // Create transport-specific format if specified
        let format;
        if (transportFormat) {
            if (typeof transportFormat === 'string' && LogFormatter.presets[transportFormat]) {
                // Use preset
                format = LogFormatter.presets[transportFormat]();
            } else {
                // Merge formatter config with transport-specific format
                const formatOptions = typeof transportFormat === 'object'
                    ? { ...this.config.formatter, ...transportFormat }
                    : { ...this.config.formatter, format: transportFormat };

                format = new LogFormatter(formatOptions).getFormat();
            }
        } else {
            // Use default format for transport type, passing formatter config
            format = LogFormatter.createFormatForTransport(type, this.config.formatter || {});
        }

        switch (type) {
            case 'console':
                return new winston.transports.Console({
                    level: options.level || this.config.level,
                    format,
                    ...options
                });

            case 'file':
                // Ensure log directory exists
                const logDir = options.dirname || path.dirname(options.filename || './logs/app.log');
                if (!fs.existsSync(logDir)) {
                    fs.mkdirSync(logDir, { recursive: true });
                }

                return new winston.transports.File({
                    filename: 'app.log',
                    dirname: './logs',
                    maxsize: 5242880, // 5MB
                    maxFiles: 5,
                    level: options.level || this.config.level,
                    format,
                    ...options
                });

            case 'http':
                return new winston.transports.Http({
                    host: 'localhost',
                    port: 3000,
                    path: '/logs',
                    level: options.level || this.config.level,
                    format,
                    ...options
                });

            case 'stream':
                if (!options.stream) {
                    throw new Error('Stream transport requires stream option');
                }
                return new winston.transports.Stream({
                    stream: options.stream,
                    level: options.level || this.config.level,
                    format,
                    ...options
                });

            default:
                throw new Error(`Unknown transport type: ${type}`);
        }
    }

    /**
     * Setup configuration file watcher
     */
    _setupConfigWatcher() {
        try {
            this._configWatcher = ConfigManager.watchConfig('logger', this.profile, (error, newConfig) => {
                if (error) {
                    this.emit('configError', error);
                    console.error(`[Logger] Config reload error:`, error.message);
                    return;
                }

                try {
                    // Reload logger with new config
                    this.configure(newConfig);

                    this.emit('configReloaded', {
                        configFile: this.configFile,
                        profile: this.profile,
                        config: newConfig
                    });

                    console.log(`[Logger] Configuration reloaded from: ${this.configFile}`);
                } catch (err) {
                    this.emit('configError', err);
                    console.error(`[Logger] Failed to apply new config:`, err.message);
                }
            });
        } catch (error) {
            console.error(`[Logger] Failed to setup config watcher:`, error.message);
        }
    }

    /**
     * Bind logging methods
     */
    _bindMethods() {
        const levels = ['error', 'warn', 'info', 'debug', 'verbose', 'silly'];
        levels.forEach(level => {
            this[level] = this[level].bind(this);
        });
        this.log = this.log.bind(this);
    }

    /**
     * Main logging method with error boundary
     */
    log(level, message, meta = {}) {
        try {
            // Validate inputs
            if (!level || typeof level !== 'string') {
                throw new Error('Log level must be a string');
            }

            if (message === undefined || message === null) {
                message = '';
            }

            // Convert non-object meta to object
            if (typeof meta !== 'object' || meta === null) {
                meta = { data: meta };
            }

            // Log to Winston
            this._winston.log(level, message, meta);

            // Emit event
            this.emit('logged', { level, message, meta, timestamp: new Date() });
        } catch (error) {
            // Fallback to console to avoid losing logs
            console.error('[Logger] Logging error:', error.message);
            console.log(`[${level}] ${message}`, meta);

            // Emit error event
            this.emit('error', error);
        }
    }

    // Convenience methods
    error(message, meta) { return this.log('error', message, meta); }
    warn(message, meta) { return this.log('warn', message, meta); }
    info(message, meta) { return this.log('info', message, meta); }
    debug(message, meta) { return this.log('debug', message, meta); }
    verbose(message, meta) { return this.log('verbose', message, meta); }
    silly(message, meta) { return this.log('silly', message, meta); }

    /**
     * Create child logger with additional context
     */
    child(metadata) {
        const childConfig = {
            ...this.config,
            defaultMeta: {
                ...this.config.defaultMeta,
                ...metadata
            },
            // Don't watch config in child loggers
            watchConfig: false,
            // Silent to avoid duplicate config messages
            silent: true
        };

        // Create a child logger with inherited config
        const childLogger = Object.create(this);
        childLogger.config = childConfig;
        childLogger._winston = this._createWinstonLogger.call({
            config: childConfig,
            profile: this.profile,
            _createFormat: this._createFormat.bind(childLogger),
            _createTransports: this._createTransports.bind(childLogger),
            _createTransport: this._createTransport.bind(childLogger)
        });

        return childLogger;
    }

    /**
     * Update logger configuration
     */
    configure(options) {
        this.config = ConfigManager.mergeConfig(this.config, options);

        // Recreate logger with new config
        if (this._winston) {
            this._winston.close();
        }
        this._winston = this._createWinstonLogger();

        this.emit('configured', {
            options,
            config: this.config
        });
    }

    /**
     * Update log level
     */
    setLevel(level) {
        if (!level || typeof level !== 'string') {
            throw new Error('Level must be a string');
        }

        this.config.level = level;
        this._winston.level = level;

        // Update all transports
        this._winston.transports.forEach(transport => {
            if (transport.level === undefined || transport.level === this.config.level) {
                transport.level = level;
            }
        });

        this.emit('levelChanged', { level });
    }

    /**
     * Get current log level
     */
    getLevel() {
        return this._winston.level;
    }

    /**
     * Add a transport
     */
    addTransport(transportConfig) {
        try {
            const transport = this._createTransport(transportConfig);
            if (transport) {
                this._winston.add(transport);
                this.emit('transportAdded', { type: transportConfig.type });
            }
        } catch (error) {
            console.error('[Logger] Failed to add transport:', error.message);
            throw error;
        }
    }

    /**
     * Remove transport by type
     */
    removeTransport(type) {
        const transports = this._winston.transports;
        const transport = transports.find(t => {
            // Check transport name or constructor name
            return t.name === type ||
                t.constructor.name.toLowerCase().includes(type.toLowerCase());
        });

        if (transport) {
            this._winston.remove(transport);
            this.emit('transportRemoved', { type });
        } else {
            throw new Error(`Transport '${type}' not found`);
        }
    }

    /**
     * Clear all transports
     */
    clearTransports() {
        this._winston.clear();
        this.emit('transportsCleared');
    }

    /**
     * Get configuration info
     */
    getConfigInfo() {
        return {
            profile: this.profile,
            configFile: this.configFile,
            configType: this.configType,
            level: this.config.level,
            transports: this._winston.transports.map(t => ({
                type: t.constructor.name,
                level: t.level || this.config.level
            })),
            formatter: this.config.formatter,
            defaultMeta: this.config.defaultMeta
        };
    }

    /**
     * Profile a section of code
     */
    profile(id, meta) {
        return this._winston.profile(id, meta);
    }

    /**
     * Start a timer
     */
    startTimer() {
        const start = Date.now();
        return {
            done: (message, meta = {}) => {
                const duration = Date.now() - start;
                this.info(message, { ...meta, duration: `${duration}ms`, durationMs: duration });
                return duration;
            }
        };
    }

    /**
     * Query logs (if using a queryable transport)
     */
    query(options) {
        return new Promise((resolve, reject) => {
            this._winston.query(options, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
    }

    /**
     * Get a stream of logs
     */
    stream(options = {}) {
        return this._winston.stream(options);
    }

    /**
     * Check if a level is enabled
     */
    isLevelEnabled(level) {
        const levels = winston.config.npm.levels;
        const loggerLevel = levels[this._winston.level];
        const checkLevel = levels[level];
        return checkLevel <= loggerLevel;
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        // Stop watching config
        if (this._configWatcher) {
            ConfigManager.unwatchConfig('logger', this.profile);
            this._configWatcher = null;
        }

        // Close Winston logger
        if (this._winston) {
            this._winston.close();
        }

        // Remove all event listeners
        this.removeAllListeners();

        this.emit('cleanup');
    }

    /**
     * Static factory methods
     */
    static createLogger(options) {
        return new Logger(options);
    }

    /**
     * Get or create a named logger
     */
    static getLogger(name, options = {}) {
        if (!Logger._instances) {
            Logger._instances = new Map();
        }

        const key = `${name}-${options.profile || process.env.NODE_ENV || 'development'}`;

        if (!Logger._instances.has(key)) {
            Logger._instances.set(key, new Logger({
                ...options,
                defaultMeta: {
                    logger: name,
                    ...options.defaultMeta
                }
            }));
        }

        return Logger._instances.get(key);
    }

    /**
     * Clear all logger instances
     */
    static clearLoggers() {
        if (Logger._instances) {
            Logger._instances.forEach(logger => logger.cleanup());
            Logger._instances.clear();
        }

        // Also cleanup ConfigManager
        ConfigManager.cleanup();
    }

    /**
     * Get global configuration info
     */
    static getGlobalConfigInfo(profile) {
        return ConfigManager.getConfigInfo('logger', profile);
    }

    /**
     * Validate logger configuration exists before creating logger
     */
    static validateConfig(profile = process.env.NODE_ENV || 'development') {
        const validation = ConfigManager.validateConfigFiles(profile);
        if (!validation.files.logger.exists) {
            throw new Error(
                `Logger configuration file not found: ${validation.files.logger.filename}\n` +
                `Expected location: ${validation.files.logger.path}\n` +
                `Profile: ${profile}`
            );
        }
        return true;
    }
}

// Export both Logger and ConfigManager for convenience
module.exports = Logger;
module.exports.ConfigManager = ConfigManager;
module.exports.LogFormatter = LogFormatter;
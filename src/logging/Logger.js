/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - AI PROMPT
 * ============================================================================
 * FILE: src/logging/Logger.js
 * VERSION: 2025-05-28 15:14:56
 * PHASE: PHASE 2: Core System Components
 * CATEGORY: 📊 Logging System
 * ============================================================================
 */

import { EventEmitter } from 'events';
import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import AsyncQueue from '../utils/AsyncQueue.js';
import { LogFormatter } from './LogFormatter.js';
import crypto from 'crypto';

/**
 * Log levels with numeric priorities
 */
export const LogLevel = {
    DEBUG: 0,
    INFO: 1,
    SUCCESS: 2,
    WARN: 3,
    ERROR: 4,
    FATAL: 5
};

/**
 * Transport base class
 */
class Transport extends EventEmitter {
    constructor(options = {}) {
        super();
        this.options = {
            level: LogLevel.INFO,
            formatter: new LogFormatter(),
            filters: [],
            ...options
        };
    }

    shouldLog(entry) {
        // Check level
        if (entry.levelValue < this.options.level) {
            return false;
        }

        // Apply filters
        for (const filter of this.options.filters) {
            if (!filter(entry)) {
                return false;
            }
        }

        return true;
    }

    async log(entry) {
        if (!this.shouldLog(entry)) {
            return;
        }

        try {
            await this.write(entry);
        } catch (error) {
            this.emit('error', error);
        }
    }

    async write(entry) {
        throw new Error('Transport must implement write method');
    }
}

/**
 * Console transport
 */
class ConsoleTransport extends Transport {
    async write(entry) {
        const formatted = this.options.formatter.format(entry);

        if (entry.levelValue >= LogLevel.ERROR) {
            console.error(formatted);
        } else {
            console.log(formatted);
        }
    }
}

/**
 * File transport with rotation
 */
class FileTransport extends Transport {
    constructor(options = {}) {
        super(options);
        this.options = {
            filename: 'app.log',
            maxSize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5,
            compress: true,
            ...this.options
        };

        this.currentSize = 0;
        this.queue = new AsyncQueue();
        this.ensureDirectory();
    }

    ensureDirectory() {
        const dir = path.dirname(this.options.filename);
        fs.ensureDirSync(dir);
    }

    async write(entry) {
        const formatted = this.options.formatter.format(entry) + '\n';
        const buffer = Buffer.from(formatted);

        await this.queue.enqueue(async () => {
            // Check if rotation needed
            if (this.currentSize + buffer.length > this.options.maxSize) {
                await this.rotate();
            }

            // Write to file
            await fs.appendFile(this.options.filename, buffer);
            this.currentSize += buffer.length;
        });
    }

    async rotate() {
        const timestamp = format(new Date(), 'yyyyMMdd-HHmmss');
        const ext = path.extname(this.options.filename);
        const basename = path.basename(this.options.filename, ext);
        const dir = path.dirname(this.options.filename);

        // Rotate existing files
        for (let i = this.options.maxFiles - 1; i >= 1; i--) {
            const oldFile = path.join(dir, `${basename}.${i}${ext}`);
            const newFile = path.join(dir, `${basename}.${i + 1}${ext}`);

            if (await fs.pathExists(oldFile)) {
                if (i === this.options.maxFiles - 1) {
                    await fs.remove(oldFile);
                } else {
                    await fs.move(oldFile, newFile, { overwrite: true });
                }
            }
        }

        // Move current file to .1
        const rotatedFile = path.join(dir, `${basename}.1${ext}`);
        await fs.move(this.options.filename, rotatedFile, { overwrite: true });

        // Compress if enabled
        if (this.options.compress) {
            await this.compressFile(rotatedFile);
        }

        this.currentSize = 0;
    }

    async compressFile(filename) {
        const zlib = await import('zlib');
        const pipeline = await import('stream/promises').then(m => m.pipeline);

        const gzip = zlib.createGzip();
        const source = fs.createReadStream(filename);
        const destination = fs.createWriteStream(`${filename}.gz`);

        await pipeline(source, gzip, destination);
        await fs.remove(filename);
    }
}

/**
 * Syslog transport
 */
class SyslogTransport extends Transport {
    constructor(options = {}) {
        super(options);
        this.options = {
            host: 'localhost',
            port: 514,
            facility: 16, // local0
            appName: 'app',
            ...this.options
        };
    }

    async write(entry) {
        const priority = this.calculatePriority(entry.levelValue);
        const timestamp = entry.timestamp.toISOString();
        const hostname = this.options.host;
        const appName = this.options.appName;
        const pid = process.pid;
        const msgId = entry.correlationId || '-';
        const message = entry.message;

        // RFC 5424 format
        const syslogMsg = `<${priority}>1 ${timestamp} ${hostname} ${appName} ${pid} ${msgId} - ${message}`;

        // Send via UDP (simplified - real implementation would use syslog library)
        // This is a placeholder for the actual syslog implementation
        console.log(`[SYSLOG] ${syslogMsg}`);
    }

    calculatePriority(level) {
        const severity = Math.min(level, 7);
        return this.options.facility * 8 + severity;
    }
}

/**
 * Webhook transport for log aggregation
 */
class WebhookTransport extends Transport {
    constructor(options = {}) {
        super(options);
        this.options = {
            url: null,
            headers: {},
            batchSize: 100,
            flushInterval: 5000,
            retries: 3,
            ...this.options
        };

        this.batch = [];
        this.startBatchTimer();
    }

    startBatchTimer() {
        this.batchTimer = setInterval(() => {
            this.flush();
        }, this.options.flushInterval);
    }

    async write(entry) {
        this.batch.push({
            timestamp: entry.timestamp.toISOString(),
            level: entry.level,
            message: entry.message,
            metadata: entry.metadata,
            correlationId: entry.correlationId,
            context: entry.context
        });

        if (this.batch.length >= this.options.batchSize) {
            await this.flush();
        }
    }

    async flush() {
        if (this.batch.length === 0) return;

        const logs = [...this.batch];
        this.batch = [];

        for (let attempt = 0; attempt < this.options.retries; attempt++) {
            try {
                const response = await fetch(this.options.url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...this.options.headers
                    },
                    body: JSON.stringify({ logs })
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                return;
            } catch (error) {
                if (attempt === this.options.retries - 1) {
                    this.emit('error', error);
                }
                await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
            }
        }
    }

    destroy() {
        clearInterval(this.batchTimer);
        this.flush();
    }
}

/**
 * Data redaction utilities
 */
class Redactor {
    constructor(patterns = []) {
        this.patterns = [
            // Common sensitive patterns
            /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, // Credit card
            /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
            /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
            /\b(?:password|pwd|pass|secret|token|api[_-]?key)\s*[:=]\s*["']?([^"'\s]+)["']?/gi, // Passwords
            ...patterns
        ];
    }

    redact(data) {
        if (typeof data === 'string') {
            return this.redactString(data);
        }

        if (typeof data === 'object' && data !== null) {
            return this.redactObject(data);
        }

        return data;
    }

    redactString(str) {
        let redacted = str;

        for (const pattern of this.patterns) {
            redacted = redacted.replace(pattern, (match) => {
                return '[REDACTED:' + crypto.createHash('md5').update(match).digest('hex').slice(0, 8) + ']';
            });
        }

        return redacted;
    }

    redactObject(obj) {
        const sensitiveKeys = /password|pwd|pass|secret|token|api[_-]?key|auth|credential/i;

        const redacted = {};

        for (const [key, value] of Object.entries(obj)) {
            if (sensitiveKeys.test(key)) {
                redacted[key] = '[REDACTED]';
            } else if (typeof value === 'string') {
                redacted[key] = this.redactString(value);
            } else if (typeof value === 'object' && value !== null) {
                redacted[key] = this.redactObject(value);
            } else {
                redacted[key] = value;
            }
        }

        return redacted;
    }
}

/**
 * Main Logger class
 */
export class Logger extends EventEmitter {
    constructor(options = {}) {
        super();

        this.options = {
            level: LogLevel.INFO,
            context: null,
            correlationId: null,
            redact: true,
            asyncMode: true,
            bufferSize: 1000,
            performance: true,
            ...options
        };

        this.transports = new Map();
        this.redactor = new Redactor(options.redactionPatterns);
        this.queue = this.options.asyncMode ? new AsyncQueue() : null;
        this.metrics = {
            totalLogs: 0,
            logsByLevel: {},
            errors: 0
        };

        // Initialize default transports
        if (!options.transports || options.transports.length === 0) {
            this.addTransport('console', new ConsoleTransport());
        }
    }

    /**
     * Add a transport
     */
    addTransport(name, transport) {
        transport.on('error', (error) => {
            this.emit('error', { transport: name, error });
            this.metrics.errors++;
        });

        this.transports.set(name, transport);
        return this;
    }

    /**
     * Remove a transport
     */
    removeTransport(name) {
        const transport = this.transports.get(name);
        if (transport && transport.destroy) {
            transport.destroy();
        }
        this.transports.delete(name);
        return this;
    }

    /**
     * Core logging method
     */
    async log(level, message, metadata = {}) {
        const levelName = this.getLevelName(level);
        const levelValue = typeof level === 'number' ? level : LogLevel[levelName.toUpperCase()];

        // Check if should log
        if (levelValue < this.options.level) {
            return;
        }

        // Create log entry
        const entry = {
            timestamp: new Date(),
            level: levelName,
            levelValue,
            message: this.options.redact ? this.redactor.redact(message) : message,
            metadata: this.options.redact ? this.redactor.redact(metadata) : metadata,
            context: this.options.context,
            correlationId: this.options.correlationId || metadata.correlationId
        };

        // Add performance metrics
        if (this.options.performance && metadata.duration === undefined) {
            entry.metadata.loggerOverhead = process.hrtime.bigint();
        }

        // Update metrics
        this.metrics.totalLogs++;
        this.metrics.logsByLevel[levelName] = (this.metrics.logsByLevel[levelName] || 0) + 1;

        // Log to transports
        const logFn = async () => {
            const promises = Array.from(this.transports.values()).map(transport =>
                transport.log(entry).catch(error => {
                    this.emit('error', { transport: 'unknown', error });
                })
            );

            await Promise.all(promises);

            // Calculate overhead
            if (entry.metadata.loggerOverhead) {
                entry.metadata.loggerOverhead = Number(process.hrtime.bigint() - entry.metadata.loggerOverhead) / 1e6;
            }
        };

        if (this.options.asyncMode) {
            this.queue.enqueue(logFn);
        } else {
            await logFn();
        }
    }

    /**
     * Log level methods
     */
    debug(message, metadata) {
        return this.log(LogLevel.DEBUG, message, metadata);
    }

    info(message, metadata) {
        return this.log(LogLevel.INFO, message, metadata);
    }

    success(message, metadata) {
        return this.log(LogLevel.SUCCESS, message, metadata);
    }

    warn(message, metadata) {
        return this.log(LogLevel.WARN, message, metadata);
    }

    error(message, metadata) {
        if (message instanceof Error) {
            return this.log(LogLevel.ERROR, message.message, {
                ...metadata,
                error: message
            });
        }
        return this.log(LogLevel.ERROR, message, metadata);
    }

    fatal(message, metadata) {
        return this.log(LogLevel.FATAL, message, metadata);
    }

    /**
     * Create child logger with context
     */
    child(context, additionalOptions = {}) {
        return new Logger({
            ...this.options,
            ...additionalOptions,
            context: context || this.options.context,
            correlationId: additionalOptions.correlationId || this.options.correlationId || uuidv4()
        });
    }

    /**
     * Create scoped logger for async operations
     */
    scope(correlationId = uuidv4()) {
        return this.child(this.options.context, { correlationId });
    }

    /**
     * Performance logging helpers
     */
    startTimer() {
        return process.hrtime.bigint();
    }

    endTimer(start, message, metadata = {}) {
        const duration = Number(process.hrtime.bigint() - start) / 1e6;
        return this.info(message, { ...metadata, duration });
    }

    /**
     * Get level name from value
     */
    getLevelName(level) {
        if (typeof level === 'string') {
            return level.toLowerCase();
        }

        for (const [name, value] of Object.entries(LogLevel)) {
            if (value === level) {
                return name.toLowerCase();
            }
        }

        return 'info';
    }

    /**
     * Get metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }

    /**
     * Flush all transports
     */
    async flush() {
        if (this.queue) {
            await this.queue.flush();
        }

        const promises = Array.from(this.transports.values()).map(transport => {
            if (transport.flush) {
                return transport.flush();
            }
        });

        await Promise.all(promises.filter(Boolean));
    }

    /**
     * Destroy logger
     */
    async destroy() {
        await this.flush();

        for (const [name, transport] of this.transports) {
            if (transport.destroy) {
                transport.destroy();
            }
        }

        this.transports.clear();
        this.removeAllListeners();
    }
}

/**
 * Create default logger instance
 */
export const createLogger = (options = {}) => {
    const logger = new Logger(options);

    // Add file transport in production
    if (process.env.NODE_ENV === 'production') {
        logger.addTransport('file', new FileTransport({
            filename: path.join(process.cwd(), 'logs', 'app.log'),
            formatter: new LogFormatter({ mode: 'json', useColor: false })
        }));
    }

    return logger;
};

/**
 * Export transports for custom configuration
 */
export const Transports = {
    Console: ConsoleTransport,
    File: FileTransport,
    Syslog: SyslogTransport,
    Webhook: WebhookTransport
};

export default Logger;
/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - AI PROMPT
 * ============================================================================
 * FILE: src/errors/ErrorHandler.js
 * VERSION: 2025-05-30 11:34:23
 * PHASE: PHASE 2: Core System Components
 * CATEGORY: 📊 Logging System
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 *
 * Build a centralized error handler that:
 * - Implements error classification and routing 
 * - Provides multiple output formatters (CLI, JSON, HTML) 
 * - Implements error aggregation for bulk operations 
 * - Provides contextual error grouping 
 * - Implements error recovery strategies 
 * - Integrates with monitoring services 
 * - Provides error statistics and analytics 
 * - Implements rate limiting for error reporting 
 * - Supports custom error handlers 
 * - Provides debug mode with stack traces
 *
 * ============================================================================
 */
const { EventEmitter } = require('events');
const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const GeneratorError = require('./GeneratorError');
const ValidationError = require('./ValidationError');
const FileSystemError = require('./FileSystemError');
const NetworkError = require('./NetworkError');
const TemplateError = require('./TemplateError');

/**
 * ErrorHandler - Centralized error management system
 */
class ErrorHandler extends EventEmitter {
    constructor(options = {}) {
        super();

        this.options = {
            outputFormat: 'cli',
            debugMode: process.env.DEBUG === 'true',
            logFile: options.logFile || null,
            maxErrors: 1000,
            rateLimitWindow: 60000, // 1 minute
            rateLimitMax: 100,
            enableMonitoring: options.enableMonitoring || false,
            monitoringEndpoint: options.monitoringEndpoint || null,
            groupingEnabled: true,
            recoveryEnabled: true,
            exitOnFatal: true,
            ...options
        };

        // Error storage
        this.errors = [];
        this.errorGroups = new Map();
        this.errorStats = {
            total: 0,
            byCategory: {},
            bySeverity: {},
            byCode: {},
            recovered: 0,
            fatal: 0
        };

        // Rate limiting
        this.rateLimitMap = new Map();

        // Custom error handlers
        this.customHandlers = new Map();

        // Recovery strategies
        this.recoveryStrategies = new Map();

        // Output formatters
        this.formatters = {
            cli: this._formatCLI.bind(this),
            json: this._formatJSON.bind(this),
            html: this._formatHTML.bind(this),
            markdown: this._formatMarkdown.bind(this),
            log: this._formatLog.bind(this)
        };

        // Initialize default recovery strategies
        this._initializeRecoveryStrategies();

        // Set up process error handlers
        this._setupProcessHandlers();
    }

    /**
     * Initialize default recovery strategies
     */
    _initializeRecoveryStrategies() {
        // Network error recovery
        this.registerRecoveryStrategy('network', async (error) => {
            if (error.shouldRetry()) {
                const delay = error.getRetryDelay();
                this.emit('recovery:retry', { error, delay });
                await this._sleep(delay);
                return { action: 'retry', delay };
            }
            return { action: 'fail' };
        });

        // File system error recovery
        this.registerRecoveryStrategy('filesystem', async (error) => {
            if (error.code === 'ENOSPC') {
                this.emit('recovery:diskSpace', { error });
                return { action: 'prompt', message: 'Free up disk space and retry' };
            }
            if (error.code === 'EACCES') {
                return { action: 'escalate', message: 'Requires elevated permissions' };
            }
            return { action: 'fail' };
        });

        // Validation error recovery
        this.registerRecoveryStrategy('validation', async (error) => {
            if (error.suggestions.length > 0) {
                return {
                    action: 'suggest',
                    suggestions: error.suggestions
                };
            }
            return { action: 'fail' };
        });
    }

    /**
     * Set up process-level error handlers
     */
    _setupProcessHandlers() {
        if (this.options.exitOnFatal) {
            process.on('uncaughtException', (error) => {
                this.handleFatal(error, 'uncaughtException');
            });

            process.on('unhandledRejection', (reason, promise) => {
                this.handleFatal(reason, 'unhandledRejection', { promise });
            });
        }
    }

    /**
     * Handle an error
     */
    async handle(error, context = {}) {
        try {
            // Wrap non-GeneratorError instances
            const wrappedError = GeneratorError.isGeneratorError(error)
                ? error
                : GeneratorError.wrap(error);

            // Add context
            Object.entries(context).forEach(([key, value]) => {
                wrappedError.addContext(key, value);
            });

            // Check rate limiting
            if (!this._checkRateLimit(wrappedError)) {
                this.emit('error:rateLimited', wrappedError);
                return null;
            }

            // Store error
            this._storeError(wrappedError);

            // Update statistics
            this._updateStats(wrappedError);

            // Group error if enabled
            if (this.options.groupingEnabled) {
                this._groupError(wrappedError);
            }

            // Emit error event
            this.emit('error:handled', wrappedError);

            // Try recovery if enabled
            let recoveryResult = null;
            if (this.options.recoveryEnabled && wrappedError.recoverable) {
                recoveryResult = await this._attemptRecovery(wrappedError);
            }

            // Execute custom handlers
            await this._executeCustomHandlers(wrappedError);

            // Log error
            await this._logError(wrappedError);

            // Send to monitoring if enabled
            if (this.options.enableMonitoring) {
                await this._sendToMonitoring(wrappedError);
            }

            // Output error based on format
            this._outputError(wrappedError);

            return {
                error: wrappedError,
                recovery: recoveryResult
            };
        } catch (handlerError) {
            // Error handler failed - last resort logging
            console.error('Error handler failed:', handlerError);
            console.error('Original error:', error);
        }
    }

    /**
     * Handle multiple errors (bulk operations)
     */
    async handleBulk(errors, context = {}) {
        const results = [];
        const aggregated = {
            total: errors.length,
            handled: 0,
            recovered: 0,
            failed: 0
        };

        for (const error of errors) {
            const result = await this.handle(error, context);
            results.push(result);

            aggregated.handled++;
            if (result?.recovery?.action === 'success') {
                aggregated.recovered++;
            } else {
                aggregated.failed++;
            }
        }

        // Output aggregated results
        this._outputAggregated(aggregated, results);

        return {
            aggregated,
            results
        };
    }

    /**
     * Handle fatal errors
     */
    handleFatal(error, type = 'fatal', context = {}) {
        this.errorStats.fatal++;

        const fatalError = GeneratorError.wrap(error, 'FATAL_ERROR', {
            severity: 'fatal',
            recoverable: false,
            context: {
                ...context,
                fatalType: type,
                timestamp: new Date().toISOString()
            }
        });

        // Force CLI output for fatal errors
        const originalFormat = this.options.outputFormat;
        this.options.outputFormat = 'cli';

        console.error('\n' + chalk.red.bold('═══ FATAL ERROR ═══'));
        this.handle(fatalError);

        this.options.outputFormat = originalFormat;

        if (this.options.exitOnFatal) {
            process.exit(1);
        }
    }

    /**
     * Check rate limiting
     */
    _checkRateLimit(error) {
        const key = error.fingerprint;
        const now = Date.now();

        if (!this.rateLimitMap.has(key)) {
            this.rateLimitMap.set(key, { count: 0, resetTime: now + this.options.rateLimitWindow });
        }

        const limit = this.rateLimitMap.get(key);

        if (now > limit.resetTime) {
            limit.count = 0;
            limit.resetTime = now + this.options.rateLimitWindow;
        }

        limit.count++;

        return limit.count <= this.options.rateLimitMax;
    }

    /**
     * Store error
     */
    _storeError(error) {
        if (this.errors.length >= this.options.maxErrors) {
            this.errors.shift(); // Remove oldest
        }

        this.errors.push({
            error,
            timestamp: new Date(),
            id: error.id
        });
    }

    /**
     * Update statistics
     */
    _updateStats(error) {
        this.errorStats.total++;

        // By category
        this.errorStats.byCategory[error.category] =
            (this.errorStats.byCategory[error.category] || 0) + 1;

        // By severity
        this.errorStats.bySeverity[error.severity] =
            (this.errorStats.bySeverity[error.severity] || 0) + 1;

        // By code
        this.errorStats.byCode[error.code] =
            (this.errorStats.byCode[error.code] || 0) + 1;
    }

    /**
     * Group similar errors
     */
    _groupError(error) {
        const groupKey = `${error.category}:${error.code}:${error.fingerprint}`;

        if (!this.errorGroups.has(groupKey)) {
            this.errorGroups.set(groupKey, {
                fingerprint: error.fingerprint,
                category: error.category,
                code: error.code,
                message: error.message,
                count: 0,
                firstSeen: new Date(),
                lastSeen: new Date(),
                errors: []
            });
        }

        const group = this.errorGroups.get(groupKey);
        group.count++;
        group.lastSeen = new Date();
        group.errors.push(error.id);

        // Limit stored error IDs
        if (group.errors.length > 10) {
            group.errors = group.errors.slice(-10);
        }
    }

    /**
     * Attempt error recovery
     */
    async _attemptRecovery(error) {
        const strategy = this.recoveryStrategies.get(error.category);

        if (!strategy) {
            return { action: 'none', reason: 'No recovery strategy' };
        }

        try {
            const result = await strategy(error);

            if (result.action === 'success') {
                this.errorStats.recovered++;
            }

            this.emit('recovery:attempted', { error, result });

            return result;
        } catch (recoveryError) {
            return {
                action: 'failed',
                reason: 'Recovery failed',
                error: recoveryError
            };
        }
    }

    /**
     * Execute custom handlers
     */
    async _executeCustomHandlers(error) {
        const handlers = [];

        // Category-specific handler
        if (this.customHandlers.has(error.category)) {
            handlers.push(this.customHandlers.get(error.category));
        }

        // Code-specific handler
        if (this.customHandlers.has(error.code)) {
            handlers.push(this.customHandlers.get(error.code));
        }

        // Global handler
        if (this.customHandlers.has('*')) {
            handlers.push(this.customHandlers.get('*'));
        }

        for (const handler of handlers) {
            try {
                await handler(error, this);
            } catch (handlerError) {
                console.error('Custom handler failed:', handlerError);
            }
        }
    }

    /**
     * Log error to file
     */
    async _logError(error) {
        if (!this.options.logFile) return;

        try {
            const logEntry = {
                timestamp: new Date().toISOString(),
                ...error.serialize('json')
            };

            const logLine = JSON.stringify(logEntry) + '\n';

            await fs.appendFile(this.options.logFile, logLine);
        } catch (logError) {
            console.error('Failed to log error:', logError);
        }
    }

    /**
     * Send error to monitoring service
     */
    async _sendToMonitoring(error) {
        if (!this.options.monitoringEndpoint) return;

        try {
            // This would send to actual monitoring service
            // For now, just emit an event
            this.emit('monitoring:send', {
                error: error.serialize('json'),
                endpoint: this.options.monitoringEndpoint
            });
        } catch (monitoringError) {
            console.error('Failed to send to monitoring:', monitoringError);
        }
    }

    /**
     * Output error based on format
     */
    _outputError(error) {
        const formatter = this.formatters[this.options.outputFormat];

        if (!formatter) {
            console.error(error.message);
            return;
        }

        const formatted = formatter(error);

        if (this.options.outputFormat === 'cli') {
            console.error(formatted);
        } else {
            console.log(formatted);
        }
    }

    /**
     * Output aggregated results
     */
    _outputAggregated(aggregated, results) {
        if (this.options.outputFormat === 'cli') {
            console.error(chalk.yellow('\n═══ Error Summary ═══'));
            console.error(`Total Errors: ${aggregated.total}`);
            console.error(`Handled: ${aggregated.handled}`);
            console.error(`Recovered: ${aggregated.recovered}`);
            console.error(`Failed: ${aggregated.failed}`);

            // Group by category
            const byCategory = {};
            results.forEach(result => {
                if (result?.error) {
                    const category = result.error.category;
                    byCategory[category] = (byCategory[category] || 0) + 1;
                }
            });

            console.error('\nBy Category:');
            Object.entries(byCategory).forEach(([category, count]) => {
                console.error(`  ${category}: ${count}`);
            });
        } else {
            console.log(JSON.stringify({ aggregated, summary: this.getStats() }, null, 2));
        }
    }

    /**
     * Format error for CLI output
     */
    _formatCLI(error) {
        return error.serialize('cli');
    }

    /**
     * Format error as JSON
     */
    _formatJSON(error) {
        return JSON.stringify(error.serialize('json'), null, 2);
    }

    /**
     * Format error as HTML
     */
    _formatHTML(error) {
        const data = error.serialize('html');
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Error Report</title>
    <style>
        body { font-family: sans-serif; margin: 20px; }
        .error { border: 1px solid #f00; padding: 20px; margin: 10px 0; }
        .error-error { background: #fee; }
        .error-warning { background: #ffe; }
        .error-info { background: #eef; }
        code { background: #f5f5f5; padding: 2px 4px; }
        pre { background: #f5f5f5; padding: 10px; overflow: auto; }
        dt { font-weight: bold; margin-top: 10px; }
        dd { margin-left: 20px; }
    </style>
</head>
<body>
    <h1>Error Report</h1>
    ${data}
    <footer>
        <p>Generated at ${new Date().toISOString()}</p>
    </footer>
</body>
</html>
    `;
    }

    /**
     * Format error as Markdown
     */
    _formatMarkdown(error) {
        const data = error.serialize('json');
        const parts = [];

        parts.push(`## ${data.severity === 'error' ? '❌' : '⚠️'} ${data.userMessage}`);
        parts.push('');
        parts.push(`**Error Code:** \`${data.code}\``);
        parts.push(`**Category:** ${data.category}`);
        parts.push(`**Severity:** ${data.severity}`);

        if (data.location.file) {
            parts.push(`**Location:** \`${data.location.file}:${data.location.line}:${data.location.column}\``);
        }

        if (data.suggestion) {
            parts.push('');
            parts.push(`### 💡 Suggestion`);
            parts.push(data.suggestion);
        }

        if (Object.keys(data.context).length > 0) {
            parts.push('');
            parts.push('### Context');
            parts.push('```json');
            parts.push(JSON.stringify(data.context, null, 2));
            parts.push('```');
        }

        if (this.options.debugMode && data.stack) {
            parts.push('');
            parts.push('### Stack Trace');
            parts.push('```');
            parts.push(data.stack);
            parts.push('```');
        }

        return parts.join('\n');
    }

    /**
     * Format error for log file
     */
    _formatLog(error) {
        return error.serialize('log');
    }

    /**
     * Register custom error handler
     */
    registerHandler(keyOrPattern, handler) {
        this.customHandlers.set(keyOrPattern, handler);
    }

    /**
     * Register recovery strategy
     */
    registerRecoveryStrategy(category, strategy) {
        this.recoveryStrategies.set(category, strategy);
    }

    /**
     * Get error statistics
     */
    getStats() {
        return {
            ...this.errorStats,
            groups: this.errorGroups.size,
            stored: this.errors.length,
            rateLimited: Array.from(this.rateLimitMap.entries()).filter(
                ([_, limit]) => limit.count > this.options.rateLimitMax
            ).length
        };
    }

    /**
     * Get error groups
     */
    getGroups() {
        return Array.from(this.errorGroups.entries()).map(([key, group]) => ({
            key,
            ...group
        }));
    }

    /**
     * Get recent errors
     */
    getRecentErrors(limit = 10) {
        return this.errors.slice(-limit).map(entry => ({
            id: entry.id,
            timestamp: entry.timestamp,
            message: entry.error.message,
            category: entry.error.category,
            code: entry.error.code
        }));
    }

    /**
     * Clear error history
     */
    clear() {
        this.errors = [];
        this.errorGroups.clear();
        this.rateLimitMap.clear();
        this.errorStats = {
            total: 0,
            byCategory: {},
            bySeverity: {},
            byCode: {},
            recovered: 0,
            fatal: 0
        };
    }

    /**
     * Export error report
     */
    async exportReport(filepath, format = 'json') {
        const report = {
            generated: new Date().toISOString(),
            stats: this.getStats(),
            groups: this.getGroups(),
            recent: this.getRecentErrors(100)
        };

        let content;
        switch (format) {
            case 'json':
                content = JSON.stringify(report, null, 2);
                break;
            case 'markdown':
                content = this._generateMarkdownReport(report);
                break;
            case 'html':
                content = this._generateHTMLReport(report);
                break;
            default:
                content = JSON.stringify(report, null, 2);
        }

        await fs.writeFile(filepath, content);
    }

    /**
     * Generate markdown report
     */
    _generateMarkdownReport(report) {
        const parts = [];

        parts.push('# Error Report');
        parts.push(`Generated: ${report.generated}`);
        parts.push('');

        parts.push('## Statistics');
        parts.push(`- Total Errors: ${report.stats.total}`);
        parts.push(`- Fatal Errors: ${report.stats.fatal}`);
        parts.push(`- Recovered: ${report.stats.recovered}`);
        parts.push('');

        parts.push('### By Category');
        Object.entries(report.stats.byCategory).forEach(([category, count]) => {
            parts.push(`- ${category}: ${count}`);
        });
        parts.push('');

        parts.push('### By Severity');
        Object.entries(report.stats.bySeverity).forEach(([severity, count]) => {
            parts.push(`- ${severity}: ${count}`);
        });
        parts.push('');

        parts.push('## Error Groups');
        report.groups.forEach(group => {
            parts.push(`### ${group.code} (${group.count} occurrences)`);
            parts.push(`- First seen: ${group.firstSeen}`);
            parts.push(`- Last seen: ${group.lastSeen}`);
            parts.push(`- Message: ${group.message}`);
            parts.push('');
        });

        return parts.join('\n');
    }

    /**
     * Generate HTML report
     */
    _generateHTMLReport(report) {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Error Report - ${report.generated}</title>
    <style>
        body { font-family: sans-serif; margin: 20px; }
        h1, h2, h3 { color: #333; }
        .stat { display: inline-block; margin: 10px; padding: 10px; background: #f5f5f5; }
        .error-group { border: 1px solid #ddd; padding: 10px; margin: 10px 0; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f5f5f5; }
    </style>
</head>
<body>
    <h1>Error Report</h1>
    <p>Generated: ${report.generated}</p>
    
    <h2>Statistics</h2>
    <div class="stat">Total: ${report.stats.total}</div>
    <div class="stat">Fatal: ${report.stats.fatal}</div>
    <div class="stat">Recovered: ${report.stats.recovered}</div>
    
    <h3>By Category</h3>
    <table>
        <tr><th>Category</th><th>Count</th></tr>
        ${Object.entries(report.stats.byCategory).map(([cat, count]) =>
            `<tr><td>${cat}</td><td>${count}</td></tr>`
        ).join('')}
    </table>
    
    <h2>Error Groups</h2>
    ${report.groups.map(group => `
        <div class="error-group">
            <h3>${group.code}</h3>
            <p><strong>Count:</strong> ${group.count}</p>
            <p><strong>Message:</strong> ${group.message}</p>
            <p><strong>First seen:</strong> ${group.firstSeen}</p>
            <p><strong>Last seen:</strong> ${group.lastSeen}</p>
        </div>
    `).join('')}
</body>
</html>
    `;
    }

    /**
     * Sleep helper
     */
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = ErrorHandler;
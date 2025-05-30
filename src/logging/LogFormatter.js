/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - AI PROMPT
 * ============================================================================
 * FILE: src/logging/LogFormatter.js
 * VERSION: 2025-05-28 15:14:56
 * PHASE: PHASE 3: Code Generation Engine
 * CATEGORY: 🏗️ Base Generators
 * ============================================================================
 */

import chalk from 'chalk';
import { format } from 'date-fns';
import stripAnsi from 'strip-ansi';
import util from 'util';

/**
 * Theme configurations for different log contexts
 */
const THEMES = {
    default: {
        debug: chalk.gray,
        info: chalk.blue,
        success: chalk.green,
        warn: chalk.yellow,
        error: chalk.red,
        fatal: chalk.bgRed.white,
        timestamp: chalk.dim.gray,
        context: chalk.cyan,
        stack: chalk.dim.red,
        highlight: chalk.bold.white
    },
    dark: {
        debug: chalk.hex('#6B7280'),
        info: chalk.hex('#3B82F6'),
        success: chalk.hex('#10B981'),
        warn: chalk.hex('#F59E0B'),
        error: chalk.hex('#EF4444'),
        fatal: chalk.bgHex('#DC2626').white,
        timestamp: chalk.hex('#4B5563'),
        context: chalk.hex('#06B6D4'),
        stack: chalk.hex('#991B1B'),
        highlight: chalk.bold.hex('#F3F4F6')
    },
    light: {
        debug: chalk.hex('#9CA3AF'),
        info: chalk.hex('#2563EB'),
        success: chalk.hex('#059669'),
        warn: chalk.hex('#D97706'),
        error: chalk.hex('#DC2626'),
        fatal: chalk.bgHex('#B91C1C').white,
        timestamp: chalk.hex('#6B7280'),
        context: chalk.hex('#0891B2'),
        stack: chalk.hex('#B91C1C'),
        highlight: chalk.bold.black
    }
};

/**
 * Level indicators with emoji support
 */
const LEVEL_INDICATORS = {
    emoji: {
        debug: '🔍',
        info: 'ℹ️ ',
        success: '✅',
        warn: '⚠️ ',
        error: '❌',
        fatal: '💀'
    },
    text: {
        debug: 'DEBUG',
        info: 'INFO ',
        success: 'OK   ',
        warn: 'WARN ',
        error: 'ERROR',
        fatal: 'FATAL'
    },
    short: {
        debug: 'D',
        info: 'I',
        success: 'S',
        warn: 'W',
        error: 'E',
        fatal: 'F'
    }
};

/**
 * Platform-specific formatting utilities
 */
class PlatformFormatter {
    static isWindows() {
        return process.platform === 'win32';
    }

    static isMac() {
        return process.platform === 'darwin';
    }

    static supportsColor() {
        return process.stdout.isTTY && process.env.TERM !== 'dumb';
    }

    static supportsEmoji() {
        return !this.isWindows() || process.env.WT_SESSION;
    }

    static formatPath(path) {
        if (this.isWindows()) {
            return path.replace(/\//g, '\\');
        }
        return path;
    }
}

/**
 * Main LogFormatter class
 */
export class LogFormatter {
    constructor(options = {}) {
        this.options = {
            theme: 'default',
            useColor: PlatformFormatter.supportsColor(),
            useEmoji: PlatformFormatter.supportsEmoji(),
            timestampFormat: 'yyyy-MM-dd HH:mm:ss.SSS',
            mode: 'verbose', // 'verbose' | 'compact' | 'json'
            includeStack: true,
            maxStackFrames: 10,
            contextWidth: 20,
            indentSize: 2,
            levelIndicatorStyle: 'text', // 'emoji' | 'text' | 'short'
            ...options
        };

        this.theme = THEMES[this.options.theme] || THEMES.default;
        this.levelIndicators = LEVEL_INDICATORS[this.options.levelIndicatorStyle];
    }

    /**
     * Format a log entry
     */
    format(entry) {
        switch (this.options.mode) {
            case 'json':
                return this.formatJSON(entry);
            case 'compact':
                return this.formatCompact(entry);
            case 'verbose':
            default:
                return this.formatVerbose(entry);
        }
    }

    /**
     * Format as JSON
     */
    formatJSON(entry) {
        const formatted = {
            timestamp: entry.timestamp.toISOString(),
            level: entry.level,
            message: entry.message,
            ...entry.metadata
        };

        if (entry.error) {
            formatted.error = {
                message: entry.error.message,
                stack: entry.error.stack,
                ...entry.error
            };
        }

        return JSON.stringify(formatted);
    }

    /**
     * Format in compact mode
     */
    formatCompact(entry) {
        const parts = [];

        // Timestamp
        const timestamp = format(entry.timestamp, 'HH:mm:ss');
        parts.push(this.colorize('timestamp', timestamp));

        // Level
        const level = this.getLevelIndicator(entry.level);
        parts.push(this.colorize(entry.level, level));

        // Context if present
        if (entry.context) {
            const context = `[${this.truncateContext(entry.context)}]`;
            parts.push(this.colorize('context', context));
        }

        // Message
        parts.push(entry.message);

        return parts.join(' ');
    }

    /**
     * Format in verbose mode
     */
    formatVerbose(entry) {
        const lines = [];

        // Header line
        const header = this.formatHeader(entry);
        lines.push(header);

        // Message with highlighting
        const message = this.formatMessage(entry.message, entry.highlights);
        lines.push(message);

        // Metadata
        if (Object.keys(entry.metadata || {}).length > 0) {
            lines.push(this.formatMetadata(entry.metadata));
        }

        // Error stack
        if (entry.error && this.options.includeStack) {
            lines.push(this.formatStack(entry.error));
        }

        // Multi-line content
        if (entry.multiline) {
            lines.push(this.formatMultiline(entry.multiline));
        }

        return lines.filter(Boolean).join('\n');
    }

    /**
     * Format header line
     */
    formatHeader(entry) {
        const parts = [];

        // Timestamp
        const timestamp = format(entry.timestamp, this.options.timestampFormat);
        parts.push(this.colorize('timestamp', timestamp));

        // Level with indicator
        const indicator = this.getLevelIndicator(entry.level);
        const levelText = this.colorize(entry.level, `[${indicator}]`);
        parts.push(levelText);

        // Context
        if (entry.context) {
            const context = this.colorize('context', `${entry.context}`);
            parts.push(context);
        }

        // Correlation ID
        if (entry.correlationId) {
            const corrId = this.colorize('timestamp', `(${entry.correlationId.slice(0, 8)})`);
            parts.push(corrId);
        }

        return parts.join(' ');
    }

    /**
     * Format message with highlights
     */
    formatMessage(message, highlights = []) {
        if (!highlights.length) {
            return `  ${message}`;
        }

        let formatted = message;
        highlights.forEach(highlight => {
            const regex = new RegExp(highlight, 'gi');
            formatted = formatted.replace(regex, match =>
                this.colorize('highlight', match)
            );
        });

        return `  ${formatted}`;
    }

    /**
     * Format metadata
     */
    formatMetadata(metadata) {
        const indent = ' '.repeat(this.options.indentSize);
        const formatted = util.inspect(metadata, {
            colors: this.options.useColor,
            depth: 3,
            compact: false
        });

        return formatted.split('\n')
            .map(line => `${indent}${line}`)
            .join('\n');
    }

    /**
     * Format error stack
     */
    formatStack(error) {
        const lines = [];
        lines.push(this.colorize('error', `  Error: ${error.message}`));

        if (error.stack) {
            const stackLines = error.stack.split('\n')
                .slice(1, this.options.maxStackFrames + 1)
                .map(line => {
                    // Highlight file paths
                    const formatted = line.replace(
                        /\(([^)]+)\)/g,
                        (match, path) => `(${this.colorize('context', PlatformFormatter.formatPath(path))})`
                    );
                    return this.colorize('stack', formatted);
                });

            lines.push(...stackLines);

            const remaining = error.stack.split('\n').length - this.options.maxStackFrames - 1;
            if (remaining > 0) {
                lines.push(this.colorize('timestamp', `    ... ${remaining} more frames`));
            }
        }

        return lines.join('\n');
    }

    /**
     * Format multi-line content
     */
    formatMultiline(content) {
        const indent = ' '.repeat(this.options.indentSize);
        const border = this.colorize('timestamp', '─'.repeat(60));

        const lines = [
            border,
            ...content.split('\n').map(line => `${indent}${line}`),
            border
        ];

        return lines.join('\n');
    }

    /**
     * Get level indicator based on style
     */
    getLevelIndicator(level) {
        if (this.options.useEmoji && this.options.levelIndicatorStyle === 'emoji') {
            return this.levelIndicators[level] || '❓';
        }
        return this.levelIndicators[level] || level.toUpperCase();
    }

    /**
     * Truncate context to fit width
     */
    truncateContext(context) {
        if (context.length <= this.options.contextWidth) {
            return context.padEnd(this.options.contextWidth);
        }
        return context.slice(0, this.options.contextWidth - 3) + '...';
    }

    /**
     * Apply color based on theme
     */
    colorize(type, text) {
        if (!this.options.useColor) {
            return text;
        }

        const colorFn = this.theme[type];
        return colorFn ? colorFn(text) : text;
    }

    /**
     * Strip colors from text
     */
    stripColors(text) {
        return stripAnsi(text);
    }

    /**
     * Create a custom formatter
     */
    static createCustom(formatFn) {
        return class CustomFormatter extends LogFormatter {
            format(entry) {
                return formatFn(entry, this);
            }
        };
    }
}

/**
 * Pre-configured formatters
 */
export const formatters = {
    console: new LogFormatter({ mode: 'verbose' }),
    file: new LogFormatter({ mode: 'json', useColor: false }),
    compact: new LogFormatter({ mode: 'compact' }),
    ci: new LogFormatter({
        mode: 'compact',
        useColor: false,
        useEmoji: false,
        levelIndicatorStyle: 'text'
    })
};

export default LogFormatter;
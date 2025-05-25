/**
 * ===AI PROMPT ==============================================================
 * FILE: src/utils/StringUtils.js
 * VERSION: 2025-05-25 13:22:11
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 * Generate string manipulation utilities: camelCase conversion,
 * pluralization, template variable replacement, and code formatting helpers.
 *
 * ---
 *
 * ===PROMPT END ==============================================================
 */
/**
/**
/**
/**
/**
/**
/**
/**
/**
/**
/**
 * FILE: src/utils/StringUtils.js
 *
 * AI PROMPT FOR CODE REVIEW/ENHANCEMENT:
 * =====================================
 *
 * You are reviewing string manipulation utilities for code generation and text processing.
 * These utilities handle various string transformations needed for generating clean,
 * consistent, and safe code from OpenAPI specifications.
 *
 * RESPONSIBILITIES:
 * - Sanitize strings for safe code generation and comment blocks
 * - Convert between different naming conventions (camelCase, PascalCase, kebab-case)
 * - Handle special characters and escape sequences for different contexts
 * - Generate safe identifiers and variable names from arbitrary strings
 * - Format and clean text content for documentation and comments
 * - Handle unicode and international character support
 *
 * STRING PROCESSING FEATURES:
 * - Comprehensive case conversion utilities (camel, pascal, snake, kebab)
 * - Safe identifier generation with keyword collision avoidance
 * - Comment block sanitization for JSDoc and template systems
 * - Special character handling and escaping for different contexts
 * - Text formatting and cleanup utilities
 * - Unicode normalization and character validation
 *
 * REVIEW FOCUS:
 * - String safety and injection prevention
 * - Performance optimization for large text processing
 * - Unicode and internationalization support
 * - Edge case handling for malformed input
 * - Consistency in naming convention transformations
 */

class StringUtils {
    /**
     * Convert string to camelCase
     */
    static toCamelCase(str) {
        if (!str || typeof str !== 'string') return '';

        return str
            .replace(/[^a-zA-Z0-9]+(.)/g, (match, char) => char.toUpperCase())
            .replace(/^[A-Z]/, char => char.toLowerCase());
    }

    /**
     * Convert string to PascalCase
     */
    static toPascalCase(str) {
        if (!str || typeof str !== 'string') return '';

        return str
            .replace(/[^a-zA-Z0-9]+(.)/g, (match, char) => char.toUpperCase())
            .replace(/^[a-z]/, char => char.toUpperCase());
    }

    /**
     * Convert string to snake_case
     */
    static toSnakeCase(str) {
        if (!str || typeof str !== 'string') return '';

        return str
            .replace(/([A-Z])/g, '_$1')
            .replace(/[^a-zA-Z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '')
            .toLowerCase();
    }

    /**
     * Convert string to kebab-case
     */
    static toKebabCase(str) {
        if (!str || typeof str !== 'string') return '';

        return str
            .replace(/([A-Z])/g, '-$1')
            .replace(/[^a-zA-Z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .toLowerCase();
    }

    /**
     * Convert string to CONSTANT_CASE
     */
    static toConstantCase(str) {
        return this.toSnakeCase(str).toUpperCase();
    }

    /**
     * Capitalize first letter of string
     */
    static capitalize(str) {
        if (!str || typeof str !== 'string') return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    /**
     * Convert string to Title Case
     */
    static toTitleCase(str) {
        if (!str || typeof str !== 'string') return '';

        return str
            .toLowerCase()
            .split(/[\s\-_]+/)
            .map(word => this.capitalize(word))
            .join(' ');
    }

    /**
     * Generate safe JavaScript identifier from string
     */
    static toSafeIdentifier(str) {
        if (!str || typeof str !== 'string') return 'identifier';

        // Remove invalid characters and convert to camelCase
        let identifier = str
            .replace(/[^a-zA-Z0-9_$]/g, '_')
            .replace(/^[0-9]/, '_$&') // Can't start with number
            .replace(/_+/g, '_')
            .replace(/^_+|_+$/g, '');

        // Convert to camelCase
        identifier = this.toCamelCase(identifier);

        // Handle empty result
        if (!identifier) return 'identifier';

        // Avoid JavaScript reserved words
        if (this.isReservedWord(identifier)) {
            identifier = identifier + 'Value';
        }

        return identifier;
    }

    /**
     * Check if string is a JavaScript reserved word
     */
    static isReservedWord(word) {
        const reservedWords = [
            'abstract', 'arguments', 'await', 'boolean', 'break', 'byte', 'case', 'catch',
            'char', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do',
            'double', 'else', 'enum', 'eval', 'export', 'extends', 'false', 'final',
            'finally', 'float', 'for', 'function', 'goto', 'if', 'implements', 'import',
            'in', 'instanceof', 'int', 'interface', 'let', 'long', 'native', 'new',
            'null', 'package', 'private', 'protected', 'public', 'return', 'short',
            'static', 'super', 'switch', 'synchronized', 'this', 'throw', 'throws',
            'transient', 'true', 'try', 'typeof', 'var', 'void', 'volatile', 'while',
            'with', 'yield'
        ];

        return reservedWords.includes(word.toLowerCase());
    }

    /**
     * Sanitize string for use in comments (prevent comment injection)
     */
    static sanitizeForComment(str) {
        if (!str || typeof str !== 'string') return '';

        return str
            .replace(/\*\//g, '*_/')     // Replace */ with *_/
            .replace(/\/\*/g, '/_*')     // Replace /* with /_*
            .replace(/\*\/\*/g, 'any')   // Replace */* with 'any'
            .replace(/\*\*/g, 'any')     // Replace ** with 'any'
            .replace(/\*/g, 'any');      // Replace single * with 'any'
    }

    /**
     * Sanitize JSON string for use in comments
     */
    static sanitizeJsonForComment(obj, indent = 2) {
        if (!obj) return '';

        try {
            let jsonStr = JSON.stringify(obj, null, indent);
            return this.sanitizeForComment(jsonStr);
        } catch (error) {
            return '{ /* Error serializing object */ }';
        }
    }

    /**
     * Escape string for use in JavaScript/TypeScript string literals
     */
    static escapeForStringLiteral(str, quote = '"') {
        if (!str || typeof str !== 'string') return '';

        const escapeMap = {
            '\\': '\\\\',
            '\n': '\\n',
            '\r': '\\r',
            '\t': '\\t',
            '\b': '\\b',
            '\f': '\\f',
            '\v': '\\v',
            '\0': '\\0'
        };

        // Add quote-specific escaping
        escapeMap[quote] = '\\' + quote;

        return str.replace(/[\\\n\r\t\b\f\v\0"'`]/g, match => escapeMap[match] || match);
    }

    /**
     * Escape string for use in regular expressions
     */
    static escapeForRegex(str) {
        if (!str || typeof str !== 'string') return '';

        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Generate slug from string (URL-friendly)
     */
    static slugify(str, options = {}) {
        if (!str || typeof str !== 'string') return '';

        const {
            separator = '-',
            lowercase = true,
            maxLength = 100
        } = options;

        let slug = str
            .normalize('NFD') // Normalize unicode
            .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
            .replace(/[^a-zA-Z0-9\s\-_]/g, '') // Remove special chars
            .replace(/[\s_]+/g, separator) // Replace spaces/underscores
            .replace(new RegExp(`\\${separator}+`, 'g'), separator) // Remove duplicate separators
            .replace(new RegExp(`^\\${separator}+|\\${separator}+$`, 'g'), ''); // Trim separators

        if (lowercase) {
            slug = slug.toLowerCase();
        }

        if (maxLength && slug.length > maxLength) {
            slug = slug.substring(0, maxLength).replace(new RegExp(`\\${separator}[^\\${separator}]*$`), '');
        }

        return slug || 'unnamed';
    }

    /**
     * Truncate string with ellipsis
     */
    static truncate(str, length = 100, suffix = '...') {
        if (!str || typeof str !== 'string') return '';

        if (str.length <= length) return str;

        return str.substring(0, length - suffix.length) + suffix;
    }

    /**
     * Strip HTML tags from string
     */
    static stripHtml(str) {
        if (!str || typeof str !== 'string') return '';

        return str.replace(/<[^>]*>/g, '');
    }

    /**
     * Convert HTML entities to plain text
     */
    static decodeHtmlEntities(str) {
        if (!str || typeof str !== 'string') return '';

        const entityMap = {
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&quot;': '"',
            '&#39;': "'",
            '&#x27;': "'",
            '&#x2F;': '/',
            '&#x60;': '`',
            '&#x3D;': '='
        };

        return str.replace(/&[a-zA-Z0-9#]+;/g, entity => entityMap[entity] || entity);
    }

    /**
     * Clean and normalize whitespace
     */
    static normalizeWhitespace(str) {
        if (!str || typeof str !== 'string') return '';

        return str
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .replace(/[\r\n\t]/g, ' ') // Replace line breaks and tabs with spaces
            .trim();
    }

    /**
     * Remove extra blank lines from text
     */
    static removeExtraBlankLines(str) {
        if (!str || typeof str !== 'string') return '';

        return str.replace(/\n\s*\n\s*\n/g, '\n\n');
    }

    /**
     * Indent text block
     */
    static indent(str, spaces = 2, skipFirstLine = false) {
        if (!str || typeof str !== 'string') return '';

        const indentation = ' '.repeat(spaces);
        const lines = str.split('\n');

        return lines
            .map((line, index) => {
                if (skipFirstLine && index === 0) return line;
                return line.trim() ? indentation + line : line;
            })
            .join('\n');
    }

    /**
     * Word wrap text to specified width
     */
    static wordWrap(str, width = 80, breakLongWords = false) {
        if (!str || typeof str !== 'string') return '';

        const words = str.split(/\s+/);
        const lines = [];
        let currentLine = '';

        words.forEach(word => {
            if (currentLine.length + word.length + 1 <= width) {
                currentLine += (currentLine ? ' ' : '') + word;
            } else {
                if (currentLine) {
                    lines.push(currentLine);
                    currentLine = word;
                } else {
                    // Handle very long words
                    if (breakLongWords && word.length > width) {
                        while (word.length > width) {
                            lines.push(word.substring(0, width));
                            word = word.substring(width);
                        }
                        currentLine = word;
                    } else {
                        currentLine = word;
                    }
                }
            }
        });

        if (currentLine) {
            lines.push(currentLine);
        }

        return lines.join('\n');
    }

    /**
     * Generate random string
     */
    static randomString(length = 8, charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return result;
    }

    /**
     * Check if string contains only ASCII characters
     */
    static isAscii(str) {
        if (!str || typeof str !== 'string') return true;
        return /^[\x00-\x7F]*$/.test(str);
    }

    /**
     * Count words in string
     */
    static wordCount(str) {
        if (!str || typeof str !== 'string') return 0;
        return str.trim().split(/\s+/).filter(word => word.length > 0).length;
    }

    /**
     * Extract file extension from filename
     */
    static getFileExtension(filename) {
        if (!filename || typeof filename !== 'string') return '';
        const lastDot = filename.lastIndexOf('.');
        return lastDot > 0 ? filename.substring(lastDot + 1).toLowerCase() : '';
    }

    /**
     * Generate filename-safe string
     */
    static toFilename(str, options = {}) {
        if (!str || typeof str !== 'string') return 'file';

        const {
            maxLength = 255,
            replacement = '_'
        } = options;

        // Replace invalid filename characters
        let filename = str
            .replace(/[<>:"/\\|?*\x00-\x1f]/g, replacement)
            .replace(/^\.+/, '') // Remove leading dots
            .replace(/\.+$/, '') // Remove trailing dots
            .replace(/\s+/g, replacement)
            .replace(new RegExp(`\\${replacement}+`, 'g'), replacement)
            .replace(new RegExp(`^\\${replacement}+|\\${replacement}+$`, 'g'), '');

        if (filename.length > maxLength) {
            const ext = this.getFileExtension(filename);
            const maxBase = maxLength - (ext ? ext.length + 1 : 0);
            filename = filename.substring(0, maxBase) + (ext ? '.' + ext : '');
        }

        return filename || 'file';
    }

    /**
     * Compare strings for similarity (Levenshtein distance)
     */
    static similarity(str1, str2) {
        if (!str1 || !str2) return 0;
        if (str1 === str2) return 1;

        const matrix = [];
        const len1 = str1.length;
        const len2 = str2.length;

        // Initialize matrix
        for (let i = 0; i <= len1; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= len2; j++) {
            matrix[0][j] = j;
        }

        // Calculate distances
        for (let i = 1; i <= len1; i++) {
            for (let j = 1; j <= len2; j++) {
                const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,     // deletion
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j - 1] + cost // substitution
                );
            }
        }

        const maxLen = Math.max(len1, len2);
        return (maxLen - matrix[len1][len2]) / maxLen;
    }

    /**
     * Format bytes to human readable string
     */
    static formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
    }

    /**
     * Parse template string with variables
     */
    static parseTemplate(template, variables = {}) {
        if (!template || typeof template !== 'string') return '';

        return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
            const trimmedKey = key.trim();
            return variables.hasOwnProperty(trimmedKey) ?
                String(variables[trimmedKey]) : match;
        });
    }

    /**
     * Validate email format
     */
    static isValidEmail(email) {
        if (!email || typeof email !== 'string') return false;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate URL format
     */
    static isValidUrl(url) {
        if (!url || typeof url !== 'string') return false;

        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
}

module.exports = StringUtils;
/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - STRING UTILITIES
 * ============================================================================
 * FILE: src/utils/StringUtils.js
 * VERSION: 2025-05-30 11:34:23
 * PHASE: PHASE 3: Code Generation Engine
 * CATEGORY: 🛠️ Utilities
 * ============================================================================
 *
 * PURPOSE:
 * Comprehensive string manipulation utilities for code generation.
 * Handles naming conventions, string transformations, and text processing.
 *
 * ============================================================================
 */

class StringUtils {
    constructor() {
        // Common words to handle in naming conventions
        this.commonAcronyms = new Set(['API', 'URL', 'ID', 'UUID', 'JSON', 'XML', 'CSV', 'PDF', 'SQL', 'HTTP', 'HTTPS', 'REST', 'CRUD', 'JWT', 'OAuth']);
        this.articles = new Set(['a', 'an', 'the']);
        this.conjunctions = new Set(['and', 'or', 'but', 'nor', 'for', 'yet', 'so']);
        this.prepositions = new Set(['in', 'on', 'at', 'by', 'for', 'with', 'from', 'to', 'of']);
    }

    /**
     * Convert string to camelCase
     * @param {string} str - Input string
     * @param {boolean} preserveAcronyms - Whether to preserve acronyms
     * @returns {string}
     */
    toCamelCase(str, preserveAcronyms = true) {
        if (!str) return '';

        // First normalize the string
        let normalized = this.normalizeString(str);

        // Split into words
        const words = this.splitWords(normalized);

        // Process each word
        return words.map((word, index) => {
            if (index === 0) {
                return word.toLowerCase();
            }

            if (preserveAcronyms && this.commonAcronyms.has(word.toUpperCase())) {
                return word.toUpperCase();
            }

            return this.capitalize(word.toLowerCase());
        }).join('');
    }

    /**
     * Convert string to PascalCase
     * @param {string} str - Input string
     * @param {boolean} preserveAcronyms - Whether to preserve acronyms
     * @returns {string}
     */
    toPascalCase(str, preserveAcronyms = true) {
        if (!str) return '';

        const normalized = this.normalizeString(str);
        const words = this.splitWords(normalized);

        return words.map(word => {
            if (preserveAcronyms && this.commonAcronyms.has(word.toUpperCase())) {
                return word.toUpperCase();
            }
            return this.capitalize(word.toLowerCase());
        }).join('');
    }

    /**
     * Convert string to kebab-case
     * @param {string} str - Input string
     * @returns {string}
     */
    toKebabCase(str) {
        if (!str) return '';

        return this.normalizeString(str)
            .replace(/([a-z])([A-Z])/g, '$1-$2')
            .replace(/[\s_]+/g, '-')
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    /**
     * Convert string to snake_case
     * @param {string} str - Input string
     * @returns {string}
     */
    toSnakeCase(str) {
        if (!str) return '';

        return this.normalizeString(str)
            .replace(/([a-z])([A-Z])/g, '$1_$2')
            .replace(/[\s-]+/g, '_')
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
    }

    /**
     * Convert string to CONSTANT_CASE
     * @param {string} str - Input string
     * @returns {string}
     */
    toConstantCase(str) {
        return this.toSnakeCase(str).toUpperCase();
    }

    /**
     * Convert string to Title Case
     * @param {string} str - Input string
     * @param {boolean} smartCase - Use smart casing for articles, conjunctions, etc.
     * @returns {string}
     */
    toTitleCase(str, smartCase = true) {
        if (!str) return '';

        const words = str.toLowerCase().split(/\s+/);

        return words.map((word, index) => {
            // Always capitalize first and last words
            if (index === 0 || index === words.length - 1) {
                return this.capitalize(word);
            }

            // Apply smart casing if enabled
            if (smartCase) {
                // Don't capitalize articles, conjunctions, or short prepositions
                if (this.articles.has(word) ||
                    this.conjunctions.has(word) ||
                    (this.prepositions.has(word) && word.length < 4)) {
                    return word;
                }
            }

            return this.capitalize(word);
        }).join(' ');
    }

    /**
     * Convert string to sentence case
     * @param {string} str - Input string
     * @returns {string}
     */
    toSentenceCase(str) {
        if (!str) return '';

        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    /**
     * Convert string to dot.case
     * @param {string} str - Input string
     * @returns {string}
     */
    toDotCase(str) {
        if (!str) return '';

        return this.normalizeString(str)
            .replace(/([a-z])([A-Z])/g, '$1.$2')
            .replace(/[\s_-]+/g, '.')
            .toLowerCase()
            .replace(/[^a-z0-9.]/g, '')
            .replace(/\.+/g, '.')
            .replace(/^\.|\.$/g, '');
    }

    /**
     * Convert string to path/case
     * @param {string} str - Input string
     * @returns {string}
     */
    toPathCase(str) {
        if (!str) return '';

        return this.normalizeString(str)
            .replace(/([a-z])([A-Z])/g, '$1/$2')
            .replace(/[\s_-]+/g, '/')
            .toLowerCase()
            .replace(/[^a-z0-9/]/g, '')
            .replace(/\/+/g, '/')
            .replace(/^\/|\/$/g, '');
    }

    /**
     * Capitalize first letter of string
     * @param {string} str - Input string
     * @returns {string}
     */
    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Uncapitalize first letter of string
     * @param {string} str - Input string
     * @returns {string}
     */
    uncapitalize(str) {
        if (!str) return '';
        return str.charAt(0).toLowerCase() + str.slice(1);
    }

    /**
     * Pluralize a word
     * @param {string} word - Word to pluralize
     * @param {number} count - Count for conditional pluralization
     * @returns {string}
     */
    pluralize(word, count = 2) {
        if (!word) return '';
        if (count === 1) return word;

        // Common irregular plurals
        const irregulars = {
            'child': 'children',
            'person': 'people',
            'man': 'men',
            'woman': 'women',
            'tooth': 'teeth',
            'foot': 'feet',
            'mouse': 'mice',
            'goose': 'geese'
        };

        const lowerWord = word.toLowerCase();
        if (irregulars[lowerWord]) {
            return this.matchCase(word, irregulars[lowerWord]);
        }

        // Rules for regular plurals
        if (lowerWord.match(/(s|ss|sh|ch|x|z)$/)) {
            return word + 'es';
        }

        if (lowerWord.match(/[^aeiou]y$/)) {
            return word.slice(0, -1) + 'ies';
        }

        if (lowerWord.match(/[^aeiou]o$/)) {
            return word + 'es';
        }

        if (lowerWord.match(/(f|fe)$/)) {
            return word.replace(/(f|fe)$/, 'ves');
        }

        return word + 's';
    }

    /**
     * Singularize a word
     * @param {string} word - Word to singularize
     * @returns {string}
     */
    singularize(word) {
        if (!word) return '';

        // Common irregular plurals (reversed)
        const irregulars = {
            'children': 'child',
            'people': 'person',
            'men': 'man',
            'women': 'woman',
            'teeth': 'tooth',
            'feet': 'foot',
            'mice': 'mouse',
            'geese': 'goose'
        };

        const lowerWord = word.toLowerCase();
        if (irregulars[lowerWord]) {
            return this.matchCase(word, irregulars[lowerWord]);
        }

        // Rules for regular singulars
        if (lowerWord.match(/ies$/)) {
            return word.slice(0, -3) + 'y';
        }

        if (lowerWord.match(/ves$/)) {
            return word.slice(0, -3) + 'f';
        }

        if (lowerWord.match(/(s|ss|sh|ch|x|z)es$/)) {
            return word.slice(0, -2);
        }

        if (lowerWord.match(/oes$/)) {
            return word.slice(0, -2);
        }

        if (lowerWord.match(/s$/)) {
            return word.slice(0, -1);
        }

        return word;
    }

    /**
     * Truncate string with ellipsis
     * @param {string} str - String to truncate
     * @param {number} length - Maximum length
     * @param {string} suffix - Suffix to add (default: '...')
     * @returns {string}
     */
    truncate(str, length, suffix = '...') {
        if (!str || str.length <= length) return str;

        return str.slice(0, length - suffix.length) + suffix;
    }

    /**
     * Truncate string at word boundary
     * @param {string} str - String to truncate
     * @param {number} length - Maximum length
     * @param {string} suffix - Suffix to add
     * @returns {string}
     */
    truncateWords(str, length, suffix = '...') {
        if (!str || str.length <= length) return str;

        const truncated = str.slice(0, length - suffix.length);
        const lastSpace = truncated.lastIndexOf(' ');

        if (lastSpace > 0) {
            return truncated.slice(0, lastSpace) + suffix;
        }

        return truncated + suffix;
    }

    /**
     * Pad string to specified length
     * @param {string} str - String to pad
     * @param {number} length - Target length
     * @param {string} char - Character to pad with
     * @param {string} position - 'left' | 'right' | 'both'
     * @returns {string}
     */
    pad(str, length, char = ' ', position = 'right') {
        if (!str) str = '';
        str = String(str);

        if (str.length >= length) return str;

        const padLength = length - str.length;

        switch (position) {
            case 'left':
                return char.repeat(padLength) + str;
            case 'right':
                return str + char.repeat(padLength);
            case 'both':
                const leftPad = Math.floor(padLength / 2);
                const rightPad = padLength - leftPad;
                return char.repeat(leftPad) + str + char.repeat(rightPad);
            default:
                return str;
        }
    }

    /**
     * Remove extra whitespace
     * @param {string} str - Input string
     * @returns {string}
     */
    collapseWhitespace(str) {
        if (!str) return '';
        return str.replace(/\s+/g, ' ').trim();
    }

    /**
     * Escape string for regex
     * @param {string} str - String to escape
     * @returns {string}
     */
    escapeRegex(str) {
        if (!str) return '';
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Escape HTML entities
     * @param {string} str - String to escape
     * @returns {string}
     */
    escapeHtml(str) {
        if (!str) return '';

        const htmlEscapes = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };

        return str.replace(/[&<>"']/g, char => htmlEscapes[char]);
    }

    /**
     * Unescape HTML entities
     * @param {string} str - String to unescape
     * @returns {string}
     */
    unescapeHtml(str) {
        if (!str) return '';

        const htmlUnescapes = {
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&quot;': '"',
            '&#39;': "'"
        };

        return str.replace(/&(amp|lt|gt|quot|#39);/g, entity => htmlUnescapes[entity]);
    }

    /**
     * Generate a random string
     * @param {number} length - Length of string
     * @param {string} charset - Character set to use
     * @returns {string}
     */
    randomString(length = 10, charset = 'alphanumeric') {
        const charsets = {
            numeric: '0123456789',
            alpha: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
            alphanumeric: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
            hex: '0123456789abcdef',
            custom: charset
        };

        const chars = charsets[charset] || charsets.alphanumeric;
        let result = '';

        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        return result;
    }

    /**
     * Check if string contains substring (case insensitive)
     * @param {string} str - String to search in
     * @param {string} substring - Substring to search for
     * @returns {boolean}
     */
    contains(str, substring) {
        if (!str || !substring) return false;
        return str.toLowerCase().includes(substring.toLowerCase());
    }

    /**
     * Count occurrences of substring
     * @param {string} str - String to search in
     * @param {string} substring - Substring to count
     * @returns {number}
     */
    countOccurrences(str, substring) {
        if (!str || !substring) return 0;
        return (str.match(new RegExp(this.escapeRegex(substring), 'g')) || []).length;
    }

    /**
     * Replace all occurrences
     * @param {string} str - String to process
     * @param {string} search - String to search for
     * @param {string} replace - Replacement string
     * @returns {string}
     */
    replaceAll(str, search, replace) {
        if (!str) return '';
        return str.replace(new RegExp(this.escapeRegex(search), 'g'), replace);
    }

    /**
     * Extract words from string
     * @param {string} str - Input string
     * @returns {string[]}
     */
    extractWords(str) {
        if (!str) return [];
        return str.match(/[A-Za-z]+/g) || [];
    }

    /**
     * Check if string is valid identifier
     * @param {string} str - String to check
     * @returns {boolean}
     */
    isValidIdentifier(str) {
        if (!str) return false;
        return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(str);
    }

    /**
     * Convert to valid identifier
     * @param {string} str - String to convert
     * @returns {string}
     */
    toIdentifier(str) {
        if (!str) return '';

        // Replace invalid characters with underscore
        let identifier = str.replace(/[^a-zA-Z0-9_$]/g, '_');

        // Ensure it starts with a letter or underscore
        if (!/^[a-zA-Z_$]/.test(identifier)) {
            identifier = '_' + identifier;
        }

        // Remove consecutive underscores
        identifier = identifier.replace(/_+/g, '_');

        return identifier;
    }

    /**
     * Wrap text to specified width
     * @param {string} text - Text to wrap
     * @param {number} width - Maximum line width
     * @param {string} indent - Indentation for wrapped lines
     * @returns {string}
     */
    wrapText(text, width = 80, indent = '') {
        if (!text || text.length <= width) return text;

        const words = text.split(/\s+/);
        const lines = [];
        let currentLine = '';

        for (const word of words) {
            if (currentLine.length + word.length + 1 <= width) {
                currentLine += (currentLine ? ' ' : '') + word;
            } else {
                if (currentLine) lines.push(currentLine);
                currentLine = indent + word;
            }
        }

        if (currentLine) lines.push(currentLine);

        return lines.join('\n');
    }

    /**
     * Indent text
     * @param {string} text - Text to indent
     * @param {number} spaces - Number of spaces
     * @returns {string}
     */
    indent(text, spaces = 2) {
        if (!text) return '';
        const indent = ' '.repeat(spaces);
        return text.split('\n').map(line => indent + line).join('\n');
    }

    /**
     * Remove common indentation
     * @param {string} text - Text to dedent
     * @returns {string}
     */
    dedent(text) {
        if (!text) return '';

        const lines = text.split('\n');
        const minIndent = lines
            .filter(line => line.trim())
            .map(line => line.match(/^(\s*)/)[1].length)
            .reduce((min, indent) => Math.min(min, indent), Infinity);

        if (minIndent === Infinity) return text;

        return lines
            .map(line => line.slice(minIndent))
            .join('\n');
    }

    /**
     * Create a slug from string
     * @param {string} str - String to slugify
     * @returns {string}
     */
    slugify(str) {
        if (!str) return '';

        return str
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    /**
     * Parse template variables
     * @param {string} template - Template string
     * @param {object} data - Data object
     * @returns {string}
     */
    parseTemplate(template, data) {
        if (!template) return '';

        return template.replace(/\{([^}]+)\}/g, (match, key) => {
            const keys = key.trim().split('.');
            let value = data;

            for (const k of keys) {
                value = value?.[k];
            }

            return value !== undefined ? value : match;
        });
    }

    // ============================================================================
    // Private Helper Methods
    // ============================================================================

    /**
     * Normalize string for processing
     * @private
     */
    normalizeString(str) {
        return str
            .trim()
            .replace(/[^\w\s-]/g, ' ')
            .replace(/\s+/g, ' ');
    }

    /**
     * Split string into words
     * @private
     */
    splitWords(str) {
        // Handle camelCase, PascalCase, kebab-case, snake_case
        return str
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .split(/[\s\-_]+/)
            .filter(Boolean);
    }

    /**
     * Match case of source to target
     * @private
     */
    matchCase(source, target) {
        if (source === source.toUpperCase()) {
            return target.toUpperCase();
        }
        if (source === this.capitalize(source.toLowerCase())) {
            return this.capitalize(target.toLowerCase());
        }
        return target;
    }

    /**
     * Create method aliases for backward compatibility
     */
    createAliases() {
        this.camelCase = this.toCamelCase;
        this.pascalCase = this.toPascalCase;
        this.kebabCase = this.toKebabCase;
        this.snakeCase = this.toSnakeCase;
        this.constantCase = this.toConstantCase;
        this.titleCase = this.toTitleCase;
    }
}

module.exports = StringUtils;
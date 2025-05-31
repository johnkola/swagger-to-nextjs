/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - AI PROMPT
 * ============================================================================
 * FILE: src/utils/StringUtils.js
 * VERSION: 2025-05-30 11:34:23
 * PHASE: PHASE 4: Template Files
 * CATEGORY: 📋 API Template Files
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 *
 * Generate versatile string utilities that:
 * - Implement smart case conversions 
 * - Support multiple naming conventions 
 * - Implement pluralization/singularization 
 * - Provide template literal processing 
 * - Support internationalization 
 * - Implement string sanitization 
 * - Provide natural language processing 
 * - Support emoji handling 
 * - Implement text truncation 
 * - Provide string similarity algorithms
 *
 * ============================================================================
 */
/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - AI PROMPT
 * ============================================================================
 * FILE: src/utils/StringUtils.js
 * VERSION: 2025-05-30 11:34:23
 * PHASE: PHASE 4: Template Files
 * CATEGORY: 📋 API Template Files
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 *
 * Generate versatile string utilities that:
 * - Implement smart case conversions
 * - Support multiple naming conventions
 * - Implement pluralization/singularization
 * - Provide template literal processing
 * - Support internationalization
 * - Implement string sanitization
 * - Provide natural language processing
 * - Support emoji handling
 * - Implement text truncation
 * - Provide string similarity algorithms
 *
 * ============================================================================
 */

const pluralize = require('pluralize');
const slugify = require('slugify');
const DOMPurify = require('isomorphic-dompurify');
const emojiRegex = require('emoji-regex');
const levenshtein = require('fast-levenshtein');

/**
 * Comprehensive string utilities for text manipulation and processing
 */
class StringUtils {
    constructor() {
        // Initialize emoji regex pattern
        this.emojiPattern = emojiRegex();

        // Common irregular plurals
        this.irregularPlurals = new Map([
            ['person', 'people'],
            ['child', 'children'],
            ['ox', 'oxen'],
            ['foot', 'feet'],
            ['tooth', 'teeth'],
            ['goose', 'geese'],
            ['mouse', 'mice']
        ]);

        // Common abbreviations for smart capitalization
        this.commonAbbreviations = new Set([
            'API', 'URL', 'ID', 'UUID', 'JSON', 'XML', 'HTML', 'CSS', 'JS',
            'SQL', 'HTTP', 'HTTPS', 'REST', 'CRUD', 'JWT', 'SDK', 'CLI'
        ]);

        // Stop words for title case
        this.stopWords = new Set([
            'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'from',
            'in', 'into', 'nor', 'of', 'on', 'or', 'the', 'to', 'with'
        ]);
    }

    /**
     * Convert string to camelCase
     * @param {string} str - Input string
     * @returns {string} camelCase string
     */
    toCamelCase(str) {
        if (!str) return '';

        return str
            .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
            .replace(/^[A-Z]/, (chr) => chr.toLowerCase())
            .replace(/[^a-zA-Z0-9]/g, '');
    }

    /**
     * Convert string to PascalCase
     * @param {string} str - Input string
     * @returns {string} PascalCase string
     */
    toPascalCase(str) {
        if (!str) return '';

        const camel = this.toCamelCase(str);
        return camel.charAt(0).toUpperCase() + camel.slice(1);
    }

    /**
     * Convert string to snake_case
     * @param {string} str - Input string
     * @returns {string} snake_case string
     */
    toSnakeCase(str) {
        if (!str) return '';

        return str
            .replace(/([a-z])([A-Z])/g, '$1_$2')
            .replace(/[^a-zA-Z0-9]/g, '_')
            .replace(/_+/g, '_')
            .toLowerCase()
            .replace(/^_|_$/g, '');
    }

    /**
     * Convert string to kebab-case
     * @param {string} str - Input string
     * @returns {string} kebab-case string
     */
    toKebabCase(str) {
        if (!str) return '';

        return str
            .replace(/([a-z])([A-Z])/g, '$1-$2')
            .replace(/[^a-zA-Z0-9]/g, '-')
            .replace(/-+/g, '-')
            .toLowerCase()
            .replace(/^-|-$/g, '');
    }

    /**
     * Convert string to CONSTANT_CASE
     * @param {string} str - Input string
     * @returns {string} CONSTANT_CASE string
     */
    toConstantCase(str) {
        return this.toSnakeCase(str).toUpperCase();
    }

    /**
     * Convert string to dot.case
     * @param {string} str - Input string
     * @returns {string} dot.case string
     */
    toDotCase(str) {
        if (!str) return '';

        return str
            .replace(/([a-z])([A-Z])/g, '$1.$2')
            .replace(/[^a-zA-Z0-9]/g, '.')
            .replace(/\.+/g, '.')
            .toLowerCase()
            .replace(/^\.|\.$/g, '');
    }

    /**
     * Convert string to Title Case with smart handling
     * @param {string} str - Input string
     * @param {boolean} forceCase - Force case conversion
     * @returns {string} Title Case string
     */
    toTitleCase(str, forceCase = false) {
        if (!str) return '';

        return str
            .toLowerCase()
            .split(/\s+/)
            .map((word, index) => {
                // Always capitalize first and last word
                if (index === 0 || index === str.split(/\s+/).length - 1) {
                    return this.capitalize(word);
                }

                // Don't capitalize stop words unless forced
                if (!forceCase && this.stopWords.has(word)) {
                    return word;
                }

                // Check for abbreviations
                const upperWord = word.toUpperCase();
                if (this.commonAbbreviations.has(upperWord)) {
                    return upperWord;
                }

                return this.capitalize(word);
            })
            .join(' ');
    }

    /**
     * Convert string to sentence case
     * @param {string} str - Input string
     * @returns {string} Sentence case string
     */
    toSentenceCase(str) {
        if (!str) return '';

        return str.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (match) => match.toUpperCase());
    }

    /**
     * Convert string to path/case
     * @param {string} str - Input string
     * @returns {string} path/case string
     */
    toPathCase(str) {
        if (!str) return '';

        return str
            .replace(/([a-z])([A-Z])/g, '$1/$2')
            .replace(/[^a-zA-Z0-9]/g, '/')
            .replace(/\/+/g, '/')
            .toLowerCase()
            .replace(/^\/|\/$/g, '');
    }

    /**
     * Capitalize first letter of string
     * @param {string} str - Input string
     * @returns {string} Capitalized string
     */
    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Pluralize a word
     * @param {string} word - Word to pluralize
     * @param {number} count - Count for conditional pluralization
     * @returns {string} Pluralized word
     */
    pluralize(word, count = 2) {
        if (!word) return '';

        // Check irregular plurals first
        if (count !== 1 && this.irregularPlurals.has(word.toLowerCase())) {
            const plural = this.irregularPlurals.get(word.toLowerCase());
            return this.matchCase(plural, word);
        }

        return pluralize(word, count);
    }

    /**
     * Singularize a word
     * @param {string} word - Word to singularize
     * @returns {string} Singularized word
     */
    singularize(word) {
        if (!word) return '';

        // Check irregular plurals reverse lookup
        for (const [singular, plural] of this.irregularPlurals) {
            if (plural === word.toLowerCase()) {
                return this.matchCase(singular, word);
            }
        }

        return pluralize.singular(word);
    }

    /**
     * Check if word is plural
     * @param {string} word - Word to check
     * @returns {boolean} True if plural
     */
    isPlural(word) {
        return pluralize.isPlural(word);
    }

    /**
     * Check if word is singular
     * @param {string} word - Word to check
     * @returns {boolean} True if singular
     */
    isSingular(word) {
        return pluralize.isSingular(word);
    }

    /**
     * Process template literals with variables
     * @param {string} template - Template string
     * @param {Object} variables - Variables to interpolate
     * @returns {string} Processed string
     */
    interpolate(template, variables = {}) {
        if (!template) return '';

        return template.replace(/\${([^}]+)}/g, (match, key) => {
            const keys = key.trim().split('.');
            let value = variables;

            for (const k of keys) {
                value = value?.[k];
                if (value === undefined) break;
            }

            return value !== undefined ? String(value) : match;
        });
    }

    /**
     * Create slug from string
     * @param {string} str - Input string
     * @param {Object} options - Slugify options
     * @returns {string} URL-safe slug
     */
    slugify(str, options = {}) {
        if (!str) return '';

        const defaultOptions = {
            lower: true,
            strict: true,
            remove: /[*+~.()'"!:@]/g
        };

        return slugify(str, { ...defaultOptions, ...options });
    }

    /**
     * Sanitize HTML string
     * @param {string} str - HTML string to sanitize
     * @param {Object} options - DOMPurify options
     * @returns {string} Sanitized HTML
     */
    sanitizeHtml(str, options = {}) {
        if (!str) return '';

        const defaultOptions = {
            ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
            ALLOWED_ATTR: ['href', 'title', 'target']
        };

        return DOMPurify.sanitize(str, { ...defaultOptions, ...options });
    }

    /**
     * Escape HTML special characters
     * @param {string} str - String to escape
     * @returns {string} Escaped string
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

        return str.replace(/[&<>"']/g, (match) => htmlEscapes[match]);
    }

    /**
     * Unescape HTML entities
     * @param {string} str - String to unescape
     * @returns {string} Unescaped string
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

        return str.replace(/&(amp|lt|gt|quot|#39);/g, (match) => htmlUnescapes[match] || match);
    }

    /**
     * Truncate string with ellipsis
     * @param {string} str - String to truncate
     * @param {number} length - Maximum length
     * @param {Object} options - Truncation options
     * @returns {string} Truncated string
     */
    truncate(str, length, options = {}) {
        if (!str || str.length <= length) return str;

        const {
            suffix = '...',
            wordBoundary = true,
            separator = ' '
        } = options;

        const truncateLength = length - suffix.length;

        if (wordBoundary) {
            const truncated = str.substring(0, truncateLength);
            const lastSeparator = truncated.lastIndexOf(separator);

            if (lastSeparator > 0) {
                return truncated.substring(0, lastSeparator) + suffix;
            }
        }

        return str.substring(0, truncateLength) + suffix;
    }

    /**
     * Truncate string in the middle
     * @param {string} str - String to truncate
     * @param {number} length - Maximum length
     * @param {string} separator - Middle separator
     * @returns {string} Truncated string
     */
    truncateMiddle(str, length, separator = '...') {
        if (!str || str.length <= length) return str;

        const sepLength = separator.length;
        const charsToShow = length - sepLength;
        const frontChars = Math.ceil(charsToShow / 2);
        const backChars = Math.floor(charsToShow / 2);

        return str.substring(0, frontChars) + separator + str.substring(str.length - backChars);
    }

    /**
     * Wrap text to specified width
     * @param {string} str - String to wrap
     * @param {number} width - Maximum line width
     * @param {Object} options - Wrap options
     * @returns {string} Wrapped text
     */
    wordWrap(str, width = 80, options = {}) {
        if (!str) return '';

        const {
            indent = '',
            newline = '\n',
            cut = false
        } = options;

        const words = str.split(/\s+/);
        const lines = [];
        let currentLine = indent;

        for (const word of words) {
            if (currentLine.length + word.length + 1 > width) {
                if (cut && word.length > width) {
                    // Cut long words
                    let remaining = word;
                    while (remaining.length > 0) {
                        const chunk = remaining.substring(0, width - currentLine.length);
                        currentLine += chunk;
                        lines.push(currentLine);
                        currentLine = indent;
                        remaining = remaining.substring(chunk.length);
                    }
                } else {
                    lines.push(currentLine.trim());
                    currentLine = indent + word + ' ';
                }
            } else {
                currentLine += word + ' ';
            }
        }

        if (currentLine.trim()) {
            lines.push(currentLine.trim());
        }

        return lines.join(newline);
    }

    /**
     * Extract emojis from string
     * @param {string} str - Input string
     * @returns {Array} Array of emojis
     */
    extractEmojis(str) {
        if (!str) return [];

        const matches = str.match(this.emojiPattern) || [];
        return [...new Set(matches)];
    }

    /**
     * Remove emojis from string
     * @param {string} str - Input string
     * @returns {string} String without emojis
     */
    removeEmojis(str) {
        if (!str) return '';

        return str.replace(this.emojiPattern, '').trim();
    }

    /**
     * Replace emojis with text
     * @param {string} str - Input string
     * @param {string} replacement - Replacement text
     * @returns {string} String with replaced emojis
     */
    replaceEmojis(str, replacement = '') {
        if (!str) return '';

        return str.replace(this.emojiPattern, replacement);
    }

    /**
     * Count emojis in string
     * @param {string} str - Input string
     * @returns {number} Number of emojis
     */
    countEmojis(str) {
        if (!str) return 0;

        const matches = str.match(this.emojiPattern) || [];
        return matches.length;
    }

    /**
     * Calculate Levenshtein distance between strings
     * @param {string} str1 - First string
     * @param {string} str2 - Second string
     * @returns {number} Edit distance
     */
    levenshteinDistance(str1, str2) {
        return levenshtein.get(str1 || '', str2 || '');
    }

    /**
     * Calculate similarity percentage between strings
     * @param {string} str1 - First string
     * @param {string} str2 - Second string
     * @returns {number} Similarity percentage (0-100)
     */
    similarity(str1, str2) {
        if (!str1 || !str2) return 0;

        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;

        if (longer.length === 0) return 100;

        const distance = this.levenshteinDistance(longer, shorter);
        return ((longer.length - distance) / longer.length) * 100;
    }

    /**
     * Fuzzy search for string in array
     * @param {string} query - Search query
     * @param {Array} items - Array of strings to search
     * @param {Object} options - Search options
     * @returns {Array} Matched items with scores
     */
    fuzzySearch(query, items, options = {}) {
        if (!query || !items || !items.length) return [];

        const {
            threshold = 60,
            caseSensitive = false,
            sortByScore = true
        } = options;

        const normalizedQuery = caseSensitive ? query : query.toLowerCase();

        const results = items
            .map(item => {
                const normalizedItem = caseSensitive ? item : item.toLowerCase();
                const score = this.similarity(normalizedQuery, normalizedItem);

                return {
                    item,
                    score,
                    matches: score >= threshold
                };
            })
            .filter(result => result.matches);

        if (sortByScore) {
            results.sort((a, b) => b.score - a.score);
        }

        return results;
    }

    /**
     * Generate random string
     * @param {number} length - String length
     * @param {Object} options - Generation options
     * @returns {string} Random string
     */
    random(length = 10, options = {}) {
        const {
            uppercase = true,
            lowercase = true,
            numbers = true,
            symbols = false,
            excludeSimilar = false,
            customChars = ''
        } = options;

        let chars = customChars;

        if (!customChars) {
            if (uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            if (lowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
            if (numbers) chars += '0123456789';
            if (symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

            if (excludeSimilar) {
                chars = chars.replace(/[ilLI|1oO0]/g, '');
            }
        }

        if (!chars) return '';

        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        return result;
    }

    /**
     * Pad string to specified length
     * @param {string} str - String to pad
     * @param {number} length - Target length
     * @param {Object} options - Padding options
     * @returns {string} Padded string
     */
    pad(str, length, options = {}) {
        if (!str) str = '';

        const {
            position = 'right',
            char = ' '
        } = options;

        const padLength = length - str.length;
        if (padLength <= 0) return str;

        const padding = char.repeat(padLength);

        switch (position) {
            case 'left':
                return padding + str;
            case 'right':
                return str + padding;
            case 'center':
                const leftPad = Math.floor(padLength / 2);
                const rightPad = padLength - leftPad;
                return char.repeat(leftPad) + str + char.repeat(rightPad);
            default:
                return str;
        }
    }

    /**
     * Count words in string
     * @param {string} str - Input string
     * @returns {number} Word count
     */
    wordCount(str) {
        if (!str) return 0;

        const words = str.trim().split(/\s+/);
        return words.filter(word => word.length > 0).length;
    }

    /**
     * Count characters in string (excluding spaces)
     * @param {string} str - Input string
     * @param {boolean} includeSpaces - Include spaces in count
     * @returns {number} Character count
     */
    charCount(str, includeSpaces = false) {
        if (!str) return 0;

        return includeSpaces ? str.length : str.replace(/\s/g, '').length;
    }

    /**
     * Extract URLs from string
     * @param {string} str - Input string
     * @returns {Array} Array of URLs
     */
    extractUrls(str) {
        if (!str) return [];

        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return str.match(urlRegex) || [];
    }

    /**
     * Extract email addresses from string
     * @param {string} str - Input string
     * @returns {Array} Array of email addresses
     */
    extractEmails(str) {
        if (!str) return [];

        const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;
        return str.match(emailRegex) || [];
    }

    /**
     * Convert string to boolean
     * @param {string} str - String to convert
     * @returns {boolean} Boolean value
     */
    toBoolean(str) {
        if (!str) return false;

        const trueValues = ['true', 'yes', 'y', '1', 'on'];
        return trueValues.includes(str.toLowerCase());
    }

    /**
     * Reverse string
     * @param {string} str - String to reverse
     * @returns {string} Reversed string
     */
    reverse(str) {
        if (!str) return '';

        return str.split('').reverse().join('');
    }

    /**
     * Check if string is palindrome
     * @param {string} str - String to check
     * @param {boolean} caseSensitive - Case sensitive check
     * @returns {boolean} True if palindrome
     */
    isPalindrome(str, caseSensitive = false) {
        if (!str) return false;

        const cleaned = str.replace(/[^a-zA-Z0-9]/g, '');
        const normalized = caseSensitive ? cleaned : cleaned.toLowerCase();

        return normalized === this.reverse(normalized);
    }

    /**
     * Repeat string n times
     * @param {string} str - String to repeat
     * @param {number} times - Number of repetitions
     * @param {string} separator - Separator between repetitions
     * @returns {string} Repeated string
     */
    repeat(str, times = 1, separator = '') {
        if (!str || times <= 0) return '';

        return new Array(times).fill(str).join(separator);
    }

    /**
     * Match case of target string to source string
     * @param {string} target - Target string
     * @param {string} source - Source string for case
     * @returns {string} Target with matched case
     */
    matchCase(target, source) {
        if (!target || !source) return target;

        if (source === source.toUpperCase()) {
            return target.toUpperCase();
        } else if (source === source.toLowerCase()) {
            return target.toLowerCase();
        } else if (source[0] === source[0].toUpperCase()) {
            return this.capitalize(target.toLowerCase());
        }

        return target;
    }

    /**
     * Remove accents/diacritics from string
     * @param {string} str - Input string
     * @returns {string} String without accents
     */
    removeAccents(str) {
        if (!str) return '';

        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    /**
     * Convert string to ASCII
     * @param {string} str - Input string
     * @returns {string} ASCII string
     */
    toAscii(str) {
        if (!str) return '';

        return this.removeAccents(str).replace(/[^\x00-\x7F]/g, '');
    }

    /**
     * Check if string contains only ASCII characters
     * @param {string} str - String to check
     * @returns {boolean} True if only ASCII
     */
    isAscii(str) {
        if (!str) return true;

        return /^[\x00-\x7F]*$/.test(str);
    }

    /**
     * Encode string to base64
     * @param {string} str - String to encode
     * @returns {string} Base64 encoded string
     */
    toBase64(str) {
        if (!str) return '';

        return Buffer.from(str).toString('base64');
    }

    /**
     * Decode base64 string
     * @param {string} str - Base64 string
     * @returns {string} Decoded string
     */
    fromBase64(str) {
        if (!str) return '';

        try {
            return Buffer.from(str, 'base64').toString('utf8');
        } catch (e) {
            return '';
        }
    }

    /**
     * Generate initials from name
     * @param {string} name - Full name
     * @param {number} limit - Maximum initials
     * @returns {string} Initials
     */
    initials(name, limit = 2) {
        if (!name) return '';

        const parts = name.trim().split(/\s+/);
        const initials = parts
            .map(part => part[0])
            .filter(Boolean)
            .slice(0, limit)
            .join('')
            .toUpperCase();

        return initials;
    }

    /**
     * Mask sensitive string data
     * @param {string} str - String to mask
     * @param {Object} options - Masking options
     * @returns {string} Masked string
     */
    mask(str, options = {}) {
        if (!str) return '';

        const {
            start = 0,
            end = 0,
            char = '*',
            pattern = null
        } = options;

        if (pattern) {
            return str.replace(pattern, (match) => char.repeat(match.length));
        }

        const visibleStart = str.slice(0, start);
        const visibleEnd = str.slice(-end);
        const maskLength = Math.max(0, str.length - start - end);

        return visibleStart + char.repeat(maskLength) + visibleEnd;
    }
}

// Export singleton instance
module.exports = new StringUtils();
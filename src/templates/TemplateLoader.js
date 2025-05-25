/**
 * ===AI PROMPT ==============================================================
 * FILE: src/templates/TemplateLoader.js
 * VERSION: 2025-05-25 13:22:11
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 * Build a template loader that manages template file discovery, caching, and
 * dependency resolution from the templates/files directory.
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
 * FILE: src/templates/TemplateLoader.js
 *
 * AI PROMPT FOR CODE REVIEW/ENHANCEMENT:
 * =====================================
 *
 * You are reviewing a template file loader that manages template caching and file operations
 * for the code generation system. This component handles loading, caching, and validation
 * of template files used by the template engine.
 *
 * RESPONSIBILITIES:
 * - Load template files from the file system with proper error handling
 * - Implement intelligent caching to improve performance for repeated template usage
 * - Validate template file existence and readability before loading
 * - Provide fallback mechanisms for missing template files
 * - Handle different template file extensions and formats
 * - Manage memory usage for template caching
 *
 * TECHNICAL FEATURES:
 * - In-memory template caching with LRU eviction
 * - Asynchronous file loading with proper error handling
 * - Template file validation and existence checking
 * - Support for nested template directory structures
 * - Performance monitoring and cache statistics
 * - Automatic cache invalidation for development
 *
 * REVIEW FOCUS:
 * - File system error handling and edge cases
 * - Memory management for large template sets
 * - Performance optimization for frequent template access
 * - Cross-platform file path handling
 * - Cache invalidation strategies and debugging capabilities
 */

const fs = require('fs').promises;
const path = require('path');

class TemplateLoader {
    constructor(templatesDir = null) {
        this.templatesDir = templatesDir || path.join(__dirname, 'files');
        this.cache = new Map();
        this.maxCacheSize = 100; // Maximum number of cached templates
        this.stats = {
            hits: 0,
            misses: 0,
            loads: 0,
            errors: 0
        };
    }

    /**
     * Load template file with caching
     */
    async load(templateName) {
        // Check cache first
        if (this.cache.has(templateName)) {
            this.stats.hits++;
            return this.cache.get(templateName);
        }

        this.stats.misses++;

        try {
            const content = await this.loadFromFile(templateName);

            // Cache the template (with size limit)
            this.cacheTemplate(templateName, content);

            this.stats.loads++;
            return content;
        } catch (error) {
            this.stats.errors++;
            throw new Error(`Failed to load template "${templateName}": ${error.message}`);
        }
    }

    /**
     * Load template from file system
     */
    async loadFromFile(templateName) {
        const templatePath = this.resolveTemplatePath(templateName);

        try {
            // Check if file exists
            await fs.access(templatePath);

            // Read file content
            const content = await fs.readFile(templatePath, 'utf8');

            if (!content || content.trim() === '') {
                throw new Error(`Template file is empty: ${templatePath}`);
            }

            return content;
        } catch (error) {
            if (error.code === 'ENOENT') {
                throw new Error(`Template file not found: ${templatePath}`);
            } else if (error.code === 'EACCES') {
                throw new Error(`Permission denied reading template: ${templatePath}`);
            } else {
                throw error;
            }
        }
    }

    /**
     * Resolve template file path
     */
    resolveTemplatePath(templateName) {
        // Normalize template name
        const normalizedName = templateName.replace(/\\/g, '/');

        // Construct full path
        const templatePath = path.join(this.templatesDir, normalizedName);

        // Security check: ensure path is within templates directory
        const resolvedPath = path.resolve(templatePath);
        const resolvedTemplatesDir = path.resolve(this.templatesDir);

        if (!resolvedPath.startsWith(resolvedTemplatesDir)) {
            throw new Error(`Template path outside of templates directory: ${templateName}`);
        }

        return templatePath;
    }

    /**
     * Cache template with size management
     */
    cacheTemplate(templateName, content) {
        // If cache is full, remove oldest entry (simple LRU)
        if (this.cache.size >= this.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        this.cache.set(templateName, content);
    }

    /**
     * Check if template exists
     */
    async exists(templateName) {
        try {
            const templatePath = this.resolveTemplatePath(templateName);
            await fs.access(templatePath);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * List available templates
     */
    async listTemplates(directory = '') {
        const searchDir = directory ?
            path.join(this.templatesDir, directory) :
            this.templatesDir;

        try {
            const entries = await fs.readdir(searchDir, {withFileTypes: true});
            const templates = [];

            for (const entry of entries) {
                const fullPath = path.join(searchDir, entry.name);
                const relativePath = path.relative(this.templatesDir, fullPath);

                if (entry.isDirectory()) {
                    // Recursively list templates in subdirectories
                    const subTemplates = await this.listTemplates(relativePath);
                    templates.push(...subTemplates);
                } else if (entry.name.endsWith('.template')) {
                    templates.push(relativePath);
                }
            }

            return templates;
        } catch (error) {
            throw new Error(`Failed to list templates in ${searchDir}: ${error.message}`);
        }
    }

    /**
     * Get template metadata
     */
    async getTemplateInfo(templateName) {
        const templatePath = this.resolveTemplatePath(templateName);

        try {
            const stats = await fs.stat(templatePath);
            const content = await this.load(templateName);

            return {
                name: templateName,
                path: templatePath,
                size: stats.size,
                modified: stats.mtime,
                lines: content.split('\n').length,
                cached: this.cache.has(templateName)
            };
        } catch (error) {
            throw new Error(`Failed to get template info for "${templateName}": ${error.message}`);
        }
    }

    /**
     * Preload commonly used templates
     */
    async preload(templateNames) {
        const results = [];

        for (const templateName of templateNames) {
            try {
                await this.load(templateName);
                results.push({template: templateName, success: true});
            } catch (error) {
                results.push({
                    template: templateName,
                    success: false,
                    error: error.message
                });
            }
        }

        return results;
    }

    /**
     * Clear template cache
     */
    clearCache(templateName = null) {
        if (templateName) {
            return this.cache.delete(templateName);
        } else {
            this.cache.clear();
            return true;
        }
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            ...this.stats,
            cacheSize: this.cache.size,
            maxCacheSize: this.maxCacheSize,
            hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0
        };
    }

    /**
     * Set cache size limit
     */
    setCacheSize(maxSize) {
        this.maxCacheSize = Math.max(1, maxSize);

        // Trim cache if it's now too large
        while (this.cache.size > this.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
    }

    /**
     * Validate template directory structure
     */
    async validateTemplateDirectory() {
        const issues = [];

        try {
            await fs.access(this.templatesDir);
        } catch (error) {
            issues.push(`Templates directory does not exist: ${this.templatesDir}`);
            return {isValid: false, issues};
        }

        // Check for required template files
        const requiredTemplates = [
            'api/route.ts.template',
            'pages/page.tsx.template',
            'config/layout.tsx.template',
            'config/globals.css.template'
        ];

        for (const template of requiredTemplates) {
            const exists = await this.exists(template);
            if (!exists) {
                issues.push(`Required template missing: ${template}`);
            }
        }

        return {
            isValid: issues.length === 0,
            issues,
            templateCount: (await this.listTemplates()).length
        };
    }

    /**
     * Watch template directory for changes (development mode)
     */
    watchTemplates(callback) {
        if (typeof callback !== 'function') {
            throw new Error('Watch callback must be a function');
        }

        try {
            const fs = require('fs');
            const watcher = fs.watch(this.templatesDir, {recursive: true}, (eventType, filename) => {
                if (filename && filename.endsWith('.template')) {
                    // Clear cache for changed template
                    this.clearCache(filename);
                    callback(eventType, filename);
                }
            });

            return watcher;
        } catch (error) {
            throw new Error(`Failed to watch templates directory: ${error.message}`);
        }
    }

    /**
     * Get template directory path
     */
    getTemplatesDir() {
        return this.templatesDir;
    }

    /**
     * Set templates directory
     */
    setTemplatesDir(newDir) {
        this.templatesDir = path.resolve(newDir);
        this.clearCache(); // Clear cache when the directory changes
    }
}

module.exports = TemplateLoader;
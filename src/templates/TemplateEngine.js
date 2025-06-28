/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - AI PROMPT
 * ============================================================================
 * FILE: src/templates/TemplateEngine.js
 * VERSION: 2025-06-17 21:42:10
 * PHASE: Phase 4: Template System
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 *
 * Create a template engine wrapper class using ES Module syntax around
 * Handlebars that manages template loading and rendering for the code
 * generator with DaisyUI-specific helpers. Import Handlebars and other
 * dependencies using ES Module imports. This class should load templates
 * from the templates directory using ES Module URL resolution and
 * fs.readFileSync, compile and cache templates for performance, register
 * custom Handlebars helpers for code generation tasks by importing from
 * helpers.js, register DaisyUI-specific helpers for component class
 * generation, support template overrides from user-specified directories,
 * render templates with provided data contexts including theme
 * configuration, handle missing templates with clear error messages,
 * support partials for reusable template fragments (especially for common
 * DaisyUI patterns), provide debugging information when template rendering
 * fails, and maintain a registry of available DaisyUI components and their
 * usage patterns. Export as default.
 *
 * ============================================================================
 */
import Handlebars from 'handlebars';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as helpers from './helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Template Engine wrapper around Handlebars for code generation
 */
export default class TemplateEngine {
    constructor(options = {}) {
        this.options = {
            baseDir: path.join(__dirname, '../../templates'),
            cacheTemplates: true,
            debug: false,
            ...options
        };

        // Initialize Handlebars instance
        this.handlebars = Handlebars.create();

        // Template cache
        this.templateCache = new Map();
        this.partialCache = new Map();

        // Override directories for custom templates
        this.overrideDirs = options.overrideDirs || [];
        if (options.templateDir) {
            this.overrideDirs.unshift(options.templateDir);
        }

        // Register all helpers from helpers.js
        this.registerHelpers();

        // Load partials on initialization
        this.loadPartials();
    }

    /**
     * Register custom Handlebars helpers
     */
    registerHelpers() {
        // Register all exported helpers from helpers.js
        Object.entries(helpers).forEach(([name, helper]) => {
            if (typeof helper === 'function') {
                this.handlebars.registerHelper(name, helper);
            }
        });

        // Register additional built-in helpers
        this.handlebars.registerHelper('eq', (a, b) => a === b);
        this.handlebars.registerHelper('ne', (a, b) => a !== b);
        this.handlebars.registerHelper('lt', (a, b) => a < b);
        this.handlebars.registerHelper('gt', (a, b) => a > b);
        this.handlebars.registerHelper('lte', (a, b) => a <= b);
        this.handlebars.registerHelper('gte', (a, b) => a >= b);
        this.handlebars.registerHelper('and', (a, b) => a && b);
        this.handlebars.registerHelper('or', (a, b) => a || b);
        this.handlebars.registerHelper('not', (a) => !a);

        // Math helpers
        this.handlebars.registerHelper('add', (a, b) => {
            return parseInt(a) + parseInt(b);
        });

        this.handlebars.registerHelper('subtract', (a, b) => {
            return parseInt(a) - parseInt(b);
        });

        this.handlebars.registerHelper('multiply', (a, b) => {
            return parseInt(a) * parseInt(b);
        });

        this.handlebars.registerHelper('divide', (a, b) => {
            return parseInt(a) / parseInt(b);
        });

        // Array helpers
        this.handlebars.registerHelper('includes', (arr, value) => {
            return Array.isArray(arr) && arr.includes(value);
        });

        this.handlebars.registerHelper('length', (arr) => {
            return Array.isArray(arr) ? arr.length : 0;
        });

        // Object helpers
        this.handlebars.registerHelper('keys', (obj) => {
            return obj ? Object.keys(obj) : [];
        });

        this.handlebars.registerHelper('values', (obj) => {
            return obj ? Object.values(obj) : [];
        });

        // String helpers
        this.handlebars.registerHelper('concat', (...args) => {
            // Remove last argument (Handlebars options object)
            args.pop();
            return args.join('');
        });

        // Debug helper
        this.handlebars.registerHelper('debug', (context) => {
            if (this.options.debug) {
                console.log('DEBUG:', JSON.stringify(context, null, 2));
            }
            return '';
        });
    }

    /**
     * Load all partials from the partials directory
     */
    loadPartials() {
        const partialsDir = path.join(this.options.baseDir, 'partials');

        // Check if partials directory exists
        if (!fs.existsSync(partialsDir)) {
            return;
        }

        // Load all .hbs files as partials
        const files = fs.readdirSync(partialsDir);
        files.forEach(file => {
            if (file.endsWith('.hbs')) {
                const name = path.basename(file, '.hbs');
                const content = fs.readFileSync(path.join(partialsDir, file), 'utf-8');
                this.handlebars.registerPartial(name, content);
                this.partialCache.set(name, content);
            }
        });
    }

    /**
     * Ensure template path has .hbs extension
     */
    normalizeTemplatePath(templatePath) {
        // If it already has .hbs extension, return as is
        if (templatePath.endsWith('.hbs')) {
            return templatePath;
        }
        // Otherwise, append .hbs
        return templatePath + '.hbs';
    }

    /**
     * Find template file, checking override directories first
     */
    findTemplate(templatePath) {
        // Normalize the template path to ensure .hbs extension
        const normalizedPath = this.normalizeTemplatePath(templatePath);

        // Check override directories first
        for (const overrideDir of this.overrideDirs) {
            const fullPath = path.join(overrideDir, normalizedPath);
            if (fs.existsSync(fullPath)) {
                return fullPath;
            }
        }

        // Check default template directory
        const defaultPath = path.join(this.options.baseDir, normalizedPath);
        if (fs.existsSync(defaultPath)) {
            return defaultPath;
        }

        return null;
    }

    /**
     * Load and compile a template
     */
    loadTemplate(templatePath) {
        // Normalize the template path
        const normalizedPath = this.normalizeTemplatePath(templatePath);

        // Check cache first
        if (this.options.cacheTemplates && this.templateCache.has(normalizedPath)) {
            return this.templateCache.get(normalizedPath);
        }

        // Find template file
        const fullPath = this.findTemplate(templatePath);
        if (!fullPath) {
            throw new Error(`Template not found: ${templatePath}`);
        }

        try {
            // Read template content
            const content = fs.readFileSync(fullPath, 'utf-8');

            // Compile template
            const compiled = this.handlebars.compile(content, {
                strict: false,
                noEscape: false
            });

            // Cache if enabled
            if (this.options.cacheTemplates) {
                this.templateCache.set(normalizedPath, compiled);
            }

            return compiled;
        } catch (error) {
            throw new Error(`Failed to load template ${templatePath}: ${error.message}`);
        }
    }

    /**
     * Render a template with data
     */
    render(templatePath, data = {}) {
        try {
            const template = this.loadTemplate(templatePath);

            // Add metadata to context
            const context = {
                ...data,
                _meta: {
                    timestamp: new Date().toISOString(),
                    template: templatePath,
                    generator: 'swagger-to-nextjs'
                }
            };

            // Render template
            const result = template(context);

            return result;
        } catch (error) {
            // Provide debugging information
            if (this.options.debug) {
                console.error('Template rendering error:');
                console.error('  Template:', templatePath);
                console.error('  Error:', error.message);
                console.error('  Stack:', error.stack);
                console.error('  Data:', JSON.stringify(data, null, 2));
            }

            throw new Error(
                `Failed to render template ${templatePath}: ${error.message}\n` +
                `Enable debug mode for more information.`
            );
        }
    }

    /**
     * Render a string template (not from file)
     */
    renderString(templateString, data = {}) {
        try {
            const template = this.handlebars.compile(templateString);
            return template(data);
        } catch (error) {
            throw new Error(`Failed to render string template: ${error.message}`);
        }
    }

    /**
     * Register a custom partial
     */
    registerPartial(name, content) {
        this.handlebars.registerPartial(name, content);
        this.partialCache.set(name, content);
    }

    /**
     * Register a custom helper
     */
    registerHelper(name, helper) {
        this.handlebars.registerHelper(name, helper);
    }

    /**
     * Clear template cache
     */
    clearCache() {
        this.templateCache.clear();
    }

    /**
     * Get list of available templates
     */
    listTemplates(subdirectory = '') {
        const templates = [];
        const searchDir = path.join(this.options.baseDir, subdirectory);

        if (fs.existsSync(searchDir)) {
            const files = fs.readdirSync(searchDir, { withFileTypes: true });

            files.forEach(file => {
                const relativePath = path.join(subdirectory, file.name);

                if (file.isDirectory()) {
                    // Recursively list templates in subdirectories
                    templates.push(...this.listTemplates(relativePath));
                } else if (file.name.endsWith('.hbs')) {
                    templates.push(relativePath);
                }
            });
        }

        return templates;
    }

    /**
     * Validate template exists
     */
    templateExists(templatePath) {
        return this.findTemplate(templatePath) !== null;
    }

    /**
     * Get template content without rendering
     */
    getTemplateContent(templatePath) {
        const fullPath = this.findTemplate(templatePath);
        if (!fullPath) {
            throw new Error(`Template not found: ${templatePath}`);
        }
        return fs.readFileSync(fullPath, 'utf-8');
    }

    /**
     * Set template override directory
     */
    setOverrideDir(dir) {
        if (!this.overrideDirs.includes(dir)) {
            this.overrideDirs.unshift(dir);
            // Clear cache when override is added
            this.clearCache();
        }
    }

    /**
     * Remove template override directory
     */
    removeOverrideDir(dir) {
        const index = this.overrideDirs.indexOf(dir);
        if (index > -1) {
            this.overrideDirs.splice(index, 1);
            // Clear cache when override is removed
            this.clearCache();
        }
    }

    /**
     * Get Handlebars instance for advanced usage
     */
    getHandlebars() {
        return this.handlebars;
    }
}
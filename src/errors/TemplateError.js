/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - AI PROMPT
 * ============================================================================
 * FILE: src/errors/TemplateError.js
 * VERSION: 2025-05-30 11:34:23
 * PHASE: PHASE 2: Core System Components
 * CATEGORY: 🚨 Error Handling System
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 *
 * Create a detailed TemplateError class that:
 * - Pinpoints exact error location in templates 
 * - Provides syntax highlighting for error context 
 * - Includes variable scope information 
 * - Shows a template inheritance chain 
 * - Provides helper function documentation 
 * - Suggests common fixes 
 * - Validates template syntax 
 * - Checks for undefined variables 
 * - Provides template debugging tips 
 * - Integrates with template engine errors
 *
 * ============================================================================
 */
const GeneratorError = require('./GeneratorError');
const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');

/**
 * TemplateError - Detailed error handling for template processing
 */
class TemplateError extends GeneratorError {
    constructor(message, details = {}) {
        const code = details.code || 'TEMPLATE_ERROR';

        super(message, code, {
            category: 'template',
            ...details
        });

        // Template-specific properties
        this.templateName = details.templateName || null;
        this.templatePath = details.templatePath || null;
        this.templateContent = details.templateContent || null;
        this.errorLine = details.line || null;
        this.errorColumn = details.column || null;
        this.templateEngine = details.engine || 'handlebars';

        // Error context
        this.syntaxError = details.syntaxError || null;
        this.undefinedVariable = details.undefinedVariable || null;
        this.helperError = details.helperError || null;
        this.partialError = details.partialError || null;

        // Variable scope information
        this.variableScope = details.variableScope || {};
        this.availableVariables = details.availableVariables || [];
        this.requiredVariables = details.requiredVariables || [];

        // Template inheritance chain
        this.inheritanceChain = details.inheritanceChain || [];
        this.parentTemplate = details.parentTemplate || null;
        this.childTemplates = details.childTemplates || [];

        // Helper function information
        this.availableHelpers = details.availableHelpers || [];
        this.helperDocumentation = {};

        // Error location context
        this.errorContext = null;
        this.syntaxHighlight = null;

        // Common fixes
        this.fixes = this._generateFixes();

        // Debugging tips
        this.debuggingTips = this._generateDebuggingTips();

        // Parse template error if available
        if (details.originalError) {
            this._parseTemplateEngineError(details.originalError);
        }
    }

    /**
     * Parse template engine specific errors
     */
    _parseTemplateEngineError(error) {
        switch (this.templateEngine) {
            case 'handlebars':
                this._parseHandlebarsError(error);
                break;
            case 'ejs':
                this._parseEjsError(error);
                break;
            case 'pug':
                this._parsePugError(error);
                break;
            case 'mustache':
                this._parseMustacheError(error);
                break;
            case 'nunjucks':
                this._parseNunjucksError(error);
                break;
        }
    }

    /**
     * Parse Handlebars error
     */
    _parseHandlebarsError(error) {
        // Extract line and column from Handlebars error
        const lineMatch = error.message.match(/line (\d+)/i);
        const colMatch = error.message.match(/column (\d+)/i);

        if (lineMatch) this.errorLine = parseInt(lineMatch[1]);
        if (colMatch) this.errorColumn = parseInt(colMatch[1]);

        // Check for common Handlebars errors
        if (error.message.includes('not defined')) {
            const varMatch = error.message.match(/"([^"]+)" not defined/);
            if (varMatch) {
                this.undefinedVariable = varMatch[1];
            }
        }

        if (error.message.includes('Missing helper')) {
            const helperMatch = error.message.match(/Missing helper: "([^"]+)"/);
            if (helperMatch) {
                this.helperError = helperMatch[1];
            }
        }

        if (error.message.includes('partial')) {
            const partialMatch = error.message.match(/partial ['"](.*?)['"]/);
            if (partialMatch) {
                this.partialError = partialMatch[1];
            }
        }
    }

    /**
     * Parse EJS error
     */
    _parseEjsError(error) {
        // EJS includes line numbers in stack trace
        const stackMatch = error.stack.match(/at eval.*:(\d+):(\d+)/);
        if (stackMatch) {
            this.errorLine = parseInt(stackMatch[1]);
            this.errorColumn = parseInt(stackMatch[2]);
        }

        // Check for undefined variable
        if (error.message.includes('is not defined')) {
            const varMatch = error.message.match(/(\w+) is not defined/);
            if (varMatch) {
                this.undefinedVariable = varMatch[1];
            }
        }
    }

    /**
     * Parse Pug error
     */
    _parsePugError(error) {
        // Pug provides structured error information
        if (error.line) this.errorLine = error.line;
        if (error.column) this.errorColumn = error.column;
        if (error.filename) this.templatePath = error.filename;

        // Extract error type
        if (error.msg) {
            this.syntaxError = error.msg;
        }
    }

    /**
     * Parse Mustache error
     */
    _parseMustacheError(error) {
        // Mustache errors are less structured
        if (error.message.includes('Unclosed')) {
            this.syntaxError = 'Unclosed tag';
        }

        // Try to extract line number from message
        const lineMatch = error.message.match(/line (\d+)/);
        if (lineMatch) {
            this.errorLine = parseInt(lineMatch[1]);
        }
    }

    /**
     * Parse Nunjucks error
     */
    _parseNunjucksError(error) {
        // Nunjucks provides line info
        if (error.lineno) this.errorLine = error.lineno;
        if (error.colno) this.errorColumn = error.colno;

        // Check error type
        if (error.name === 'Template render error') {
            // Extract nested error information
            const innerMatch = error.message.match(/\((.*?)\)/);
            if (innerMatch) {
                this.templatePath = innerMatch[1];
            }
        }
    }

    /**
     * Load template content and generate error context
     */
    async loadErrorContext() {
        if (!this.templatePath || !this.errorLine) return;

        try {
            const content = await fs.readFile(this.templatePath, 'utf8');
            this.templateContent = content;

            const lines = content.split('\n');
            const startLine = Math.max(0, this.errorLine - 4);
            const endLine = Math.min(lines.length - 1, this.errorLine + 2);

            this.errorContext = {
                lines: [],
                errorLine: this.errorLine,
                errorColumn: this.errorColumn
            };

            for (let i = startLine; i <= endLine; i++) {
                this.errorContext.lines.push({
                    number: i + 1,
                    content: lines[i],
                    isError: i + 1 === this.errorLine
                });
            }

            // Generate syntax highlighted version
            this.syntaxHighlight = this._generateSyntaxHighlight();
        } catch (error) {
            // Unable to load template content
        }
    }

    /**
     * Generate syntax highlighted error context
     */
    _generateSyntaxHighlight() {
        if (!this.errorContext) return null;

        const highlighted = [];

        this.errorContext.lines.forEach(line => {
            let content = line.content;

            // Highlight based on template engine
            switch (this.templateEngine) {
                case 'handlebars':
                case 'mustache':
                    // Highlight Handlebars/Mustache tags
                    content = content.replace(/\{\{([^}]+)\}\}/g, (match, inner) => {
                        return chalk.yellow(`{{${chalk.cyan(inner)}}}`);
                    });
                    break;

                case 'ejs':
                    // Highlight EJS tags
                    content = content.replace(/<%([^%]*)%>/g, (match, inner) => {
                        return chalk.yellow(`<%${chalk.cyan(inner)}%>`);
                    });
                    break;

                case 'pug':
                    // Highlight Pug syntax
                    content = content.replace(/^(\s*)([\w#.]+)/gm, (match, indent, tag) => {
                        return indent + chalk.blue(tag);
                    });
                    break;
            }

            const lineNum = chalk.gray(String(line.number).padStart(4, ' ') + ' |');
            const marker = line.isError ? chalk.red('>') : ' ';

            highlighted.push(`${marker} ${lineNum} ${content}`);

            // Add error pointer
            if (line.isError && this.errorColumn) {
                const pointer = ' '.repeat(8 + this.errorColumn) + chalk.red('^');
                highlighted.push(pointer);
            }
        });

        return highlighted.join('\n');
    }

    /**
     * Generate common fixes
     */
    _generateFixes() {
        const fixes = [];

        if (this.undefinedVariable) {
            fixes.push({
                issue: `Undefined variable: ${this.undefinedVariable}`,
                solutions: [
                    `Ensure '${this.undefinedVariable}' is passed in the template context`,
                    `Add a default value: {{${this.undefinedVariable} || 'default'}}`,
                    `Use conditional: {{#if ${this.undefinedVariable}}}...{{/if}}`,
                    `Check for typos in variable name`
                ]
            });
        }

        if (this.helperError) {
            fixes.push({
                issue: `Missing helper: ${this.helperError}`,
                solutions: [
                    `Register the '${this.helperError}' helper before rendering`,
                    `Check helper name spelling`,
                    `Use a built-in helper instead`,
                    `Import helper from common helpers library`
                ]
            });
        }

        if (this.partialError) {
            fixes.push({
                issue: `Missing partial: ${this.partialError}`,
                solutions: [
                    `Create the partial file: ${this.partialError}.${this._getExtension()}`,
                    `Register the partial before rendering`,
                    `Check partial path and name`,
                    `Ensure partial directory is configured`
                ]
            });
        }

        if (this.syntaxError) {
            fixes.push({
                issue: `Syntax error: ${this.syntaxError}`,
                solutions: this._getSyntaxFixSuggestions()
            });
        }

        return fixes;
    }

    /**
     * Get syntax fix suggestions based on error
     */
    _getSyntaxFixSuggestions() {
        const suggestions = [];

        if (this.syntaxError.includes('Unclosed')) {
            suggestions.push('Check for missing closing tags');
            suggestions.push('Ensure all {{#if}} have matching {{/if}}');
            suggestions.push('Verify all {{#each}} have matching {{/each}}');
        }

        if (this.syntaxError.includes('Expected')) {
            suggestions.push('Check template syntax documentation');
            suggestions.push('Verify correct tag format for your template engine');
            suggestions.push('Look for missing or extra characters');
        }

        return suggestions;
    }

    /**
     * Generate debugging tips
     */
    _generateDebuggingTips() {
        const tips = [];

        tips.push({
            title: 'Enable Debug Mode',
            description: 'Set DEBUG=true to see detailed template compilation output',
            commands: ['export DEBUG=true', 'npm run generate']
        });

        tips.push({
            title: 'Log Template Context',
            description: 'Add logging to see what variables are available',
            code: `console.log('Template context:', context);`
        });

        tips.push({
            title: 'Use Template Playground',
            description: 'Test templates in isolation with sample data',
            commands: ['npm run template:playground']
        });

        tips.push({
            title: 'Validate Template Syntax',
            description: 'Use linting tools for your template engine',
            commands: this._getLintingCommands()
        });

        tips.push({
            title: 'Check Helper Registration',
            description: 'List all registered helpers',
            code: this._getHelperListingCode()
        });

        return tips;
    }

    /**
     * Get linting commands for template engine
     */
    _getLintingCommands() {
        switch (this.templateEngine) {
            case 'handlebars':
                return ['npm install -g handlebars-lint', 'handlebars-lint templates/**/*.hbs'];
            case 'ejs':
                return ['npm install -g ejs-lint', 'ejslint templates/**/*.ejs'];
            case 'pug':
                return ['npm install -g pug-lint', 'pug-lint templates/**/*.pug'];
            default:
                return ['Check documentation for linting tools'];
        }
    }

    /**
     * Get helper listing code
     */
    _getHelperListingCode() {
        switch (this.templateEngine) {
            case 'handlebars':
                return 'console.log(Handlebars.helpers);';
            case 'nunjucks':
                return 'console.log(env.globals);';
            default:
                return '// Check engine documentation';
        }
    }

    /**
     * Get file extension for template engine
     */
    _getExtension() {
        const extensions = {
            handlebars: 'hbs',
            mustache: 'mustache',
            ejs: 'ejs',
            pug: 'pug',
            nunjucks: 'njk'
        };
        return extensions[this.templateEngine] || 'html';
    }

    /**
     * Get helper documentation
     */
    getHelperDocumentation(helperName) {
        // This would be populated from helper definitions
        const commonHelpers = {
            'if': {
                description: 'Conditional block helper',
                usage: '{{#if condition}}...{{/if}}',
                example: '{{#if user}}Hello {{user.name}}{{/if}}'
            },
            'each': {
                description: 'Iterate over arrays or objects',
                usage: '{{#each array}}...{{/each}}',
                example: '{{#each items}}<li>{{this}}</li>{{/each}}'
            },
            'unless': {
                description: 'Inverse conditional block',
                usage: '{{#unless condition}}...{{/unless}}',
                example: '{{#unless loggedIn}}Please log in{{/unless}}'
            }
        };

        return commonHelpers[helperName] || null;
    }

    /**
     * Override CLI serialization
     */
    _serializeCLI() {
        const parts = [];

        // Error header
        parts.push(chalk.red(`✖ Template Error: ${this.message}`));

        if (this.templateName) {
            parts.push(chalk.gray(`  Template: ${this.templateName}`));
        }

        if (this.errorLine) {
            parts.push(chalk.gray(`  Location: Line ${this.errorLine}${this.errorColumn ? `, Column ${this.errorColumn}` : ''}`));
        }

        // Syntax highlighted code context
        if (this.syntaxHighlight) {
            parts.push('\n' + chalk.underline('Error Context:'));
            parts.push(this.syntaxHighlight);
        }

        // Specific error details
        if (this.undefinedVariable) {
            parts.push(chalk.yellow(`\n  ⚠️  Undefined variable: ${chalk.bold(this.undefinedVariable)}`));
            parts.push(chalk.gray(`     Available variables: ${this.availableVariables.join(', ') || 'none'}`));
        }

        if (this.helperError) {
            parts.push(chalk.yellow(`\n  ⚠️  Missing helper: ${chalk.bold(this.helperError)}`));
            parts.push(chalk.gray(`     Available helpers: ${this.availableHelpers.join(', ') || 'none'}`));
        }

        if (this.partialError) {
            parts.push(chalk.yellow(`\n  ⚠️  Missing partial: ${chalk.bold(this.partialError)}`));
        }

        // Template inheritance chain
        if (this.inheritanceChain.length > 0) {
            parts.push(chalk.blue('\n  📋 Template Inheritance:'));
            this.inheritanceChain.forEach((template, index) => {
                parts.push(`     ${index + 1}. ${template}`);
            });
        }

        // Fixes
        if (this.fixes.length > 0) {
            parts.push(chalk.green('\n  💡 Suggested Fixes:'));
            this.fixes.forEach(fix => {
                parts.push(chalk.yellow(`\n  ${fix.issue}:`));
                fix.solutions.forEach(solution => {
                    parts.push(chalk.green(`    • ${solution}`));
                });
            });
        }

        // Debugging tips
        if (process.env.DEBUG === 'true' && this.debuggingTips.length > 0) {
            parts.push(chalk.blue('\n  🔍 Debugging Tips:'));
            this.debuggingTips.forEach(tip => {
                parts.push(`\n  ${chalk.bold(tip.title)}`);
                parts.push(`    ${tip.description}`);
                if (tip.commands) {
                    tip.commands.forEach(cmd => {
                        parts.push(chalk.gray(`    $ ${cmd}`));
                    });
                }
                if (tip.code) {
                    parts.push(chalk.gray(`    ${tip.code}`));
                }
            });
        }

        return parts.join('\n');
    }

    /**
     * Static factory methods
     */
    static syntaxError(message, templateName, line, column, options = {}) {
        return new TemplateError(
            `Syntax error in template: ${message}`,
            {
                code: 'TEMPLATE_SYNTAX_ERROR',
                templateName,
                line,
                column,
                syntaxError: message,
                ...options
            }
        );
    }

    static undefinedVariable(varName, templateName, options = {}) {
        return new TemplateError(
            `Undefined variable '${varName}' in template`,
            {
                code: 'UNDEFINED_VARIABLE',
                templateName,
                undefinedVariable: varName,
                ...options
            }
        );
    }

    static missingHelper(helperName, templateName, options = {}) {
        return new TemplateError(
            `Missing helper function '${helperName}'`,
            {
                code: 'MISSING_HELPER',
                templateName,
                helperError: helperName,
                ...options
            }
        );
    }

    static missingPartial(partialName, templateName, options = {}) {
        return new TemplateError(
            `Missing partial template '${partialName}'`,
            {
                code: 'MISSING_PARTIAL',
                templateName,
                partialError: partialName,
                ...options
            }
        );
    }

    static compilationError(error, templateName, options = {}) {
        return new TemplateError(
            `Failed to compile template: ${error.message}`,
            {
                code: 'COMPILATION_ERROR',
                templateName,
                originalError: error,
                ...options
            }
        );
    }
}

module.exports = TemplateError;
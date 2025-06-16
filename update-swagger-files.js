#!/usr/bin/env node

/**
 * Swagger-to-NextJS File Generator
 * Reads CODEGEN-PROMPTS.md file and creates/updates files with versioned AI prompts
 * Adapted for the new markdown format
 */

import { promises as fs } from 'fs';
import { existsSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    purple: '\x1b[35m',
    cyan: '\x1b[36m'
};

// Logging functions
const log = {
    info: (msg) => console.log(`${colors.green}[INFO]${colors.reset} ${msg}`),
    warn: (msg) => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
    create: (msg) => console.log(`${colors.blue}[CREATE]${colors.reset} ${msg}`),
    update: (msg) => console.log(`${colors.purple}[UPDATE]${colors.reset} ${msg}`),
    skip: (msg) => console.log(`${colors.yellow}[SKIP]${colors.reset} ${msg}`),
    phase: (msg) => console.log(`${colors.cyan}[PHASE]${colors.reset} ${msg}`)
};

function showUsage() {
    console.log('Swagger-to-NextJS File Generator');
    console.log('');
    console.log('Usage: node update-swagger-files.js <markdown_file> [base_directory]');
    console.log('');
    console.log('Arguments:');
    console.log('  markdown_file    Path to CODEGEN-PROMPTS.md file');
    console.log('  base_directory   Base directory for generated files (default: ./swagger-to-nextjs)');
    console.log('');
    console.log('Options:');
    console.log('  -h, --help      Show this help message');
    console.log('');
    console.log('Examples:');
    console.log('  node update-swagger-files.js CODEGEN-PROMPTS.md');
    console.log('  node update-swagger-files.js CODEGEN-PROMPTS.md ./my-project');
}

export class MarkdownParser {
    constructor(filePath) {
        this.filePath = filePath;
        this.entries = [];
        this.currentPhase = '';
    }

    async parse() {
        try {
            const content = await fs.readFile(this.filePath, 'utf8');
            const lines = content.split(/\r?\n/);

            log.info(`Parsing markdown file: ${this.filePath}`);
            log.info(`File size: ${content.length} bytes`);
            log.info(`Total lines: ${lines.length}`);

            let currentFile = '';
            let currentPrompt = [];
            let collectingPrompt = false;
            let lineNumber = 0;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                lineNumber++;

                // Track phases - looking for "## Phase X:"
                if (line.match(/^## Phase \d+:/)) {
                    this.currentPhase = line.replace(/^## /, '').trim();
                    log.phase(`Found ${this.currentPhase}`);
                    continue;
                }

                // Check for file path - format: ### /path/to/file.ext
                const fileMatch = line.match(/^### (\/[^\s]+\.(js|ts|tsx|jsx|json|yaml|yml|md|css|sh|hbs))\s*$/);

                if (fileMatch) {
                    // Save previous entry if we have both file and prompt
                    if (currentFile && currentPrompt.length > 0) {
                        const promptText = currentPrompt.join('\n').trim();
                        if (promptText) {
                            this.entries.push({
                                file: currentFile.startsWith('/') ? currentFile.substring(1) : currentFile,
                                prompt: promptText,
                                phase: this.currentPhase,
                                lineNumber: lineNumber - currentPrompt.length - 1
                            });
                        }
                    }

                    currentFile = fileMatch[1];
                    currentPrompt = [];
                    collectingPrompt = true;
                    log.info(`Found file: ${currentFile} (line ${lineNumber})`);
                    continue;
                }

                // If we're collecting a prompt and hit another section marker, stop
                if (collectingPrompt && (
                    line.match(/^#{1,3} /) ||
                    line.match(/^---+$/) ||
                    line.trim() === '```'
                )) {
                    // Check if this is the start of a code block or another section
                    if (line.match(/^#{1,3} /) || line.match(/^---+$/)) {
                        collectingPrompt = false;

                        // Save current entry
                        if (currentFile && currentPrompt.length > 0) {
                            const promptText = currentPrompt.join('\n').trim();
                            if (promptText) {
                                this.entries.push({
                                    file: currentFile.startsWith('/') ? currentFile.substring(1) : currentFile,
                                    prompt: promptText,
                                    phase: this.currentPhase,
                                    lineNumber: lineNumber - currentPrompt.length - 1
                                });
                            }
                            currentFile = '';
                            currentPrompt = [];
                        }
                    }
                    continue;
                }

                // Collect prompt lines (skip empty lines at the beginning)
                if (collectingPrompt && currentFile) {
                    if (currentPrompt.length > 0 || line.trim()) {
                        currentPrompt.push(line);
                    }
                }
            }

            // Save the last entry
            if (currentFile && currentPrompt.length > 0) {
                const promptText = currentPrompt.join('\n').trim();
                if (promptText) {
                    this.entries.push({
                        file: currentFile.startsWith('/') ? currentFile.substring(1) : currentFile,
                        prompt: promptText,
                        phase: this.currentPhase,
                        lineNumber: lineNumber
                    });
                }
            }

            log.info(`Parsed ${this.entries.length} file entries`);

            if (this.entries.length === 0) {
                log.error('No entries found. Please check the markdown format.');
                return false;
            }

            // Show statistics by phase
            const phaseStats = {};
            this.entries.forEach(entry => {
                const phase = entry.phase || 'Unknown';
                phaseStats[phase] = (phaseStats[phase] || 0) + 1;
            });

            log.info('Files by phase:');
            Object.entries(phaseStats).forEach(([phase, count]) => {
                log.info(`  ${phase}: ${count} files`);
            });

            return true;

        } catch (error) {
            log.error(`Failed to parse markdown file: ${error.message}`);
            return false;
        }
    }
}

export class FileGenerator {
    constructor(baseDir) {
        this.baseDir = baseDir;
        this.stats = {
            created: 0,
            updated: 0,
            skipped: 0
        };
    }

    getFileExtension(filePath) {
        return path.extname(filePath).slice(1);
    }

    getCommentSyntax(extension) {
        const syntaxMap = {
            'js': { start: '/**', end: ' */', line: ' *' },
            'ts': { start: '/**', end: ' */', line: ' *' },
            'tsx': { start: '/**', end: ' */', line: ' *' },
            'jsx': { start: '/**', end: ' */', line: ' *' },
            'css': { start: '/**', end: ' */', line: ' *' },
            'yaml': { start: '#', end: '#', line: '#' },
            'yml': { start: '#', end: '#', line: '#' },
            'sh': { start: '#', end: '#', line: '#' },
            'hbs': { start: '{{!--', end: '--}}', line: '' },
            'md': { start: '<!--', end: '-->', line: '' },
            'json': { start: 'none', end: 'none', line: 'none' }
        };

        return syntaxMap[extension] || { start: '#', end: '#', line: '#' };
    }

    formatPromptText(prompt, maxLength = 75) {
        const lines = [];
        const paragraphs = prompt.split(/\n\n+/);

        paragraphs.forEach((paragraph, pIndex) => {
            if (pIndex > 0) lines.push(''); // Empty line between paragraphs

            const words = paragraph.split(/\s+/);
            let currentLine = '';

            words.forEach(word => {
                if (currentLine.length + word.length + 1 <= maxLength) {
                    currentLine += (currentLine ? ' ' : '') + word;
                } else {
                    if (currentLine) lines.push(currentLine);
                    currentLine = word;
                }
            });

            if (currentLine) lines.push(currentLine);
        });

        return lines;
    }

    createCommentBlock(filePath, prompt, version, syntax, phase) {
        if (syntax.start === 'none') {
            return ''; // JSON files don't support comments
        }

        const lines = [];
        const fileName = path.basename(filePath);

        if (syntax.start === '#') {
            // Shell/YAML style comments
            lines.push('#'.repeat(80));
            lines.push('# SWAGGER-TO-NEXTJS GENERATOR - AI PROMPT');
            lines.push('#'.repeat(80));
            lines.push(`# FILE: ${filePath}`);
            lines.push(`# VERSION: ${version}`);
            if (phase) lines.push(`# PHASE: ${phase}`);
            lines.push('#'.repeat(80));
            lines.push('#');
            lines.push('# AI GENERATION PROMPT:');
            lines.push('#');

            const promptLines = this.formatPromptText(prompt, 75);
            promptLines.forEach(line => {
                lines.push(line ? `# ${line}` : '#');
            });

            lines.push('#');
            lines.push('#'.repeat(80));
            lines.push('');

        } else if (syntax.start === '<!--') {
            // HTML/Markdown style comments
            lines.push('<!--');
            lines.push('='.repeat(78));
            lines.push('SWAGGER-TO-NEXTJS GENERATOR - AI PROMPT');
            lines.push('='.repeat(78));
            lines.push(`FILE: ${filePath}`);
            lines.push(`VERSION: ${version}`);
            if (phase) lines.push(`PHASE: ${phase}`);
            lines.push('='.repeat(78));
            lines.push('');
            lines.push('AI GENERATION PROMPT:');
            lines.push('');

            const promptLines = this.formatPromptText(prompt, 78);
            promptLines.forEach(line => {
                lines.push(line);
            });

            lines.push('');
            lines.push('='.repeat(78));
            lines.push('-->');
            lines.push('');

        } else if (syntax.start === '{{!--') {
            // Handlebars template comments
            lines.push('{{!--');
            lines.push('='.repeat(78));
            lines.push('SWAGGER-TO-NEXTJS GENERATOR - AI PROMPT');
            lines.push('='.repeat(78));
            lines.push(`FILE: ${filePath}`);
            lines.push(`VERSION: ${version}`);
            if (phase) lines.push(`PHASE: ${phase}`);
            lines.push('='.repeat(78));
            lines.push('');
            lines.push('AI GENERATION PROMPT:');
            lines.push('');

            const promptLines = this.formatPromptText(prompt, 78);
            promptLines.forEach(line => {
                lines.push(line);
            });

            lines.push('');
            lines.push('='.repeat(78));
            lines.push('--}}');
            lines.push('');

        } else {
            // JSDoc-style comments (JS/TS/CSS)
            lines.push('/**');
            lines.push(' * ' + '='.repeat(76));
            lines.push(' * SWAGGER-TO-NEXTJS GENERATOR - AI PROMPT');
            lines.push(' * ' + '='.repeat(76));
            lines.push(` * FILE: ${filePath}`);
            lines.push(` * VERSION: ${version}`);
            if (phase) lines.push(` * PHASE: ${phase}`);
            lines.push(' * ' + '='.repeat(76));
            lines.push(' *');
            lines.push(' * AI GENERATION PROMPT:');
            lines.push(' *');

            const promptLines = this.formatPromptText(prompt, 73);
            promptLines.forEach(line => {
                lines.push(line ? ` * ${line}` : ' *');
            });

            lines.push(' *');
            lines.push(' * ' + '='.repeat(76));
            lines.push(' */');
            lines.push('');
        }

        return lines.join('\n');
    }

    async getFileVersion(filePath) {
        try {
            if (!existsSync(filePath)) {
                return 'none';
            }

            const content = await fs.readFile(filePath, 'utf8');
            const versionMatch = content.match(/VERSION:\s*([^\n\r*]+)/);

            if (versionMatch) {
                return versionMatch[1].trim()
                    .replace(/\*\/.*$/, '')
                    .replace(/-->.*$/, '')
                    .replace(/--}}.*$/, '')
                    .replace(/^#+\s*/, '');
            }

            return 'none';
        } catch (error) {
            return 'none';
        }
    }

    async removeCommentBlock(content) {
        const lines = content.split('\n');
        const result = [];
        let inCommentBlock = false;
        let skipNextEmpty = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Check for start of our comment block
            if (!inCommentBlock) {
                // JSDoc style
                if (line.trim() === '/**' &&
                    i + 1 < lines.length &&
                    (lines[i + 1].includes('SWAGGER-TO-NEXTJS GENERATOR') ||
                        lines[i + 1].includes('============='))) {
                    inCommentBlock = true;
                    continue;
                }

                // Shell/YAML style
                if (line.includes('########') &&
                    i + 1 < lines.length &&
                    lines[i + 1].includes('SWAGGER-TO-NEXTJS GENERATOR')) {
                    inCommentBlock = true;
                    continue;
                }

                // HTML/Markdown style
                if (line.trim() === '<!--' &&
                    i + 1 < lines.length &&
                    (lines[i + 1].includes('======') ||
                        lines[i + 1].includes('SWAGGER-TO-NEXTJS GENERATOR'))) {
                    inCommentBlock = true;
                    continue;
                }

                // Handlebars style
                if (line.trim() === '{{!--' &&
                    i + 1 < lines.length &&
                    (lines[i + 1].includes('======') ||
                        lines[i + 1].includes('SWAGGER-TO-NEXTJS GENERATOR'))) {
                    inCommentBlock = true;
                    continue;
                }
            }

            // If we're in a comment block, look for the end
            if (inCommentBlock) {
                // JSDoc end
                if (line.trim() === '*/') {
                    inCommentBlock = false;
                    skipNextEmpty = true;
                    continue;
                }

                // HTML/Markdown end
                if (line.trim() === '-->') {
                    inCommentBlock = false;
                    skipNextEmpty = true;
                    continue;
                }

                // Handlebars end
                if (line.trim() === '--}}') {
                    inCommentBlock = false;
                    skipNextEmpty = true;
                    continue;
                }

                // Shell/YAML end
                if (line.includes('########') &&
                    i > 2 && // Make sure we're past the header
                    (i + 1 >= lines.length || !lines[i + 1].trim().startsWith('#'))) {
                    inCommentBlock = false;
                    skipNextEmpty = true;
                    continue;
                }

                // Skip lines that are part of the comment block
                continue;
            }

            // Skip one empty line after comment block
            if (skipNextEmpty && line.trim() === '') {
                skipNextEmpty = false;
                continue;
            }

            // Add non-comment lines to result
            result.push(line);
        }

        return result.join('\n');
    }

    async ensureDirectory(filePath) {
        const dir = path.dirname(filePath);
        try {
            await fs.mkdir(dir, { recursive: true });
        } catch (error) {
            if (error.code !== 'EEXIST') {
                throw error;
            }
        }
    }

    async processFile(entry, mdVersion) {
        const fullPath = path.join(this.baseDir, entry.file);
        const extension = this.getFileExtension(entry.file);
        const syntax = this.getCommentSyntax(extension);

        log.info(`Processing: ${entry.file}`);

        // Skip JSON files (no comments supported)
        if (syntax.start === 'none') {
            log.skip(`Skipping JSON file (no comments): ${entry.file}`);
            this.stats.skipped++;
            return;
        }

        await this.ensureDirectory(fullPath);

        const currentVersion = await this.getFileVersion(fullPath);
        const fileExists = existsSync(fullPath);

        if (!fileExists) {
            // Create new file
            const commentBlock = this.createCommentBlock(
                entry.file,
                entry.prompt,
                mdVersion,
                syntax,
                entry.phase
            );
            await fs.writeFile(fullPath, commentBlock, 'utf8');
            log.create(`Created: ${entry.file}`);
            this.stats.created++;

        } else if (currentVersion === 'none') {
            // File exists but no version comment
            const existingContent = await fs.readFile(fullPath, 'utf8');
            const cleanContent = await this.removeCommentBlock(existingContent);
            const commentBlock = this.createCommentBlock(
                entry.file,
                entry.prompt,
                mdVersion,
                syntax,
                entry.phase
            );
            await fs.writeFile(fullPath, commentBlock + cleanContent, 'utf8');
            log.update(`Added prompt to: ${entry.file}`);
            this.stats.updated++;

        } else if (currentVersion !== mdVersion) {
            // File has an old version
            const existingContent = await fs.readFile(fullPath, 'utf8');
            const cleanContent = await this.removeCommentBlock(existingContent);
            const commentBlock = this.createCommentBlock(
                entry.file,
                entry.prompt,
                mdVersion,
                syntax,
                entry.phase
            );
            await fs.writeFile(fullPath, commentBlock + cleanContent, 'utf8');
            log.update(`Updated prompt (v${currentVersion} → v${mdVersion}): ${entry.file}`);
            this.stats.updated++;

        } else {
            // File is up to date
            log.skip(`Up to date: ${entry.file}`);
            this.stats.skipped++;
        }

        // Make executable if it's a shell script or in bin directory
        if (extension === 'sh' || entry.file.includes('/bin/')) {
            try {
                await fs.chmod(fullPath, 0o755);
            } catch (error) {
                log.warn(`Could not make executable: ${error.message}`);
            }
        }
    }
}

async function main() {
    const args = process.argv.slice(2);

    // Check for help flag
    if (args.includes('-h') || args.includes('--help') || args.length === 0) {
        showUsage();
        process.exit(0);
    }

    const mdFile = args[0];
    const baseDir = args[1] || './swagger-to-nextjs';

    // Validate markdown file exists
    if (!existsSync(mdFile)) {
        log.error(`Markdown file not found: ${mdFile}`);
        process.exit(1);
    }

    // Get MD file version (modification time)
    const stats = statSync(mdFile);
    const date = new Date(stats.mtime);
    const mdVersion = date.getFullYear() + '-' +
        String(date.getMonth() + 1).padStart(2, '0') + '-' +
        String(date.getDate()).padStart(2, '0') + ' ' +
        String(date.getHours()).padStart(2, '0') + ':' +
        String(date.getMinutes()).padStart(2, '0') + ':' +
        String(date.getSeconds()).padStart(2, '0');

    console.log('');
    console.log('='.repeat(80));
    console.log('🚀 SWAGGER-TO-NEXTJS FILE GENERATOR');
    console.log('='.repeat(80));
    console.log('Configuration:');
    console.log(`  Markdown file: ${mdFile}`);
    console.log(`  Base directory: ${baseDir}`);
    console.log(`  Version: ${mdVersion}`);
    console.log('='.repeat(80));
    console.log('');

    try {
        // Parse markdown file
        const parser = new MarkdownParser(mdFile);
        const parseSuccess = await parser.parse();

        if (!parseSuccess) {
            process.exit(1);
        }

        // Generate files
        const generator = new FileGenerator(baseDir);

        log.info(`Processing ${parser.entries.length} files...`);
        console.log('');

        // Process files by phase
        let currentPhase = '';
        for (const entry of parser.entries) {
            if (entry.phase !== currentPhase) {
                currentPhase = entry.phase;
                console.log('');
                log.phase(`Processing ${currentPhase}`);
            }
            await generator.processFile(entry, mdVersion);
        }

        // Summary
        console.log('');
        console.log('='.repeat(80));
        console.log('✅ GENERATION COMPLETE');
        console.log('='.repeat(80));
        console.log('📊 Summary:');
        console.log(`   Total files processed: ${parser.entries.length}`);
        console.log(`   Files created: ${generator.stats.created}`);
        console.log(`   Files updated: ${generator.stats.updated}`);
        console.log(`   Files skipped: ${generator.stats.skipped}`);
        console.log(`   Version: ${mdVersion}`);
        console.log(`   Output directory: ${path.resolve(baseDir)}`);
        console.log('='.repeat(80));

        // Show created directory structure
        if (generator.stats.created > 0) {
            console.log('');
            console.log('📁 Project structure created:');

            // Dynamically show actual created directories
            const createdDirs = new Set();
            parser.entries.forEach(entry => {
                const dir = path.dirname(entry.file);
                const parts = dir.split(path.sep);
                let currentPath = '';
                parts.forEach(part => {
                    currentPath = currentPath ? path.join(currentPath, part) : part;
                    if (currentPath !== '.') {
                        createdDirs.add(currentPath);
                    }
                });
            });

            // Sort directories for consistent output
            const sortedDirs = Array.from(createdDirs).sort();

            // Display tree structure
            console.log(`   ${baseDir}/`);
            sortedDirs.forEach(dir => {
                const level = dir.split(path.sep).length;
                const lastPart = path.basename(dir);
                const indent = '   ' + '│   '.repeat(level - 1);
                const prefix = '├── ';
                console.log(`   ${indent}${prefix}${lastPart}/`);
            });

            // Show sample files
            console.log('');
            console.log('   Sample generated files:');
            const sampleFiles = parser.entries
                .filter((_, index) => index < 5)
                .map(entry => entry.file);
            sampleFiles.forEach(file => {
                console.log(`   - ${file}`);
            });
            if (parser.entries.length > 5) {
                console.log(`   ... and ${parser.entries.length - 5} more files`);
            }
        }

        console.log('');
        console.log('🎉 Files are ready for AI code generation!');
        console.log('');
        console.log('Next steps:');
        console.log('1. Review the generated file structure');
        console.log('2. Use the AI prompts in each file to generate the code');
        console.log('3. Follow the build sequence in the documentation');
        console.log('');

    } catch (error) {
        log.error(`Failed to process files: ${error.message}`);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run the main function only if this is the main module
// Check if this script is being run directly
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
    main();
}
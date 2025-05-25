/**
 * ===AI PROMPT ==============================================================
 * FILE: src/core/DirectoryManager.js
 * VERSION: 2025-05-25 13:22:11
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 * Create a DirectoryManager class for managing output directories, creating
 * folder structures, and handling file path resolution for generated NextJS
 * code.
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
 * FILE: src/core/DirectoryManager.js
 *
 * AI PROMPT FOR CODE REVIEW/ENHANCEMENT:
 * =====================================
 *
 * You are reviewing a directory management system for Next.js code generation.
 * This component handles creation and management of the complete directory structure
 * required for a Next.js 13+ application with App Router architecture.
 *
 * RESPONSIBILITIES:
 * - Create Next.js App Router directory structure (src/app/)
 * - Set up API routes directory structure (src/app/api/)
 * - Manage API client directory for OpenAPI generated code
 * - Create supporting directories (lib, utils, components)
 * - Handle path resolution and cross-platform compatibility
 * - Provide file writing utilities with proper error handling
 *
 * DIRECTORY STRUCTURE MANAGED:
 * - src/app/ (Next.js 13+ App Router)
 * - src/app/api/ (API route handlers)
 * - src/lib/api-client/ (OpenAPI generated client)
 * - Supporting directories for components and utilities
 *
 * REVIEW FOCUS:
 * - Cross-platform path handling (Windows/Unix)
 * - Permission handling and error recovery
 * - Directory structure compliance with Next.js conventions
 * - Performance optimization for large directory trees
 * - Atomic operations and rollback capabilities
 */

const fs = require('fs');
const path = require('path');

class DirectoryManager {
    constructor(outputDir, apiClientPath) {
        this.outputDir = outputDir;
        this.apiClientPath = apiClientPath;

        // Define directory structure
        this.directories = {
            // Main app directory
            app: path.join(outputDir, 'src', 'app'),

            // API routes directory
            api: path.join(outputDir, 'src', 'app', 'api'),

            // Pages directory (same as app for App Router)
            pages: path.join(outputDir, 'src', 'app'),

            // API client directory
            apiClient: apiClientPath,

            // Supporting directories
            lib: path.join(outputDir, 'src', 'lib'),
            components: path.join(outputDir, 'src', 'components'),
            utils: path.join(outputDir, 'src', 'utils'),

            // Root directories
            src: path.join(outputDir, 'src'),
            root: outputDir
        };
    }

    /**
     * Create all required directories
     */
    createDirectories() {
        try {
            console.log('📁 Creating directory structure...');

            // Create directories in order of dependency
            this.createDirectory(this.directories.root, 'Output directory');
            this.createDirectory(this.directories.src, 'Source directory');
            this.createDirectory(this.directories.lib, 'Library directory');
            this.createDirectory(this.directories.app, 'App directory');
            this.createDirectory(this.directories.api, 'API directory');
            this.createDirectory(this.directories.components, 'Components directory');
            this.createDirectory(this.directories.utils, 'Utils directory');

            // Create API client directory
            if (this.apiClientPath) {
                this.createDirectory(this.apiClientPath, 'API client directory');
            }

            this.logDirectoryStructure();
            console.log('✅ Directory structure created successfully\n');

        } catch (error) {
            throw new Error(`Failed to create directories: ${error.message}`);
        }
    }

    /**
     * Create a single directory with error handling
     */
    createDirectory(dirPath, description = 'Directory') {
        try {
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, {recursive: true});
                console.log(`📁 Created ${description.toLowerCase()}: ${dirPath}`);
            } else {
                console.log(`📁 ${description} already exists: ${dirPath}`);
            }
        } catch (error) {
            throw new Error(`Failed to create ${description.toLowerCase()}: ${error.message}`);
        }
    }

    /**
     * Get directory path by name
     */
    getDirectory(name) {
        if (!this.directories[name]) {
            throw new Error(`Unknown directory: ${name}`);
        }
        return this.directories[name];
    }

    /**
     * Get API route directory path for a specific route
     */
    getApiRouteDirectory(routePath) {
        // Convert Swagger path to Next.js path
        const nextJsPath = this.convertToNextJSPath(routePath);
        return path.join(this.directories.api, nextJsPath);
    }

    /**
     * Get page directory path for a specific route
     */
    getPageDirectory(routePath) {
        const nextJsPath = this.convertToNextJSPath(routePath);
        return path.join(this.directories.pages, nextJsPath);
    }

    /**
     * Convert Swagger path to Next.js dynamic route path
     */
    convertToNextJSPath(swaggerPath) {
        // Convert path parameters from {param} to [param]
        let converted = swaggerPath.replace(/{([^}]+)}/g, '[$1]');

        // Sanitize path - remove invalid characters but keep valid ones
        converted = converted.replace(/[^a-zA-Z0-9/_\[\]-]/g, '');

        // Remove trailing slash if present
        if (converted.endsWith('/') && converted.length > 1) {
            converted = converted.slice(0, -1);
        }

        // Ensure path starts with /
        if (!converted.startsWith('/')) {
            converted = '/' + converted;
        }

        // Validate the path doesn't have invalid patterns
        if (converted.includes('//') || converted.includes('[/') || converted.includes('/]')) {
            console.warn(`⚠️  Invalid path pattern detected: ${swaggerPath} → ${converted}`);
        }

        return converted;
    }

    /**
     * Write file to specified path with directory creation
     */
    writeFile(filePath, content, description = 'file') {
        try {
            // Ensure directory exists
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, {recursive: true});
            }

            // Write file
            fs.writeFileSync(filePath, content, 'utf8');

            // Get relative path for logging
            const relativePath = path.relative(this.outputDir, filePath);
            console.log(`✅ Generated ${description}: ${relativePath}`);

            return true;
        } catch (error) {
            console.error(`❌ Failed to write ${description}: ${error.message}`);
            return false;
        }
    }

    /**
     * Check if file exists
     */
    fileExists(filePath) {
        return fs.existsSync(filePath);
    }

    /**
     * Read file content
     */
    readFile(filePath) {
        try {
            return fs.readFileSync(filePath, 'utf8');
        } catch (error) {
            throw new Error(`Failed to read file ${filePath}: ${error.message}`);
        }
    }

    /**
     * Create API route file path
     */
    getApiRouteFilePath(routePath) {
        const routeDir = this.getApiRouteDirectory(routePath);
        return path.join(routeDir, 'route.ts');
    }

    /**
     * Create page file path
     */
    getPageFilePath(routePath) {
        const pageDir = this.getPageDirectory(routePath);
        return path.join(pageDir, 'page.tsx');
    }

    /**
     * Create config file path
     */
    getConfigFilePath(fileName) {
        return path.join(this.directories.app, fileName);
    }

    /**
     * Log the directory structure
     */
    logDirectoryStructure() {
        console.log('\n📁 Directory Structure:');
        console.log(`├── ${path.relative(process.cwd(), this.directories.root)}/`);
        console.log(`│   └── src/`);
        console.log(`│       ├── app/                    # Next.js App Router`);
        console.log(`│       │   └── api/               # API routes`);
        console.log(`│       ├── lib/                   # Library code`);
        console.log(`│       │   └── api-client/        # OpenAPI generated client`);
        console.log(`│       ├── components/            # React components`);
        console.log(`│       └── utils/                 # Utility functions`);
    }

    /**
     * Get statistics about the directory structure
     */
    getStats() {
        const stats = {
            totalDirectories: 0,
            createdDirectories: 0,
            existingDirectories: 0
        };

        Object.values(this.directories).forEach(dir => {
            stats.totalDirectories++;
            if (fs.existsSync(dir)) {
                stats.existingDirectories++;
            }
        });

        stats.createdDirectories = stats.totalDirectories - stats.existingDirectories;
        return stats;
    }

    /**
     * Validate directory structure
     */
    validateStructure() {
        const issues = [];

        Object.entries(this.directories).forEach(([name, dir]) => {
            if (!fs.existsSync(dir)) {
                issues.push(`Missing directory: ${name} (${dir})`);
            } else {
                try {
                    // Test write permissions
                    const testFile = path.join(dir, '.write-test');
                    fs.writeFileSync(testFile, 'test');
                    fs.unlinkSync(testFile);
                } catch (error) {
                    issues.push(`No write permission for: ${name} (${dir})`);
                }
            }
        });

        return {
            isValid: issues.length === 0,
            issues
        };
    }

    /**
     * Clean up generated files (for testing)
     */
    cleanup() {
        try {
            if (fs.existsSync(this.directories.root)) {
                fs.rmSync(this.directories.root, {recursive: true, force: true});
                console.log('🧹 Cleaned up generated files');
            }
        } catch (error) {
            console.error('Failed to cleanup:', error.message);
        }
    }
}

module.exports = DirectoryManager;
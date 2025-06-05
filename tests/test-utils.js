/**
 * ============================================================================
 * Test Utilities for Node.js Test Runner
 * Helper functions for test suites without mocking libraries
 * ============================================================================
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// ============================================================================
// CLI Testing Utilities
// ============================================================================

/**
 * Run a CLI command in an isolated process
 * @param {string} cliPath - Path to the CLI script
 * @param {string[]} args - Command line arguments
 * @param {Object} env - Environment variables
 * @param {Object} options - Additional spawn options
 * @returns {Promise<{code: number, stdout: string, stderr: string}>}
 */
function runCLI(cliPath, args = [], env = {}, options = {}) {
    return new Promise((resolve, reject) => {
        const child = spawn('node', [cliPath, ...args], {
            env: { ...process.env, ...env, FORCE_COLOR: '0' },
            timeout: 10000,
            ...options
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        child.on('close', (code) => {
            resolve({ code, stdout, stderr });
        });

        child.on('error', (err) => {
            reject(err);
        });
    });
}

/**
 * Run a script in an isolated Node.js process
 * @param {string} script - JavaScript code to execute
 * @param {Object} env - Environment variables
 * @param {Object} options - Additional spawn options
 * @returns {Promise<{code: number, stdout: string, stderr: string}>}
 */
function runScript(script, env = {}, options = {}) {
    return new Promise((resolve, reject) => {
        const child = spawn('node', ['-e', script], {
            env: { ...process.env, ...env, FORCE_COLOR: '0' },
            timeout: 10000,
            ...options
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => stdout += data.toString());
        child.stderr.on('data', (data) => stderr += data.toString());

        child.on('close', (code) => {
            resolve({ code, stdout, stderr });
        });

        child.on('error', reject);
    });
}

// ============================================================================
// File System Testing Utilities
// ============================================================================

class FileSystemTestHelper {
    constructor(basePath = process.cwd()) {
        this.basePath = basePath;
        this.tempDirs = new Set();
        this.tempFiles = new Set();
    }

    /**
     * Create a temporary directory
     * @param {string} prefix - Directory name prefix
     * @returns {string} Path to created directory
     */
    createTempDir(prefix = 'test') {
        const tempDir = path.join(this.basePath, `temp-${prefix}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`);
        fs.mkdirSync(tempDir, { recursive: true });
        this.tempDirs.add(tempDir);
        return tempDir;
    }

    /**
     * Create a temporary file with content
     * @param {string} filename - File name
     * @param {string} content - File content
     * @param {string} dir - Directory (optional)
     * @returns {string} Path to created file
     */
    createTempFile(filename, content = '', dir = null) {
        const directory = dir || this.createTempDir('file');
        const filepath = path.join(directory, filename);
        fs.writeFileSync(filepath, content);
        this.tempFiles.add(filepath);
        return filepath;
    }

    /**
     * Create a directory structure
     * @param {Object} structure - Directory structure definition
     * @param {string} basePath - Base path (optional)
     * @returns {string} Path to root directory
     */
    createDirectoryStructure(structure, basePath = null) {
        const root = basePath || this.createTempDir('struct');

        const createStructure = (obj, currentPath) => {
            for (const [name, content] of Object.entries(obj)) {
                const fullPath = path.join(currentPath, name);

                if (typeof content === 'string') {
                    // It's a file
                    fs.writeFileSync(fullPath, content);
                    this.tempFiles.add(fullPath);
                } else if (typeof content === 'object') {
                    // It's a directory
                    fs.mkdirSync(fullPath, { recursive: true });
                    createStructure(content, fullPath);
                }
            }
        };

        createStructure(structure, root);
        return root;
    }

    /**
     * Clean up all temporary files and directories
     */
    cleanup() {
        // Clean files first
        this.tempFiles.forEach(file => {
            if (fs.existsSync(file)) {
                fs.unlinkSync(file);
            }
        });
        this.tempFiles.clear();

        // Then clean directories
        this.tempDirs.forEach(dir => {
            if (fs.existsSync(dir)) {
                fs.rmSync(dir, { recursive: true, force: true });
            }
        });
        this.tempDirs.clear();
    }

    /**
     * Read JSON file safely
     * @param {string} filepath - Path to JSON file
     * @returns {Object|null} Parsed JSON or null
     */
    readJSON(filepath) {
        try {
            const content = fs.readFileSync(filepath, 'utf8');
            return JSON.parse(content);
        } catch (error) {
            return null;
        }
    }

    /**
     * Write JSON file
     * @param {string} filepath - Path to JSON file
     * @param {Object} data - Data to write
     * @param {boolean} pretty - Pretty print JSON
     */
    writeJSON(filepath, data, pretty = true) {
        const content = pretty
            ? JSON.stringify(data, null, 2)
            : JSON.stringify(data);
        fs.writeFileSync(filepath, content);
    }
}

// ============================================================================
// Async Testing Utilities
// ============================================================================

class AsyncTestHelper {
    /**
     * Wait for a condition to be true
     * @param {Function} condition - Function that returns true when condition is met
     * @param {Object} options - Options
     * @returns {Promise<void>}
     */
    static async waitFor(condition, options = {}) {
        const { timeout = 5000, interval = 100, message = 'Condition not met' } = options;
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
            if (await condition()) {
                return;
            }
            await new Promise(resolve => setTimeout(resolve, interval));
        }

        throw new Error(`Timeout: ${message}`);
    }

    /**
     * Wait for a promise with timeout
     * @param {Promise} promise - Promise to wait for
     * @param {number} timeout - Timeout in milliseconds
     * @param {string} message - Error message
     * @returns {Promise}
     */
    static async withTimeout(promise, timeout = 5000, message = 'Operation timed out') {
        let timeoutId;
        const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error(message)), timeout);
        });

        try {
            const result = await Promise.race([promise, timeoutPromise]);
            clearTimeout(timeoutId);
            return result;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    /**
     * Retry an async operation
     * @param {Function} operation - Async operation to retry
     * @param {Object} options - Options
     * @returns {Promise}
     */
    static async retry(operation, options = {}) {
        const { attempts = 3, delay = 1000, backoff = 2 } = options;
        let lastError;

        for (let i = 0; i < attempts; i++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                if (i < attempts - 1) {
                    await new Promise(resolve => setTimeout(resolve, delay * Math.pow(backoff, i)));
                }
            }
        }

        throw lastError;
    }
}

// ============================================================================
// Console Testing Utilities
// ============================================================================

class ConsoleTestHelper {
    constructor() {
        this.originalConsole = {
            log: console.log,
            error: console.error,
            warn: console.warn,
            info: console.info,
            debug: console.debug
        };
        this.captured = {
            log: [],
            error: [],
            warn: [],
            info: [],
            debug: []
        };
    }

    /**
     * Start capturing console output
     * @param {Array<string>} methods - Methods to capture (default: all)
     */
    startCapture(methods = ['log', 'error', 'warn', 'info', 'debug']) {
        methods.forEach(method => {
            if (this.originalConsole[method]) {
                console[method] = (...args) => {
                    this.captured[method].push(args);
                };
            }
        });
    }

    /**
     * Stop capturing and restore console
     */
    stopCapture() {
        Object.keys(this.originalConsole).forEach(method => {
            console[method] = this.originalConsole[method];
        });
    }

    /**
     * Get captured output
     * @param {string} method - Console method
     * @returns {Array} Captured calls
     */
    getCaptured(method = 'log') {
        return this.captured[method] || [];
    }

    /**
     * Clear captured output
     */
    clearCaptured() {
        Object.keys(this.captured).forEach(method => {
            this.captured[method] = [];
        });
    }
}

// ============================================================================
// Test Data Generators
// ============================================================================

class TestDataGenerator {
    /**
     * Generate random string
     * @param {number} length - String length
     * @param {string} charset - Character set
     * @returns {string}
     */
    static randomString(length = 10, charset = 'abcdefghijklmnopqrstuvwxyz0123456789') {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return result;
    }

    /**
     * Generate random ID
     * @param {string} prefix - ID prefix
     * @returns {string}
     */
    static randomId(prefix = 'id') {
        return `${prefix}-${Date.now()}-${this.randomString(8)}`;
    }

    /**
     * Generate random email
     * @param {string} domain - Email domain
     * @returns {string}
     */
    static randomEmail(domain = 'test.com') {
        return `${this.randomString(8)}@${domain}`;
    }
}

// ============================================================================
// Environment Testing Utilities
// ============================================================================

class EnvironmentTestHelper {
    constructor() {
        this.originalEnv = { ...process.env };
    }

    /**
     * Set environment variables
     * @param {Object} vars - Environment variables
     */
    setEnvVars(vars) {
        Object.assign(process.env, vars);
    }

    /**
     * Clear environment variable
     * @param {string} name - Variable name
     */
    clearEnvVar(name) {
        delete process.env[name];
    }

    /**
     * Restore original environment
     */
    restore() {
        process.env = { ...this.originalEnv };
    }
}

// ============================================================================
// Simple Function Spies (No external mocking library)
// ============================================================================

class FunctionSpy {
    constructor(originalFn = () => {}) {
        this.originalFn = originalFn;
        this.calls = [];
        this.returnValue = undefined;
        this.throwError = null;

        // Create the spy function
        this.spy = (...args) => {
            const callInfo = {
                args,
                timestamp: Date.now(),
                returnValue: undefined,
                error: null
            };

            this.calls.push(callInfo);

            if (this.throwError) {
                callInfo.error = this.throwError;
                throw this.throwError;
            }

            const result = this.returnValue !== undefined
                ? this.returnValue
                : this.originalFn(...args);

            callInfo.returnValue = result;
            return result;
        };
    }

    /**
     * Set return value for the spy
     */
    returns(value) {
        this.returnValue = value;
        return this;
    }

    /**
     * Make the spy throw an error
     */
    throws(error) {
        this.throwError = error;
        return this;
    }

    /**
     * Get number of times called
     */
    get callCount() {
        return this.calls.length;
    }

    /**
     * Check if called with specific arguments
     */
    calledWith(...args) {
        return this.calls.some(call =>
            JSON.stringify(call.args) === JSON.stringify(args)
        );
    }

    /**
     * Reset the spy
     */
    reset() {
        this.calls = [];
        this.returnValue = undefined;
        this.throwError = null;
    }
}

// ============================================================================
// Export all utilities
// ============================================================================

module.exports = {
    // CLI utilities
    runCLI,
    runScript,

    // Class-based utilities
    FileSystemTestHelper,
    AsyncTestHelper,
    ConsoleTestHelper,
    TestDataGenerator,
    EnvironmentTestHelper,
    FunctionSpy,

    // Factory functions
    createFileSystemHelper: (basePath) => new FileSystemTestHelper(basePath),
    createConsoleHelper: () => new ConsoleTestHelper(),
    createEnvironmentHelper: () => new EnvironmentTestHelper(),
    createSpy: (fn) => new FunctionSpy(fn),

    // Commonly used patterns
    testPatterns: {
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        filePath: /^(\/|\\|[a-zA-Z]:\\)/,
        ip: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    }
};
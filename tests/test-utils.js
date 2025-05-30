/**
 * ============================================================================
 * Enhanced Test Utilities
 * Central helper functions for all test suites
 * ============================================================================
 */

const { spawn, fork } = require('child_process');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// ============================================================================
// CLI Testing Utilities (from cli-test-utils.js)
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
// Mock Management Utilities
// ============================================================================

class MockManager {
    constructor() {
        this.mocks = new Map();
        this.spies = new Map();
    }

    /**
     * Create a mock function with tracking
     * @param {string} name - Name for the mock
     * @param {Function} implementation - Optional implementation
     * @returns {jest.Mock}
     */
    createMock(name, implementation) {
        const mock = jest.fn(implementation);
        this.mocks.set(name, mock);
        return mock;
    }

    /**
     * Create multiple mocks from an object
     * @param {Object} mockDefinitions - Object with mock definitions
     * @returns {Object} Object with created mocks
     */
    createMocks(mockDefinitions) {
        const mocks = {};
        for (const [key, value] of Object.entries(mockDefinitions)) {
            if (typeof value === 'function') {
                mocks[key] = this.createMock(key, value);
            } else {
                mocks[key] = this.createMock(key, () => value);
            }
        }
        return mocks;
    }

    /**
     * Create a spy on an object method
     * @param {Object} object - Object to spy on
     * @param {string} method - Method name
     * @param {Function} implementation - Optional implementation
     * @returns {jest.SpyInstance}
     */
    createSpy(object, method, implementation) {
        const spy = implementation
            ? jest.spyOn(object, method).mockImplementation(implementation)
            : jest.spyOn(object, method);
        this.spies.set(`${object.constructor.name}.${method}`, spy);
        return spy;
    }

    /**
     * Reset all mocks and spies
     */
    resetAll() {
        this.mocks.forEach(mock => mock.mockReset());
        this.spies.forEach(spy => spy.mockReset());
    }

    /**
     * Restore all spies
     */
    restoreAll() {
        this.spies.forEach(spy => spy.mockRestore());
        this.spies.clear();
    }

    /**
     * Clear all mocks and spies
     */
    clearAll() {
        this.mocks.forEach(mock => mock.mockClear());
        this.spies.forEach(spy => spy.mockClear());
    }

    /**
     * Get call history for a mock
     * @param {string} name - Mock name
     * @returns {Array} Call history
     */
    getCallHistory(name) {
        const mock = this.mocks.get(name);
        return mock ? mock.mock.calls : [];
    }
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

    /**
     * Run operations in parallel with concurrency limit
     * @param {Array} items - Items to process
     * @param {Function} operation - Async operation for each item
     * @param {number} concurrency - Max concurrent operations
     * @returns {Promise<Array>} Results
     */
    static async parallelLimit(items, operation, concurrency = 5) {
        const results = [];
        const executing = [];

        for (const [index, item] of items.entries()) {
            const promise = Promise.resolve()
                .then(() => operation(item, index))
                .then(result => results[index] = result);

            executing.push(promise);

            if (executing.length >= concurrency) {
                await Promise.race(executing);
                executing.splice(executing.findIndex(p => p === promise), 1);
            }
        }

        await Promise.all(executing);
        return results;
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
                console[method] = jest.fn((...args) => {
                    this.captured[method].push(args);
                });
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

    /**
     * Find captured output matching pattern
     * @param {string|RegExp} pattern - Pattern to match
     * @param {string} method - Console method
     * @returns {Array} Matching captures
     */
    findCaptured(pattern, method = 'log') {
        const captures = this.getCaptured(method);
        return captures.filter(args => {
            const text = args.join(' ');
            return pattern instanceof RegExp
                ? pattern.test(text)
                : text.includes(pattern);
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

    /**
     * Generate random file path
     * @param {string} extension - File extension
     * @returns {string}
     */
    static randomFilePath(extension = 'json') {
        return `/tmp/${this.randomString(8)}.${extension}`;
    }

    /**
     * Generate test error
     * @param {string} message - Error message
     * @param {string} code - Error code
     * @returns {Error}
     */
    static createError(message = 'Test error', code = 'TEST_ERROR') {
        const error = new Error(message);
        error.code = code;
        return error;
    }

    /**
     * Generate mock data structure
     * @param {Object} template - Data template
     * @param {number} count - Number of items
     * @returns {Array}
     */
    static generateMockData(template, count = 10) {
        const results = [];
        for (let i = 0; i < count; i++) {
            const item = {};
            for (const [key, generator] of Object.entries(template)) {
                item[key] = typeof generator === 'function' ? generator(i) : generator;
            }
            results.push(item);
        }
        return results;
    }
}

// ============================================================================
// Environment Testing Utilities
// ============================================================================

class EnvironmentTestHelper {
    constructor() {
        this.originalEnv = { ...process.env };
        this.originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
        this.originalVersion = Object.getOwnPropertyDescriptor(process, 'version');
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
     * Mock process platform
     * @param {string} platform - Platform name
     */
    mockPlatform(platform) {
        Object.defineProperty(process, 'platform', {
            value: platform,
            configurable: true
        });
    }

    /**
     * Mock process version
     * @param {string} version - Version string
     */
    mockVersion(version) {
        Object.defineProperty(process, 'version', {
            value: version,
            configurable: true
        });
    }

    /**
     * Restore original environment
     */
    restore() {
        process.env = { ...this.originalEnv };
        if (this.originalPlatform) {
            Object.defineProperty(process, 'platform', this.originalPlatform);
        }
        if (this.originalVersion) {
            Object.defineProperty(process, 'version', this.originalVersion);
        }
    }
}

// ============================================================================
// Assertion Helpers
// ============================================================================

class AssertionHelper {
    /**
     * Assert object matches shape
     * @param {Object} actual - Actual object
     * @param {Object} shape - Expected shape
     */
    static assertShape(actual, shape) {
        expect(actual).toMatchObject(shape);
        Object.keys(shape).forEach(key => {
            expect(actual).toHaveProperty(key);
        });
    }

    /**
     * Assert array contains items matching predicate
     * @param {Array} array - Array to check
     * @param {Function} predicate - Predicate function
     * @param {number} count - Expected count (optional)
     */
    static assertArrayContains(array, predicate, count = null) {
        const matches = array.filter(predicate);
        expect(matches.length).toBeGreaterThan(0);
        if (count !== null) {
            expect(matches.length).toBe(count);
        }
    }

    /**
     * Assert async function throws
     * @param {Function} asyncFn - Async function
     * @param {string|RegExp} error - Expected error
     */
    static async assertAsyncThrows(asyncFn, error) {
        await expect(asyncFn()).rejects.toThrow(error);
    }

    /**
     * Assert function is called with pattern
     * @param {jest.Mock} mockFn - Mock function
     * @param {Array} patterns - Argument patterns
     */
    static assertCalledWithPattern(mockFn, patterns) {
        expect(mockFn).toHaveBeenCalled();
        const calls = mockFn.mock.calls;
        const hasMatch = calls.some(callArgs =>
            patterns.every((pattern, index) => {
                if (pattern instanceof RegExp) {
                    return pattern.test(String(callArgs[index]));
                }
                return callArgs[index] === pattern;
            })
        );
        expect(hasMatch).toBe(true);
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
    MockManager,
    FileSystemTestHelper,
    AsyncTestHelper,
    ConsoleTestHelper,
    TestDataGenerator,
    EnvironmentTestHelper,
    AssertionHelper,

    // Factory functions
    createMockManager: () => new MockManager(),
    createFileSystemHelper: (basePath) => new FileSystemTestHelper(basePath),
    createConsoleHelper: () => new ConsoleTestHelper(),
    createEnvironmentHelper: () => new EnvironmentTestHelper(),

    // Commonly used patterns
    testPatterns: {
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        filePath: /^(\/|\\|[a-zA-Z]:\\)/,
        ip: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    }
};
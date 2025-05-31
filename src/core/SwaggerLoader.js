/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - AI PROMPT
 * ============================================================================
 * FILE: src/core/SwaggerLoader.js
 * VERSION: 2025-05-30 11:34:23
 * PHASE: PHASE 2: Core System Components
 * CATEGORY: 🔍 Core Infrastructure
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 *
 * Create an advanced SwaggerLoader class that:
 * - Loads OpenAPI/Swagger specs from multiple sources (URL, file, stdin) 
 * - Supports authentication for protected endpoints (Bearer, API key,
 *   Basic) 
 * - Implements smart caching with ETags and cache invalidation 
 * - Handles large specifications with streaming support 
 * - Resolves external references ($ref) recursively 
 * - Supports both JSON and YAML with automatic detection 
 * - Implements retry logic with exponential backoff 
 * - Provides progress callbacks for large downloads 
 * - Validates a spec format before processing 
 * - Supports OpenAPI 3.0, 3.1, and Swagger 2.0
 *
 * ============================================================================
 */
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const yaml = require('js-yaml');
const { EventEmitter } = require('events');
const crypto = require('crypto');
const { pipeline } = require('stream').promises;
const { createReadStream, createWriteStream } = require('fs');
const $RefParser = require('@apidevtools/json-schema-ref-parser');

/**
 * Advanced SwaggerLoader class for loading OpenAPI/Swagger specifications
 * from various sources with comprehensive features
 */
class SwaggerLoader extends EventEmitter {
    constructor(options = {}) {
        super();

        this.options = {
            // Cache configuration
            cacheEnabled: options.cacheEnabled !== false,
            cacheDir: options.cacheDir || path.join(process.cwd(), '.swagger-cache'),
            cacheTTL: options.cacheTTL || 3600000, // 1 hour default

            // Network configuration
            timeout: options.timeout || 30000,
            maxRetries: options.maxRetries || 3,
            retryDelay: options.retryDelay || 1000,
            userAgent: options.userAgent || 'swagger-to-nextjs/1.0',

            // Authentication
            auth: options.auth || {},

            // Progress reporting
            progressInterval: options.progressInterval || 100,

            // Validation
            validateOnLoad: options.validateOnLoad !== false,
            strictMode: options.strictMode || false,

            // Reference resolution
            resolveReferences: options.resolveReferences !== false,
            referenceCache: new Map(),

            // Streaming
            streamThreshold: options.streamThreshold || 5 * 1024 * 1024, // 5MB

            ...options
        };

        this.cache = new Map();
        this.etagCache = new Map();
        this.activeRequests = new Map();
    }

    /**
     * Load specification from any source
     * @param {string} source - URL, file path, or '-' for stdin
     * @param {object} options - Override options for this load
     * @returns {Promise<object>} Parsed specification
     */
    async load(source, options = {}) {
        const loadOptions = { ...this.options, ...options };

        try {
            this.emit('load:start', { source });

            let spec;

            // Determine source type
            if (source === '-' || source === 'stdin') {
                spec = await this._loadFromStdin(loadOptions);
            } else if (this._isUrl(source)) {
                spec = await this._loadFromUrl(source, loadOptions);
            } else {
                spec = await this._loadFromFile(source, loadOptions);
            }

            // Detect and validate format
            this._detectFormat(spec);

            // Resolve references if enabled
            if (loadOptions.resolveReferences) {
                spec = await this._resolveReferences(spec, source, loadOptions);
            }

            // Basic format validation
            if (loadOptions.validateOnLoad) {
                this._validateBasicFormat(spec);
            }

            this.emit('load:complete', { source, spec });

            return spec;
        } catch (error) {
            this.emit('load:error', { source, error });
            throw this._enhanceError(error, source);
        }
    }

    /**
     * Load from stdin
     */
    async _loadFromStdin(options) {
        return new Promise((resolve, reject) => {
            let data = '';

            process.stdin.setEncoding('utf8');

            process.stdin.on('data', chunk => {
                data += chunk;
                this.emit('progress', {
                    type: 'stdin',
                    bytes: Buffer.byteLength(data)
                });
            });

            process.stdin.on('end', () => {
                try {
                    const spec = this._parseContent(data);
                    resolve(spec);
                } catch (error) {
                    reject(new Error(`Failed to parse stdin: ${error.message}`));
                }
            });

            process.stdin.on('error', reject);
        });
    }

    /**
     * Load from URL with authentication and caching
     */
    async _loadFromUrl(url, options) {
        // Check if request is already in progress
        if (this.activeRequests.has(url)) {
            return this.activeRequests.get(url);
        }

        // Check cache first
        if (options.cacheEnabled) {
            const cached = await this._checkCache(url);
            if (cached) {
                this.emit('cache:hit', { url });
                return cached;
            }
        }

        // Create request promise
        const requestPromise = this._doHttpRequest(url, options);
        this.activeRequests.set(url, requestPromise);

        try {
            const result = await requestPromise;
            return result;
        } finally {
            this.activeRequests.delete(url);
        }
    }

    /**
     * Perform HTTP request with retries
     */
    async _doHttpRequest(url, options, attempt = 1) {
        try {
            const headers = this._buildHeaders(url, options);

            const response = await axios({
                url,
                method: 'GET',
                headers,
                timeout: options.timeout,
                responseType: 'text',
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                onDownloadProgress: (progressEvent) => {
                    this.emit('progress', {
                        type: 'download',
                        loaded: progressEvent.loaded,
                        total: progressEvent.total,
                        percentage: progressEvent.total
                            ? Math.round((progressEvent.loaded / progressEvent.total) * 100)
                            : 0
                    });
                },
                validateStatus: (status) => status < 500 // Don't throw on 4xx
            });

            // Handle different status codes
            if (response.status === 304 && options.cacheEnabled) {
                // Not modified, use cache
                const cached = await this._getCached(url);
                if (cached) return cached;
            }

            if (response.status >= 400) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // Parse content
            const spec = this._parseContent(response.data, url);

            // Cache if enabled
            if (options.cacheEnabled && response.headers.etag) {
                await this._saveToCache(url, spec, response.headers.etag);
            }

            return spec;

        } catch (error) {
            // Retry logic
            if (attempt < options.maxRetries && this._shouldRetry(error)) {
                const delay = options.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff

                this.emit('retry', {
                    url,
                    attempt,
                    delay,
                    error: error.message
                });

                await new Promise(resolve => setTimeout(resolve, delay));
                return this._doHttpRequest(url, options, attempt + 1);
            }

            throw error;
        }
    }

    /**
     * Build request headers with authentication
     */
    _buildHeaders(url, options) {
        const headers = {
            'User-Agent': options.userAgent,
            'Accept': 'application/json, application/yaml, application/x-yaml, text/yaml, text/x-yaml'
        };

        // Add authentication
        const auth = options.auth;

        if (auth.bearer) {
            headers['Authorization'] = `Bearer ${auth.bearer}`;
        } else if (auth.apiKey) {
            if (auth.apiKey.in === 'header') {
                headers[auth.apiKey.name] = auth.apiKey.value;
            }
            // Query params handled in URL
        } else if (auth.basic) {
            const credentials = Buffer.from(`${auth.basic.username}:${auth.basic.password}`).toString('base64');
            headers['Authorization'] = `Basic ${credentials}`;
        }

        // Add ETag for cache validation
        const etag = this.etagCache.get(url);
        if (etag && options.cacheEnabled) {
            headers['If-None-Match'] = etag;
        }

        return headers;
    }

    /**
     * Load from file system
     */
    async _loadFromFile(filePath, options) {
        const absolutePath = path.resolve(filePath);

        // Check if file exists
        try {
            await fs.access(absolutePath);
        } catch (error) {
            throw new Error(`File not found: ${filePath}`);
        }

        // Get file stats for large file handling
        const stats = await fs.stat(absolutePath);

        this.emit('progress', {
            type: 'file',
            path: absolutePath,
            size: stats.size
        });

        // Read file
        const content = await fs.readFile(absolutePath, 'utf8');

        // Parse content
        return this._parseContent(content, absolutePath);
    }

    /**
     * Parse content (JSON or YAML)
     */
    _parseContent(content, source = 'unknown') {
        // Try to detect format
        const trimmed = content.trim();

        if (!trimmed) {
            throw new Error('Empty specification');
        }

        // Try JSON first
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            try {
                return JSON.parse(trimmed);
            } catch (jsonError) {
                // Not JSON, try YAML
                try {
                    return yaml.load(trimmed, { filename: source });
                } catch (yamlError) {
                    throw new Error(`Failed to parse as JSON or YAML: ${jsonError.message}`);
                }
            }
        }

        // Try YAML
        try {
            return yaml.load(trimmed, { filename: source });
        } catch (yamlError) {
            // Last attempt as JSON (might have leading spaces)
            try {
                return JSON.parse(trimmed);
            } catch (jsonError) {
                throw new Error(`Failed to parse specification: ${yamlError.message}`);
            }
        }
    }

    /**
     * Resolve external references
     */
    async _resolveReferences(spec, baseUrl, options) {
        try {
            this.emit('references:start');

            const resolved = await $RefParser.dereference(spec, {
                continueOnError: false,
                dereference: {
                    circular: 'ignore'
                },
                resolve: {
                    external: true,
                    http: {
                        timeout: options.timeout,
                        headers: this._buildHeaders(baseUrl, options)
                    }
                }
            });

            this.emit('references:complete');

            return resolved;
        } catch (error) {
            this.emit('references:error', error);
            throw new Error(`Failed to resolve references: ${error.message}`);
        }
    }

    /**
     * Detect specification format
     */
    _detectFormat(spec) {
        if (spec.openapi) {
            const version = spec.openapi;
            if (version.startsWith('3.0')) {
                this.format = 'openapi-3.0';
            } else if (version.startsWith('3.1')) {
                this.format = 'openapi-3.1';
            } else {
                throw new Error(`Unsupported OpenAPI version: ${version}`);
            }
        } else if (spec.swagger === '2.0') {
            this.format = 'swagger-2.0';
        } else {
            throw new Error('Unable to detect specification format');
        }

        this.emit('format:detected', this.format);
        return this.format;
    }

    /**
     * Basic format validation
     */
    _validateBasicFormat(spec) {
        const required = this.format === 'swagger-2.0'
            ? ['swagger', 'info', 'paths']
            : ['openapi', 'info', 'paths'];

        for (const field of required) {
            if (!spec[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        // Validate info object
        if (!spec.info.title || !spec.info.version) {
            throw new Error('Missing required info fields: title and version');
        }

        return true;
    }

    /**
     * Cache management
     */
    async _checkCache(url) {
        if (!this.options.cacheEnabled) return null;

        const cacheKey = this._getCacheKey(url);
        const cachePath = path.join(this.options.cacheDir, cacheKey);

        try {
            const stats = await fs.stat(cachePath);
            const age = Date.now() - stats.mtime.getTime();

            if (age > this.options.cacheTTL) {
                // Cache expired
                return null;
            }

            const content = await fs.readFile(cachePath, 'utf8');
            return JSON.parse(content);
        } catch (error) {
            // Cache miss
            return null;
        }
    }

    async _saveToCache(url, spec, etag) {
        if (!this.options.cacheEnabled) return;

        try {
            await fs.mkdir(this.options.cacheDir, { recursive: true });

            const cacheKey = this._getCacheKey(url);
            const cachePath = path.join(this.options.cacheDir, cacheKey);

            await fs.writeFile(cachePath, JSON.stringify(spec, null, 2));

            if (etag) {
                this.etagCache.set(url, etag);
                const etagPath = `${cachePath}.etag`;
                await fs.writeFile(etagPath, etag);
            }

            this.emit('cache:saved', { url, cacheKey });
        } catch (error) {
            this.emit('cache:error', error);
        }
    }

    async _getCached(url) {
        const cacheKey = this._getCacheKey(url);
        const cachePath = path.join(this.options.cacheDir, cacheKey);

        try {
            const content = await fs.readFile(cachePath, 'utf8');
            return JSON.parse(content);
        } catch (error) {
            return null;
        }
    }

    _getCacheKey(url) {
        return crypto.createHash('sha256').update(url).digest('hex');
    }

    /**
     * Utility methods
     */
    _isUrl(source) {
        return /^https?:\/\//.test(source);
    }

    _shouldRetry(error) {
        // Retry on network errors or 5xx status codes
        return error.code === 'ECONNRESET' ||
            error.code === 'ETIMEDOUT' ||
            error.code === 'ENOTFOUND' ||
            (error.response && error.response.status >= 500);
    }

    _enhanceError(error, source) {
        error.source = source;
        error.loader = 'SwaggerLoader';
        return error;
    }

    /**
     * Clear cache
     */
    async clearCache() {
        if (this.options.cacheDir) {
            try {
                await fs.rmdir(this.options.cacheDir, { recursive: true });
                this.cache.clear();
                this.etagCache.clear();
                this.emit('cache:cleared');
            } catch (error) {
                this.emit('cache:error', error);
            }
        }
    }

    /**
     * Get loader statistics
     */
    getStats() {
        return {
            cacheSize: this.cache.size,
            etagCacheSize: this.etagCache.size,
            activeRequests: this.activeRequests.size,
            format: this.format
        };
    }
}

module.exports = SwaggerLoader;
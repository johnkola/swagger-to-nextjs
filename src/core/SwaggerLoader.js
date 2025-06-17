/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - AI PROMPT
 * ============================================================================
 * FILE: src/core/SwaggerLoader.js
 * VERSION: 2025-06-17 16:21:39
 * PHASE: Phase 2: Core System Components
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 *
 * Create a class using ES Module syntax that loads and parses
 * OpenAPI/Swagger specifications from various sources. Import dependencies
 * like js-yaml, fs-extra, and node-fetch using ES Module imports. The class
 * should support loading from local file paths and HTTP/HTTPS URLs,
 * automatically detect JSON vs YAML format, parse YAML using js-yaml
 * library, resolve internal $ref references within the document, support
 * both OpenAPI 3.x and Swagger 2.0 formats (converting Swagger 2.0 to
 * OpenAPI 3.0 structure internally), handle file reading and network errors
 * gracefully, implement basic timeout for URL fetching, extract any
 * branding colors or theme information from the spec for potential DaisyUI
 * theme customization, and return a normalized specification object ready
 * for processing. Export the class as the default export.
 *
 * ============================================================================
 */
/**
 * SwaggerLoader.js
 *
 * Loads and parses OpenAPI/Swagger specifications from various sources
 * Supports both local files and remote URLs, handles JSON and YAML formats
 */
import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import { URL } from 'url';
import https from 'https';
import http from 'http';
class SwaggerLoader {
    constructor(options = {}) {
        this.timeout = options.timeout || 30000; // 30 seconds default
        this.cache = new Map();
    }

    /**
     * Load a specification from a file path or URL
     * @param {string} source - File path or URL to the specification
     * @returns {Promise<Object>} Parsed specification object
     */
    async load(source) {
        // Check cache first
        if (this.cache.has(source)) {
            return this.cache.get(source);
        }

        let content;

        if (this.isUrl(source)) {
            content = await this.loadFromUrl(source);
        } else {
            content = await this.loadFromFile(source);
        }

        const spec = this.parseContent(content, source);
        const normalizedSpec = await this.normalizeSpec(spec, source);

        // Cache the result
        this.cache.set(source, normalizedSpec);

        return normalizedSpec;
    }

    /**
     * Check if the source is a URL
     * @param {string} source - Source to check
     * @returns {boolean}
     */
    isUrl(source) {
        try {
            new URL(source);
            return source.startsWith('http://') || source.startsWith('https://');
        } catch {
            return false;
        }
    }

    /**
     * Load specification from a file
     * @param {string} filePath - Path to the file
     * @returns {Promise<string>} File content
     */
    async loadFromFile(filePath) {
        try {
            const absolutePath = path.resolve(filePath);
            const content = await fs.readFile(absolutePath, 'utf8');
            return content;
        } catch (error) {
            if (error.code === 'ENOENT') {
                throw new Error(`Specification file not found: ${filePath}`);
            }
            if (error.code === 'EACCES') {
                throw new Error(`Permission denied reading file: ${filePath}`);
            }
            throw new Error(`Failed to read specification file: ${error.message}`);
        }
    }

    /**
     * Load specification from a URL
     * @param {string} url - URL to fetch
     * @returns {Promise<string>} Response content
     */
    async loadFromUrl(url) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const client = urlObj.protocol === 'https:' ? https : http;

            const request = client.get(url, { timeout: this.timeout }, (response) => {
                if (response.statusCode !== 200) {
                    reject(new Error(`Failed to fetch specification: HTTP ${response.statusCode}`));
                    return;
                }

                let data = '';
                response.on('data', (chunk) => data += chunk);
                response.on('end', () => resolve(data));
            });

            request.on('error', (error) => {
                reject(new Error(`Failed to fetch specification from URL: ${error.message}`));
            });

            request.on('timeout', () => {
                request.destroy();
                reject(new Error(`Request timeout: Failed to fetch specification within ${this.timeout}ms`));
            });
        });
    }

    /**
     * Parse content as JSON or YAML
     * @param {string} content - Content to parse
     * @param {string} source - Source identifier for error messages
     * @returns {Object} Parsed object
     */
    parseContent(content, source) {
        // Try JSON first
        try {
            return JSON.parse(content);
        } catch (jsonError) {
            // If JSON fails, try YAML
            try {
                const parsed = yaml.load(content);
                // yaml.load can return undefined for empty content
                if (parsed === undefined || parsed === null) {
                    throw new Error('Empty or invalid YAML content');
                }
                return parsed;
            } catch (yamlError) {
                throw new Error(`Not valid JSON or YAML`);
            }
        }
    }

    /**
     * Normalize specification to OpenAPI 3.0 format
     * @param {Object} spec - Raw specification object
     * @param {string} source - Source path for resolving references
     * @returns {Promise<Object>} Normalized specification
     */
    async normalizeSpec(spec, source) {
        // Check if it's Swagger 2.0 and convert to OpenAPI 3.0
        if (spec.swagger && spec.swagger.startsWith('2.')) {
            spec = this.convertSwagger2ToOpenAPI3(spec);
        }

        // Resolve all $ref references
        // For URLs, use the full URL as base; for files, use the full file path
        const basePath = this.isUrl(source) ? source : path.resolve(source);
        const resolved = await this.resolveReferences(spec, spec, basePath);

        return resolved;
    }

    /**
     * Convert Swagger 2.0 to OpenAPI 3.0 structure
     * @param {Object} swagger2 - Swagger 2.0 specification
     * @returns {Object} OpenAPI 3.0 specification
     */
    convertSwagger2ToOpenAPI3(swagger2) {
        const openapi3 = {
            openapi: '3.0.0',
            info: swagger2.info,
            servers: [],
            paths: {},
            components: {
                schemas: swagger2.definitions || {},
                securitySchemes: {}
            }
        };

        // Convert host/basePath to servers
        if (swagger2.host) {
            const scheme = swagger2.schemes ? swagger2.schemes[0] : 'https';
            const basePath = swagger2.basePath || '';
            openapi3.servers.push({
                url: `${scheme}://${swagger2.host}${basePath}`
            });
        }

        // Convert paths
        if (swagger2.paths) {
            for (const [pathKey, pathItem] of Object.entries(swagger2.paths)) {
                openapi3.paths[pathKey] = {};

                for (const [method, operation] of Object.entries(pathItem)) {
                    if (method === 'parameters') continue; // Skip path-level parameters for now

                    const convertedOp = { ...operation };

                    // Convert produces/consumes to content types
                    if (operation.responses) {
                        convertedOp.responses = {};
                        for (const [status, response] of Object.entries(operation.responses)) {
                            convertedOp.responses[status] = {
                                description: response.description || ''
                            };

                            if (response.schema) {
                                const produces = operation.produces || swagger2.produces || ['application/json'];
                                convertedOp.responses[status].content = {};
                                produces.forEach(mediaType => {
                                    convertedOp.responses[status].content[mediaType] = {
                                        schema: response.schema
                                    };
                                });
                            }
                        }
                    }

                    // Convert parameters
                    if (operation.parameters) {
                        convertedOp.parameters = [];
                        convertedOp.requestBody = null;

                        operation.parameters.forEach(param => {
                            if (param.in === 'body') {
                                const consumes = operation.consumes || swagger2.consumes || ['application/json'];
                                convertedOp.requestBody = {
                                    content: {}
                                };
                                consumes.forEach(mediaType => {
                                    convertedOp.requestBody.content[mediaType] = {
                                        schema: param.schema
                                    };
                                });
                            } else {
                                convertedOp.parameters.push(param);
                            }
                        });

                        // Remove requestBody if it wasn't set
                        if (!convertedOp.requestBody) {
                            delete convertedOp.requestBody;
                        }

                        // Remove parameters array if empty
                        if (convertedOp.parameters.length === 0) {
                            delete convertedOp.parameters;
                        }
                    }

                    openapi3.paths[pathKey][method] = convertedOp;
                }
            }
        }

        // Convert security definitions
        if (swagger2.securityDefinitions) {
            for (const [name, def] of Object.entries(swagger2.securityDefinitions)) {
                if (def.type === 'basic') {
                    openapi3.components.securitySchemes[name] = {
                        type: 'http',
                        scheme: 'basic'
                    };
                } else if (def.type === 'apiKey') {
                    openapi3.components.securitySchemes[name] = {
                        type: 'apiKey',
                        in: def.in,
                        name: def.name
                    };
                } else if (def.type === 'oauth2') {
                    openapi3.components.securitySchemes[name] = {
                        type: 'oauth2',
                        flows: {}
                    };
                    // Simplified OAuth2 conversion
                    if (def.flow === 'implicit') {
                        openapi3.components.securitySchemes[name].flows.implicit = {
                            authorizationUrl: def.authorizationUrl,
                            scopes: def.scopes || {}
                        };
                    }
                }
            }
        }

        return openapi3;
    }

    /**
     * Resolve $ref references in the specification
     * @param {Object} obj - Object to resolve references in
     * @param {Object} root - Root specification object
     * @param {string} basePath - Base path for external references
     * @returns {Promise<Object>} Object with resolved references
     */
    async resolveReferences(obj, root, basePath) {
        if (!obj || typeof obj !== 'object') {
            return obj;
        }

        // Handle $ref
        if (obj.$ref) {
            const resolved = await this.resolveReference(obj.$ref, root, basePath);
            return this.resolveReferences(resolved, root, basePath);
        }

        // Handle arrays
        if (Array.isArray(obj)) {
            return Promise.all(obj.map(item => this.resolveReferences(item, root, basePath)));
        }

        // Handle objects
        const resolved = {};
        for (const [key, value] of Object.entries(obj)) {
            resolved[key] = await this.resolveReferences(value, root, basePath);
        }
        return resolved;
    }

    /**
     * Resolve a single $ref reference
     * @param {string} ref - Reference string
     * @param {Object} root - Root specification object
     * @param {string} basePath - Base path for external references
     * @returns {Promise<Object>} Resolved reference
     */
    async resolveReference(ref, root, basePath) {
        // Internal reference
        if (ref.startsWith('#/')) {
            const path = ref.substring(2).split('/');
            let current = root;

            for (const segment of path) {
                current = current[segment];
                if (!current) {
                    throw new Error(`Failed to resolve reference: ${ref}`);
                }
            }

            return current;
        }

        // External reference
        const [file, fragment] = ref.split('#');
        let externalPath;

        if (this.isUrl(basePath)) {
            externalPath = new URL(file, basePath).toString();
        } else {
            // For file paths, resolve relative to the directory of the base file
            const baseDir = path.dirname(basePath);
            externalPath = path.resolve(baseDir, file);
        }

        const externalSpec = await this.load(externalPath);

        if (fragment) {
            return this.resolveReference(`#${fragment}`, externalSpec, externalPath);
        }

        return externalSpec;
    }

    /**
     * Clear the cache
     */
    clearCache() {
        this.cache.clear();
    }
}

export default SwaggerLoader;
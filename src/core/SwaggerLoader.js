/**
 * ===AI PROMPT ==============================================================
 * FILE: src/core/SwaggerLoader.js
 * VERSION: 2025-05-25 13:22:11
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 * Create a SwaggerLoader class that can load OpenAPI/Swagger specifications
 * from URLs or local files. Support JSON and YAML formats with proper
 * validation and error handling.
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
 * FILE: src/core/SwaggerLoader.js
 *
 * AI PROMPT FOR CODE REVIEW/ENHANCEMENT:
 * =====================================
 *
 * You are reviewing a Swagger/OpenAPI specification loader that handles multiple input sources.
 * This component is responsible for fetching, parsing, and preprocessing OpenAPI documents
 * from various sources including local files, remote URLs, and configuration files.
 *
 * RESPONSIBILITIES:
 * - Load OpenAPI specs from files, URLs, or config references
 * - Auto-detect and parse JSON/YAML formats
 * - Handle HTTP redirects and network timeouts
 * - Process OpenAPI generator config files
 * - Provide detailed error messages for loading failures
 * - Support various OpenAPI/Swagger versions
 *
 * TECHNICAL FEATURES:
 * - Robust HTTP client with redirect support and timeouts
 * - Format auto-detection (JSON vs YAML)
 * - Config file processing for generator integration
 * - Comprehensive error handling with context
 * - Memory-efficient streaming for large specifications
 *
 * REVIEW FOCUS:
 * - Network error handling and retry logic
 * - Memory usage for large OpenAPI documents
 * - Security considerations for URL fetching
 * - Parser robustness for malformed documents
 * - Performance optimization opportunities
 */

const fs = require('fs');
const yaml = require('js-yaml');
const https = require('https');
const http = require('http');
const {URL} = require('url');

class SwaggerLoader {
    constructor(source) {
        this.source = source;
        this.isUrl = this.isValidUrl(source);
        this.isConfig = this.isConfigFile(source);
    }

    /**
     * Main loading method - determines source type and loads appropriately
     */
    async load() {
        try {
            let content;
            let actualSource = this.source;

            // If it's a config file, extract the input spec
            if (this.isConfig) {
                const config = this.readOpenAPIConfig(this.source);
                actualSource = config.inputSpec;
                console.log(`📋 Using input spec from config: ${actualSource}`);
            }

            // Load content based on source type
            if (this.isValidUrl(actualSource)) {
                content = await this.fetchFromUrl(actualSource);
                console.log('✅ Swagger spec fetched from URL successfully');
            } else {
                content = this.readFromFile(actualSource);
                console.log('✅ Swagger file loaded successfully');
            }

            // Parse and return the document
            const parsed = this.parseContent(content);
            console.log('✅ Swagger document parsed successfully');

            return parsed;

        } catch (error) {
            throw new Error(`Failed to load Swagger specification: ${error.message}`);
        }
    }

    /**
     * Check if input is a valid URL
     */
    isValidUrl(string) {
        try {
            new URL(string);
            return string.startsWith('http://') || string.startsWith('https://');
        } catch (_) {
            return false;
        }
    }

    /**
     * Check if input is an OpenAPI config file
     */
    isConfigFile(source) {
        return source.endsWith('.yaml') || source.endsWith('.yml');
    }

    /**
     * Read and parse OpenAPI generator config file
     */
    readOpenAPIConfig(configPath) {
        try {
            if (!fs.existsSync(configPath)) {
                throw new Error(`OpenAPI config file not found: ${configPath}`);
            }

            const configContent = fs.readFileSync(configPath, 'utf8');
            const config = yaml.load(configContent);

            if (!config.inputSpec) {
                throw new Error('inputSpec not found in OpenAPI config file');
            }

            console.log(`📋 Found OpenAPI config: ${configPath}`);
            console.log(`📋 Input spec: ${config.inputSpec}`);
            console.log(`📋 Output dir: ${config.outputDir || 'Not specified'}`);

            return {
                inputSpec: config.inputSpec,
                outputDir: config.outputDir || './src/lib/api-client',
                generatorName: config.generatorName || 'typescript-axios',
                ...config
            };
        } catch (error) {
            throw new Error(`Failed to read OpenAPI config: ${error.message}`);
        }
    }

    /**
     * Fetch content from URL with robust error handling
     */
    async fetchFromUrl(url) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const client = urlObj.protocol === 'https:' ? https : http;

            console.log(`🌐 Fetching Swagger spec from: ${url}`);

            const request = client.get(url, {
                headers: {
                    'User-Agent': 'Swagger-NextJS-Generator/1.0',
                    'Accept': 'application/json, application/yaml, text/yaml, text/plain'
                }
            }, (response) => {
                let data = '';

                // Handle redirects
                if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                    console.log(`🔄 Redirecting to: ${response.headers.location}`);
                    this.fetchFromUrl(response.headers.location).then(resolve).catch(reject);
                    return;
                }

                if (response.statusCode !== 200) {
                    reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
                    return;
                }

                response.on('data', (chunk) => {
                    data += chunk;
                });

                response.on('end', () => {
                    if (!data.trim()) {
                        reject(new Error('Empty response received'));
                        return;
                    }
                    resolve(data);
                });
            });

            request.on('error', (error) => {
                reject(new Error(`Network error: ${error.message}`));
            });

            // Set timeout
            request.setTimeout(15000, () => {
                request.destroy();
                reject(new Error('Request timeout - server took too long to respond'));
            });
        });
    }

    /**
     * Read content from local file
     */
    readFromFile(filePath) {
        try {
            if (!fs.existsSync(filePath)) {
                throw new Error(`File not found: ${filePath}`);
            }

            return fs.readFileSync(filePath, 'utf8');
        } catch (error) {
            throw new Error(`Failed to read file: ${error.message}`);
        }
    }

    /**
     * Parse content with auto-format detection
     */
    parseContent(content) {
        // Try to parse as JSON first
        try {
            const parsed = JSON.parse(content);
            console.log('📄 Detected format: JSON');
            return parsed;
        } catch (jsonError) {
            // If JSON parsing fails, try YAML
            try {
                const parsed = yaml.load(content);
                console.log('📄 Detected format: YAML');
                return parsed;
            } catch (yamlError) {
                throw new Error(
                    `Unable to parse content as JSON or YAML.\n` +
                    `JSON Error: ${jsonError.message}\n` +
                    `YAML Error: ${yamlError.message}`
                );
            }
        }
    }
}

module.exports = SwaggerLoader;
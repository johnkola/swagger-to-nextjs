/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - AI PROMPT
 * ============================================================================
 * FILE: src/errors/NetworkError.js
 * VERSION: 2025-05-28 15:14:56
 * PHASE: PHASE 2: Core System Components
 * CATEGORY: 🚨 Error Handling System
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 *
 * Create a robust NetworkError class that:
 * - Handles various network failure scenarios
 * - Captures HTTP status codes and headers
 * - Implements retry recommendations
 * - Provides timeout context
 * - Includes proxy configuration hints
 * - Handles DNS resolution failures
 * - Provides offline mode suggestions
 * - Captures request/response details
 * - Implements circuit breaker patterns
 * - Provides network diagnostics
 *
 * ============================================================================
 */

const GeneratorError = require('./GeneratorError');
const dns = require('dns').promises;
const url = require('url');

/**
 * NetworkError - Comprehensive network error handling
 */
class NetworkError extends GeneratorError {
    constructor(message, details = {}) {
        const code = details.code || NetworkError._inferErrorCode(details);

        super(message, code, {
            category: 'network',
            recoverable: NetworkError._isRetryable(details),
            ...details
        });

        // Network-specific properties
        this.url = details.url || null;
        this.method = details.method || 'GET';
        this.statusCode = details.statusCode || null;
        this.statusText = details.statusText || null;
        this.headers = details.headers || {};
        this.responseHeaders = details.responseHeaders || {};
        this.timeout = details.timeout || null;
        this.duration = details.duration || null;

        // Request/Response details
        this.request = {
            url: this.url,
            method: this.method,
            headers: this.headers,
            body: details.requestBody,
            timeout: this.timeout
        };

        this.response = details.response ? {
            statusCode: details.response.status || details.statusCode,
            statusText: details.response.statusText || details.statusText,
            headers: details.response.headers || this.responseHeaders,
            body: details.response.body,
            size: details.response.size
        } : null;

        // Network analysis
        this.networkInfo = this._analyzeNetworkIssue();

        // Retry configuration
        this.retryConfig = this._generateRetryConfig();

        // Circuit breaker state
        this.circuitBreaker = {
            state: details.circuitState || 'closed',
            failures: details.failures || 1,
            lastFailure: new Date(),
            nextRetry: this._calculateNextRetry()
        };

        // Proxy configuration
        this.proxyInfo = this._detectProxyConfiguration();

        // DNS information
        this.dnsInfo = null;

        // Offline mode suggestions
        this.offlineStrategies = this._generateOfflineStrategies();

        // Network diagnostics
        this.diagnostics = this._generateDiagnostics();
    }

    /**
     * Infer error code from details
     */
    static _inferErrorCode(details) {
        if (details.code) return details.code;

        const statusCode = details.statusCode;
        if (statusCode) {
            if (statusCode >= 500) return 'SERVER_ERROR';
            if (statusCode === 404) return 'NOT_FOUND';
            if (statusCode === 403) return 'FORBIDDEN';
            if (statusCode === 401) return 'UNAUTHORIZED';
            if (statusCode === 429) return 'RATE_LIMITED';
            if (statusCode === 408) return 'REQUEST_TIMEOUT';
            if (statusCode >= 400) return 'CLIENT_ERROR';
        }

        if (details.errno) {
            const errnoMap = {
                'ECONNREFUSED': 'CONNECTION_REFUSED',
                'ECONNRESET': 'CONNECTION_RESET',
                'ETIMEDOUT': 'TIMEOUT',
                'ENOTFOUND': 'DNS_LOOKUP_FAILED',
                'ENETUNREACH': 'NETWORK_UNREACHABLE',
                'EHOSTUNREACH': 'HOST_UNREACHABLE',
                'ECONNABORTED': 'CONNECTION_ABORTED',
                'EPIPE': 'BROKEN_PIPE'
            };
            return errnoMap[details.errno] || 'NETWORK_ERROR';
        }

        return 'NETWORK_ERROR';
    }

    /**
     * Check if error is retryable
     */
    static _isRetryable(details) {
        const statusCode = details.statusCode;

        // Retryable HTTP status codes
        if (statusCode) {
            const retryableCodes = [408, 429, 500, 502, 503, 504];
            if (retryableCodes.includes(statusCode)) return true;

            // Don't retry client errors (except specific ones)
            if (statusCode >= 400 && statusCode < 500) return false;
        }

        // Retryable network errors
        const retryableErrors = [
            'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT',
            'ENETUNREACH', 'EHOSTUNREACH', 'EPIPE'
        ];

        return retryableErrors.includes(details.errno);
    }

    /**
     * Analyze network issue
     */
    _analyzeNetworkIssue() {
        const analysis = {
            isTimeout: false,
            isDNS: false,
            isConnection: false,
            isServerError: false,
            isRateLimit: false,
            isAuth: false
        };

        // Check for timeout
        if (this.code === 'TIMEOUT' || this.code === 'REQUEST_TIMEOUT') {
            analysis.isTimeout = true;
        }

        // Check for DNS issues
        if (this.code === 'DNS_LOOKUP_FAILED' || this.errno === 'ENOTFOUND') {
            analysis.isDNS = true;
        }

        // Check for connection issues
        const connectionErrors = ['CONNECTION_REFUSED', 'CONNECTION_RESET', 'NETWORK_UNREACHABLE'];
        if (connectionErrors.includes(this.code)) {
            analysis.isConnection = true;
        }

        // Check for server errors
        if (this.statusCode >= 500) {
            analysis.isServerError = true;
        }

        // Check for rate limiting
        if (this.statusCode === 429 || this.code === 'RATE_LIMITED') {
            analysis.isRateLimit = true;
        }

        // Check for auth issues
        if (this.statusCode === 401 || this.statusCode === 403) {
            analysis.isAuth = true;
        }

        return analysis;
    }

    /**
     * Generate retry configuration
     */
    _generateRetryConfig() {
        const config = {
            shouldRetry: this.recoverable,
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 30000,
            factor: 2,
            jitter: true
        };

        // Adjust based on error type
        if (this.networkInfo.isRateLimit) {
            // Check for Retry-After header
            const retryAfter = this.responseHeaders['retry-after'];
            if (retryAfter) {
                config.initialDelay = this._parseRetryAfter(retryAfter);
            } else {
                config.initialDelay = 60000; // 1 minute default for rate limits
            }
            config.maxRetries = 5;
        } else if (this.networkInfo.isTimeout) {
            config.maxRetries = 2;
            config.baseDelay = 2000;
        } else if (this.networkInfo.isServerError) {
            config.maxRetries = 3;
            config.baseDelay = 5000;
        }

        return config;
    }

    /**
     * Parse Retry-After header
     */
    _parseRetryAfter(retryAfter) {
        // Check if it's a number (delay in seconds)
        const seconds = parseInt(retryAfter);
        if (!isNaN(seconds)) {
            return seconds * 1000;
        }

        // Check if it's a date
        const retryDate = new Date(retryAfter);
        if (!isNaN(retryDate.getTime())) {
            return Math.max(0, retryDate.getTime() - Date.now());
        }

        return 60000; // Default to 1 minute
    }

    /**
     * Calculate next retry time
     */
    _calculateNextRetry() {
        if (!this.retryConfig.shouldRetry) return null;

        const { baseDelay, factor, jitter, maxDelay } = this.retryConfig;
        const attempt = this.circuitBreaker.failures;

        let delay = Math.min(baseDelay * Math.pow(factor, attempt - 1), maxDelay);

        if (jitter) {
            delay = delay * (0.5 + Math.random() * 0.5);
        }

        return new Date(Date.now() + delay);
    }

    /**
     * Detect proxy configuration
     */
    _detectProxyConfiguration() {
        const proxyInfo = {
            httpProxy: process.env.HTTP_PROXY || process.env.http_proxy,
            httpsProxy: process.env.HTTPS_PROXY || process.env.https_proxy,
            noProxy: process.env.NO_PROXY || process.env.no_proxy,
            detected: false
        };

        if (proxyInfo.httpProxy || proxyInfo.httpsProxy) {
            proxyInfo.detected = true;

            // Parse proxy URL
            if (proxyInfo.httpsProxy) {
                try {
                    const parsed = new URL(proxyInfo.httpsProxy);
                    proxyInfo.host = parsed.hostname;
                    proxyInfo.port = parsed.port;
                    proxyInfo.auth = parsed.username ? {
                        username: parsed.username,
                        password: parsed.password
                    } : null;
                } catch (e) {
                    // Invalid proxy URL
                }
            }
        }

        return proxyInfo;
    }

    /**
     * Generate offline strategies
     */
    _generateOfflineStrategies() {
        const strategies = [];

        strategies.push({
            name: 'cache',
            description: 'Use cached OpenAPI specification',
            implementation: [
                'Check for cached spec in ~/.swagger-to-nextjs/cache',
                'Validate cache timestamp',
                'Use cached version with warning'
            ]
        });

        strategies.push({
            name: 'local',
            description: 'Use local file instead of URL',
            implementation: [
                'Download the OpenAPI spec manually',
                'Save to local file system',
                'Point generator to local file path'
            ]
        });

        strategies.push({
            name: 'fallback',
            description: 'Use fallback/bundled specification',
            implementation: [
                'Check for bundled specs in project',
                'Use versioned fallback spec',
                'Generate with limited features'
            ]
        });

        return strategies;
    }

    /**
     * Generate network diagnostics
     */
    _generateDiagnostics() {
        const diagnostics = [];

        // DNS diagnostics
        if (this.networkInfo.isDNS) {
            diagnostics.push({
                test: 'DNS Resolution',
                command: process.platform === 'win32'
                    ? `nslookup ${this._getHostname()}`
                    : `dig ${this._getHostname()}`,
                description: 'Test DNS resolution for the host'
            });

            diagnostics.push({
                test: 'Alternative DNS',
                suggestion: 'Try using Google DNS (8.8.8.8) or Cloudflare DNS (1.1.1.1)',
                commands: [
                    'Change DNS settings in network configuration',
                    'Flush DNS cache: ' + (process.platform === 'win32' ? 'ipconfig /flushdns' : 'sudo dscacheutil -flushcache')
                ]
            });
        }

        // Connection diagnostics
        if (this.networkInfo.isConnection) {
            diagnostics.push({
                test: 'Ping Test',
                command: `ping ${this._getHostname()}`,
                description: 'Test basic connectivity to host'
            });

            diagnostics.push({
                test: 'Port Test',
                command: process.platform === 'win32'
                    ? `telnet ${this._getHostname()} ${this._getPort()}`
                    : `nc -zv ${this._getHostname()} ${this._getPort()}`,
                description: 'Test if port is accessible'
            });

            diagnostics.push({
                test: 'Traceroute',
                command: process.platform === 'win32'
                    ? `tracert ${this._getHostname()}`
                    : `traceroute ${this._getHostname()}`,
                description: 'Trace network path to host'
            });
        }

        // Proxy diagnostics
        if (this.proxyInfo.detected) {
            diagnostics.push({
                test: 'Proxy Connection',
                command: `curl -x ${this.proxyInfo.httpsProxy} ${this.url}`,
                description: 'Test connection through proxy'
            });

            diagnostics.push({
                test: 'Bypass Proxy',
                suggestion: 'Try bypassing proxy for this host',
                command: `export NO_PROXY="${this._getHostname()}"`
            });
        }

        // Firewall diagnostics
        diagnostics.push({
            test: 'Firewall Check',
            suggestion: 'Check if firewall is blocking the connection',
            commands: [
                process.platform === 'win32'
                    ? 'netsh advfirewall show allprofiles'
                    : 'sudo iptables -L',
                'Temporarily disable firewall to test'
            ]
        });

        return diagnostics;
    }

    /**
     * Get hostname from URL
     */
    _getHostname() {
        if (!this.url) return 'unknown';
        try {
            const parsed = new URL(this.url);
            return parsed.hostname;
        } catch {
            return 'unknown';
        }
    }

    /**
     * Get port from URL
     */
    _getPort() {
        if (!this.url) return 80;
        try {
            const parsed = new URL(this.url);
            return parsed.port || (parsed.protocol === 'https:' ? 443 : 80);
        } catch {
            return 80;
        }
    }

    /**
     * Perform DNS lookup
     */
    async performDNSLookup() {
        const hostname = this._getHostname();
        if (hostname === 'unknown') return null;

        try {
            const addresses = await dns.resolve4(hostname);
            const ipv6 = await dns.resolve6(hostname).catch(() => []);

            this.dnsInfo = {
                hostname,
                ipv4: addresses,
                ipv6,
                resolved: true
            };

            return this.dnsInfo;
        } catch (error) {
            this.dnsInfo = {
                hostname,
                error: error.message,
                resolved: false
            };
            return this.dnsInfo;
        }
    }

    /**
     * Get retry delay
     */
    getRetryDelay(attempt = 1) {
        const { baseDelay, factor, maxDelay, jitter } = this.retryConfig;

        let delay = Math.min(baseDelay * Math.pow(factor, attempt - 1), maxDelay);

        if (jitter) {
            delay = delay * (0.5 + Math.random() * 0.5);
        }

        return Math.round(delay);
    }

    /**
     * Check if should retry
     */
    shouldRetry(attempt = 1) {
        return this.retryConfig.shouldRetry && attempt <= this.retryConfig.maxRetries;
    }

    /**
     * Override CLI serialization
     */
    _serializeCLI() {
        const parts = [];

        // Error header
        parts.push(`❌ Network Error: ${this.message}`);

        if (this.url) {
            parts.push(`   URL: ${this.url}`);
        }

        if (this.statusCode) {
            parts.push(`   Status: ${this.statusCode} ${this.statusText || ''}`);
        }

        if (this.duration) {
            parts.push(`   Duration: ${this.duration}ms`);
        }

        // Network analysis
        const issues = [];
        if (this.networkInfo.isTimeout) issues.push('Timeout');
        if (this.networkInfo.isDNS) issues.push('DNS Resolution');
        if (this.networkInfo.isConnection) issues.push('Connection');
        if (this.networkInfo.isServerError) issues.push('Server Error');
        if (this.networkInfo.isRateLimit) issues.push('Rate Limited');
        if (this.networkInfo.isAuth) issues.push('Authentication');

        if (issues.length > 0) {
            parts.push(`   Issues: ${issues.join(', ')}`);
        }

        // Retry information
        if (this.retryConfig.shouldRetry) {
            parts.push(`\n   🔄 Retry Configuration:`);
            parts.push(`   • Max retries: ${this.retryConfig.maxRetries}`);
            parts.push(`   • Next retry: ${this.circuitBreaker.nextRetry?.toLocaleString() || 'N/A'}`);

            if (this.networkInfo.isRateLimit && this.responseHeaders['retry-after']) {
                parts.push(`   • Retry after: ${this.responseHeaders['retry-after']}`);
            }
        }

        // Proxy information
        if (this.proxyInfo.detected) {
            parts.push(`\n   🔌 Proxy Detected:`);
            parts.push(`   • HTTP Proxy: ${this.proxyInfo.httpProxy || 'None'}`);
            parts.push(`   • HTTPS Proxy: ${this.proxyInfo.httpsProxy || 'None'}`);
            parts.push(`   • Consider proxy configuration issues`);
        }

        // Diagnostics
        if (this.diagnostics.length > 0) {
            parts.push(`\n   🔍 Diagnostics:`);
            this.diagnostics.forEach((diag, index) => {
                parts.push(`   ${index + 1}. ${diag.test}`);
                if (diag.command) {
                    parts.push(`      $ ${diag.command}`);
                }
                if (diag.suggestion) {
                    parts.push(`      → ${diag.suggestion}`);
                }
                if (diag.commands) {
                    diag.commands.forEach(cmd => {
                        parts.push(`      $ ${cmd}`);
                    });
                }
                parts.push(`      ${diag.description}`);
            });
        }

        // Offline strategies
        if (this.offlineStrategies.length > 0) {
            parts.push(`\n   💾 Offline Strategies:`);
            this.offlineStrategies.forEach(strategy => {
                parts.push(`   ${strategy.name}: ${strategy.description}`);
                strategy.implementation.forEach((step, i) => {
                    parts.push(`     ${i + 1}. ${step}`);
                });
            });
        }

        return parts.join('\n');
    }

    /**
     * Static factory methods
     */
    static timeout(url, timeout, options = {}) {
        return new NetworkError(
            `Request timeout after ${timeout}ms`,
            {
                url,
                timeout,
                code: 'TIMEOUT',
                ...options
            }
        );
    }

    static connectionRefused(url, options = {}) {
        return new NetworkError(
            `Connection refused: ${url}`,
            {
                url,
                errno: 'ECONNREFUSED',
                ...options
            }
        );
    }

    static dnsLookupFailed(hostname, options = {}) {
        return new NetworkError(
            `DNS lookup failed for: ${hostname}`,
            {
                url: `https://${hostname}`,
                errno: 'ENOTFOUND',
                ...options
            }
        );
    }

    static httpError(url, statusCode, statusText, options = {}) {
        return new NetworkError(
            `HTTP ${statusCode}: ${statusText}`,
            {
                url,
                statusCode,
                statusText,
                ...options
            }
        );
    }

    static rateLimited(url, retryAfter, options = {}) {
        return new NetworkError(
            'Rate limit exceeded',
            {
                url,
                statusCode: 429,
                responseHeaders: { 'retry-after': retryAfter },
                ...options
            }
        );
    }
}

module.exports = NetworkError;
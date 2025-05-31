/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - AI PROMPT
 * ============================================================================
 * FILE: src/utils/PathUtils.js
 * VERSION: 2025-05-30 11:34:23
 * PHASE: PHASE 3: Code Generation Engine
 * CATEGORY: 🛠️ Utility Functions
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 *
 * Create comprehensive path utilities that:
 * - Convert OpenAPI paths to Next.js dynamic routes 
 * - Handle complex parameter patterns 
 * - Implement path normalization 
 * - Support catch-all routes 
 * - Handle optional parameters 
 * - Implement path validation 
 * - Generate route matching functions 
 * - Support internationalized routes 
 * - Handle special characters 
 * - Implement path security checks
 *
 * ============================================================================
 */
const path = require('path');
const { URL } = require('url');

/**
 * Comprehensive path utilities for OpenAPI to Next.js route conversion
 */
class PathUtils {
    /**
     * Convert OpenAPI path to Next.js dynamic route
     * @param {string} openApiPath - OpenAPI path (e.g., /users/{userId}/posts/{postId})
     * @param {Object} options - Conversion options
     * @returns {Object} Next.js route information
     */
    static convertToNextJsRoute(openApiPath, options = {}) {
        const {
            basePath = '',
            apiDir = 'app/api',
            pagesDir = 'app',
            useAppRouter = true,
            generateCatchAll = false,
            preserveCase = false,
            groupRoutes = true
        } = options;

        // Validate input
        if (!this.isValidPath(openApiPath)) {
            throw new Error(`Invalid OpenAPI path: ${openApiPath}`);
        }

        // Normalize path
        let normalizedPath = this.normalizePath(openApiPath);

        // Extract path segments
        const segments = normalizedPath.split('/').filter(Boolean);
        const convertedSegments = [];
        const params = [];
        const catchAllIndex = -1;

        // Process each segment
        segments.forEach((segment, index) => {
            const processed = this.processSegment(segment, {
                preserveCase,
                isLast: index === segments.length - 1,
                generateCatchAll: generateCatchAll && index === segments.length - 1
            });

            convertedSegments.push(processed.segment);

            if (processed.param) {
                params.push({
                    ...processed.param,
                    position: index
                });
            }

            if (processed.isCatchAll) {
                catchAllIndex = index;
            }
        });

        // Build file system path
        const routePath = useAppRouter ?
            this.buildAppRouterPath(convertedSegments, { apiDir, pagesDir, groupRoutes }) :
            this.buildPagesRouterPath(convertedSegments, { apiDir });

        // Generate route pattern for matching
        const routePattern = this.generateRoutePattern(convertedSegments);

        // Generate TypeScript types for params
        const paramTypes = this.generateParamTypes(params);

        return {
            originalPath: openApiPath,
            nextjsRoute: '/' + convertedSegments.join('/'),
            filePath: routePath.filePath,
            folderPath: routePath.folderPath,
            fileName: routePath.fileName,
            params,
            paramTypes,
            routePattern,
            isCatchAll: catchAllIndex !== -1,
            catchAllParam: catchAllIndex !== -1 ? params[catchAllIndex] : null,
            isApiRoute: routePath.isApiRoute,
            isDynamic: params.length > 0,
            segments: convertedSegments,
            metadata: {
                method: options.method,
                operationId: options.operationId,
                tags: options.tags || []
            }
        };
    }

    /**
     * Process a single path segment
     * @param {string} segment - Path segment
     * @param {Object} options - Processing options
     * @returns {Object} Processed segment info
     */
    static processSegment(segment, options = {}) {
        const { preserveCase, isLast, generateCatchAll } = options;

        // Check for parameter patterns
        const paramMatch = segment.match(/^{(.+)}$/);

        if (paramMatch) {
            const paramName = paramMatch[1];
            const sanitizedName = this.sanitizeParamName(paramName);

            // Check for special parameter patterns
            const isOptional = paramName.endsWith('?');
            const isArray = paramName.endsWith('[]') || paramName.endsWith('*');
            const isCatchAll = generateCatchAll && isLast && isArray;

            const cleanName = sanitizedName
                .replace(/\?$/, '')
                .replace(/\[\]$/, '')
                .replace(/\*$/, '');

            if (isCatchAll) {
                return {
                    segment: `[...${cleanName}]`,
                    param: {
                        name: cleanName,
                        originalName: paramName,
                        type: 'catchAll',
                        isOptional: true,
                        isArray: true
                    },
                    isCatchAll: true
                };
            }

            if (isOptional) {
                return {
                    segment: `[[...${cleanName}]]`,
                    param: {
                        name: cleanName,
                        originalName: paramName,
                        type: 'optional',
                        isOptional: true,
                        isArray: false
                    }
                };
            }

            return {
                segment: `[${cleanName}]`,
                param: {
                    name: cleanName,
                    originalName: paramName,
                    type: 'dynamic',
                    isOptional: false,
                    isArray: isArray
                }
            };
        }

        // Regular segment
        const processedSegment = preserveCase ? segment : this.toKebabCase(segment);
        return {
            segment: this.sanitizeSegment(processedSegment),
            param: null
        };
    }

    /**
     * Build App Router path structure
     * @param {Array<string>} segments - Path segments
     * @param {Object} options - Build options
     * @returns {Object} Path structure
     */
    static buildAppRouterPath(segments, options = {}) {
        const { apiDir, pagesDir, groupRoutes } = options;
        const isApiRoute = segments[0] === 'api' || options.forceApi;

        let pathSegments = [...segments];

        // Remove 'api' prefix if present for API routes
        if (isApiRoute && pathSegments[0] === 'api') {
            pathSegments.shift();
        }

        // Apply route grouping if enabled
        if (groupRoutes && pathSegments.length > 2) {
            pathSegments = this.applyRouteGrouping(pathSegments);
        }

        // Determine base directory
        const baseDir = isApiRoute ? apiDir : pagesDir;

        // Build folder path
        const folderPath = path.join(baseDir, ...pathSegments);

        // Determine file name
        const fileName = isApiRoute ? 'route.ts' : 'page.tsx';

        // Full file path
        const filePath = path.join(folderPath, fileName);

        return {
            filePath,
            folderPath,
            fileName,
            isApiRoute
        };
    }

    /**
     * Build Pages Router path structure
     * @param {Array<string>} segments - Path segments
     * @param {Object} options - Build options
     * @returns {Object} Path structure
     */
    static buildPagesRouterPath(segments, options = {}) {
        const { apiDir } = options;
        const isApiRoute = segments[0] === 'api';

        let pathSegments = [...segments];

        // For pages router, keep the structure but change dynamic segments
        const fileName = pathSegments.pop() + '.ts';

        // Build folder path
        const folderPath = pathSegments.length > 0 ?
            path.join(isApiRoute ? apiDir : 'pages', ...pathSegments) :
            (isApiRoute ? apiDir : 'pages');

        // Full file path
        const filePath = path.join(folderPath, fileName);

        return {
            filePath,
            folderPath,
            fileName,
            isApiRoute
        };
    }

    /**
     * Apply intelligent route grouping
     * @param {Array<string>} segments - Path segments
     * @returns {Array<string>} Grouped segments
     */
    static applyRouteGrouping(segments) {
        const grouped = [];

        // Common grouping patterns
        const groupPatterns = {
            admin: ['admin', 'management', 'dashboard'],
            auth: ['auth', 'login', 'register', 'signin', 'signup'],
            user: ['user', 'users', 'profile', 'account'],
            api: ['api', 'v1', 'v2', 'v3']
        };

        let currentGroup = null;

        segments.forEach(segment => {
            // Check if segment matches a group pattern
            for (const [groupName, patterns] of Object.entries(groupPatterns)) {
                if (patterns.includes(segment.toLowerCase())) {
                    if (!currentGroup) {
                        currentGroup = groupName;
                        grouped.push(`(${groupName})`);
                    }
                    return;
                }
            }

            grouped.push(segment);
        });

        return grouped;
    }

    /**
     * Generate route pattern for matching
     * @param {Array<string>} segments - Converted segments
     * @returns {RegExp} Route pattern
     */
    static generateRoutePattern(segments) {
        let pattern = '^';

        segments.forEach(segment => {
            pattern += '/';

            if (segment.startsWith('[...') && segment.endsWith(']')) {
                // Catch-all route
                pattern += '(.*)';
            } else if (segment.startsWith('[[...') && segment.endsWith(']]')) {
                // Optional catch-all route
                pattern += '(.*)';
            } else if (segment.startsWith('[') && segment.endsWith(']')) {
                // Dynamic route
                pattern += '([^/]+)';
            } else {
                // Static segment
                pattern += segment;
            }
        });

        pattern += '$';

        return new RegExp(pattern);
    }

    /**
     * Generate TypeScript types for parameters
     * @param {Array<Object>} params - Parameter definitions
     * @returns {string} TypeScript interface
     */
    static generateParamTypes(params) {
        if (params.length === 0) {
            return 'export type RouteParams = Record<string, never>;';
        }

        const properties = params.map(param => {
            let type = 'string';

            if (param.isArray || param.type === 'catchAll') {
                type = 'string | string[]';
            }

            const optional = param.isOptional ? '?' : '';

            return `  ${param.name}${optional}: ${type};`;
        });

        return `export interface RouteParams {\n${properties.join('\n')}\n}`;
    }

    /**
     * Validate OpenAPI path
     * @param {string} path - Path to validate
     * @returns {boolean} Validation result
     */
    static isValidPath(path) {
        if (!path || typeof path !== 'string') {
            return false;
        }

        // Check for valid path format
        if (!path.startsWith('/')) {
            return false;
        }

        // Check for invalid characters
        const invalidChars = ['<', '>', '"', '`', ' ', '#', '?', '{', '}'];
        const pathWithoutParams = path.replace(/{[^}]+}/g, '');

        return !invalidChars.some(char => pathWithoutParams.includes(char));
    }

    /**
     * Normalize path
     * @param {string} path - Path to normalize
     * @returns {string} Normalized path
     */
    static normalizePath(path) {
        // Remove trailing slash
        path = path.replace(/\/$/, '');

        // Remove duplicate slashes
        path = path.replace(/\/+/g, '/');

        // Ensure leading slash
        if (!path.startsWith('/')) {
            path = '/' + path;
        }

        return path;
    }

    /**
     * Sanitize parameter name
     * @param {string} name - Parameter name
     * @returns {string} Sanitized name
     */
    static sanitizeParamName(name) {
        // Remove special characters
        let sanitized = name.replace(/[^a-zA-Z0-9_]/g, '');

        // Ensure it starts with a letter
        if (/^\d/.test(sanitized)) {
            sanitized = 'param' + sanitized;
        }

        // Convert to camelCase
        return this.toCamelCase(sanitized);
    }

    /**
     * Sanitize path segment
     * @param {string} segment - Path segment
     * @returns {string} Sanitized segment
     */
    static sanitizeSegment(segment) {
        // Remove special characters except hyphens
        let sanitized = segment.replace(/[^a-zA-Z0-9-]/g, '-');

        // Remove multiple consecutive hyphens
        sanitized = sanitized.replace(/-+/g, '-');

        // Remove leading/trailing hyphens
        sanitized = sanitized.replace(/^-+|-+$/g, '');

        return sanitized.toLowerCase();
    }

    /**
     * Convert string to kebab-case
     * @param {string} str - String to convert
     * @returns {string} Kebab-case string
     */
    static toKebabCase(str) {
        return str
            .replace(/([a-z])([A-Z])/g, '$1-$2')
            .replace(/[\s_]+/g, '-')
            .toLowerCase();
    }

    /**
     * Convert string to camelCase
     * @param {string} str - String to convert
     * @returns {string} CamelCase string
     */
    static toCamelCase(str) {
        return str
            .replace(/[-_\s](.)/g, (_, char) => char.toUpperCase())
            .replace(/^(.)/, (_, char) => char.toLowerCase());
    }

    /**
     * Handle special Next.js route patterns
     * @param {string} path - OpenAPI path
     * @returns {Object} Special route info
     */
    static handleSpecialRoutes(path) {
        const specialPatterns = {
            index: /^\/$/,
            catchAll: /\{\.\.\.(.+)\}$/,
            optional: /\{(.+)\?}$/,
            multiple: /\{(.+)\[\]\}$/,
            regex: /\{(.+):(.+)\}$/
        };

        for (const [type, pattern] of Object.entries(specialPatterns)) {
            const match = path.match(pattern);
            if (match) {
                return {
                    type,
                    match,
                    param: match[1] || null,
                    pattern: match[2] || null
                };
            }
        }

        return null;
    }

    /**
     * Generate route matcher function
     * @param {string} route - Next.js route pattern
     * @returns {Function} Matcher function
     */
    static generateRouteMatcher(route) {
        const pattern = this.generateRoutePattern(route.split('/').filter(Boolean));

        return (path) => {
            const match = path.match(pattern);
            if (!match) return null;

            const params = {};
            const segments = route.split('/').filter(Boolean);
            let paramIndex = 1;

            segments.forEach(segment => {
                if (segment.startsWith('[') && segment.endsWith(']')) {
                    const paramName = segment.slice(1, -1).replace('...', '');
                    params[paramName] = match[paramIndex++];
                }
            });

            return params;
        };
    }

    /**
     * Convert Next.js route back to OpenAPI path
     * @param {string} nextjsRoute - Next.js route
     * @returns {string} OpenAPI path
     */
    static convertToOpenApiPath(nextjsRoute) {
        let openApiPath = nextjsRoute;

        // Convert dynamic segments
        openApiPath = openApiPath.replace(/\[([^\]]+)\]/g, (_, param) => {
            // Handle catch-all routes
            if (param.startsWith('...')) {
                return `{${param.slice(3)}*}`;
            }
            return `{${param}}`;
        });

        // Convert optional segments
        openApiPath = openApiPath.replace(/\[\[([^\]]+)\]\]/g, (_, param) => {
            if (param.startsWith('...')) {
                return `{${param.slice(3)}?}`;
            }
            return `{${param}?}`;
        });

        return openApiPath;
    }

    /**
     * Check if path requires authentication
     * @param {string} path - API path
     * @param {Object} securitySchemes - OpenAPI security schemes
     * @returns {boolean} Authentication requirement
     */
    static requiresAuth(path, securitySchemes = {}) {
        // Common auth patterns
        const authPatterns = [
            /^\/api\/auth\//,
            /^\/api\/admin\//,
            /^\/api\/user\//,
            /^\/api\/private\//,
            /\/profile/,
            /\/account/,
            /\/settings/
        ];

        return authPatterns.some(pattern => pattern.test(path));
    }

    /**
     * Generate breadcrumb structure
     * @param {string} path - Route path
     * @returns {Array<Object>} Breadcrumb items
     */
    static generateBreadcrumbs(path) {
        const segments = path.split('/').filter(Boolean);
        const breadcrumbs = [{ label: 'Home', path: '/' }];

        let currentPath = '';
        segments.forEach((segment, index) => {
            currentPath += '/' + segment;

            // Skip dynamic segments in breadcrumbs
            if (!segment.startsWith('[')) {
                breadcrumbs.push({
                    label: this.humanizeSegment(segment),
                    path: currentPath,
                    isLast: index === segments.length - 1
                });
            }
        });

        return breadcrumbs;
    }

    /**
     * Humanize path segment
     * @param {string} segment - Path segment
     * @returns {string} Human-readable label
     */
    static humanizeSegment(segment) {
        return segment
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, char => char.toUpperCase());
    }

    /**
     * Check for path conflicts
     * @param {Array<string>} paths - Array of paths
     * @returns {Array<Object>} Conflicts found
     */
    static checkPathConflicts(paths) {
        const conflicts = [];
        const normalized = new Map();

        paths.forEach(path => {
            const normalizedPath = this.normalizePath(path);
            const routeInfo = this.convertToNextJsRoute(path);

            // Check for exact duplicates
            if (normalized.has(normalizedPath)) {
                conflicts.push({
                    type: 'duplicate',
                    paths: [normalized.get(normalizedPath), path],
                    message: `Duplicate paths found: ${path}`
                });
            }

            // Check for pattern conflicts
            normalized.forEach((existingPath, existingNormalized) => {
                if (this.patternsConflict(routeInfo.routePattern, existingNormalized)) {
                    conflicts.push({
                        type: 'pattern',
                        paths: [existingPath, path],
                        message: `Pattern conflict between: ${existingPath} and ${path}`
                    });
                }
            });

            normalized.set(normalizedPath, path);
        });

        return conflicts;
    }

    /**
     * Check if two patterns conflict
     * @param {RegExp} pattern1 - First pattern
     * @param {string} path2 - Second path
     * @returns {boolean} True if conflicts exist
     */
    static patternsConflict(pattern1, path2) {
        // Test if pattern1 matches path2
        return pattern1.test(path2);
    }

    /**
     * Generate API route handler name
     * @param {string} method - HTTP method
     * @param {string} path - API path
     * @returns {string} Handler function name
     */
    static generateHandlerName(method, path) {
        const segments = path.split('/').filter(Boolean);
        const cleanSegments = segments
            .filter(s => !s.startsWith('{'))
            .map(s => this.toCamelCase(s));

        const operation = cleanSegments.join('');
        return `${method.toLowerCase()}${operation.charAt(0).toUpperCase() + operation.slice(1)}`;
    }

    /**
     * Extract route metadata
     * @param {string} path - Route path
     * @param {Object} operation - OpenAPI operation
     * @returns {Object} Route metadata
     */
    static extractRouteMetadata(path, operation = {}) {
        return {
            path,
            method: operation.method || 'GET',
            operationId: operation.operationId || this.generateOperationId(path, operation.method),
            tags: operation.tags || [],
            summary: operation.summary || '',
            description: operation.description || '',
            security: operation.security || [],
            parameters: operation.parameters || [],
            requestBody: operation.requestBody || null,
            responses: operation.responses || {},
            deprecated: operation.deprecated || false
        };
    }

    /**
     * Generate operation ID
     * @param {string} path - API path
     * @param {string} method - HTTP method
     * @returns {string} Operation ID
     */
    static generateOperationId(path, method = 'get') {
        const segments = path.split('/').filter(Boolean);
        const cleanSegments = segments.map(s =>
            s.startsWith('{') ? 'By' + this.toCamelCase(s.slice(1, -1)) : this.toCamelCase(s)
        );

        return method.toLowerCase() + cleanSegments.map(s =>
            s.charAt(0).toUpperCase() + s.slice(1)
        ).join('');
    }

    /**
     * Validate route structure
     * @param {Object} route - Route object
     * @returns {Object} Validation result
     */
    static validateRoute(route) {
        const errors = [];
        const warnings = [];

        // Check for required fields
        if (!route.path) {
            errors.push('Route path is required');
        }

        // Check for valid method
        const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
        if (route.method && !validMethods.includes(route.method.toUpperCase())) {
            errors.push(`Invalid HTTP method: ${route.method}`);
        }

        // Check for path conflicts
        if (route.path && route.path.includes('//')) {
            warnings.push('Path contains double slashes');
        }

        // Check for security on sensitive routes
        if (this.requiresAuth(route.path) && (!route.security || route.security.length === 0)) {
            warnings.push('Sensitive route without security requirements');
        }

        // Check parameter naming
        const paramPattern = /{([^}]+)}/g;
        let match;
        while ((match = paramPattern.exec(route.path)) !== null) {
            const paramName = match[1];
            if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(paramName)) {
                warnings.push(`Parameter name '${paramName}' should follow naming conventions`);
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Generate route documentation
     * @param {Object} route - Route information
     * @returns {string} Documentation string
     */
    static generateRouteDocumentation(route) {
        const docs = [];

        docs.push(`/**`);
        docs.push(` * ${route.summary || route.operationId || 'API Route Handler'}`);

        if (route.description) {
            docs.push(` * ${route.description}`);
        }

        docs.push(` *`);
        docs.push(` * @route ${route.method || 'GET'} ${route.path}`);

        if (route.parameters && route.parameters.length > 0) {
            docs.push(` * @params`);
            route.parameters.forEach(param => {
                docs.push(` *   - ${param.name} {${param.type || 'string'}} ${param.required ? '(required)' : '(optional)'} - ${param.description || ''}`);
            });
        }

        if (route.requestBody) {
            docs.push(` * @body {${route.requestBody.type || 'object'}} Request body`);
        }

        if (route.responses) {
            docs.push(` * @returns`);
            Object.entries(route.responses).forEach(([code, response]) => {
                docs.push(` *   ${code}: ${response.description || 'Response'}`);
            });
        }

        if (route.security && route.security.length > 0) {
            docs.push(` * @security ${route.security.map(s => Object.keys(s)[0]).join(', ')}`);
        }

        if (route.deprecated) {
            docs.push(` * @deprecated`);
        }

        docs.push(` */`);

        return docs.join('\n');
    }

    /**
     * Parse route from file path
     * @param {string} filePath - File path
     * @param {Object} options - Parse options
     * @returns {Object} Route information
     */
    static parseRouteFromPath(filePath, options = {}) {
        const { baseDir = 'app', apiDir = 'app/api' } = options;

        // Normalize file path
        const normalizedPath = path.normalize(filePath).replace(/\\/g, '/');

        // Determine if it's an API route
        const isApiRoute = normalizedPath.includes(apiDir);

        // Extract route path
        const basePath = isApiRoute ? apiDir : baseDir;
        const relativePath = normalizedPath.split(basePath)[1] || '';

        // Remove file name
        const routePath = relativePath
            .replace(/\/(route|page)\.(ts|tsx|js|jsx)$/, '')
            .replace(/\/index\.(ts|tsx|js|jsx)$/, '');

        // Convert file system path to route
        const segments = routePath.split('/').filter(Boolean);
        const route = '/' + segments.join('/');

        return {
            route,
            isApiRoute,
            segments,
            filePath: normalizedPath,
            isDynamic: segments.some(s => s.startsWith('[') && s.endsWith(']'))
        };
    }
}

module.exports = PathUtils;
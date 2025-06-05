/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - PATH UTILITIES
 * ============================================================================
 * FILE: src/utils/PathUtils.js
 * VERSION: 2025-05-30 11:34:23
 * PHASE: PHASE 3: Code Generation Engine
 * CATEGORY: 🛠️ Utilities
 * ============================================================================
 *
 * PURPOSE:
 * Comprehensive path processing utilities for converting OpenAPI paths
 * to Next.js App Router conventions and handling path operations.
 *
 * ============================================================================
 */

const path = require('path');

class PathUtils {
    constructor() {
        // Next.js App Router conventions
        this.dynamicSegmentPattern = /\{([^}]+)\}/g;
        this.catchAllPattern = /\{\.\.\.([^}]+)\}/g;
        this.optionalCatchAllPattern = /\{\[\[\.\.\.([^}]+)\]\]\}/g;

        // Common API path patterns
        this.versionPattern = /^\/?(v\d+|api\/v\d+)\//i;
        this.resourcePattern = /^\/([^\/]+)/;

        // Reserved Next.js folder names
        this.reservedNames = new Set([
            'api',
            'app',
            'pages',
            'public',
            'styles',
            '_app',
            '_document',
            '_error',
            'middleware'
        ]);

        // Common REST operations mapping
        this.operationMappings = {
            'get': { single: 'get', collection: 'list' },
            'post': { single: 'create', collection: 'create' },
            'put': { single: 'update', collection: 'updateMany' },
            'patch': { single: 'patch', collection: 'patchMany' },
            'delete': { single: 'delete', collection: 'deleteMany' }
        };
    }

    /**
     * Extract paths from OpenAPI specification
     * @param {object} spec - OpenAPI/Swagger specification
     * @returns {array} Array of path objects
     */
    extractPaths(spec) {
        const paths = [];

        if (!spec.paths) return paths;

        for (const [pathTemplate, pathItem] of Object.entries(spec.paths)) {
            const pathInfo = {
                path: pathTemplate,
                operations: {},
                parameters: pathItem.parameters || [],
                summary: pathItem.summary,
                description: pathItem.description
            };

            // Extract operations
            for (const [method, operation] of Object.entries(pathItem)) {
                if (this._isHttpMethod(method)) {
                    pathInfo.operations[method] = {
                        ...operation,
                        method: method.toUpperCase(),
                        path: pathTemplate
                    };
                }
            }

            paths.push(pathInfo);
        }

        return paths;
    }

    /**
     * Convert OpenAPI path to Next.js App Router path
     * @param {string} openApiPath - OpenAPI path template
     * @returns {string[]} Next.js directory structure
     */
    openApiToNextJs(openApiPath) {
        if (!openApiPath) return [];

        // Normalize path
        let normalized = this.normalizePath(openApiPath);

        // Convert path parameters to Next.js dynamic segments
        normalized = normalized.replace(this.dynamicSegmentPattern, '[$1]');

        // Handle catch-all routes
        normalized = normalized.replace(this.catchAllPattern, '[...$1]');

        // Split into segments
        const segments = normalized.split('/').filter(Boolean);

        // Validate and sanitize segments
        return segments.map(segment => this._sanitizeSegment(segment));
    }

    /**
     * Convert Next.js path back to OpenAPI format
     * @param {string} nextJsPath - Next.js path
     * @returns {string} OpenAPI path template
     */
    nextJsToOpenApi(nextJsPath) {
        if (!nextJsPath) return '';

        // Normalize path
        let normalized = this.normalizePath(nextJsPath);

        // Convert dynamic segments to OpenAPI parameters
        normalized = normalized.replace(/\[([^\]]+)\]/g, '{$1}');

        // Handle catch-all routes
        normalized = normalized.replace(/\[\.\.\.([^\]]+)\]/g, '{...$1}');

        return normalized;
    }

    /**
     * Parse path parameters from OpenAPI path
     * @param {string} pathTemplate - OpenAPI path template
     * @returns {array} Array of parameter objects
     */
    parsePathParameters(pathTemplate) {
        const parameters = [];
        const matches = pathTemplate.matchAll(this.dynamicSegmentPattern);

        for (const match of matches) {
            const paramName = match[1];
            parameters.push({
                name: paramName,
                in: 'path',
                required: true,
                schema: { type: 'string' }
            });
        }

        return parameters;
    }

    /**
     * Generate file path for API route
     * @param {string} apiPath - API path
     * @param {object} options - Generation options
     * @returns {string} File path
     */
    generateApiRoutePath(apiPath, options = {}) {
        const {
            baseDir = 'app/api',
            fileName = 'route.ts'
        } = options;

        const segments = this.openApiToNextJs(apiPath);
        return path.join(baseDir, ...segments, fileName);
    }

    /**
     * Generate file path for page component
     * @param {string} pagePath - Page path
     * @param {object} options - Generation options
     * @returns {string} File path
     */
    generatePagePath(pagePath, options = {}) {
        const {
            baseDir = 'app',
            fileName = 'page.tsx'
        } = options;

        const segments = this.openApiToNextJs(pagePath);
        return path.join(baseDir, ...segments, fileName);
    }

    /**
     * Extract resource name from path
     * @param {string} pathTemplate - Path template
     * @returns {string} Resource name
     */
    extractResourceName(pathTemplate) {
        // Remove API version prefix
        const withoutVersion = pathTemplate.replace(this.versionPattern, '/');

        // Extract first segment as resource
        const match = withoutVersion.match(this.resourcePattern);
        return match ? this._singularize(match[1]) : null;
    }

    /**
     * Extract operation type from path and method
     * @param {string} pathTemplate - Path template
     * @param {string} method - HTTP method
     * @returns {string} Operation type
     */
    extractOperationType(pathTemplate, method) {
        const lowerMethod = method.toLowerCase();
        const hasId = this.dynamicSegmentPattern.test(pathTemplate);

        const mapping = this.operationMappings[lowerMethod];
        if (!mapping) return lowerMethod;

        return hasId ? mapping.single : mapping.collection;
    }

    /**
     * Group paths by resource
     * @param {array} paths - Array of paths
     * @returns {object} Grouped paths
     */
    groupPathsByResource(paths) {
        const groups = {};

        for (const pathInfo of paths) {
            const resource = this.extractResourceName(pathInfo.path);
            if (!resource) continue;

            if (!groups[resource]) {
                groups[resource] = {
                    resource,
                    paths: []
                };
            }

            groups[resource].paths.push(pathInfo);
        }

        return groups;
    }

    /**
     * Build path with parameters
     * @param {string} pathTemplate - Path template
     * @param {object} params - Parameter values
     * @returns {string} Built path
     */
    buildPath(pathTemplate, params = {}) {
        let path = pathTemplate;

        // Replace path parameters
        for (const [key, value] of Object.entries(params)) {
            path = path.replace(`{${key}}`, encodeURIComponent(value));
        }

        // Check for missing parameters
        const missing = path.match(this.dynamicSegmentPattern);
        if (missing) {
            throw new Error(`Missing path parameters: ${missing.join(', ')}`);
        }

        return path;
    }

    /**
     * Normalize path
     * @param {string} inputPath - Input path
     * @returns {string} Normalized path
     */
    normalizePath(inputPath) {
        if (!inputPath) return '/';

        // Ensure leading slash
        let normalized = inputPath.startsWith('/') ? inputPath : `/${inputPath}`;

        // Remove trailing slash (except for root)
        if (normalized.length > 1 && normalized.endsWith('/')) {
            normalized = normalized.slice(0, -1);
        }

        // Replace multiple slashes with single slash
        normalized = normalized.replace(/\/+/g, '/');

        return normalized;
    }

    /**
     * Join path segments
     * @param {...string} segments - Path segments
     * @returns {string} Joined path
     */
    joinPaths(...segments) {
        const joined = segments
            .filter(Boolean)
            .map(segment => segment.replace(/^\/|\/$/g, ''))
            .join('/');

        return this.normalizePath(joined);
    }

    /**
     * Get parent path
     * @param {string} inputPath - Input path
     * @returns {string} Parent path
     */
    getParentPath(inputPath) {
        const normalized = this.normalizePath(inputPath);
        const segments = normalized.split('/').filter(Boolean);

        if (segments.length <= 1) return '/';

        segments.pop();
        return '/' + segments.join('/');
    }

    /**
     * Get path segments
     * @param {string} inputPath - Input path
     * @returns {string[]} Path segments
     */
    getSegments(inputPath) {
        const normalized = this.normalizePath(inputPath);
        return normalized.split('/').filter(Boolean);
    }

    /**
     * Check if path is dynamic
     * @param {string} pathTemplate - Path template
     * @returns {boolean} True if path contains parameters
     */
    isDynamicPath(pathTemplate) {
        return this.dynamicSegmentPattern.test(pathTemplate);
    }

    /**
     * Check if path is catch-all
     * @param {string} pathTemplate - Path template
     * @returns {boolean} True if path is catch-all
     */
    isCatchAllPath(pathTemplate) {
        return this.catchAllPattern.test(pathTemplate) ||
            this.optionalCatchAllPattern.test(pathTemplate);
    }

    /**
     * Extract API version from path
     * @param {string} pathTemplate - Path template
     * @returns {string|null} API version
     */
    extractApiVersion(pathTemplate) {
        const match = pathTemplate.match(this.versionPattern);
        if (!match) return null;

        // Extract version number
        const versionMatch = match[0].match(/v(\d+)/i);
        return versionMatch ? `v${versionMatch[1]}` : null;
    }

    /**
     * Add API version to path
     * @param {string} pathTemplate - Path template
     * @param {string} version - API version
     * @returns {string} Path with version
     */
    addApiVersion(pathTemplate, version) {
        // Check if version already exists
        if (this.versionPattern.test(pathTemplate)) {
            return pathTemplate;
        }

        const normalized = this.normalizePath(pathTemplate);
        const versionSegment = version.startsWith('v') ? version : `v${version}`;

        return `/api/${versionSegment}${normalized}`;
    }

    /**
     * Remove API version from path
     * @param {string} pathTemplate - Path template
     * @returns {string} Path without version
     */
    removeApiVersion(pathTemplate) {
        return pathTemplate.replace(this.versionPattern, '/');
    }

    /**
     * Generate breadcrumb from path
     * @param {string} inputPath - Input path
     * @returns {array} Breadcrumb items
     */
    generateBreadcrumb(inputPath) {
        const segments = this.getSegments(inputPath);
        const breadcrumb = [];
        let currentPath = '';

        for (const segment of segments) {
            currentPath += `/${segment}`;

            // Skip dynamic segments in breadcrumb
            if (!segment.startsWith('[')) {
                breadcrumb.push({
                    label: this._humanizeSegment(segment),
                    path: currentPath
                });
            }
        }

        return breadcrumb;
    }

    /**
     * Match path against pattern
     * @param {string} path - Path to match
     * @param {string} pattern - Pattern to match against
     * @returns {object|null} Match result with params
     */
    matchPath(path, pattern) {
        const pathSegments = this.getSegments(path);
        const patternSegments = this.getSegments(pattern);

        // Quick length check (unless pattern has catch-all)
        if (!this.isCatchAllPath(pattern) && pathSegments.length !== patternSegments.length) {
            return null;
        }

        const params = {};

        for (let i = 0; i < patternSegments.length; i++) {
            const patternSegment = patternSegments[i];
            const pathSegment = pathSegments[i];

            // Handle catch-all segments
            if (patternSegment.startsWith('[...') || patternSegment.startsWith('[[...')) {
                const paramName = patternSegment.match(/\[+\.\.\.([^\]]+)\]+/)[1];
                params[paramName] = pathSegments.slice(i);
                return { params, matched: true };
            }

            // Handle dynamic segments
            if (patternSegment.startsWith('[') && patternSegment.endsWith(']')) {
                const paramName = patternSegment.slice(1, -1);
                params[paramName] = pathSegment;
            } else if (patternSegment !== pathSegment) {
                // Static segments must match exactly
                return null;
            }
        }

        return { params, matched: true };
    }

    /**
     * Generate route pattern for matching
     * @param {string} pathTemplate - Path template
     * @returns {RegExp} Route pattern
     */
    generateRoutePattern(pathTemplate) {
        let pattern = pathTemplate;

        // Escape special regex characters
        pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Replace dynamic segments with regex groups
        pattern = pattern.replace(/\\\{([^}]+)\\\}/g, '(?<$1>[^/]+)');

        // Replace catch-all segments
        pattern = pattern.replace(/\\\{\\\.\\\.\\\.([^}]+)\\\}/g, '(?<$1>.*)');

        return new RegExp(`^${pattern}$`);
    }

    /**
     * Sort paths by specificity
     * @param {array} paths - Array of paths
     * @returns {array} Sorted paths
     */
    sortPathsBySpecificity(paths) {
        return paths.sort((a, b) => {
            // Static paths come before dynamic paths
            const aDynamic = this.isDynamicPath(a);
            const bDynamic = this.isDynamicPath(b);

            if (!aDynamic && bDynamic) return -1;
            if (aDynamic && !bDynamic) return 1;

            // Longer paths come before shorter paths
            const aSegments = this.getSegments(a).length;
            const bSegments = this.getSegments(b).length;

            if (aSegments !== bSegments) {
                return bSegments - aSegments;
            }

            // Alphabetical order as final tiebreaker
            return a.localeCompare(b);
        });
    }

    /**
     * Check if path matches a reserved name
     * @param {string} pathSegment - Path segment
     * @returns {boolean} True if reserved
     */
    isReservedPath(pathSegment) {
        return this.reservedNames.has(pathSegment.toLowerCase());
    }

    /**
     * Generate safe path avoiding reserved names
     * @param {string} inputPath - Input path
     * @returns {string} Safe path
     */
    generateSafePath(inputPath) {
        const segments = this.getSegments(inputPath);

        const safeSegments = segments.map(segment => {
            if (this.isReservedPath(segment)) {
                return `_${segment}`;
            }
            return segment;
        });

        return '/' + safeSegments.join('/');
    }

    /**
     * Extract query string from path
     * @param {string} fullPath - Full path with query
     * @returns {object} Path and query parts
     */
    extractQueryString(fullPath) {
        const [path, queryString] = fullPath.split('?');
        const query = {};

        if (queryString) {
            const params = new URLSearchParams(queryString);
            for (const [key, value] of params) {
                query[key] = value;
            }
        }

        return { path, query };
    }

    /**
     * Build full path with query parameters
     * @param {string} basePath - Base path
     * @param {object} queryParams - Query parameters
     * @returns {string} Full path with query
     */
    buildFullPath(basePath, queryParams = {}) {
        const normalized = this.normalizePath(basePath);
        const queryEntries = Object.entries(queryParams).filter(([_, value]) => value !== undefined);

        if (queryEntries.length === 0) {
            return normalized;
        }

        const queryString = queryEntries
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');

        return `${normalized}?${queryString}`;
    }

    /**
     * Convert path to file system safe path
     * @param {string} inputPath - Input path
     * @returns {string} File system safe path
     */
    toFileSystemPath(inputPath) {
        const segments = this.getSegments(inputPath);

        return segments.map(segment => {
            // Replace dynamic segments with safe names
            if (segment.startsWith('[') && segment.endsWith(']')) {
                const paramName = segment.slice(1, -1);
                return `_${paramName}`;
            }
            return this._sanitizeSegment(segment);
        }).join(path.sep);
    }

    /**
     * Extract route metadata from path
     * @param {string} pathTemplate - Path template
     * @param {string} method - HTTP method
     * @returns {object} Route metadata
     */
    extractRouteMetadata(pathTemplate, method) {
        const metadata = {
            path: pathTemplate,
            method: method.toUpperCase(),
            resource: this.extractResourceName(pathTemplate),
            operation: this.extractOperationType(pathTemplate, method),
            parameters: this.parsePathParameters(pathTemplate),
            isDynamic: this.isDynamicPath(pathTemplate),
            isCatchAll: this.isCatchAllPath(pathTemplate),
            depth: this.getSegments(pathTemplate).length,
            version: this.extractApiVersion(pathTemplate)
        };

        // Add route name
        metadata.routeName = this._generateRouteName(pathTemplate, method);

        // Add handler name
        metadata.handlerName = this._generateHandlerName(metadata.resource, metadata.operation);

        return metadata;
    }

    /**
     * Generate route mapping
     * @param {array} paths - Array of path objects
     * @returns {object} Route mapping
     */
    generateRouteMapping(paths) {
        const mapping = {};

        for (const pathInfo of paths) {
            for (const [method, operation] of Object.entries(pathInfo.operations)) {
                const metadata = this.extractRouteMetadata(pathInfo.path, method);
                const key = `${method.toUpperCase()} ${pathInfo.path}`;

                mapping[key] = {
                    ...metadata,
                    operationId: operation.operationId,
                    summary: operation.summary,
                    tags: operation.tags || []
                };
            }
        }

        return mapping;
    }

    /**
     * Find matching route
     * @param {string} method - HTTP method
     * @param {string} path - Request path
     * @param {object} routes - Route mapping
     * @returns {object|null} Matched route
     */
    findMatchingRoute(method, path, routes) {
        const normalizedPath = this.normalizePath(path);

        // Try exact match first
        const exactKey = `${method.toUpperCase()} ${normalizedPath}`;
        if (routes[exactKey]) {
            return { route: routes[exactKey], params: {} };
        }

        // Try pattern matching
        for (const [routeKey, routeData] of Object.entries(routes)) {
            const [routeMethod, routePath] = routeKey.split(' ');

            if (routeMethod !== method.toUpperCase()) continue;

            const match = this.matchPath(normalizedPath, routePath);
            if (match) {
                return { route: routeData, params: match.params };
            }
        }

        return null;
    }

    /**
     * Generate Next.js route structure
     * @param {array} paths - Array of paths
     * @returns {object} Route structure
     */
    generateNextJsRouteStructure(paths) {
        const structure = {};

        for (const pathInfo of paths) {
            const segments = this.openApiToNextJs(pathInfo.path);
            let current = structure;

            // Build nested structure
            for (let i = 0; i < segments.length; i++) {
                const segment = segments[i];

                if (!current[segment]) {
                    current[segment] = {
                        _segment: segment,
                        _path: '/' + segments.slice(0, i + 1).join('/'),
                        _isDynamic: segment.startsWith('['),
                        _children: {}
                    };
                }

                // Add operations to leaf nodes
                if (i === segments.length - 1) {
                    current[segment]._operations = pathInfo.operations;
                }

                current = current[segment]._children;
            }
        }

        return structure;
    }

    /**
     * Flatten route structure
     * @param {object} structure - Nested route structure
     * @param {string} basePath - Base path
     * @returns {array} Flattened routes
     */
    flattenRouteStructure(structure, basePath = '') {
        const routes = [];

        for (const [segment, data] of Object.entries(structure)) {
            if (segment.startsWith('_')) continue;

            const fullPath = basePath + '/' + segment;

            if (data._operations) {
                routes.push({
                    path: fullPath,
                    segment: data._segment,
                    operations: data._operations,
                    isDynamic: data._isDynamic
                });
            }

            // Recursively process children
            if (data._children && Object.keys(data._children).length > 0) {
                routes.push(...this.flattenRouteStructure(data._children, fullPath));
            }
        }

        return routes;
    }

    /**
     * Generate API documentation path
     * @param {string} pathTemplate - Path template
     * @param {string} method - HTTP method
     * @returns {string} Documentation path
     */
    generateDocPath(pathTemplate, method) {
        const segments = this.getSegments(pathTemplate);
        const docSegments = segments.map(segment => {
            if (segment.startsWith('{') && segment.endsWith('}')) {
                return segment.slice(1, -1);
            }
            return segment;
        });

        return `/docs/api/${method.toLowerCase()}-${docSegments.join('-')}`;
    }

    /**
     * Check if paths conflict
     * @param {string} path1 - First path
     * @param {string} path2 - Second path
     * @returns {boolean} True if paths conflict
     */
    checkPathConflict(path1, path2) {
        const segments1 = this.getSegments(path1);
        const segments2 = this.getSegments(path2);

        // Different lengths can't conflict (unless catch-all)
        if (segments1.length !== segments2.length) {
            return this.isCatchAllPath(path1) || this.isCatchAllPath(path2);
        }

        // Check each segment
        for (let i = 0; i < segments1.length; i++) {
            const seg1 = segments1[i];
            const seg2 = segments2[i];

            const isDynamic1 = seg1.startsWith('[') || seg1.startsWith('{');
            const isDynamic2 = seg2.startsWith('[') || seg2.startsWith('{');

            // Two static segments must match exactly
            if (!isDynamic1 && !isDynamic2 && seg1 !== seg2) {
                return false;
            }

            // Dynamic segments at the same position always conflict
            if (isDynamic1 && isDynamic2) {
                return true;
            }
        }

        // If we get here, paths are identical
        return true;
    }

    /**
     * Resolve path conflicts
     * @param {array} paths - Array of paths
     * @returns {object} Resolved paths with conflict info
     */
    resolvePathConflicts(paths) {
        const resolved = [];
        const conflicts = [];

        for (let i = 0; i < paths.length; i++) {
            const path1 = paths[i];
            const pathConflicts = [];

            for (let j = i + 1; j < paths.length; j++) {
                const path2 = paths[j];

                if (this.checkPathConflict(path1.path, path2.path)) {
                    pathConflicts.push(path2.path);
                }
            }

            resolved.push({
                ...path1,
                conflicts: pathConflicts,
                hasConflicts: pathConflicts.length > 0
            });

            if (pathConflicts.length > 0) {
                conflicts.push({
                    path: path1.path,
                    conflictsWith: pathConflicts
                });
            }
        }

        return { resolved, conflicts };
    }

    // ============================================================================
    // Private Helper Methods
    // ============================================================================

    /**
     * Check if string is HTTP method
     * @private
     */
    _isHttpMethod(method) {
        const httpMethods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];
        return httpMethods.includes(method.toLowerCase());
    }

    /**
     * Sanitize path segment
     * @private
     */
    _sanitizeSegment(segment) {
        // Remove invalid characters
        let sanitized = segment.replace(/[^a-zA-Z0-9\-_\[\]\.]/g, '-');

        // Remove multiple dashes
        sanitized = sanitized.replace(/-+/g, '-');

        // Remove leading/trailing dashes
        sanitized = sanitized.replace(/^-|-$/g, '');

        // Handle empty result
        if (!sanitized) {
            return 'segment';
        }

        return sanitized.toLowerCase();
    }

    /**
     * Singularize resource name
     * @private
     */
    _singularize(word) {
        // Simple singularization rules
        if (word.endsWith('ies')) {
            return word.slice(0, -3) + 'y';
        }
        if (word.endsWith('es')) {
            return word.slice(0, -2);
        }
        if (word.endsWith('s')) {
            return word.slice(0, -1);
        }
        return word;
    }

    /**
     * Humanize segment for display
     * @private
     */
    _humanizeSegment(segment) {
        return segment
            .replace(/[-_]/g, ' ')
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Generate route name
     * @private
     */
    _generateRouteName(pathTemplate, method) {
        const segments = this.getSegments(pathTemplate)
            .filter(seg => !seg.startsWith('[') && !seg.startsWith('{'))
            .map(seg => this._capitalize(seg));

        return `${method}${segments.join('')}Route`;
    }

    /**
     * Generate handler name
     * @private
     */
    _generateHandlerName(resource, operation) {
        if (!resource) return `handle${this._capitalize(operation)}`;

        return `${operation}${this._capitalize(resource)}`;
    }

    /**
     * Capitalize string
     * @private
     */
    _capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

module.exports = PathUtils;
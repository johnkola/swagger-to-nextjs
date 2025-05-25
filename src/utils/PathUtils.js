/**
 * ===AI PROMPT ==============================================================
 * FILE: src/utils/PathUtils.js
 * VERSION: 2025-05-25 13:22:11
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 * Create utility functions for path manipulation: converting OpenAPI paths to
 * NextJS routes, handling dynamic segments, and sanitizing file names.
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
 * FILE: src/utils/PathUtils.js
 *
 * AI PROMPT FOR CODE REVIEW/ENHANCEMENT:
 * =====================================
 *
 * You are reviewing path manipulation utilities for converting OpenAPI paths
 * to Next.js routing conventions. These utilities handle complex path transformations,
 * parameter extraction, and route sanitization for Next.js App Router compatibility.
 *
 * RESPONSIBILITIES:
 * - Convert OpenAPI path formats to Next.js dynamic routing
 * - Extract and validate path parameters from route definitions
 * - Sanitize paths for cross-platform file system compatibility
 * - Generate component and class names from path segments
 * - Handle edge cases in path parameter patterns
 * - Validate Next.js routing compatibility
 *
 * PATH TRANSFORMATIONS:
 * - {param} → [param] (OpenAPI to Next.js dynamic routes)
 * - /users/{id}/posts → /users/[id]/posts
 * - Complex parameter patterns and nested routes
 * - Path sanitization for file system safety
 * - Component name generation from paths
 *
 * REVIEW FOCUS:
 * - Cross-platform path handling (Windows/Unix)
 * - Edge case handling for complex parameter patterns
 * - Performance optimization for large route sets
 * - Naming convention consistency
 * - Validation accuracy and error reporting
 */

class PathUtils {
    /**
     * Convert Swagger path to Next.js dynamic route with validation
     */
    static convertToNextJSPath(swaggerPath) {
        if (!swaggerPath || typeof swaggerPath !== 'string') {
            throw new Error('Invalid swagger path: must be a non-empty string');
        }

        // Convert path parameters from {param} to [param]
        let converted = swaggerPath.replace(/{([^}]+)}/g, '[$1]');

        // Sanitize path - remove invalid characters but keep valid ones
        converted = converted.replace(/[^a-zA-Z0-9/_\[\]-]/g, '');

        // Remove trailing slash if present (except for root)
        if (converted.endsWith('/') && converted.length > 1) {
            converted = converted.slice(0, -1);
        }

        // Ensure path starts with /
        if (!converted.startsWith('/')) {
            converted = '/' + converted;
        }

        // Validate the path doesn't have invalid patterns
        this.validateNextJSPath(converted, swaggerPath);

        return converted;
    }

    /**
     * Validate Next.js path for common issues
     */
    static validateNextJSPath(nextjsPath, originalPath) {
        const issues = [];

        // Check for invalid patterns
        if (nextjsPath.includes('//')) {
            issues.push('Contains double slashes');
        }

        if (nextjsPath.includes('[/') || nextjsPath.includes('/]')) {
            issues.push('Invalid bracket placement');
        }

        // Check for empty segments
        const segments = nextjsPath.split('/').filter(s => s);
        if (segments.some(segment => segment.trim() === '')) {
            issues.push('Contains empty path segments');
        }

        // Check for invalid parameter names
        const paramMatches = nextjsPath.match(/\[([^\]]+)\]/g);
        if (paramMatches) {
            paramMatches.forEach(match => {
                const paramName = match.slice(1, -1);
                if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(paramName)) {
                    issues.push(`Invalid parameter name: ${paramName}`);
                }
            });
        }

        if (issues.length > 0) {
            console.warn(`⚠️  Path conversion issues for "${originalPath}" → "${nextjsPath}": ${issues.join(', ')}`);
        }

        return issues.length === 0;
    }

    /**
     * Extract path parameters from OpenAPI route
     */
    static extractPathParameters(routePath) {
        if (!routePath || typeof routePath !== 'string') {
            return [];
        }

        const matches = routePath.match(/\{([^}]+)\}/g);
        if (!matches) return [];

        return matches
            .map(match => match.slice(1, -1)) // Remove { and }
            .filter(param => param.trim() !== '') // Remove empty parameters
            .map(param => param.trim()); // Clean whitespace
    }

    /**
     * Generate a valid React component name from route path
     */
    static generateComponentName(routePath) {
        if (!routePath || typeof routePath !== 'string') {
            return 'DefaultPage';
        }

        // Remove path parameters and clean up the path
        let cleanPath = routePath
            .replace(/\{[^}]+\}/g, '') // Remove {param} patterns
            .replace(/[^a-zA-Z0-9/_-]/g, '') // Remove special characters
            .split('/')
            .filter(segment => segment && segment.trim() !== '')
            .map(segment => {
                // Convert kebab-case and snake_case to PascalCase
                return segment
                    .split(/[-_]/)
                    .map(word => this.capitalize(word))
                    .join('');
            })
            .join('');

        // Ensure it starts with a capital letter
        cleanPath = this.capitalize(cleanPath);

        // Validate component name
        if (!this.isValidComponentName(cleanPath)) {
            cleanPath = 'ApiEndpoint';
        }

        return cleanPath + 'Page';
    }

    /**
     * Generate API class name from path segment
     */
    static generateApiClassName(pathSegment) {
        if (!pathSegment || typeof pathSegment !== 'string') {
            return 'DefaultApi';
        }

        // Clean and convert to PascalCase
        const className = pathSegment
            .replace(/[^a-zA-Z0-9_-]/g, '') // Remove invalid characters
            .split(/[-_]/)
            .map(word => this.capitalize(word))
            .join('') + 'Api';

        return className || 'DefaultApi';
    }

    /**
     * Generate a meaningful page title from route path and operation
     */
    static generatePageTitle(routePath, operation) {
        // Use operation summary if available
        if (operation && operation.summary) {
            return operation.summary;
        }

        // Generate title from path segments
        if (!routePath || typeof routePath !== 'string') {
            return 'API Endpoint';
        }

        const pathParts = routePath
            .split('/')
            .filter(segment => segment && !segment.startsWith('{'))
            .map(segment => this.segmentToTitle(segment));

        return pathParts.length > 0 ? pathParts.join(' - ') : 'API Endpoint';
    }

    /**
     * Convert path segment to readable title
     */
    static segmentToTitle(segment) {
        return segment
            .split(/[-_]/)
            .map(word => this.capitalize(word))
            .join(' ');
    }

    /**
     * Get the last meaningful segment from a path
     */
    static getLastPathSegment(routePath) {
        if (!routePath || typeof routePath !== 'string') {
            return 'default';
        }

        const segments = routePath
            .split('/')
            .filter(segment => segment && !segment.startsWith('{'));

        return segments.length > 0 ? segments[segments.length - 1] : 'default';
    }

    /**
     * Build API URL with parameter substitution template
     */
    static buildApiUrl(routePath, pathParams = null) {
        if (!routePath) return '/api';

        let apiUrl = `/api${routePath}`;

        // If pathParams provided, use them; otherwise extract from routePath
        const params = pathParams || this.extractPathParameters(routePath);

        // Replace path parameters with template literals
        params.forEach(param => {
            apiUrl = apiUrl.replace(`{${param}}`, `\${${param}}`);
        });

        return apiUrl;
    }

    /**
     * Normalize path separators for cross-platform compatibility
     */
    static normalizePath(filePath) {
        if (!filePath || typeof filePath !== 'string') {
            return '';
        }

        // Convert backslashes to forward slashes
        return filePath.replace(/\\/g, '/');
    }

    /**
     * Check if path contains parameters
     */
    static hasParameters(routePath) {
        return this.extractPathParameters(routePath).length > 0;
    }

    /**
     * Get parameter names and their positions in the path
     */
    static getParameterInfo(routePath) {
        const segments = routePath.split('/').filter(s => s);
        const parameters = [];

        segments.forEach((segment, index) => {
            if (segment.startsWith('{') && segment.endsWith('}')) {
                const paramName = segment.slice(1, -1);
                parameters.push({
                    name: paramName,
                    position: index,
                    segment: segment,
                    isRequired: true // OpenAPI path parameters are always required
                });
            }
        });

        return parameters;
    }

    /**
     * Validate if a route path is suitable for page generation
     */
    static isPageCandidate(routePath) {
        // Skip paths that are clearly API-only
        const apiOnlyPatterns = [
            /\/webhook/i,
            /\/callback/i,
            /\/health/i,
            /\/metrics/i,
            /\/status/i
        ];

        return !apiOnlyPatterns.some(pattern => pattern.test(routePath));
    }

    /**
     * Check if route represents a user-facing feature
     */
    static isUserFacing(routePath) {
        const userFacingPatterns = [
            /\/users?/i,
            /\/profile/i,
            /\/dashboard/i,
            /\/settings/i,
            /\/orders?/i,
            /\/products?/i,
            /\/account/i,
            /\/admin/i
        ];

        return userFacingPatterns.some(pattern => pattern.test(routePath));
    }

    /**
     * Generate breadcrumb structure from path
     */
    static generateBreadcrumbs(routePath) {
        if (!routePath || routePath === '/') {
            return [{label: 'Home', path: '/'}];
        }

        const segments = routePath.split('/').filter(s => s);
        const breadcrumbs = [{label: 'Home', path: '/'}];
        let currentPath = '';

        segments.forEach(segment => {
            currentPath += `/${segment}`;

            // Skip parameter segments in breadcrumbs
            if (!segment.startsWith('{')) {
                breadcrumbs.push({
                    label: this.segmentToTitle(segment),
                    path: currentPath,
                    isParameter: false
                });
            } else {
                const paramName = segment.slice(1, -1);
                breadcrumbs.push({
                    label: `{${paramName}}`,
                    path: currentPath,
                    isParameter: true,
                    parameterName: paramName
                });
            }
        });

        return breadcrumbs;
    }

    /**
     * Helper: Capitalize first letter of a word
     */
    static capitalize(word) {
        if (!word || typeof word !== 'string') return '';
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }

    /**
     * Helper: Check if string is a valid React component name
     */
    static isValidComponentName(name) {
        if (!name || typeof name !== 'string') return false;

        // Must start with uppercase letter, contain only alphanumeric characters
        return /^[A-Z][a-zA-Z0-9]*$/.test(name) && name !== 'Page';
    }

    /**
     * Sanitize filename for cross-platform compatibility
     */
    static sanitizeFilename(filename) {
        if (!filename || typeof filename !== 'string') return 'default';

        // Remove invalid filename characters
        return filename
            .replace(/[<>:"/\\|?*]/g, '') // Windows invalid chars
            .replace(/[\x00-\x1f\x80-\x9f]/g, '') // Control characters
            .replace(/^\.+/, '') // Leading dots
            .replace(/\.+$/, '') // Trailing dots
            .replace(/\s+/g, '-') // Spaces to hyphens
            .toLowerCase();
    }

    /**
     * Check if path represents a RESTful resource
     */
    static isRESTfulResource(routePath) {
        // Common RESTful patterns
        const restPatterns = [
            /^\/\w+$/, // /users
            /^\/\w+\/\{[^}]+\}$/, // /users/{id}
            /^\/\w+\/\{[^}]+\}\/\w+$/, // /users/{id}/posts
            /^\/\w+\/\{[^}]+\}\/\w+\/\{[^}]+\}$/ // /users/{id}/posts/{postId}
        ];

        return restPatterns.some(pattern => pattern.test(routePath));
    }

    /**
     * Extract resource name from RESTful path
     */
    static extractResourceName(routePath) {
        if (!this.isRESTfulResource(routePath)) {
            return null;
        }

        const segments = routePath.split('/').filter(s => s);

        // Return the first non-parameter segment
        for (const segment of segments) {
            if (!segment.startsWith('{')) {
                return segment;
            }
        }

        return null;
    }

    /**
     * Generate file path for API route
     */
    static getApiRouteFilePath(routePath, baseDir) {
        const nextjsPath = this.convertToNextJSPath(routePath);
        return `${baseDir}/api${nextjsPath}/route.ts`;
    }

    /**
     * Generate file path for page component
     */
    static getPageFilePath(routePath, baseDir) {
        const nextjsPath = this.convertToNextJSPath(routePath);
        return `${baseDir}${nextjsPath}/page.tsx`;
    }

    /**
     * Validate multiple paths for conflicts
     */
    static validatePathConflicts(paths) {
        const conflicts = [];
        const normalizedPaths = new Map();

        paths.forEach(path => {
            const nextjsPath = this.convertToNextJSPath(path);

            if (normalizedPaths.has(nextjsPath)) {
                conflicts.push({
                    nextjsPath,
                    originalPaths: [normalizedPaths.get(nextjsPath), path]
                });
            } else {
                normalizedPaths.set(nextjsPath, path);
            }
        });

        return conflicts;
    }

    /**
     * Sort paths by complexity (simple to complex)
     */
    static sortPathsByComplexity(paths) {
        return paths.sort((a, b) => {
            const aParams = this.extractPathParameters(a).length;
            const bParams = this.extractPathParameters(b).length;
            const aSegments = a.split('/').length;
            const bSegments = b.split('/').length;

            // First sort by parameter count, then by segment count
            if (aParams !== bParams) {
                return aParams - bParams;
            }
            return aSegments - bSegments;
        });
    }

    /**
     * Get path depth (number of segments)
     */
    static getPathDepth(routePath) {
        return routePath.split('/').filter(s => s).length;
    }

    /**
     * Check if path is a sub-resource of another path
     */
    static isSubResource(childPath, parentPath) {
        const childSegments = childPath.split('/').filter(s => s);
        const parentSegments = parentPath.split('/').filter(s => s);

        if (childSegments.length <= parentSegments.length) {
            return false;
        }

        // Check if parent segments match the beginning of child segments
        for (let i = 0; i < parentSegments.length; i++) {
            const parentSeg = parentSegments[i];
            const childSeg = childSegments[i];

            // Both are parameters or both are the same literal
            if (parentSeg.startsWith('{') && childSeg.startsWith('{')) {
                continue;
            } else if (parentSeg === childSeg) {
                continue;
            } else {
                return false;
            }
        }

        return true;
    }
}

module.exports = PathUtils;
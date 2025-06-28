/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - AI PROMPT
 * ============================================================================
 * FILE: src/utils/PathUtils.js
 * VERSION: 2025-06-17 21:42:10
 * PHASE: Phase 3: Utility Modules
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 *
 * Create a utility module using ES Module syntax for path and route
 * manipulation between OpenAPI and Next.js conventions. Export individual
 * named functions (not an object) to convert OpenAPI paths like
 * /users/{userId}/posts/{postId} to Next.js routes like
 * /users/[userId]/posts/[postId], extract parameter names from paths,
 * convert paths to file system safe directory structures, group related
 * paths by resource (all /users paths together), determine if a path
 * represents a collection (typically GET without ID) or single resource,
 * generate appropriate file names from paths, handle special characters and
 * edge cases in path conversion, create component-friendly names for
 * DaisyUI page components, and ensure all generated paths are valid for
 * both Next.js routing and file systems. Use export keyword for each
 * function.
 *
 * ============================================================================
 */

/**
 * PathUtils.js - Utility module for path and route manipulation
 * Converts between OpenAPI paths and Next.js routing conventions
 * Uses ES Module named exports as required by generators
 */

/**
 * Convert OpenAPI path to Next.js route format
 * /users/{userId}/posts/{postId} -> /users/[userId]/posts/[postId]
 */
export function pathToRoute(openApiPath) {
    if (!openApiPath) return '';
    return openApiPath.replace(/{([^}]+)}/g, '[$1]');
}

/**
 * Extract parameter names from OpenAPI path
 * /users/{userId}/posts/{postId} -> ['userId', 'postId']
 */
export function extractPathParams(openApiPath) {
    if (!openApiPath) return [];
    const matches = openApiPath.match(/{([^}]+)}/g);
    if (!matches) return [];

    return matches.map(match => match.slice(1, -1));
}

/**
 * Convert OpenAPI path to file system safe directory structure
 * /users/{userId}/posts -> users/[userId]/posts
 */
export function routeToFilePath(openApiPath) {
    if (!openApiPath) return '';

    // Remove leading slash and convert parameters
    const fsPath = openApiPath
        .replace(/^\//, '')
        .replace(/{([^}]+)}/g, '[$1]');

    // Ensure path is file system safe
    return fsPath.replace(/[<>:"|?*]/g, '-');
}

/**
 * Group related paths by resource
 */
export function groupPathsByResource(paths) {
    const grouped = {};

    paths.forEach(path => {
        // Extract base resource (first segment after /)
        const segments = path.split('/').filter(s => s && !s.startsWith('{'));
        const resource = segments[0] || 'root';

        if (!grouped[resource]) {
            grouped[resource] = [];
        }
        grouped[resource].push(path);
    });

    return grouped;
}

/**
 * Determine if a path represents a collection or single resource
 */
export function isCollectionPath(openApiPath, method) {
    if (!openApiPath) return false;

    const segments = openApiPath.split('/');
    const lastSegment = segments[segments.length - 1];

    // If last segment is a parameter, it's likely a single resource
    if (lastSegment.startsWith('{') && lastSegment.endsWith('}')) {
        return false;
    }

    // POST to a path without trailing ID is typically creating in a collection
    if (method === 'POST' && !lastSegment.startsWith('{')) {
        return true;
    }

    // GET without trailing parameter is typically a collection
    if (method === 'GET' && !lastSegment.startsWith('{')) {
        return true;
    }

    return false;
}

/**
 * Generate appropriate file name from path
 */
export function pathToFileName(openApiPath, method) {
    if (!openApiPath) return 'index';

    // Remove leading slash and parameters
    const cleanPath = openApiPath
        .replace(/^\//, '')
        .replace(/{[^}]+}/g, 'by-param')
        .replace(/\//g, '-');

    // Add method prefix for non-GET operations
    const prefix = method && method !== 'GET' ? `${method.toLowerCase()}-` : '';

    return prefix + (cleanPath || 'root');
}

/**
 * Convert path to component-friendly name for DaisyUI page components
 */
export function pathToComponentName(openApiPath, suffix = '') {
    if (!openApiPath) return 'Component';

    const segments = openApiPath
        .split('/')
        .filter(s => s && !s.startsWith('{'))
        .map(segment => {
            // Convert kebab-case or snake_case to PascalCase
            return segment
                .split(/[-_]/)
                .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                .join('');
        });

    return segments.join('') + suffix;
}

/**
 * Get the resource name from a path
 * /users/{userId}/posts -> posts
 * /users -> users
 */
export function getResourceFromPath(openApiPath) {
    if (!openApiPath) return '';

    const segments = openApiPath.split('/').filter(s => s && !s.startsWith('{'));
    return segments[segments.length - 1] || segments[0] || '';
}

/**
 * Check if path has dynamic segments
 */
export function hasPathParams(openApiPath) {
    return !!(openApiPath && openApiPath.includes('{'));
}

/**
 * Normalize path for consistent processing
 */
export function normalizePath(openApiPath) {
    if (!openApiPath) return '/';

    // Replace multiple slashes with single slash
    let normalized = openApiPath.replace(/\/+/g, '/');

    // Ensure leading slash
    if (!normalized.startsWith('/')) {
        normalized = '/' + normalized;
    }

    // Remove trailing slash unless it's the root
    if (normalized.length > 1 && normalized.endsWith('/')) {
        normalized = normalized.slice(0, -1);
    }

    return normalized;
}

/**
 * Create breadcrumb segments from path
 */
export function pathToSegments(openApiPath) {
    if (!openApiPath) return [];

    return openApiPath
        .split('/')
        .filter(segment => segment.length > 0);
}

/**
 * Build path from segments
 */
export function segmentsToPath(segments) {
    if (!segments || segments.length === 0) return '/';
    return '/' + segments.join('/');
}

/**
 * Replace path parameters with actual values
 */
export function substitutePathParams(openApiPath, params) {
    if (!openApiPath || !params) return openApiPath;

    let result = openApiPath;
    Object.entries(params).forEach(([key, value]) => {
        result = result.replace(`{${key}}`, encodeURIComponent(value));
    });

    return result;
}

/**
 * Convert Next.js route to API endpoint path (for runtime use)
 * /api/users/[userId] -> /api/users/:userId
 */
export function toRuntimePath(nextRoute) {
    if (!nextRoute) return '';
    return nextRoute.replace(/\[([^\]]+)\]/g, ':$1');
}

/**
 * Get parent path
 * /users/{userId}/posts -> /users/{userId}
 */
export function getParentPath(openApiPath) {
    const segments = pathToSegments(openApiPath);
    if (segments.length <= 1) return null;

    return segmentsToPath(segments.slice(0, -1));
}

/**
 * Ensure all generated paths are valid for both Next.js routing and file systems
 */
export function ensureValidPath(path) {
    if (!path) return '';

    // Replace invalid file system characters with dash
    let validPath = path.replace(/[<>:"|?*]/g, '-');

    // Replace multiple slashes with single slash
    validPath = validPath.replace(/\/+/g, '/');

    // Replace multiple dashes with single dash
    validPath = validPath.replace(/-+/g, '-');

    // Only remove trailing dashes if the original path ended with dashes
    // This handles the '/users---' -> '/users' case
    if (path.match(/-+$/)) {
        validPath = validPath.replace(/-+$/, '');
    }

    return validPath;
}
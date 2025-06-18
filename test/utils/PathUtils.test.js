/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - AI PROMPT
 * ============================================================================
 * FILE: test/utils/PathUtils.test.js
 * VERSION: 2025-06-17 21:42:10
 * PHASE: Phase 9: Test Files
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 *
 * Create a test file using Node.js built-in test framework for PathUtils
 * functions. Use ES Module imports to import individual functions. Write
 * tests for OpenAPI to Next.js path conversion, parameter extraction from
 * paths, file system safe path generation, resource grouping logic,
 * collection vs single resource detection, file name generation, component
 * name generation for pages, special character handling, and edge cases in
 * path conversion. Test each exported function individually with various
 * input scenarios.
 *
 * ============================================================================
 */
/**
 * PathUtils.test.js - Unit tests for PathUtils using Node.js test runner
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import PathUtils from '../../src/utils/PathUtils.js';
describe('PathUtils', () => {
    describe('toNextRoute', () => {
        it('should convert OpenAPI paths to Next.js routes', () => {
            assert.equal(PathUtils.toNextRoute('/users/{userId}'), '/users/[userId]');
            assert.equal(PathUtils.toNextRoute('/users/{userId}/posts/{postId}'), '/users/[userId]/posts/[postId]');
            assert.equal(PathUtils.toNextRoute('/users'), '/users');
            assert.equal(PathUtils.toNextRoute('/'), '/');
        });
        it('should handle empty or falsy paths', () => {
            assert.equal(PathUtils.toNextRoute(''), '');
            assert.equal(PathUtils.toNextRoute(null), '');
            assert.equal(PathUtils.toNextRoute(undefined), '');
        });

        it('should handle multiple parameters', () => {
            assert.equal(PathUtils.toNextRoute('/{param1}/{param2}/{param3}'), '/[param1]/[param2]/[param3]');
        });

        it('should handle complex parameter names', () => {
            assert.equal(PathUtils.toNextRoute('/users/{user_id}/items/{item-id}'), '/users/[user_id]/items/[item-id]');
        });
    });

    describe('toFileSystemPath', () => {
        it('should convert OpenAPI paths to file system paths', () => {
            assert.equal(PathUtils.toFileSystemPath('/users/{userId}'), 'users/[userId]');
            assert.equal(PathUtils.toFileSystemPath('/users/{userId}/posts'), 'users/[userId]/posts');
            assert.equal(PathUtils.toFileSystemPath('/users'), 'users');
        });

        it('should remove leading slashes', () => {
            assert.equal(PathUtils.toFileSystemPath('/api/users'), 'api/users');
            assert.equal(PathUtils.toFileSystemPath('//api/users'), '/api/users');
        });

        it('should handle special characters', () => {
            assert.equal(PathUtils.toFileSystemPath('/users<>test'), 'users--test');
            assert.equal(PathUtils.toFileSystemPath('/users:test'), 'users-test');
            assert.equal(PathUtils.toFileSystemPath('/users|test'), 'users-test');
        });

        it('should handle root path', () => {
            assert.equal(PathUtils.toFileSystemPath('/'), '');
        });
    });

    describe('extractParameters', () => {
        it('should extract parameter names from paths', () => {
            assert.deepEqual(PathUtils.extractParameters('/users/{userId}'), ['userId']);
            assert.deepEqual(PathUtils.extractParameters('/users/{userId}/posts/{postId}'), ['userId', 'postId']);
            assert.deepEqual(PathUtils.extractParameters('/users'), []);
        });

        it('should handle empty paths', () => {
            assert.deepEqual(PathUtils.extractParameters(''), []);
            assert.deepEqual(PathUtils.extractParameters(null), []);
        });

        it('should handle complex parameter names', () => {
            assert.deepEqual(PathUtils.extractParameters('/items/{item_id}/sub-items/{sub-item-id}'),
                ['item_id', 'sub-item-id']);
        });
    });

    describe('groupByResource', () => {
        it('should group paths by their base resource', () => {
            const paths = [
                '/users',
                '/users/{userId}',
                '/users/{userId}/posts',
                '/posts',
                '/posts/{postId}',
                '/categories'
            ];

            const grouped = PathUtils.groupByResource(paths);

            assert.deepEqual(grouped.users, ['/users', '/users/{userId}', '/users/{userId}/posts']);
            assert.deepEqual(grouped.posts, ['/posts', '/posts/{postId}']);
            assert.deepEqual(grouped.categories, ['/categories']);
        });

        it('should handle root paths', () => {
            const paths = ['/', '/users'];
            const grouped = PathUtils.groupByResource(paths);

            assert.deepEqual(grouped.root, ['/']);
            assert.deepEqual(grouped.users, ['/users']);
        });

        it('should handle empty array', () => {
            assert.deepEqual(PathUtils.groupByResource([]), {});
        });
    });

    describe('isCollection', () => {
        it('should identify collection endpoints', () => {
            assert.equal(PathUtils.isCollection('/users', 'GET'), true);
            assert.equal(PathUtils.isCollection('/users', 'POST'), true);
            assert.equal(PathUtils.isCollection('/users/{userId}', 'GET'), false);
            assert.equal(PathUtils.isCollection('/users/{userId}', 'PUT'), false);
        });

        it('should handle nested collections', () => {
            assert.equal(PathUtils.isCollection('/users/{userId}/posts', 'GET'), true);
            assert.equal(PathUtils.isCollection('/users/{userId}/posts/{postId}', 'GET'), false);
        });

        it('should handle other HTTP methods', () => {
            assert.equal(PathUtils.isCollection('/users', 'DELETE'), false);
            assert.equal(PathUtils.isCollection('/users', 'PATCH'), false);
        });
    });

    describe('toFileName', () => {
        it('should generate appropriate file names', () => {
            assert.equal(PathUtils.toFileName('/users', 'GET'), 'users');
            assert.equal(PathUtils.toFileName('/users', 'POST'), 'post-users');
            assert.equal(PathUtils.toFileName('/users/{userId}', 'GET'), 'users-by-param');
            assert.equal(PathUtils.toFileName('/users/{userId}', 'DELETE'), 'delete-users-by-param');
        });

        it('should handle nested paths', () => {
            assert.equal(PathUtils.toFileName('/users/{userId}/posts', 'GET'), 'users-by-param-posts');
            assert.equal(PathUtils.toFileName('/users/{userId}/posts/{postId}', 'PUT'),
                'put-users-by-param-posts-by-param');
        });

        it('should handle root path', () => {
            assert.equal(PathUtils.toFileName('/', 'GET'), 'root');
            assert.equal(PathUtils.toFileName('', 'GET'), 'index');
        });
    });

    describe('toRuntimePath', () => {
        it('should convert Next.js routes to runtime paths', () => {
            assert.equal(PathUtils.toRuntimePath('/api/users/[userId]'), '/api/users/:userId');
            assert.equal(PathUtils.toRuntimePath('/api/users/[userId]/posts/[postId]'),
                '/api/users/:userId/posts/:postId');
        });

        it('should handle paths without parameters', () => {
            assert.equal(PathUtils.toRuntimePath('/api/users'), '/api/users');
        });
    });

    describe('getResourceName', () => {
        it('should extract resource name from path', () => {
            assert.equal(PathUtils.getResourceName('/users'), 'users');
            assert.equal(PathUtils.getResourceName('/users/{userId}'), 'users');
            assert.equal(PathUtils.getResourceName('/users/{userId}/posts'), 'posts');
            assert.equal(PathUtils.getResourceName('/users/{userId}/posts/{postId}'), 'posts');
        });

        it('should handle edge cases', () => {
            assert.equal(PathUtils.getResourceName('/'), '');
            assert.equal(PathUtils.getResourceName(''), '');
            assert.equal(PathUtils.getResourceName('/{id}'), '');
        });
    });

    describe('isDynamic', () => {
        it('should identify dynamic paths', () => {
            assert.equal(PathUtils.isDynamic('/users/{userId}'), true);
            assert.equal(PathUtils.isDynamic('/users'), false);
            assert.equal(PathUtils.isDynamic('/users/{userId}/posts/{postId}'), true);
        });

        it('should handle edge cases', () => {
            assert.equal(PathUtils.isDynamic(''), false);
            assert.equal(PathUtils.isDynamic(null), false);
        });
    });

    describe('normalize', () => {
        it('should normalize paths', () => {
            assert.equal(PathUtils.normalize('users'), '/users');
            assert.equal(PathUtils.normalize('/users/'), '/users');
            assert.equal(PathUtils.normalize('//users///posts//'), '/users/posts');
            assert.equal(PathUtils.normalize('/'), '/');
        });

        it('should handle empty paths', () => {
            assert.equal(PathUtils.normalize(''), '/');
            assert.equal(PathUtils.normalize(null), '/');
        });
    });

    describe('toSegments and fromSegments', () => {
        it('should split path into segments', () => {
            assert.deepEqual(PathUtils.toSegments('/users/{userId}/posts'), ['users', '{userId}', 'posts']);
            assert.deepEqual(PathUtils.toSegments('/users'), ['users']);
            assert.deepEqual(PathUtils.toSegments('/'), []);
        });

        it('should build path from segments', () => {
            assert.equal(PathUtils.fromSegments(['users', '{userId}', 'posts']), '/users/{userId}/posts');
            assert.equal(PathUtils.fromSegments(['users']), '/users');
            assert.equal(PathUtils.fromSegments([]), '/');
        });
    });

    describe('getParentPath', () => {
        it('should get parent path', () => {
            assert.equal(PathUtils.getParentPath('/users/{userId}/posts'), '/users/{userId}');
            assert.equal(PathUtils.getParentPath('/users/{userId}'), '/users');
            assert.equal(PathUtils.getParentPath('/users'), null);
            assert.equal(PathUtils.getParentPath('/'), null);
        });
    });

    describe('substituteParams', () => {
        it('should substitute parameters with values', () => {
            assert.equal(
                PathUtils.substituteParams('/users/{userId}/posts/{postId}', { userId: '123', postId: '456' }),
                '/users/123/posts/456'
            );
        });

        it('should handle URL encoding', () => {
            assert.equal(
                PathUtils.substituteParams('/users/{userId}', { userId: 'user@example.com' }),
                '/users/user%40example.com'
            );
        });

        it('should handle missing parameters', () => {
            assert.equal(
                PathUtils.substituteParams('/users/{userId}', {}),
                '/users/{userId}'
            );
        });

        it('should handle null inputs', () => {
            assert.equal(PathUtils.substituteParams(null, { userId: '123' }), null);
            assert.equal(PathUtils.substituteParams('/users/{userId}', null), '/users/{userId}');
        });
    });
});
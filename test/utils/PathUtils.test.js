import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
    pathToRoute,
    extractPathParams,
    routeToFilePath,
    groupPathsByResource,
    isCollectionPath,
    pathToFileName,
    pathToComponentName,
    getResourceFromPath,
    hasPathParams,
    normalizePath,
    pathToSegments,
    segmentsToPath,
    substitutePathParams,
    toRuntimePath,
    getParentPath,
    ensureValidPath
} from '../../src/utils/PathUtils.js';

describe('PathUtils', () => {
    describe('pathToRoute()', () => {
        it('should convert OpenAPI paths to Next.js routes', () => {
            assert.equal(pathToRoute('/users'), '/users');
            assert.equal(pathToRoute('/users/{userId}'), '/users/[userId]');
            assert.equal(pathToRoute('/users/{userId}/posts/{postId}'), '/users/[userId]/posts/[postId]');
        });

        it('should handle empty input', () => {
            assert.equal(pathToRoute(''), '');
            assert.equal(pathToRoute(null), '');
            assert.equal(pathToRoute(undefined), '');
        });

        it('should handle paths with multiple parameters', () => {
            assert.equal(
                pathToRoute('/orgs/{orgId}/teams/{teamId}/members/{memberId}'),
                '/orgs/[orgId]/teams/[teamId]/members/[memberId]'
            );
        });
    });

    describe('extractPathParams()', () => {
        it('should extract parameter names from paths', () => {
            assert.deepEqual(extractPathParams('/users'), []);
            assert.deepEqual(extractPathParams('/users/{userId}'), ['userId']);
            assert.deepEqual(extractPathParams('/users/{userId}/posts/{postId}'), ['userId', 'postId']);
        });

        it('should handle empty input', () => {
            assert.deepEqual(extractPathParams(''), []);
            assert.deepEqual(extractPathParams(null), []);
            assert.deepEqual(extractPathParams(undefined), []);
        });

        it('should handle complex parameter names', () => {
            assert.deepEqual(extractPathParams('/items/{item_id}'), ['item_id']);
            assert.deepEqual(extractPathParams('/resources/{resource-id}'), ['resource-id']);
        });
    });

    describe('routeToFilePath()', () => {
        it('should convert OpenAPI paths to file system safe paths', () => {
            assert.equal(routeToFilePath('/users'), 'users');
            assert.equal(routeToFilePath('/users/{id}'), 'users/[id]');
            assert.equal(routeToFilePath('/api/v1/users'), 'api/v1/users');
        });

        it('should handle special characters', () => {
            assert.equal(routeToFilePath('/user:profiles'), 'user-profiles');
            assert.equal(routeToFilePath('/user|data'), 'user-data');
            assert.equal(routeToFilePath('/user?query'), 'user-query');
        });

        it('should handle empty input', () => {
            assert.equal(routeToFilePath(''), '');
            assert.equal(routeToFilePath(null), '');
        });
    });

    describe('groupPathsByResource()', () => {
        it('should group related paths by resource', () => {
            const paths = [
                '/users',
                '/users/{id}',
                '/users/{id}/posts',
                '/posts',
                '/posts/{id}'
            ];

            const grouped = groupPathsByResource(paths);
            assert.ok(grouped.users);
            assert.ok(grouped.posts);
            assert.equal(grouped.users.length, 3);
            assert.equal(grouped.posts.length, 2);
        });

        it('should handle root-level resources', () => {
            const paths = ['/', '/about', '/contact'];
            const grouped = groupPathsByResource(paths);
            assert.ok(grouped.root);
            assert.ok(grouped.about);
            assert.ok(grouped.contact);
        });

        it('should ignore parameters when grouping', () => {
            const paths = ['/items/{itemId}', '/items/{itemId}/details'];
            const grouped = groupPathsByResource(paths);
            assert.ok(grouped.items);
            assert.equal(grouped.items.length, 2);
        });
    });

    describe('isCollectionPath()', () => {
        it('should identify collection paths for GET', () => {
            assert.equal(isCollectionPath('/users', 'GET'), true);
            assert.equal(isCollectionPath('/users/{id}', 'GET'), false);
            assert.equal(isCollectionPath('/users/{id}/posts', 'GET'), true);
        });

        it('should identify collection paths for POST', () => {
            assert.equal(isCollectionPath('/users', 'POST'), true);
            assert.equal(isCollectionPath('/users/{id}', 'POST'), false);
        });

        it('should handle other methods', () => {
            assert.equal(isCollectionPath('/users', 'PUT'), false);
            assert.equal(isCollectionPath('/users', 'DELETE'), false);
        });

        it('should handle empty input', () => {
            assert.equal(isCollectionPath('', 'GET'), false);
            assert.equal(isCollectionPath(null, 'GET'), false);
        });
    });

    describe('pathToFileName()', () => {
        it('should generate appropriate file names', () => {
            assert.equal(pathToFileName('/users', 'GET'), 'users');
            assert.equal(pathToFileName('/users', 'POST'), 'post-users');
            assert.equal(pathToFileName('/users/{id}', 'GET'), 'users-by-param');
            assert.equal(pathToFileName('/users/{id}', 'PUT'), 'put-users-by-param');
        });

        it('should handle root path', () => {
            assert.equal(pathToFileName('/', 'GET'), 'root');
            assert.equal(pathToFileName('', 'GET'), 'index');
        });

        it('should handle nested paths', () => {
            assert.equal(pathToFileName('/api/v1/users', 'GET'), 'api-v1-users');
            assert.equal(pathToFileName('/users/{id}/posts/{postId}', 'GET'), 'users-by-param-posts-by-param');
        });
    });

    describe('pathToComponentName()', () => {
        it('should create component-friendly names', () => {
            assert.equal(pathToComponentName('/users'), 'Users');
            assert.equal(pathToComponentName('/users', 'Page'), 'UsersPage');
            assert.equal(pathToComponentName('/user-profiles'), 'UserProfiles');
            assert.equal(pathToComponentName('/api/v1/users'), 'ApiV1Users');
        });

        it('should handle empty input', () => {
            assert.equal(pathToComponentName(''), 'Component');
            assert.equal(pathToComponentName(null), 'Component');
        });

        it('should filter out parameters', () => {
            assert.equal(pathToComponentName('/users/{id}/posts'), 'UsersPosts');
        });
    });

    describe('getResourceFromPath()', () => {
        it('should extract resource name from path', () => {
            assert.equal(getResourceFromPath('/users'), 'users');
            assert.equal(getResourceFromPath('/users/{id}'), 'users');
            assert.equal(getResourceFromPath('/users/{id}/posts'), 'posts');
        });

        it('should handle empty input', () => {
            assert.equal(getResourceFromPath(''), '');
            assert.equal(getResourceFromPath(null), '');
        });

        it('should handle root path', () => {
            assert.equal(getResourceFromPath('/'), '');
        });
    });

    describe('hasPathParams()', () => {
        it('should detect dynamic segments', () => {
            assert.equal(hasPathParams('/users/{id}'), true);
            assert.equal(hasPathParams('/users'), false);
            assert.equal(hasPathParams('/users/{id}/posts/{postId}'), true);
        });

        it('should handle empty input', () => {
            assert.equal(hasPathParams(''), false);
            assert.equal(hasPathParams(null), false);
        });
    });

    describe('normalizePath()', () => {
        it('should normalize paths consistently', () => {
            assert.equal(normalizePath('/users'), '/users');
            assert.equal(normalizePath('users'), '/users');
            assert.equal(normalizePath('/users/'), '/users');
            assert.equal(normalizePath('//users//'), '/users');
        });

        it('should handle root path', () => {
            assert.equal(normalizePath('/'), '/');
            assert.equal(normalizePath(''), '/');
        });

        it('should preserve single slash for root', () => {
            assert.equal(normalizePath('///'), '/');
        });
    });

    describe('pathToSegments()', () => {
        it('should split path into segments', () => {
            assert.deepEqual(pathToSegments('/users/posts'), ['users', 'posts']);
            assert.deepEqual(pathToSegments('/api/v1/users'), ['api', 'v1', 'users']);
        });

        it('should handle empty paths', () => {
            assert.deepEqual(pathToSegments(''), []);
            assert.deepEqual(pathToSegments('/'), []);
        });

        it('should handle parameters', () => {
            assert.deepEqual(pathToSegments('/users/{id}/posts'), ['users', '{id}', 'posts']);
        });
    });

    describe('segmentsToPath()', () => {
        it('should build path from segments', () => {
            assert.equal(segmentsToPath(['users', 'posts']), '/users/posts');
            assert.equal(segmentsToPath(['api', 'v1', 'users']), '/api/v1/users');
        });

        it('should handle empty segments', () => {
            assert.equal(segmentsToPath([]), '/');
            assert.equal(segmentsToPath(null), '/');
        });
    });

    describe('substitutePathParams()', () => {
        it('should replace path parameters with values', () => {
            assert.equal(
                substitutePathParams('/users/{userId}', { userId: '123' }),
                '/users/123'
            );
            assert.equal(
                substitutePathParams('/users/{userId}/posts/{postId}', { userId: '123', postId: '456' }),
                '/users/123/posts/456'
            );
        });

        it('should encode parameter values', () => {
            assert.equal(
                substitutePathParams('/users/{email}', { email: 'user@example.com' }),
                '/users/user%40example.com'
            );
        });

        it('should handle missing parameters', () => {
            assert.equal(
                substitutePathParams('/users/{userId}', {}),
                '/users/{userId}'
            );
        });

        it('should handle null input', () => {
            assert.equal(substitutePathParams(null, { userId: '123' }), null);
            assert.equal(substitutePathParams('/users/{userId}', null), '/users/{userId}');
        });
    });

    describe('toRuntimePath()', () => {
        it('should convert Next.js routes to runtime paths', () => {
            assert.equal(toRuntimePath('/api/users/[userId]'), '/api/users/:userId');
            assert.equal(toRuntimePath('/api/[...path]'), '/api/:...path');
        });

        it('should handle multiple parameters', () => {
            assert.equal(
                toRuntimePath('/api/users/[userId]/posts/[postId]'),
                '/api/users/:userId/posts/:postId'
            );
        });

        it('should handle empty input', () => {
            assert.equal(toRuntimePath(''), '');
            assert.equal(toRuntimePath(null), '');
        });
    });

    describe('getParentPath()', () => {
        it('should get parent path', () => {
            assert.equal(getParentPath('/users/{userId}/posts'), '/users/{userId}');
            assert.equal(getParentPath('/users/{userId}'), '/users');
            assert.equal(getParentPath('/users'), null);
        });

        it('should handle root path', () => {
            assert.equal(getParentPath('/'), null);
        });

        it('should handle complex paths', () => {
            assert.equal(
                getParentPath('/api/v1/users/{id}/posts/{postId}'),
                '/api/v1/users/{id}/posts'
            );
        });
    });

    describe('ensureValidPath()', () => {
        it('should make paths file system safe', () => {
            assert.equal(ensureValidPath('/users/<script>'), '/users/-script-');
            assert.equal(ensureValidPath('/users:data'), '/users-data');
            assert.equal(ensureValidPath('/users|posts'), '/users-posts');
        });

        it('should handle multiple invalid characters', () => {
            assert.equal(ensureValidPath('/users???///posts***'), '/users-/posts-');
        });

        it('should remove trailing dashes', () => {
            assert.equal(ensureValidPath('/users---'), '/users');
        });

        it('should handle empty input', () => {
            assert.equal(ensureValidPath(''), '');
            assert.equal(ensureValidPath(null), '');
        });
    });
});
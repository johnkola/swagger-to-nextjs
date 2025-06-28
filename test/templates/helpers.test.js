/**
 * helpers.test.js - Unit tests for Handlebars helper functions
 * Tests all helper functions used in template generation
 */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as helpers from '../../src/templates/helpers.js';

describe('Handlebars Helpers', () => {
    describe('Case Conversion Helpers', () => {
        describe('pascalCase', () => {
            it('should convert kebab-case to PascalCase', () => {
                assert.equal(helpers.pascalCase('user-profile'), 'UserProfile');
                assert.equal(helpers.pascalCase('api-response'), 'ApiResponse');
            });

            it('should convert snake_case to PascalCase', () => {
                assert.equal(helpers.pascalCase('user_profile'), 'UserProfile');
                assert.equal(helpers.pascalCase('api_response'), 'ApiResponse');
            });

            it('should handle camelCase input', () => {
                assert.equal(helpers.pascalCase('userProfile'), 'UserProfile');
                assert.equal(helpers.pascalCase('apiResponse'), 'ApiResponse');
            });

            it('should handle empty strings', () => {
                assert.equal(helpers.pascalCase(''), '');
                assert.equal(helpers.pascalCase(null), '');
                assert.equal(helpers.pascalCase(undefined), '');
            });
        });

        describe('camelCase', () => {
            it('should convert kebab-case to camelCase', () => {
                assert.equal(helpers.camelCase('user-profile'), 'userProfile');
                assert.equal(helpers.camelCase('api-response'), 'apiResponse');
            });

            it('should convert snake_case to camelCase', () => {
                assert.equal(helpers.camelCase('user_profile'), 'userProfile');
                assert.equal(helpers.camelCase('api_response'), 'apiResponse');
            });

            it('should handle PascalCase input', () => {
                assert.equal(helpers.camelCase('UserProfile'), 'userProfile');
                assert.equal(helpers.camelCase('APIResponse'), 'apiresponse');
            });
        });

        describe('kebabCase', () => {
            it('should convert PascalCase to kebab-case', () => {
                assert.equal(helpers.kebabCase('UserProfile'), 'user-profile');
                assert.equal(helpers.kebabCase('APIResponse'), 'a-p-i-response');
            });

            it('should convert camelCase to kebab-case', () => {
                assert.equal(helpers.kebabCase('userProfile'), 'user-profile');
                assert.equal(helpers.kebabCase('apiResponse'), 'api-response');
            });

            it('should handle snake_case', () => {
                assert.equal(helpers.kebabCase('user_profile'), 'user-profile');
            });
        });

        describe('upperCase', () => {
            it('should convert to UPPER_CASE', () => {
                assert.equal(helpers.upperCase('userProfile'), 'USER_PROFILE');
                assert.equal(helpers.upperCase('user-profile'), 'USER_PROFILE');
                assert.equal(helpers.upperCase('user_profile'), 'USER_PROFILE');
            });
        });
    });

    describe('Type Generation Helpers', () => {
        describe('typeString', () => {
            it('should convert basic types', () => {
                assert.equal(helpers.typeString({ type: 'string' }), 'string');
                assert.equal(helpers.typeString({ type: 'number' }), 'number');
                assert.equal(helpers.typeString({ type: 'boolean' }), 'boolean');
                assert.equal(helpers.typeString({ type: 'integer' }), 'number');
            });

            it('should handle arrays', () => {
                assert.equal(helpers.typeString({ type: 'array', items: { type: 'string' } }), 'string[]');
                assert.equal(helpers.typeString({ type: 'array', items: { type: 'number' } }), 'number[]');
            });

            it('should handle enums', () => {
                const schema = { type: 'string', enum: ['active', 'inactive'] };
                assert.equal(helpers.typeString(schema), "'active' | 'inactive'");
            });

            it('should handle references', () => {
                assert.equal(helpers.typeString({ $ref: '#/components/schemas/User' }), 'User');
            });
        });

        describe('isRequired', () => {
            it('should check if property is required', () => {
                const required = ['name', 'email'];
                assert.equal(helpers.isRequired('name', required), true);
                assert.equal(helpers.isRequired('email', required), true);
                assert.equal(helpers.isRequired('phone', required), false);
            });

            it('should handle missing required array', () => {
                assert.equal(helpers.isRequired('name', null), false);
                assert.equal(helpers.isRequired('name', undefined), false);
                assert.equal(helpers.isRequired('name', []), false);
            });
        });

        describe('isNullable', () => {
            it('should check nullable property', () => {
                assert.equal(helpers.isNullable({ nullable: true }), true);
                assert.equal(helpers.isNullable({ nullable: false }), false);
                assert.equal(helpers.isNullable({}), false);
                assert.equal(helpers.isNullable(null), false);
            });
        });
    });

    describe('Path Helpers', () => {
        describe('pathToRoute', () => {
            it('should convert OpenAPI paths to Next.js routes', () => {
                assert.equal(helpers.pathToRoute('/users/{userId}'), '/users/[userId]');
                assert.equal(helpers.pathToRoute('/users/{userId}/posts/{postId}'), '/users/[userId]/posts/[postId]');
                assert.equal(helpers.pathToRoute('/users'), '/users');
            });

            it('should handle empty paths', () => {
                assert.equal(helpers.pathToRoute(''), '');
                assert.equal(helpers.pathToRoute(null), '');
            });
        });

        describe('extractPathParams', () => {
            it('should extract parameter names', () => {
                assert.deepEqual(helpers.extractPathParams('/users/{userId}'), ['userId']);
                assert.deepEqual(helpers.extractPathParams('/users/{userId}/posts/{postId}'), ['userId', 'postId']);
                assert.deepEqual(helpers.extractPathParams('/users'), []);
            });

            it('should handle empty paths', () => {
                assert.deepEqual(helpers.extractPathParams(''), []);
                assert.deepEqual(helpers.extractPathParams(null), []);
            });
        });

        describe('routeToFilePath', () => {
            it('should remove leading slash', () => {
                assert.equal(helpers.routeToFilePath('/users/[userId]'), 'users/[userId]');
                assert.equal(helpers.routeToFilePath('/api/posts'), 'api/posts');
                assert.equal(helpers.routeToFilePath('users'), 'users');
            });
        });
    });

    describe('Operation Helpers', () => {
        describe('hasBody', () => {
            it('should check for request body', () => {
                assert.equal(helpers.hasBody({ requestBody: { content: { 'application/json': {} } } }), true);
                assert.equal(helpers.hasBody({ requestBody: {} }), false);
                assert.equal(helpers.hasBody({}), false);
                assert.equal(helpers.hasBody(null), false);
            });
        });

        describe('hasFormFields', () => {
            it('should detect form fields in schema', () => {
                const schema = {
                    properties: {
                        name: { type: 'string' },
                        email: { type: 'string' }
                    }
                };
                assert.equal(helpers.hasFormFields(schema), true);
            });

            it('should ignore readonly fields', () => {
                const schema = {
                    properties: {
                        id: { type: 'string', readOnly: true },
                        createdAt: { type: 'string' }
                    }
                };
                assert.equal(helpers.hasFormFields(schema), false);
            });

            it('should ignore hidden fields', () => {
                const schema = {
                    properties: {
                        name: { type: 'string', 'x-ui-hidden': true }
                    }
                };
                assert.equal(helpers.hasFormFields(schema), false);
            });

            it('should handle missing properties', () => {
                assert.equal(helpers.hasFormFields({}), false);
                assert.equal(helpers.hasFormFields(null), false);
            });
        });

        describe('getSuccessStatus', () => {
            it('should return success status code', () => {
                assert.equal(helpers.getSuccessStatus({ '200': {}, '400': {} }), '200');
                assert.equal(helpers.getSuccessStatus({ '201': {}, '400': {} }), '201');
                assert.equal(helpers.getSuccessStatus({ '204': {}, '500': {} }), '204');
            });

            it('should handle missing 2xx status', () => {
                assert.equal(helpers.getSuccessStatus({ '400': {}, '500': {} }), '200');
                assert.equal(helpers.getSuccessStatus({}), '200');
                assert.equal(helpers.getSuccessStatus(null), '200');
            });
        });
    });

    describe('DaisyUI Helpers', () => {
        describe('daisyInputType', () => {
            it('should return appropriate input types', () => {
                const textInput = helpers.daisyInputType({ type: 'string' });
                assert.equal(textInput.component, 'text');
                assert.ok(textInput.class.includes('input-bordered'));

                const checkbox = helpers.daisyInputType({ type: 'boolean' });
                assert.equal(checkbox.component, 'checkbox');
                assert.equal(checkbox.class, 'checkbox');

                const select = helpers.daisyInputType({ enum: ['a', 'b', 'c', 'd', 'e'] });
                assert.equal(select.component, 'select');
                assert.ok(select.class.includes('select-bordered'));
            });

            it('should handle textarea for large text', () => {
                const textarea = helpers.daisyInputType({ type: 'string', maxLength: 500 });
                assert.equal(textarea.component, 'textarea');
                assert.ok(textarea.class.includes('textarea-bordered'));
            });

            it('should handle field name hints', () => {
                const textarea = helpers.daisyInputType({ type: 'string' }, 'description');
                assert.equal(textarea.component, 'textarea');
            });
        });

        describe('daisyButtonVariant', () => {
            it('should return button variants by method', () => {
                assert.equal(helpers.daisyButtonVariant({}, 'POST'), 'success');
                assert.equal(helpers.daisyButtonVariant({}, 'DELETE'), 'error');
                assert.equal(helpers.daisyButtonVariant({}, 'PUT'), 'warning');
                assert.equal(helpers.daisyButtonVariant({}, 'GET'), 'primary');
            });

            it('should respect explicit variant', () => {
                assert.equal(helpers.daisyButtonVariant({ 'x-ui-button-variant': 'ghost' }, 'POST'), 'ghost');
            });

            it('should detect variant from operationId', () => {
                assert.equal(helpers.daisyButtonVariant({ operationId: 'createUser' }, 'GET'), 'success');
                assert.equal(helpers.daisyButtonVariant({ operationId: 'deleteUser' }, 'GET'), 'error');
                assert.equal(helpers.daisyButtonVariant({ operationId: 'updateUser' }, 'GET'), 'warning');
            });
        });

        describe('daisyAlertType', () => {
            it('should map error types to alert classes', () => {
                assert.equal(helpers.daisyAlertType('error'), 'alert-error');
                assert.equal(helpers.daisyAlertType('warning'), 'alert-warning');
                assert.equal(helpers.daisyAlertType('info'), 'alert-info');
                assert.equal(helpers.daisyAlertType('success'), 'alert-success');
            });

            it('should default to error', () => {
                assert.equal(helpers.daisyAlertType('unknown'), 'alert-error');
                assert.equal(helpers.daisyAlertType(null), 'alert-error');
            });
        });

        describe('daisyTableClass', () => {
            it('should generate table classes', () => {
                assert.equal(helpers.daisyTableClass(), 'table table-zebra');
                assert.equal(helpers.daisyTableClass({ zebra: false }), 'table');
                assert.equal(helpers.daisyTableClass({ hover: true, compact: true }), 'table table-zebra hover table-compact');
            });
        });

        describe('formControlClass', () => {
            it('should generate form control classes', () => {
                assert.equal(helpers.formControlClass(), 'form-control');
                assert.equal(helpers.formControlClass('name', { name: 'Required' }, { name: true }), 'form-control has-error');
                assert.equal(helpers.formControlClass('name', { name: 'Required' }, {}), 'form-control');
            });
        });

        describe('badgeColor', () => {
            it('should return badge colors', () => {
                assert.equal(helpers.badgeColor('active'), 'success');
                assert.equal(helpers.badgeColor('pending'), 'warning');
                assert.equal(helpers.badgeColor('error'), 'error');
            });

            it('should use schema color mapping', () => {
                const schema = { 'x-ui-colors': { 'custom': 'primary' } };
                assert.equal(helpers.badgeColor('custom', schema), 'primary');
            });
        });
    });

    describe('Utility Helpers', () => {
        describe('jsonStringify', () => {
            it('should stringify objects', () => {
                assert.equal(helpers.jsonStringify({ a: 1 }), '{\n  "a": 1\n}');
                assert.equal(helpers.jsonStringify({ a: 1 }, 0), '{"a":1}');
            });

            it('should handle errors', () => {
                const circular = {};
                circular.ref = circular;
                assert.equal(helpers.jsonStringify(circular), '{}');
            });
        });

        describe('isLargeTextField', () => {
            it('should detect large text fields', () => {
                assert.equal(helpers.isLargeTextField({ type: 'string', maxLength: 500 }), true);
                assert.equal(helpers.isLargeTextField({ type: 'string', maxLength: 100 }), false);
            });

            it('should check field names', () => {
                assert.equal(helpers.isLargeTextField({ type: 'string' }, 'description'), true);
                assert.equal(helpers.isLargeTextField({ type: 'string' }, 'name'), false);
            });

            it('should handle non-string types', () => {
                assert.equal(helpers.isLargeTextField({ type: 'number' }, 'description'), false);
            });
        });

        describe('methodColor', () => {
            it('should return method badge colors', () => {
                assert.equal(helpers.methodColor('get'), 'badge-primary');
                assert.equal(helpers.methodColor('post'), 'badge-success');
                assert.equal(helpers.methodColor('delete'), 'badge-error');
                assert.equal(helpers.methodColor('unknown'), 'badge-neutral');
            });
        });

        describe('daisyLoading', () => {
            it('should generate loading classes', () => {
                assert.equal(helpers.daisyLoading(), 'loading loading-spinner');
                assert.equal(helpers.daisyLoading('dots'), 'loading loading-dots');
                assert.equal(helpers.daisyLoading('spinner', 'lg'), 'loading loading-spinner loading-lg');
            });
        });

        describe('daisySkeleton', () => {
            it('should generate skeleton classes', () => {
                assert.equal(helpers.daisySkeleton(), 'skeleton h-4 w-full');
                assert.equal(helpers.daisySkeleton('title'), 'skeleton h-8 w-3/4');
                assert.equal(helpers.daisySkeleton('avatar'), 'skeleton h-12 w-12 rounded-full');
            });

            it('should handle custom dimensions', () => {
                assert.equal(helpers.daisySkeleton('text', { width: 'w-1/2', height: 'h-6' }), 'skeleton h-4 w-full w-1/2 h-6');
            });
        });

        describe('hasTooltip', () => {
            it('should detect tooltip requirements', () => {
                assert.equal(helpers.hasTooltip({ description: 'Help text' }), true);
                assert.equal(helpers.hasTooltip({ example: 'test@example.com' }), true);
                assert.equal(helpers.hasTooltip({ pattern: '^[a-z]+$' }), true);
                assert.equal(helpers.hasTooltip({}), false);
            });
        });

        describe('tooltipContent', () => {
            it('should generate tooltip content', () => {
                const schema = {
                    description: 'User email',
                    example: 'user@example.com',
                    pattern: '^[\\w]+@[\\w]+\\.[\\w]+$'
                };
                const content = helpers.tooltipContent(schema);
                assert.ok(content.includes('User email'));
                assert.ok(content.includes('Example:'));
                assert.ok(content.includes('Pattern:'));
            });

            it('should handle min/max values', () => {
                const schema = { minimum: 0, maximum: 100 };
                const content = helpers.tooltipContent(schema);
                assert.ok(content.includes('Min: 0'));
                assert.ok(content.includes('Max: 100'));
            });
        });

        describe('isListOperation', () => {
            it('should detect list operations', () => {
                const listOp = {
                    method: 'GET',
                    responses: {
                        '200': {
                            content: {
                                'application/json': {
                                    schema: { type: 'array' }
                                }
                            }
                        }
                    }
                };
                assert.equal(helpers.isListOperation(listOp, '/users'), true);
                assert.equal(helpers.isListOperation(listOp, '/users/{id}'), false);
            });

            it('should handle non-GET methods', () => {
                const postOp = { method: 'POST', responses: {} };
                assert.equal(helpers.isListOperation(postOp, '/users'), false);
            });
        });

        describe('generateBreadcrumbs', () => {
            it('should generate breadcrumb items', () => {
                const breadcrumbs = helpers.generateBreadcrumbs('/users/profile/settings');
                assert.equal(breadcrumbs.length, 4);
                assert.equal(breadcrumbs[0].label, 'Home');
                assert.equal(breadcrumbs[1].label, 'Users');
                assert.equal(breadcrumbs[2].label, 'Profile');
                assert.equal(breadcrumbs[3].label, 'Settings');
            });

            it('should skip parameter segments', () => {
                const breadcrumbs = helpers.generateBreadcrumbs('/users/[userId]/posts');
                assert.equal(breadcrumbs.length, 3);
                assert.equal(breadcrumbs[1].label, 'Users');
                assert.equal(breadcrumbs[2].label, 'Posts');
            });
        });

        describe('needsConfirmation', () => {
            it('should detect operations needing confirmation', () => {
                assert.equal(helpers.needsConfirmation({ method: 'DELETE' }), true);
                assert.equal(helpers.needsConfirmation({ 'x-ui-confirm': true }), true);
                assert.equal(helpers.needsConfirmation({ operationId: 'deleteUser' }), true);
                assert.equal(helpers.needsConfirmation({ operationId: 'getUser' }), false);
            });
        });

        describe('getOperationIcon', () => {
            it('should return operation icons', () => {
                assert.equal(helpers.getOperationIcon({ 'x-ui-icon': 'CustomIcon' }), 'CustomIcon');
                assert.equal(helpers.getOperationIcon({ operationId: 'createUser' }), 'Plus');
                assert.equal(helpers.getOperationIcon({ operationId: 'deleteUser' }), 'Trash2');
                assert.equal(helpers.getOperationIcon({}, 'GET'), 'Eye');
                assert.equal(helpers.getOperationIcon({}, 'POST'), 'Plus');
            });
        });
    });
});
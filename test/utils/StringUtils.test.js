/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - AI PROMPT
 * ============================================================================
 * FILE: test/utils/StringUtils.test.js
 * VERSION: 2025-06-17 16:21:39
 * PHASE: Phase 9: Test Files
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 *
 * Create a test file using Node.js built-in test framework for StringUtils
 * functions. Use ES Module imports to test each string manipulation
 * function. Write tests for toPascalCase with various inputs, toCamelCase
 * conversions, toKebabCase formatting, toSnakeCase handling, toUpperCase
 * for constants, pluralization and singularization, acronym preservation,
 * special character handling, human-readable label generation, DaisyUI
 * class name generation, edge cases like empty strings, and mixed format
 * inputs. Ensure comprehensive coverage of all string utilities.
 *
 * ============================================================================
 */
/**
 * StringUtils.test.js - Unit tests for StringUtils using Node.js test runner
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import StringUtils from '../../src/utils/StringUtils.js';

describe('StringUtils', () => {
    describe('toPascalCase', () => {
        it('should convert various formats to PascalCase', () => {
            assert.equal(StringUtils.toPascalCase('user-profile'), 'UserProfile');
            assert.equal(StringUtils.toPascalCase('user_profile'), 'UserProfile');
            assert.equal(StringUtils.toPascalCase('userProfile'), 'UserProfile');
            assert.equal(StringUtils.toPascalCase('UserProfile'), 'UserProfile');
            assert.equal(StringUtils.toPascalCase('user profile'), 'UserProfile');
        });

        it('should handle acronyms correctly', () => {
            assert.equal(StringUtils.toPascalCase('API'), 'API');
            assert.equal(StringUtils.toPascalCase('api-key'), 'APIKey');
            assert.equal(StringUtils.toPascalCase('XMLHttpRequest'), 'XMLHttpRequest');
            assert.equal(StringUtils.toPascalCase('xml_http_request'), 'XMLHttpRequest');
        });

        it('should handle edge cases', () => {
            assert.equal(StringUtils.toPascalCase(''), '');
            assert.equal(StringUtils.toPascalCase(null), '');
            assert.equal(StringUtils.toPascalCase('a'), 'A');
            assert.equal(StringUtils.toPascalCase('123'), '123');
            assert.equal(StringUtils.toPascalCase('user123profile'), 'User123Profile');
        });

        it('should handle multiple delimiters', () => {
            assert.equal(StringUtils.toPascalCase('user--profile__test'), 'UserProfileTest');
            assert.equal(StringUtils.toPascalCase('user - profile _ test'), 'UserProfileTest');
        });
    });

    describe('toCamelCase', () => {
        it('should convert various formats to camelCase', () => {
            assert.equal(StringUtils.toCamelCase('user-profile'), 'userProfile');
            assert.equal(StringUtils.toCamelCase('UserProfile'), 'userProfile');
            assert.equal(StringUtils.toCamelCase('USER_PROFILE'), 'userProfile');
            assert.equal(StringUtils.toCamelCase('user profile'), 'userProfile');
        });

        it('should handle acronyms at the start', () => {
            assert.equal(StringUtils.toCamelCase('API'), 'api');
            assert.equal(StringUtils.toCamelCase('APIKey'), 'apiKey');
            assert.equal(StringUtils.toCamelCase('XMLHttpRequest'), 'xmlHttpRequest');
            assert.equal(StringUtils.toCamelCase('IOError'), 'ioError');
        });

        it('should handle edge cases', () => {
            assert.equal(StringUtils.toCamelCase(''), '');
            assert.equal(StringUtils.toCamelCase('a'), 'a');
            assert.equal(StringUtils.toCamelCase('A'), 'a');
        });
    });

    describe('toKebabCase', () => {
        it('should convert various formats to kebab-case', () => {
            assert.equal(StringUtils.toKebabCase('UserProfile'), 'user-profile');
            assert.equal(StringUtils.toKebabCase('userProfile'), 'user-profile');
            assert.equal(StringUtils.toKebabCase('USER_PROFILE'), 'user-profile');
            assert.equal(StringUtils.toKebabCase('user profile'), 'user-profile');
        });

        it('should handle acronyms', () => {
            assert.equal(StringUtils.toKebabCase('XMLHttpRequest'), 'xml-http-request');
            assert.equal(StringUtils.toKebabCase('APIKey'), 'api-key');
        });

        it('should handle consecutive delimiters', () => {
            assert.equal(StringUtils.toKebabCase('user__profile'), 'user-profile');
            assert.equal(StringUtils.toKebabCase('user--profile'), 'user-profile');
            assert.equal(StringUtils.toKebabCase('--user-profile--'), 'user-profile');
        });

        it('should handle edge cases', () => {
            assert.equal(StringUtils.toKebabCase(''), '');
            assert.equal(StringUtils.toKebabCase('a'), 'a');
        });
    });

    describe('toSnakeCase', () => {
        it('should convert various formats to snake_case', () => {
            assert.equal(StringUtils.toSnakeCase('UserProfile'), 'user_profile');
            assert.equal(StringUtils.toSnakeCase('userProfile'), 'user_profile');
            assert.equal(StringUtils.toSnakeCase('user-profile'), 'user_profile');
            assert.equal(StringUtils.toSnakeCase('user profile'), 'user_profile');
        });

        it('should handle acronyms', () => {
            assert.equal(StringUtils.toSnakeCase('XMLHttpRequest'), 'xml_http_request');
            assert.equal(StringUtils.toSnakeCase('APIKey'), 'api_key');
        });

        it('should handle edge cases', () => {
            assert.equal(StringUtils.toSnakeCase(''), '');
            assert.equal(StringUtils.toSnakeCase('_user_profile_'), 'user_profile');
        });
    });

    describe('toUpperCase', () => {
        it('should convert to UPPER_CASE constants', () => {
            assert.equal(StringUtils.toUpperCase('userId'), 'USER_ID');
            assert.equal(StringUtils.toUpperCase('user-id'), 'USER_ID');
            assert.equal(StringUtils.toUpperCase('UserID'), 'USER_ID');
        });

        it('should handle edge cases', () => {
            assert.equal(StringUtils.toUpperCase(''), '');
            assert.equal(StringUtils.toUpperCase('a'), 'A');
        });
    });

    describe('pluralize', () => {
        it('should handle regular plurals', () => {
            assert.equal(StringUtils.pluralize('user'), 'users');
            assert.equal(StringUtils.pluralize('post'), 'posts');
            assert.equal(StringUtils.pluralize('comment'), 'comments');
        });

        it('should handle irregular plurals', () => {
            assert.equal(StringUtils.pluralize('person'), 'people');
            assert.equal(StringUtils.pluralize('child'), 'children');
            assert.equal(StringUtils.pluralize('mouse'), 'mice');
            assert.equal(StringUtils.pluralize('man'), 'men');
        });

        it('should handle special endings', () => {
            assert.equal(StringUtils.pluralize('class'), 'classes');
            assert.equal(StringUtils.pluralize('box'), 'boxes');
            assert.equal(StringUtils.pluralize('church'), 'churches');
            assert.equal(StringUtils.pluralize('city'), 'cities');
            assert.equal(StringUtils.pluralize('company'), 'companies');
            assert.equal(StringUtils.pluralize('hero'), 'heroes');
            assert.equal(StringUtils.pluralize('leaf'), 'leaves');
            assert.equal(StringUtils.pluralize('life'), 'lives');
        });

        it('should preserve casing', () => {
            assert.equal(StringUtils.pluralize('Person'), 'People');
            assert.equal(StringUtils.pluralize('Class'), 'Classes');
        });

        it('should handle edge cases', () => {
            assert.equal(StringUtils.pluralize(''), '');
            assert.equal(StringUtils.pluralize(null), '');
        });
    });

    describe('singularize', () => {
        it('should handle regular singulars', () => {
            assert.equal(StringUtils.singularize('users'), 'user');
            assert.equal(StringUtils.singularize('posts'), 'post');
            assert.equal(StringUtils.singularize('comments'), 'comment');
        });

        it('should handle irregular singulars', () => {
            assert.equal(StringUtils.singularize('people'), 'person');
            assert.equal(StringUtils.singularize('children'), 'child');
            assert.equal(StringUtils.singularize('mice'), 'mouse');
            assert.equal(StringUtils.singularize('men'), 'man');
        });

        it('should handle special endings', () => {
            assert.equal(StringUtils.singularize('classes'), 'class');
            assert.equal(StringUtils.singularize('boxes'), 'box');
            assert.equal(StringUtils.singularize('churches'), 'church');
            assert.equal(StringUtils.singularize('cities'), 'city');
            assert.equal(StringUtils.singularize('companies'), 'company');
            assert.equal(StringUtils.singularize('heroes'), 'hero');
            assert.equal(StringUtils.singularize('leaves'), 'leaf');
            assert.equal(StringUtils.singularize('lives'), 'life');
        });

        it('should preserve casing', () => {
            assert.equal(StringUtils.singularize('People'), 'Person');
            assert.equal(StringUtils.singularize('Classes'), 'Class');
        });

        it('should handle words that do not change', () => {
            assert.equal(StringUtils.singularize('sheep'), 'sheep');
            assert.equal(StringUtils.singularize('fish'), 'fish');
            assert.equal(StringUtils.singularize('series'), 'series');
        });
    });

    describe('capitalize', () => {
        it('should capitalize first letter', () => {
            assert.equal(StringUtils.capitalize('hello'), 'Hello');
            assert.equal(StringUtils.capitalize('HELLO'), 'HELLO');
            assert.equal(StringUtils.capitalize('123abc'), '123abc');
        });

        it('should handle edge cases', () => {
            assert.equal(StringUtils.capitalize(''), '');
            assert.equal(StringUtils.capitalize('h'), 'H');
            assert.equal(StringUtils.capitalize(null), '');
        });
    });

    describe('toIdentifier', () => {
        it('should create valid JavaScript identifiers', () => {
            assert.equal(StringUtils.toIdentifier('user-profile'), 'user_profile');
            assert.equal(StringUtils.toIdentifier('user.profile'), 'user_profile');
            assert.equal(StringUtils.toIdentifier('123user'), '_123user');
            assert.equal(StringUtils.toIdentifier('user@profile'), 'user_profile');
        });

        it('should handle reserved words', () => {
            assert.equal(StringUtils.toIdentifier('class'), '_class');
            assert.equal(StringUtils.toIdentifier('function'), '_function');
            assert.equal(StringUtils.toIdentifier('return'), '_return');
            assert.equal(StringUtils.toIdentifier('await'), '_await');
        });

        it('should handle edge cases', () => {
            assert.equal(StringUtils.toIdentifier(''), '_');
            assert.equal(StringUtils.toIdentifier('___'), '_');
            assert.equal(StringUtils.toIdentifier('$valid'), '$valid');
            assert.equal(StringUtils.toIdentifier('_valid'), '_valid');
        });

        it('should remove consecutive underscores', () => {
            assert.equal(StringUtils.toIdentifier('user__profile'), 'user_profile');
            assert.equal(StringUtils.toIdentifier('user___profile'), 'user_profile');
        });
    });

    describe('isAcronym', () => {
        it('should identify acronyms', () => {
            assert.equal(StringUtils.isAcronym('API'), true);
            assert.equal(StringUtils.isAcronym('XML'), true);
            assert.equal(StringUtils.isAcronym('IO'), true);
            assert.equal(StringUtils.isAcronym('HTML'), true);
        });

        it('should reject non-acronyms', () => {
            assert.equal(StringUtils.isAcronym('Api'), false);
            assert.equal(StringUtils.isAcronym('TOOLONG'), false);
            assert.equal(StringUtils.isAcronym('A'), false);
            assert.equal(StringUtils.isAcronym(''), false);
            assert.equal(StringUtils.isAcronym('123'), false);
        });
    });

    describe('smartSplit', () => {
        it('should split on various delimiters', () => {
            assert.deepEqual(StringUtils.smartSplit('user-profile'), ['user', 'profile']);
            assert.deepEqual(StringUtils.smartSplit('user_profile'), ['user', 'profile']);
            assert.deepEqual(StringUtils.smartSplit('user profile'), ['user', 'profile']);
        });

        it('should handle camelCase', () => {
            assert.deepEqual(StringUtils.smartSplit('userProfile'), ['user', 'Profile']);
            assert.deepEqual(StringUtils.smartSplit('UserProfile'), ['User', 'Profile']);
        });

        it('should handle acronyms', () => {
            assert.deepEqual(StringUtils.smartSplit('XMLHttpRequest'), ['XML', 'Http', 'Request']);
            assert.deepEqual(StringUtils.smartSplit('APIKey'), ['API', 'Key']);
        });

        it('should handle edge cases', () => {
            assert.deepEqual(StringUtils.smartSplit(''), []);
            assert.deepEqual(StringUtils.smartSplit('single'), ['single']);
        });
    });

    describe('truncate', () => {
        it('should truncate long strings', () => {
            const longString = 'This is a very long string that needs to be truncated';
            assert.equal(StringUtils.truncate(longString, 20), 'This is a very lo...');
            assert.equal(StringUtils.truncate(longString, 10), 'This is...');
        });

        it('should not truncate short strings', () => {
            assert.equal(StringUtils.truncate('Short', 10), 'Short');
            assert.equal(StringUtils.truncate('Exact', 5), 'Exact');
        });

        it('should handle edge cases', () => {
            assert.equal(StringUtils.truncate('', 10), '');
            assert.equal(StringUtils.truncate(null, 10), null);
            assert.equal(StringUtils.truncate('Hi', 2), 'Hi');
        });

        it('should use default max length', () => {
            const longString = 'a'.repeat(60);
            assert.equal(StringUtils.truncate(longString).length, 50);
            assert.equal(StringUtils.truncate(longString).endsWith('...'), true);
        });
    });

    describe('toTitleCase', () => {
        it('should convert to title case', () => {
            assert.equal(StringUtils.toTitleCase('the quick brown fox'), 'The Quick Brown Fox');
            assert.equal(StringUtils.toTitleCase('a tale of two cities'), 'A Tale of Two Cities');
        });

        it('should handle small words correctly', () => {
            assert.equal(StringUtils.toTitleCase('war and peace'), 'War and Peace');
            assert.equal(StringUtils.toTitleCase('the lord of the rings'), 'The Lord of the Rings');
        });

        it('should preserve acronyms', () => {
            assert.equal(StringUtils.toTitleCase('working with API'), 'Working with API');
            assert.equal(StringUtils.toTitleCase('XML and JSON'), 'XML and JSON');
        });

        it('should handle various input formats', () => {
            assert.equal(StringUtils.toTitleCase('user-profile-settings'), 'User Profile Settings');
            assert.equal(StringUtils.toTitleCase('userProfileSettings'), 'User Profile Settings');
        });
    });

    describe('cleanIdentifier', () => {
        it('should clean identifiers', () => {
            assert.equal(StringUtils.cleanIdentifier('User Profile!'), 'user-profile');
            assert.equal(StringUtils.cleanIdentifier('test@#$name'), 'testname');
            assert.equal(StringUtils.cleanIdentifier('hello   world'), 'hello-world');
        });

        it('should handle edge cases', () => {
            assert.equal(StringUtils.cleanIdentifier(''), '');
            assert.equal(StringUtils.cleanIdentifier('!!!'), '');
            assert.equal(StringUtils.cleanIdentifier('valid-name'), 'valid-name');
        });
    });
});
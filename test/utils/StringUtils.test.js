import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
    toPascalCase,
    toCamelCase,
    toKebabCase,
    toSnakeCase,
    toUpperCase,
    pluralize,
    singularize,
    capitalize,
    toIdentifier,
    toDaisyUIClass,
    toDaisyUIComponentClass,
    toHumanReadable,
    toFormLabel,
    toDaisyUISize,
    toDaisyUIVariant,
    preserveAcronyms,
    isEmpty,
    truncate,
    toCSSClass,
    generateButtonClasses,
    generateInputClasses
} from '../../src/utils/StringUtils.js';

describe('StringUtils', () => {
    describe('toPascalCase()', () => {
        it('should convert to PascalCase', () => {
            assert.equal(toPascalCase('user-profile'), 'UserProfile');
            assert.equal(toPascalCase('user_profile'), 'UserProfile');
            assert.equal(toPascalCase('user profile'), 'UserProfile');
            assert.equal(toPascalCase('userProfile'), 'UserProfile');
            assert.equal(toPascalCase('UserProfile'), 'UserProfile');
        });

        it('should handle empty input', () => {
            assert.equal(toPascalCase(''), '');
            assert.equal(toPascalCase(null), '');
            assert.equal(toPascalCase(undefined), '');
        });
    });

    describe('toCamelCase()', () => {
        it('should convert to camelCase', () => {
            assert.equal(toCamelCase('user-profile'), 'userProfile');
            assert.equal(toCamelCase('user_profile'), 'userProfile');
            assert.equal(toCamelCase('user profile'), 'userProfile');
            assert.equal(toCamelCase('UserProfile'), 'userProfile');
        });

        it('should handle single words', () => {
            assert.equal(toCamelCase('user'), 'user');
            assert.equal(toCamelCase('User'), 'user');
        });
    });

    describe('toKebabCase()', () => {
        it('should convert to kebab-case', () => {
            assert.equal(toKebabCase('UserProfile'), 'user-profile');
            assert.equal(toKebabCase('userProfile'), 'user-profile');
            assert.equal(toKebabCase('user_profile'), 'user-profile');
            assert.equal(toKebabCase('user profile'), 'user-profile');
        });

        it('should handle consecutive capitals', () => {
            assert.equal(toKebabCase('APIKey'), 'a-p-i-key');
        });
    });

    describe('toSnakeCase()', () => {
        it('should convert to snake_case', () => {
            assert.equal(toSnakeCase('UserProfile'), 'user_profile');
            assert.equal(toSnakeCase('userProfile'), 'user_profile');
            assert.equal(toSnakeCase('user-profile'), 'user_profile');
            assert.equal(toSnakeCase('user profile'), 'user_profile');
        });
    });

    describe('toUpperCase()', () => {
        it('should convert to UPPER_CASE', () => {
            assert.equal(toUpperCase('userId'), 'USER_ID');
            assert.equal(toUpperCase('user-id'), 'USER_ID');
            assert.equal(toUpperCase('API_KEY'), 'API_KEY');
        });
    });

    describe('pluralize()', () => {
        it('should pluralize regular words', () => {
            assert.equal(pluralize('user'), 'users');
            assert.equal(pluralize('post'), 'posts');
            assert.equal(pluralize('class'), 'classes');
            assert.equal(pluralize('box'), 'boxes');
            assert.equal(pluralize('city'), 'cities');
            assert.equal(pluralize('knife'), 'knives');
        });

        it('should handle irregular plurals', () => {
            assert.equal(pluralize('person'), 'people');
            assert.equal(pluralize('child'), 'children');
            assert.equal(pluralize('man'), 'men');
            assert.equal(pluralize('woman'), 'women');
        });

        it('should maintain capitalization', () => {
            assert.equal(pluralize('Person'), 'People');
            assert.equal(pluralize('User'), 'Users');
        });

        it('should handle empty input', () => {
            assert.equal(pluralize(''), '');
            assert.equal(pluralize(null), '');
        });
    });

    describe('singularize()', () => {
        it('should singularize regular words', () => {
            assert.equal(singularize('users'), 'user');
            assert.equal(singularize('posts'), 'post');
            assert.equal(singularize('classes'), 'class');
            assert.equal(singularize('cities'), 'city');
            assert.equal(singularize('knives'), 'knife');
        });

        it('should handle irregular singulars', () => {
            assert.equal(singularize('people'), 'person');
            assert.equal(singularize('children'), 'child');
            assert.equal(singularize('men'), 'man');
        });

        it('should maintain capitalization', () => {
            assert.equal(singularize('People'), 'Person');
            assert.equal(singularize('Users'), 'User');
        });
    });

    describe('capitalize()', () => {
        it('should capitalize first letter', () => {
            assert.equal(capitalize('hello'), 'Hello');
            assert.equal(capitalize('HELLO'), 'HELLO');
            assert.equal(capitalize('hELLO'), 'HELLO');
        });

        it('should handle empty input', () => {
            assert.equal(capitalize(''), '');
            assert.equal(capitalize(null), '');
        });
    });

    describe('toIdentifier()', () => {
        it('should create valid JavaScript identifiers', () => {
            assert.equal(toIdentifier('user-profile'), 'user_profile');
            assert.equal(toIdentifier('123user'), '_123user');
            assert.equal(toIdentifier('user@email'), 'user_email');
            assert.equal(toIdentifier('user name'), 'user_name');
        });

        it('should remove trailing underscores', () => {
            assert.equal(toIdentifier('user___'), 'user');
        });

        it('should handle empty input', () => {
            assert.equal(toIdentifier(''), '_');
            assert.equal(toIdentifier(null), '_');
        });
    });

    describe('toDaisyUIClass()', () => {
        it('should generate DaisyUI class names', () => {
            assert.equal(toDaisyUIClass('primary'), 'primary');
            assert.equal(toDaisyUIClass('primaryButton'), 'primary-button');
            assert.equal(toDaisyUIClass('primary', 'btn'), 'btn-primary');
        });

        it('should handle empty input', () => {
            assert.equal(toDaisyUIClass(''), '');
            assert.equal(toDaisyUIClass(null), '');
        });
    });

    describe('toDaisyUIComponentClass()', () => {
        it('should generate component classes with modifiers', () => {
            assert.equal(toDaisyUIComponentClass('btn'), 'btn');
            assert.equal(toDaisyUIComponentClass('btn', ['primary']), 'btn btn-primary');
            assert.equal(toDaisyUIComponentClass('btn', ['primary', 'lg']), 'btn btn-primary btn-lg');
        });

        it('should filter empty modifiers', () => {
            assert.equal(toDaisyUIComponentClass('btn', ['', 'primary', null]), 'btn btn-primary');
        });
    });

    describe('toHumanReadable()', () => {
        it('should convert to human readable format', () => {
            assert.equal(toHumanReadable('firstName'), 'First Name');
            assert.equal(toHumanReadable('user_email'), 'User Email');
            assert.equal(toHumanReadable('API_KEY'), 'API KEY');
        });

        it('should handle acronyms', () => {
            assert.equal(toHumanReadable('userId'), 'User ID');
            assert.equal(toHumanReadable('apiKey'), 'API Key');
            assert.equal(toHumanReadable('httpUrl'), 'HTTP URL');
        });
    });

    describe('toFormLabel()', () => {
        it('should generate form labels', () => {
            assert.equal(toFormLabel('email'), 'Email');
            assert.equal(toFormLabel('email', true), 'Email *');
            assert.equal(toFormLabel('firstName'), 'First Name');
            assert.equal(toFormLabel('firstName', true), 'First Name *');
        });
    });

    describe('toDaisyUISize()', () => {
        it('should map sizes to DaisyUI sizes', () => {
            assert.equal(toDaisyUISize('xs'), 'xs');
            assert.equal(toDaisyUISize('small'), 'sm');
            assert.equal(toDaisyUISize('medium'), 'md');
            assert.equal(toDaisyUISize('large'), 'lg');
            assert.equal(toDaisyUISize('xl'), 'xl');
        });

        it('should handle unknown sizes', () => {
            assert.equal(toDaisyUISize('unknown'), 'md');
            assert.equal(toDaisyUISize(null), 'md');
        });
    });

    describe('toDaisyUIVariant()', () => {
        it('should map variants to DaisyUI variants', () => {
            assert.equal(toDaisyUIVariant('primary'), 'primary');
            assert.equal(toDaisyUIVariant('success'), 'success');
            assert.equal(toDaisyUIVariant('danger'), 'error');
            assert.equal(toDaisyUIVariant('warning'), 'warning');
        });

        it('should handle unknown variants', () => {
            assert.equal(toDaisyUIVariant('unknown'), 'primary');
            assert.equal(toDaisyUIVariant(null), 'primary');
        });
    });

    describe('preserveAcronyms()', () => {
        it('should preserve known acronyms', () => {
            assert.equal(preserveAcronyms('api key'), 'API key');
            assert.equal(preserveAcronyms('url parameter'), 'URL parameter');
            assert.equal(preserveAcronyms('html css js'), 'HTML CSS JS');
        });

        it('should handle case insensitive matches', () => {
            assert.equal(preserveAcronyms('Api Key'), 'API Key');
            assert.equal(preserveAcronyms('http request'), 'HTTP request');
        });
    });

    describe('isEmpty()', () => {
        it('should detect empty strings', () => {
            assert.equal(isEmpty(''), true);
            assert.equal(isEmpty('   '), true);
            assert.equal(isEmpty(null), true);
            assert.equal(isEmpty(undefined), true);
            assert.equal(isEmpty('hello'), false);
        });
    });

    describe('truncate()', () => {
        it('should truncate long strings', () => {
            assert.equal(truncate('short', 10), 'short');
            assert.equal(truncate('this is a very long string', 10), 'this is...');
            assert.equal(truncate('this is a very long string', 20, '…'), 'this is a very lon…');
        });

        it('should handle null input', () => {
            assert.equal(truncate(null), null);
            assert.equal(truncate(undefined), undefined);
        });
    });

    describe('toCSSClass()', () => {
        it('should generate CSS-safe class names', () => {
            assert.equal(toCSSClass('user profile'), 'user-profile');
            assert.equal(toCSSClass('123class'), '_123class');
            assert.equal(toCSSClass('class@name'), 'class-name');
            assert.equal(toCSSClass('--class--'), '_-class');
        });

        it('should handle empty input', () => {
            assert.equal(toCSSClass(''), '_');
            assert.equal(toCSSClass(null), '_');
        });
    });

    describe('generateButtonClasses()', () => {
        it('should generate button classes', () => {
            assert.equal(generateButtonClasses(), 'btn');
            assert.equal(generateButtonClasses({ variant: 'primary' }), 'btn btn-primary');
            assert.equal(generateButtonClasses({ size: 'lg' }), 'btn btn-lg');
            assert.equal(generateButtonClasses({ outline: true }), 'btn btn-outline');
        });

        it('should combine multiple options', () => {
            const options = {
                variant: 'primary',
                size: 'lg',
                outline: true,
                wide: true,
                loading: true
            };
            const result = generateButtonClasses(options);
            assert.ok(result.includes('btn'));
            assert.ok(result.includes('btn-primary'));
            assert.ok(result.includes('btn-lg'));
            assert.ok(result.includes('btn-outline'));
            assert.ok(result.includes('btn-wide'));
            assert.ok(result.includes('loading'));
        });
    });

    describe('generateInputClasses()', () => {
        it('should generate input classes', () => {
            assert.equal(generateInputClasses(), 'input input-bordered');
            assert.equal(generateInputClasses({ variant: 'primary' }), 'input input-bordered input-primary');
            assert.equal(generateInputClasses({ size: 'sm' }), 'input input-bordered input-sm');
            assert.equal(generateInputClasses({ error: true }), 'input input-bordered input-error');
        });

        it('should handle state classes', () => {
            assert.ok(generateInputClasses({ error: true }).includes('input-error'));
            assert.ok(generateInputClasses({ success: true }).includes('input-success'));
            assert.ok(generateInputClasses({ disabled: true }).includes('input-disabled'));
        });
    });
});
import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
    convertSchemaToTypeScript,
    mapOpenAPITypeToTypeScript,
    extractUIHints,
    determineInputType,
    resolveRef,
    extractValidationRules,
    getBadgeColor,
    detectCircularReferences,
    generateInterfaceName,
    identifySpecialFields
} from '../../src/utils/SchemaUtils.js';

describe('SchemaUtils', () => {
    describe('convertSchemaToTypeScript()', () => {
        it('should convert simple schemas to TypeScript types', () => {
            assert.equal(convertSchemaToTypeScript({ type: 'string' }), 'string');
            assert.equal(convertSchemaToTypeScript({ type: 'number' }), 'number');
            assert.equal(convertSchemaToTypeScript({ type: 'integer' }), 'number');
            assert.equal(convertSchemaToTypeScript({ type: 'boolean' }), 'boolean');
            assert.equal(convertSchemaToTypeScript({ type: 'null' }), 'null');
        });

        it('should handle $ref references', () => {
            const schema = { $ref: '#/components/schemas/User' };
            assert.equal(convertSchemaToTypeScript(schema), 'User');
        });

        it('should handle array types', () => {
            assert.equal(
                convertSchemaToTypeScript({ type: 'array', items: { type: 'string' } }),
                'string[]'
            );
            assert.equal(
                convertSchemaToTypeScript({ type: 'array', items: { $ref: '#/components/schemas/User' } }),
                'User[]'
            );
        });

        it('should handle object types', () => {
            const schema = {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    age: { type: 'integer' }
                },
                required: ['id', 'name']
            };
            const result = convertSchemaToTypeScript(schema);
            assert.ok(result.includes('id: string'));
            assert.ok(result.includes('name: string'));
            assert.ok(result.includes('age?: number'));
        });

        it('should handle nullable types', () => {
            const schema = {
                type: 'object',
                properties: {
                    nullable: { type: 'string', nullable: true }
                }
            };
            const result = convertSchemaToTypeScript(schema);
            assert.ok(result.includes('nullable?: string | null'));
        });

        it('should handle enum types', () => {
            const schema = {
                type: 'string',
                enum: ['active', 'inactive', 'pending']
            };
            assert.equal(convertSchemaToTypeScript(schema), "'active' | 'inactive' | 'pending'");
        });

        it('should handle allOf composition', () => {
            const schema = {
                allOf: [
                    { type: 'object', properties: { id: { type: 'string' } } },
                    { type: 'object', properties: { name: { type: 'string' } } }
                ]
            };
            const result = convertSchemaToTypeScript(schema);
            assert.ok(result.includes(' & '));
        });

        it('should handle oneOf composition', () => {
            const schema = {
                oneOf: [
                    { type: 'string' },
                    { type: 'number' }
                ]
            };
            assert.equal(convertSchemaToTypeScript(schema), 'string | number');
        });

        it('should handle empty schemas', () => {
            assert.equal(convertSchemaToTypeScript(null), 'any');
            assert.equal(convertSchemaToTypeScript(undefined), 'any');
            assert.equal(convertSchemaToTypeScript({}), 'Record<string, any>');
        });
    });

    describe('mapOpenAPITypeToTypeScript()', () => {
        it('should map basic types', () => {
            assert.equal(mapOpenAPITypeToTypeScript('string'), 'string');
            assert.equal(mapOpenAPITypeToTypeScript('number'), 'number');
            assert.equal(mapOpenAPITypeToTypeScript('integer'), 'number');
            assert.equal(mapOpenAPITypeToTypeScript('boolean'), 'boolean');
            assert.equal(mapOpenAPITypeToTypeScript('array'), 'any[]');
            assert.equal(mapOpenAPITypeToTypeScript('object'), 'Record<string, any>');
        });

        it('should handle string formats', () => {
            assert.equal(mapOpenAPITypeToTypeScript('string', 'date'), 'string');
            assert.equal(mapOpenAPITypeToTypeScript('string', 'date-time'), 'string');
            assert.equal(mapOpenAPITypeToTypeScript('string', 'email'), 'string');
            assert.equal(mapOpenAPITypeToTypeScript('string', 'binary'), 'Blob | File');
            assert.equal(mapOpenAPITypeToTypeScript('string', 'password'), 'string');
        });

        it('should handle unknown types', () => {
            assert.equal(mapOpenAPITypeToTypeScript('unknown'), 'any');
            assert.equal(mapOpenAPITypeToTypeScript(null), 'any');
        });
    });

    describe('extractUIHints()', () => {
        it('should extract UI hints from schema extensions', () => {
            const schema = {
                type: 'string',
                'x-ui-component': 'textarea',
                'x-ui-variant': 'bordered',
                'x-ui-size': 'lg',
                'x-ui-placeholder': 'Enter text...',
                'x-ui-help-text': 'This is help text'
            };

            const hints = extractUIHints(schema);
            assert.equal(hints.component, 'textarea');
            assert.equal(hints.variant, 'bordered');
            assert.equal(hints.size, 'lg');
            assert.equal(hints.placeholder, 'Enter text...');
            assert.equal(hints.helpText, 'This is help text');
        });

        it('should handle readonly fields', () => {
            const schema = { type: 'string', readOnly: true };
            const hints = extractUIHints(schema);
            assert.equal(hints.readonly, true);
        });

        it('should return empty object for null schema', () => {
            assert.deepEqual(extractUIHints(null), {});
            assert.deepEqual(extractUIHints(undefined), {});
        });
    });

    describe('determineInputType()', () => {
        it('should determine input types from schema', () => {
            assert.equal(determineInputType({ type: 'string' }), 'text');
            assert.equal(determineInputType({ type: 'number' }), 'number');
            assert.equal(determineInputType({ type: 'boolean' }), 'checkbox');
        });

        it('should respect UI hints', () => {
            assert.equal(determineInputType({ type: 'string', 'x-ui-component': 'textarea' }), 'textarea');
            assert.equal(determineInputType({ type: 'string', 'x-ui-component': 'select' }), 'select');
        });

        it('should handle string formats', () => {
            assert.equal(determineInputType({ type: 'string', format: 'email' }), 'email');
            assert.equal(determineInputType({ type: 'string', format: 'date' }), 'date');
            assert.equal(determineInputType({ type: 'string', format: 'date-time' }), 'datetime-local');
            assert.equal(determineInputType({ type: 'string', format: 'password' }), 'password');
            assert.equal(determineInputType({ type: 'string', format: 'binary' }), 'file');
            assert.equal(determineInputType({ type: 'string', format: 'url' }), 'url');
        });

        it('should handle enums', () => {
            assert.equal(determineInputType({ enum: ['a', 'b'] }), 'radio');
            assert.equal(determineInputType({ enum: ['a', 'b', 'c', 'd'] }), 'select');
        });

        it('should detect textarea based on field name', () => {
            assert.equal(determineInputType({ type: 'string' }, 'description'), 'textarea');
            assert.equal(determineInputType({ type: 'string' }, 'comment'), 'textarea');
            assert.equal(determineInputType({ type: 'string' }, 'body'), 'textarea');
        });

        it('should detect color input', () => {
            assert.equal(determineInputType({ type: 'string', format: 'color' }), 'color');
            assert.equal(determineInputType({ type: 'string' }, 'backgroundColor'), 'color');
        });

        it('should detect range slider', () => {
            assert.equal(determineInputType({
                type: 'number',
                minimum: 0,
                maximum: 100
            }), 'range');
        });

        it('should handle null input', () => {
            assert.equal(determineInputType(null), 'text');
            assert.equal(determineInputType(undefined), 'text');
        });
    });

    describe('resolveRef()', () => {
        it('should resolve references', () => {
            const definitions = {
                components: {
                    schemas: {
                        User: { type: 'object', properties: { id: { type: 'string' } } }
                    }
                }
            };

            const result = resolveRef('#/components/schemas/User', definitions);
            assert.equal(result.type, 'object');
            assert.ok(result.properties.id);
        });

        it('should handle invalid references', () => {
            assert.equal(resolveRef('#/invalid/path', {}), null);
            assert.equal(resolveRef('not-a-ref', {}), null);
            assert.equal(resolveRef(null, {}), null);
        });
    });

    describe('extractValidationRules()', () => {
        it('should extract numeric validation rules', () => {
            const schema = {
                type: 'number',
                minimum: 0,
                maximum: 100
            };
            const rules = extractValidationRules(schema);
            assert.ok(rules.some(r => r.type === 'min' && r.value === 0));
            assert.ok(rules.some(r => r.type === 'max' && r.value === 100));
        });

        it('should extract string validation rules', () => {
            const schema = {
                type: 'string',
                minLength: 3,
                maxLength: 50,
                pattern: '^[a-zA-Z]+$'
            };
            const rules = extractValidationRules(schema);
            assert.ok(rules.some(r => r.type === 'minLength' && r.value === 3));
            assert.ok(rules.some(r => r.type === 'maxLength' && r.value === 50));
            assert.ok(rules.some(r => r.type === 'pattern'));
        });

        it('should handle format validation', () => {
            const emailSchema = { type: 'string', format: 'email' };
            const urlSchema = { type: 'string', format: 'url' };

            const emailRules = extractValidationRules(emailSchema);
            const urlRules = extractValidationRules(urlSchema);

            assert.ok(emailRules.some(r => r.type === 'email'));
            assert.ok(urlRules.some(r => r.type === 'url'));
        });
    });

    describe('getBadgeColor()', () => {
        it('should return appropriate badge colors', () => {
            assert.equal(getBadgeColor('active'), 'success');
            assert.equal(getBadgeColor('inactive'), 'ghost');
            assert.equal(getBadgeColor('pending'), 'warning');
            assert.equal(getBadgeColor('error'), 'error');
            assert.equal(getBadgeColor('high'), 'error');
            assert.equal(getBadgeColor('medium'), 'warning');
            assert.equal(getBadgeColor('low'), 'info');
        });

        it('should use custom color mapping from schema', () => {
            const schema = {
                'x-ui-colors': {
                    'custom': 'accent'
                }
            };
            assert.equal(getBadgeColor('custom', schema), 'accent');
        });

        it('should handle unknown values', () => {
            assert.equal(getBadgeColor('unknown'), 'neutral');
            assert.equal(getBadgeColor(null), 'neutral');
        });
    });

    describe('detectCircularReferences()', () => {
        it('should detect circular references', () => {
            const schema = {
                type: 'object',
                properties: {
                    self: { $ref: '#/circular' }
                },
                $ref: '#/circular'
            };

            const result = detectCircularReferences(schema);
            assert.ok(result.circular);
            assert.ok(Array.isArray(result.path));
        });

        it('should handle non-circular schemas', () => {
            const schema = {
                type: 'object',
                properties: {
                    name: { type: 'string' }
                }
            };

            const result = detectCircularReferences(schema);
            assert.equal(result, false);
        });
    });

    describe('generateInterfaceName()', () => {
        it('should generate valid interface names', () => {
            assert.equal(generateInterfaceName('user'), 'User');
            assert.equal(generateInterfaceName('user-profile'), 'UserProfile');
            assert.equal(generateInterfaceName('user_profile'), 'UserProfile');
        });

        it('should handle names starting with numbers', () => {
            assert.equal(generateInterfaceName('123user'), 'Type123User');
        });

        it('should handle empty input', () => {
            assert.equal(generateInterfaceName(''), 'Unknown');
            assert.equal(generateInterfaceName(null), 'Unknown');
        });
    });

    describe('identifySpecialFields()', () => {
        it('should identify special field types', () => {
            const schema = {
                type: 'object',
                properties: {
                    status: { type: 'string', enum: ['active', 'inactive'] },
                    enabled: { type: 'boolean' },
                    rating: { type: 'number' },
                    progress: { type: 'number' },
                    avatar: { type: 'string' },
                    userCount: { type: 'integer' }
                }
            };

            const special = identifySpecialFields(schema);
            assert.ok(special.badges.includes('status'));
            assert.ok(special.toggles.includes('enabled'));
            assert.ok(special.ratings.includes('rating'));
            assert.ok(special.progress.includes('progress'));
            assert.ok(special.avatars.includes('avatar'));
            assert.ok(special.stats.includes('userCount'));
        });

        it('should handle empty schema', () => {
            const special = identifySpecialFields({});
            assert.deepEqual(special.badges, []);
            assert.deepEqual(special.toggles, []);
        });

        it('should handle null input', () => {
            const special = identifySpecialFields(null);
            assert.deepEqual(special.badges, []);
            assert.deepEqual(special.toggles, []);
        });
    });
});
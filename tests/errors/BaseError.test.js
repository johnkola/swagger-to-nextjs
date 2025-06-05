// tests/errors/BaseError.test.js
const { describe, it } = require('node:test');
const assert = require('node:assert');
const BaseError = require('../../src/errors/BaseError');

describe('BaseError', () => {
    describe('constructor', () => {
        it('should create error with message only', () => {
            const error = new BaseError('Test error');

            assert(error instanceof Error);
            assert(error instanceof BaseError);
            assert.strictEqual(error.message, 'Test error');
            assert.strictEqual(error.code, 'UNKNOWN_ERROR');
            assert.deepStrictEqual(error.context, {});
            assert.strictEqual(error.name, 'BaseError');
            assert(error.timestamp);
            assert(new Date(error.timestamp) instanceof Date);
        });

        it('should create error with all parameters', () => {
            const originalError = new Error('Original error');
            const context = { userId: 123, action: 'test' };

            const error = new BaseError(
                'Wrapped error',
                'CUSTOM_ERROR',
                context,
                originalError
            );

            assert.strictEqual(error.message, 'Wrapped error');
            assert.strictEqual(error.code, 'CUSTOM_ERROR');
            assert.deepStrictEqual(error.context, context);
            assert.strictEqual(error.originalError, originalError);
            assert(error.stack.includes('Caused by:'));
        });

        it('should handle null/undefined parameters', () => {
            const error = new BaseError(null, null, null, null);

            assert.strictEqual(error.message, 'null');
            assert.strictEqual(error.code, 'UNKNOWN_ERROR');
            assert.deepStrictEqual(error.context, {});
            assert.strictEqual(error.originalError, null);
        });

        it('should convert non-string codes to string', () => {
            const error = new BaseError('Test', 123);
            assert.strictEqual(error.code, '123');
            assert.strictEqual(typeof error.code, 'string');
        });

        it('should capture stack trace', () => {
            const error = new BaseError('Stack trace test');

            assert(error.stack);
            assert(error.stack.includes('BaseError'));
            assert(error.stack.includes('Stack trace test'));
        });
    });

    describe('hasCode()', () => {
        it('should return true for matching code', () => {
            const error = new BaseError('Test', 'TEST_CODE');
            assert.strictEqual(error.hasCode('TEST_CODE'), true);
        });

        it('should return false for non-matching code', () => {
            const error = new BaseError('Test', 'TEST_CODE');
            assert.strictEqual(error.hasCode('OTHER_CODE'), false);
        });
    });

    describe('isType()', () => {
        it('should check by string name', () => {
            const error = new BaseError('Test');
            assert.strictEqual(error.isType('BaseError'), true);
            assert.strictEqual(error.isType('OtherError'), false);
        });

        it('should check by constructor', () => {
            const error = new BaseError('Test');
            assert.strictEqual(error.isType(BaseError), true);
            assert.strictEqual(error.isType(Error), true);
            assert.strictEqual(error.isType(TypeError), false);
        });
    });

    describe('addContext()', () => {
        it('should add context with key-value', () => {
            const error = new BaseError('Test');

            error.addContext('userId', 123);
            error.addContext('action', 'login');

            assert.strictEqual(error.context.userId, 123);
            assert.strictEqual(error.context.action, 'login');
        });

        it('should add context with object', () => {
            const error = new BaseError('Test');

            error.addContext({
                userId: 123,
                action: 'login',
                timestamp: Date.now()
            });

            assert.strictEqual(error.context.userId, 123);
            assert.strictEqual(error.context.action, 'login');
            assert(error.context.timestamp);
        });

        it('should support method chaining', () => {
            const error = new BaseError('Test');

            const result = error
                .addContext('step', 1)
                .addContext('status', 'failed')
                .addContext({ retry: true });

            assert.strictEqual(result, error);
            assert.strictEqual(error.context.step, 1);
            assert.strictEqual(error.context.status, 'failed');
            assert.strictEqual(error.context.retry, true);
        });

        it('should overwrite existing context values', () => {
            const error = new BaseError('Test', 'CODE', { value: 'old' });

            error.addContext('value', 'new');

            assert.strictEqual(error.context.value, 'new');
        });
    });

    describe('toObject()', () => {
        it('should return error as plain object', () => {
            const error = new BaseError('Test error', 'TEST_CODE', { data: 123 });
            const obj = error.toObject();

            assert.strictEqual(obj.name, 'BaseError');
            assert.strictEqual(obj.message, 'Test error');
            assert.strictEqual(obj.code, 'TEST_CODE');
            assert.deepStrictEqual(obj.context, { data: 123 });
            assert(obj.timestamp);
            assert(obj.stack);
        });
    });

    describe('toJSON()', () => {
        it('should return JSON-serializable object', () => {
            const error = new BaseError('Test error', 'TEST_CODE', { data: 123 });
            const json = error.toJSON();

            assert.strictEqual(json.name, 'BaseError');
            assert.strictEqual(json.message, 'Test error');
            assert.strictEqual(json.code, 'TEST_CODE');
            assert.deepStrictEqual(json.context, { data: 123 });
            assert(json.timestamp);
            assert.strictEqual(json.stack, undefined); // Stack excluded from JSON

            // Should be JSON serializable
            assert.doesNotThrow(() => JSON.stringify(json));
        });
    });

    describe('toString()', () => {
        it('should return formatted string without context', () => {
            const error = new BaseError('Test error', 'TEST_CODE');
            const str = error.toString();

            assert.strictEqual(str, 'BaseError [TEST_CODE]: Test error');
        });

        it('should return formatted string with context', () => {
            const error = new BaseError('Test error', 'TEST_CODE', { userId: 123 });
            const str = error.toString();

            assert(str.includes('BaseError [TEST_CODE]: Test error'));
            assert(str.includes('Context:'));
            assert(str.includes('"userId": 123'));
        });
    });

    describe('static from()', () => {
        it('should return BaseError instance as-is', () => {
            const original = new BaseError('Test', 'CODE');
            const result = BaseError.from(original);

            assert.strictEqual(result, original);
        });

        it('should wrap regular Error', () => {
            const original = new Error('Original message');
            original.code = 'ORIG_CODE';

            const wrapped = BaseError.from(original);

            assert(wrapped instanceof BaseError);
            assert.strictEqual(wrapped.message, 'Original message');
            assert.strictEqual(wrapped.code, 'ORIG_CODE');
            assert.strictEqual(wrapped.originalError, original);
            assert.strictEqual(wrapped.context.originalName, 'Error');
        });

        it('should handle TypeError and other Error subtypes', () => {
            const typeError = new TypeError('Type mismatch');
            const wrapped = BaseError.from(typeError);

            assert.strictEqual(wrapped.message, 'Type mismatch');
            assert.strictEqual(wrapped.context.originalName, 'TypeError');
        });

        it('should handle non-Error thrown values', () => {
            // String
            const stringError = BaseError.from('String error');
            assert.strictEqual(stringError.message, 'String error');
            assert.strictEqual(stringError.context.thrownType, 'string');

            // Number
            const numberError = BaseError.from(404);
            assert.strictEqual(numberError.message, '404');
            assert.strictEqual(numberError.context.thrownValue, 404);

            // Object
            const objError = BaseError.from({ error: 'Invalid' });
            assert.strictEqual(objError.message, '[object Object]');
            assert.deepStrictEqual(objError.context.thrownValue, { error: 'Invalid' });

            // null
            const nullError = BaseError.from(null);
            assert.strictEqual(nullError.message, 'An error occurred');

            // undefined
            const undefinedError = BaseError.from(undefined, 'Default message');
            assert.strictEqual(undefinedError.message, 'Default message');
        });

        it('should use default values when provided', () => {
            const wrapped = BaseError.from(
                new Error(),
                'Default message',
                'DEFAULT_CODE'
            );

            assert.strictEqual(wrapped.message, 'Default message');
            assert.strictEqual(wrapped.code, 'DEFAULT_CODE');
        });
    });

    describe('static isBaseError()', () => {
        it('should return true for BaseError instances', () => {
            const error = new BaseError('Test');
            assert.strictEqual(BaseError.isBaseError(error), true);
        });

        it('should return false for regular Error', () => {
            const error = new Error('Test');
            assert.strictEqual(BaseError.isBaseError(error), false);
        });

        it('should return false for non-errors', () => {
            assert.strictEqual(BaseError.isBaseError('string'), false);
            assert.strictEqual(BaseError.isBaseError(123), false);
            assert.strictEqual(BaseError.isBaseError({}), false);
            assert.strictEqual(BaseError.isBaseError(null), false);
            assert.strictEqual(BaseError.isBaseError(undefined), false);
        });
    });

    describe('static extend()', () => {
        it('should create custom error class', () => {
            const CustomError = BaseError.extend('CustomError');

            const error = new CustomError('Test message');

            assert(error instanceof BaseError);
            assert(error instanceof CustomError);
            assert.strictEqual(error.name, 'CustomError');
            assert.strictEqual(error.code, 'CUSTOM');
        });

        it('should create custom error with default code', () => {
            const ValidationError = BaseError.extend('ValidationError', 'VALIDATION_FAILED');

            const error = new ValidationError('Invalid input');

            assert.strictEqual(error.code, 'VALIDATION_FAILED');
        });

        it('should allow overriding default code', () => {
            const CustomError = BaseError.extend('CustomError', 'DEFAULT_CODE');

            const error = new CustomError('Test', 'SPECIFIC_CODE');

            assert.strictEqual(error.code, 'SPECIFIC_CODE');
        });

        it('should handle "Error" suffix in name', () => {
            const NetworkError = BaseError.extend('NetworkError');
            const error = new NetworkError('Connection failed');

            assert.strictEqual(error.code, 'NETWORK');
        });

        it('should preserve constructor name', () => {
            const CustomError = BaseError.extend('CustomError');

            assert.strictEqual(CustomError.name, 'CustomError');
        });

        it('extended errors should work with instanceof', () => {
            const AppError = BaseError.extend('AppError');
            const NetworkError = BaseError.extend('NetworkError');

            const appError = new AppError('App failed');
            const networkError = new NetworkError('Network failed');

            assert(appError instanceof AppError);
            assert(!(appError instanceof NetworkError));
            assert(networkError instanceof NetworkError);
            assert(!(networkError instanceof AppError));

            // Both should be BaseError instances
            assert(appError instanceof BaseError);
            assert(networkError instanceof BaseError);
        });
    });

    describe('inheritance', () => {
        it('should work with manual extension', () => {
            class CustomError extends BaseError {
                constructor(message, details) {
                    super(message, 'CUSTOM_ERROR', { details });
                    this.name = 'CustomError';
                    this.customProperty = true;
                }

                getDetails() {
                    return this.context.details;
                }
            }

            const error = new CustomError('Test', { foo: 'bar' });

            assert(error instanceof BaseError);
            assert(error instanceof CustomError);
            assert.strictEqual(error.customProperty, true);
            assert.deepStrictEqual(error.getDetails(), { foo: 'bar' });
        });
    });

    describe('edge cases', () => {
        it('should handle circular references in context', () => {
            const error = new BaseError('Test');
            const circular = { name: 'obj' };
            circular.self = circular;

            error.addContext('circular', circular);

            // toString should not throw
            assert.doesNotThrow(() => error.toString());
        });

        it('should handle very long messages', () => {
            const longMessage = 'A'.repeat(10000);
            const error = new BaseError(longMessage);

            assert.strictEqual(error.message, longMessage);
            assert.strictEqual(error.message.length, 10000);
        });

        it('should handle special characters in messages', () => {
            const specialMessage = 'Error: \n\t\r\u0000 "quoted" \'single\' `backtick`';
            const error = new BaseError(specialMessage);

            assert.strictEqual(error.message, specialMessage);
        });
    });
});
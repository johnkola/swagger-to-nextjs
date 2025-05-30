// Test setup file

// Increase timeout for integration tests
jest.setTimeout(10000);

// Mock chalk to avoid ES module issues
jest.mock('chalk', () => ({
    red: jest.fn(str => str),
    yellow: jest.fn(str => str),
    green: jest.fn(str => str),
    cyan: jest.fn(str => str),
    gray: jest.fn(str => str),
    white: jest.fn(str => str),
    bold: {
        white: jest.fn(str => str)
    }
}));

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

// Suppress console output during tests unless explicitly testing it
global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
};
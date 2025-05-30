module.exports = {
    testEnvironment: 'node',

    // Transform files with babel-jest
    transform: {
        '^.+\\.jsx?$': 'babel-jest',
    },

    // Don't transform node_modules except for ES modules
    transformIgnorePatterns: [
        'node_modules/(?!(chalk|#ansi-styles|#supports-color)/)',
    ],

    // Module name mapper for handling imports
    moduleNameMapper: {
        '#ansi-styles': '<rootDir>/node_modules/chalk/source/vendor/ansi-styles/index.js',
        '#supports-color': '<rootDir>/node_modules/chalk/source/vendor/supports-color/index.js',
    },

    // Setup files
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

    // Test match patterns
    testMatch: [
        '**/tests/**/*.test.js',
        '**/__tests__/**/*.js',
    ],

    // Coverage settings
    collectCoverageFrom: [
        'src/**/*.js',
        'bin/**/*.js',
        '!**/node_modules/**',
        '!**/tests/**',
        '!**/__tests__/**',
    ],

    // Clear mocks between tests
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true,

    // Verbose output
    verbose: true,
};
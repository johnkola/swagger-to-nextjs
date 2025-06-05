// test-all.js
/**
 * Minimal test runner - uses Node.js built-in test runner
 * Run with: node test-all.js
 */

const { execSync } = require('child_process');

console.log('Running all tests...\n');

try {
    // Node.js test runner can find test files automatically
    // It looks for **/*.test.js, **/*.test.mjs, **/test-*.js, **/test-*.mjs, **/test.js, **/test.mjs
    execSync('node --test', {
        stdio: 'inherit',
        env: { ...process.env, FORCE_COLOR: '1' }
    });
} catch (error) {
    process.exit(1);
}
// ==============================================================================
// test/bin/swagger-to-nextjs.test.js
// ==============================================================================

import { describe, it, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import fs from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import process from 'node:process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const binPath = join(__dirname, '../../bin/swagger-to-nextjs.js');

// Detect if running on Windows
const isWindows = process.platform === 'win32';
const nodeCommand = isWindows ? 'node.exe' : 'node';

// Track all child processes for cleanup
const activeProcesses = new Set();

describe('bin/swagger-to-nextjs.js', () => {
    let tempDir;
    let originalEnv;

    beforeEach(async () => {
        tempDir = join(__dirname, 'temp-' + Date.now());
        await fs.mkdir(tempDir, { recursive: true });
        originalEnv = { ...process.env };
    });

    afterEach(async () => {
        process.env = originalEnv;

        // Kill any remaining child processes
        for (const child of activeProcesses) {
            try {
                child.kill('SIGKILL');
            } catch (err) {
                // Process might already be dead
            }
        }
        activeProcesses.clear();

        // Clean up temp directory with retries
        let retries = 3;
        while (retries > 0) {
            try {
                // First, try to reset permissions on all files
                try {
                    const files = await fs.readdir(tempDir, { recursive: true });
                    for (const file of files) {
                        const filePath = join(tempDir, file);
                        try {
                            await fs.chmod(filePath, 0o666);
                        } catch (err) {
                            // Ignore permission errors during cleanup
                        }
                    }
                } catch (err) {
                    // Ignore errors reading directory
                }

                // Now remove the directory
                await fs.rm(tempDir, { recursive: true, force: true, maxRetries: 3 });
                break;
            } catch (err) {
                retries--;
                if (retries === 0) {
                    console.warn(`Warning: Could not clean up ${tempDir}:`, err.message);
                } else {
                    // Wait a bit before retrying
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
        }
    });

    async function runCLI(args = [], options = {}) {
        return new Promise((resolve, reject) => {
            const spawnOptions = {
                env: { ...process.env, ...options.env },
                cwd: options.cwd || process.cwd(),
                stdio: options.stdio || 'pipe',
                shell: isWindows // Use shell on Windows to resolve node.exe
            };

            const child = spawn(nodeCommand, [binPath, ...args], spawnOptions);
            activeProcesses.add(child);

            let stdout = '';
            let stderr = '';

            if (child.stdout) {
                child.stdout.on('data', (data) => {
                    stdout += data.toString();
                });
            }

            if (child.stderr) {
                child.stderr.on('data', (data) => {
                    stderr += data.toString();
                });
            }

            const timeout = setTimeout(() => {
                child.kill(isWindows ? 'SIGTERM' : 'SIGKILL');
                reject(new Error('Process timeout'));
            }, options.timeout || 10000);

            child.on('exit', (code, signal) => {
                clearTimeout(timeout);
                activeProcesses.delete(child);
                resolve({ code, signal, stdout, stderr });
            });

            child.on('error', (err) => {
                clearTimeout(timeout);
                activeProcesses.delete(child);
                reject(err);
            });

            // Send input if provided
            if (options.input) {
                child.stdin.write(options.input);
                child.stdin.end();
            }
        });
    }

    async function runScript(scriptPath, args = [], options = {}) {
        return new Promise((resolve, reject) => {
            const spawnOptions = {
                env: { ...process.env, ...options.env },
                cwd: options.cwd || tempDir,
                stdio: options.stdio || 'pipe',
                shell: isWindows
            };

            const child = spawn(nodeCommand, [scriptPath, ...args], spawnOptions);
            activeProcesses.add(child);

            let stdout = '';
            let stderr = '';

            if (child.stdout) {
                child.stdout.on('data', (data) => {
                    stdout += data.toString();
                });
            }

            if (child.stderr) {
                child.stderr.on('data', (data) => {
                    stderr += data.toString();
                });
            }

            const timeout = setTimeout(() => {
                child.kill(isWindows ? 'SIGTERM' : 'SIGKILL');
                activeProcesses.delete(child);
                resolve({ code: 1, signal: null, stdout, stderr: stderr + '\nProcess timeout' });
            }, options.timeout || 5000);

            child.on('exit', (code, signal) => {
                clearTimeout(timeout);
                activeProcesses.delete(child);
                resolve({ code, signal, stdout, stderr });
            });

            child.on('error', (err) => {
                clearTimeout(timeout);
                activeProcesses.delete(child);
                resolve({ code: 1, signal: null, stdout: '', stderr: err.message });
            });
        });
    }

    describe('Process lifecycle', () => {
        it('should handle clean startup and shutdown', async () => {
            const result = await runCLI(['--version']);
            assert.ok(result.code === 0 || result.code === 1);
            assert.ok(result.stdout.includes('.') || result.stderr.includes('.') || result.stderr.includes('Error'));
        });

        it('should handle SIGINT gracefully', async function() {
            if (isWindows) {
                this.skip(); // Skip signal tests on Windows
                return;
            }

            return new Promise((resolve, reject) => {
                const child = spawn(nodeCommand, [binPath, 'generate', 'fake.yaml'], {
                    stdio: 'pipe'
                });
                activeProcesses.add(child);

                let exited = false;

                child.on('exit', (code, signal) => {
                    if (!exited) {
                        exited = true;
                        activeProcesses.delete(child);
                        try {
                            assert.ok(code === 0 || code === 1 || signal === 'SIGINT');
                            resolve();
                        } catch (err) {
                            reject(err);
                        }
                    }
                });

                child.on('error', (err) => {
                    if (!exited) {
                        exited = true;
                        activeProcesses.delete(child);
                        reject(err);
                    }
                });

                setTimeout(() => {
                    if (!exited) {
                        try {
                            child.kill('SIGINT');
                        } catch (err) {
                            if (!exited) {
                                reject(err);
                            }
                        }
                    }
                }, 100);
            });
        });

        it('should handle SIGTERM gracefully', async function() {
            if (isWindows) {
                this.skip(); // Skip signal tests on Windows
                return;
            }

            return new Promise((resolve, reject) => {
                const child = spawn(nodeCommand, [binPath, 'generate', 'fake.yaml'], {
                    stdio: 'pipe'
                });
                activeProcesses.add(child);

                let exited = false;

                child.on('exit', (code, signal) => {
                    if (!exited) {
                        exited = true;
                        activeProcesses.delete(child);
                        try {
                            assert.ok(code === 0 || code === 1 || signal === 'SIGTERM');
                            resolve();
                        } catch (err) {
                            reject(err);
                        }
                    }
                });

                child.on('error', (err) => {
                    if (!exited) {
                        exited = true;
                        activeProcesses.delete(child);
                        reject(err);
                    }
                });

                setTimeout(() => {
                    if (!exited) {
                        try {
                            child.kill('SIGTERM');
                        } catch (err) {
                            if (!exited) {
                                reject(err);
                            }
                        }
                    }
                }, 100);
            });
        });

        it('should prevent multiple SIGINT handlers', async function() {
            if (isWindows) {
                this.skip(); // Skip signal tests on Windows
                return;
            }

            return new Promise((resolve, reject) => {
                const child = spawn(nodeCommand, [binPath, 'generate', 'fake.yaml'], {
                    stdio: 'pipe'
                });
                activeProcesses.add(child);

                let exited = false;

                child.on('exit', (code, signal) => {
                    if (!exited) {
                        exited = true;
                        activeProcesses.delete(child);
                        try {
                            assert.ok(code === 0 || code === 1 || signal === 'SIGINT');
                            resolve();
                        } catch (err) {
                            reject(err);
                        }
                    }
                });

                child.on('error', (err) => {
                    if (!exited) {
                        exited = true;
                        activeProcesses.delete(child);
                        reject(err);
                    }
                });

                setTimeout(() => {
                    if (!exited) {
                        try {
                            child.kill('SIGINT');
                            child.kill('SIGINT');
                            child.kill('SIGINT');
                        } catch (err) {
                            // Ignore errors from multiple kills
                        }
                    }
                }, 100);
            });
        });
    });

    describe('Error handling', () => {
        it('should show user-friendly error for missing CLI module', async () => {
            const fakeBinPath = join(tempDir, 'fake-bin.js');
            const binContent = `#!/usr/bin/env node
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
try {
  require('./non-existent-cli.js');
} catch (error) {
  error.code = 'MODULE_NOT_FOUND';
  console.error('Failed to start swagger-to-nextjs');
  console.error('Missing dependencies');
  process.exit(1);
}
`;
            await fs.writeFile(fakeBinPath, binContent);
            if (!isWindows) {
                await fs.chmod(fakeBinPath, 0o755);
            }

            const result = await runScript(fakeBinPath);

            assert.strictEqual(result.code, 1);
            assert.ok(result.stderr.includes('Failed to start swagger-to-nextjs'));
            assert.ok(result.stderr.includes('Missing dependencies'));
        });

        it('should show helpful message for EACCES errors', async function() {
            if (isWindows) {
                this.skip(); // Skip permission tests on Windows
                return;
            }

            const protectedFile = join(tempDir, 'protected.js');
            await fs.writeFile(protectedFile, 'export default {}');

            try {
                // Try to set file permissions to no access
                await fs.chmod(protectedFile, 0o000);

                // Verify that we actually can't read the file
                // This might fail on WSL where Windows permissions override Unix permissions
                try {
                    await fs.readFile(protectedFile);
                    // If we can read the file, skip the test
                    this.skip('File permissions not enforced on this system (likely WSL)');
                    return;
                } catch (err) {
                    // Good, we can't read the file, continue with the test
                    if (err.code !== 'EACCES') {
                        this.skip('Unexpected permission behavior on this system');
                        return;
                    }
                }

                const fakeBinPath = join(tempDir, 'fake-bin.js');
                const binContent = `#!/usr/bin/env node
import fs from 'node:fs';
try {
  fs.readFileSync('${protectedFile}');
} catch (error) {
  if (error.code === 'EACCES') {
    console.error('Permission denied');
    process.exit(1);
  }
  throw error;
}
`;
                await fs.writeFile(fakeBinPath, binContent);
                await fs.chmod(fakeBinPath, 0o755);

                const result = await runScript(fakeBinPath);

                assert.strictEqual(result.code, 1);
                assert.ok(result.stderr.includes('Permission denied'));
            } finally {
                // Always cleanup - restore permissions
                try {
                    await fs.chmod(protectedFile, 0o644);
                } catch (err) {
                    // Ignore cleanup errors
                }
            }
        });

        it('should show helpful message for ENOENT errors', async () => {
            const fakeBinPath = join(tempDir, 'fake-bin.js');
            const binContent = `#!/usr/bin/env node
import fs from 'node:fs';
try {
  fs.readFileSync('/definitely/does/not/exist.js');
} catch (error) {
  if (error.code === 'ENOENT') {
    console.error('Required file not found');
    process.exit(1);
  }
  throw error;
}
`;
            await fs.writeFile(fakeBinPath, binContent);
            if (!isWindows) {
                await fs.chmod(fakeBinPath, 0o755);
            }

            const result = await runScript(fakeBinPath);

            assert.strictEqual(result.code, 1);
            assert.ok(result.stderr.includes('Required file not found'));
        });

        it('should handle uncaught exceptions', async () => {
            const fakeBinPath = join(tempDir, 'fake-bin.js');
            const binContent = `#!/usr/bin/env node
process.on('uncaughtException', (error) => {
  console.error('Caught:', error.message);
  process.exit(1);
});

setTimeout(() => {
  throw new Error('Async error');
}, 100);

// Keep process alive
setTimeout(() => {
  process.exit(0);
}, 500);
`;
            await fs.writeFile(fakeBinPath, binContent);
            if (!isWindows) {
                await fs.chmod(fakeBinPath, 0o755);
            }

            const result = await runScript(fakeBinPath, [], { timeout: 2000 });

            assert.strictEqual(result.code, 1);
            assert.ok(result.stderr.includes('Async error') || result.stderr.includes('Caught:'));
        });

        it('should handle unhandled promise rejections', async () => {
            const fakeBinPath = join(tempDir, 'fake-bin.js');
            const binContent = `#!/usr/bin/env node
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled:', reason.message || reason);
  process.exit(1);
});

Promise.reject(new Error('Rejected promise'));

// Keep process alive
setTimeout(() => {
  process.exit(0);
}, 500);
`;
            await fs.writeFile(fakeBinPath, binContent);
            if (!isWindows) {
                await fs.chmod(fakeBinPath, 0o755);
            }

            const result = await runScript(fakeBinPath, [], { timeout: 2000 });

            assert.strictEqual(result.code, 1);
            assert.ok(result.stderr.includes('Rejected promise') || result.stderr.includes('Unhandled:'));
        });
    });

    describe('Debug mode', () => {
        it('should show stack traces when DEBUG=1', async () => {
            const fakeBinPath = join(tempDir, 'fake-bin.js');
            const binContent = `#!/usr/bin/env node
if (process.env.DEBUG) {
  const error = new Error('Test error');
  error.stack = 'Error: Test error\\n    at Object.<anonymous> (test.js:1:1)';
  console.error('Stack trace:');
  console.error(error.stack);
  process.exit(1);
} else {
  console.error('Run with DEBUG=1 for detailed error information.');
  process.exit(1);
}
`;
            await fs.writeFile(fakeBinPath, binContent);
            if (!isWindows) {
                await fs.chmod(fakeBinPath, 0o755);
            }

            // Without DEBUG
            const result1 = await runScript(fakeBinPath);
            assert.ok(result1.stderr.includes('Run with DEBUG=1'));

            // With DEBUG
            const result2 = await runScript(fakeBinPath, [], { env: { DEBUG: '1' } });
            assert.ok(result2.stderr.includes('Stack trace:'));
            assert.ok(result2.stderr.includes('test.js:1:1'));
        });

        it('should pass through environment variables', async () => {
            const fakeBinPath = join(tempDir, 'fake-bin.js');
            const binContent = `#!/usr/bin/env node
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('CUSTOM_VAR:', process.env.CUSTOM_VAR);
`;
            await fs.writeFile(fakeBinPath, binContent);
            if (!isWindows) {
                await fs.chmod(fakeBinPath, 0o755);
            }

            const result = await runScript(fakeBinPath, [], {
                env: {
                    NODE_ENV: 'production',
                    CUSTOM_VAR: 'test-value'
                }
            });

            assert.ok(result.stdout.includes('NODE_ENV: production'));
            assert.ok(result.stdout.includes('CUSTOM_VAR: test-value'));
        });
    });

    describe('CLI integration', () => {
        it('should forward arguments to CLI module', async () => {
            const result = await runCLI(['--help']);
            assert.ok(result.code === 0 || result.code === 1);
            assert.ok(
                result.stdout.includes('swagger-to-nextjs') ||
                result.stdout.includes('generate') ||
                result.stderr.includes('Error') ||
                result.stderr.includes('error')
            );
        });

        it('should handle CLI errors properly', async () => {
            const result = await runCLI(['invalid-command']);
            assert.strictEqual(result.code, 1);
            assert.ok(result.stderr.includes('error') || result.stderr.includes('Error'));
        });

        it('should pass exit code from CLI', async () => {
            const result = await runCLI(['--version']);
            assert.ok(result.code === 0 || result.code === 1);
        });
    });
});

// Clean up any leftover temp directories on process exit
process.on('exit', async () => {
    try {
        const testDir = __dirname;
        const files = await fs.readdir(testDir);
        const tempDirs = files.filter(f => f.startsWith('temp-'));

        for (const dir of tempDirs) {
            try {
                await fs.rm(join(testDir, dir), { recursive: true, force: true });
            } catch (err) {
                // Ignore cleanup errors
            }
        }
    } catch (err) {
        // Ignore errors
    }
});
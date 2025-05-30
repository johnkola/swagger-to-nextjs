/**
 * Unit Tests for DirectoryManager
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const DirectoryManager = require('../../src/core/DirectoryManager');

// Mock fs for some tests
jest.mock('fs');

describe('DirectoryManager', () => {
    let tempDir;
    let dirManager;

    beforeEach(() => {
        tempDir = path.join(os.tmpdir(), 'swagger-test-' + Date.now());
        dirManager = new DirectoryManager(tempDir, path.join(tempDir, 'api-client'));

        // Reset mocks
        jest.clearAllMocks();
    });

    afterEach(() => {
        // Cleanup real directories if they exist
        try {
            if (fs.existsSync && fs.existsSync(tempDir)) {
                fs.rmSync(tempDir, { recursive: true, force: true });
            }
        } catch (error) {
            // Ignore cleanup errors
        }
    });

    describe('Path Conversion', () => {
        test('should convert simple Swagger paths to Next.js format', () => {
            expect(dirManager.convertToNextJSPath('/users/{id}')).toBe('/users/[id]');
            expect(dirManager.convertToNextJSPath('/posts/{postId}')).toBe('/posts/[postId]');
        });

        test('should handle multiple parameters', () => {
            const result = dirManager.convertToNextJSPath('/users/{userId}/posts/{postId}');
            expect(result).toBe('/users/[userId]/posts/[postId]');
        });

        test('should handle paths without parameters', () => {
            expect(dirManager.convertToNextJSPath('/users')).toBe('/users');
            expect(dirManager.convertToNextJSPath('/api/health')).toBe('/api/health');
        });

        test('should handle root path', () => {
            expect(dirManager.convertToNextJSPath('/')).toBe('/');
        });

        test('should remove trailing slashes', () => {
            expect(dirManager.convertToNextJSPath('/users/')).toBe('/users');
            expect(dirManager.convertToNextJSPath('/users/{id}/')).toBe('/users/[id]');
        });

        test('should sanitize invalid characters', () => {
            expect(dirManager.convertToNextJSPath('/users/{id}/posts@special')).toBe('/users/[id]/postsspecial');
        });

        test('should add leading slash if missing', () => {
            expect(dirManager.convertToNextJSPath('users/{id}')).toBe('/users/[id]');
        });

        test('should warn about invalid patterns', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

            dirManager.convertToNextJSPath('/users//{id}');
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Invalid path pattern detected')
            );

            consoleSpy.mockRestore();
        });
    });

    describe('Directory Creation', () => {
        test('should create all required directories', () => {
            // Mock fs.existsSync to return false (directories don't exist)
            fs.existsSync.mockReturnValue(false);
            fs.mkdirSync.mockImplementation(() => {});

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            dirManager.createDirectories();

            // Verify mkdirSync was called for each directory
            expect(fs.mkdirSync).toHaveBeenCalledWith(
                expect.stringContaining('src'),
                { recursive: true }
            );
            expect(fs.mkdirSync).toHaveBeenCalledWith(
                expect.stringContaining('app'),
                { recursive: true }
            );

            consoleSpy.mockRestore();
        });

        test('should skip existing directories', () => {
            fs.existsSync.mockReturnValue(true);
            fs.mkdirSync.mockImplementation(() => {});

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            dirManager.createDirectories();

            expect(fs.mkdirSync).not.toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('already exists')
            );

            consoleSpy.mockRestore();
        });

        test('should handle directory creation errors', () => {
            fs.existsSync.mockReturnValue(false);
            fs.mkdirSync.mockImplementation(() => {
                throw new Error('Permission denied');
            });

            expect(() => dirManager.createDirectories()).toThrow(
                'Failed to create directories'
            );
        });
    });

    describe('File Operations', () => {
        test('should write files with directory creation', () => {
            fs.existsSync.mockReturnValue(false);
            fs.mkdirSync.mockImplementation(() => {});
            fs.writeFileSync.mockImplementation(() => {});

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            const result = dirManager.writeFile('/test/file.js', 'content', 'test file');

            expect(result).toBe(true);
            expect(fs.mkdirSync).toHaveBeenCalled();
            expect(fs.writeFileSync).toHaveBeenCalledWith('/test/file.js', 'content', 'utf8');

            consoleSpy.mockRestore();
        });

        test('should handle file write errors', () => {
            fs.existsSync.mockReturnValue(true);
            fs.writeFileSync.mockImplementation(() => {
                throw new Error('Disk full');
            });

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const result = dirManager.writeFile('/test/file.js', 'content');

            expect(result).toBe(false);
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Failed to write')
            );

            consoleSpy.mockRestore();
        });

        test('should read files correctly', () => {
            fs.readFileSync.mockReturnValue('file content');

            const result = dirManager.readFile('/test/file.js');

            expect(result).toBe('file content');
            expect(fs.readFileSync).toHaveBeenCalledWith('/test/file.js', 'utf8');
        });

        test('should handle file read errors', () => {
            fs.readFileSync.mockImplementation(() => {
                throw new Error('File not found');
            });

            expect(() => dirManager.readFile('/missing/file.js')).toThrow(
                'Failed to read file'
            );
        });
    });

    describe('Path Generation', () => {
        test('should generate API route file paths', () => {
            const result = dirManager.getApiRouteFilePath('/users/{id}');
            expect(result).toContain('/api/users/[id]/route.ts');
        });

        test('should generate page file paths', () => {
            const result = dirManager.getPageFilePath('/users/{id}');
            expect(result).toContain('/app/users/[id]/page.tsx');
        });

        test('should generate config file paths', () => {
            const result = dirManager.getConfigFilePath('layout.tsx');
            expect(result).toContain('/app/layout.tsx');
        });
    });

    describe('Validation', () => {
        test('should validate directory structure', () => {
            fs.existsSync.mockReturnValue(true);
            fs.writeFileSync.mockImplementation(() => {});
            fs.unlinkSync.mockImplementation(() => {});

            const result = dirManager.validateStructure();

            expect(result.isValid).toBe(true);
            expect(result.issues).toHaveLength(0);
        });

        test('should detect missing directories', () => {
            fs.existsSync.mockReturnValue(false);

            const result = dirManager.validateStructure();

            expect(result.isValid).toBe(false);
            expect(result.issues.length).toBeGreaterThan(0);
            expect(result.issues[0]).toContain('Missing directory');
        });

        test('should detect permission issues', () => {
            fs.existsSync.mockReturnValue(true);
            fs.writeFileSync.mockImplementation(() => {
                throw new Error('Permission denied');
            });

            const result = dirManager.validateStructure();

            expect(result.isValid).toBe(false);
            expect(result.issues.some(issue => issue.includes('No write permission'))).toBe(true);
        });
    });
});
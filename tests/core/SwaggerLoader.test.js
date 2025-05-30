/**
 * Unit Tests for SwaggerLoader
 */

const fs = require('fs');
const http = require('http');
const SwaggerLoader = require('../../src/core/SwaggerLoader');

// Mock fs for some tests
jest.mock('fs');

describe('SwaggerLoader', () => {
    describe('URL Validation', () => {
        test('should validate HTTP/HTTPS URLs', () => {
            const loader1 = new SwaggerLoader('https://api.example.com/swagger.json');
            const loader2 = new SwaggerLoader('http://localhost:3000/api-docs');

            expect(loader1.isValidUrl('https://api.example.com/swagger.json')).toBe(true);
            expect(loader2.isValidUrl('http://localhost:3000/api-docs')).toBe(true);
        });

        test('should reject invalid URLs', () => {
            const loader = new SwaggerLoader('file://local/file');

            expect(loader.isValidUrl('file://local/file')).toBe(false);
            expect(loader.isValidUrl('ftp://example.com')).toBe(false);
            expect(loader.isValidUrl('not-a-url')).toBe(false);
        });

        test('should reject malformed URLs', () => {
            const loader = new SwaggerLoader('http://');

            expect(loader.isValidUrl('http://')).toBe(false);
            expect(loader.isValidUrl('https://')).toBe(false);
        });
    });

    describe('Config File Detection', () => {
        test('should detect YAML config files', () => {
            const loader1 = new SwaggerLoader('openapi-config.yaml');
            const loader2 = new SwaggerLoader('config.yml');

            expect(loader1.isConfigFile('openapi-config.yaml')).toBe(true);
            expect(loader2.isConfigFile('config.yml')).toBe(true);
        });

        test('should not detect non-YAML files as config', () => {
            const loader = new SwaggerLoader('swagger.json');

            expect(loader.isConfigFile('swagger.json')).toBe(false);
            expect(loader.isConfigFile('api-spec.txt')).toBe(false);
        });
    });

    describe('File Loading', () => {
        test('should read local files', () => {
            const loader = new SwaggerLoader('./swagger.json');
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('{"openapi": "3.0.0"}');

            const result = loader.readFromFile('./swagger.json');

            expect(result).toBe('{"openapi": "3.0.0"}');
            expect(fs.readFileSync).toHaveBeenCalledWith('./swagger.json', 'utf8');
        });

        test('should handle missing files', () => {
            const loader = new SwaggerLoader('./missing.json');
            fs.existsSync.mockReturnValue(false);

            expect(() => loader.readFromFile('./missing.json')).toThrow(
                'File not found'
            );
        });

        test('should handle file read errors', () => {
            const loader = new SwaggerLoader('./swagger.json');
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockImplementation(() => {
                throw new Error('Permission denied');
            });

            expect(() => loader.readFromFile('./swagger.json')).toThrow(
                'Failed to read file'
            );
        });
    });

    describe('Content Parsing', () => {
        test('should parse valid JSON', () => {
            const loader = new SwaggerLoader('test');
            const jsonContent = '{"openapi": "3.0.0", "info": {"title": "Test API"}}';

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const result = loader.parseContent(jsonContent);

            expect(result).toEqual({
                openapi: "3.0.0",
                info: { title: "Test API" }
            });
            expect(consoleSpy).toHaveBeenCalledWith('📄 Detected format: JSON');

            consoleSpy.mockRestore();
        });

        test('should parse valid YAML', () => {
            const loader = new SwaggerLoader('test');
            const yamlContent = `
openapi: 3.0.0
info:
  title: Test API
  version: 1.0.0
`;

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const result = loader.parseContent(yamlContent);

            expect(result.openapi).toBe('3.0.0');
            expect(result.info.title).toBe('Test API');
            expect(consoleSpy).toHaveBeenCalledWith('📄 Detected format: YAML');

            consoleSpy.mockRestore();
        });

        test('should handle invalid content', () => {
            const loader = new SwaggerLoader('test');
            const invalidContent = '{ invalid json and: invalid yaml }';

            expect(() => loader.parseContent(invalidContent)).toThrow(
                'Unable to parse content as JSON or YAML'
            );
        });

        test('should prefer JSON over YAML when content is valid for both', () => {
            const loader = new SwaggerLoader('test');
            const ambiguousContent = '{"key": "value"}';

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const result = loader.parseContent(ambiguousContent);

            expect(result).toEqual({ key: 'value' });
            expect(consoleSpy).toHaveBeenCalledWith('📄 Detected format: JSON');

            consoleSpy.mockRestore();
        });
    });

    describe('Config File Processing', () => {
        test('should read OpenAPI config files', () => {
            const loader = new SwaggerLoader('config.yaml');
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(`
inputSpec: https://api.example.com/openapi.json
outputDir: ./src/lib/api-client
generatorName: typescript-axios
`);

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const result = loader.readOpenAPIConfig('config.yaml');

            expect(result.inputSpec).toBe('https://api.example.com/openapi.json');
            expect(result.outputDir).toBe('./src/lib/api-client');
            expect(result.generatorName).toBe('typescript-axios');

            consoleSpy.mockRestore();
        });

        test('should handle missing config files', () => {
            const loader = new SwaggerLoader('missing-config.yaml');
            fs.existsSync.mockReturnValue(false);

            expect(() => loader.readOpenAPIConfig('missing-config.yaml')).toThrow(
                'OpenAPI config file not found'
            );
        });

        test('should handle config files without inputSpec', () => {
            const loader = new SwaggerLoader('invalid-config.yaml');
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(`
outputDir: ./src/lib/api-client
generatorName: typescript-axios
`);

            expect(() => loader.readOpenAPIConfig('invalid-config.yaml')).toThrow(
                'inputSpec not found in OpenAPI config file'
            );
        });
    });

    describe('URL Fetching', () => {
        let mockServer;
        let serverPort;

        beforeAll((done) => {
            mockServer = http.createServer((req, res) => {
                if (req.url === '/api-docs') {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end('{"openapi": "3.0.0", "info": {"title": "Test API"}}');
                } else if (req.url === '/redirect') {
                    res.writeHead(302, { 'Location': `http://localhost:${serverPort}/api-docs` });
                    res.end();
                } else if (req.url === '/timeout') {
                    // Don't respond to simulate timeout
                } else if (req.url === '/error') {
                    res.writeHead(500);
                    res.end('Internal Server Error');
                } else {
                    res.writeHead(404);
                    res.end('Not Found');
                }
            });

            mockServer.listen(0, () => {
                serverPort = mockServer.address().port;
                done();
            });
        });

        afterAll((done) => {
            if (mockServer) {
                mockServer.close(done);
            } else {
                done();
            }
        });

        test('should fetch from valid URLs', async () => {
            const loader = new SwaggerLoader(`http://localhost:${serverPort}/api-docs`);

            const result = await loader.fetchFromUrl(`http://localhost:${serverPort}/api-docs`);

            expect(result).toContain('"openapi": "3.0.0"');
        }, 10000);

        test('should handle HTTP redirects', async () => {
            const loader = new SwaggerLoader(`http://localhost:${serverPort}/redirect`);

            const result = await loader.fetchFromUrl(`http://localhost:${serverPort}/redirect`);

            expect(result).toContain('"openapi": "3.0.0"');
        }, 10000);

        test('should handle HTTP errors', async () => {
            const loader = new SwaggerLoader(`http://localhost:${serverPort}/error`);

            await expect(loader.fetchFromUrl(`http://localhost:${serverPort}/error`))
                .rejects.toThrow('HTTP 500');
        }, 10000);

        test('should handle network timeouts', async () => {
            const loader = new SwaggerLoader(`http://localhost:${serverPort}/timeout`);

            await expect(loader.fetchFromUrl(`http://localhost:${serverPort}/timeout`))
                .rejects.toThrow('timeout');
        }, 20000);

        test('should handle empty responses', async () => {
            const mockEmptyServer = http.createServer((req, res) => {
                res.writeHead(200);
                res.end('');
            });

            const port = await new Promise((resolve) => {
                mockEmptyServer.listen(0, () => resolve(mockEmptyServer.address().port));
            });

            const loader = new SwaggerLoader(`http://localhost:${port}/empty`);

            await expect(loader.fetchFromUrl(`http://localhost:${port}/empty`))
                .rejects.toThrow('Empty response received');

            mockEmptyServer.close();
        }, 10000);
    });
});
/**
 * Refactored Unit tests for UsageTracker.js
 * Using centralized test utilities
 */

const { UsageTracker, createUsageTracker, getUsageTracker } = require('../../src/analytics/UsageTracker.js');
const {
    FileSystemTestHelper,
    AsyncTestHelper,
    ConsoleTestHelper,
    TestDataGenerator,
    EnvironmentTestHelper,
    AssertionHelper
} = require('../test-utils');

// Mock filesystem operations
jest.mock('fs', () => ({
    existsSync: jest.fn(),
    readFileSync: jest.fn(),
    writeFileSync: jest.fn(),
    mkdirSync: jest.fn(),
    promises: {
        mkdir: jest.fn(),
        readdir: jest.fn(),
        readFile: jest.fn(),
        writeFile: jest.fn(),
        unlink: jest.fn(),
        stat: jest.fn()
    }
}));

// Mock os module
jest.mock('os', () => ({
    homedir: jest.fn(() => '/mock/home'),
    platform: jest.fn(() => 'linux'),
    arch: jest.fn(() => 'x64'),
    totalmem: jest.fn(() => 8589934592), // 8GB
    freemem: jest.fn(() => 4294967296), // 4GB
    uptime: jest.fn(() => 86400), // 1 day
    loadavg: jest.fn(() => [0.1, 0.2, 0.3])
}));

describe('UsageTracker', () => {
    let tracker;
    let fsHelper;
    let consoleHelper;
    let envHelper;
    let mockDataDir;

    // Import mocked modules
    const fs = require('fs');
    const os = require('os');

    beforeEach(() => {
        // Initialize test helpers
        fsHelper = new FileSystemTestHelper();
        consoleHelper = new ConsoleTestHelper();
        envHelper = new EnvironmentTestHelper();

        jest.clearAllMocks();

        // Setup mock data directory
        mockDataDir = '/mock/home/.swagger-to-nextjs/analytics';

        // Ensure os module returns proper values
        os.homedir.mockReturnValue('/mock/home');
        os.platform.mockReturnValue('linux');
        os.arch.mockReturnValue('x64');
        os.totalmem.mockReturnValue(8589934592);
        os.freemem.mockReturnValue(4294967296);

        // Setup default file system mocks using native jest mocks
        fs.promises.mkdir.mockResolvedValue(undefined);
        fs.promises.readdir.mockResolvedValue([]);
        fs.promises.readFile.mockRejectedValue(new Error('File not found'));
        fs.promises.writeFile.mockResolvedValue(undefined);
        fs.promises.unlink.mockResolvedValue(undefined);
        fs.promises.stat.mockResolvedValue({
            mtime: new Date(),
            isFile: () => true,
            isDirectory: () => false
        });
        fs.existsSync.mockReturnValue(false);
        fs.mkdirSync.mockReturnValue(undefined);
        fs.writeFileSync.mockReturnValue(undefined);
        fs.readFileSync.mockReturnValue('');

        // Initialize tracker
        tracker = new UsageTracker({
            enabled: false,
            dataDir: mockDataDir,
            flushInterval: 100
        });
    });

    afterEach(async () => {
        // Cleanup
        if (tracker && tracker.flushTimer) {
            tracker._stopFlushTimer();
        }

        consoleHelper.stopCapture();
        envHelper.restore();
        fsHelper.cleanup();
    });

    describe('Constructor', () => {
        test('should create instance with default options', () => {
            const defaultTracker = new UsageTracker({ enabled: false });

            AssertionHelper.assertShape(defaultTracker.options, {
                enabled: false,
                maxFileSize: 1024 * 1024,
                maxFiles: 10,
                anonymize: true,
                retentionDays: 30
            });

            expect(defaultTracker.sessionId).toBeDefined();
            expect(defaultTracker.userId).toBeDefined();
        });

        test('should create instance with custom options', () => {
            const customOptions = {
                enabled: false,
                maxFileSize: 2048,
                maxFiles: 20,
                retentionDays: 60,
                anonymize: false
            };

            const customTracker = new UsageTracker(customOptions);

            AssertionHelper.assertShape(customTracker.options, customOptions);
        });

        test('should initialize privacy settings with defaults', () => {
            AssertionHelper.assertShape(tracker.privacySettings, {
                collectSystemInfo: true,
                collectFileInfo: false,
                collectErrorDetails: true,
                collectPerformanceMetrics: true,
                shareData: false
            });
        });
    });

    describe('Session and User ID Generation', () => {
        test('should generate unique session IDs', () => {
            const tracker1 = new UsageTracker({ enabled: false });
            const tracker2 = new UsageTracker({ enabled: false });

            expect(tracker1.sessionId).toBeDefined();
            expect(tracker2.sessionId).toBeDefined();
            expect(tracker1.sessionId).not.toBe(tracker2.sessionId);
            expect(tracker1.sessionId).toHaveLength(32);
        });

        test('should create user ID when file does not exist', () => {
            fs.existsSync.mockReturnValue(false);

            const newTracker = new UsageTracker({ enabled: false });

            expect(newTracker.userId).toBeDefined();
            expect(newTracker.userId).toHaveLength(32);
            expect(fs.mkdirSync).toHaveBeenCalled();
            expect(fs.writeFileSync).toHaveBeenCalled();
        });

        test('should read existing user ID from file', () => {
            const existingUserId = TestDataGenerator.randomId('user');

            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(existingUserId);

            const newTracker = new UsageTracker({ enabled: false });

            expect(newTracker.userId).toBe(existingUserId);
        });

        test('should handle filesystem errors when creating user ID', () => {
            fs.existsSync.mockReturnValue(false);
            fs.mkdirSync.mockImplementation(() => {
                throw TestDataGenerator.createError('Permission denied', 'EACCES');
            });

            const newTracker = new UsageTracker({ enabled: false });

            expect(newTracker.userId).toBeDefined();
            expect(newTracker.userId).toHaveLength(32);
        });
    });

    describe('Tracking Methods', () => {
        beforeEach(() => {
            tracker.options.enabled = true;
            tracker.isInitialized = true;
        });

        describe('trackGeneration', () => {
            test('should track generation events', () => {
                const details = {
                    duration: 1500,
                    fileSize: 2048,
                    complexity: 5,
                    components: 10
                };

                tracker.trackGeneration('api-client', details);

                AssertionHelper.assertArrayContains(
                    tracker.buffer,
                    event => event.type === 'generation' && event.subtype === 'api-client',
                    1
                );

                const event = tracker.buffer[0];
                AssertionHelper.assertShape(event, {
                    type: 'generation',
                    subtype: 'api-client',
                    details: details,
                    performance: {
                        duration: 1500,
                        fileSize: 2048
                    },
                    sessionId: tracker.sessionId
                });
            });

            test('should not track when disabled', () => {
                tracker.options.enabled = false;

                tracker.trackGeneration('test', { duration: 100 });

                expect(tracker.buffer).toHaveLength(0);
            });

            test('should sanitize sensitive details', () => {
                const details = {
                    apiKey: 'secret-key',
                    password: 'secret-password',
                    normalField: 'normal-value',
                    fileSize: 2048
                };

                tracker.trackGeneration('test', details);

                const event = tracker.buffer[0];
                expect(event.details.apiKey).toBe('[REDACTED]');
                expect(event.details.password).toBe('[REDACTED]');
                expect(event.details.normalField).toBe('normal-value');
                expect(event.details.fileSize).toBe(2048);
            });
        });

        describe('trackPerformance', () => {
            test('should track performance metrics', () => {
                const metadata = { operation: 'parse', fileSize: 1024 };

                tracker.trackPerformance('schema-parsing', 2500, metadata);

                expect(tracker.buffer).toHaveLength(1);
                expect(tracker.metrics.performance).toHaveLength(1);

                const event = tracker.buffer[0];
                AssertionHelper.assertShape(event, {
                    type: 'performance',
                    operation: 'schema-parsing',
                    duration: 2500,
                    metadata: metadata
                });

                expect(event.system).toBeDefined();
            });

            test('should not track when performance collection disabled', () => {
                tracker.privacySettings.collectPerformanceMetrics = false;

                tracker.trackPerformance('test-op', 1000);

                expect(tracker.buffer).toHaveLength(0);
                expect(tracker.metrics.performance).toHaveLength(0);
            });
        });

        describe('trackError', () => {
            test('should track error events', () => {
                const error = TestDataGenerator.createError('Test error message', 'TEST_ERROR');
                const context = { operation: 'parsing', fileName: 'test.json' };

                tracker.trackError(error, context);

                AssertionHelper.assertArrayContains(
                    tracker.buffer,
                    event => event.type === 'error' && event.error.code === 'TEST_ERROR',
                    1
                );

                const event = tracker.buffer[0];
                AssertionHelper.assertShape(event, {
                    type: 'error',
                    error: {
                        name: 'Error',
                        message: 'Test error message',
                        code: 'TEST_ERROR'
                    },
                    context: {
                        operation: 'parsing',
                        fileName: '[PATH_REDACTED]'
                    },
                    frequency: 1
                });
            });

            test('should track error frequency', () => {
                const error1 = TestDataGenerator.createError('Same error');
                const error2 = TestDataGenerator.createError('Same error');
                const error3 = TestDataGenerator.createError('Different error');

                tracker.trackError(error1);
                tracker.trackError(error2);
                tracker.trackError(error3);

                expect(tracker.buffer[0].frequency).toBe(1);
                expect(tracker.buffer[1].frequency).toBe(2);
                expect(tracker.buffer[2].frequency).toBe(1);
            });
        });

        describe('trackEvent', () => {
            test('should track general events', () => {
                const details = { feature: 'code-generation', language: 'typescript' };

                tracker.trackEvent('user-action', 'generate-code', details);

                const event = tracker.buffer[0];
                AssertionHelper.assertShape(event, {
                    type: 'event',
                    category: 'user-action',
                    action: 'generate-code',
                    details: details
                });
            });

            test('should update usage metrics', () => {
                tracker.trackEvent('feature', 'used', { name: 'parser' });
                tracker.trackEvent('feature', 'used', { name: 'generator' });

                const usageMetrics = tracker.metrics.usage;
                expect(usageMetrics.has('feature:used')).toBe(true);
                expect(usageMetrics.get('feature:used').count).toBe(2);
            });
        });
    });

    describe('Privacy Controls', () => {
        beforeEach(() => {
            tracker.options.enabled = true;
            tracker.isInitialized = true;
        });

        describe('updatePrivacySettings', () => {
            test('should update privacy settings', async () => {
                const newSettings = {
                    collectSystemInfo: false,
                    collectFileInfo: true,
                    shareData: true
                };

                await tracker.updatePrivacySettings(newSettings);

                AssertionHelper.assertShape(tracker.privacySettings, {
                    collectSystemInfo: false,
                    collectFileInfo: true,
                    shareData: true,
                    collectErrorDetails: true
                });

                expect(fs.promises.writeFile).toHaveBeenCalled();
            });

            test('should track privacy settings update', async () => {
                await tracker.updatePrivacySettings({ collectSystemInfo: false });

                AssertionHelper.assertArrayContains(
                    tracker.buffer,
                    event => event.category === 'privacy' && event.action === 'settings_updated',
                    1
                );
            });
        });

        describe('getPrivacySettings', () => {
            test('should return copy of privacy settings', () => {
                const settings = tracker.getPrivacySettings();

                expect(settings).toEqual(tracker.privacySettings);
                expect(settings).not.toBe(tracker.privacySettings);
            });
        });

        describe('optOut', () => {
            test('should disable tracking and clear data', async () => {
                tracker.options.enabled = true;
                tracker.buffer = [{ type: 'test' }];

                consoleHelper.startCapture(['log']);
                await tracker.optOut();
                consoleHelper.stopCapture();

                expect(tracker.options.enabled).toBe(false);
                expect(tracker.buffer).toHaveLength(0);

                const logs = consoleHelper.getCaptured('log');
                expect(logs.length).toBeGreaterThan(0);
                const hasMessage = logs.some(args =>
                    args.join(' ').includes('Usage tracking has been disabled')
                );
                expect(hasMessage).toBe(true);
            });
        });
    });

    describe('Data Management', () => {
        beforeEach(() => {
            tracker.options.enabled = true;
            tracker.isInitialized = true;
        });

        describe('getMetrics', () => {
            test('should return metrics summary', () => {
                tracker.sessionStartTime = Date.now() - 5000;

                tracker.trackGeneration('api-client', { duration: 1000 });
                tracker.trackPerformance('parsing', 500);
                tracker.trackError(TestDataGenerator.createError('Test error'));
                tracker.trackEvent('feature', 'used');

                const metrics = tracker.getMetrics();

                AssertionHelper.assertShape(metrics, {
                    generation: expect.any(Object),
                    performance: expect.any(Object),
                    errors: expect.any(Object),
                    usage: expect.any(Object),
                    session: {
                        id: tracker.sessionId,
                        duration: expect.any(Number)
                    }
                });

                expect(metrics.session.duration).toBeGreaterThan(0);
                expect(metrics.session.duration).not.toBeNaN();
            });

            test('should calculate performance statistics', () => {
                const performanceData = [
                    { operation: 'operation1', duration: 100 },
                    { operation: 'operation1', duration: 200 },
                    { operation: 'operation1', duration: 300 },
                    { operation: 'operation2', duration: 150 }
                ];

                performanceData.forEach(({ operation, duration }) => {
                    tracker.trackPerformance(operation, duration);
                });

                const metrics = tracker.getMetrics();
                const perfStats = metrics.performance;

                AssertionHelper.assertShape(perfStats.operation1, {
                    count: 3,
                    min: 100,
                    max: 300,
                    avg: 200,
                    median: 200
                });

                AssertionHelper.assertShape(perfStats.operation2, {
                    count: 1,
                    avg: 150
                });
            });
        });

        describe('exportData', () => {
            test('should export all collected data', async () => {
                const mockFiles = ['usage-2025-05-27-abcd1234.json', 'privacy-settings.json'];
                const mockData = [{ type: 'test', timestamp: Date.now() }];

                fs.promises.readdir.mockResolvedValue(mockFiles);
                fs.promises.readFile.mockImplementation((filepath) => {
                    if (filepath.includes('usage-2025-05-27')) {
                        return Promise.resolve(JSON.stringify(mockData));
                    }
                    return Promise.reject(new Error('Unexpected file read'));
                });

                const exported = await tracker.exportData();

                AssertionHelper.assertShape(exported, {
                    exportDate: expect.any(String),
                    sessionId: tracker.sessionId,
                    userId: tracker.userId,
                    privacySettings: tracker.privacySettings,
                    data: mockData,
                    metrics: expect.any(Object)
                });
            });

            test('should return null when not initialized', async () => {
                tracker.isInitialized = false;

                const exported = await tracker.exportData();

                expect(exported).toBe(null);
            });

            test('should handle export errors gracefully', async () => {
                fs.promises.readdir.mockRejectedValue(
                    TestDataGenerator.createError('Read error', 'EACCES')
                );

                consoleHelper.startCapture(['warn']);
                const exported = await tracker.exportData();
                consoleHelper.stopCapture();

                expect(exported).toBe(null);

                const warnings = consoleHelper.getCaptured('warn');
                expect(warnings.length).toBeGreaterThan(0);
                const hasWarning = warnings.some(args =>
                    args.join(' ').includes('Failed to export data')
                );
                expect(hasWarning).toBe(true);
            });
        });

        describe('flush', () => {
            test('should flush buffer to file', async () => {
                tracker.buffer = TestDataGenerator.generateMockData({
                    type: (i) => `test${i}`,
                    timestamp: () => Date.now()
                }, 2);

                await tracker.flush();

                expect(fs.promises.writeFile).toHaveBeenCalled();
                expect(tracker.buffer).toHaveLength(0);
            });

            test('should merge with existing file data', async () => {
                const existingData = [{ type: 'existing' }];
                const newData = { type: 'new' };

                fs.promises.readFile.mockResolvedValue(
                    JSON.stringify(existingData)
                );

                tracker.buffer = [newData];

                await tracker.flush();

                const writeCall = fs.promises.writeFile.mock.calls[0];
                const writtenData = JSON.parse(writeCall[1]);

                expect(writtenData).toHaveLength(2);
                expect(writtenData[0].type).toBe('existing');
                expect(writtenData[1].type).toBe('new');
            });

            test('should handle flush errors gracefully', async () => {
                fs.promises.writeFile.mockRejectedValue(
                    TestDataGenerator.createError('Write error', 'ENOSPC')
                );

                consoleHelper.startCapture(['warn']);

                tracker.buffer = [{ type: 'test' }];
                await tracker.flush();

                consoleHelper.stopCapture();

                const warnings = consoleHelper.getCaptured('warn');
                expect(warnings.length).toBeGreaterThan(0);
                const hasWarning = warnings.some(args =>
                    args.join(' ').includes('Failed to flush usage data')
                );
                expect(hasWarning).toBe(true);
            });

            test('should not flush empty buffer', async () => {
                tracker.buffer = [];

                await tracker.flush();

                expect(fs.promises.writeFile).not.toHaveBeenCalled();
            });
        });
    });

    describe('System Information', () => {
        test('should return system info when collection enabled', () => {
            tracker.privacySettings.collectSystemInfo = true;

            const systemInfo = tracker.getSystemInfo();

            AssertionHelper.assertShape(systemInfo, {
                platform: 'linux',
                arch: 'x64',
                nodeVersion: process.version,
                memory: {
                    total: 8192,
                    free: 4096
                },
                sessionId: tracker.sessionId
            });
        });

        test('should return privacy message when collection disabled', () => {
            tracker.privacySettings.collectSystemInfo = false;

            const systemInfo = tracker.getSystemInfo();

            expect(systemInfo.message).toBe('System info collection disabled');
            expect(systemInfo.platform).toBeUndefined();
        });
    });

    describe('Data Sanitization', () => {
        beforeEach(() => {
            tracker.options.enabled = true;
            tracker.isInitialized = true;
        });

        test('should sanitize sensitive information', () => {
            const sensitiveData = {
                apiKey: TestDataGenerator.randomString(32),
                password: TestDataGenerator.randomString(16),
                token: `bearer-${TestDataGenerator.randomString(40)}`,
                normalField: 'normal-value',
                auth_header: 'auth-value'
            };

            const sanitized = tracker._sanitizeDetails(sensitiveData);

            expect(sanitized.apiKey).toBe('[REDACTED]');
            expect(sanitized.password).toBe('[REDACTED]');
            expect(sanitized.token).toBe('[REDACTED]');
            expect(sanitized.auth_header).toBe('[REDACTED]');
            expect(sanitized.normalField).toBe('normal-value');
        });

        test('should redact file paths when file info collection disabled', () => {
            tracker.privacySettings.collectFileInfo = false;

            const dataWithPaths = {
                filePath: TestDataGenerator.randomFilePath('json'),
                fileName: 'config.yaml',
                filename: 'test.txt',
                fileSize: 1024,
                fileCount: 5,
                normalField: 'value'
            };

            const sanitized = tracker._sanitizeDetails(dataWithPaths);

            expect(sanitized.filePath).toBe('[PATH_REDACTED]');
            expect(sanitized.fileName).toBe('[PATH_REDACTED]');
            expect(sanitized.filename).toBe('[PATH_REDACTED]');
            expect(sanitized.fileSize).toBe(1024);
            expect(sanitized.fileCount).toBe(5);
            expect(sanitized.normalField).toBe('value');
        });

        test('should anonymize error messages with sensitive data', () => {
            const email = TestDataGenerator.randomEmail();
            const message = `Error in /home/user/secret/file.json with IP 192.168.1.100 and email ${email}`;

            const anonymized = tracker._anonymizeErrorMessage(message);

            expect(anonymized).toBe('Error in [PATH] with IP [IP] and email [EMAIL]');
        });
    });

    describe('Automatic Buffer Management', () => {
        test('should auto-flush when buffer reaches batch size', async () => {
            tracker.options.enabled = true;
            tracker.isInitialized = true;
            tracker.options.batchSize = 2;

            const flushSpy = jest.spyOn(tracker, 'flush').mockResolvedValue();

            tracker.trackEvent('test', 'event1');
            expect(flushSpy).not.toHaveBeenCalled();

            tracker.trackEvent('test', 'event2');

            await AsyncTestHelper.waitFor(
                () => flushSpy.mock.calls.length > 0,
                { timeout: 1000, interval: 10 }
            );

            expect(flushSpy).toHaveBeenCalled();

            flushSpy.mockRestore();
        });
    });

    describe('File Rotation and Cleanup', () => {
        const fs = require('fs');

        beforeEach(() => {
            // Reset mocks for these specific tests
            jest.clearAllMocks();
        });

        test('should cleanup old data files', async () => {
            const oldDate = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000);
            const recentDate = new Date();

            const files = [
                'usage-2025-04-01-old.json',
                'usage-2025-05-27-new.json',
                'privacy-settings.json'
            ];

            fs.promises.readdir.mockResolvedValue(files);
            fs.promises.stat.mockImplementation((filepath) => {
                if (filepath.includes('old')) {
                    return Promise.resolve({ mtime: oldDate });
                }
                return Promise.resolve({ mtime: recentDate });
            });

            await tracker._cleanupOldData();

            AssertionHelper.assertCalledWithPattern(
                fs.promises.unlink,
                [/old\.json$/]
            );
        });

        test('should rotate files when max files exceeded', async () => {
            tracker.options.maxFiles = 2;

            const files = [
                'usage-2025-05-25-old1.json',
                'usage-2025-05-26-old2.json',
                'usage-2025-05-27-new.json',
                'privacy-settings.json'
            ];

            fs.promises.readdir.mockResolvedValue(files);

            await tracker._rotateFiles();

            AssertionHelper.assertCalledWithPattern(
                fs.promises.unlink,
                [/old1\.json$/]
            );
        });
    });
});

describe('Factory Functions', () => {
    test('createUsageTracker should create singleton instance', () => {
        const options = { enabled: false, maxFiles: 5 };
        const tracker1 = createUsageTracker(options);
        const tracker2 = createUsageTracker({ enabled: false, maxFiles: 10 });

        expect(tracker1).toBeInstanceOf(UsageTracker);
        expect(tracker2).toBe(tracker1);
        expect(tracker1.options.maxFiles).toBe(5);
    });

    test('getUsageTracker should return existing instance', () => {
        const tracker = getUsageTracker();

        expect(tracker).toBeInstanceOf(UsageTracker);
        expect(getUsageTracker()).toBe(tracker);
    });
});

describe('Integration Tests', () => {
    let testTracker;
    let consoleHelper;
    const fs = require('fs');
    const os = require('os');

    beforeEach(() => {
        consoleHelper = new ConsoleTestHelper();

        // Ensure mocks are properly set up
        os.homedir.mockReturnValue('/mock/home');
        os.platform.mockReturnValue('linux');
        os.arch.mockReturnValue('x64');
        os.totalmem.mockReturnValue(8589934592);
        os.freemem.mockReturnValue(4294967296);
    });

    afterEach(() => {
        consoleHelper.stopCapture();
    });

    test('should handle complete tracking workflow', async () => {
        testTracker = new UsageTracker({
            enabled: true,
            dataDir: '/tmp/test-analytics',
            batchSize: 5,
            flushInterval: 50
        });

        testTracker.isInitialized = true;

        // Track various events
        testTracker.trackGeneration('api-client', { duration: 1500, complexity: 3 });
        testTracker.trackPerformance('parsing', 800, { fileSize: 2048 });
        testTracker.trackError(TestDataGenerator.createError('Test error'), { context: 'parsing' });
        testTracker.trackEvent('feature', 'used', { name: 'typescript-generation' });

        // Get metrics
        const metrics = testTracker.getMetrics();

        AssertionHelper.assertShape(metrics, {
            generation: expect.any(Object),
            performance: expect.any(Object),
            errors: expect.any(Object),
            usage: expect.any(Object)
        });

        // Test privacy controls
        await testTracker.updatePrivacySettings({ collectSystemInfo: false });
        expect(testTracker.privacySettings.collectSystemInfo).toBe(false);

        // Test system info with privacy setting
        const systemInfo = testTracker.getSystemInfo();
        expect(systemInfo.message).toBe('System info collection disabled');
    });

    test('should handle errors gracefully throughout workflow', async () => {
        consoleHelper.startCapture(['warn']);

        testTracker = new UsageTracker({
            enabled: true,
            dataDir: '/invalid/path'
        });

        // Mock filesystem errors
        fs.promises.mkdir.mockRejectedValue(
            TestDataGenerator.createError('Permission denied', 'EACCES')
        );

        await testTracker._initialize();
        expect(testTracker.options.enabled).toBe(false);

        // Test flush errors
        testTracker.options.enabled = true;
        testTracker.isInitialized = true;
        testTracker.buffer = [{ type: 'test' }];

        fs.promises.writeFile.mockRejectedValue(
            TestDataGenerator.createError('Disk full', 'ENOSPC')
        );

        await testTracker.flush();

        consoleHelper.stopCapture();

        const warnings = consoleHelper.getCaptured('warn');
        expect(warnings.length).toBeGreaterThan(0);

        const hasExpectedWarning = warnings.some(args =>
            args.join(' ').match(/Failed to (initialize|flush)/)
        );
        expect(hasExpectedWarning).toBe(true);
    });
});
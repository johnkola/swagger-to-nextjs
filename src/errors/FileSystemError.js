/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - AI PROMPT
 * ============================================================================
 * FILE: src/errors/FileSystemError.js
 * VERSION: 2025-05-28 15:14:56
 * PHASE: PHASE 2: Core System Components
 * CATEGORY: 🚨 Error Handling System
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 *
 * Build a comprehensive FileSystemError class that:
 * - Handles permission denied scenarios
 * - Provides platform-specific solutions
 * - Includes disk space warnings
 * - Handles path length limitations
 * - Provides file lock information
 * - Suggests alternative locations
 * - Implements recovery strategies
 * - Handles symbolic link issues
 * - Provides cleanup instructions
 * - Integrates with OS-specific error codes
 *
 * ============================================================================
 */

const GeneratorError = require('./GeneratorError');
const os = require('os');
const path = require('path');
const fs = require('fs').promises;

/**
 * FileSystemError - Comprehensive error handling for file system operations
 */
class FileSystemError extends GeneratorError {
    constructor(message, errorCode, details = {}) {
        const code = details.code || FileSystemError._mapErrorCode(errorCode);

        super(message, code, {
            category: 'filesystem',
            recoverable: FileSystemError._isRecoverable(errorCode),
            ...details
        });

        // File system specific properties
        this.path = details.path || null;
        this.operation = details.operation || null;
        this.systemError = details.systemError || errorCode;
        this.errno = details.errno || (errorCode && errorCode.errno);
        this.syscall = details.syscall || (errorCode && errorCode.syscall);

        // Platform information
        this.platform = os.platform();
        this.isWindows = this.platform === 'win32';
        this.isMac = this.platform === 'darwin';
        this.isLinux = this.platform === 'linux';

        // Path analysis
        if (this.path) {
            this.pathInfo = this._analyzePathIssues();
        }

        // Enhanced error details
        this.permissions = details.permissions || null;
        this.diskSpace = details.diskSpace || null;
        this.alternativePaths = [];

        // Generate platform-specific solutions
        this.solutions = this._generateSolutions();

        // Recovery strategies
        this.recoveryStrategies = this._generateRecoveryStrategies();

        // Cleanup instructions
        this.cleanupInstructions = this._generateCleanupInstructions();
    }

    /**
     * Map system error codes to friendly codes
     */
    static _mapErrorCode(errorCode) {
        if (!errorCode) return 'FILE_SYSTEM_ERROR';

        const code = errorCode.code || errorCode;
        const errorMap = {
            'EACCES': 'PERMISSION_DENIED',
            'EEXIST': 'FILE_EXISTS',
            'ENOENT': 'FILE_NOT_FOUND',
            'ENOTDIR': 'NOT_A_DIRECTORY',
            'EISDIR': 'IS_A_DIRECTORY',
            'EMFILE': 'TOO_MANY_OPEN_FILES',
            'ENOSPC': 'NO_DISK_SPACE',
            'EROFS': 'READ_ONLY_FILE_SYSTEM',
            'EBUSY': 'FILE_BUSY',
            'ENOTEMPTY': 'DIRECTORY_NOT_EMPTY',
            'EPERM': 'OPERATION_NOT_PERMITTED',
            'EINVAL': 'INVALID_ARGUMENT',
            'ENAMETOOLONG': 'PATH_TOO_LONG',
            'ELOOP': 'SYMLINK_LOOP',
            'EXDEV': 'CROSS_DEVICE_LINK',
            'EAGAIN': 'RESOURCE_TEMPORARILY_UNAVAILABLE'
        };

        return errorMap[code] || 'FILE_SYSTEM_ERROR';
    }

    /**
     * Check if error is recoverable
     */
    static _isRecoverable(errorCode) {
        const code = errorCode && (errorCode.code || errorCode);
        const recoverableCodes = ['EACCES', 'EBUSY', 'EAGAIN', 'ENOSPC', 'EMFILE'];
        return recoverableCodes.includes(code);
    }

    /**
     * Analyze path-related issues
     */
    _analyzePathIssues() {
        const analysis = {
            absolute: path.isAbsolute(this.path),
            normalized: path.normalize(this.path),
            parsed: path.parse(this.path),
            length: this.path.length,
            depth: this.path.split(path.sep).filter(Boolean).length
        };

        // Check path length limits
        if (this.isWindows) {
            analysis.maxPathLength = 260;
            analysis.exceedsLimit = analysis.length > 260;
            analysis.supportLongPaths = this._checkWindowsLongPathSupport();
        } else {
            analysis.maxPathLength = 4096;
            analysis.exceedsLimit = analysis.length > 4096;
        }

        // Check for problematic characters
        analysis.problematicChars = this._findProblematicCharacters();

        // Check if path is in system directory
        analysis.isSystemPath = this._isSystemPath();

        return analysis;
    }

    /**
     * Check Windows long path support
     */
    _checkWindowsLongPathSupport() {
        // In real implementation, would check registry
        // For now, return based on Node.js version
        const nodeVersion = process.version;
        const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
        return majorVersion >= 10;
    }

    /**
     * Find problematic characters in path
     */
    _findProblematicCharacters() {
        const problematic = [];

        if (this.isWindows) {
            // Windows forbidden characters
            const forbidden = ['<', '>', ':', '"', '|', '?', '*'];
            forbidden.forEach(char => {
                if (this.path.includes(char) && char !== ':') {
                    problematic.push(char);
                }
            });

            // Check for trailing dots or spaces
            if (this.path.endsWith('.') || this.path.endsWith(' ')) {
                problematic.push('trailing dot or space');
            }
        }

        // Check for null bytes
        if (this.path.includes('\0')) {
            problematic.push('null byte');
        }

        return problematic;
    }

    /**
     * Check if path is in system directory
     */
    _isSystemPath() {
        const systemPaths = this.isWindows
            ? ['C:\\Windows', 'C:\\Program Files', process.env.WINDIR]
            : ['/etc', '/usr', '/bin', '/sbin', '/lib', '/var', '/sys', '/proc'];

        return systemPaths.some(sysPath =>
            sysPath && this.path && this.path.startsWith(sysPath)
        );
    }

    /**
     * Generate platform-specific solutions
     */
    _generateSolutions() {
        const solutions = [];

        switch (this.systemError && this.systemError.code) {
            case 'EACCES':
                solutions.push(...this._generatePermissionSolutions());
                break;

            case 'ENOSPC':
                solutions.push(...this._generateDiskSpaceSolutions());
                break;

            case 'ENAMETOOLONG':
                solutions.push(...this._generatePathLengthSolutions());
                break;

            case 'EBUSY':
                solutions.push(...this._generateFileBusySolutions());
                break;

            case 'EMFILE':
                solutions.push(...this._generateTooManyFilesSolutions());
                break;

            case 'ELOOP':
                solutions.push(...this._generateSymlinkSolutions());
                break;
        }

        return solutions;
    }

    /**
     * Generate permission-related solutions
     */
    _generatePermissionSolutions() {
        const solutions = [];

        if (this.isWindows) {
            solutions.push({
                title: 'Run as Administrator',
                command: 'Run your terminal or IDE as Administrator',
                description: 'Right-click on your terminal and select "Run as administrator"'
            });

            solutions.push({
                title: 'Check file ownership',
                command: 'icacls "' + this.path + '"',
                description: 'View current permissions and ownership'
            });

            solutions.push({
                title: 'Grant permissions',
                command: 'icacls "' + this.path + '" /grant %USERNAME%:F',
                description: 'Grant full control to current user'
            });
        } else {
            solutions.push({
                title: 'Check file permissions',
                command: `ls -la "${this.path}"`,
                description: 'View current permissions and ownership'
            });

            solutions.push({
                title: 'Change ownership',
                command: `sudo chown $USER "${this.path}"`,
                description: 'Change file ownership to current user'
            });

            solutions.push({
                title: 'Modify permissions',
                command: `chmod 755 "${this.path}"`,
                description: 'Grant read/write/execute permissions'
            });

            if (this.isMac) {
                solutions.push({
                    title: 'Reset permissions (macOS)',
                    command: `sudo chmod -R 755 "${this.path}"`,
                    description: 'Recursively reset permissions'
                });
            }
        }

        return solutions;
    }

    /**
     * Generate disk space solutions
     */
    _generateDiskSpaceSolutions() {
        const solutions = [];

        solutions.push({
            title: 'Check disk space',
            command: this.isWindows ? 'dir' : 'df -h',
            description: 'View available disk space'
        });

        solutions.push({
            title: 'Clean temporary files',
            command: this.isWindows
                ? 'cleanmgr /sagerun:1'
                : 'rm -rf /tmp/*',
            description: 'Remove temporary files to free space'
        });

        solutions.push({
            title: 'Find large files',
            command: this.isWindows
                ? 'forfiles /S /M * /C "cmd /c if @fsize GEQ 104857600 echo @path @fsize"'
                : 'find . -type f -size +100M',
            description: 'Locate files larger than 100MB'
        });

        // Suggest alternative locations
        this._suggestAlternativeLocations();

        return solutions;
    }

    /**
     * Generate path length solutions
     */
    _generatePathLengthSolutions() {
        const solutions = [];

        if (this.isWindows) {
            solutions.push({
                title: 'Enable long path support',
                command: 'reg add HKLM\\SYSTEM\\CurrentControlSet\\Control\\FileSystem /v LongPathsEnabled /t REG_DWORD /d 1',
                description: 'Enable Windows long path support (requires admin)'
            });

            solutions.push({
                title: 'Use shorter path',
                suggestion: this._generateShorterPath(),
                description: 'Use a path with fewer nested directories'
            });

            solutions.push({
                title: 'Use subst command',
                command: `subst Z: "${path.dirname(this.path)}"`,
                description: 'Create a virtual drive to shorten the path'
            });
        } else {
            solutions.push({
                title: 'Use shorter path',
                suggestion: this._generateShorterPath(),
                description: 'Reduce path depth or use shorter names'
            });
        }

        return solutions;
    }

    /**
     * Generate file busy solutions
     */
    _generateFileBusySolutions() {
        const solutions = [];

        if (this.isWindows) {
            solutions.push({
                title: 'Find locking process',
                command: 'openfiles /query /fo table | findstr /i "' + path.basename(this.path) + '"',
                description: 'Identify which process has the file open'
            });

            solutions.push({
                title: 'Use Handle utility',
                command: 'handle.exe "' + this.path + '"',
                description: 'Use Sysinternals Handle to find locking process'
            });
        } else {
            solutions.push({
                title: 'Find locking process',
                command: `lsof "${this.path}"`,
                description: 'List processes using the file'
            });

            solutions.push({
                title: 'Force unmount',
                command: `fuser -k "${this.path}"`,
                description: 'Kill processes using the file (use with caution)'
            });
        }

        solutions.push({
            title: 'Wait and retry',
            suggestion: 'Wait a few seconds and try again',
            description: 'The file may be temporarily locked'
        });

        return solutions;
    }

    /**
     * Generate too many files solutions
     */
    _generateTooManyFilesSolutions() {
        const solutions = [];

        if (this.isWindows) {
            solutions.push({
                title: 'Increase handle limit',
                suggestion: 'Increase process handle limit in Windows',
                description: 'Requires system configuration changes'
            });
        } else {
            solutions.push({
                title: 'Check current limit',
                command: 'ulimit -n',
                description: 'View current file descriptor limit'
            });

            solutions.push({
                title: 'Increase limit',
                command: 'ulimit -n 4096',
                description: 'Increase file descriptor limit for current session'
            });

            solutions.push({
                title: 'Permanent increase',
                suggestion: 'Add "ulimit -n 4096" to ~/.bashrc or ~/.zshrc',
                description: 'Make the change permanent'
            });
        }

        return solutions;
    }

    /**
     * Generate symlink solutions
     */
    _generateSymlinkSolutions() {
        const solutions = [];

        solutions.push({
            title: 'Check symlink chain',
            command: this.isWindows
                ? `dir /al "${this.path}"`
                : `ls -la "${this.path}"`,
            description: 'View symbolic link information'
        });

        solutions.push({
            title: 'Resolve symlink',
            command: this.isWindows
                ? `fsutil reparsepoint query "${this.path}"`
                : `readlink -f "${this.path}"`,
            description: 'Get the final target of the symlink'
        });

        solutions.push({
            title: 'Remove symlink',
            command: this.isWindows
                ? `del "${this.path}"`
                : `rm "${this.path}"`,
            description: 'Remove the symbolic link'
        });

        return solutions;
    }

    /**
     * Suggest alternative locations
     */
    _suggestAlternativeLocations() {
        const alternatives = [];

        // User home directory
        const homeDir = os.homedir();
        alternatives.push({
            path: path.join(homeDir, 'Documents', 'generated'),
            description: 'User documents folder'
        });

        // Temp directory
        alternatives.push({
            path: path.join(os.tmpdir(), 'swagger-gen'),
            description: 'System temporary directory'
        });

        // Current working directory
        alternatives.push({
            path: path.join(process.cwd(), 'output'),
            description: 'Current working directory'
        });

        // Platform specific
        if (this.isWindows) {
            alternatives.push({
                path: 'C:\\temp\\swagger-gen',
                description: 'Windows temp directory'
            });
        } else {
            alternatives.push({
                path: '/var/tmp/swagger-gen',
                description: 'System var temp directory'
            });
        }

        this.alternativePaths = alternatives;
    }

    /**
     * Generate shorter path suggestion
     */
    _generateShorterPath() {
        if (!this.path) return null;

        const parsed = path.parse(this.path);
        const parts = parsed.dir.split(path.sep).filter(Boolean);

        // Try to shorten directory names
        const shortened = parts.map(part => {
            if (part.length > 8) {
                return part.substring(0, 6) + '~1';
            }
            return part;
        });

        return path.join(...shortened, parsed.base);
    }

    /**
     * Generate recovery strategies
     */
    _generateRecoveryStrategies() {
        const strategies = [];

        strategies.push({
            name: 'retry',
            description: 'Retry the operation after addressing the issue',
            steps: [
                'Identify the specific error from the solutions',
                'Apply the recommended fix',
                'Retry the operation'
            ]
        });

        strategies.push({
            name: 'alternative',
            description: 'Use an alternative location or approach',
            steps: [
                'Choose an alternative path from suggestions',
                'Ensure the alternative location is accessible',
                'Update configuration to use new path'
            ]
        });

        strategies.push({
            name: 'escalate',
            description: 'Escalate privileges if needed',
            steps: [
                'Run with elevated privileges (sudo/admin)',
                'Check if operation succeeds',
                'Consider permission changes for future runs'
            ]
        });

        return strategies;
    }

    /**
     * Generate cleanup instructions
     */
    _generateCleanupInstructions() {
        const instructions = [];

        if (this.operation === 'write' || this.operation === 'create') {
            instructions.push({
                title: 'Remove partial files',
                commands: this._getCleanupCommands(),
                description: 'Clean up any partially written files'
            });
        }

        if (this.systemError && this.systemError.code === 'ENOSPC') {
            instructions.push({
                title: 'Free disk space',
                commands: this._getDiskCleanupCommands(),
                description: 'Commands to free up disk space'
            });
        }

        return instructions;
    }

    /**
     * Get cleanup commands
     */
    _getCleanupCommands() {
        const commands = [];

        if (this.path) {
            if (this.isWindows) {
                commands.push(`del /f "${this.path}"`);
                commands.push(`rmdir /s /q "${path.dirname(this.path)}"`);
            } else {
                commands.push(`rm -f "${this.path}"`);
                commands.push(`rm -rf "${path.dirname(this.path)}"`);
            }
        }

        return commands;
    }

    /**
     * Get disk cleanup commands
     */
    _getDiskCleanupCommands() {
        const commands = [];

        if (this.isWindows) {
            commands.push('cleanmgr /sagerun:1');
            commands.push('del /s /q %temp%\\*');
            commands.push('compact /c /s:C:\\');
        } else {
            commands.push('sudo apt-get clean');
            commands.push('rm -rf ~/.cache/*');
            commands.push('find /tmp -type f -atime +7 -delete');
            commands.push('docker system prune -a');
        }

        return commands;
    }

    /**
     * Check available disk space
     */
    async checkDiskSpace() {
        try {
            const { checkDiskSpace } = await import('check-disk-space');
            const dirname = this.path ? path.dirname(this.path) : process.cwd();
            return await checkDiskSpace(dirname);
        } catch {
            return null;
        }
    }

    /**
     * Override CLI serialization
     */
    _serializeCLI() {
        const parts = [];

        // Error header
        parts.push(`❌ File System Error: ${this.message}`);

        if (this.path) {
            parts.push(`   Path: ${this.path}`);
        }

        if (this.operation) {
            parts.push(`   Operation: ${this.operation}`);
        }

        if (this.systemError && this.systemError.code) {
            parts.push(`   System Error: ${this.systemError.code} - ${this.systemError.message || ''}`);
        }

        // Path analysis
        if (this.pathInfo) {
            if (this.pathInfo.exceedsLimit) {
                parts.push(`   ⚠️  Path length (${this.pathInfo.length}) exceeds limit (${this.pathInfo.maxPathLength})`);
            }

            if (this.pathInfo.problematicChars.length > 0) {
                parts.push(`   ⚠️  Problematic characters: ${this.pathInfo.problematicChars.join(', ')}`);
            }

            if (this.pathInfo.isSystemPath) {
                parts.push(`   ⚠️  Path is in system directory`);
            }
        }

        // Solutions
        if (this.solutions.length > 0) {
            parts.push('\n   💡 Solutions:');
            this.solutions.forEach((solution, index) => {
                parts.push(`   ${index + 1}. ${solution.title}`);
                if (solution.command) {
                    parts.push(`      $ ${solution.command}`);
                }
                if (solution.suggestion) {
                    parts.push(`      → ${solution.suggestion}`);
                }
                parts.push(`      ${solution.description}`);
            });
        }

        // Alternative paths
        if (this.alternativePaths.length > 0) {
            parts.push('\n   📁 Alternative Locations:');
            this.alternativePaths.forEach(alt => {
                parts.push(`   • ${alt.path}`);
                parts.push(`     ${alt.description}`);
            });
        }

        // Recovery strategies
        if (this.recoveryStrategies.length > 0) {
            parts.push('\n   🔄 Recovery Strategies:');
            this.recoveryStrategies.forEach(strategy => {
                parts.push(`   ${strategy.name}: ${strategy.description}`);
                strategy.steps.forEach((step, i) => {
                    parts.push(`     ${i + 1}. ${step}`);
                });
            });
        }

        return parts.join('\n');
    }

    /**
     * Static factory methods
     */
    static permissionDenied(path, operation, options = {}) {
        return new FileSystemError(
            `Permission denied: Cannot ${operation} '${path}'`,
            { code: 'EACCES' },
            { path, operation, ...options }
        );
    }

    static fileNotFound(path, operation, options = {}) {
        return new FileSystemError(
            `File not found: '${path}'`,
            { code: 'ENOENT' },
            { path, operation, ...options }
        );
    }

    static diskFull(path, required, available, options = {}) {
        return new FileSystemError(
            `Insufficient disk space: Required ${required} bytes, available ${available} bytes`,
            { code: 'ENOSPC' },
            {
                path,
                diskSpace: { required, available },
                ...options
            }
        );
    }

    static pathTooLong(path, maxLength, options = {}) {
        return new FileSystemError(
            `Path too long: ${path.length} characters exceeds limit of ${maxLength}`,
            { code: 'ENAMETOOLONG' },
            { path, ...options }
        );
    }

    static fileBusy(path, operation, options = {}) {
        return new FileSystemError(
            `File is busy: '${path}'`,
            { code: 'EBUSY' },
            { path, operation, ...options }
        );
    }
}

module.exports = FileSystemError;
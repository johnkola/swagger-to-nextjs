/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - AI PROMPT
 * ============================================================================
 * FILE: src/core/DirectoryManager.js
 * VERSION: 2025-05-30 11:34:23
 * PHASE: PHASE 2: Core System Components
 * CATEGORY: 🚨 Error Handling System
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 *
 * Create an intelligent DirectoryManager class that:
 * - Creates nested directory structures efficiently 
 * - Handles platform-specific path separators 
 * - Implements atomic file operations 
 * - Provides rollback capabilities 
 * - Checks available disk space 
 * - Manages file permissions appropriately 
 * - Implements safe overwrites with backups 
 * - Provides dry-run capabilities 
 * - Tracks created files for cleanup 
 * - Supports symbolic links and junctions 
 * - Implements file locking for concurrent access
 *
 * ============================================================================
 */
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const os = require('os');
const { promisify } = require('util');
const { exec } = require('child_process');
const execAsync = promisify(exec);
const { EventEmitter } = require('events');

// Platform-specific imports
const { platform } = process;
const isWindows = platform === 'win32';

/**
 * DirectoryManager - Intelligent file system operations manager
 * Handles cross-platform directory/file operations with safety and rollback
 */
class DirectoryManager extends EventEmitter {
    constructor(options = {}) {
        super();

        this.options = {
            dryRun: false,
            backup: true,
            backupDir: '.backups',
            atomic: true,
            preserveTimestamps: true,
            maxRetries: 3,
            retryDelay: 100,
            lockTimeout: 5000,
            checkDiskSpace: true,
            minFreeSpace: 100 * 1024 * 1024, // 100MB minimum
            permissions: {
                directory: 0o755,
                file: 0o644
            },
            ...options
        };

        // Track operations for rollback
        this.operationLog = [];
        this.createdPaths = new Set();
        this.modifiedFiles = new Map();
        this.backupMap = new Map();
        this.locks = new Map();
        this.transactionId = null;
    }

    /**
     * Start a transaction for atomic operations
     */
    async beginTransaction() {
        this.transactionId = crypto.randomBytes(16).toString('hex');
        this.operationLog = [];
        this.emit('transaction:begin', this.transactionId);
        return this.transactionId;
    }

    /**
     * Commit all operations in the transaction
     */
    async commitTransaction() {
        if (!this.transactionId) {
            throw new Error('No active transaction');
        }

        try {
            // Clear operation log on successful commit
            this.operationLog = [];
            const txId = this.transactionId;
            this.transactionId = null;
            this.emit('transaction:commit', txId);
            return true;
        } catch (error) {
            await this.rollbackTransaction();
            throw error;
        }
    }

    /**
     * Rollback all operations in the current transaction
     */
    async rollbackTransaction() {
        if (!this.transactionId) {
            throw new Error('No active transaction');
        }

        const errors = [];

        // Process operations in reverse order
        for (let i = this.operationLog.length - 1; i >= 0; i--) {
            const operation = this.operationLog[i];
            try {
                await this._rollbackOperation(operation);
            } catch (error) {
                errors.push({ operation, error });
            }
        }

        this.operationLog = [];
        const txId = this.transactionId;
        this.transactionId = null;
        this.emit('transaction:rollback', { transactionId: txId, errors });

        if (errors.length > 0) {
            throw new Error(`Rollback completed with ${errors.length} errors`);
        }
    }

    /**
     * Create nested directory structure
     */
    async createDirectory(dirPath, options = {}) {
        const normalizedPath = this._normalizePath(dirPath);
        const mergedOptions = { ...this.options, ...options };

        this._logOperation({
            type: 'CREATE_DIR',
            path: normalizedPath,
            timestamp: new Date()
        });

        if (mergedOptions.dryRun) {
            this.emit('dryRun:createDirectory', normalizedPath);
            return normalizedPath;
        }

        try {
            // Check disk space before creation
            if (mergedOptions.checkDiskSpace) {
                await this._checkDiskSpace(normalizedPath);
            }

            // Create directory with platform-specific handling
            await this._createDirectoryWithRetry(normalizedPath, {
                recursive: true,
                mode: mergedOptions.permissions.directory
            });

            this.createdPaths.add(normalizedPath);
            this.emit('directory:created', normalizedPath);
            return normalizedPath;
        } catch (error) {
            throw this._enhanceError(error, 'CREATE_DIR', normalizedPath);
        }
    }

    /**
     * Create multiple directories efficiently
     */
    async createDirectories(paths, options = {}) {
        const results = [];
        const errors = [];

        for (const dirPath of paths) {
            try {
                const result = await this.createDirectory(dirPath, options);
                results.push({ path: dirPath, success: true, result });
            } catch (error) {
                errors.push({ path: dirPath, error });
                if (!options.continueOnError) {
                    throw error;
                }
            }
        }

        return { results, errors };
    }

    /**
     * Write file with atomic operations and backup
     */
    async writeFile(filePath, content, options = {}) {
        const normalizedPath = this._normalizePath(filePath);
        const mergedOptions = { ...this.options, ...options };

        this._logOperation({
            type: 'WRITE_FILE',
            path: normalizedPath,
            timestamp: new Date()
        });

        if (mergedOptions.dryRun) {
            this.emit('dryRun:writeFile', { path: normalizedPath, size: content.length });
            return normalizedPath;
        }

        try {
            // Ensure directory exists
            await this.createDirectory(path.dirname(normalizedPath), {
                ...mergedOptions,
                checkDiskSpace: false
            });

            // Check disk space
            if (mergedOptions.checkDiskSpace) {
                await this._checkDiskSpace(normalizedPath, content.length);
            }

            // Create backup if file exists
            if (mergedOptions.backup && await this._fileExists(normalizedPath)) {
                await this._createBackup(normalizedPath);
            }

            // Write file atomically
            if (mergedOptions.atomic) {
                await this._writeFileAtomic(normalizedPath, content, mergedOptions);
            } else {
                await fs.writeFile(normalizedPath, content, {
                    mode: mergedOptions.permissions.file,
                    encoding: options.encoding || 'utf8'
                });
            }

            this.createdPaths.add(normalizedPath);
            this.emit('file:written', { path: normalizedPath, size: content.length });
            return normalizedPath;
        } catch (error) {
            throw this._enhanceError(error, 'WRITE_FILE', normalizedPath);
        }
    }

    /**
     * Copy file or directory with preservation options
     */
    async copy(source, destination, options = {}) {
        const srcPath = this._normalizePath(source);
        const destPath = this._normalizePath(destination);
        const mergedOptions = { ...this.options, ...options };

        this._logOperation({
            type: 'COPY',
            source: srcPath,
            destination: destPath,
            timestamp: new Date()
        });

        if (mergedOptions.dryRun) {
            this.emit('dryRun:copy', { source: srcPath, destination: destPath });
            return destPath;
        }

        try {
            const stats = await fs.stat(srcPath);

            if (stats.isDirectory()) {
                await this._copyDirectory(srcPath, destPath, mergedOptions);
            } else {
                await this._copyFile(srcPath, destPath, mergedOptions);
            }

            this.createdPaths.add(destPath);
            this.emit('copy:complete', { source: srcPath, destination: destPath });
            return destPath;
        } catch (error) {
            throw this._enhanceError(error, 'COPY', srcPath);
        }
    }

    /**
     * Move file or directory
     */
    async move(source, destination, options = {}) {
        const srcPath = this._normalizePath(source);
        const destPath = this._normalizePath(destination);
        const mergedOptions = { ...this.options, ...options };

        this._logOperation({
            type: 'MOVE',
            source: srcPath,
            destination: destPath,
            timestamp: new Date()
        });

        if (mergedOptions.dryRun) {
            this.emit('dryRun:move', { source: srcPath, destination: destPath });
            return destPath;
        }

        try {
            // Try rename first (fastest if on same filesystem)
            try {
                await fs.rename(srcPath, destPath);
            } catch (error) {
                // If rename fails, copy then delete
                if (error.code === 'EXDEV') {
                    await this.copy(srcPath, destPath, mergedOptions);
                    await this.remove(srcPath, { ...mergedOptions, backup: false });
                } else {
                    throw error;
                }
            }

            this.createdPaths.add(destPath);
            this.createdPaths.delete(srcPath);
            this.emit('move:complete', { source: srcPath, destination: destPath });
            return destPath;
        } catch (error) {
            throw this._enhanceError(error, 'MOVE', srcPath);
        }
    }

    /**
     * Remove file or directory
     */
    async remove(targetPath, options = {}) {
        const normalizedPath = this._normalizePath(targetPath);
        const mergedOptions = { ...this.options, ...options };

        this._logOperation({
            type: 'REMOVE',
            path: normalizedPath,
            timestamp: new Date()
        });

        if (mergedOptions.dryRun) {
            this.emit('dryRun:remove', normalizedPath);
            return true;
        }

        try {
            if (!await this._fileExists(normalizedPath)) {
                return false;
            }

            // Create backup before removal
            if (mergedOptions.backup) {
                await this._createBackup(normalizedPath);
            }

            const stats = await fs.stat(normalizedPath);

            if (stats.isDirectory()) {
                await fs.rm(normalizedPath, { recursive: true, force: true });
            } else {
                await fs.unlink(normalizedPath);
            }

            this.createdPaths.delete(normalizedPath);
            this.emit('remove:complete', normalizedPath);
            return true;
        } catch (error) {
            throw this._enhanceError(error, 'REMOVE', normalizedPath);
        }
    }

    /**
     * Create symbolic link
     */
    async createSymlink(target, linkPath, options = {}) {
        const targetNorm = this._normalizePath(target);
        const linkNorm = this._normalizePath(linkPath);
        const mergedOptions = { ...this.options, ...options };

        this._logOperation({
            type: 'CREATE_SYMLINK',
            target: targetNorm,
            link: linkNorm,
            timestamp: new Date()
        });

        if (mergedOptions.dryRun) {
            this.emit('dryRun:symlink', { target: targetNorm, link: linkNorm });
            return linkNorm;
        }

        try {
            // Ensure parent directory exists
            await this.createDirectory(path.dirname(linkNorm), mergedOptions);

            // Determine link type
            const type = options.type || (isWindows ? 'junction' : 'file');

            if (isWindows && type === 'junction') {
                // Use junction for directories on Windows
                await this._createJunction(targetNorm, linkNorm);
            } else {
                await fs.symlink(targetNorm, linkNorm, type);
            }

            this.createdPaths.add(linkNorm);
            this.emit('symlink:created', { target: targetNorm, link: linkNorm });
            return linkNorm;
        } catch (error) {
            throw this._enhanceError(error, 'CREATE_SYMLINK', linkNorm);
        }
    }

    /**
     * Lock file for exclusive access
     */
    async lockFile(filePath, options = {}) {
        const normalizedPath = this._normalizePath(filePath);
        const lockPath = `${normalizedPath}.lock`;
        const lockId = crypto.randomBytes(16).toString('hex');
        const timeout = options.timeout || this.options.lockTimeout;

        const startTime = Date.now();
        while (await this._fileExists(lockPath)) {
            if (Date.now() - startTime > timeout) {
                throw new Error(`Lock acquisition timeout for ${normalizedPath}`);
            }
            await this._sleep(50);
        }

        try {
            await fs.writeFile(lockPath, lockId, { flag: 'wx' });
            this.locks.set(normalizedPath, { lockPath, lockId });
            this.emit('file:locked', normalizedPath);
            return lockId;
        } catch (error) {
            if (error.code === 'EEXIST') {
                throw new Error(`File already locked: ${normalizedPath}`);
            }
            throw error;
        }
    }

    /**
     * Unlock file
     */
    async unlockFile(filePath, lockId) {
        const normalizedPath = this._normalizePath(filePath);
        const lockInfo = this.locks.get(normalizedPath);

        if (!lockInfo || lockInfo.lockId !== lockId) {
            throw new Error(`Invalid lock ID for ${normalizedPath}`);
        }

        try {
            await fs.unlink(lockInfo.lockPath);
            this.locks.delete(normalizedPath);
            this.emit('file:unlocked', normalizedPath);
            return true;
        } catch (error) {
            if (error.code === 'ENOENT') {
                this.locks.delete(normalizedPath);
                return false;
            }
            throw error;
        }
    }

    /**
     * Check available disk space
     */
    async checkDiskSpace(targetPath) {
        const normalizedPath = this._normalizePath(targetPath);

        try {
            if (isWindows) {
                return await this._checkDiskSpaceWindows(normalizedPath);
            } else {
                return await this._checkDiskSpaceUnix(normalizedPath);
            }
        } catch (error) {
            // Fallback to Node.js 18+ statfs if available
            if (fs.statfs) {
                const stats = await fs.statfs(normalizedPath);
                return {
                    free: stats.bfree * stats.bsize,
                    available: stats.bavail * stats.bsize,
                    total: stats.blocks * stats.bsize
                };
            }

            throw error;
        }
    }

    /**
     * Get file or directory permissions
     */
    async getPermissions(targetPath) {
        const normalizedPath = this._normalizePath(targetPath);
        const stats = await fs.stat(normalizedPath);

        return {
            mode: stats.mode,
            owner: stats.uid,
            group: stats.gid,
            readable: await this._isReadable(normalizedPath),
            writable: await this._isWritable(normalizedPath),
            executable: await this._isExecutable(normalizedPath)
        };
    }

    /**
     * Set file or directory permissions
     */
    async setPermissions(targetPath, mode, options = {}) {
        const normalizedPath = this._normalizePath(targetPath);
        const mergedOptions = { ...this.options, ...options };

        this._logOperation({
            type: 'SET_PERMISSIONS',
            path: normalizedPath,
            mode,
            timestamp: new Date()
        });

        if (mergedOptions.dryRun) {
            this.emit('dryRun:setPermissions', { path: normalizedPath, mode });
            return true;
        }

        try {
            await fs.chmod(normalizedPath, mode);

            if (options.recursive && (await fs.stat(normalizedPath)).isDirectory()) {
                await this._setPermissionsRecursive(normalizedPath, mode);
            }

            this.emit('permissions:changed', { path: normalizedPath, mode });
            return true;
        } catch (error) {
            throw this._enhanceError(error, 'SET_PERMISSIONS', normalizedPath);
        }
    }

    /**
     * Clean up all created files and directories
     */
    async cleanup(options = {}) {
        const errors = [];
        const cleaned = [];

        // Sort paths by depth (deepest first) for proper cleanup
        const sortedPaths = Array.from(this.createdPaths).sort((a, b) => {
            return b.split(path.sep).length - a.split(path.sep).length;
        });

        for (const createdPath of sortedPaths) {
            try {
                if (await this._fileExists(createdPath)) {
                    await this.remove(createdPath, { ...options, backup: false });
                    cleaned.push(createdPath);
                }
            } catch (error) {
                errors.push({ path: createdPath, error });
            }
        }

        this.createdPaths.clear();
        this.emit('cleanup:complete', { cleaned, errors });

        return { cleaned, errors };
    }

    /**
     * Get operation statistics
     */
    getStats() {
        return {
            createdPaths: this.createdPaths.size,
            modifiedFiles: this.modifiedFiles.size,
            backups: this.backupMap.size,
            activeLocks: this.locks.size,
            operationLog: this.operationLog.length,
            transactionActive: !!this.transactionId
        };
    }

    // Private helper methods

    _normalizePath(inputPath) {
        return path.normalize(inputPath).replace(/\\/g, path.sep);
    }

    _logOperation(operation) {
        if (this.transactionId) {
            this.operationLog.push({
                ...operation,
                transactionId: this.transactionId
            });
        }
    }

    async _rollbackOperation(operation) {
        switch (operation.type) {
            case 'CREATE_DIR':
            case 'WRITE_FILE':
                if (this.createdPaths.has(operation.path)) {
                    await this.remove(operation.path, { backup: false });
                }
                break;

            case 'COPY':
                if (this.createdPaths.has(operation.destination)) {
                    await this.remove(operation.destination, { backup: false });
                }
                break;

            case 'MOVE':
                // Restore from source backup if available
                const backup = this.backupMap.get(operation.source);
                if (backup) {
                    await this.move(backup, operation.source, { backup: false });
                }
                break;

            case 'REMOVE':
                // Restore from backup
                const removedBackup = this.backupMap.get(operation.path);
                if (removedBackup) {
                    await this._restoreBackup(operation.path);
                }
                break;
        }
    }

    async _createDirectoryWithRetry(dirPath, options, attempt = 1) {
        try {
            await fs.mkdir(dirPath, options);
        } catch (error) {
            if (error.code === 'EEXIST') {
                return; // Directory already exists
            }

            if (attempt < this.options.maxRetries) {
                await this._sleep(this.options.retryDelay * attempt);
                return this._createDirectoryWithRetry(dirPath, options, attempt + 1);
            }

            throw error;
        }
    }

    async _fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    async _checkDiskSpace(targetPath, requiredSpace = 0) {
        const space = await this.checkDiskSpace(targetPath);
        const required = requiredSpace + this.options.minFreeSpace;

        if (space.available < required) {
            throw new Error(
                `Insufficient disk space. Required: ${this._formatBytes(required)}, ` +
                `Available: ${this._formatBytes(space.available)}`
            );
        }

        return space;
    }

    async _checkDiskSpaceUnix(targetPath) {
        const { stdout } = await execAsync(`df -k "${targetPath}" | tail -1`);
        const parts = stdout.trim().split(/\s+/);

        return {
            total: parseInt(parts[1]) * 1024,
            used: parseInt(parts[2]) * 1024,
            available: parseInt(parts[3]) * 1024,
            free: parseInt(parts[3]) * 1024
        };
    }

    async _checkDiskSpaceWindows(targetPath) {
        const driveLetter = path.parse(targetPath).root;
        const { stdout } = await execAsync(
            `wmic logicaldisk where "DeviceID='${driveLetter.slice(0, 2)}'" get size,freespace /format:value`
        );

        const values = {};
        stdout.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                values[key.trim().toLowerCase()] = parseInt(value);
            }
        });

        return {
            total: values.size || 0,
            free: values.freespace || 0,
            available: values.freespace || 0,
            used: (values.size || 0) - (values.freespace || 0)
        };
    }

    async _createBackup(filePath) {
        const backupPath = await this._generateBackupPath(filePath);
        const stats = await fs.stat(filePath);

        if (stats.isDirectory()) {
            await this._copyDirectory(filePath, backupPath, { preserveTimestamps: true });
        } else {
            await this._copyFile(filePath, backupPath, { preserveTimestamps: true });
        }

        this.backupMap.set(filePath, backupPath);
        this.emit('backup:created', { original: filePath, backup: backupPath });

        return backupPath;
    }

    async _generateBackupPath(filePath) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const hash = crypto.createHash('md5').update(filePath).digest('hex').slice(0, 8);
        const basename = path.basename(filePath);
        const backupDir = path.join(path.dirname(filePath), this.options.backupDir);

        await this.createDirectory(backupDir, { checkDiskSpace: false });

        return path.join(backupDir, `${basename}.${timestamp}.${hash}`);
    }

    async _restoreBackup(originalPath) {
        const backupPath = this.backupMap.get(originalPath);
        if (!backupPath) {
            throw new Error(`No backup found for ${originalPath}`);
        }

        await this.move(backupPath, originalPath, { backup: false });
        this.backupMap.delete(originalPath);
        this.emit('backup:restored', { original: originalPath, backup: backupPath });
    }

    async _writeFileAtomic(filePath, content, options) {
        const tmpPath = `${filePath}.tmp.${process.pid}.${Date.now()}`;

        try {
            // Write to temporary file
            await fs.writeFile(tmpPath, content, {
                mode: options.permissions.file,
                encoding: options.encoding || 'utf8'
            });

            // Sync to ensure data is written to disk
            const fd = await fs.open(tmpPath, 'r');
            await fd.sync();
            await fd.close();

            // Atomic rename
            await fs.rename(tmpPath, filePath);
        } catch (error) {
            // Clean up temporary file on error
            try {
                await fs.unlink(tmpPath);
            } catch {
                // Ignore cleanup errors
            }
            throw error;
        }
    }

    async _copyFile(source, destination, options) {
        // Ensure destination directory exists
        await this.createDirectory(path.dirname(destination), {
            ...options,
            checkDiskSpace: false
        });

        // Copy file
        await fs.copyFile(source, destination);

        // Preserve timestamps if requested
        if (options.preserveTimestamps) {
            const stats = await fs.stat(source);
            await fs.utimes(destination, stats.atime, stats.mtime);
        }

        // Copy permissions
        const stats = await fs.stat(source);
        await fs.chmod(destination, stats.mode);
    }

    async _copyDirectory(source, destination, options) {
        await this.createDirectory(destination, options);

        const entries = await fs.readdir(source, { withFileTypes: true });

        for (const entry of entries) {
            const srcPath = path.join(source, entry.name);
            const destPath = path.join(destination, entry.name);

            if (entry.isDirectory()) {
                await this._copyDirectory(srcPath, destPath, options);
            } else if (entry.isSymbolicLink()) {
                const target = await fs.readlink(srcPath);
                await this.createSymlink(target, destPath, options);
            } else {
                await this._copyFile(srcPath, destPath, options);
            }
        }

        // Preserve directory timestamps
        if (options.preserveTimestamps) {
            const stats = await fs.stat(source);
            await fs.utimes(destination, stats.atime, stats.mtime);
        }
    }

    async _createJunction(target, junction) {
        if (!isWindows) {
            throw new Error('Junctions are only supported on Windows');
        }

        const { stderr } = await execAsync(`mklink /J "${junction}" "${target}"`);
        if (stderr) {
            throw new Error(`Failed to create junction: ${stderr}`);
        }
    }

    async _setPermissionsRecursive(dirPath, mode) {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);

            if (entry.isDirectory()) {
                await fs.chmod(fullPath, mode);
                await this._setPermissionsRecursive(fullPath, mode);
            } else {
                await fs.chmod(fullPath, mode);
            }
        }
    }

    async _isReadable(filePath) {
        try {
            await fs.access(filePath, fs.constants.R_OK);
            return true;
        } catch {
            return false;
        }
    }

    async _isWritable(filePath) {
        try {
            await fs.access(filePath, fs.constants.W_OK);
            return true;
        } catch {
            return false;
        }
    }

    async _isExecutable(filePath) {
        try {
            await fs.access(filePath, fs.constants.X_OK);
            return true;
        } catch {
            return false;
        }
    }

    _formatBytes(bytes) {
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let size = bytes;
        let unitIndex = 0;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }

    _enhanceError(error, operation, path) {
        const enhanced = new Error(`${operation} failed for ${path}: ${error.message}`);
        enhanced.code = error.code;
        enhanced.operation = operation;
        enhanced.path = path;
        enhanced.originalError = error;

        // Add platform-specific error information
        if (error.code === 'EACCES') {
            enhanced.suggestion = 'Check file permissions or run with elevated privileges';
        } else if (error.code === 'ENOSPC') {
            enhanced.suggestion = 'Free up disk space and try again';
        } else if (error.code === 'EMFILE') {
            enhanced.suggestion = 'Too many open files. Consider increasing ulimit';
        }

        return enhanced;
    }

    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = DirectoryManager;
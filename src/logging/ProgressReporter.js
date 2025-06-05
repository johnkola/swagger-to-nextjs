// src/logging/ProgressReporter.js
const { EventEmitter } = require('events');

/**
 * @class ProgressReporter
 * @extends EventEmitter
 * @description Reports progress for long-running operations with visual feedback
 */
class ProgressReporter extends EventEmitter {
    /**
     * @param {Object} options - Progress reporter options
     * @param {Object} [options.getTime] - Logger instance for output
     * @param {number} [options.total=100] - Total items to process
     * @param {number} [options.barWidth=40] - Width of progress bar
     * @param {boolean} [options.showPercentage=true] - Show percentage
     * @param {boolean} [options.showETA=true] - Show estimated time
     * @param {boolean} [options.showSpeed=true] - Show processing speed
     * @param {boolean} [options.showSpinner=false] - Show spinner animation
     * @param {number} [options.updateInterval=100] - Update interval in ms
     * @param {string|Function} [options.format='default'] - Progress format
     * @param {string} [options.barCompleteChar='█'] - Completed bar character
     * @param {string} [options.barIncompleteChar='░'] - Incomplete bar character
     * @param {string} [options.speedUnit='items/s'] - Speed unit label
     * @param {Array} [options.spinner] - Custom spinner frames
     * @param {Array} [options.logMilestones] - Percentage milestones to log
     * @param {Object} [options.logger] - Logger instance for output
     */
    constructor(options = {}) {
        super();
        options.getTime = undefined;
        // Validate total
        if (options.total !== undefined && options.total <= 0) {
            throw new Error('Total must be greater than 0');
        }

        // Basic properties
        this.total = options.total || 100;
        this.current = 0;
        this.percentage = 0;

        // Display options
        this.barWidth = options.barWidth || 40;
        this.showPercentage = options.showPercentage !== false;
        this.showETA = options.showETA !== false;
        this.showSpeed = options.showSpeed !== false;
        this.showSpinner = options.showSpinner || false;

        // Formatting
        this.format = options.format || 'default';
        this.barCompleteChar = options.barCompleteChar || '█';
        this.barIncompleteChar = options.barIncompleteChar || '░';
        this.speedUnit = options.speedUnit || 'items/s';

        // Spinner animation
        this.spinner = options.spinner || ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        this.spinnerIndex = 0;

        // Timing
        this.updateInterval = options.updateInterval || 100;
        this.startTime = null;
        this.endTime = null;
// State
        this.isRunning = false;
        this.message = '';
        this.renderInterval = null;

        // Speed calculation
        this.speed = 0;
        this.eta = Infinity;

        // Environment detection
        this.isInteractive = this._detectInteractive();

        // Non-interactive options
        this.logMilestones = options.logMilestones || [];
        this.lastMilestone = 0;

        // External logger
        this.logger = options.logger;

        // For testing with fake timers
        this._getTime = options.getTime || (() => Date.now());
    }

    /**
     * Detect if running in an interactive environment
     * @private
     */
    _detectInteractive() {
        // Check if stdout exists and is TTY, and not in CI
        return !!(process.stdout && process.stdout.isTTY && !process.env.CI);
    }

    /**
     * Start progress reporting
     * @param {string} [message] - Initial message
     */
    start(message = '') {
        if (this.isRunning) return;

        this.isRunning = true;
        this.startTime = this._getTime();
        this.endTime = null;
        this.message = message;
        this.current = 0;
        this.percentage = 0;
        this.speed = 0;
        this.eta = Infinity;

        if (this.logger && message) {
            this.logger.info(message);
        }

        if (this.isInteractive) {
            // Set up interval for renders
            this.renderInterval = setInterval(() => this._render(), this.updateInterval);
            // Immediate initial render
            this._render();
        }

        this.emit('start', { total: this.total, message });
    }

    /**
     * Update progress
     * @param {number} current - Current progress value
     */
    update(current) {
        // Clamp to valid range
        current = Math.max(0, Math.min(current, this.total));

        this.current = current;
        this.percentage = this.total > 0 ? current / this.total : 0;

        // Calculate speed and ETA
        this._calculateSpeed();
        this._calculateETA();

        // Check for milestones in non-interactive mode
        if (!this.isInteractive && this.logMilestones.length > 0) {
            this._checkMilestones();
        }

        // Emit progress event
        this.emit('progress', {
            current: this.current,
            total: this.total,
            percentage: this.percentage
        });

        // Check for completion
        if (this.current >= this.total) {
            this._complete();
        }
    }

    /**
     * Increment progress by delta
     * @param {number} [delta=1] - Amount to increment
     */
    increment(delta = 1) {
        this.update(this.current + delta);
    }

    /**
     * Set progress message
     * @param {string} message - New message
     */
    setMessage(message) {
        this.message = message;
    }

    /**
     * Stop progress reporting
     */
    stop() {
        if (!this.isRunning) return;

        this.isRunning = false;
        this.endTime = this._getTime();

        if (this.renderInterval) {
            clearInterval(this.renderInterval);
            this.renderInterval = null;
        }

        if (this.isInteractive) {
            this._clearLine();
        }

        const duration = this.endTime - this.startTime;

        if (this.logger) {
            this.logger.info(`Complete in ${this._formatTime(duration / 1000)}`);
        }

        this.emit('stop', { duration });
    }

    /**
     * Reset progress
     */
    reset() {
        this.stop();
        this.current = 0;
        this.percentage = 0;
        this.startTime = null;
        this.endTime = null;
        this.speed = 0;
        this.eta = Infinity;
        this.lastMilestone = 0;
    }

    /**
     * Calculate current speed
     * @private
     */
    _calculateSpeed() {
        if (!this.startTime || this.current === 0) {
            this.speed = 0;
            return;
        }

        const elapsed = (this._getTime() - this.startTime) / 1000; // seconds
        this.speed = elapsed > 0 ? this.current / elapsed : 0;
    }

    /**
     * Calculate ETA
     * @private
     */
    _calculateETA() {
        if (this.speed === 0 || this.current >= this.total) {
            this.eta = Infinity;
            return;
        }

        const remaining = this.total - this.current;
        this.eta = remaining / this.speed;
    }

    /**
     * Check and log milestones
     * @private
     */
    _checkMilestones() {
        const currentPercentage = Math.floor(this.percentage * 100);

        for (const milestone of this.logMilestones) {
            if (currentPercentage >= milestone && this.lastMilestone < milestone) {
                console.log(`Progress: ${milestone}% complete`);
                this.lastMilestone = milestone;
            }
        }
    }

    /**
     * Handle completion
     * @private
     */
    _complete() {
        const duration = this._getTime() - this.startTime;

        this.emit('complete', {
            total: this.total,
            duration
        });

        this.stop();
    }

    /**
     * Render progress bar
     * @private
     */
    _render() {
        if (!this.isRunning || !this.isInteractive) return;

        try {
            const output = this._format();
            this._clearLine();
            process.stdout.write(output);
        } catch (error) {
            this.emit('error', error);
        }
    }

    /**
     * Format progress output
     * @private
     */
    _format() {
        if (typeof this.format === 'function') {
            return this.format({
                current: this.current,
                total: this.total,
                percentage: this.percentage,
                speed: this.speed,
                eta: this.eta,
                message: this.message
            });
        }

        switch (this.format) {
            case 'minimal':
                return this._formatMinimal();
            case 'detailed':
                return this._formatDetailed();
            default:
                return this._formatDefault();
        }
    }

    /**
     * Default format
     * @private
     */
    _formatDefault() {
        const parts = [];

        // Spinner
        if (this.showSpinner) {
            parts.push(this.spinner[this.spinnerIndex]);
            this.spinnerIndex = (this.spinnerIndex + 1) % this.spinner.length;
        }

        // Message
        if (this.message) {
            parts.push(this.message);
        }

        // Progress bar
        parts.push(this._renderBar());

        // Percentage
        if (this.showPercentage) {
            parts.push(`${Math.floor(this.percentage * 100)}%`);
        }

        // Speed
        if (this.showSpeed && this.speed > 0) {
            parts.push(`${this.speed.toFixed(1)} ${this.speedUnit}`);
        }

        // ETA
        if (this.showETA && this.eta !== Infinity) {
            parts.push(`ETA: ${this._formatTime(this.eta)}`);
        }

        return parts.join(' ');
    }

    /**
     * Minimal format
     * @private
     */
    _formatMinimal() {
        return `${Math.floor(this.percentage * 100)}%`;
    }

    /**
     * Detailed format
     * @private
     */
    _formatDetailed() {
        const parts = [
            this._formatDefault(),
            `[${this.current}/${this.total}]`
        ];

        if (this.startTime) {
            const elapsed = (this._getTime() - this.startTime) / 1000;
            parts.push(`Elapsed: ${this._formatTime(elapsed)}`);
        }

        return parts.join(' ');
    }

    /**
     * Render progress bar
     * @private
     */
    _renderBar() {
        const complete = Math.floor(this.barWidth * this.percentage);
        const incomplete = this.barWidth - complete;

        const bar =
            this.barCompleteChar.repeat(complete) +
            this.barIncompleteChar.repeat(incomplete);

        return `[${bar}]`;
    }

    /**
     * Format time in human-readable format
     * @private
     */
    _formatTime(seconds) {
        if (seconds === Infinity || isNaN(seconds)) {
            return '--';
        }

        // Handle negative values
        if (seconds < 0) {
            return '0s';
        }

        if (seconds === Infinity || isNaN(seconds)) {
            return '--';
        }

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        const parts = [];

        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

        return parts.join(' ');
    }

    /**
     * Clear the current line
     * @private
     */
    _clearLine() {
        if (process.stdout.clearLine && process.stdout.cursorTo) {
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
        }
    }

    /**
     * Get current progress state
     * @returns {Object} Progress state
     */
    getState() {
        return {
            current: this.current,
            total: this.total,
            percentage: this.percentage,
            speed: this.speed,
            eta: this.eta,
            isRunning: this.isRunning,
            startTime: this.startTime,
            endTime: this.endTime
        };
    }

    addListener(eventName, listener) {
        return undefined;
    }

    emit(eventName, ...args) {
        return false;
    }

    eventNames() {
        return undefined;
    }

    getMaxListeners() {
        return 0;
    }

    listenerCount(eventName, listener) {
        return 0;
    }

    listeners(eventName) {
        return undefined;
    }

    off(eventName, listener) {
        return undefined;
    }

    on(eventName, listener) {
        return undefined;
    }

    once(eventName, listener) {
        return undefined;
    }

    prependListener(eventName, listener) {
        return undefined;
    }

    prependOnceListener(eventName, listener) {
        return undefined;
    }

    rawListeners(eventName) {
        return undefined;
    }

    removeAllListeners(eventName) {
        return undefined;
    }

    removeListener(eventName, listener) {
        return undefined;
    }

    setMaxListeners(n) {
        return undefined;
    }
}

module.exports = ProgressReporter;
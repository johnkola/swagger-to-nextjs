/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - AI PROMPT
 * ============================================================================
 * FILE: src/logging/ProgressReporter.js
 * VERSION: 2025-05-30 11:34:23
 * PHASE: PHASE 2: Core System Components
 * CATEGORY: 📊 Logging System
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 *
 * Build an advanced progress reporting system that:
 * - Implements multiple progress bar styles
 * - Supports nested progress tracking
 * - Provides ETA calculations
 * - Implements smooth animations
 * - Supports concurrent progress bars
 * - Provides detailed step descriptions
 * - Implements progress persistence
 * - Supports headless mode for CI/CD
 * - Provides progress webhooks
 * - Implements adaptive update rates
 *
 * ============================================================================
 */

const { EventEmitter } = require('events');
const chalk = require('chalk');
const cliProgress = require('cli-progress');
const { format } = require('date-fns');
const fs = require('fs-extra');
const path = require('path');

// Handle ora import (might be ESM)
let ora;
try {
    ora = require('ora');
    if (ora.default) ora = ora.default;
} catch (e) {
    // Fallback if ora fails
    ora = (options) => ({
        start: function(text) {
            this.text = text || options.text;
            console.log(`⏳ ${this.text}`);
            return this;
        },
        succeed: function(text) {
            console.log(`✅ ${text || this.text}`);
            return this;
        },
        fail: function(text) {
            console.log(`❌ ${text || this.text}`);
            return this;
        },
        stop: function() {
            return this;
        },
        text: ''
    });
}

/**
 * Progress bar styles
 */
const PROGRESS_STYLES = {
    default: {
        format: '{bar} | {percentage}% | {value}/{total} | {step}',
        barCompleteChar: '█',
        barIncompleteChar: '░',
        barsize: 40
    },
    minimal: {
        format: '{percentage}% | {step}',
        barCompleteChar: '●',
        barIncompleteChar: '○',
        barsize: 20
    },
    detailed: {
        format: '[{bar}] {percentage}% | {value}/{total} | ETA: {eta}s | {step} | {duration}s',
        barCompleteChar: '=',
        barIncompleteChar: '-',
        barsize: 50
    },
    fancy: {
        format: '{spinner} {bar} {percentage}% | {step}',
        barCompleteChar: '▓',
        barIncompleteChar: '░',
        barsize: 30
    },
    dots: {
        format: '{dots} {percentage}% | {step}',
        barCompleteChar: '⬤',
        barIncompleteChar: '○',
        barsize: 10
    }
};

/**
 * Animation frames for spinners
 */
const SPINNERS = {
    dots: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
    line: ['―', '\\', '|', '/'],
    circle: ['◐', '◓', '◑', '◒'],
    box: ['▖', '▘', '▝', '▗'],
    arrow: ['←', '↖', '↑', '↗', '→', '↘', '↓', '↙'],
    bounce: ['⠁', '⠂', '⠄', '⡀', '⢀', '⠠', '⠐', '⠈']
};

/**
 * ETA calculator
 */
class ETACalculator {
    constructor(windowSize = 10) {
        this.windowSize = windowSize;
        this.samples = [];
        this.startTime = Date.now();
        this.lastUpdate = this.startTime;
    }

    update(current, total) {
        const now = Date.now();
        const elapsed = now - this.lastUpdate;

        if (elapsed > 0) {
            const rate = 1 / (elapsed / 1000);
            this.samples.push({ time: now, rate, current });

            // Keep only recent samples
            if (this.samples.length > this.windowSize) {
                this.samples.shift();
            }
        }

        this.lastUpdate = now;

        return this.calculate(current, total);
    }

    calculate(current, total) {
        if (this.samples.length < 2 || current === 0) {
            return Infinity;
        }

        // Calculate average rate
        const recentSamples = this.samples.slice(-5);
        const timeSpan = recentSamples[recentSamples.length - 1].time - recentSamples[0].time;
        const progress = recentSamples[recentSamples.length - 1].current - recentSamples[0].current;

        if (timeSpan === 0 || progress === 0) {
            return Infinity;
        }

        const rate = progress / (timeSpan / 1000);
        const remaining = total - current;

        return remaining / rate;
    }

    getDuration() {
        return (Date.now() - this.startTime) / 1000;
    }
}

/**
 * Progress state manager
 */
class ProgressState {
    constructor(id, total, options = {}) {
        this.id = id;
        this.total = total;
        this.current = 0;
        this.step = '';
        this.startTime = Date.now();
        this.lastUpdate = this.startTime;
        this.eta = new ETACalculator();
        this.options = options;
        this.children = new Map();
        this.parentId = null;
    }

    update(current, step) {
        this.current = Math.min(current, this.total);
        this.step = step || this.step;
        this.lastUpdate = Date.now();

        const etaSeconds = this.eta.update(this.current, this.total);

        return {
            percentage: Math.round((this.current / this.total) * 100),
            eta: etaSeconds === Infinity ? '?' : Math.round(etaSeconds),
            duration: this.eta.getDuration()
        };
    }

    isComplete() {
        return this.current >= this.total;
    }
}

/**
 * Progress bar renderer
 */
class ProgressRenderer {
    constructor(style = 'default', options = {}) {
        this.style = { ...PROGRESS_STYLES[style], ...options };
        this.multibar = null;
        this.bars = new Map();
        this.spinnerFrame = 0;
        this.isCI = process.env.CI || !process.stdout.isTTY;

        if (!this.isCI && options.concurrent) {
            this.multibar = new cliProgress.MultiBar({
                clearOnComplete: false,
                hideCursor: true,
                format: this.formatBar.bind(this),
                barsize: this.style.barsize
            }, cliProgress.Presets.shades_classic);
        }
    }

    formatBar(options, params, payload) {
        let format = this.style.format;

        // Replace tokens
        const tokens = {
            bar: options.barCompleteString + options.barIncompleteString,
            percentage: Math.round(params.progress * 100),
            value: params.value,
            total: params.total,
            step: payload.step || '',
            eta: payload.eta || '?',
            duration: Math.round(payload.duration || 0),
            spinner: this.getSpinnerFrame(payload.spinnerId),
            dots: this.getDotsProgress(params.progress)
        };

        for (const [key, value] of Object.entries(tokens)) {
            format = format.replace(`{${key}}`, value);
        }

        // Apply colors
        if (params.progress === 1) {
            return chalk.green(format);
        } else if (params.progress > 0.7) {
            return chalk.yellow(format);
        }

        return format;
    }

    getSpinnerFrame(spinnerId = 'dots') {
        const frames = SPINNERS[spinnerId] || SPINNERS.dots;
        return frames[this.spinnerFrame % frames.length];
    }

    getDotsProgress(progress) {
        const filled = Math.round(progress * 10);
        return '●'.repeat(filled) + '○'.repeat(10 - filled);
    }

    createBar(id, total, options = {}) {
        if (this.isCI) {
            return null;
        }

        if (this.multibar) {
            const bar = this.multibar.create(total, 0, {
                step: '',
                spinnerId: options.spinner || 'dots'
            });
            this.bars.set(id, bar);
            return bar;
        }

        // Single bar mode
        const bar = new cliProgress.SingleBar({
            format: this.formatBar.bind(this),
            barCompleteChar: this.style.barCompleteChar,
            barIncompleteChar: this.style.barIncompleteChar,
            barsize: this.style.barsize,
            hideCursor: true
        });

        bar.start(total, 0, { step: '' });
        this.bars.set(id, bar);
        return bar;
    }

    updateBar(id, current, payload) {
        const bar = this.bars.get(id);
        if (bar) {
            bar.update(current, payload);
        }
    }

    removeBar(id) {
        const bar = this.bars.get(id);
        if (bar) {
            if (this.multibar) {
                this.multibar.remove(bar);
            } else {
                bar.stop();
            }
            this.bars.delete(id);
        }
    }

    stop() {
        if (this.multibar) {
            this.multibar.stop();
        } else {
            for (const bar of this.bars.values()) {
                bar.stop();
            }
        }
        this.bars.clear();
    }

    incrementSpinner() {
        this.spinnerFrame++;
    }
}

/**
 * Main ProgressReporter class
 */
class ProgressReporter extends EventEmitter {
    constructor(options = {}) {
        super();

        this.options = {
            style: 'default',
            concurrent: true,
            persistence: false,
            persistFile: '.progress.json',
            webhookUrl: null,
            webhookInterval: 5000,
            updateRate: 100, // ms
            headless: process.env.CI || !process.stdout.isTTY,
            ...options
        };

        this.states = new Map();
        this.renderer = new ProgressRenderer(this.options.style, {
            concurrent: this.options.concurrent
        });

        this.updateTimer = null;
        this.webhookTimer = null;
        this.spinners = new Map();

        // Load persisted state
        if (this.options.persistence) {
            this.loadState();
        }

        // Start webhook reporter
        if (this.options.webhookUrl) {
            this.startWebhookReporter();
        }

        // Start update loop
        this.startUpdateLoop();
    }

    /**
     * Create a new progress bar
     */
    create(id, total = 100, options = {}) {
        if (typeof id === 'string' && typeof total === 'object' && !options) {
            // Handle create(name) pattern from CLI
            options = total;
            total = 100;
        }

        if (this.states.has(id)) {
            // Return existing progress
            return this.getProgress(id);
        }

        const state = new ProgressState(id, total, options);
        this.states.set(id, state);

        // Create visual bar
        if (!this.options.headless) {
            this.renderer.createBar(id, total, options);
        }

        // Emit event
        this.emit('progress:start', {
            id,
            total,
            timestamp: new Date()
        });

        // Return progress control object
        return this.getProgress(id);
    }

    /**
     * Get progress control object
     */
    getProgress(id) {
        const self = this;
        return {
            start: (text) => {
                const state = self.states.get(id);
                if (state) {
                    state.step = text;
                    self.update(id, state.current, text);
                }
            },
            succeed: (text) => {
                const state = self.states.get(id);
                if (state) {
                    state.step = text || state.step;
                    self.update(id, state.total, state.step);
                    console.log(chalk.green('✓'), text || state.step);
                    self.complete(id);
                }
            },
            fail: (text) => {
                const state = self.states.get(id);
                if (state) {
                    console.log(chalk.red('✗'), text || state.step);
                    self.complete(id);
                }
            },
            update: (current, text) => {
                self.update(id, current, text);
            },
            increment: (text) => {
                self.increment(id, text);
            }
        };
    }

    /**
     * Create nested progress
     */
    createNested(parentId, id, total, options = {}) {
        const parent = this.states.get(parentId);
        if (!parent) {
            throw new Error(`Parent progress ${parentId} not found`);
        }

        this.create(id, total, options);

        const child = this.states.get(id);
        child.parentId = parentId;
        parent.children.set(id, child);

        return this;
    }

    /**
     * Update progress
     */
    update(id, current, step) {
        const state = this.states.get(id);
        if (!state) {
            // Silently ignore if progress doesn't exist
            return this;
        }

        const stats = state.update(current, step);

        // Update visual bar
        if (!this.options.headless) {
            this.renderer.updateBar(id, current, {
                step: step || state.step,
                eta: stats.eta,
                duration: stats.duration
            });
        }

        // Update parent progress
        if (state.parentId) {
            this.updateParent(state.parentId);
        }

        // Emit event
        this.emit('progress:update', {
            id,
            current,
            total: state.total,
            percentage: stats.percentage,
            step,
            timestamp: new Date()
        });

        // Check completion
        if (state.isComplete()) {
            this.complete(id);
        }

        // Persist state
        if (this.options.persistence) {
            this.saveState();
        }

        return this;
    }

    /**
     * Increment progress
     */
    increment(id, step) {
        const state = this.states.get(id);
        if (!state) {
            return this;
        }

        return this.update(id, state.current + 1, step);
    }

    /**
     * Update parent based on children
     */
    updateParent(parentId) {
        const parent = this.states.get(parentId);
        if (!parent || parent.children.size === 0) {
            return;
        }

        let totalProgress = 0;
        for (const child of parent.children.values()) {
            totalProgress += (child.current / child.total);
        }

        const avgProgress = totalProgress / parent.children.size;
        const parentCurrent = Math.round(avgProgress * parent.total);

        parent.current = parentCurrent;

        if (!this.options.headless) {
            const stats = parent.eta.update(parentCurrent, parent.total);
            this.renderer.updateBar(parentId, parentCurrent, {
                step: parent.step,
                eta: stats.eta,
                duration: stats.duration
            });
        }
    }

    /**
     * Complete progress
     */
    complete(id) {
        const state = this.states.get(id);
        if (!state) {
            return;
        }

        // Remove visual bar
        if (!this.options.headless) {
            this.renderer.removeBar(id);
        }

        // Emit event
        this.emit('progress:complete', {
            id,
            duration: (Date.now() - state.startTime) / 1000,
            timestamp: new Date()
        });

        // Remove from parent
        if (state.parentId) {
            const parent = this.states.get(state.parentId);
            if (parent) {
                parent.children.delete(id);
            }
        }

        // Clean up children
        for (const childId of state.children.keys()) {
            this.complete(childId);
        }

        this.states.delete(id);

        // Save state
        if (this.options.persistence) {
            this.saveState();
        }
    }

    /**
     * Create a spinner
     */
    spinner(id, text, options = {}) {
        if (this.options.headless) {
            console.log(`[${id}] ${text}`);
            return {
                update: (newText) => console.log(`[${id}] ${newText}`),
                success: (finalText) => console.log(`[${id}] ✓ ${finalText || text}`),
                fail: (finalText) => console.log(`[${id}] ✗ ${finalText || text}`),
                stop: () => {}
            };
        }

        const spinner = ora({
            text,
            spinner: options.spinner || 'dots',
            ...options
        }).start();

        this.spinners.set(id, spinner);

        return {
            update: (newText) => { spinner.text = newText; },
            success: (finalText) => {
                spinner.succeed(finalText);
                this.spinners.delete(id);
            },
            fail: (finalText) => {
                spinner.fail(finalText);
                this.spinners.delete(id);
            },
            stop: () => {
                spinner.stop();
                this.spinners.delete(id);
            }
        };
    }

    /**
     * Update loop for smooth animations
     */
    startUpdateLoop() {
        this.updateTimer = setInterval(() => {
            this.renderer.incrementSpinner();

            // Force re-render for animations
            for (const [id, state] of this.states) {
                if (!state.isComplete()) {
                    this.renderer.updateBar(id, state.current, {
                        step: state.step,
                        eta: state.eta.calculate(state.current, state.total),
                        duration: state.eta.getDuration()
                    });
                }
            }
        }, this.options.updateRate);
    }

    /**
     * Webhook reporter
     */
    startWebhookReporter() {
        this.webhookTimer = setInterval(async () => {
            const report = this.getReport();

            try {
                const fetch = global.fetch || require('node-fetch');
                await fetch(this.options.webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(report)
                });
            } catch (error) {
                this.emit('error', error);
            }
        }, this.options.webhookInterval);
    }

    /**
     * Get progress report
     */
    getReport() {
        const report = {
            timestamp: new Date(),
            progress: []
        };

        for (const [id, state] of this.states) {
            report.progress.push({
                id,
                current: state.current,
                total: state.total,
                percentage: Math.round((state.current / state.total) * 100),
                step: state.step,
                duration: (Date.now() - state.startTime) / 1000,
                eta: state.eta.calculate(state.current, state.total),
                children: Array.from(state.children.keys())
            });
        }

        return report;
    }

    /**
     * Save state to file
     */
    async saveState() {
        const state = {
            version: 1,
            timestamp: new Date(),
            progress: {}
        };

        for (const [id, progressState] of this.states) {
            state.progress[id] = {
                current: progressState.current,
                total: progressState.total,
                step: progressState.step,
                startTime: progressState.startTime,
                parentId: progressState.parentId,
                children: Array.from(progressState.children.keys())
            };
        }

        await fs.writeJson(this.options.persistFile, state, { spaces: 2 });
    }

    /**
     * Load state from file
     */
    async loadState() {
        try {
            if (await fs.pathExists(this.options.persistFile)) {
                const state = await fs.readJson(this.options.persistFile);

                // Restore progress bars
                for (const [id, data] of Object.entries(state.progress)) {
                    this.create(id, data.total);
                    this.update(id, data.current, data.step);
                }

                // Restore parent-child relationships
                for (const [id, data] of Object.entries(state.progress)) {
                    if (data.parentId) {
                        const progressState = this.states.get(id);
                        const parent = this.states.get(data.parentId);
                        if (progressState && parent) {
                            progressState.parentId = data.parentId;
                            parent.children.set(id, progressState);
                        }
                    }
                }
            }
        } catch (error) {
            this.emit('error', error);
        }
    }

    /**
     * Clear all progress
     */
    clear() {
        for (const id of this.states.keys()) {
            this.complete(id);
        }
    }

    /**
     * Destroy reporter
     */
    destroy() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
        }

        if (this.webhookTimer) {
            clearInterval(this.webhookTimer);
        }

        for (const spinner of this.spinners.values()) {
            spinner.stop();
        }

        this.renderer.stop();
        this.clear();

        if (this.options.persistence) {
            fs.removeSync(this.options.persistFile);
        }
    }
}

/**
 * Create a progress reporter instance
 */
const createProgressReporter = (options = {}) => {
    return new ProgressReporter(options);
};

// CommonJS exports
module.exports = ProgressReporter;
module.exports.ProgressReporter = ProgressReporter;
module.exports.createProgressReporter = createProgressReporter;
module.exports.default = ProgressReporter;
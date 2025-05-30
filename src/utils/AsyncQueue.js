/**
 * AsyncQueue - A utility for managing asynchronous operations in sequence
 * Used by the Logger to queue log writes without blocking the main thread
 */

export class AsyncQueue {
    constructor(options = {}) {
        this.options = {
            concurrency: 1, // Number of concurrent operations
            maxQueueSize: 10000, // Maximum queue size before dropping
            onError: null, // Error handler
            ...options
        };

        this.queue = [];
        this.running = 0;
        this.paused = false;
    }

    /**
     * Add an async function to the queue
     * @param {Function} fn - Async function to execute
     * @returns {Promise} - Resolves when the function completes
     */
    enqueue(fn) {
        return new Promise((resolve, reject) => {
            // Check queue size limit
            if (this.queue.length >= this.options.maxQueueSize) {
                const error = new Error('Queue size limit exceeded');
                if (this.options.onError) {
                    this.options.onError(error);
                }
                return reject(error);
            }

            // Add to queue
            this.queue.push({
                fn,
                resolve,
                reject,
                timestamp: Date.now()
            });

            // Process queue
            this.process();
        });
    }

    /**
     * Process items in the queue
     */
    async process() {
        if (this.paused) {
            return;
        }

        while (this.running < this.options.concurrency && this.queue.length > 0) {
            const item = this.queue.shift();
            this.running++;

            try {
                const result = await item.fn();
                item.resolve(result);
            } catch (error) {
                if (this.options.onError) {
                    this.options.onError(error);
                }
                item.reject(error);
            } finally {
                this.running--;

                // Continue processing
                if (this.queue.length > 0) {
                    this.process();
                }
            }
        }
    }

    /**
     * Pause queue processing
     */
    pause() {
        this.paused = true;
    }

    /**
     * Resume queue processing
     */
    resume() {
        this.paused = false;
        this.process();
    }

    /**
     * Clear the queue
     */
    clear() {
        const dropped = this.queue.length;
        this.queue = [];
        return dropped;
    }

    /**
     * Get queue statistics
     */
    stats() {
        return {
            queued: this.queue.length,
            running: this.running,
            paused: this.paused
        };
    }

    /**
     * Wait for all queued items to complete
     */
    async flush() {
        // Wait for all running operations
        while (this.running > 0 || this.queue.length > 0) {
            await new Promise(resolve => setTimeout(resolve, 10));
        }
    }

    /**
     * Get queue size
     */
    get size() {
        return this.queue.length;
    }

    /**
     * Check if queue is empty
     */
    get isEmpty() {
        return this.queue.length === 0 && this.running === 0;
    }
}

/**
 * Create a simple queue with concurrency of 1
 */
export default class AsyncQueue extends AsyncQueue {
    constructor(options = {}) {
        super({ concurrency: 1, ...options });
    }
}

/**
 * Create a concurrent queue
 */
export class ConcurrentQueue extends AsyncQueue {
    constructor(concurrency = 5, options = {}) {
        super({ concurrency, ...options });
    }
}

/**
 * Create a priority queue
 */
export class PriorityQueue extends AsyncQueue {
    constructor(options = {}) {
        super(options);
    }

    /**
     * Enqueue with priority
     * @param {Function} fn - Async function to execute
     * @param {number} priority - Priority level (higher = more important)
     */
    enqueuePriority(fn, priority = 0) {
        return new Promise((resolve, reject) => {
            if (this.queue.length >= this.options.maxQueueSize) {
                const error = new Error('Queue size limit exceeded');
                if (this.options.onError) {
                    this.options.onError(error);
                }
                return reject(error);
            }

            const item = {
                fn,
                resolve,
                reject,
                priority,
                timestamp: Date.now()
            };

            // Insert at correct position based on priority
            let inserted = false;
            for (let i = 0; i < this.queue.length; i++) {
                if (this.queue[i].priority < priority) {
                    this.queue.splice(i, 0, item);
                    inserted = true;
                    break;
                }
            }

            if (!inserted) {
                this.queue.push(item);
            }

            this.process();
        });
    }
}

/**
 * Create a rate-limited queue
 */
export class RateLimitedQueue extends AsyncQueue {
    constructor(rateLimit = 10, interval = 1000, options = {}) {
        super(options);
        this.rateLimit = rateLimit;
        this.interval = interval;
        this.tokens = rateLimit;
        this.lastRefill = Date.now();

        // Start token refill timer
        this.refillTimer = setInterval(() => {
            this.tokens = this.rateLimit;
            this.lastRefill = Date.now();
            this.process();
        }, this.interval);
    }

    async process() {
        if (this.paused || this.tokens <= 0) {
            return;
        }

        while (this.running < this.options.concurrency &&
        this.queue.length > 0 &&
        this.tokens > 0) {
            const item = this.queue.shift();
            this.running++;
            this.tokens--;

            try {
                const result = await item.fn();
                item.resolve(result);
            } catch (error) {
                if (this.options.onError) {
                    this.options.onError(error);
                }
                item.reject(error);
            } finally {
                this.running--;

                if (this.queue.length > 0 && this.tokens > 0) {
                    this.process();
                }
            }
        }
    }

    destroy() {
        clearInterval(this.refillTimer);
    }
}
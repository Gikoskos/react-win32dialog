/**
 * @module timer
 */
'use strict';

/**
 * Represents a simple Timer that calls a callback when
 * it times out.
 * @package
 */
export default class Timer {
    constructor(timeout, callback) {
        this.timeout = timeout;
        this.callback = callback;
        this.id = null;
    }

    /**
     * @package
     */
    start(args) {
        if (this.id === null) {
            this.id = setTimeout(this._stub, this.timeout, args);
        }
    }

    /**
     * @package
     */
    cancel() {
        if (this.id !== null) {
            clearTimeout(this.id);
            this.id = null;
        }
    }

    /**
     * @private
     */
    _stub = (args) => {
        this.id = null;
        this.callback(args);
    }
}

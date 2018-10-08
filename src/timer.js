/**
 * @module timer
 */
'use strict';

export default class Timer {
    constructor(timeout, callback) {
        this.timeout = timeout;
        this.callback = callback;
        this.id = null;
    }
    
    start = (args) => {
        if (this.id === null) {
            this.id = setTimeout(this._stub, this.timeout, args);
        }
    }
    
    cancel = () => {
        if (this.id !== null) {
            clearTimeout(this.id);
            this.id = null;
        }
    }
    
    _stub = (args) => {
        this.id = null;
        this.callback(args);
    }
}

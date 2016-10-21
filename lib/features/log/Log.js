'use strict';

function Log(config) {
    this._config = config.logging || {};
}

module.exports = Log;

Log.$inject = ['config'];

Log.prototype.create = function (name) {
    var self = this;
    function wrap(log) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            log.apply(self, [name+':'].concat(args));
        };
    }
    return {
        trace: wrap(this.trace),
        info: wrap(this.info),
        log: wrap(this.log),
        warn: wrap(this.warn),
        error: wrap(this.error)
    };
};

Log.prototype.trace = function () {
    this._write('trace', arguments);
};

Log.prototype.info = function () {
    this._write('info', arguments);
};

Log.prototype.log = function () {
    this._write('log', arguments);
};

Log.prototype.warn = function () {
    this._write('warn', arguments);
};

Log.prototype.error = function () {
    this._write('error', arguments);
};

Log.prototype._write = function (logName, args) {
    if (this._config[logName] === false) {
        return;
    }

    console[logName].apply(console, [new Date().toISOString(), logName+':'].concat(Array.prototype.slice.call(args)));
};
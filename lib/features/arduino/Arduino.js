var SerialPort = require('serialport');

function Arduino(eventBus) {
    this._eventBus = eventBus;

    this._eventBus.on('destroy', function () {
        this._destroyed = true;
        this._port.close();
        clearInterval(this._pingInterval);
        clearTimeout(this._reconnectTimeout);
    }.bind(this));

    this._port = new SerialPort('COM10', {
        parser: SerialPort.parsers.readline('\n')
    });

    this._port.on('open', function () {
        this._pingInterval = setInterval(function () {
            if (this._port.isOpen()) {
                this._fire('ping', {});
                this.writeLine('ping');
                this._pongTimeout = setTimeout(function () {
                    this._fire('error', { error: { message: 'Timeout waiting for pong.' }});
                }.bind(this), 2500);
            }
        }.bind(this), 5000);
    }.bind(this));

    this._port.on('error', function (error) {
        this._fire('error', { error: error });

        if (!this._port.isOpen()) {
            this._reconnect();
        }
    }.bind(this));

    this._port.on('disconnect', function (error) {
        this._fire('disconnect', { error: error });
        clearInterval(this._pingInterval);
        this._reconnect();
    }.bind(this));

    this._port.on('data', function (data) {
        this._fire('read', { data: data });

        if (data.trim() === 'pong') {
            this._fire('pong', {});
            clearTimeout(this._pongTimeout);
        }
        else if (data.trim() === 'ready') {
            this._fire('ready', {});
        }
        else {
            var parts = data.split(' ', 2);
            var command = parts[0].trim();
            var argument = parts[1] || '';
            if (command) {
                this._fire('command', { command: command, argument: argument});
            }
        }
    }.bind(this));
}

module.exports = Arduino;

Arduino.$inject = ['eventBus'];

Arduino.prototype.writeLine = function (data) {
    if (!this._port.isOpen()) {
        return;
    }

    this._port.write(data + '\n', function (error) {
        if (!error) {
            this._fire('written', { data: data });
        }
    }.bind(this));
};

Arduino.prototype._fire = function (name, data) {
    this._eventBus.fire('arduino.'+name, data);
};

Arduino.prototype._reconnect = function () {
    if (this._destroyed) {
        return;
    }

    clearTimeout(this._reconnectTimeout);

    this._reconnectTimeout = setTimeout(function () {
        this._port.open();
    }.bind(this), 500);
};
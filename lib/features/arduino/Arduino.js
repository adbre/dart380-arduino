var SerialPort = require('serialport');

function Arduino(eventBus, config, log) {
    this._eventBus = eventBus;
    this._config = config;
    this._log = log.create('Arduino');

    var self = this;

    self._eventBus.on('destroy', function () {
        self._destroyed = true;
        self._port.close();
        clearInterval(self._pingInterval);
        clearTimeout(self._reconnectTimeout);
    });

    self._port = new SerialPort(config.arduino.serialPort, {
        parser: SerialPort.parsers.readline('\n')
    });

    self._port.on('open', function () {
        self._log.info('Connected', config.arduino.serialPort);
        self._pingInterval = setInterval(function () {
            if (self._port.isOpen()) {
                self._fire('ping', {});
                self.writeLine('ping');
                self._pongTimeout = setTimeout(function () {
                    self._log.error('Timeout waiting for pong.');
                    self._fire('error', { error: { message: 'Timeout waiting for pong.' }});
                    self._reconnect();
                }, config.arduino.pongTimeout);
            }
        }, config.arduino.pingInterval);
    });

    self._port.on('error', function (error) {
        self._fire('error', { error: error });
        self._log.error(error);

        if (!self._port.isOpen()) {
            self._reconnect();
        }
    });

    self._port.on('disconnect', function () {
        self._fire('disconnect', {});
        self._log.error('Disconnected');
        clearInterval(self._pingInterval);
        self._reconnect();
    });

    self._port.on('data', function (data) {
        self._fire('read', { data: data });

        if (data.trim() === 'pong') {
            self._fire('pong', {});
            clearTimeout(self._pongTimeout);
        }
        else if (data.trim() === 'ready') {
            self._fire('ready', {});
        }
        else {
            var parts = data.split(' ', 2);
            var command = parts[0].trim();
            var argument = parts[1] || '';
            if (command) {
                self._fire('command', { command: command, argument: argument});
            }
        }
    });
}

module.exports = Arduino;

Arduino.$inject = ['eventBus','config','log'];

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
    }.bind(this), this._config.arduino.reconnectInterval || 1000);
};
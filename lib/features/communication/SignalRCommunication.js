'use strict';

var _ = require('lodash');

var jsdom = require('jsdom');
var window = jsdom.jsdom().defaultView;

function SignalRCommunication(communication, config, log) {
    this._communication = communication;
    this._log = log.create('SignalRCommunication');

    this._config = config.signalr;

    if (!this._config.hubs) {
        this._config.hubs = this._config.url + '/hubs';
    }

    this._init();

    communication.registerProvider(this);
}

module.exports = SignalRCommunication;

SignalRCommunication.$inject = ['communication', 'config', 'log'];

SignalRCommunication.prototype.send = function (message, context) {
    if (!this._isHubReady) {
        return Promise.reject(this._communication.Error.busy);
    }

    return new Promise(function (resolve, reject) {
        this._log.info('Sending: ', '\n' + message.toString());
        this._hub.server.sendMessage(context, JSON.stringify(message.toArray()))
            .done(function () {
                resolve();
            }).fail(function (reason) {
                reject(reason);
            });
    }.bind(this));
};

SignalRCommunication.prototype.beginReceive = function (context) {
    if (!this._isHubReady) {
        return;
    }

    if (this._currentContext) {
        this._hub.server.leaveRoom(this._currentContext);
    }

    if (context) {
        this._hub.server.joinRoom(context);
    }

    this._currentContext = context;
};

SignalRCommunication.prototype._init = function () {
    var self = this;
    // Load jQuery, SignalR, the hub and then connect
    jsdom.jQueryify(window, 'http://code.jquery.com/jquery-2.2.2.min.js', function() {
        loadScript('http://ajax.aspnetcdn.com/ajax/signalr/jquery.signalr-2.2.0.min.js')
            .then(function () {
                return loadScript(self._config.hubs);
            })
            .then(function () {
                self._connect();
            })
            .catch(function (error) {
                self._log.error('Could not initialize jQuery, SignalR and/or the hub', error);
            });
    });
};

SignalRCommunication.prototype._connect = function () {
    var self = this;
    var connection = self._connection = window.$.connection;
	var hub = self._hub = connection.messageHub;

	function start() {
		connection
			.hub
			.start({ transport: 'auto', waitForPageLoad: false })
			.done(function () {
				// Send a message to the server
				// It depends on the hub how the methods are named
                self._isHubReady = true;
                self.beginReceive(this._currentContext);
				self._log.info('Connected! ConnectionId:', connection.hub.id);
			})
            .fail(function (err) {
                self._log.error('Could not connect', err);
            });
	}

	connection.hub.url = self._config.url; // Enable CORS
	connection.hub.logging = self._config.logging;

	// Hub publish callback
	// It depends on the hub how the methods are named
	hub.client.broadcastMessage = function (message) {
		self._log.info('Received: ', '\n' + message.toString());
        try {
            self._communication.receive(JSON.parse(message));
        }
        catch (e) {
            self._log.error('Error when receiving message: ', e);
        }
	};

	// Disconnected callback
	connection
		.hub
		.disconnected(function () {
			self._log.info('Disconnected...');
            self._isHubReady = false;

             // Restart connection after 10 seconds.
			setTimeout(function() {
                start();
            }, self._config.reconnectInterval);
		});

	// Start the connection
	start();
};

function loadScript(src) {
	return new Promise(function (resolve, reject) {
		var script = window.document.createElement('script');

		script.src = src;

		window.document.body.appendChild(script);

		script.onload = function (e) { resolve(e); };
		script.onerror = function (err) { reject(err); };
	});
}

'use strict';

var jsdom = require('jsdom');
var window = jsdom.jsdom().defaultView;

var SIGNALR_URL = 'http://dart380.42a-consulting.se/signalr'; // Used for CORS
var SIGNALR_HUBS = 'http://dart380.42a-consulting.se/signalr/hubs';
var HUB_NAME = 'messageHub';

function SignalRCommunication(communication) {
    this._communication = communication;

    this._init();

    communication.registerProvider(this);
}

module.exports = SignalRCommunication;

SignalRCommunication.$inject = ['communication'];

SignalRCommunication.prototype.send = function (message, context) {
    if (!this._isHubReady) {
        return Promise.reject(this._communication.Error.busy);
    }

    return new Promise(function (resolve, reject) {
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
                return loadScript(SIGNALR_HUBS);
            })
            .then(function () {
                self._connect();
            })
            .catch(function (error) {
                console.log('error', error);
            });
    });
};

SignalRCommunication.prototype._connect = function () {
    var self = this;
    var connection = self._connection = window.$.connection;
	var hub = self._hub = connection[HUB_NAME];

	function start() {
		connection
			.hub
			.start({ transport: 'auto', waitForPageLoad: false })
			.done(function () {
				// Send a message to the server
				// It depends on the hub how the methods are named
                self._isHubReady = true;
                self.beginReceive(this._currentContext);
				console.log('connection started!', connection.hub.id);
			})
            .fail(function (err) {
                console.log('Could not connect', err);
            });
	}

	connection.hub.url = SIGNALR_URL; // Enable CORS
	connection.hub.logging = true;

	// Hub publish callback
	// It depends on the hub how the methods are named
	hub.client.broadcastMessage = function (message) {
		console.log('Hub published data: ', message);
        try {
            self._communication.receive(JSON.parse(message));
        }
        catch (e) {
            console.error('ERROR Receiving: ', e);
        }
	};

	// Disconnected callback
	connection
		.hub
		.disconnected(function () {
			console.log('disconnected...');
            self._isHubReady = false;

			setTimeout(function() { start(); }, 10000); // Restart connection after 10 seconds.
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

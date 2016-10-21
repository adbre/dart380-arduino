module.exports = {
    arduino: {
        /*
            Sets the USB port to connect to the arduino controller on.
            For linux it should be something like /dev/ttyACM0.
            On Windows it should be similar to COM10.
        */
        serialPort: '/dev/ttyACM0',

        /*
            Sets the interval (in milliseconds) at which ping commands will
            be sent.
        */
        pingInterval: 5000,

        /*
            Sets the timeout (in milliseconds) to wait for a pong response
            after a ping command was sent.
            On timeout, the serial port will be closed and a new connection
            attempt made.
        */
        pongTimeout: 2500,

        /*
            Sets the interval (in milliseconds) between reconnection attempts.
        */
        reconnectInterval: 5000,
    },

    signalr: {
        /*
            Sets the URL to use for CORS in signalr.
        */
        url: 'http://dart380.42a-consulting.se/signalr',

        /*
            Sets the URL to the hubs file.
        */
        hubs: 'http://dart380.42a-consulting.se/signalr/hubs',

        /*
            Sets the interval (in milliseconds) between reconnection attempts.
        */
        reconnectInterval: 5000,

        /*
            If true enables SignalR logging.
        */
        logging: true,
    }
};
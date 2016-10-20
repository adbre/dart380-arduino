var Dart380 = require('dart380-js/lib/Dart380');

var dart380 = new Dart380({
    modules: [
        require('./lib/features/arduino'),
        require('./lib/features/keyboard'),
        require('./lib/features/small-display'),
        require('./lib/features/large-display'),
        require('./lib/features/channel'),
        require('./lib/features/mod'),
        require('./lib/features/volume')
    ]
});

var eventBus = dart380.get('eventBus');

eventBus.on('arduino.read', function (e) {
    console.log('Read...: ', e.data);
});

eventBus.on('arduino.written', function (e) {
    console.log('Written: ', e.data);
});

eventBus.on('arduino.ready', function (e) {
    console.log('Ready');
});

eventBus.on('arduino.error', function (e) {
    console.log('Error: ', e.error);
});

eventBus.on('arduino.disconnect', function (e) {
    console.log('Disconnect: ', e.error);
});

eventBus.on('keyboard.keyPress', function (e) {
    console.log('Keyboard event: ', e);
});

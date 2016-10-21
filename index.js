var config;

try {
    config = require('./config.js');
} catch(e) {
    console.error('error: Could not read configuration file.');
    console.warn('hint: Create a copy of config.example.js and save it as config.js');
    console.warn('hint: Make sure the serialPort setting is correct');
    return;
}

var Dart380 = new require('dart380-js/lib/Dart380');

config.modules = [
    require('./lib/features/arduino'),
    require('./lib/features/keyboard'),
    require('./lib/features/small-display'),
    require('./lib/features/large-display'),
    require('./lib/features/channel'),
    require('./lib/features/mod'),
    require('./lib/features/volume'),
    require('./lib/features/communication'),
    require('./lib/features/log'),
];

new Dart380(config);

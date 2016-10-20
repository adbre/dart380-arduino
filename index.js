var Dart380 = require('dart380-js/lib/Dart380');

var dart380 = new Dart380({
    modules: [
        require('./lib/features/arduino'),
        require('./lib/features/keyboard'),
        require('./lib/features/small-display'),
        require('./lib/features/large-display'),
        require('./lib/features/channel'),
        require('./lib/features/mod'),
        require('./lib/features/volume'),
        require('./lib/features/communication'),
    ]
});

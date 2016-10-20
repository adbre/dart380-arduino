function Mod(eventBus, mod) {
    eventBus.on('arduino.command', function (e) {
        var value = parseInt(e.argument) || 0;
        if (e.command == 'mod.set' && value > 0) {
            mod.set(value);
        }
    });
}

module.exports = Mod;

Mod.$inject = ['eventBus', 'mod'];

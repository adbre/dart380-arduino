function Volume(eventBus, volume) {
    eventBus.on('arduino.command', function (e) {
        var value = parseInt(e.argument) || 0;
        if (e.command == 'volume.set' && value > 0) {
            volume.set(value);
        }
    });
}

module.exports = Volume;

Volume.$inject = ['eventBus', 'volume'];

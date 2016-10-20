function Channel(eventBus, channel) {
    eventBus.on('arduino.command', function (e) {
        var value = parseInt(e.argument) || 0;
        if (e.command == 'channel.set' && value > 0) {
            channel.set(value);
        }
    });
}

module.exports = Channel;

Channel.$inject = ['eventBus', 'channel'];

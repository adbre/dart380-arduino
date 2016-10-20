var KEYMAP = require('./KeyMap');

var _ = require('lodash');

function Keyboard(eventBus, keyboard) {

    this._keyboard = keyboard;

    this._keys = _.mapValues(KEYMAP, function (values, key) {
        return {
            state: 'idle',
            isPressed: false,
            values: values,
        };
    });

    eventBus.on('arduino.command', function (e) {
        if (e.command.indexOf('keyboard.') === 0) {
            var event = e.command.substring('keyboard.'.length);
            var key = this._keys[e.argument.trim() || ' '];
            if (event && key) {
                key.state = event;
                if (event === 'pressed') {
                    key.isPressed = true;
                }
                else if (event === 'released') {
                    key.isPressed = false;
                }

                this._onKeyEvent(event, key);
            }
        }
    }.bind(this));
}

module.exports = Keyboard;

Keyboard.$inject = ['eventBus', 'keyboard'];

Keyboard.prototype._onKeyEvent = function (event, key) {
    if (event != 'pressed') {
        return;
    }

    var value = key.values[0];
    if (this._keys['#'].isPressed && this._keys['*'].isPressed) {
        value = 'RESET';
    }
    else if (key.values.length > 1 && this._keys['SHIFT'].isPressed) {
        value = key.values[1];
    }

    this._keyboard.trigger(value);
};

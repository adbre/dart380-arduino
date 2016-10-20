
function DisplayBase(display, arduino, eventBus) {
    this._display = display;
    this._arduino = arduino;
    this._eventBus = eventBus;

    eventBus.on([display.name+'.changed', 'arduino.ready'], this._onDisplayChanged.bind(this));
}

module.exports = DisplayBase;

DisplayBase.prototype._onDisplayChanged = function () {
    this._send('setText', this._encode(this._display.toString()));
    this._send('setCursor', this._display.getCursor());
    this._send('setBlinking', this._display.getBlinking());
};

DisplayBase.prototype._send = function (command, argument) {
    this._arduino.writeLine(this._display.name+'.'+command + ' ' + argument);
};

DisplayBase.prototype._encode = function (text) {
    var s = "";
    for (var i=0; i < text.length; i++) {
        var ch = text[i];
        if (ch === 'Å') {
            s += String.fromCharCode(197);
        }
        else if (ch === 'Ä') {
            s += String.fromCharCode(196);
        }
        else if (ch === 'Ö') {
            s += String.fromCharCode(214);
        }
        else {
            s += ch;
        }
    }

    return s;
};
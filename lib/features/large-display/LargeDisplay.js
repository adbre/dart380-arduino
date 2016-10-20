var inherits = require('inherits');

var DisplayBase = require('./../../util/DisplayBase');

function LargeDisplay(largeDisplay, arduino, eventBus) {
    DisplayBase.call(this, largeDisplay, arduino, eventBus);
}

inherits(LargeDisplay, DisplayBase);

module.exports = LargeDisplay;

LargeDisplay.$inject = ['largeDisplay', 'arduino','eventBus'];

var inherits = require('inherits');

var DisplayBase = require('./../../util/DisplayBase');

function SmallDisplay(smallDisplay, arduino, eventBus) {
    DisplayBase.call(this, smallDisplay, arduino, eventBus);
}

inherits(SmallDisplay, DisplayBase);

module.exports = SmallDisplay;

SmallDisplay.$inject = ['smallDisplay', 'arduino','eventBus'];

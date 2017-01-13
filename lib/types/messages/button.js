"use strict";
var ButtonMessage = (function () {
    function ButtonMessage(outgoing) {
        this._text = '';
        this._buttons = [];
        this._outgoing = outgoing;
        return this;
    }
    Object.defineProperty(ButtonMessage.prototype, "type", {
        get: function () {
            return 'button';
        },
        set: function (newType) { },
        enumerable: true,
        configurable: true
    });
    ButtonMessage.prototype.text = function (newText) {
        if (typeof newText === 'undefined') {
            return this._text;
        }
        this._text = newText;
        return this;
    };
    ButtonMessage.prototype.addButton = function (newButton) {
        this._buttons.push(newButton);
        return this;
    };
    ButtonMessage.prototype.send = function () {
        return this._outgoing.sendButtons(this);
    };
    return ButtonMessage;
}());
exports.ButtonMessage = ButtonMessage;

"use strict";
var message_1 = require("../message");
var ButtonMessage = (function () {
    function ButtonMessage(outgoing) {
        this._text = '';
        this._buttons = [];
        this._outgoing = outgoing;
        return this;
    }
    Object.defineProperty(ButtonMessage.prototype, "type", {
        get: function () {
            return message_1.MessageTypes.button;
        },
        set: function (newType) {
            return;
        },
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
    Object.defineProperty(ButtonMessage.prototype, "buttons", {
        get: function () {
            return this._buttons;
        },
        enumerable: true,
        configurable: true
    });
    ButtonMessage.prototype.addButton = function () {
        switch (arguments.length) {
            case 1:
                this._buttons.push(arguments[0]);
                break;
            case 3:
                switch (arguments[0]) {
                    case 'postback': {
                        var button = {
                            type: 'postback',
                            text: arguments[1],
                            payload: arguments[2],
                        };
                        this._buttons.push(button);
                        break;
                    }
                    case 'url': {
                        var button = {
                            type: 'url',
                            text: arguments[1],
                            url: arguments[2],
                        };
                        this._buttons.push(button);
                        break;
                    }
                    default:
                        throw new Error('bad type of button');
                }
                break;
            default:
                throw new Error('bad number of arguments');
        }
        return this;
    };
    ButtonMessage.prototype.send = function () {
        return this._outgoing.sendButtons(this);
    };
    return ButtonMessage;
}());
exports.ButtonMessage = ButtonMessage;

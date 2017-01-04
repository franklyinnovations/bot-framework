"use strict";
class ButtonMessage {
    constructor(outgoing) {
        this._text = '';
        this._buttons = [];
        this._outgoing = outgoing;
        return this;
    }
    set type(newType) { }
    get type() {
        return 'button';
    }
    text(newText) {
        if (typeof newText === 'undefined') {
            return this._text;
        }
        this._text = newText;
        return this;
    }
    addButton(newButton) {
        this._buttons.push(newButton);
        return this;
    }
    send() {
        return this._outgoing.sendButtons(this);
    }
}
exports.ButtonMessage = ButtonMessage;

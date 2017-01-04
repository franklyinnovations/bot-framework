"use strict";
const Message = require("./types/message");
class Outgoing {
    constructor(user) {
        this.promise = Promise.resolve(null);
        this.user = user;
        return this;
    }
    sendText(text) {
        const textMessage = {
            type: 'text',
            text: text,
        };
        this.promise = this.promise.then(() => this.user._platform.send(this.user, textMessage));
        return this;
    }
    createButtons() {
        return new Message.ButtonMessage(this);
    }
    sendButtons(message) {
        this.promise = this.promise.then(() => this.user._platform.send(this.user, message));
        return this;
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Outgoing;

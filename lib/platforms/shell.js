"use strict";
class BasePlatform {
    constructor() {
    }
    start() {
        return Promise.resolve(this);
    }
}
exports.BasePlatform = BasePlatform;
class BaseSession {
    constructor(user_id) {
        this.user_id = user_id;
    }
    sendText(text) {
        console.log('sending ');
        return;
    }
    sendImage(url) {
        return;
    }
    createButtons(url) {
    }
}

"use strict";
const Bot = require('../types/bot');
const readline = require('readline');
class Console {
    constructor(botler) {
        this.bot = botler;
    }
    start() {
        //usually start listening on a port here
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        this.rl.on('line', (input) => {
            const user = this.bot.createEmptyUser();
            user.id = 'console';
            user.platform = 'console';
            this.bot.processText(user, input);
        });
        return Promise.resolve(this);
    }
    stop() {
        this.rl.close();
        //usually stop listening here
        return Promise.resolve(this);
    }
    send(message) {
        if (message instanceof Bot.t)
            return Promise.resolve(this);
    }
}
exports.Console = Console;
class BaseSession {
    constructor(user_id) {
        this.user_id = user_id;
    }
    set user(text) {
    }
    get user() {
        return 'hi';
    }
    get intent() {
    }
    sendText(text) {
        console.log('sending ');
        return Promise.resolve(this);
    }
    sendImage(url) {
        return Promise.resolve(this);
    }
    createButtons(url) {
        return new ButtonMessage(this.user_id);
    }
    createCarousel() {
    }
}
class Message {
    constructor(user_id) {
        this.user_id = user_id;
    }
    send() {
        throw new Error('base class');
    }
}
class ButtonMessage extends Message {
}

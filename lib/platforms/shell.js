"use strict";
const readline = require("readline");
class Console {
    constructor(botler) {
        this.bot = botler;
    }
    start() {
        // usually start listening on a port here
        // reset user
        this.theUser = this.bot.createEmptyUser({
            id: 0,
            platform: 'console',
            _platform: this,
        });
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        this.bot.processGreeting(this.theUser);
        this.rl.on('line', (input) => {
            console.log(`user said "${input}"`);
            const message = {
                type: 'text',
                text: input,
            };
            this.bot.processMessage(this.theUser, message);
        });
        return Promise.resolve(this);
    }
    stop() {
        this.rl.close();
        //usually stop listening here
        return Promise.resolve(this);
    }
    send(message) {
        switch (message.type) {
            case 'text':
                const textMessage = message;
                const text = textMessage.text;
                console.log(`-> ${text}`);
                break;
        }
        return Promise.resolve(this);
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Console;

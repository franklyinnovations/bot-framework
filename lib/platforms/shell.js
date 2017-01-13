"use strict";
var readline = require("readline");
var Promise = require("bluebird");
var Console = (function () {
    function Console(bot) {
        this.bot = bot;
    }
    Console.prototype.start = function () {
        var _this = this;
        // usually start listening on a port here
        // reset user
        this.theUser = this.bot.createEmptyUser({
            id: 0,
            platform: 'console',
            _platform: this,
        });
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        this.bot.processGreeting(this.theUser);
        this.rl.on('line', function (input) {
            console.log("<- \"" + input + "\"");
            var message = {
                type: 'text',
                text: input,
            };
            _this.bot.processMessage(_this.theUser, message);
        });
        return Promise.resolve(this);
    };
    Console.prototype.stop = function () {
        this.rl.close();
        this.rl = null;
        // usually stop listening here
        return Promise.resolve(this);
    };
    Console.prototype.send = function (user, message) {
        switch (message.type) {
            case 'text':
                var textMessage = message;
                var text = textMessage.text;
                console.log("-> " + text);
                break;
            default:
                break;
        }
        return Promise.resolve(this);
    };
    return Console;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Console;

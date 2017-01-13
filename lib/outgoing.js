"use strict";
var Message = require("./types/message");
var Promise = require("bluebird");
var _ = require("lodash");
var Outgoing = (function () {
    function Outgoing(bot, user) {
        this.promise = Promise.resolve(null);
        this.bot = bot;
        this.user = user;
        return this;
    }
    Outgoing.prototype.startScript = function (name, scriptArguments) {
        if (name === void 0) { name = ''; }
        if (scriptArguments === void 0) { scriptArguments = {}; }
        this.user.script = name;
        this.user.scriptStage = 0;
        this.bot.processMessage(this.user, _.last(this.user.conversation));
    };
    Outgoing.prototype.startTyping = function () {
        throw new Error('not implemented');
    };
    Outgoing.prototype.endTyping = function () {
        throw new Error('not implemented');
    };
    Outgoing.prototype.sendText = function (text) {
        var _this = this;
        var textMessage = {
            type: 'text',
            text: text,
        };
        this.promise = this.promise.then(function () { return _this.user._platform.send(_this.user, textMessage); });
        return this;
    };
    Outgoing.prototype.createButtons = function () {
        return new Message.ButtonMessage(this);
    };
    Outgoing.prototype.sendButtons = function (message) {
        var _this = this;
        this.promise = this.promise.then(function () { return _this.user._platform.send(_this.user, message); });
        return this;
    };
    return Outgoing;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Outgoing;

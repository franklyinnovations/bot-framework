"use strict";
var Promise = require("bluebird");
var _ = require("lodash");
var util = require("util");
var Memory = (function () {
    function Memory(bot) {
        this.users = {};
        this.bot = bot;
    }
    Memory.prototype.getUser = function (user) {
        var normalizedUserId = "" + user.platform + user.id.toString();
        if (!_.has(this.users, [user.platform, normalizedUserId])) {
            return Promise.resolve(_.merge(this.bot.createEmptyUser(), user));
        }
        return Promise.resolve(this.users[user.platform][normalizedUserId]);
    };
    Memory.prototype.saveUser = function (user) {
        _.set(this.users, [user.platform, "" + user.platform + user.id.toString()], user);
        console.log(util.inspect(this.users));
        return Promise.resolve(user);
    };
    return Memory;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Memory;

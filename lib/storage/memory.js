"use strict";
var Promise = require("bluebird");
var _ = require("lodash");
var Memory = (function () {
    function Memory(bot) {
        this.users = {};
        this.bot = bot;
    }
    Memory.prototype.getUser = function (user) {
        if (!_.has(this.users, [user.platform, user.id])) {
            return Promise.resolve(_.merge(this.bot.createEmptyUser(), user));
        }
        return Promise.resolve(this.users[user.platform][user.id]);
    };
    Memory.prototype.saveUser = function (user) {
        _.set(this.users, [user.platform, user.id], user);
        return Promise.resolve(user);
    };
    return Memory;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Memory;
